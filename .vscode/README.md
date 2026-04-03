# VS Code workspace configuration

This folder centralizes local editor automation and recommended tooling.

## Files

- `mcp.json` — MCP server registrations for local AI/dev-doc operations.
- `settings.json` — workspace-wide editor behavior.
- `extensions.json` — recommended VS Code extensions.
- `tasks.json` — Docker-first tasks aligned with xClaw operations.
- `launch.json` — debug attach profile for Node in Docker.
- `profiles/xclaw.code-profile` — optional reusable profile preset.

## Notes

- Preferred local workflow: run and inspect services via Docker Compose.
- Keep secrets out of this folder.
- Use project root `.env` and `xClaw-main/.env` for environment settings.
