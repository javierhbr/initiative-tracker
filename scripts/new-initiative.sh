#!/bin/bash

# Create a new initiative with standard structure
# Usage: ./scripts/new-initiative.sh <ID> "<NAME>"
# Example: ./scripts/new-initiative.sh ABC-2026-01 "Fraud Real-time Signals Integration"

set -e

# Load config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: config.json not found at $CONFIG_FILE"
    exit 1
fi

INITIATIVES_DIR=$(jq -r '.directories.initiatives' "$CONFIG_FILE")

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <ID> <NAME>"
    echo "Example: $0 ABC-2026-01 \"Fraud Real-time Signals Integration\""
    exit 1
fi

ID=$1
NAME=$2
DIR="$INITIATIVES_DIR/$ID"

if [ -d "$DIR" ]; then
    echo "Error: Initiative $ID already exists at $DIR"
    exit 1
fi

mkdir -p "$DIR"

# Create README.md (Initiative EPIC)
cat <<'EOF' > "$DIR/README.md"
# __NAME__

## Overview
- **Initiative ID:** __ID__
- **Type:** <!-- Discovery | PoC | Platform change | Regulatory | Growth | Infra -->
- **Status:** Idea
- **Start date:**
- **Target deadline:**
- **Deadline type:** <!-- Soft | Commercial | Contractual | Regulatory -->

**One-liner:**
<!-- What problem does this solve and why does it matter? (1-2 lines) -->

---

## Ownership
- **Sponsor:** <!-- Name - Area -->
- **Requestor:** <!-- Who raised the need -->
- **Product Owner:**
- **Tech / Staff Owner:**

**Teams involved:**
-

---

## Stakeholders & Approvals
- [ ] Product
- [ ] Business
- [ ] Risk
- [ ] Legal
- [ ] Security
- [ ] Compliance
- [ ] Platform Architecture

---

## High-level Milestones
- [ ] Discovery completed
- [ ] Architecture aligned
- [ ] Risk / Legal sign-off
- [ ] Development started
- [ ] Rollout
- [ ] Post-launch review

---

## Blockers / Risks
-

---

## Final Sign-offs
- [ ] Product – Name – Date
- [ ] Tech / Platform – Name – Date
- [ ] Risk / Legal – Name – Date

---

## References
- Links & artifacts → `links.md`
- Notes & decisions → `notes.md`
- Communications log → `comms.md`
EOF

# Replace placeholders
sed -i '' "s/__NAME__/$NAME/g" "$DIR/README.md"
sed -i '' "s/__ID__/$ID/g" "$DIR/README.md"

# Create notes.md
cat <<EOF > "$DIR/notes.md"
# Initiative Notes — $ID

<!-- Append-only log. Never edit above, only add below. -->

## $(date +%Y-%m-%d)
- Initiative created.
EOF

# Create comms.md
cat <<EOF > "$DIR/comms.md"
# Communications Log — $ID

| Date | Channel | Link | Context |
|------|---------|------|---------|
EOF

# Create links.md
cat <<EOF > "$DIR/links.md"
# Important Links — $ID

## Docs
- PRD:
- Tech Spec / RFC:
- Architecture Diagram:
- Executive Deck:

## Tracking
- Jira Epic(s):
- Roadmap item:

## Repos
-
EOF

echo "✓ Initiative $ID created at $DIR"
echo "  - README.md (Initiative EPIC)"
echo "  - notes.md"
echo "  - comms.md"
echo "  - links.md"
