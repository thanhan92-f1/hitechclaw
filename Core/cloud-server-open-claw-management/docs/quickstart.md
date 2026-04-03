# Quick Start with OpenClaw

## Table of Contents

- [1. Device Pairing](#1-device-pairing)
- [2. Add AI Provider API Key](#2-add-ai-provider-api-key)
- [3. Send Your First Message](#3-send-your-first-message)
- [4. Change AI Model](#4-change-ai-model)
- [5. VPS Directory Structure](#5-vps-directory-structure)
- [6. Basic Management Commands](#6-basic-management-commands)
- [7. Next Steps](#7-next-steps)
- [8. Useful Follow-up API Checks](#8-useful-follow-up-api-checks)

---

## 1. Device Pairing

After your VPS is installed, pair your device via browser:

```
http://<IP>:9998/pair?token=<gateway-token>
```

**Example:**
- `http://180.93.138.155:9998/pair?token=abc123...`

**Pairing information** is available in the my.hitechcloud.vn control panel:
- **Gateway Token** — use for pairing devices
- **Management API Key** — issued and managed by my.hitechcloud.vn, and used by the panel to connect to your VPS

> **Important:** Do **not** manually change or delete `OPENCLAW_MGMT_API_KEY` in the `.env` file on your VPS. If changed, the my.hitechcloud.vn panel will not be able to connect.

---

## 2. Add AI Provider API Key

OpenClaw requires an API key from your chosen provider. Three common providers are listed below:

| Provider (AI)         | Get API Key At                                 |
|-----------------------|------------------------------------------------|
| Anthropic (Claude)    | https://console.anthropic.com/settings/keys    |
| OpenAI (GPT)          | https://platform.openai.com/api-keys           |
| Google (Gemini)       | https://aistudio.google.com/apikey             |

### Add API Key via my.hitechcloud.vn panel

The my.hitechcloud.vn panel will call the Management API to update your key:

```bash
MGMT_KEY="<management-api-key>"
VPS_IP="<ip-vps>"

curl -X PUT \
  -H "Authorization: Bearer $MGMT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic", "apiKey": "sk-ant-xxx..."}' \
  http://$VPS_IP:9998/api/config/api-key
```

**Validate the key before saving:**

```bash
curl -X POST \
  -H "Authorization: Bearer $MGMT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic", "apiKey": "sk-ant-xxx..."}' \
  http://$VPS_IP:9998/api/config/test-key
```

You should see: `{"ok": true}` if the key is valid.

---

## 3. Send Your First Message

1. Pair the device using the URL in step 1
2. Add an API key using step 2
3. Enter a message in the chat box and hit Enter
4. OpenClaw will reply using the current configured AI model

---

## 4. Change AI Model

By default, OpenClaw uses `anthropic/claude-opus-4-5`. To change the model:

```bash
curl -X PUT \
  -H "Authorization: Bearer $MGMT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic", "model": "anthropic/claude-sonnet-4-20250514"}' \
  http://$VPS_IP:9998/api/config/provider
```

> See more model IDs at [Detailed Configuration](cau-hinh.md).

---

## 5. VPS Directory Structure

```
/opt/openclaw/                          # Main directory
├── .env                                # Environment variables (tokens, API keys)
├── .openclaw -> config/                # Symlink
├── Caddyfile                           # Reverse proxy + SSL config
├── config/
│   ├── openclaw.json                   # Current config (model, gateway, browser)
│   ├── devices/
│   │   ├── pending.json                # Devices awaiting pairing
│   │   └── paired.json                 # Paired devices
│   └── agents/main/agent/
│       └── auth-profiles.json          # API keys (OpenClaw format)
└── data/                               # Persistent data

/opt/openclaw-mgmt/
└── server.js                           # Management API (port 9998)

/etc/openclaw/config/                   # Config templates (do not edit)
├── anthropic.json
├── openai.json
└── gemini.json
```

---

## 6. Basic Management Commands

SSH into your VPS and run:

```bash
# View logs
journalctl -u openclaw -f

# Restart
systemctl restart openclaw

# Update to latest version
npm update -g openclaw@latest && systemctl restart openclaw

# Stop all
systemctl stop openclaw
```

> See also [VPS Management](quan-ly-vps.md).

---

## 7. Next Steps

- [Detailed Configuration](cau-hinh.md) — Change model, gateway, browser settings
- [Hướng dẫn config template](huong-dan-config-template.md) — Cấu trúc file `config/*.json` và cách thêm provider mới
- [Bảng tra cứu provider config](bang-tra-cuu-provider-config.md) — Tra nhanh file config, env key, API type, endpoint và model mặc định
- [Messaging Channel Integration](kenh-nhan-tin.md) — Telegram, Discord, Zalo, Slack
- [VPS Management](quan-ly-vps.md) — Domain, SSL, management commands
- [API Reference](api-reference.md) — Complete API endpoint list

## 8. Useful Follow-up API Checks

After first setup, these checks are useful for daily operations:

```bash
# Core upstream status
curl -H "Authorization: Bearer $MGMT_KEY" \
  "http://$VPS_IP:9998/api/openclaw/status?all=true&usage=true"

# Node fleet summary
curl -H "Authorization: Bearer $MGMT_KEY" \
  "http://$VPS_IP:9998/api/nodes/status?connected=true&lastConnected=24h"

# Presence / heartbeat
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/system/presence
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/system/heartbeat/last
```

If you use custom secret sources or skills, also review `quan-ly-vps.md` and `api-reference.md` for these routes:
- `/api/secrets/reload`
- `/api/secrets/audit`
- `/api/security/audit`
- `/api/skills/search`
- `/api/skills/check`