Setup Guide · March 2026

**NemoClaw on Hostinger VPS**

_A non-technical guide - from zero to running AI agent with Claude_

nemoclaw v0.1.0 · OpenClaw 2026.3.11 · Ubuntu 24.04

# 01 Before you start

You need four things before running any commands:

| **What**          | **Where to get it**                  | **Notes**                                                                    |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Hostinger VPS     | hPanel → VPS                         | Ubuntu 24.04, minimum 4 cores / 8 GB RAM / 50 GB disk. KVM2 plan works well. |
| NVIDIA API key    | build.nvidia.com                     | Free tier available. Starts with nvapi-. Used for the wizard only.           |
| Anthropic API key | console.anthropic.com                | Starts with sk-ant-. This powers Claude inside OpenClaw.                     |
| SSH access        | hPanel → Terminal, or any SSH client | All commands run as root on the VPS.                                         |

# 02 Open the firewall in Hostinger hPanel

Hostinger drops all incoming traffic by default. Add two rules before anything else.

| **1** | **Go to firewall settings** |
| ----- | --------------------------- |

In hPanel, select your VPS → click Security → click Firewall → select your server → click Manage.

| **2** | **Add port 80 rule** |
| ----- | -------------------- |

Click Add rule: Action = Accept · Protocol = TCP · Port = 80 · Source = Any. Click Add rule.

| **3** | **Add port 443 rule** |
| ----- | --------------------- |

Repeat with Port = 443. Everything else stays the same.

|     | That's all. Do not open any other ports. OpenClaw runs on port 18789 inside the VPS<br><br>- it never needs to be exposed directly. Caddy handles HTTPS → port 18789 internally. |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

# 03 Install NemoClaw

Three commands - run them in order. Each one builds on the last.

| **A** | **Update system and install Docker** |
| ----- | ------------------------------------ |

| apt update && apt upgrade -y && \\                      |
| ------------------------------------------------------- |
| curl -fsSL <https://get.docker.com> \| sh && \\         |
| systemctl enable docker && systemctl start docker && \\ |
| usermod -aG docker \$USER && newgrp docker              |
|                                                         |

| **B** | **Fix Docker cgroup setting and install OpenShell** |
| ----- | --------------------------------------------------- |

Ubuntu 24.04 uses cgroup v2 which requires a Docker config fix. This also installs the OpenShell CLI.

| echo '{"default-cgroupns-mode": "host"}' > /etc/docker/daemon.json && \\                    |
| ------------------------------------------------------------------------------------------- |
| systemctl restart docker && \\                                                              |
| curl -LsSf <https://raw.githubusercontent.com/NVIDIA/OpenShell/main/install.sh> \| sh && \\ |
| source ~/.bashrc                                                                            |
|                                                                                             |

| **C** | **Install NemoClaw** |
| ----- | -------------------- |

Node.js is handled automatically - you don't need to install it separately. The first two lines ensure nvm is loaded before the script runs.

| export NVM_DIR="\$HOME/.nvm" && \\                         |
| ---------------------------------------------------------- |
| \[ -s "\$NVM_DIR/nvm.sh" \] && \\. "\$NVM_DIR/nvm.sh" ; \\ |
| curl -fsSL <https://nvidia.com/nemoclaw.sh> \| bash        |
|                                                            |

|     | This takes 5-10 minutes. The wizard launches automatically at the end and will ask for your<br><br>sandbox name, NVIDIA key, and channel policies. See Section 04 for exactly what to enter. |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **D** | **Fix PATH so commands work in future sessions** |
| ----- | ------------------------------------------------ |

After install, nemoclaw and openshell may not be found in new terminal sessions. Run this once to fix it permanently:

