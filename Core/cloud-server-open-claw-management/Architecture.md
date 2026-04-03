# OpenClaw v2 — Bare-metal Deployment

## Architecture

```
Internet
  │
  ▼
┌─────────────────────────────────┐
│  Caddy (systemd)                │  Port 80/443
│  - Reverse proxy                │  ACME auto SSL (LE -> ZeroSSL)
│  - /login, /api/auth/* → :9998  │
│  - /* → :18789                  │
└──────────┬──────────────────────┘
           │
     ┌─────┴─────────────────────┐
     ▼                           ▼
┌────────────────┐    ┌──────────────────────┐
│ OpenClaw       │    │ Management API       │
│ (systemd)      │    │ (systemd)            │
│ Port 18789     │    │ Port 9998            │
│ Gateway +      │    │ REST management API  │
│ Control UI     │    │ Device auto-approve  │
└────────────────┘    └──────────────────────┘
```

**No Docker.** Everything runs bare-metal on the OS, managed with systemd.

## Components

| Component      | Binary               | Service                | Port     | Purpose                          |
|----------------|----------------------|------------------------|----------|----------------------------------|
| OpenClaw       | `openclaw` (npm global) | `openclaw.service`    | 18789    | AI Gateway + Control UI          |
| Caddy          | `caddy` (apt)        | `caddy.service`        | 80, 443  | Reverse proxy + SSL              |
| Management API | `node server.js`     | `openclaw-mgmt.service`| 9998     | Remote REST management API       |

## Key Directories & Files

```
/opt/openclaw/                     # Main directory
├── .env                           # All config (tokens, keys, domain)
├── .openclaw -> config/           # Symlink — OpenClaw reads config here
├── Caddyfile                      # Caddy config (env vars from .env)
/opt/openclaw/config/
│   ├── openclaw.json              # Main config (model, provider, gateway)
│   ├── devices/
│   │   ├── pending.json           # Devices waiting for approval
│   │   └── paired.json            # Paired devices
│   └── agents/                    # Multi-agent data
│       └── <agentId>/agent/
│           └── auth-profiles.json # Agent-specific API keys
└── data/                          # OpenClaw data

/opt/openclaw-mgmt/
└── server.js                      # Management API source

/etc/openclaw/config/              # Read-only config templates (do not edit)
├── anthropic.json
├── openai.json
├── deepseek.json
└── ...                            # 20+ providers

/etc/systemd/system/
├── openclaw.service               # OpenClaw service
├── openclaw-mgmt.service          # Management API service
└── caddy.service.d/
    └── override.conf              # Caddy override (read .env + Caddyfile)
```

## Fresh Install

```bash
curl -fsSL https://raw.githubusercontent.com/Pho-Tue-SoftWare-Solutions-JSC/cloud-server-open-claw-management/main/install.sh | \
  bash -s -- --domain <DOMAIN> [--email <EMAIL>] [--mgmt-key <KEY>]
```

Install process:
1. Update OS, install `jq`, `ufw`, `fail2ban`
2. Install Node.js 24, `npm install -g openclaw@latest`
3. Install Caddy via apt
4. Generate tokens, create `.env`
5. Create and start systemd services
6. Auto-approve devices
7. Install Management API

After installation, output:
- **Dashboard URL** (pair URL): `http://<IP>:9998/pair?token=<TOKEN>`
- **MGMT API Key**: used for Management API requests

## Daily Operations

### Check Status

```bash
# Service status
systemctl status openclaw
systemctl status caddy
systemctl status openclaw-mgmt

# Or via API
MGMT_KEY=$(grep OPENCLAW_MGMT_API_KEY /opt/openclaw/.env | cut -d= -f2)
curl -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/status
```

### View Logs

```bash
# OpenClaw logs
journalctl -u openclaw -f                    # Realtime
journalctl -u openclaw --no-pager -n 100     # Last 100 lines

# Caddy logs
journalctl -u caddy -f

# Management API logs
journalctl -u openclaw-mgmt -f

# Or via API
curl -H "Authorization: Bearer $MGMT_KEY" "http://localhost:9998/api/logs?lines=100"
curl -H "Authorization: Bearer $MGMT_KEY" "http://localhost:9998/api/logs?service=caddy&lines=50"
```

### Restart / Stop / Start

```bash
# Directly
systemctl restart openclaw
systemctl stop openclaw
systemctl start openclaw

# Or via API
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/restart
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/stop
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/start
```

### Update OpenClaw

```bash
npm update -g openclaw@latest && systemctl restart openclaw

# Or via API
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/upgrade
```

