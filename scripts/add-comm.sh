#!/bin/bash

# Add a communication entry to an initiative
# Usage: ./scripts/add-comm.sh <ID> <CHANNEL> <LINK> "<CONTEXT>"
# Example: ./scripts/add-comm.sh ABC-2026-01 Slack https://slack/... "Kickoff with Risk"

set -e

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
    echo "Usage: $0 <ID> <CHANNEL> <LINK> <CONTEXT>"
    echo "Example: $0 ABC-2026-01 Slack https://slack/... \"Kickoff with Risk\""
    exit 1
fi

ID=$1
CHANNEL=$2
LINK=$3
CONTEXT=$4
FILE="initiatives/$ID/comms.md"

if [ ! -f "$FILE" ]; then
    echo "Error: Initiative $ID not found (missing $FILE)"
    exit 1
fi

TODAY=$(date +%Y-%m-%d)
echo "| $TODAY | $CHANNEL | $LINK | $CONTEXT |" >> "$FILE"

echo "✓ Communication logged for $ID"