| echo 'export NVM_DIR="\$HOME/.nvm"' >> ~/.bashrc && \\                          |
| ------------------------------------------------------------------------------- |
| echo '\[ -s "\$NVM_DIR/nvm.sh" \] && \\. "\$NVM_DIR/nvm.sh"' >> ~/.bashrc && \\ |
| echo 'export PATH="\$PATH:\$HOME/.local/bin"' >> ~/.bashrc && \\                |
| source ~/.bashrc                                                                |
|                                                                                 |

|     | Why this is needed: nemoclaw is installed via nvm and openshell installs to ~/.local/bin.<br><br>Neither is in the default PATH until you add them. |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |

# 04 Complete the setup wizard

The install script from Step C launches the wizard automatically. If it doesn't - or if you need to re-run it - start it manually:

| nemoclaw onboard |
| ---------------- |
|                  |

The wizard runs through 7 stages and asks for your input at three points:

| **1** | **Sandbox name** |
| ----- | ---------------- |

The wizard shows:

| Sandbox name (lowercase, numbers, hyphens) \[my-assistant\]: |
| ------------------------------------------------------------ |
|                                                              |

Type nemoclaw-sandbox and press Enter. If it says "already exists - Recreate? \[y/N\]", press N to keep the existing one.

|     | The wizard may skip this prompt and auto-accept the default name. Check what name appears<br><br>in the final summary - that is your sandbox name. This guide uses nemoclaw-sandbox throughout. |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **2** | **NVIDIA API key** |
| ----- | ------------------ |

The wizard shows:

| NVIDIA API Key: |
| --------------- |
|                 |

Paste your nvapi-... key and press Enter.

| **3** | **Policy presets** |
| ----- | ------------------ |

Near the end the wizard asks:

| Apply suggested presets (pypi, npm)? \[Y/n/list\]: |
| -------------------------------------------------- |
|                                                    |

Type list and press Enter, then type slack,telegram and press Enter.

|     | If the policy step fails with "sandbox not found" - this is a known bug in OpenShell 0.0.10.<br><br>Press N to skip. Once the wizard finishes, apply policies manually:<br><br>openshell policy set nemoclaw-sandbox --policy - --wait << 'EOF'<br><br>network_policies:<br><br>telegram:<br><br>name: telegram<br><br>endpoints:<br><br>\- host: api.telegram.org<br><br>port: 443<br><br>slack:<br><br>name: slack<br><br>endpoints:<br><br>\- host: slack.com<br><br>port: 443<br><br>\- host: api.slack.com<br><br>port: 443<br><br>EOF |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **4** | **Wait for the summary and connect** |
| ----- | ------------------------------------ |

When the wizard finishes you'll see a summary. Now connect to start the OpenClaw gateway and port forward:

| nemoclaw nemoclaw-sandbox connect |
| --------------------------------- |
|                                   |

Wait for the sandbox prompt (sandbox@nemoclaw-sandbox). This means OpenClaw is running and the port forward on 127.0.0.1:18789 is active. Keep this session running and open a new terminal for remaining steps.

|     | **If you see a port conflict error:**<br><br>This means port 18789 is already forwarded - usually because nemoclaw onboard already set it up during installation. It is not an error. Check what is running:<br><br>openshell forward list<br><br>If your sandbox name is listed and status is running - you are done, skip ahead. If a different sandbox name is listed, stop it first then connect yours:<br><br>openshell forward stop 18789 &lt;other-sandbox-name&gt;<br><br>nemoclaw nemoclaw-sandbox connect |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

# Keeping the Gateway Connection Alive

The port forward started by nemoclaw connect runs as a background daemon - it survives closing your terminal tab. However it does not survive VPS reboots or gateway crashes. If your endpoint stops responding after a day or two, just SSH in and run the connect command again. The SSH tunnel that openshell forward creates dies for two reasons:

- **Network idle timeout** - your VPS NAT/firewall drops idle TCP connections (typically after 5-30 minutes)
- **SSH session TTL** - the gateway enforces a 24-hour session lifetime, after which the tunnel is rejected regardless

**Fix - SSH keepalive + systemd service**