### Update Management API

```bash
# Automatic (fetch latest server.js + config templates from GitHub)
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/self-update

# Manual
curl -fsSL https://raw.githubusercontent.com/Pho-Tue-SoftWare-Solutions-JSC/cloud-server-open-claw-management/main/management-api/server.js \
  -o /opt/openclaw-mgmt/server.js
systemctl restart openclaw-mgmt
```

### Change Domain

```bash
curl -X PUT -H "Authorization: Bearer $MGMT_KEY" -H "Content-Type: application/json" \
  -d '{"domain":"new.example.com","email":"admin@example.com"}' \
  http://localhost:9998/api/domain
```
Caddy will auto-provision ACME SSL (Let's Encrypt, fallback ZeroSSL). If provided, the email is used for ACME registration and notices. If DNS not set correctly, it will use a self-signed cert.

### Change Model / Provider

```bash
# Change provider + model
curl -X PUT -H "Authorization: Bearer $MGMT_KEY" -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","model":"deepseek/deepseek-chat"}' \
  http://localhost:9998/api/config/provider

# Set API key
curl -X PUT -H "Authorization: Bearer $MGMT_KEY" -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","apiKey":"sk-xxx"}' \
  http://localhost:9998/api/config/api-key
```

### Reset (wipe data and start fresh)

```bash
curl -X POST -H "Authorization: Bearer $MGMT_KEY" -H "Content-Type: application/json" \
  -d '{"confirm":"RESET"}' \
  http://localhost:9998/api/reset
```

## Troubleshooting

### OpenClaw will not start

```bash
# Check logs
journalctl -u openclaw --no-pager -n 50

# Check config validity
cat /opt/openclaw/config/openclaw.json | jq .

# Check port
ss -tlnp | grep 18789

# Try manual start
HOME=/opt/openclaw openclaw gateway --port 18789 --allow-unconfigured
```

### Caddy SSL errors

```bash
# Check logs
journalctl -u caddy --no-pager -n 50

# Check DNS
dig +short <DOMAIN>   # Should return the VPS IP

# Check Caddyfile
cat /opt/openclaw/Caddyfile

# Check env
grep DOMAIN /opt/openclaw/.env
grep CADDY_TLS /opt/openclaw/.env

# Restart caddy
systemctl restart caddy
```

### Management API not running

```bash
journalctl -u openclaw-mgmt --no-pager -n 50

# Check port
ss -tlnp | grep 9998

# Manual run
node /opt/openclaw-mgmt/server.js
```

### Device pairing not working

Pairing flow:
1. User opens pair URL → Management API polls for 60s
2. Polls `pending.json` every 2s
3. When pending device is added → written to `paired.json` & removed from `pending.json`
4. Gateway reads `paired.json` → accepts device

```bash
# Check pending
cat /opt/openclaw/config/devices/pending.json | jq .

# Check paired
cat /opt/openclaw/config/devices/paired.json | jq 'keys'

# Wipe all devices (force re-pair)
echo '{}' > /opt/openclaw/config/devices/paired.json
echo '{}' > /opt/openclaw/config/devices/pending.json
systemctl restart openclaw
```

### Check RAM / CPU

```bash
free -h
ps aux --sort=-%mem | head -10
curl -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/system
```

## Management API — Endpoint List

### Public (no auth)

| Method | Path                 | Description                                   |
|--------|----------------------|-----------------------------------------------|
| `GET`  | `/pair?token=xxx`    | Enable device auto-approve + redirect to gateway |
| `GET`  | `/login`             | Login page                                    |
| `GET`  | `/terminal`          | Terminal web UI                               |

### Protected (requires `Authorization: Bearer <MGMT_KEY>`)

**Info & Status**

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| `GET`  | `/api/info`     | Domain, IP, token, status, version, issuer state |
| `GET`  | `/api/status`   | OpenClaw + caddy status                  |
| `GET`  | `/api/version`  | OpenClaw version                         |
| `GET`  | `/api/system`   | RAM, CPU, disk, versions                 |
| `GET`  | `/api/logs`     | Logs (query: `?lines=100&service=openclaw`) |
| `GET`  | `/api/domain`   | Domain + SSL info, ACME email, issuer   |
| `GET`  | `/api/domain/preflight` | ACME readiness check + diagnostic hints + issue classification |
| `GET`  | `/api/domain/preflight/live` | Live port 80/443 and HTTP/HTTPS reachability + issue classification |
| `GET`  | `/api/domain/issuer` | Live SSL issuer state + ACME diagnostics + issue classification |

**Service Control**

| Method | Path                    | Description                                 |
|--------|-------------------------|---------------------------------------------|
| `POST` | `/api/restart`          | Restart OpenClaw                            |
| `POST` | `/api/stop`             | Stop OpenClaw                               |
| `POST` | `/api/start`            | Start OpenClaw                              |
| `POST` | `/api/rebuild`          | Restart openclaw + caddy                    |
| `POST` | `/api/reset`            | Wipe data, start fresh (needs `{"confirm":"RESET"}`) |
| `POST` | `/api/upgrade`          | `npm update -g openclaw` + restart          |
| `POST` | `/api/self-update`      | Update Management API from GitHub           |
| `PUT`  | `/api/domain`           | Change domain and optional/resettable ACME email |

**Config & Provider**

| Method | Path                        | Description                         |
|--------|-----------------------------|-------------------------------------|
| `GET`  | `/api/config`               | View config (model, provider, keys masked) |
| `GET`  | `/api/providers`            | List 20+ built-in providers         |
| `PUT`  | `/api/config/provider`      | Change provider + model             |
| `PUT`  | `/api/config/api-key`       | Set API key                         |
| `POST` | `/api/config/test-key`      | Test API key                        |
| `POST` | `/api/config/custom-provider` | Create custom provider            |
| `GET`  | `/api/config/custom-providers` | List custom providers            |
| `PUT`  | `/api/config/custom-provider/:p` | Update custom provider          |
| `DELETE` | `/api/config/custom-provider/:p` | Delete custom provider         |

**Multi-Agent**

| Method | Path                      | Description                            |
|--------|---------------------------|----------------------------------------|
| `GET`  | `/api/agents`             | List agents                            |
| `POST` | `/api/agents`             | Create agent (`{"id","name","model"}`) |
| `GET`  | `/api/agents/:id`         | Agent detail                           |
| `PUT`  | `/api/agents/:id`         | Update agent                           |
| `DELETE` | `/api/agents/:id`       | Delete agent                           |
| `PUT`  | `/api/agents/:id/default` | Set default agent                      |
| `GET`  | `/api/agents/:id/api-key` | View API keys (masked)                 |
| `PUT`  | `/api/agents/:id/api-key` | Set API key for agent                  |

**Routing Bindings**

| Method | Path                        | Description                           |
|--------|-----------------------------|---------------------------------------|
| `GET`  | `/api/bindings`             | List bindings                         |
| `POST` | `/api/bindings`             | Create binding (`{"agentId","match":{"channel":"telegram"}}`) |
| `PUT`  | `/api/bindings/:index`      | Update binding                        |
| `DELETE` | `/api/bindings/:index`    | Delete binding                        |

**Authentication (Login)**

| Method | Path                     | Description                |
|--------|--------------------------|----------------------------|
| `POST` | `/api/auth/login`        | Login (public)             |
| `POST` | `/api/auth/create-user`  | Create user (`{"username","password"}`)|
| `GET`  | `/api/auth/user`         | Current user info          |
| `PUT`  | `/api/auth/change-password` | Change password         |
| `DELETE` | `/api/auth/user`       | Delete user                |

**Channels & Environment**

| Method | Path                       | Description                         |
|--------|----------------------------|-------------------------------------|
| `GET`  | `/api/channels`            | List messaging channels             |
| `PUT`  | `/api/channels/:ch`        | Add/edit channel                    |
| `DELETE` | `/api/channels/:ch`      | Delete channel                      |
| `GET`  | `/api/env`                 | List env vars                       |
| `PUT`  | `/api/env/:key`            | Set env var                         |
| `DELETE` | `/api/env/:key`          | Delete env var                      |
| `GET`  | `/api/devices`             | List devices                        |
| `POST` | `/api/cli`                 | Run CLI (`{"command":"models scan"}`) |

## Security

- **Gateway token**: 64-hex characters, stored in `.env` — used for Control UI access
- **MGMT API key**: 64-hex characters — for Management API
- **UFW**: Only open ports 80, 443, 9998, and SSH
- **fail2ban**: SSH brute-force protection
- **Caddy**: Automatic SSL (ACME: Let's Encrypt, fallback ZeroSSL, or self-signed)
- **Device pairing**: Each connecting device must be approved

## Conventions

- Tokens: `openssl rand -hex 32`
- Config templates: `/etc/openclaw/config/` (do not edit)
- Current config: `/opt/openclaw/config/openclaw.json`
- **Never** store API keys/tokens in git
- Branch `v2` for bare-metal, `main` for Docker (legacy)