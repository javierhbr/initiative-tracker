#!/bin/bash

# Add a communication entry to an initiative
# Usage: ./scripts/add-comm.sh <ID> <CHANNEL> <LINK> "<CONTEXT>"
# Example: ./scripts/add-comm.sh ABC-2026-01 Slack https://slack/... "Kickoff with Risk"

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

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Add a communication entry to an initiative"
    echo ""
    echo "Usage: $0 <ID> <CHANNEL> <LINK> <CONTEXT>"
    echo ""
    echo "Arguments:"
    echo "  ID        Initiative ID (e.g., ABC-2026-01)"
    echo "  CHANNEL   Communication channel (e.g., Slack, Email, Teams)"
    echo "  LINK      Link to the conversation or thread"
    echo "  CONTEXT   Brief description of what was discussed"
    echo ""
    echo "Example:"
    echo "  $0 ABC-2026-01 Slack https://slack/... \"Kickoff with Risk\""
    echo ""
    echo "Current Configuration:"
    echo "  Config file: $CONFIG_FILE"
    echo "  Initiatives directory: $INITIATIVES_DIR"
    echo ""
    exit 0
fi

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
    echo "Usage: $0 <ID> <CHANNEL> <LINK> <CONTEXT>"
    echo "Example: $0 ABC-2026-01 Slack https://slack/... \"Kickoff with Risk\""
    echo ""
    echo "Run '$0 --help' for more information"
    exit 1
fi

ID=$1
CHANNEL=$2
LINK=$3
CONTEXT=$4
FILE="$INITIATIVES_DIR/$ID/comms.md"

if [ ! -f "$FILE" ]; then
    echo "Error: Initiative $ID not found (missing $FILE)"
    exit 1
fi

TODAY=$(date +%Y-%m-%d)
echo "| $TODAY | $CHANNEL | $LINK | $CONTEXT |" >> "$FILE"

echo "✓ Communication logged for $ID"
