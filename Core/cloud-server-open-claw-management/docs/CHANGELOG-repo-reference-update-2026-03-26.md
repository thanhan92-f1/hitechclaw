# Changelog — Repo Reference Update (2026-03-26)

## Objective
- Synchronize all documentation and installation/update scripts to the current repo:

- `Pho-Tue-Software-Solutions-JSC/cloud-server-open-claw-management`

- `main` branch

## Updated Files
- `README.md`
- `bootstrap.sh`
- `Architecture.md`
- `docs/update-guide.md`

## Changes
- Standardize the `raw.githubusercontent.com` URLs pointing to the old repo/branch.

- Change references from:

- `Pho-Tue-SoftWare-Solutions-JSC/vps-openclaw-management`

- the old `v2` or `main` branch
- To:

- `Pho-Tue-SoftWare-Solutions-JSC/cloud-server-open-claw-management`

- the `main` branch

## Details
### `README.md`
- Keep the quick install command pointing correctly to `cloud-server-open-claw-management/main/install.sh`.

### `bootstrap.sh`
- Confirm that `REPO_RAW` is using the correct `cloud-server-open-claw-management/main` repo.

### `Architecture.md`
- Update the quick install command to the current repo.

- Update the manual `management-api/server.js` download command to the current repo.

### `docs/update-guide.md`
- Update `REPO_RAW` to the current repository to synchronize the manual update process.

## Notes
- Changes are focused only on repository/branch references.

- No deployment logic changes beyond those previously modified in `install.sh` and `management-api/server.js`.

- After review, target files no longer reference `vps-openclaw-management/v2`.

## Status
- Complete.

- Rechecked and no longer references the old repository in target files.