"""
Временный служебный экспорт базы: собирает структуру и все данные проекта
в один SQL-файл и кладёт его в хранилище. Нужен только для переноса на свой сервер.
"""
import json
import os
import re
import secrets
import boto3
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}


def resp(code, body):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """Выгружает структуру и данные базы в один SQL-файл в хранилище. Доступ по админ-токену."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    token = params.get('token', '')
    if not token or token != os.environ.get('ADMIN_TOKEN', ''):
        return resp(403, {'error': 'forbidden'})

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={schema}")
    cur = conn.cursor()

    def clean(text):
        if not text:
            return text
        return text.replace(f'{schema}.', '').replace(f'"{schema}".', '')

    cur.execute("""
        SELECT c.relname, a.attname, format_type(a.atttypid, a.atttypmod),
               a.attnotnull, pg_get_expr(d.adbin, d.adrelid)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
        LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
        WHERE n.nspname = %s AND c.relkind = 'r'
        ORDER BY c.relname, a.attnum
    """, (schema,))
    cols = {}
    for tbl, name, typ, notnull, default in cur.fetchall():
        cols.setdefault(tbl, []).append((name, typ, notnull, clean(default)))

    cur.execute("""
        SELECT c.relname, con.conname, con.contype, pg_get_constraintdef(con.oid)
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = %s
        ORDER BY CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 4 END
    """, (schema,))
    constraints = cur.fetchall()
    con_names = {row[1] for row in constraints}

    cur.execute("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = %s", (schema,))
    indexes = [r for r in cur.fetchall() if r[1] not in con_names]

    parts = [
        '-- Полная выгрузка базы проекта',
        'SET client_encoding = \'UTF8\';',
        'SET standard_conforming_strings = on;',
        '',
    ]

    tables = sorted(cols.keys())
    for tbl in tables:
        lines = []
        for name, typ, notnull, default in cols[tbl]:
            piece = f'  "{name}" {typ}'
            if default:
                piece += f' DEFAULT {default}'
            if notnull:
                piece += ' NOT NULL'
            lines.append(piece)
        parts.append(f'DROP TABLE IF EXISTS "{tbl}" CASCADE;')
        parts.append(f'CREATE TABLE "{tbl}" (\n' + ',\n'.join(lines) + '\n);')
        parts.append('')

    total_rows = 0
    for tbl in tables:
        colnames = [c[0] for c in cols[tbl]]
        quoted = ', '.join(f'"{c}"' for c in colnames)
        cur.execute(f'SELECT {quoted} FROM "{tbl}"')
        rows = cur.fetchall()
        if not rows:
            continue
        total_rows += len(rows)
        tpl = '(' + ', '.join(['%s'] * len(colnames)) + ')'
        chunk = []
        for row in rows:
            chunk.append(cur.mogrify(tpl, row).decode('utf-8'))
        parts.append(f'INSERT INTO "{tbl}" ({quoted}) VALUES\n' + ',\n'.join(chunk) + ';')
        parts.append('')

    for tbl, conname, contype, condef in constraints:
        parts.append(f'ALTER TABLE "{tbl}" ADD CONSTRAINT "{conname}" {clean(condef)};')
    parts.append('')

    for tbl, idxname, idxdef in indexes:
        parts.append(clean(idxdef).replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS')
                     .replace('CREATE UNIQUE INDEX', 'CREATE UNIQUE INDEX IF NOT EXISTS') + ';')
    parts.append('')

    cur.execute("SELECT sequencename, last_value FROM pg_sequences WHERE schemaname = %s", (schema,))
    for seqname, last_value in cur.fetchall():
        if last_value is not None:
            parts.append(f"SELECT setval('\"{seqname}\"', {last_value}, true);")

    cur.close()
    conn.close()

    dump = '\n'.join(parts)
    data = dump.encode('utf-8')

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    key = f'export/database-{secrets.token_hex(8)}.sql'
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType='text/plain; charset=utf-8')
    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return resp(200, {
        'url': url,
        'tables': len(tables),
        'rows': total_rows,
        'size_kb': round(len(data) / 1024, 1),
    })