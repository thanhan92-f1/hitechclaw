# OpenClaw v2 — VPS Management (Bare-metal)

Deploy and manage [OpenClaw](https://github.com/openclaw/openclaw) on a VPS **without Docker**. Install directly via npm, use Caddy as a reverse proxy, manage services with systemd, and manage remotely via REST Management API.

## Features

- **One-command installation** — Installs Node.js 24, OpenClaw, Caddy, firewall, and fail2ban automatically
- **No Docker required** — Runs directly on the OS, saving 200–500MB RAM
- **Management API** — REST API (port 9998) for remote management
- **22+ AI Providers** — Anthropic, OpenAI, Gemini, DeepSeek, ... plus custom providers
- **ChatGPT OAuth** — Integrates OpenAI Codex via OAuth2 PKCE, with auto token refresh
- **Multi-agent** — Multiple agents each with their own model & API key, routed by channel
- **Messaging channels** — Telegram, Discord, Slack, Zalo OA
- **Automatic SSL** — ACME via Caddy (Let’s Encrypt primary, ZeroSSL fallback), or self-signed for IP addresses
- **Device pairing** — Auto-approve via file I/O (near instant)

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/Pho-Tue-SoftWare-Solutions-JSC/cloud-server-open-claw-management/main/install.sh | \
  bash -s -- --domain <DOMAIN_NAME> [--email <EMAIL>] [--mgmt-key <KEY>]
```

| Option       | Description                                               |
|--------------|----------------------------------------------------------|
| `--domain`   | Domain name with DNS pointed to VPS (enables SSL)        |
| `--email`    | Optional email for ACME registration and SSL notices     |
| `--mgmt-key` | API key for Management API (auto-generated if omitted)   |

### After Installation

```
Dashboard: http://<IP>:9998/pair?token=<GATEWAY_TOKEN>
Management API: http://<IP>:9998
MGMT API Key: <MGMT_KEY>
```

## Architecture

```
Internet
  │
  ├── :80/:443 ──► Caddy (systemd — reverse proxy + SSL)
  │                  │
  │                  ├── /login, /api/auth/* ──► Management API (:9998)
  │                  └── /* ──► OpenClaw Gateway (:18789)
  │
  └── :9998 ────► Management API (systemd — Node.js)
```

All services run directly on the OS and are managed with **systemd**:

| Service             | Binary            | Port     | Description                   |
|---------------------|-------------------|----------|-------------------------------|
| `openclaw.service`  | `openclaw` (npm)  | 18789    | AI Gateway + Control UI       |
| `caddy.service`     | `caddy` (apt)     | 80, 443  | Reverse proxy + SSL           |
| `openclaw-mgmt.service` | `node server.js` | 9998    | Management REST API           |

### Directory Structure on VPS

```
/opt/openclaw/                     # Main directory
├── .env                           # Token, API key, domain config
├── .openclaw -> config/           # Symlink (OpenClaw reads config from here)
├── Caddyfile                      # Caddy config (uses env vars)
├── config/
│   ├── openclaw.json              # Active configuration
│   ├── devices/
│   │   ├── pending.json           # Devices awaiting approval
│   │   └── paired.json            # Paired devices
│   └── agents/<agentId>/agent/
│       └── auth-profiles.json     # API key + OAuth token
└── data/                          # Persistent data

/opt/openclaw-mgmt/server.js       # Management API
/etc/openclaw/config/              # Template configs (read-only)
```

## Operations

### Check Status

```bash
systemctl status openclaw caddy openclaw-mgmt

# Via API
MGMT_KEY=$(grep OPENCLAW_MGMT_API_KEY /opt/openclaw/.env | cut -d= -f2)
curl -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/status
```

### View Logs

```bash
journalctl -u openclaw -f                    # OpenClaw realtime logs
journalctl -u caddy -f                       # Caddy realtime logs
journalctl -u openclaw-mgmt -f               # Management API logs
journalctl -u openclaw --no-pager -n 100     # Last 100 log lines
```

### Restart / Stop / Start

```bash
systemctl restart openclaw       # Or: curl -X POST ... /api/restart
systemctl stop openclaw          # Or: curl -X POST ... /api/stop
systemctl start openclaw         # Or: curl -X POST ... /api/start
```

### Update OpenClaw

```bash
npm update -g openclaw@latest && systemctl restart openclaw

# Or via API
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/upgrade
```

### Update Management API

```bash
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://localhost:9998/api/self-update
```

### Run CLI Commands

```bash
HOME=/opt/openclaw openclaw <command>

# Or via API
curl -X POST -H "Authorization: Bearer $MGMT_KEY" -H "Content-Type: application/json" \
  -d '{"command":"models scan"}' http://localhost:9998/api/cli
```

## Management API

**Endpoint**: `http://<IP>:9998`  
**Authentication**: `Authorization: Bearer <OPENCLAW_MGMT_API_KEY>`

Additional docs:
- Quick start guide: `docs/quickstart.md`
- VPS operations guide: `docs/quan-ly-vps.md`
- Detailed configuration: `docs/cau-hinh.md`
- Update guide: `docs/update-guide.md`
- Terminal integration: `docs/terminal-integration.md`
- Full reference: `docs/api-reference.md`
- Latest docs parity changelog: `docs/CHANGELOG-docs-api-parity-2026-03-28.md`

### Public (no auth required)

| Method | Endpoint               | Description                                         |
|--------|------------------------|-----------------------------------------------------|
| `GET`  | `/pair?token=xxx`      | Enable auto device-approval + redirect to gateway   |
| `GET`  | `/login`               | Login page                                          |
| `GET`  | `/terminal`            | Web terminal UI                                     |

### Info & Status

| Method | Endpoint         | Description                                |
|--------|------------------|--------------------------------------------|
| `GET`  | `/api/info`      | Domain, IP, token, status, version, issuer state |
| `GET`  | `/api/status`    | OpenClaw + Caddy status                    |
| `GET`  | `/api/openclaw/status` | Upstream `openclaw status` summary / diagnostics |
| `GET`  | `/api/version`   | OpenClaw version                           |
| `GET`  | `/api/system`    | CPU, RAM, disk, versions                   |
| `GET`  | `/api/system/heartbeat/last` | Latest upstream heartbeat event |
| `POST` | `/api/system/heartbeat/enable` | Enable upstream heartbeats |
| `POST` | `/api/system/heartbeat/disable` | Disable upstream heartbeats |
| `GET`  | `/api/system/presence` | Upstream presence summary |
| `GET`  | `/api/logs`      | Logs (`?lines=100&service=openclaw`)       |
| `GET`  | `/api/domain`    | Domain + SSL info, ACME email, issuer      |
| `GET`  | `/api/domain/preflight` | ACME readiness check + diagnostic hints + issue classification |
| `GET`  | `/api/domain/preflight/live` | Live port 80/443 and HTTP/HTTPS reachability + issue classification |
| `GET`  | `/api/domain/issuer` | Live SSL issuer state + ACME diagnostics + issue classification |

### Service Control

| Method  | Endpoint         | Description                                         |
|---------|------------------|-----------------------------------------------------|
| `POST`  | `/api/restart`   | Restart OpenClaw                                   |
| `POST`  | `/api/stop`      | Stop OpenClaw                                      |
| `POST`  | `/api/start`     | Start OpenClaw                                     |
| `POST`  | `/api/rebuild`   | Restart OpenClaw and Caddy                         |
| `POST`  | `/api/upgrade`   | `npm update -g openclaw` + restart                 |
| `POST`  | `/api/reset`     | Factory reset (`{"confirm":"RESET"}`)              |
| `POST`  | `/api/self-update` | Update Management API from GitHub                |
| `PUT`   | `/api/domain`    | Change domain (Caddy auto-provisions ACME SSL, optional email or email reset) |

### Nodes, Secrets, Security & Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/nodes/status` | Upstream node fleet summary |
| `GET`  | `/api/nodes` | List nodes via upstream CLI |
| `GET`  | `/api/nodes/:id` | Describe one node |
| `POST` | `/api/secrets/reload` | Reload secret sources |
| `GET`  | `/api/secrets/audit` | Audit secret references and checks |
| `GET`  | `/api/security/audit` | Run upstream security audit |
| `GET`  | `/api/skills/search` | Search available skills |
| `GET`  | `/api/skills/check` | Validate skill readiness |

### AI Providers & Models

| Method | Endpoint                | Description                           |
|--------|-------------------------|---------------------------------------|
| `GET`  | `/api/providers`        | List 22+ providers & models           |
| `GET`  | `/api/config`           | Current config (model, provider, keys masked) |
| `PUT`  | `/api/config/provider`  | Change provider & model               |
| `PUT`  | `/api/config/api-key`   | Set API key                           |
| `POST` | `/api/config/test-key`  | Test API key                          |

```bash
# Switch to DeepSeek
curl -X PUT -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","model":"deepseek/deepseek-chat"}' \
  http://localhost:9998/api/config/provider

# Set API key
curl -X PUT -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"provider":"deepseek","apiKey":"sk-xxx"}' \
  http://localhost:9998/api/config/api-key
```

22 supported providers: `anthropic`, `openai`, `openai-codex`, `google`, `deepseek`, `groq`, `together`, `mistral`, `xai`, `cerebras`, `sambanova`, `fireworks`, `cohere`, `yi`, `baichuan`, `stepfun`, `siliconflow`, `novita`, `openrouter`, `minimax`, `moonshot`, `zhipu`

### Custom Providers

| Method | Endpoint                           | Description                                    |
|--------|------------------------------------|------------------------------------------------|
| `POST` | `/api/config/custom-provider`      | Create custom (OpenAI-compatible) provider     |
| `GET`  | `/api/config/custom-providers`     | List custom providers                          |
| `PUT`  | `/api/config/custom-provider/:p`   | Update (add model/change endpoint or key)      |
| `DELETE` | `/api/config/custom-provider/:p` | Delete custom provider                         |

```bash
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"baseUrl":"https://api.example.com/v1","model":"myprovider/my-model","apiKey":"sk-xxx"}' \
  http://localhost:9998/api/config/custom-provider
```

### ChatGPT OAuth (OpenAI Codex)

| Method | Endpoint                                | Description              |
|--------|-----------------------------------------|--------------------------|
| `POST` | `/api/config/chatgpt-oauth/start`       | Initiate flow — OAuth URL|
| `POST` | `/api/config/chatgpt-oauth/complete`    | Complete with redirect URL|
| `POST` | `/api/config/chatgpt-oauth/refresh`     | Manually refresh token   |
| `GET`  | `/api/config/chatgpt-oauth/status`      | Token status             |

Token auto-refreshes every 5 minutes if less than 10 minutes left.

### Multi-Agent

| Method   | Endpoint                         | Description                     |
|----------|----------------------------------|---------------------------------|
| `GET`    | `/api/agents`                    | List agents                     |
| `POST`   | `/api/agents`                    | Create agent (`{"id","name","model"}`) |
| `GET`    | `/api/agents/:id`                | Agent details                   |
| `PUT`    | `/api/agents/:id`                | Update agent                    |
| `DELETE` | `/api/agents/:id`                | Delete agent                    |
| `PUT`    | `/api/agents/:id/default`        | Set as default                  |
| `GET`    | `/api/agents/:id/api-key`        | View agent API keys (masked)    |
| `PUT`    | `/api/agents/:id/api-key`        | Set API key for agent           |

### Routing Bindings

| Method   | Endpoint                                | Description           |
|----------|-----------------------------------------|-----------------------|
| `GET`    | `/api/bindings`                         | List bindings         |
| `POST`   | `/api/bindings`                         | Create binding        |
| `PUT`    | `/api/bindings/:index`                  | Update binding        |
| `DELETE` | `/api/bindings/:index`                  | Delete binding        |

### Messaging Channels

| Method   | Endpoint                         | Description                |
|----------|----------------------------------|----------------------------|
| `GET`    | `/api/channels`                  | List channels              |
| `PUT`    | `/api/channels/:name`            | Add/update channel         |
| `DELETE` | `/api/channels/:name`            | Delete channel             |

Supported: `telegram`, `discord`, `slack`, `zalo`

### User Authentication

| Method   | Endpoint                         | Description            |
|----------|----------------------------------|------------------------|
| `GET`    | `/login`                         | Login page (public)    |
| `POST`   | `/api/auth/login`                | Login → gateway token  |
| `POST`   | `/api/auth/create-user`          | Create user            |
| `GET`    | `/api/auth/user`                 | View account           |
| `PUT`    | `/api/auth/change-password`      | Change password        |
| `DELETE` | `/api/auth/user`                 | Delete account         |

### Environment Variables & Devices

| Method   | Endpoint             | Description                         |
|----------|----------------------|-------------------------------------|
| `GET`    | `/api/env`           | List env vars (masked)              |
| `PUT`    | `/api/env/:key`      | Set value                           |
| `DELETE` | `/api/env/:key`      | Delete variable                     |
| `GET`    | `/api/devices`       | List devices                        |
| `POST`   | `/api/cli`           | Run CLI command (`{"command":"..."}`) |

## Troubleshooting

### Service Won’t Start

```bash
journalctl -u openclaw --no-pager -n 50      # Check errors
systemctl restart openclaw                   # Try restarting
HOME=/opt/openclaw openclaw gateway --port 18789 --allow-unconfigured  # Run manually
```

### SSL Not Working

```bash
journalctl -u caddy --no-pager -n 50          # Check Caddy errors
dig +short <DOMAIN>                           # Check DNS
grep DOMAIN /opt/openclaw/.env                # Check config
systemctl restart caddy                       # Restart Caddy
```

### Device Pairing Slow/Not Working

```bash
cat /opt/openclaw/config/devices/pending.json  # Any pending devices?
cat /opt/openclaw/config/devices/paired.json   # Any paired devices?

# Reset pairing
echo '{}' > /opt/openclaw/config/devices/paired.json
echo '{}' > /opt/openclaw/config/devices/pending.json
systemctl restart openclaw
```

## Security

- Gateway token & MGMT API key: 64-character hex (`openssl rand -hex 32`)
- UFW: only open ports 80, 443, 9998, SSH
- fail2ban: brute-force protection
- Rate limiting: 10 failed login attempts → 15-minute lockout
- API keys always masked in GET responses
- Device pairing: each device must be approved

## License

Private repository. Internal use only.