## Step 1: Add SSH keepalive (prevents idle timeout)

Run outside sandbox:

mkdir -p ~/.ssh

cat >> ~/.ssh/config << 'EOF'

\# Keep OpenShell connections alive

Host \*

ServerAliveInterval 30

ServerAliveCountMax 3

TCPKeepAlive yes

EOF

chmod 600 ~/.ssh/config

## Step 2: Create systemd service (auto-restarts on any failure, including 24h TTL expiry)

Run outside sandbox:

| sudo tee /etc/systemd/system/nemoclaw-connect.service > /dev/null << 'EOF'<br><br>\[Unit\]<br><br>Description=NemoClaw Gateway Connection<br><br>After=network-online.target docker.service<br><br>Wants=network-online.target docker.service<br><br>\[Service\]<br><br>Type=simple<br><br>User=root<br><br>Environment=PATH=/root/.nvm/versions/node/v22.22.1/bin:/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin<br><br>ExecStartPre=/bin/bash -c 'until /root/.local/bin/openshell status 2>/dev/null \| grep -q Connected; do sleep 5; done'<br><br>ExecStart=/root/.nvm/versions/node/v22.22.1/bin/nemoclaw nemoclaw-sandbox connect<br><br>Restart=always<br><br>RestartSec=10<br><br>\[Install\]<br><br>WantedBy=multi-user.target<br><br>EOF<br><br>sudo systemctl daemon-reload<br><br>sudo systemctl enable nemoclaw-connect<br><br>sudo systemctl start nemoclaw-connect | |
| --- | | --- |
| | **Important:** Adjust paths to match your setup - run which nemoclaw and which openshell to find them.<br><br>**How it works:** SSH keepalive detects dead connections within 90 seconds → SSH exits → systemd waits 10 seconds → restarts the connection automatically. Survives idle timeouts, 24h TTL expiry, and VPS reboots. No more manual openshell forward start. |

# 05 Find and save your gateway token

The gateway token is your password to log into the chat interface. Get it reliably by connecting to the sandbox and reading the config file:

| RUN ON VPS HOST - PRINTS YOUR TOKEN                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------- |
| nemoclaw nemoclaw-sandbox connect                                                                                                     |
| python3 -c "import json; d=json.load(open('/sandbox/.openclaw/openclaw.json')); print('TOKEN:', d\['gateway'\]\['auth'\]\['token'\])" |
| exit                                                                                                                                  |
|                                                                                                                                       |

|     | Copy everything after TOKEN: and save it in a notes app or password manager.<br><br>Lost your token? Just run the command above again - it never changes unless you reinstall. |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

# 06 Set up Caddy for HTTPS access

Caddy gives you a clean https:// address with an auto-renewing SSL certificate. No port numbers in your URL, nothing to manage manually.

| **1** | **Install Caddy** |
| ----- | ----------------- |

| curl -1sLf '<https://dl.cloudsmith.io/public/caddy/stable/gpg.key>' \| gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg | | |
| --- | | | --- |
| curl -1sLf '<https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt>' \| tee /etc/apt/sources.list.d/caddy-stable.list | | |
| apt update && apt install caddy -y | | |
| | | |
| | Run this on the VPS host - not inside the sandbox. If your prompt shows sandbox@nemoclaw-sandbox, type exit first. | |

| **2** | **Find your Hostinger subdomain** |
| ----- | --------------------------------- |

In hPanel, go to your VPS Overview page. Your subdomain looks like srv1234567.hstgr.cloud. Copy it - you need it in the next step.

| **3** | **Write the Caddy config and start it** |
| ----- | --------------------------------------- |

Replace YOUR-SUBDOMAIN.hstgr.cloud with your actual subdomain, then run both commands:

