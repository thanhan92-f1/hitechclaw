# Changelog — API Docs Parity Refresh (2026-03-28)

## Objective
- Refresh the main documentation after the latest Management API parity work.
- Make recently added upstream-backed routes discoverable from both `README.md` and `docs/api-reference.md`.
- Group related endpoints more clearly for operators using the bare-metal VPS deployment.

## Updated Files
- `README.md`
- `docs/api-reference.md`
- `docs/CHANGELOG-docs-api-parity-2026-03-28.md`
- `docs/quickstart.md`
- `docs/quan-ly-vps.md`
- `docs/internal-troubleshooting.md`
- `docs/cau-hinh.md`
- `docs/update-guide.md`
- `docs/terminal-integration.md`
- `postman_collection.json`

## Changes
### `docs/api-reference.md`
- Added a new **Endpoint Groups Overview** section near the top of the document.
- Added or refreshed reference sections for these endpoints:
  - `GET /api/openclaw/status`
  - `GET /api/nodes/status`
  - `GET /api/nodes`
  - `GET /api/nodes/:id`
  - `GET /api/system/heartbeat/last`
  - `POST /api/system/heartbeat/enable`
  - `POST /api/system/heartbeat/disable`
  - `GET /api/system/presence`
  - `POST /api/secrets/reload`
  - `GET /api/secrets/audit`
  - `GET /api/security/audit`
  - `GET /api/skills/search`
  - `GET /api/skills/check`
- Expanded the table of contents so the new sections are directly reachable.
- Clarified that the document is organized by operational area instead of raw source order.

### `README.md`
- Expanded the Management API summary tables to include the latest parity routes.
- Added direct pointers to:
  - `docs/api-reference.md`
  - `docs/CHANGELOG-docs-api-parity-2026-03-28.md`

### Follow-up documentation supplements
- Extended `docs/quickstart.md` with post-install operational API checks for upstream status, nodes, presence, heartbeat, secrets, security, and skills workflows.
- Extended `docs/quan-ly-vps.md` with operator-focused examples and troubleshooting guidance for the new diagnostics and audit endpoints.
- Extended `docs/internal-troubleshooting.md` with staff-only guidance for upstream diagnostics drift, secret-backed runtime mismatches, and skill validation differences across hosts.
- Added cross-links and cleanup notes in `docs/cau-hinh.md`, including the corrected `my.hitechcloud.vn` Management API note.
- Extended `docs/update-guide.md` with upstream diagnostics checks and related-doc pointers for post-update validation.
- Extended `docs/terminal-integration.md` with links back to the main operational docs and guidance on when to prefer structured Management API responses.
- Refined `postman_collection.json` descriptions so the new requests explain when to use each diagnostic, audit, and validation route.

## Notes
- This refresh is documentation-focused; it does not change runtime behavior.
- Endpoint examples remain representative because some upstream CLI/gateway payloads may vary slightly by OpenClaw version.
- The Management API documentation now better reflects the current `management-api/server.js` surface for status, nodes, heartbeat, secrets, security, and skills workflows.
- Follow-up supplements also aligned internal operator docs and Postman request descriptions with the same route families.

## Status
- Complete.
- Markdown docs rechecked for editor errors after the update.
