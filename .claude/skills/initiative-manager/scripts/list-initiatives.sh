#!/bin/bash

# list-initiatives.sh - List initiatives with filtering
# Usage: ./list-initiatives.sh [OPTIONS]

set -e
set -u
set -o pipefail

# Get script directory and source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/formatting.sh"
source "$SCRIPT_DIR/lib/config.sh"

# Default values
STATUS_FILTER=""
TYPE_FILTER=""
DIR_FILTER=""
FORMAT="table"
BLOCKED_ONLY=false
OVERDUE_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --status)
            STATUS_FILTER="$2"
            shift 2
            ;;
        --type)
            TYPE_FILTER="$2"
            shift 2
            ;;
        --directory)
            DIR_FILTER="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --blocked)
            BLOCKED_ONLY=true
            shift
            ;;
        --overdue)
            OVERDUE_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --status <status>     Filter by status"
            echo "  --type <type>         Filter by type"
            echo "  --directory <name>    Filter by directory (default: all)"
            echo "  --format <fmt>        Output format: table, json, simple (default: table)"
            echo "  --blocked             Show only initiatives with blockers"
            echo "  --overdue             Show only initiatives past deadline"
            echo "  -h, --help            Show this help"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get directories to scan
if [[ -n "$DIR_FILTER" ]]; then
    SCAN_DIRS=("$(get_directory_path "$DIR_FILTER")")
else
    # Fallback for older bash versions without mapfile
    SCAN_DIRS=()
    while IFS= read -r line; do
        SCAN_DIRS+=("$line")
    done < <(get_all_directory_paths)
fi

# Storage for results
declare -a RESULTS

# Scan initiatives
TODAY=$(date +%Y-%m-%d)

for dir_path in "${SCAN_DIRS[@]}"; do
    if [[ ! -d "$dir_path" ]]; then
        continue
    fi

    for init_dir in "$dir_path"/*/ ; do
        if [[ ! -d "$init_dir" ]]; then
            continue
        fi

        readme="$init_dir/README.md"
        if [[ ! -f "$readme" ]]; then
            continue
        fi

        # Extract metadata
        id=$(basename "$init_dir")
        name=$(grep "^# " "$readme" | head -1 | sed 's/^# //' || echo "Unknown")
        status=$(grep "^- \*\*Status:\*\*" "$readme" | sed 's/^- \*\*Status:\*\* //' || echo "Unknown")
        type=$(grep "^- \*\*Type:\*\*" "$readme" | sed 's/^- \*\*Type:\*\* //' | sed 's/<!--.*//' | xargs || echo "Unknown")
        deadline=$(grep "^- \*\*Target deadline:\*\*" "$readme" | sed 's/^- \*\*Target deadline:\*\* //' || echo "")
        blocker_count=$(awk '/^## Blockers \/ Risks/,/^\*\*Past Blockers/ {if (/^- / && !/^\*\*Past/) count++} END {print count+0}' "$readme")

        # Apply filters
        if [[ -n "$STATUS_FILTER" ]] && [[ "$status" != "$STATUS_FILTER" ]]; then
            continue
        fi

        if [[ -n "$TYPE_FILTER" ]] && [[ "$type" != "$TYPE_FILTER" ]]; then
            continue
        fi

        if [[ "$BLOCKED_ONLY" == true ]] && [[ "$blocker_count" -eq 0 ]]; then
            continue
        fi

        if [[ "$OVERDUE_ONLY" == true ]]; then
            if [[ -z "$deadline" ]] || [[ "$deadline" > "$TODAY" ]]; then
                continue
            fi
        fi

        # Add to results
        RESULTS+=("$id|$name|$status|$type|$deadline|$blocker_count")
    done
done

# Output results
if [[ ${#RESULTS[@]} -eq 0 ]]; then
    log_info "No initiatives found matching criteria"
    exit 0
fi

case "$FORMAT" in
    table)
        echo "ID|Name|Status|Type|Deadline|Blockers"
        echo "---|---|---|---|---|---"
        for result in "${RESULTS[@]}"; do
            echo "$result"
        done | column -t -s '|'
        ;;
    json)
        echo "["
        local first=true
        for result in "${RESULTS[@]}"; do
            IFS='|' read -r id name status type deadline blockers <<< "$result"
            if [[ "$first" == true ]]; then
                first=false
            else
                echo ","
            fi
            cat <<EOF
  {
    "id": "$id",
    "name": "$name",
    "status": "$status",
    "type": "$type",
    "deadline": "$deadline",
    "blockers": $blockers
  }
EOF
        done
        echo ""
        echo "]"
        ;;
    simple)
        for result in "${RESULTS[@]}"; do
            IFS='|' read -r id name status type deadline blockers <<< "$result"
            echo "$id: $name ($status)"
        done
        ;;
    *)
        log_error "Unknown format: $FORMAT"
        exit 1
        ;;
esac
