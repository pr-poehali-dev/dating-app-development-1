"""
Админ-панель: статистика, пользователи, верификация, жалобы.
Все действия требуют заголовка X-Admin-Token.
Роутинг через ?action=...
"""
import json
import os
import time
import uuid
import base64
import psycopg2
import boto3
from moderation import moderate_text, moderate_photo, score_to_priority, push_to_queue, get_setting


def _push_to_user(cur, conn, user_id: int, title: str, body_text: str, url: str = '/'):
    """Отправляет Web Push всем подпискам пользователя."""
    try:
        from pywebpush import webpush, WebPushException
        vapid_private = os.environ.get('VAPID_PRIVATE_KEY', '')
        vapid_email = os.environ.get('VAPID_EMAIL', 'mailto:push@polyuton.app')
        if not vapid_private:
            return
        cur.execute("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = %s", (user_id,))
        rows = cur.fetchall()
        payload = json.dumps({'title': title, 'body': body_text, 'url': url})
        bad = []
        for rid, ep, p256, auth in rows:
            try:
                webpush(
                    subscription_info={'endpoint': ep, 'keys': {'p256dh': p256, 'auth': auth}},
                    data=payload, vapid_private_key=vapid_private,
                    vapid_claims={'sub': vapid_email},
                )
            except WebPushException as e:
                st = getattr(e.response, 'status_code', 0) if e.response else 0
                if st in (404, 410):
                    bad.append(rid)
        if bad:
            cur.execute("DELETE FROM push_subscriptions WHERE id = ANY(%s)", (bad,))
            conn.commit()
    except Exception:
        pass

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

