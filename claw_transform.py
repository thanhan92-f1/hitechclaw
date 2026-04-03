# claw_transform.py
# Replace all xclaw/xlcaw trong toàn bộ project và giữ kiểu chữ gần đúng.

from pathlib import Path
import re

SKIP_DIRS = {
    ".git", ".svn", ".hg", ".idea", ".vscode",
    "node_modules", "dist", "build", "out",
    "target", "bin", "obj", "coverage",
    "__pycache__", ".venv", "venv", ".next", ".nuxt",
}

SKIP_FILES = {
    "claw_transform.py",
}

PATTERN = re.compile(rb"xclaw|xlcaw", re.IGNORECASE)
TARGET = "hitechclaw"


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts) or path.name in SKIP_FILES


def apply_case(src: bytes, target: str) -> bytes:
    s = src.decode("ascii", errors="ignore")

    if s.islower():
        return target.lower().encode("utf-8")

    if s.isupper():
        return target.upper().encode("utf-8")

    if s == "xClaw":
        return b"HiTechClaw"

    if s == "XClaw":
        return b"HiTechClaw"

    out = []
    j = 0
    for ch in target:
        if ch.isalpha():
            if j < len(s) and s[j].isupper():
                out.append(ch.upper())
            else:
                out.append(ch.lower())
            j += 1
        else:
            out.append(ch)
    return "".join(out).encode("utf-8")


def replace_match(match: re.Match[bytes]) -> bytes:
    return apply_case(match.group(0), TARGET)


def process_file(path: Path):
    try:
        original = path.read_bytes()
    except Exception:
        return False, 0

    matches = list(PATTERN.finditer(original))
    if not matches:
        return False, 0

    updated = PATTERN.sub(replace_match, original)
    if updated == original:
        return False, 0

    try:
        path.write_bytes(updated)
        return True, len(matches)
    except Exception:
        return False, 0


def main():
    root = Path.cwd()
    changed_files = 0
    total_replacements = 0

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if should_skip(path):
            continue

        changed, replacements = process_file(path)
        if changed:
            changed_files += 1
            total_replacements += replacements
            print(f"UPDATED: {path} ({replacements} replacements)")

    print(f"DONE: {changed_files} files updated, {total_replacements} replacements")


if __name__ == "__main__":
    main()