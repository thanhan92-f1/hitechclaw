# OpenClaw Update Guide

## Table of Contents

- [1. Update via Management API (Recommended)](#1-update-via-management-api-recommended)
- [2. Manual Update via SSH](#2-manual-update-via-ssh)
- [3. Update OpenClaw](#3-update-openclaw)
- [4. Post-Update Checks](#4-post-update-checks)

---

## 1. Update via Management API (Recommended)

Call the `/api/self-update` endpoint to automatically download the latest version from GitHub and restart the service.

```bash
MGMT_KEY="<your_mgmt_api_key>"
VPS_IP="<your_vps_ip>"

curl -X POST \
  -H "Authorization: Bearer $MGMT_KEY" \
  http://$VPS_IP:9998/api/self-update
```

**Successful response:**

```json
{
  "ok": true,
  "message": "Update complete. Management API restarting...",
  "files": [
    { "file": "/opt/openclaw-mgmt/server.js", "ok": true },
    { "file": "/etc/openclaw/config/anthropic.json", "ok": true },
    { "file": "/etc/openclaw/config/openai.json", "ok": true },
    { "file": "/etc/openclaw/config/gemini.json", "ok": true }
  ]
}
```

**Files updated:**

| File         | Path on VPS                               | Description             |
|--------------|-------------------------------------------|-------------------------|
| server.js    | `/opt/openclaw-mgmt/server.js`            | Management API server   |
| anthropic.json | `/etc/openclaw/config/anthropic.json`   | Anthropic config template|
| openai.json  | `/etc/openclaw/config/openai.json`        | OpenAI config template  |
| gemini.json  | `/etc/openclaw/config/gemini.json`        | Gemini config template  |

> **Note:** The Management API will auto-restart after updating. Connection may drop for 2-3 seconds during restart.

---

## 2. Manual Update via SSH

If the Management API is not working or you prefer a manual update:

```bash
ssh root@<VPS_IP>
```

### Step 1: Download latest files from GitHub

```bash
REPO_RAW="https://raw.githubusercontent.com/Pho-Tue-SoftWare-Solutions-JSC/cloud-server-open-claw-management/main"

# Management API
curl -fsSL "$REPO_RAW/management-api/server.js" -o /opt/openclaw-mgmt/server.js

# Config templates
curl -fsSL "$REPO_RAW/config/anthropic.json" -o /etc/openclaw/config/anthropic.json
curl -fsSL "$REPO_RAW/config/openai.json" -o /etc/openclaw/config/openai.json
curl -fsSL "$REPO_RAW/config/gemini.json" -o /etc/openclaw/config/gemini.json
curl -fsSL "$REPO_RAW/config/chatgpt.json" -o /etc/openclaw/config/chatgpt.json
```

### Step 2: Restart Management API

```bash
systemctl restart openclaw-mgmt
systemctl status openclaw-mgmt
```

---

## 3. Update OpenClaw

To update OpenClaw to the latest version, use the `/api/upgrade` endpoint:

```bash
curl -X POST \
  -H "Authorization: Bearer $MGMT_KEY" \
  http://$VPS_IP:9998/api/upgrade
```

Or manually via SSH:

```bash
npm update -g openclaw@latest
systemctl restart openclaw
```

---

## 4. Post-Update Checks

### Check Management API

```bash
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/status
```

### Check upstream diagnostics

```bash
curl -H "Authorization: Bearer $MGMT_KEY" \
  "http://$VPS_IP:9998/api/openclaw/status?all=true&usage=true"

curl -H "Authorization: Bearer $MGMT_KEY" \
  "http://$VPS_IP:9998/api/nodes/status?connected=true&lastConnected=24h"
```

### Check services

```bash
# Via API
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/status

# Via SSH
systemctl status openclaw caddy openclaw-mgmt
```

### Check logs if there are problems

```bash
# Management API logs
journalctl -u openclaw-mgmt -f --no-pager -n 50

# OpenClaw logs
journalctl -u openclaw -f --no-pager -n 50
```

### Related docs

- `quickstart.md` — first-run checks and daily operator flow
- `quan-ly-vps.md` — VPS operations, diagnostics, secrets, security, and skills
- `api-reference.md` — full endpoint reference