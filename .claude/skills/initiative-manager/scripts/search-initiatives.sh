#!/bin/bash

# search-initiatives.sh - Full-text search across initiatives
# Usage: ./search-initiatives.sh <QUERY> [OPTIONS]

set -e
set -u
set -o pipefail

# Get script directory and source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/formatting.sh"
source "$SCRIPT_DIR/lib/config.sh"

# Default values
DIR_FILTER=""
FILE_FILTER=""
CONTEXT=2

# Parse arguments
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <QUERY> [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  QUERY - Search query"
    echo ""
    echo "Options:"
    echo "  --directory <name>       Search in specific directory"
    echo "  --file <type>            Search in specific file type (readme|notes|comms|links)"
    echo "  --context <N>            Show N lines of context (default: 2)"
    echo ""
    echo "Examples:"
    echo "  $0 \"regulatory\""
    echo "  $0 \"vendor\" --file notes"
    echo "  $0 \"architecture\" --context 5"
    exit 1
fi

QUERY="$1"
shift

# Parse remaining options
while [[ $# -gt 0 ]]; do
    case $1 in
        --directory)
            DIR_FILTER="$2"
            shift 2
            ;;
        --file)
            FILE_FILTER="$2"
            shift 2
            ;;
        --context)
            CONTEXT="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get directories to search
if [[ -n "$DIR_FILTER" ]]; then
    SEARCH_DIRS=("$(get_directory_path "$DIR_FILTER")")
else
    # Fallback for older bash versions without mapfile
    SEARCH_DIRS=()
    while IFS= read -r line; do
        SEARCH_DIRS+=("$line")
    done < <(get_all_directory_paths)
fi

# Build file pattern
case "$FILE_FILTER" in
    readme)
        FILE_PATTERN="README.md"
        ;;
    notes)
        FILE_PATTERN="notes.md"
        ;;
    comms)
        FILE_PATTERN="comms.md"
        ;;
    links)
        FILE_PATTERN="links.md"
        ;;
    "")
        FILE_PATTERN="*.md"
        ;;
    *)
        log_error "Invalid file filter: $FILE_FILTER"
        log_info "Valid filters: readme, notes, comms, links"
        exit 1
        ;;
esac

log_info "Searching for: $QUERY"
echo ""

FOUND_COUNT=0

# Search in each directory
for dir_path in "${SEARCH_DIRS[@]}"; do
    if [[ ! -d "$dir_path" ]]; then
        continue
    fi

    # Use grep for search
    if command -v rg &> /dev/null; then
        # Use ripgrep if available (faster)
        rg -i -n -C "$CONTEXT" "$QUERY" "$dir_path"/*/"$FILE_PATTERN" 2>/dev/null || true
    else
        # Fall back to grep
        grep -r -i -n -C "$CONTEXT" "$QUERY" "$dir_path"/*/"$FILE_PATTERN" 2>/dev/null || true
    fi
done

echo ""
log_info "Search complete"
