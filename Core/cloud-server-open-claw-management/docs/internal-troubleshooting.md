# Internal Docs — Error Handling & Troubleshooting

> Documentation for my.hitechcloud.vn technical staff. **Do not share with customers.**

## Table of Contents

- [1. Error Handling Architecture](#1-error-handling-architecture)
- [2. HTTP Error Codes & Meanings](#2-http-error-codes--meanings)
- [3. Timeouts for Each Operation](#3-timeouts-for-each-operation)
- [4. Authentication Error Handling](#4-authentication-error-handling)
- [5. Service Error Handling](#5-service-error-handling)
- [6. File I/O Error Handling](#6-file-io-error-handling)
- [7. DNS & Domain Error Handling](#7-dns--domain-error-handling)
- [8. API Key Test Failure Handling](#8-api-key-test-failure-handling)
- [9. Security — Shell Injection Prevention](#9-security--shell-injection-prevention)
- [10. Protected Environment Variables](#10-protected-environment-variables)
- [11. Common Errors & Solutions](#11-common-errors--solutions)
- [12. Race Condition Note](#12-race-condition-note)
- [13. Debugging Commands for VPS](#13-debugging-commands-for-vps)
- [14. Upstream Diagnostics Routes](#14-upstream-diagnostics-routes)

---

## 1. Error Handling Architecture

The Management API (`server.js`) error handling flow:

```
Request → Auth check → Rate limit check → Route handler → try/catch → Response
```

- **Each route** is wrapped in `try-catch`. Exceptions return HTTP 500 with `e.message`.
- **Shell commands** use `execSync()` — will throw on non-zero exit code or timeout.
- **File operations** use `readFileSync()` / `writeFileSync()` — throw on missing or write error.

Unified error response format:

```json
{"ok": false, "error": "Error description"}
```

---

## 2. HTTP Error Codes & Meanings

| HTTP Code | When Triggered                         | Action                        |
|-----------|----------------------------------------|-------------------------------|
| `200`     | Success (sync)                         | —                             |
| `202`     | Accepted, background operation (upgrade) | Client should poll `/api/status` |
| `400`     | Bad request, invalid input             | Check request body            |
| `401`     | Missing or incorrect Bearer token      | Check `OPENCLAW_MGMT_API_KEY` in `.env` |
| `403`     | Attempt to modify protected variable   | That variable cannot change   |
| `429`     | IP blocked (>10 failed auth attempts)  | Wait 15min or restart mgmt service |
| `500`     | Server error (shell timeout, file I/O, service fail) | See logs: `journalctl -u openclaw-mgmt` |

---

## 3. Timeouts for Each Operation

| Operation                   | Timeout      | Note                          |
|-----------------------------|-------------|-------------------------------|
| Default shell command       | 30s         | `shell()` function            |
| systemctl restart           | 60s         | restart/stop/start            |
| systemctl stop              | 60s         | graceful shutdown             |
| systemctl start             | 120s        | rebuild/start                 |
| npm update + restart        | 300s (5min) | `/api/upgrade` — async        |
| CLI proxy                   | 60s         | `/api/cli`                    |
| DNS lookup (dig/host)       | 10s         | Domain validation             |
| API key test (curl)         | 15s         | Provider endpoint test        |
| Caddy restart (domain change)| 30s         | After writing Caddyfile       |
| Caddy rollback restart      | 15s         | If Caddy fails after domain change |

---

## 4. Authentication Error Handling

### Mechanism

- Bearer token checked by `crypto.timingSafeEqual()` — prevents timing attacks.
- API key is read from `.env` per request (no cache).
- Rate limiting by IP: **10 failures → block 15min**.

### Failure Modes

| Error                        | Cause                            | Response |
|------------------------------|----------------------------------|----------|
| Missing `Authorization` header| Missing from request             | 401      |
| Bad format (no `Bearer `)    | Header does not match regex `/^Bearer\s+(.+)$/` | 401 |
| Wrong token value            | Key does not match `.env`        | 401 + fail count increment |
| Wrong token length           | `Buffer.from()` length mismatch  | 401      |
| `.env` missing key           | Key is empty string              | 401 (always fail) |
| IP blocked                   | >10 failures                     | 429      |

### Notes

- Rate limit is **in-memory** — restart resets limit.
- Cleanup only occurs when blocked IP tries again after timeout.
- **No persistent storage** for rate limit → minor memory leak if many attacking IPs.

### Unblocking a Blocked IP

```bash
# Fastest: restart management API
systemctl restart openclaw-mgmt
```

---

## 5. Service Error Handling

### Service not found

- `systemctl status` returns inactive/not-found → route will return `status: "not_found"`.
- Not a 500 error. Appears in body as status.

### Restart failure

- `systemctl restart openclaw` throws → caught at route level → 500.
- Common causes: bad config, disk full, OOM.

### Caddy rollback on domain failure

Domain-change flow:

```
1. Write new Caddyfile (domain + ACME issuer chain: Let's Encrypt -> ZeroSSL)
2. Restart Caddy (30s timeout)
3. Sleep 3s
4. Check Caddy status
   ├── running → 200 OK
   └── not running → ROLLBACK:
       ├── Write Caddyfile with IP + tls internal
       ├── Restart Caddy (15s timeout)
       └── Return 500 "Caddy failed to start..."
```

**Limitation:** If rollback restart also fails, error is swallowed (silent catch). Caddy remains stopped, needs manual fix.

### Rebuild failure

```
systemctl restart openclaw (60s) → systemctl restart caddy (60s)
```

- If openclaw restart times out → caddy is NOT restarted → services end in inconsistent state.
- If caddy restart fails → caddy is stopped.

### Post-restart/rebuild check

API sleeps 2–3 seconds, then checks status. If service is not yet up, status might be inaccurate. No retry loop.

---

## 6. File I/O Error Handling

### Key files

| File                               | Effect if corrupt/missing             |
|-------------------------------------|---------------------------------------|
| `/opt/openclaw/.env`               | Auth fails (MGMT key load fail), lost tokens |
| `/opt/openclaw/config/openclaw.json`| 500 error for all config endpoints    |
| `auth-profiles.json`               | AI keys lost, but falls back to env   |
| `/opt/openclaw/Caddyfile`          | Caddy won't start, no SSL             |
| `/etc/openclaw/config/*.json`      | Can't switch providers                |

### auth-profiles.json — Graceful fallback

```javascript
// If file missing or invalid JSON → return { profiles: {} }
// Do NOT throw 500
```

### openclaw.json — NO graceful fallback

```javascript
// JSON.parse() throws → 500 error
// Must be fixed manually or copied from template
```

### Non-atomic writes

- `writeFileSync()` directly overwrites, with no backup.
- If process crashes mid-write → file may be empty or corrupt.
- **No file locking** — concurrent writes may corrupt.

### Restore corrupt config

```bash
# Copy default template config
cp /etc/openclaw/config/anthropic.json /opt/openclaw/config/openclaw.json

# Inject gateway token
TOKEN=$(grep OPENCLAW_GATEWAY_TOKEN /opt/openclaw/.env | cut -d= -f2)
jq --arg t "$TOKEN" '.gateway.auth.token = $t' \
  /opt/openclaw/config/openclaw.json > /tmp/oc.json && \
  mv /tmp/oc.json /opt/openclaw/config/openclaw.json

# Restart
systemctl restart openclaw
```

---

## 7. DNS & Domain Error Handling

### DNS validation flow

```
1. Receive domain from request
2. Lowercase + regex for valid format
3. dig +short A domain (10s timeout)
   ├── Found → filter IP
   └── Not found → fallback:
       host domain (10s timeout)
       ├── "has address X.X.X.X" → parse IP
       └── Not found → error
4. Compare resolved IPs with server IP
   ├── Match → OK
   └── Mismatch → 400 error
```

### Common DNS Errors

| Error                  | Message                                                        | Root cause             |
|------------------------|----------------------------------------------------------------|------------------------|
| Cannot resolve         | `"Cannot resolve DNS for {domain}. Point A record to {ip}."`   | DNS not set or not propagated |
| IP mismatch            | `"DNS for {domain} resolves to {ips} — does not match server IP ({ip})."` | DNS set to wrong IP    |
| Bad format             | `"Invalid domain format"`                                      | Special char, uppercase, trailing dot... |

### Limitations

- **IPv4 A records only**. Does NOT support AAAA/IPv6.
- dig/host timeouts are both 10s. Slow DNS server may cause false negatives.
- DNS propagation can take up to 48h. Early API calls are rejected.

---

## 8. API Key Test Failure Handling

### Provider test methods

| Provider  | Method       | URL                                     | Pass criterion |
|-----------|--------------|------------------------------------------|---------------|
| Anthropic | POST `/v1/messages` | `api.anthropic.com`                | HTTP 200      |
| OpenAI    | GET `/v1/models`    | `api.openai.com`                   | HTTP 200      |
| Gemini    | GET `/v1beta/models`| `generativelanguage.googleapis.com`| HTTP 200      |

### Failure modes

| Scenario           | Provider HTTP code | Test result         |
|--------------------|-------------------|---------------------|
| Valid key          | 200               | `ok: true`          |
| Invalid/expired key| 401               | `ok: false`         |
| Out of quota       | 429               | `ok: false`         |
| Provider down      | 503               | `ok: false`         |
| Timeout (>15s)     | —                 | Exception → `ok: false` |

### Notes

- Test endpoint does NOT save the key. Only tests and returns result.
- API key is single-quoted escaped before passed into curl: `'` → `'\''`.
- Any provider API code != 200 (including 201, 204) is considered failure.

---

## 9. Security — Shell Injection Prevention

### CLI Proxy (`/api/cli`)

**Disallowed characters:** `;`, `&`, `|`, `` ` ``, `$`, `(`, `)`, `{`, `}`

```javascript
if (/[;&|`$(){}]/.test(command)) {
  return 400 "Command contains disallowed characters"
}
```

The executed command:
```bash
HOME=/opt/openclaw openclaw <command>
```

### Known Issues

- **Redirect `>`, `<`** are NOT blocked. Example: `models scan > /tmp/file` will run.
- Commands run directly on the host, so be aware of the risks.

### Other areas

| Area        | Security measure     |
|-------------|---------------------|
| dig/host domain | Regex validation before shell |
| API key in curl test | Single quote escape      |
| systemctl commands | Hardcoded, no user input  |
| Env var key    | Regex `/^[A-Z][A-Z0-9_]*$/`  |

---

## 10. Protected Environment Variables

### Cannot edit with `PUT /api/env/:key`

| Variable                 | Reason                                        |
|--------------------------|-----------------------------------------------|
| `OPENCLAW_MGMT_API_KEY`  | Created by HostBill/my.hitechcloud.vn. Panel loses access if changed |

→ Returns `403 Forbidden`.

### Cannot delete with `DELETE /api/env/:key`

| Variable                   | Reason                         |
|----------------------------|--------------------------------|
| `OPENCLAW_GATEWAY_TOKEN`   | Without → no Dashboard access  |
| `OPENCLAW_MGMT_API_KEY`    | Without → panel loses access   |
| `OPENCLAW_VERSION`         | Needed for OpenClaw version    |
| `OPENCLAW_GATEWAY_PORT`    | Needed for gateway binding     |

→ Returns `403 Forbidden`.

---

## 11. Common Errors & Solutions

### 11.1 — 429: IP blocked for too many auth failures

**Symptom:** All API requests return 429.

**Cause:** Client used wrong key 10+ times.

**Solution:**
```bash
# Wait 15 minutes, or:
systemctl restart openclaw-mgmt
```

### 11.2 — 401: Always failing auth even with correct key

**Symptom:** Correct key but always 401.

**Cause:** `OPENCLAW_MGMT_API_KEY` in `.env` is empty or invalid.

**Fix:**
```bash
# Check key
grep OPENCLAW_MGMT_API_KEY /opt/openclaw/.env

# If empty, get the key from HostBill and set it back.
# (Ask HostBill admin for the original key)
```

### 11.3 — 500: Config JSON corrupt

**Symptom:** All config actions return 500.

**Check:**
```bash
cat /opt/openclaw/config/openclaw.json | jq .
# If jq parse error → file corrupt
```

**Solution:**
```bash
cp /etc/openclaw/config/anthropic.json /opt/openclaw/config/openclaw.json
TOKEN=$(grep OPENCLAW_GATEWAY_TOKEN /opt/openclaw/.env | cut -d= -f2)
jq --arg t "$TOKEN" '.gateway.auth.token = $t' \
  /opt/openclaw/config/openclaw.json > /tmp/oc.json && \
  mv /tmp/oc.json /opt/openclaw/config/openclaw.json
systemctl restart openclaw
```

### 11.4 — Caddy won't start after domain change

**Symptom:** API returns 500 "Caddy failed to start". Dashboard unreachable.

**Check:**
```bash
journalctl -u caddy --no-pager -n 

### 11.5 — Host service status is OK but upstream status still looks unhealthy

**Symptom:** `/api/status` shows services as running, but upstream features, dashboard behavior, or remote peers still look degraded.

**Checks:**
```bash
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/status
curl -H "Authorization: Bearer $MGMT_KEY" "http://$VPS_IP:9998/api/openclaw/status?all=true&usage=true&deep=true"
curl -H "Authorization: Bearer $MGMT_KEY" "http://$VPS_IP:9998/api/nodes/status?connected=true&lastConnected=24h"
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/system/presence
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/system/heartbeat/last
```

**Likely causes:**
- Host process is running, but upstream runtime state is stale.
- Remote nodes are disconnected, filtered out, or using the wrong token/url.
- Heartbeats were disabled or stopped updating.

**Next actions:**
- Compare heartbeat/presence timestamps with `journalctl -u openclaw`.
- Re-enable heartbeats if they were disabled for maintenance.

### 11.6 — Secret-backed config does not match runtime behavior

**Symptom:** Config appears correct, but runtime still acts as if secrets are missing, stale, or unresolved.

**Checks:**
```bash
curl -X POST -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/secrets/reload
curl -H "Authorization: Bearer $MGMT_KEY" "http://$VPS_IP:9998/api/secrets/audit?check=true&allowExec=false"
```

**Likely causes:**
- Secret references changed on disk but were not reloaded yet.
- Audit findings are present in JSON output even when upstream exits non-zero.
- Exec-based refs require `allowExec=true` during audit.

**Next actions:**
- Re-run the audit with the operator’s intended flags.
- Inspect the returned JSON body, not only the HTTP code.

### 11.7 — Skill workflow differs between hosts

**Symptom:** A skill works on one VPS but fails discovery or readiness checks on another.

**Checks:**
```bash
curl -H "Authorization: Bearer $MGMT_KEY" "http://$VPS_IP:9998/api/skills/search?query=vps%20audit&limit=10"
curl -H "Authorization: Bearer $MGMT_KEY" http://$VPS_IP:9998/api/skills/check
curl -H "Authorization: Bearer $MGMT_KEY" "http://$VPS_IP:9998/api/skills/bins?agentId=main"
```

**Likely causes:**
- Required binaries differ between hosts.
- Skill metadata exists, but readiness checks report missing requirements.
- Wrong `agentId` or workspace roots are being inspected.

**Next actions:**
- Compare `requiredBins` and readiness output across hosts.
- Verify the selected agent and skill root directories.

---

## 14. Upstream Diagnostics Routes

Use these routes when process-level checks are insufficient.

| Route | Purpose | Notes |
|------|---------|-------|
| `GET /api/openclaw/status` | Upstream `openclaw status --json` | Supports `all`, `usage`, `deep`, `timeoutMs` |
| `GET /api/nodes/status` | Node fleet summary | Supports `connected`, `lastConnected`, `url`, `token` |
| `GET /api/nodes` | List nodes | Same filter family as nodes status |
| `GET /api/nodes/:id` | Describe one node | Useful for targeted peer troubleshooting |
| `GET /api/system/heartbeat/last` | Last heartbeat event | Gateway-backed |
| `POST /api/system/heartbeat/enable` | Enable heartbeats | Optional `timeoutMs` in body |
| `POST /api/system/heartbeat/disable` | Disable heartbeats | Optional `timeoutMs` in body |
| `GET /api/system/presence` | Presence list | Gateway-backed |
| `POST /api/secrets/reload` | Reload secret sources | CLI-backed |
| `GET /api/secrets/audit` | Audit secret refs | May still return parsed JSON on upstream non-zero exit |
| `GET /api/security/audit` | Security audit | Supports `deep`, `token`, `password` |
| `GET /api/skills/search` | Search skills | Supports `query`, `q`, `limit` |
| `GET /api/skills/check` | Skill readiness | Quick dependency validation |
