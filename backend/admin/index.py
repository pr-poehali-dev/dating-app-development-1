"""
Админ-панель: статистика, пользователи, верификация, жалобы.
Все действия требуют заголовка X-Admin-Token.
Роутинг через ?action=...
"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Authorization',
}

ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')

def get_conn():
    return psycopg2.connect(
        os.environ['DATABASE_URL'],
        options=f"-c search_path={os.environ.get('MAIN_DB_SCHEMA', 'public')}"
    )

def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False, default=str)}

def check_auth(event: dict) -> bool:
    headers = event.get('headers') or {}
    token = (
        headers.get('X-Admin-Token') or
        headers.get('x-admin-token') or
        (event.get('queryStringParameters') or {}).get('token', '')
    )
    return token == ADMIN_TOKEN and bool(ADMIN_TOKEN)

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if not check_auth(event):
        return resp(401, {'error': 'Нет доступа'})

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    try:
        cur = conn.cursor()

        # ── Статистика ────────────────────────────────────────────────────────
        if action == 'stats':
            cur.execute("SELECT COUNT(*) FROM users")
            total_users = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE online = TRUE")
            online_users = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours'")
            new_today = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'")
            new_week = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM likes")
            total_likes = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM matches")
            total_matches = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM messages")
            total_messages = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()")
            active_sessions = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE verified = TRUE")
            verified_users = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM reports WHERE status = 'pending'")
            pending_reports = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'")
            pending_verif = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE premium = TRUE")
            premium_users = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM user_gifts")
            total_gifts = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM support_tickets WHERE status = 'open'")
            open_tickets = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days'")
            new_month = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours'")
            messages_today = cur.fetchone()[0]
            return resp(200, {
                'total_users': total_users,
                'online_users': online_users,
                'new_today': new_today,
                'new_week': new_week,
                'new_month': new_month,
                'total_likes': total_likes,
                'total_matches': total_matches,
                'total_messages': total_messages,
                'messages_today': messages_today,
                'active_sessions': active_sessions,
                'verified_users': verified_users,
                'premium_users': premium_users,
                'total_gifts': total_gifts,
                'open_tickets': open_tickets,
                'pending_reports': pending_reports,
                'pending_verif': pending_verif,
            })

        # ── Пользователи ──────────────────────────────────────────────────────
        if action == 'users':
            search = params.get('search', '').strip()
            page = int(params.get('page', 1))
            per_page = 20
            offset = (page - 1) * per_page
            q = f"%{search}%" if search else None
            if q:
                cur.execute(
                    "SELECT u.id, u.name, u.email, u.username, u.age, u.city, u.verified, u.online, u.premium, u.created_at, "
                    "EXISTS(SELECT 1 FROM banned_users b WHERE b.user_id = u.id) as banned "
                    "FROM users u WHERE u.name ILIKE %s OR u.email ILIKE %s OR u.username ILIKE %s "
                    "ORDER BY u.created_at DESC LIMIT %s OFFSET %s",
                    (q, q, q, per_page, offset)
                )
            else:
                cur.execute(
                    "SELECT u.id, u.name, u.email, u.username, u.age, u.city, u.verified, u.online, u.premium, u.created_at, "
                    "EXISTS(SELECT 1 FROM banned_users b WHERE b.user_id = u.id) as banned "
                    "FROM users u ORDER BY u.created_at DESC LIMIT %s OFFSET %s",
                    (per_page, offset)
                )
            cols = ['id', 'name', 'email', 'username', 'age', 'city', 'verified', 'online', 'premium', 'created_at', 'banned']
            users = [dict(zip(cols, row)) for row in cur.fetchall()]
            cur.execute("SELECT COUNT(*) FROM users" + (" WHERE name ILIKE %s OR email ILIKE %s OR username ILIKE %s" if q else ""),
                        (q, q, q) if q else ())
            total = cur.fetchone()[0]
            return resp(200, {'users': users, 'total': total, 'page': page, 'per_page': per_page})

        # ── Забанить пользователя ─────────────────────────────────────────────
        if action == 'ban_user':
            user_id = body.get('user_id')
            reason = body.get('reason', '')
            if not user_id:
                return resp(400, {'error': 'user_id обязателен'})
            cur.execute(
                "INSERT INTO banned_users (user_id, reason) VALUES (%s, %s) "
                "ON CONFLICT (user_id) DO UPDATE SET reason = EXCLUDED.reason",
                (user_id, reason)
            )
            cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Разбанить пользователя ────────────────────────────────────────────
        if action == 'unban_user':
            user_id = body.get('user_id')
            if not user_id:
                return resp(400, {'error': 'user_id обязателен'})
            cur.execute("DELETE FROM banned_users WHERE user_id = %s", (user_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Список жалоб ──────────────────────────────────────────────────────
        if action == 'reports':
            status = params.get('status', 'pending')
            cur.execute(
                "SELECT r.id, r.reason, r.comment, r.status, r.created_at, "
                "u1.name as reporter_name, u1.email as reporter_email, "
                "u2.name as reported_name, u2.email as reported_email, u2.id as reported_id "
                "FROM reports r "
                "JOIN users u1 ON u1.id = r.reporter_id "
                "JOIN users u2 ON u2.id = r.reported_id "
                "WHERE r.status = %s ORDER BY r.created_at DESC LIMIT 50",
                (status,)
            )
            cols = ['id', 'reason', 'comment', 'status', 'created_at',
                    'reporter_name', 'reporter_email', 'reported_name', 'reported_email', 'reported_id']
            reports = [dict(zip(cols, row)) for row in cur.fetchall()]
            return resp(200, {'reports': reports})

        # ── Обработать жалобу ─────────────────────────────────────────────────
        if action == 'resolve_report':
            report_id = body.get('report_id')
            new_status = body.get('status', 'resolved')
            ban_user = body.get('ban_user', False)
            if not report_id:
                return resp(400, {'error': 'report_id обязателен'})
            cur.execute("UPDATE reports SET status = %s WHERE id = %s", (new_status, report_id))
            if ban_user:
                cur.execute("SELECT reported_id FROM reports WHERE id = %s", (report_id,))
                rep_row = cur.fetchone()
                if rep_row:
                    cur.execute(
                        "INSERT INTO banned_users (user_id, reason) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING",
                        (rep_row[0], 'Нарушение правил сообщества')
                    )
                    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (rep_row[0],))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Верификация: список заявок ────────────────────────────────────────
        if action == 'verif_requests':
            cur.execute(
                "SELECT vr.id, vr.selfie_url, vr.status, vr.reject_reason, vr.created_at, "
                "u.id as user_id, u.name, u.age, u.email, u.photo_url, "
                "EXISTS(SELECT 1 FROM email_codes ec WHERE ec.user_id = u.id AND ec.used = TRUE) as email_verified "
                "FROM verification_requests vr JOIN users u ON u.id = vr.user_id "
                "WHERE vr.status = 'pending' ORDER BY vr.created_at ASC LIMIT 50"
            )
            cols = ['id', 'selfie_url', 'status', 'reject_reason', 'created_at',
                    'user_id', 'name', 'age', 'email', 'photo_url', 'email_verified']
            requests = [dict(zip(cols, row)) for row in cur.fetchall()]
            return resp(200, {'requests': requests})

        # ── Одобрить верификацию ──────────────────────────────────────────────
        if action == 'verif_approve':
            req_id = body.get('id')
            if not req_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("SELECT user_id FROM verification_requests WHERE id = %s", (req_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Заявка не найдена'})
            user_id = row[0]
            cur.execute("UPDATE verification_requests SET status = 'approved', reviewed_at = NOW() WHERE id = %s", (req_id,))
            cur.execute("UPDATE users SET verified = TRUE WHERE id = %s", (user_id,))
            # Уведомление в колокольчик
            cur.execute(
                "INSERT INTO notifications (user_id, type, from_user_id, read) VALUES (%s, 'verif_approved', NULL, FALSE)",
                (user_id,)
            )
            # Системное сообщение в первый матч пользователя (или просто уведомление)
            cur.execute("SELECT id FROM matches WHERE user1_id=%s OR user2_id=%s LIMIT 1", (user_id, user_id))
            match_row = cur.fetchone()
            if match_row:
                system_text = "✅ Поздравляем! Ваш профиль прошёл верификацию. Теперь на вашем профиле отображается значок ✓, который подтверждает, что вы реальный человек. Это повышает доверие других пользователей!"
                cur.execute(
                    "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s)",
                    (match_row[0], user_id, system_text)
                )
            conn.commit()
            return resp(200, {'ok': True})

        # ── Отклонить верификацию ─────────────────────────────────────────────
        if action == 'verif_reject':
            req_id = body.get('id')
            reason = body.get('reason', '')
            if not req_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("SELECT user_id FROM verification_requests WHERE id = %s", (req_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Заявка не найдена'})
            user_id = row[0]
            cur.execute(
                "UPDATE verification_requests SET status = 'rejected', reject_reason = %s, reviewed_at = NOW() WHERE id = %s",
                (reason or None, req_id)
            )
            # Уведомление в колокольчик
            cur.execute(
                "INSERT INTO notifications (user_id, type, from_user_id, read) VALUES (%s, 'verif_rejected', NULL, FALSE)",
                (user_id,)
            )
            # Системное сообщение
            cur.execute("SELECT id FROM matches WHERE user1_id=%s OR user2_id=%s LIMIT 1", (user_id, user_id))
            match_row = cur.fetchone()
            if match_row:
                reject_msg = reason or "Фото не соответствует требованиям"
                system_text = f"❌ К сожалению, ваша заявка на верификацию была отклонена.\nПричина: {reject_msg}\n\nВы можете подать заявку повторно — сделайте чёткое селфи при хорошем освещении с поднятым большим пальцем."
                cur.execute(
                    "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s)",
                    (match_row[0], user_id, system_text)
                )
            conn.commit()
            return resp(200, {'ok': True})

        # ── Тикеты поддержки (список) ──
        if action == 'support_tickets':
            status_filter = params.get('status', 'open')
            cur.execute("""
                SELECT t.id, t.user_id, t.message, t.reply, t.status,
                       t.created_at, t.replied_at,
                       u.name, u.photo_url
                FROM support_tickets t
                JOIN users u ON u.id = t.user_id
                WHERE t.status = %s
                ORDER BY t.created_at DESC
                LIMIT 100
            """, (status_filter,))
            rows = cur.fetchall()
            cols = ['id','user_id','message','reply','status','created_at','replied_at','user_name','user_photo']
            tickets = [dict(zip(cols, r)) for r in rows]
            return resp(200, {'tickets': tickets})

        # ── Ответить на тикет ──
        if action == 'support_reply':
            ticket_id = body.get('ticket_id')
            reply_text = body.get('reply', '').strip()
            if not ticket_id or not reply_text:
                return resp(400, {'error': 'ticket_id и reply обязательны'})
            cur.execute("""
                UPDATE support_tickets
                SET reply = %s, status = 'closed', replied_at = NOW()
                WHERE id = %s
            """, (reply_text, ticket_id))
            conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()