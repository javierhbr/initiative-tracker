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

INITIATIVES_DIR=$(jq -r '.directories[] | select(.default == true) | .path' "$CONFIG_FILE")
# Expand tilde to home directory
INITIATIVES_DIR="${INITIATIVES_DIR/#\~/$HOME}"

# Load initiative types from config
INITIATIVE_TYPES=$(jq -r '.initiativeTypes[]' "$CONFIG_FILE")

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Create a new initiative with standard structure"
    echo ""
    echo "Usage: $0 <ID> <NAME>"
    echo ""
    echo "Arguments:"
    echo "  ID    Unique initiative ID (e.g., ABC-2026-01)"
    echo "  NAME  Initiative name (e.g., \"Fraud Real-time Signals Integration\")"
    echo ""
    echo "Example:"
    echo "  $0 ABC-2026-01 \"Fraud Real-time Signals Integration\""
    echo ""
    echo "This will create the following structure:"
    echo "  $INITIATIVES_DIR/<ID>/"
    echo "    ├── README.md    (Initiative EPIC with overview, ownership, milestones)"
    echo "    ├── notes.md     (Append-only notes log)"
    echo "    ├── comms.md     (Communications tracking table)"
    echo "    └── links.md     (Important links and references)"
    echo ""
    echo "Available types (from config.json):"
    echo "$INITIATIVE_TYPES" | while IFS= read -r t; do echo "  - $t"; done
    echo ""
    echo "Current Configuration:"
    echo "  Config file: $CONFIG_FILE"
    echo "  Initiatives directory: $INITIATIVES_DIR"
    echo ""
    exit 0
fi

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <ID> <NAME>"
    echo "Example: $0 ABC-2026-01 \"Fraud Real-time Signals Integration\""
    echo ""
    echo "Run '$0 --help' for more information"
    exit 1
fi

ID=$1
NAME=$2

# Select initiative type
echo "Select initiative type:"
i=1
while IFS= read -r type; do
    echo "  $i) $type"
    i=$((i + 1))
done <<< "$INITIATIVE_TYPES"

TYPE_COUNT=$((i - 1))
while true; do
    read -rp "Enter number (1-$TYPE_COUNT): " TYPE_NUM
    if [[ "$TYPE_NUM" =~ ^[0-9]+$ ]] && [ "$TYPE_NUM" -ge 1 ] && [ "$TYPE_NUM" -le "$TYPE_COUNT" ]; then
        TYPE=$(echo "$INITIATIVE_TYPES" | sed -n "${TYPE_NUM}p")
        break
    fi
    echo "Invalid selection. Please enter a number between 1 and $TYPE_COUNT."
done
echo "Selected type: $TYPE"
echo ""

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
- **Type:** __TYPE__
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
sed -i '' "s/__TYPE__/$TYPE/g" "$DIR/README.md"

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
