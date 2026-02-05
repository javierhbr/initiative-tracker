#!/bin/bash

# Add a note to an initiative
# Usage: ./scripts/add-note.sh <ID> "<NOTE>"
# Example: ./scripts/add-note.sh ABC-2026-01 "Product alignment delayed due to roadmap conflict"

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
    echo "Usage: $0 <ID> <NOTE>"
    echo "Example: $0 ABC-2026-01 \"Product alignment delayed due to roadmap conflict\""
    exit 1
fi

ID=$1
NOTE=$2
FILE="$INITIATIVES_DIR/$ID/notes.md"

if [ ! -f "$FILE" ]; then
    echo "Error: Initiative $ID not found (missing $FILE)"
    exit 1
fi

# Check if today's date header already exists
TODAY=$(date +%Y-%m-%d)
if grep -q "## $TODAY" "$FILE"; then
    # Append to existing date section
    echo "- $NOTE" >> "$FILE"
else
    # Create new date section
    echo -e "\n## $TODAY\n- $NOTE" >> "$FILE"
fi

echo "✓ Note added to $ID"
