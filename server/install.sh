#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR/server"

echo ">>> Ставлю Python и зависимости"
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip libpq5 >/dev/null

python3 -m venv "$APP_DIR/server/venv"
"$APP_DIR/server/venv/bin/pip" install -q --upgrade pip
"$APP_DIR/server/venv/bin/pip" install -q -r "$APP_DIR/server/requirements.txt"

if [ ! -f "$APP_DIR/server/.env" ]; then
  cp "$APP_DIR/server/env.example" "$APP_DIR/server/.env"
  echo ">>> Создан файл server/.env — заполни его и запусти скрипт ещё раз"
fi

echo ">>> Создаю службу poluton-api"
cat > /etc/systemd/system/poluton-api.service <<EOF
[Unit]
Description=Poluton API
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=$APP_DIR/server
EnvironmentFile=$APP_DIR/server/.env
ExecStart=$APP_DIR/server/venv/bin/gunicorn -w 4 -b 127.0.0.1:8080 -t 120 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable poluton-api >/dev/null 2>&1
systemctl restart poluton-api

sleep 3
echo ">>> Проверка:"
curl -s http://127.0.0.1:8080/health || echo "не отвечает — смотри: journalctl -u poluton-api -n 50"
echo