def get_ip(event: dict) -> str:
    return (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', 'unknown')

def audit(cur, event_type: str, severity: str, ip: str = None, user_id: int = None, details: dict = None):
    cur.execute(
        "INSERT INTO security_events (event_type, severity, ip, user_id, details) VALUES (%s, %s, %s, %s, %s)",
        (event_type, severity, ip, user_id, json.dumps(details or {}))
    )

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    ip = get_ip(event)
    if not check_auth(event):
        # Логируем неудачные попытки доступа к админке
        try:
            conn_tmp = get_conn()
            cur_tmp = conn_tmp.cursor()
            audit(cur_tmp, 'admin_auth_failed', 'critical', ip=ip)
            conn_tmp.commit()
            conn_tmp.close()
        except Exception:
            pass
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

        # ── Список совпадений ─────────────────────────────────────────────────
        if action == 'matches_list':
            page = int(params.get('page', 1))
            per_page = 30
            offset = (page - 1) * per_page
            cur.execute(
                "SELECT m.id, m.created_at, "
                "u1.id as user1_id, u1.name as user1_name, u1.photo_url as user1_photo, u1.age as user1_age, "
                "u2.id as user2_id, u2.name as user2_name, u2.photo_url as user2_photo, u2.age as user2_age "
                "FROM matches m "
                "JOIN users u1 ON u1.id = m.user1_id "
                "JOIN users u2 ON u2.id = m.user2_id "
                "ORDER BY m.created_at DESC LIMIT %s OFFSET %s",
                (per_page, offset)
            )
            cols = ['id', 'created_at', 'user1_id', 'user1_name', 'user1_photo', 'user1_age',
                    'user2_id', 'user2_name', 'user2_photo', 'user2_age']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.execute("SELECT COUNT(*) FROM matches")
            total = cur.fetchone()[0]
            return resp(200, {'matches': rows, 'total': total, 'page': page, 'per_page': per_page})

        # ── Список подарков ───────────────────────────────────────────────────
        if action == 'gifts_list':
            page = int(params.get('page', 1))
            per_page = 30
            offset = (page - 1) * per_page
            cur.execute(
                "SELECT ug.id, ug.created_at, ug.amount, ug.gift_name, ug.gift_emoji, "
                "us.id as sender_id, us.name as sender_name, us.photo_url as sender_photo, "
                "ur.id as receiver_id, ur.name as receiver_name, ur.photo_url as receiver_photo "
                "FROM user_gifts ug "
                "LEFT JOIN users us ON us.id = ug.sender_id "
                "JOIN users ur ON ur.id = ug.recipient_id "
                "ORDER BY ug.created_at DESC LIMIT %s OFFSET %s",
                (per_page, offset)
            )
            cols = ['id', 'created_at', 'amount', 'gift_name', 'gift_emoji',
                    'sender_id', 'sender_name', 'sender_photo',
                    'receiver_id', 'receiver_name', 'receiver_photo']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.execute("SELECT COUNT(*) FROM user_gifts")
            total = cur.fetchone()[0]
            return resp(200, {'gifts': rows, 'total': total, 'page': page, 'per_page': per_page})

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
            audit(cur, 'admin_ban_user', 'warning', ip=ip, user_id=user_id, details={'reason': reason})
            conn.commit()
            return resp(200, {'ok': True})

        # ── Разбанить пользователя ────────────────────────────────────────────
        if action == 'unban_user':
            user_id = body.get('user_id')
            if not user_id:
                return resp(400, {'error': 'user_id обязателен'})
            cur.execute("DELETE FROM banned_users WHERE user_id = %s", (user_id,))
            audit(cur, 'admin_unban_user', 'info', ip=ip, user_id=user_id)
            conn.commit()
            return resp(200, {'ok': True})

        # ── Список жалоб ──────────────────────────────────────────────────────
        if action == 'reports':
            status = params.get('status', 'pending')
            cur.execute(
                "SELECT r.id, r.reason, r.comment, r.status, r.created_at, "
                "u1.name as reporter_name, u1.email as reporter_email, "
                "u2.name as reported_name, u2.email as reported_email, u2.id as reported_id, "
                "r.post_id, p.photo_url as post_photo_url "
                "FROM reports r "
                "JOIN users u1 ON u1.id = r.reporter_id "
                "JOIN users u2 ON u2.id = r.reported_id "
                "LEFT JOIN posts p ON p.id = r.post_id "
                "WHERE r.status = %s ORDER BY r.created_at DESC LIMIT 50",
                (status,)
            )
            cols = ['id', 'reason', 'comment', 'status', 'created_at',
                    'reporter_name', 'reporter_email', 'reported_name', 'reported_email', 'reported_id',
                    'post_id', 'post_photo_url']
            reports = [dict(zip(cols, row)) for row in cur.fetchall()]
            return resp(200, {'reports': reports})

        # ── Обработать жалобу ─────────────────────────────────────────────────
        if action == 'resolve_report':
            report_id = body.get('report_id')
            new_status = body.get('status', 'resolved')
            ban_user = body.get('ban_user', False)
            post_action = body.get('post_action', '')  # 'delete_post' | 'keep_post' | ''
            if not report_id:
                return resp(400, {'error': 'report_id обязателен'})

            # Получаем данные жалобы
            cur.execute(
                "SELECT reporter_id, reported_id, post_id FROM reports WHERE id = %s",
                (report_id,)
            )
            rep_info = cur.fetchone()
            reporter_id = rep_info[0] if rep_info else None
            reported_id = rep_info[1] if rep_info else None
            post_id     = rep_info[2] if rep_info else None

            cur.execute("UPDATE reports SET status = %s WHERE id = %s", (new_status, report_id))

            if ban_user and reported_id:
                cur.execute(
                    "INSERT INTO banned_users (user_id, reason) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING",
                    (reported_id, 'Нарушение правил сообщества')
                )
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (reported_id,))

            if new_status == 'dismissed':
                # Жалоба отклонена — уведомляем репортёра
                if reporter_id:
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'admin_report_dismissed', NULL)",
                        (reporter_id,)
                    )
            else:
                # Меры приняты — уведомляем репортёра о решении
                if reporter_id:
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'admin_report_resolved', NULL)",
                        (reporter_id,)
                    )
                # Уведомляем нарушителя о пост-действии
                if reported_id and post_action == 'delete_post':
                    # Удаляем пост из ленты
                    if post_id:
                        cur.execute("DELETE FROM post_comments WHERE post_id = %s", (post_id,))
                        cur.execute("DELETE FROM post_likes WHERE post_id = %s", (post_id,))
                        cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'admin_post_removed', NULL)",
                        (reported_id,)
                    )
                elif reported_id and post_action == 'keep_post':
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'admin_post_kept', NULL)",
                        (reported_id,)
                    )

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

        # ── Редактировать профиль пользователя ───────────────────────────────
        if action == 'edit_user':
            user_id = body.get('user_id')
            if not user_id:
                return resp(400, {'error': 'user_id обязателен'})
            allowed = ['name', 'age', 'city', 'bio', 'gender', 'premium', 'verified']
            updates = {k: v for k, v in body.items() if k in allowed}
            if not updates:
                return resp(400, {'error': 'Нет полей для обновления'})
            set_clause = ', '.join(f"{k} = %s" for k in updates)
            cur.execute(f"UPDATE users SET {set_clause} WHERE id = %s", list(updates.values()) + [user_id])
            conn.commit()
            return resp(200, {'ok': True})

        # ── История активности пользователя ──────────────────────────────────
        if action == 'user_activity':
            user_id = int(params.get('user_id', 0))
            if not user_id:
                return resp(400, {'error': 'user_id обязателен'})
            cur.execute("SELECT COUNT(*) FROM likes WHERE from_user_id=%s", (user_id,))
            likes_sent = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM likes WHERE to_user_id=%s", (user_id,))
            likes_received = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM matches WHERE user1_id=%s OR user2_id=%s", (user_id, user_id))
            matches_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM messages WHERE sender_id=%s", (user_id,))
            messages_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM reports WHERE reporter_id=%s", (user_id,))
            reports_sent = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM reports WHERE reported_id=%s", (user_id,))
            reports_received = cur.fetchone()[0]
            cur.execute("SELECT last_seen, created_at FROM users WHERE id=%s", (user_id,))
            u_row = cur.fetchone()
            return resp(200, {
                'likes_sent': likes_sent, 'likes_received': likes_received,
                'matches': matches_count, 'messages': messages_count,
                'reports_sent': reports_sent, 'reports_received': reports_received,
                'last_seen': str(u_row[0]) if u_row and u_row[0] else None,
                'created_at': str(u_row[1]) if u_row and u_row[1] else None,
            })

        # ── Аналитика: DAU/MAU по дням ────────────────────────────────────────
        if action == 'analytics_activity':
            cur.execute("""
                SELECT DATE(created_at) as day, COUNT(DISTINCT user_id) as dau
                FROM sessions
                WHERE created_at > NOW() - INTERVAL '30 days'
                GROUP BY day ORDER BY day DESC
            """)
            rows = cur.fetchall()
            dau_data = [{'date': str(r[0]), 'dau': r[1]} for r in rows]
            cur.execute("""
                SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as new_users
                FROM users
                WHERE created_at > NOW() - INTERVAL '6 months'
                GROUP BY month ORDER BY month DESC
            """)
            mau_rows = cur.fetchall()
            mau_data = [{'month': str(r[0])[:7], 'new_users': r[1]} for r in mau_rows]
            return resp(200, {'dau': dau_data, 'mau': mau_data})

        # ── Аналитика: демография ─────────────────────────────────────────────
        if action == 'analytics_demo':
            cur.execute("SELECT gender, COUNT(*) FROM users WHERE gender IS NOT NULL GROUP BY gender")
            gender_rows = cur.fetchall()
            gender = {r[0]: r[1] for r in gender_rows}
            cur.execute("""
                SELECT
                  CASE WHEN age < 18 THEN '<18'
                       WHEN age BETWEEN 18 AND 24 THEN '18-24'
                       WHEN age BETWEEN 25 AND 34 THEN '25-34'
                       WHEN age BETWEEN 35 AND 44 THEN '35-44'
                       WHEN age >= 45 THEN '45+'
                       ELSE 'unknown' END as group,
                  COUNT(*) as cnt
                FROM users GROUP BY 1
            """)
            age_rows = cur.fetchall()
            age = {r[0]: r[1] for r in age_rows}
            cur.execute("SELECT city, COUNT(*) FROM users WHERE city IS NOT NULL GROUP BY city ORDER BY 2 DESC LIMIT 10")
            city_rows = cur.fetchall()
            cities = [{'city': r[0], 'count': r[1]} for r in city_rows]
            return resp(200, {'gender': gender, 'age': age, 'cities': cities})

        # ── Аналитика: финансы ────────────────────────────────────────────────
        if action == 'analytics_finance':
            cur.execute("SELECT COUNT(*), SUM(amount) FROM user_gifts WHERE amount > 0")
            g_row = cur.fetchone()
            cur.execute("SELECT COUNT(*) FROM users WHERE premium = TRUE")
            premium_count = cur.fetchone()[0]
            cur.execute("""
                SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as cnt, COALESCE(SUM(amount),0) as revenue
                FROM user_gifts WHERE amount > 0 AND created_at > NOW() - INTERVAL '6 months'
                GROUP BY month ORDER BY month DESC
            """)
            finance_rows = cur.fetchall()
            monthly = [{'month': str(r[0])[:7], 'count': r[1], 'revenue': float(r[2])} for r in finance_rows]
            return resp(200, {
                'total_gift_transactions': g_row[0] or 0,
                'total_gift_revenue': float(g_row[1] or 0),
                'premium_users': premium_count,
                'monthly': monthly,
            })

        # ── Безопасность: список заблокированных IP ───────────────────────────
        if action == 'blocked_ips':
            cur.execute("""
                SELECT id, ip_address, reason, created_at
                FROM blocked_ips ORDER BY created_at DESC LIMIT 100
            """)
            rows = cur.fetchall()
            cols = ['id', 'ip_address', 'reason', 'created_at']
            return resp(200, {'ips': [dict(zip(cols, r)) for r in rows]})

        if action == 'block_ip':
            ip = body.get('ip_address', '').strip()
            reason = body.get('reason', 'Ручная блокировка').strip()
            if not ip:
                return resp(400, {'error': 'ip_address обязателен'})
            cur.execute(
                "INSERT INTO blocked_ips (ip_address, reason) VALUES (%s, %s) ON CONFLICT (ip_address) DO NOTHING",
                (ip, reason)
            )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'unblock_ip':
            ip_id = body.get('id')
            if not ip_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("DELETE FROM blocked_ips WHERE id = %s", (ip_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Безопасность: стоп-слова ──────────────────────────────────────────
        if action == 'stopwords':
            cur.execute("SELECT id, word, created_at FROM stopwords ORDER BY created_at DESC LIMIT 200")
            rows = cur.fetchall()
            return resp(200, {'words': [{'id': r[0], 'word': r[1], 'created_at': str(r[2])} for r in rows]})

        if action == 'add_stopword':
            word = body.get('word', '').strip().lower()
            if not word:
                return resp(400, {'error': 'word обязателен'})
            cur.execute("INSERT INTO stopwords (word) VALUES (%s) ON CONFLICT (word) DO NOTHING", (word,))
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'delete_stopword':
            word_id = body.get('id')
            if not word_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("DELETE FROM stopwords WHERE id = %s", (word_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── ИИ-МОДЕРАЦИЯ: умная очередь ───────────────────────────────────────

        if action == 'ai_stats':
            cur.execute("SELECT COUNT(*) FROM ai_moderation_queue WHERE status = 'needs_review'")
            pending = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM ai_moderation_queue WHERE action_taken = 'auto_blocked' AND created_at > NOW() - INTERVAL '24 hours'")
            auto_blocked_24h = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM ai_moderation_queue WHERE created_at > NOW() - INTERVAL '24 hours'")
            checked_24h = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM ai_moderation_queue WHERE status = 'needs_review' AND priority = 'high'")
            high_priority = cur.fetchone()[0]
            cur.execute("""
                SELECT content_type, COUNT(*) FROM ai_moderation_queue
                WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY content_type
            """)
            by_type = {r[0]: r[1] for r in cur.fetchall()}
            return resp(200, {
                'pending_review': pending, 'auto_blocked_24h': auto_blocked_24h,
                'checked_24h': checked_24h, 'high_priority': high_priority, 'by_type': by_type,
            })

        if action == 'ai_queue':
            status = params.get('status', 'needs_review')
            priority = params.get('priority', '')
            q = ("SELECT q.id, q.content_type, q.content_id, q.user_id, q.text_snippet, q.photo_url, "
                 "q.ai_verdict, q.ai_score, q.ai_categories, q.ai_reason, q.priority, q.status, "
                 "q.action_taken, q.reviewed_by, q.created_at, u.name, u.username, u.photo_url as user_photo, u.ai_violation_count "
                 "FROM ai_moderation_queue q JOIN users u ON u.id = q.user_id WHERE q.status = %s")
            qparams = [status]
            if priority:
                q += " AND q.priority = %s"
                qparams.append(priority)
            q += " ORDER BY CASE q.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, q.created_at DESC LIMIT 100"
            cur.execute(q, qparams)
            cols = ['id', 'content_type', 'content_id', 'user_id', 'text_snippet', 'photo_url',
                    'ai_verdict', 'ai_score', 'ai_categories', 'ai_reason', 'priority', 'status',
                    'action_taken', 'reviewed_by', 'created_at', 'user_name', 'username', 'user_photo', 'ai_violation_count']
            items = []
            for r in cur.fetchall():
                item = dict(zip(cols, r))
                try:
                    item['ai_categories'] = json.loads(item['ai_categories']) if item['ai_categories'] else []
                except Exception:
                    item['ai_categories'] = []
                items.append(item)
            return resp(200, {'items': items})

        if action == 'ai_queue_resolve':
            item_id = body.get('id')
            decision = body.get('decision', '')  # 'approve' | 'remove' | 'ban'
            if not item_id or decision not in ('approve', 'remove', 'ban'):
                return resp(400, {'error': 'id и decision (approve|remove|ban) обязательны'})
            cur.execute("SELECT content_type, content_id, user_id FROM ai_moderation_queue WHERE id = %s", (item_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Запись не найдена'})
            content_type, content_id, user_id = row

            action_map = {'approve': 'admin_approved', 'remove': 'admin_removed', 'ban': 'admin_banned'}
            cur.execute(
                "UPDATE ai_moderation_queue SET status = 'reviewed', action_taken = %s, reviewed_by = 'admin', reviewed_at = NOW() WHERE id = %s",
                (action_map[decision], item_id)
            )

            if decision in ('remove', 'ban') and content_id:
                if content_type == 'post':
                    cur.execute("DELETE FROM post_comments WHERE post_id = %s", (content_id,))
                    cur.execute("DELETE FROM post_likes WHERE post_id = %s", (content_id,))
                    cur.execute("DELETE FROM posts WHERE id = %s", (content_id,))
                elif content_type == 'profile_photo':
                    cur.execute("UPDATE profile_photos SET is_hidden = TRUE WHERE id = %s", (content_id,))
                elif content_type == 'message':
                    cur.execute("UPDATE messages SET text = '[Удалено модератором]' WHERE id = %s", (content_id,))
                elif content_type == 'comment':
                    cur.execute("DELETE FROM post_comments WHERE id = %s", (content_id,))

            if decision == 'ban':
                cur.execute(
                    "INSERT INTO banned_users (user_id, reason) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING",
                    (user_id, 'Нарушение правил (AI-модерация)')
                )
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
                cur.execute("UPDATE users SET ai_violation_count = ai_violation_count + 1 WHERE id = %s", (user_id,))

            audit(cur, 'ai_queue_resolved', 'info', ip=ip, user_id=user_id, details={'item_id': item_id, 'decision': decision, 'content_type': content_type})
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'ai_settings':
            cur.execute("SELECT key, value FROM ai_moderation_settings")
            settings = {r[0]: r[1] for r in cur.fetchall()}
            return resp(200, {'settings': settings})

        if action == 'ai_settings_update':
            updates = body.get('settings', {})
            if not isinstance(updates, dict):
                return resp(400, {'error': 'settings должен быть объектом'})
            allowed_keys = {'text_moderation_enabled', 'photo_moderation_enabled', 'selfie_verification_enabled', 'auto_block_threshold', 'review_threshold'}
            for k, v in updates.items():
                if k in allowed_keys:
                    cur.execute(
                        "INSERT INTO ai_moderation_settings (key, value) VALUES (%s, %s) "
                        "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                        (k, str(v))
                    )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'ai_test_connection':
            mod = moderate_text('Привет, как дела?')
            if mod.get('error'):
                return resp(200, {'ok': False, 'error': mod['error']})
            return resp(200, {'ok': True, 'sample_score': mod['score']})

        if action == 'ai_recheck_post':
            post_id = body.get('post_id')
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT id, user_id, photo_url, caption FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пост не найден'})
            pid, user_id, photo_url, caption = row
            mod = moderate_photo(photo_url, purpose='general')
            if mod.get('error'):
                return resp(200, {'ok': False, 'error': mod['error']})
            score = mod['score']
            block_th = float(get_setting(cur, 'auto_block_threshold', '85'))
            review_th = float(get_setting(cur, 'review_threshold', '40'))
            verdict = 'violation' if score >= block_th else ('suspicious' if score >= review_th else 'safe')
            ai_flag = score >= review_th
            cur.execute("UPDATE posts SET ai_flagged = %s WHERE id = %s", (ai_flag, pid))
            if ai_flag:
                push_to_queue(cur, 'post', pid, user_id, photo_url=photo_url,
                              ai_verdict=verdict, ai_score=score, ai_categories=mod['categories'],
                              ai_reason=mod['reason'] or 'Ручная перепроверка',
                              priority=score_to_priority(score),
                              status='needs_review' if verdict != 'violation' else 'auto_resolved',
                              action_taken='auto_blocked' if verdict == 'violation' else None,
                              reviewed_by='ai')
            conn.commit()
            return resp(200, {'ok': True, 'verdict': verdict, 'score': score, 'reason': mod['reason'], 'categories': mod['categories'], 'flagged': ai_flag})

        if action == 'ai_recheck_comment':
            comment_id = body.get('comment_id')
            if not comment_id:
                return resp(400, {'error': 'comment_id обязателен'})
            cur.execute("SELECT id, user_id, text FROM post_comments WHERE id = %s", (comment_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Комментарий не найден'})
            cid, user_id, text = row
            mod = moderate_text(text)
            if mod.get('error'):
                return resp(200, {'ok': False, 'error': mod['error']})
            score = mod['score']
            block_th = float(get_setting(cur, 'auto_block_threshold', '85'))
            review_th = float(get_setting(cur, 'review_threshold', '40'))
            verdict = 'violation' if score >= block_th else ('suspicious' if score >= review_th else 'safe')
            ai_flag = score >= review_th
            deleted = False
            if verdict == 'violation':
                push_to_queue(cur, 'comment', cid, user_id, text_snippet=text[:500],
                              ai_verdict=verdict, ai_score=score, ai_categories=mod['categories'],
                              ai_reason=mod['reason'] or 'Автоудаление при перепроверке',
                              priority='high', status='auto_resolved', action_taken='auto_deleted', reviewed_by='ai')
                cur.execute("DELETE FROM post_comments WHERE id = %s", (cid,))
                cur.execute("UPDATE users SET ai_violation_count = ai_violation_count + 1 WHERE id = %s", (user_id,))
                deleted = True
            elif ai_flag:
                cur.execute("UPDATE post_comments SET ai_flagged = %s WHERE id = %s", (ai_flag, cid))
                push_to_queue(cur, 'comment', cid, user_id, text_snippet=text[:500],
                              ai_verdict=verdict, ai_score=score, ai_categories=mod['categories'],
                              ai_reason=mod['reason'] or 'Ручная перепроверка',
                              priority=score_to_priority(score), status='needs_review', reviewed_by='ai')
            conn.commit()
            return resp(200, {'ok': True, 'verdict': verdict, 'score': score, 'reason': mod['reason'], 'categories': mod['categories'], 'flagged': ai_flag, 'deleted': deleted})

        # ── Ретроактивное сканирование фото (галерея / аватары / обложки) ────
        if action == 'ai_scan_status':
            cur.execute("SELECT COUNT(*) FROM profile_photos WHERE is_hidden = FALSE AND ai_checked_at IS NULL")
            gallery_left = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE photo_url IS NOT NULL AND photo_url != '' AND ai_avatar_checked_at IS NULL")
            avatars_left = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE cover_url IS NOT NULL AND cover_url != '' AND ai_cover_checked_at IS NULL")
            covers_left = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM profile_photos WHERE ai_flagged = TRUE")
            gallery_flagged = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE ai_avatar_flagged = TRUE")
            avatars_flagged = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM users WHERE ai_cover_flagged = TRUE")
            covers_flagged = cur.fetchone()[0]
            return resp(200, {
                'gallery_left': gallery_left, 'avatars_left': avatars_left, 'covers_left': covers_left,
                'gallery_flagged': gallery_flagged, 'avatars_flagged': avatars_flagged, 'covers_flagged': covers_flagged,
            })

        if action == 'ai_scan_batch':
            scan_type = body.get('type', 'gallery')  # 'gallery' | 'avatars' | 'covers'
            batch_size = 5
            block_th = float(get_setting(cur, 'auto_block_threshold', '85'))
            review_th = float(get_setting(cur, 'review_threshold', '40'))
            scanned, flagged_now, errors = 0, 0, []

            if scan_type == 'gallery':
                cur.execute(
                    "SELECT id, user_id, photo_url FROM profile_photos WHERE is_hidden = FALSE AND ai_checked_at IS NULL LIMIT %s",
                    (batch_size,)
                )
                rows = cur.fetchall()
                for pid, user_id, photo_url in rows:
                    mod = moderate_photo(photo_url, purpose='general')
                    if mod.get('error'):
                        errors.append(mod['error'])
                        cur.execute("UPDATE profile_photos SET ai_checked_at = NOW() WHERE id = %s", (pid,))
                        continue
                    score = mod['score']
                    ai_flag = score >= review_th
                    verdict = 'violation' if score >= block_th else ('suspicious' if score >= review_th else 'safe')
                    cur.execute("UPDATE profile_photos SET ai_flagged = %s, ai_checked_at = NOW() WHERE id = %s", (ai_flag, pid))
                    if ai_flag:
                        flagged_now += 1
                        push_to_queue(cur, 'profile_photo', pid, user_id, photo_url=photo_url,
                                      ai_verdict=verdict, ai_score=score, ai_categories=mod['categories'],
                                      ai_reason=mod['reason'] or 'Ретро-сканирование',
                                      priority=score_to_priority(score),
                                      status='needs_review' if verdict != 'violation' else 'auto_resolved',
                                      action_taken='auto_blocked' if verdict == 'violation' else None,
                                      reviewed_by='ai')
                    scanned += 1

            elif scan_type == 'avatars':
                cur.execute(
                    "SELECT id, photo_url FROM users WHERE photo_url IS NOT NULL AND photo_url != '' AND ai_avatar_checked_at IS NULL LIMIT %s",
                    (batch_size,)
                )
                rows = cur.fetchall()
                for user_id, photo_url in rows:
                    mod = moderate_photo(photo_url, purpose='general')
                    if mod.get('error'):
                        errors.append(mod['error'])
                        cur.execute("UPDATE users SET ai_avatar_checked_at = NOW() WHERE id = %s", (user_id,))
                        continue
                    score = mod['score']
                    ai_flag = score >= review_th
                    verdict = 'violation' if score >= block_th else ('suspicious' if score >= review_th else 'safe')
                    cur.execute("UPDATE users SET ai_avatar_flagged = %s, ai_avatar_checked_at = NOW() WHERE id = %s", (ai_flag, user_id))
                    if ai_flag:
                        flagged_now += 1
                        push_to_queue(cur, 'profile_photo', None, user_id, photo_url=photo_url,
                                      ai_verdict=verdict, ai_score=score, ai_categories=mod['categories'],
                                      ai_reason=(mod['reason'] or 'Ретро-сканирование аватара'),
                                      priority=score_to_priority(score),
                                      status='needs_review' if verdict != 'violation' else 'auto_resolved',
                                      action_taken='auto_blocked' if verdict == 'violation' else None,
                                      reviewed_by='ai')
                    scanned += 1

            elif scan_type == 'covers':
                cur.execute(
                    "SELECT id, cover_url FROM users WHERE cover_url IS NOT NULL AND cover_url != '' AND ai_cover_checked_at IS NULL LIMIT %s",
                    (batch_size,)
                )
                rows = cur.fetchall()
                for user_id, cover_url in rows:
                    mod = moderate_photo(cover_url, purpose='general')
                    if mod.get('error'):
                        errors.append(mod['error'])
                        cur.execute("UPDATE users SET ai_cover_checked_at = NOW() WHERE id = %s", (user_id,))
                        continue
                    score = mod['score']
                    ai_flag = score >= review_th
                    verdict = 'violation' if score >= block_th else ('suspicious' if score >= review_th else 'safe')
                    cur.execute("UPDATE users SET ai_cover_flagged = %s, ai_cover_checked_at = NOW() WHERE id = %s", (ai_flag, user_id))
                    if ai_flag:
                        flagged_now += 1
                        push_to_queue(cur, 'profile_photo', None, user_id, photo_url=cover_url,
                                      ai_verdict=verdict, ai_score=score, ai_categories=mod['categories'],
                                      ai_reason=(mod['reason'] or 'Ретро-сканирование обложки'),
                                      priority=score_to_priority(score),
                                      status='needs_review' if verdict != 'violation' else 'auto_resolved',
                                      action_taken='auto_blocked' if verdict == 'violation' else None,
                                      reviewed_by='ai')
                    scanned += 1

            conn.commit()
            return resp(200, {'ok': True, 'scanned': scanned, 'flagged': flagged_now, 'errors': errors})

        # ── Маркетинг: отправить push всем ───────────────────────────────────
        if action == 'push_broadcast':
            title = body.get('title', '').strip()
            message = body.get('message', '').strip()
            segment = body.get('segment', 'all')  # all | premium | new_week
            if not title or not message:
                return resp(400, {'error': 'title и message обязательны'})
            if segment == 'premium':
                cur.execute("SELECT id FROM users WHERE premium = TRUE")
            elif segment == 'new_week':
                cur.execute("SELECT id FROM users WHERE created_at > NOW() - INTERVAL '7 days'")
            else:
                cur.execute("SELECT id FROM users")
            user_ids = [r[0] for r in cur.fetchall()]
            for uid in user_ids:
                cur.execute(
                    "INSERT INTO notifications (user_id, type, from_user_id) VALUES (%s, 'admin_broadcast', NULL)",
                    (uid,)
                )
            conn.commit()
            return resp(200, {'ok': True, 'sent_to': len(user_ids)})

        # ── Маркетинг: баннеры ────────────────────────────────────────────────
        if action == 'banners':
            cur.execute("SELECT id, title, subtitle, color_from, color_to, active, created_at FROM admin_banners ORDER BY created_at DESC")
            rows = cur.fetchall()
            cols = ['id', 'title', 'subtitle', 'color_from', 'color_to', 'active', 'created_at']
            return resp(200, {'banners': [dict(zip(cols, r)) for r in rows]})

        if action == 'banner_save':
            banner_id = body.get('id')
            title = body.get('title', '').strip()
            subtitle = body.get('subtitle', '').strip()
            color_from = body.get('color_from', '#FF2D78').strip()
            color_to = body.get('color_to', '#9B59B6').strip()
            active = bool(body.get('active', True))
            if banner_id:
                cur.execute(
                    "UPDATE admin_banners SET title=%s, subtitle=%s, color_from=%s, color_to=%s, active=%s WHERE id=%s",
                    (title, subtitle, color_from, color_to, active, banner_id)
                )
            else:
                cur.execute(
                    "INSERT INTO admin_banners (title, subtitle, color_from, color_to, active) VALUES (%s,%s,%s,%s,%s)",
                    (title, subtitle, color_from, color_to, active)
                )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'banner_delete':
            banner_id = body.get('id')
            if not banner_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("DELETE FROM admin_banners WHERE id = %s", (banner_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Подписки: список тарифов ──────────────────────────────────────────
        if action == 'plans':
            cur.execute("""
                SELECT id, plan_key, label, price_per_month, total_amount,
                       duration_months, popular, active, sort_order, updated_at
                FROM premium_plans ORDER BY sort_order
            """)
            cols = ['id','plan_key','label','price_per_month','total_amount',
                    'duration_months','popular','active','sort_order','updated_at']
            plans = []
            for r in cur.fetchall():
                d = dict(zip(cols, r))
                d['price_per_month'] = float(d['price_per_month'])
                d['total_amount']    = float(d['total_amount'])
                plans.append(d)
            # Статистика по каждому плану
            cur.execute("""
                SELECT plan, COUNT(*) FROM orders
                WHERE status = 'succeeded' GROUP BY plan
            """)
            stats = {r[0]: r[1] for r in cur.fetchall()}
            cur.execute("SELECT COUNT(*) FROM users WHERE premium = TRUE")
            total_premium = cur.fetchone()[0]
            return resp(200, {'plans': plans, 'stats': stats, 'total_premium': total_premium})

        # ── Подписки: обновить тариф ──────────────────────────────────────────
        if action == 'update_plan':
            plan_id = body.get('id')
            if not plan_id:
                return resp(400, {'error': 'id обязателен'})
            allowed = ['label', 'price_per_month', 'total_amount', 'duration_months',
                       'popular', 'active', 'sort_order']
            updates = {k: v for k, v in body.items() if k in allowed}
            if not updates:
                return resp(400, {'error': 'Нет полей для обновления'})
            set_clause = ', '.join(f"{k} = %s" for k in updates)
            values = list(updates.values()) + [plan_id]
            cur.execute(
                f"UPDATE premium_plans SET {set_clause}, updated_at = NOW() WHERE id = %s",
                values
            )
            conn.commit()
            return resp(200, {'ok': True})

        # ── Подписки: создать тариф ───────────────────────────────────────────
        if action == 'create_plan':
            plan_key      = body.get('plan_key', '').strip()
            label         = body.get('label', '').strip()
            price_per_month = body.get('price_per_month')
            total_amount  = body.get('total_amount')
            duration_months = body.get('duration_months', 1)
            popular       = bool(body.get('popular', False))
            if not plan_key or not label or price_per_month is None or total_amount is None:
                return resp(400, {'error': 'plan_key, label, price_per_month, total_amount обязательны'})
            cur.execute("SELECT id FROM premium_plans WHERE plan_key = %s", (plan_key,))
            if cur.fetchone():
                return resp(400, {'error': f'plan_key «{plan_key}» уже существует'})
            cur.execute(
                "SELECT COALESCE(MAX(sort_order),0)+1 FROM premium_plans"
            )
            next_order = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO premium_plans (plan_key, label, price_per_month, total_amount, duration_months, popular, active, sort_order) "
                "VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s) RETURNING id",
                (plan_key, label, float(price_per_month), float(total_amount), int(duration_months), popular, next_order)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return resp(200, {'ok': True, 'id': new_id})

        # ── Подписки: удалить тариф ───────────────────────────────────────────
        if action == 'delete_plan':
            plan_id = body.get('id')
            if not plan_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("DELETE FROM premium_plans WHERE id = %s", (plan_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Промокоды: список ─────────────────────────────────────────────────
        if action == 'promos':
            cur.execute("""
                SELECT p.id, p.code, p.discount_percent, p.max_uses, p.used_count,
                       p.expires_at, p.active, p.created_at
                FROM promo_codes p
                ORDER BY p.created_at DESC
            """)
            cols = ['id', 'code', 'discount_percent', 'max_uses', 'used_count',
                    'expires_at', 'active', 'created_at']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'promos': rows})

        # ── Промокоды: кто применил (когда и какой) ──────────────────────────
        if action == 'promo_uses':
            promo_id = params.get('promo_id')
            where = "WHERE pu.promo_code_id = %s" if promo_id else ""
            args = (int(promo_id),) if promo_id else ()
            cur.execute(
                "SELECT pu.id, pu.used_at, "
                "p.code, p.discount_percent, "
                "u.id as user_id, u.name, u.email, u.username, u.photo_url "
                "FROM promo_code_uses pu "
                "JOIN promo_codes p ON p.id = pu.promo_code_id "
                "JOIN users u ON u.id = pu.user_id "
                f"{where} "
                "ORDER BY pu.used_at DESC LIMIT 200",
                args
            )
            cols = ['id', 'used_at', 'code', 'discount_percent',
                    'user_id', 'name', 'email', 'username', 'photo_url']
            uses = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'uses': uses})

        # ── Промокоды: создать ────────────────────────────────────────────────
        if action == 'promo_create':
            code = body.get('code', '').strip().upper()
            discount = int(body.get('discount_percent', 0))
            max_uses = int(body.get('max_uses', 1))
            expires_at = body.get('expires_at') or None
            if not code:
                return resp(400, {'error': 'Введи код'})
            if not (1 <= discount <= 100):
                return resp(400, {'error': 'Скидка должна быть от 1 до 100'})
            cur.execute("SELECT id FROM promo_codes WHERE code = %s", (code,))
            if cur.fetchone():
                return resp(400, {'error': f'Промокод «{code}» уже существует'})
            cur.execute(
                "INSERT INTO promo_codes (code, discount_percent, max_uses, expires_at) "
                "VALUES (%s, %s, %s, %s) RETURNING id",
                (code, discount, max_uses, expires_at)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return resp(200, {'ok': True, 'id': new_id})

        # ── Промокоды: деактивировать/активировать ───────────────────────────
        if action == 'promo_toggle':
            promo_id = body.get('id')
            if not promo_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("UPDATE promo_codes SET active = NOT active WHERE id = %s RETURNING active", (promo_id,))
            row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'active': row[0] if row else False})

        # ── Промокоды: удалить ────────────────────────────────────────────────
        if action == 'promo_delete':
            promo_id = body.get('id')
            if not promo_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("DELETE FROM promo_code_uses WHERE promo_code_id = %s", (promo_id,))
            cur.execute("DELETE FROM promo_codes WHERE id = %s", (promo_id,))
            conn.commit()
            return resp(200, {'ok': True})

        # ── Загрузка изображения в S3 (для постов/баннеров) ──────────────────
        if action == 'admin_upload_image':
            image_data = body.get('image', '')
            content_type = body.get('content_type', 'image/jpeg')
            if not image_data:
                return resp(400, {'error': 'Нет изображения'})
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
            if len(image_bytes) > 10 * 1024 * 1024:
                return resp(400, {'error': 'Файл слишком большой (макс. 10 МБ)'})
            ext = 'jpg' if 'jpeg' in content_type else content_type.split('/')[-1]
            key = f"admin/{uuid.uuid4()}.{ext}"
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            return resp(200, {'ok': True, 'photo_url': cdn_url})

        # ── Публикация поста от Полутон ────────────────────────────────────
        if action == 'admin_post_create':
            photo_url = body.get('photo_url', '').strip()
            caption = body.get('caption', '').strip()
            if not photo_url:
                return resp(400, {'error': 'photo_url обязателен'})
            LBLOOM_EMAIL = 'system@lbloom.ru'
            LBLOOM_PHOTO = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/9a554cba-69a8-400b-aa59-3cdbaf1dc299.jpg'
            cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (LBLOOM_EMAIL,))
            row = cur.fetchone()
            if row:
                sys_id = row[0]
            else:
                cur.execute(
                    "INSERT INTO users (name, email, password_hash, photo_url, verified) "
                    "VALUES ('Полутон', %s, 'system', %s, TRUE) RETURNING id",
                    (LBLOOM_EMAIL, LBLOOM_PHOTO)
                )
                sys_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO posts (user_id, photo_url, caption) VALUES (%s, %s, %s) RETURNING id, created_at",
                (sys_id, photo_url, caption or None)
            )
            post_row = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'post_id': post_row[0], 'created_at': str(post_row[1])})

        # ── Список постов от Полутон ────────────────────────────────────────
        if action == 'admin_posts_list':
            LBLOOM_EMAIL = 'system@lbloom.ru'
            cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (LBLOOM_EMAIL,))
            row = cur.fetchone()
            if not row:
                return resp(200, {'posts': []})
            sys_id = row[0]
            cur.execute(
                "SELECT p.id, p.photo_url, p.caption, p.created_at, "
                "COUNT(DISTINCT pl.id) as likes "
                "FROM posts p LEFT JOIN post_likes pl ON pl.post_id = p.id "
                "WHERE p.user_id = %s GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50",
                (sys_id,)
            )
            cols = ['id', 'photo_url', 'caption', 'created_at', 'likes']
            posts = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'posts': posts})

        # ── Удалить пост Полутон ────────────────────────────────────────────
        if action == 'admin_post_delete':
            post_id = body.get('id')
            if not post_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("DELETE FROM post_likes WHERE post_id = %s", (post_id,))
            cur.execute("DELETE FROM post_comments WHERE post_id = %s", (post_id,))
            cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            audit(cur, 'admin_post_deleted', 'info', ip=ip, details={'post_id': post_id})
            conn.commit()
            return resp(200, {'ok': True})

        # ── Журнал событий безопасности ──────────────────────────────────────
        if action == 'security_events':
            severity = params.get('severity', '')
            limit = min(int(params.get('limit', 100)), 500)
            if severity:
                cur.execute(
                    "SELECT id, event_type, severity, ip, user_id, email, details, created_at "
                    "FROM security_events WHERE severity = %s ORDER BY created_at DESC LIMIT %s",
                    (severity, limit)
                )
            else:
                cur.execute(
                    "SELECT id, event_type, severity, ip, user_id, email, details, created_at "
                    "FROM security_events ORDER BY created_at DESC LIMIT %s",
                    (limit,)
                )
            cols = ['id', 'event_type', 'severity', 'ip', 'user_id', 'email', 'details', 'created_at']
            events = [dict(zip(cols, r)) for r in cur.fetchall()]
            # Статистика за последние 24 часа
            cur.execute("SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours'")
            total_24h = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM security_events WHERE severity IN ('warning','critical') AND created_at > NOW() - INTERVAL '24 hours'")
            alerts_24h = cur.fetchone()[0]
            cur.execute("SELECT COUNT(DISTINCT ip) FROM auth_attempts WHERE success = FALSE AND created_at > NOW() - INTERVAL '24 hours'")
            suspicious_ips = cur.fetchone()[0]
            return resp(200, {'events': events, 'stats': {'total_24h': total_24h, 'alerts_24h': alerts_24h, 'suspicious_ips': suspicious_ips}})

        # ── Запросы от органов власти: список ────────────────────────────────
        if action == 'gov_requests':
            cur.execute("""
                SELECT id, request_number, authority, subject, user_id, user_email,
                       status, notes, admin_notes, data_exported_at, created_at
                FROM gov_requests ORDER BY created_at DESC LIMIT 200
            """)
            cols = ['id', 'request_number', 'authority', 'subject', 'user_id', 'user_email',
                    'status', 'notes', 'admin_notes', 'data_exported_at', 'created_at']
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp(200, {'requests': rows})

        # ── Запросы от органов власти: создать ───────────────────────────────
        if action == 'gov_request_create':
            request_number = body.get('request_number', '').strip()
            authority = body.get('authority', '').strip()
            subject = body.get('subject', '').strip()
            user_email = body.get('user_email', '').strip()
            notes = body.get('notes', '').strip()
            if not authority or not subject:
                return resp(400, {'error': 'authority и subject обязательны'})
            user_id = None
            if user_email:
                cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (user_email,))
                row = cur.fetchone()
                if row:
                    user_id = row[0]
            cur.execute(
                "INSERT INTO gov_requests (request_number, authority, subject, user_id, user_email, notes) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (request_number or f'GOV-{int(time.time())}', authority, subject, user_id, user_email or None, notes or None)
            )
            new_id = cur.fetchone()[0]
            audit(cur, 'gov_request_created', 'info', ip=ip, details={'authority': authority, 'request_number': request_number, 'subject': subject, 'user_email': user_email})
            conn.commit()
            return resp(200, {'ok': True, 'id': new_id})

        # ── Запросы от органов власти: выгрузить данные пользователя ─────────
        if action == 'gov_request_export':
            req_id = body.get('id')
            if not req_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute("SELECT user_id, user_email FROM gov_requests WHERE id = %s", (req_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Запрос не найден'})
            user_id, user_email = row
            user_data = {'request_id': req_id, 'user_email': user_email}
            # Если user_id не сохранён, ищем по email
            if not user_id and user_email:
                cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (user_email,))
                found = cur.fetchone()
                if found:
                    user_id = found[0]
            if user_id:
                cur.execute(
                    "SELECT id, name, email, username, age, city, bio, gender, created_at, last_seen, premium "
                    "FROM users WHERE id = %s", (user_id,)
                )
                u = cur.fetchone()
                if u:
                    user_data['profile'] = dict(zip(
                        ['id', 'name', 'email', 'username', 'age', 'city', 'bio', 'gender', 'created_at', 'last_seen', 'premium'], u
                    ))
                cur.execute("SELECT COUNT(*) FROM messages WHERE sender_id = %s", (user_id,))
                user_data['messages_count'] = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM likes WHERE from_user_id = %s", (user_id,))
                user_data['likes_given'] = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM matches WHERE user1_id = %s OR user2_id = %s", (user_id, user_id))
                user_data['matches_count'] = cur.fetchone()[0]
                cur.execute("SELECT token, created_at, expires_at FROM sessions WHERE user_id = %s ORDER BY created_at DESC LIMIT 10", (user_id,))
                user_data['sessions'] = [dict(zip(['token', 'created_at', 'expires_at'], s)) for s in cur.fetchall()]
            cur.execute(
                "UPDATE gov_requests SET status = 'exported', data_exported_at = NOW(), updated_at = NOW() WHERE id = %s",
                (req_id,)
            )
            audit(cur, 'gov_data_exported', 'critical', ip=ip, user_id=user_id, details={'req_id': req_id, 'user_email': user_email})
            conn.commit()
            return resp(200, {'ok': True, 'user_data': user_data})

        # ── Запросы от органов власти: обновить статус / заметки ─────────────
        if action == 'gov_request_update':
            req_id = body.get('id')
            new_status = body.get('status', '')
            admin_notes = body.get('admin_notes', '')
            if not req_id:
                return resp(400, {'error': 'id обязателен'})
            cur.execute(
                "UPDATE gov_requests SET status = COALESCE(NULLIF(%s,''), status), "
                "admin_notes = COALESCE(NULLIF(%s,''), admin_notes), updated_at = NOW() WHERE id = %s",
                (new_status or None, admin_notes or None, req_id)
            )
            conn.commit()
            return resp(200, {'ok': True})

        # ── Контент: список постов на модерацию ──────────────────────────────
        if action == 'content_posts':
            page = int(params.get('page', 1))
            per_page = 20
            offset = (page - 1) * per_page
            cur.execute(
                "SELECT p.id, p.user_id, p.photo_url, p.caption, p.created_at, "
                "u.name, u.username, u.photo_url as user_photo "
                "FROM posts p JOIN users u ON u.id = p.user_id "
                "ORDER BY p.created_at DESC LIMIT %s OFFSET %s",
                (per_page, offset)
            )
            rows = cur.fetchall()
            posts = [dict(zip(['id','user_id','photo_url','caption','created_at','user_name','username','user_photo'], r)) for r in rows]
            cur.execute("SELECT COUNT(*) FROM posts")
            total = cur.fetchone()[0]
            return resp(200, {'posts': posts, 'total': total, 'page': page})

        # ── Контент: список фото профилей на модерацию ───────────────────────
        if action == 'content_photos':
            page = int(params.get('page', 1))
            per_page = 20
            offset = (page - 1) * per_page
            # cover_url + profile_photos
            cur.execute(
                "SELECT 'cover' as type, u.id as user_id, u.cover_url as photo_url, u.name, u.username, u.photo_url as user_photo, u.created_at "
                "FROM users u WHERE u.cover_url IS NOT NULL AND u.cover_url != '' "
                "UNION ALL "
                "SELECT 'gallery' as type, pp.user_id, pp.photo_url, u.name, u.username, u.photo_url as user_photo, pp.created_at "
                "FROM profile_photos pp JOIN users u ON u.id = pp.user_id "
                "ORDER BY created_at DESC LIMIT %s OFFSET %s",
                (per_page, offset)
            )
            rows = cur.fetchall()
            photos = [dict(zip(['type','user_id','photo_url','user_name','username','user_photo','created_at'], r)) for r in rows]
            return resp(200, {'photos': photos, 'page': page})

        # ── Удалить пост от имени модератора ─────────────────────────────────
        if action == 'delete_post':
            post_id = body.get('post_id')
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT user_id, photo_url FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пост не найден'})
            user_id, photo_url = row
            cur.execute("DELETE FROM post_likes WHERE post_id = %s", (post_id,))
            cur.execute("DELETE FROM post_comments WHERE post_id = %s", (post_id,))
            cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            audit(cur, 'admin_delete_post', 'warning', ip=ip, user_id=user_id, details={'post_id': post_id, 'photo_url': photo_url})
            conn.commit()
            return resp(200, {'ok': True})

        # ── Удалить фото профиля / обложку ───────────────────────────────────
        if action == 'delete_profile_photo':
            user_id = body.get('user_id')
            photo_url = body.get('photo_url')
            photo_type = body.get('photo_type', 'gallery')  # 'gallery' | 'cover'
            if not user_id or not photo_url:
                return resp(400, {'error': 'user_id и photo_url обязательны'})
            if photo_type == 'cover':
                cur.execute("UPDATE users SET cover_url = NULL WHERE id = %s AND cover_url = %s", (user_id, photo_url))
            else:
                cur.execute("DELETE FROM profile_photos WHERE user_id = %s AND photo_url = %s", (user_id, photo_url))
            audit(cur, 'admin_delete_photo', 'warning', ip=ip, user_id=user_id, details={'photo_type': photo_type, 'photo_url': photo_url})
            conn.commit()
            return resp(200, {'ok': True})

        # ── Отправить предупреждение пользователю от Полутон ───────────────
        if action == 'send_warning':
            user_id = body.get('user_id')
            warning_text = body.get('text', '').strip()
            if not user_id or not warning_text:
                return resp(400, {'error': 'user_id и text обязательны'})

            # Ищем системный аккаунт Полутон по email, при отсутствии — создаём
            LBLOOM_EMAIL = 'system@lbloom.ru'
            LBLOOM_PHOTO = 'https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/9a554cba-69a8-400b-aa59-3cdbaf1dc299.jpg'
            cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (LBLOOM_EMAIL,))
            sys_row = cur.fetchone()
            if not sys_row:
                cur.execute(
                    "INSERT INTO users (name, email, password_hash, photo_url, verified) "
                    "VALUES ('Полутон', %s, 'system_no_login', %s, TRUE) RETURNING id",
                    (LBLOOM_EMAIL, LBLOOM_PHOTO)
                )
                sys_row = cur.fetchone()
            system_id = sys_row[0] if sys_row else None

            msg_id = None
            if system_id and system_id != user_id:
                cur.execute(
                    "SELECT id FROM matches WHERE (user1_id = %s AND user2_id = %s) OR (user1_id = %s AND user2_id = %s) LIMIT 1",
                    (system_id, user_id, user_id, system_id)
                )
                match_row = cur.fetchone()
                if match_row:
                    match_id = match_row[0]
                else:
                    cur.execute("INSERT INTO matches (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (system_id, user_id))
                    match_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO messages (match_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id",
                    (match_id, system_id, warning_text)
                )
                row = cur.fetchone()
                msg_id = row[0] if row else None

            # Уведомление в колокольчик
            cur.execute(
                "INSERT INTO notifications (user_id, type, from_user_id, read, text) "
                "VALUES (%s, 'admin_warning', NULL, FALSE, %s) RETURNING id",
                (user_id, warning_text[:300])
            )
            notif_row = cur.fetchone()
            notif_id = notif_row[0] if notif_row else None

            audit(cur, 'admin_warning_sent', 'info', ip=ip, user_id=user_id, details={'text': warning_text[:200]})
            conn.commit()

            try:
                _push_to_user(cur, conn, user_id, '⚠️ Предупреждение от Полутон', warning_text[:100], '/')
            except Exception:
                pass

            return resp(200, {'ok': True, 'msg_id': msg_id, 'notif_id': notif_id})

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    finally:
        conn.close()