# Deploy — Mars Colony Manager

Static Vite SPA. Production output is `dist/`. **No backend, no env secrets, no database.**

Canonical production host: **https://mars.job-joseph.com** (self-host on jobpi).

---

## Primary path — jobpi self-host

| Item | Value |
|------|--------|
| Hostname | **mars.job-joseph.com** |
| Machine | **jobpi** (`jcube`) |
| Repo path | `~/projects/mars-colony-manager` |
| Internal bind | **127.0.0.1:8018** only |
| Public HTTPS | Cloudflare Tunnel **pi-home** → `http://localhost:8018` |
| Dev (Windows) | `http://localhost:3004` (unchanged) |
| Vite `base` | `'./'` (relative assets; works at domain root) |

### Architecture

```
Browser → https://mars.job-joseph.com
       → Cloudflare Tunnel (pi-home)
       → http://127.0.0.1:8018  (systemd static serve of dist/)
```

Port **8018** is never exposed on LAN or the public internet. Only the tunnel talks to localhost.

### One-time setup (jobpi)

1. **Clone** (if missing):

   ```bash
   ssh jobpi   # Tailscale: jobpi / jobpi.tailad79e4.ts.net
   cd ~/projects
   git clone https://github.com/Jcube101/mars-colony-manager.git
   cd mars-colony-manager
   ```

2. **Build**:

   ```bash
   npm ci
   npm run build
   # requires Node 20+ on the Pi (jobpi has Node 22)
   ```

3. **Systemd unit** (preferred: user unit — no root; Linger is enabled for jcube):

   ```bash
   mkdir -p ~/.config/systemd/user
   cp deploy/mars-colony-manager.user.service \
     ~/.config/systemd/user/mars-colony-manager.service
   systemctl --user daemon-reload
   systemctl --user enable --now mars-colony-manager.service
   systemctl --user status mars-colony-manager.service
   curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8018/
   ```

   Optional system-wide unit (needs sudo once): install
   `deploy/mars-colony-manager.service` → `/etc/systemd/system/`, then
   `daemon-reload` / `enable --now`. Same bind: **127.0.0.1:8018**.

   Optional Nginx SPA config: `deploy/nginx-mars-colony-manager.conf`
   (listen **127.0.0.1:8018**). Disable the Python unit if you switch.

4. **Cloudflare Tunnel** — edit `~/.cloudflared/config.yml`, add **before** the catch-all:

   ```yaml
     - hostname: mars.job-joseph.com
       service: http://localhost:8018
   ```

   DNS + sync + restart (use exact paths for passwordless sudo on jobpi):

   ```bash
   cloudflared tunnel route dns pi-home mars.job-joseph.com
   sudo /bin/cp /home/jcube/.cloudflared/config.yml /etc/cloudflared/config.yml
   sudo /usr/bin/systemctl restart cloudflared
   # or: bash scripts/setup-cloudflare-mars.sh
   ```

   Wait ~30s, then from any machine:

   ```bash
   curl -fsS -o /dev/null -w "%{http_code}\n" https://mars.job-joseph.com/
   ```

### Update / redeploy (recurring)

From a green **`main`** (or set `MCM_BRANCH`):

```bash
ssh jobpi
bash ~/projects/mars-colony-manager/scripts/deploy-jobpi.sh
```

Manual equivalent:

```bash
cd ~/projects/mars-colony-manager
git pull --ff-only origin main
npm ci
npm run build
systemctl --user restart mars-colony-manager.service
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8018/
```

No Cloudflare change on routine deploys.

### Verification checklist

| Check | Command / action |
|-------|------------------|
| Local on Pi | `curl -I http://127.0.0.1:8018/` → 200 |
| Public HTTPS | `curl -I https://mars.job-joseph.com/` → 200 |
| Assets | Browser network: JS/CSS under `/assets/` load |
| Smoke play | Load game → new run → report UI works |
| Service | `systemctl --user status mars-colony-manager` active |

### Build on Windows, rsync dist (alternative)

If Pi Node is unavailable:

```powershell
# on Windows, repo root
npm ci
npm run build
scp -r dist jobpi:~/projects/mars-colony-manager/
ssh jobpi "systemctl --user restart mars-colony-manager.service"
```

Prefer **build on Pi** so production matches aarch64/Node on the host.

---

## Secondary — itch.io / GitHub Pages (optional)

Not the default. Use only if you want an extra public copy.

### Local production check

```bash
npm install
npm test
npm run build
npm run preview   # http://localhost:3004
```

`vite.config.ts` uses `base: './'` so asset paths work from itch zip folders and most static hosts.

### itch.io (HTML5)

1. `npm run build`
2. Zip the **contents** of `dist/` (not the parent folder), or zip `dist` and point itch at `index.html` inside.
3. itch project → **HTML** / playable in browser → upload zip.
4. Set “This file will be played in the browser”.

### GitHub Pages (optional)

1. Build with `npm run build`.
2. Publish `dist/` via Actions or `gh-pages` branch.
3. If the site is at `https://user.github.io/repo/`, you may need `base: '/repo/'` in `vite.config.ts` instead of `./` — only change if Pages path requires it. Canonical host uses domain root, so leave `base: './'`.

---

## What not to ship

- No secrets (there are none).
- Debug tools only when `?debug=1` — fine for prototype.
- Ambient audio starts **off** (user gesture / toggle).
- Do **not** bind production static serve to `0.0.0.0`.

## Version

See `package.json` version (prototype series `0.7.x` = Phase 7 polish; Phase 8 is ops/host only).
