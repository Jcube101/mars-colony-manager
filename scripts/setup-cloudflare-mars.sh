#!/usr/bin/env bash
# One-time Cloudflare Tunnel setup for mars.job-joseph.com on jobpi.
set -euo pipefail

CFG="${HOME}/.cloudflared/config.yml"
HOST="mars.job-joseph.com"
PORT=8018

if [[ ! -f "$CFG" ]]; then
  echo "ERROR: missing $CFG" >&2
  exit 1
fi

cp "$CFG" "${CFG}.bak-mcm"

if grep -q "hostname: ${HOST}" "$CFG"; then
  echo "ingress already present for ${HOST}"
else
  python3 - <<PY
from pathlib import Path
p = Path.home() / ".cloudflared" / "config.yml"
text = p.read_text()
rule = "  - hostname: mars.job-joseph.com\n    service: http://localhost:8018\n"
marker = "  - service: http_status:404"
if "hostname: mars.job-joseph.com" in text:
    print("already present")
elif marker not in text:
    raise SystemExit("catch-all marker not found")
else:
    p.write_text(text.replace(marker, rule + marker, 1))
    print("ingress added")
PY
fi

echo "--- ingress hosts ---"
grep -E 'hostname:|service:' "$CFG" || true

echo "--- DNS route ---"
cloudflared tunnel route dns pi-home "$HOST" || true

echo "--- sync + restart cloudflared ---"
# Exact paths match jobpi NOPASSWD sudoers entries
sudo /bin/cp /home/jcube/.cloudflared/config.yml /etc/cloudflared/config.yml
sudo /usr/bin/systemctl restart cloudflared
sleep 2
# status may require a password on some hosts; restart is enough if HTTPS works
sudo /usr/bin/systemctl status cloudflared --no-pager 2>/dev/null | head -25 || true

echo "Done. Verify: curl -I https://${HOST}/"
