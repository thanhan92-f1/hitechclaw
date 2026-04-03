# GitHub repository automation layout

This directory contains repository governance, automation, and Copilot customization files.

## Structure

- `workflows/` — CI/CD pipelines (build, security scan, image/package publish, docs)
- `ISSUE_TEMPLATE/` — issue templates for bug reports and feature requests
- `PULL_REQUEST_TEMPLATE.md` — default pull request checklist
- `CODEOWNERS` — default code review ownership rules
- `dependabot.yml` — automated dependency updates
- `instructions/` — Copilot coding instructions by topic
- `skills/` — Copilot skill packs
- `agents/` — specialized Copilot agents
- `copilot-instructions.md` — main Copilot behavior and codebase guidance

## Maintenance notes

- Keep workflows focused and non-overlapping.
- Avoid adding generic sample workflows that duplicate existing pipelines.
- For xClaw build/test, prefer Docker Compose-based flows.
