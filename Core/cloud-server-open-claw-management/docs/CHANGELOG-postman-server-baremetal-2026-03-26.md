# Changelog — Postman & Management API Bare-metal Cleanup (2026-03-26)

## Objective
- Align `management-api/server.js` and `postman_collection.json` with the current non-Docker deployment model.
- Remove stale container/Docker terminology from API descriptions and examples.
- Clarify that OpenClaw is managed directly on the host via systemd and the local CLI.

## Updated Files
- `management-api/server.js`
- `postman_collection.json`

## Changes
### `management-api/server.js`
- Renamed internal symbols for clarity:
  - `COMPOSE_DIR` → `OPENCLAW_HOME`
  - `restartContainer()` → `restartManagedService()`
  - `getContainerStatus()` → `getManagedServiceStatus()`
  - `dockerCompose()` → `runServiceAction()`
- Updated route comments to describe host/service behavior instead of containers:
  - `/api/status`
  - `/api/restart`
  - `/api/stop`
  - `/api/start`
  - `/api/logs`
  - `/api/cli`

### `postman_collection.json`
- Renamed `Get Container Status` to `Get Service Status`.
- Updated `/api/system` docs and example payload to use `openclawVersion` instead of `dockerVersion`.
- Updated `/api/version` docs and example payload to return configured version plus `clawVersion`.
- Updated `/api/upgrade` to describe npm-based host upgrade plus service restart.
- Updated service control endpoints (`/api/restart`, `/api/stop`, `/api/start`, `/api/rebuild`) to describe systemd service operations.
- Updated `/api/logs` to describe systemd journal logs.
- Updated config/channel/plugin descriptions to reference restarting the OpenClaw service rather than a container.
- Updated custom skill examples to remove Docker runtime assumptions from metadata and troubleshooting text.
- Updated `/api/cli` docs to describe direct host execution via `openclaw <command>`.
- Updated `/api/self-update` docs and example response to reference `Caddyfile` and config templates instead of `docker-compose.yml`.
- Removed remaining Docker/container wording from the collection.

## Notes
- This cleanup is documentation/contract alignment on top of the earlier runtime bare-metal migration.
- Functional API behavior was already mostly host-based; the main remaining issue was stale naming and examples.

## Status
- Complete.
- Rechecked for remaining `docker`/`container` wording in the edited API collection.