| COMMAND 1 - WRITE CONFIG (REPLACE THE SUBDOMAIN)                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sudo tee /etc/caddy/Caddyfile > /dev/null << 'CADDYEOF'<br><br>YOUR-SUBDOMAIN.hstgr.cloud {<br><br>reverse_proxy 127.0.0.1:18789 {<br><br>header_up Host 127.0.0.1:18789<br><br>header_up Origin <http://127.0.0.1:18789><br><br>}<br><br>}<br><br>CADDYEOF |
|                                                                                                                                                                                                                                                             |

| COMMAND 2 - START CADDY                           |
| ------------------------------------------------- |
| systemctl restart caddy && systemctl enable caddy |
|                                                   |

|     | Your URL is now: <https://YOUR-SUBDOMAIN.hstgr.cloud><br><br>The first load takes 15-30 seconds while Caddy gets the SSL certificate from Let's Encrypt.<br><br>After that it loads instantly. The certificate renews automatically every 90 days. |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

# 07 Access the chat interface

| **1** | **Verify the sandbox and port forward are running** |
| ----- | --------------------------------------------------- |

Before opening the browser, confirm the gateway is active:

| ss -tlnp \| grep 18789 |
| ---------------------- |
| openshell forward list |
|                        |

Port 18789 should show as listening and the forward status should be running. If it shows dead or nothing appears, run:

| nemoclaw nemoclaw-sandbox connect |
| --------------------------------- |
|                                   |

Wait for the sandbox prompt to appear. The forward starts automatically. You only need to run this once - it keeps running even after you exit the terminal session.

| 2   | **Open the chat interface** |
| --- | --------------------------- |

Open your browser and go to:

Your URL

**<https://YOUR-SUBDOMAIN.hstgr.cloud>**

You'll see the OpenClaw login screen. Enter the gateway token you saved in Section 05.

# 08 Add your API keys securely

OpenShell manages API keys as providers - named credential bundles stored on the VPS host and injected into sandboxes at runtime. Keys never touch the sandbox filesystem. OpenClaw sends all inference requests through inference.local, a special endpoint where OpenShell's privacy router strips sandbox-side credentials, injects the real key from the host, and forwards to the actual API.

|     | Why inference.local? If OpenClaw called api.anthropic.com directly, it would need your key<br><br>stored inside the sandbox. With inference.local, the key stays on the host - the sandbox never sees it. |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| **1** | **Create OpenShell providers on the VPS host** |
| ----- | ---------------------------------------------- |

Run on the VPS host - not inside the sandbox. Replace the key values with your real keys.

| ANTHROPIC / CLAUDE                                                               |
| -------------------------------------------------------------------------------- |
| export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY-HERE"                                  |
| openshell provider create --name anthropic-prod --type anthropic --from-existing |
|                                                                                  |

| OPENAI (SKIP IF NOT USING OPENAI)                                          |
| -------------------------------------------------------------------------- |
| export OPENAI_API_KEY="sk-proj-YOUR-KEY-HERE"                              |
| openshell provider create --name openai-prod --type openai --from-existing |
|                                                                            |

| openshell provider list |
| ----------------------- |
|                         |

| **2**                                                                      | **Point inference.local at Anthropic** |
| -------------------------------------------------------------------------- | -------------------------------------- |
| openshell inference set --provider openai-prod --model gpt-4.1 --no-verify |                                        |
|                                                                            |                                        |

| openshell inference get |
| ----------------------- |
|                         |

| **3** | **Add providers to OpenClaw config inside the sandbox** |
| ----- | ------------------------------------------------------- |

OpenShell routes keys securely via inference.local, but OpenClaw also needs to know about the providers in its own config. Run this script outside the sandbox:

| \# Load PATH<br><br>export PATH="\$PATH:\$HOME/.local/bin"<br><br>export NVM_DIR="\$HOME/.nvm" && \\. "\$NVM_DIR/nvm.sh"<br><br>\# Fix ownership so sandbox user can write<br><br>openshell doctor exec -- kubectl exec -n openshell nemoclaw-sandbox -- chown sandbox:sandbox /sandbox/.openclaw/openclaw.json<br><br>\# Connect and run the script<br><br>nemoclaw nemoclaw-sandbox connect |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                                                                                                                                                                                                                                                                                                                                                                                               |

Then, inside the sandbox:

| ADD ANTHROPIC (CLAUDE) AND OPENAI PROVIDERS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| openclaw config set models.providers.openai '{"baseUrl":"<https://inference.local/v1","apiKey":"unused","api":"openai-completions","models":\[{"id":"gpt-4.1","name":"GPT-4.1"},{"id":"gpt-4o","name":"GPT-4o"}\]}>'<br><br>\# Anthropic provider<br><br>openclaw config set models.providers.anthropic '{"baseUrl":"<https://inference.local/v1","apiKey":"unused","api":"anthropic-messages","models":\[{"id":"claude-sonnet-4-6","name":"Claude> Sonnet 4.6"},{"id":"claude-opus-4-6","name":"Claude Opus 4.6"}\]}'<br><br>\# Set default model (this one already worked)<br><br>openclaw config set agents.defaults.model.primary "openai/gpt-4.1" |

| **4** | **Restart the OpenClaw gateway to apply changes** |
| ----- | ------------------------------------------------- |

Still inside the sandbox, stop and restart the OpenClaw gateway:

| openclaw gateway stop |
| --------------------- |
| openclaw gateway      |
|                       |

Then exit the sandbox:

| exit |
| ---- |
|      |

In the chat UI, go to Settings → Models - you should now see Anthropic and OpenAI listed as providers. GPT-4.1 will be the default.

|     | Switching between Claude and OpenAI - run the appropriate command on the VPS host:<br><br>Switch to Claude: openshell inference set --provider anthropic-prod --model claude-sonnet-4-6<br><br>Switch to OpenAI: openshell inference set --provider openai-prod --model gpt-4.1 --no-verify<br><br>No sandbox restart needed. Takes effect in seconds.<br><br>Why both providers show type "openai": OpenShell uses openai as the generic type for any<br><br>OpenAI-compatible API. It does not mean both are the same provider. |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

# 09 Quick command cheatsheet

All commands run on the VPS host - not inside the sandbox.

| **Command**                                                                 | **What it does**                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| nemoclaw nemoclaw-sandbox connect                                           | Start or reconnect the sandbox and gateway                   |
| nemoclaw nemoclaw-sandbox status                                            | Check if the sandbox is healthy                              |
| nemoclaw nemoclaw-sandbox logs --follow                                     | Watch live activity logs                                     |
| openshell sandbox list                                                      | List all sandboxes and their state                           |
| openshell inference get                                                     | Check which provider and model is active                     |
| openshell inference set --provider anthropic-prod --model claude-sonnet-4-6 | Switch to Claude                                             |
| openshell inference set --provider openai-prod --model gpt-4.1 --no-verify  | Switch to OpenAI                                             |
| openshell term                                                              | Open the security monitor - approve or deny network requests |
| systemctl status caddy                                                      | Check Caddy is running                                       |
| systemctl restart caddy                                                     | Restart Caddy if the URL stops responding                    |
| nemoclaw onboard                                                            | Re-run the full setup wizard                                 |

|     | Retrieve your token anytime - run these inside the sandbox:<br><br>nemoclaw nemoclaw-sandbox connect<br><br>python3 -c "import json; d=json.load(open('/sandbox/.openclaw/openclaw.json')); print(d\['gateway'\]\['auth'\]\['token'\])"<br><br>exit |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

|     | WARNING - Do not run this unless you want to start completely over:<br><br>nemoclaw nemoclaw-sandbox destroy<br><br>This permanently deletes the sandbox and all its data.<br><br>You will need to run nemoclaw onboard to rebuild from scratch. |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

_NemoClaw alpha · March 2026 · FuturMinds_