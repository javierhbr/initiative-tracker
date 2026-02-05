#!/bin/bash

# add-blocker.sh - Add blocker to initiative
# Usage: ./add-blocker.sh <ID> "<BLOCKER>" [DIRECTORY]
# Example: ./add-blocker.sh FRAUD-2026-01 "Waiting for Platform team capacity"

set -e
set -u
set -o pipefail

# Get script directory and source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/formatting.sh"
source "$SCRIPT_DIR/lib/config.sh"
source "$SCRIPT_DIR/lib/validation.sh"

# Error handler
handle_error() {
    local exit_code=$?
    log_error "Script failed at line $1 with exit code $exit_code"
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

# Usage
usage() {
    echo "Usage: $0 <ID> <BLOCKER> [DIRECTORY]"
    echo ""
    echo "Arguments:"
    echo "  ID        - Initiative ID"
    echo "  BLOCKER   - Blocker description"
    echo "  DIRECTORY - Optional directory name"
    echo ""
    echo "Example:"
    echo "  $0 FRAUD-2026-01 \"Waiting for Platform team Q2 capacity (Owner: Jane)\""
    exit 1
}

# Count blockers in README
count_blockers() {
    local readme="$1"

    # Count lines starting with "- " in Blockers section (before "Past Blockers")
    awk '/^## Blockers \/ Risks/,/^\*\*Past Blockers/ {if (/^- / && !/^\*\*Past/) count++} END {print count+0}' "$readme"
}

# Main function
main() {
    # Check arguments
    if [[ $# -lt 2 ]]; then
        log_error "Missing required arguments"
        echo ""
        usage
    fi

    local id="$1"
    local blocker="$2"
    local directory="${3:-}"

    # Validate inputs
    validate_initiative_exists "$id" "$directory" || exit 1
    validate_required "$blocker" "Blocker" || exit 1

    # Get paths
    local dir_path=$(get_directory_path "$directory")
    local readme="$dir_path/$id/README.md"

    # Check if Blockers section exists
    if ! grep -q "^## Blockers / Risks" "$readme"; then
        log_error "Blockers section not found in README.md"
        log_info "Initiative may have non-standard structure"
        exit 1
    fi

    log_step "Adding blocker to $id..."

    # Add blocker atomically
    local temp_file="${readme}.tmp.$$"

    # Insert blocker after "## Blockers / Risks" section
    awk -v blocker="$blocker" '
        /^## Blockers \/ Risks/ {
            print
            getline
            print
            print "- " blocker
            next
        }
        {print}
    ' "$readme" > "$temp_file"

    # Validate modification worked
    if ! grep -qF "$blocker" "$temp_file"; then
        log_error "Failed to add blocker to README.md"
        rm -f "$temp_file"
        exit 1
    fi

    # Atomic replace
    mv "$temp_file" "$readme"

    # Count blockers
    local count=$(count_blockers "$readme")

    log_success "Blocker added to $id"
    log_info "Total blockers: $count"

    # Auto-add note about blocker
    local project_root=$(get_project_root)
    local add_note_script="$project_root/scripts/add-note.sh"

    if [[ -f "$add_note_script" ]]; then
        log_step "Adding note about new blocker..."
        "$add_note_script" "$id" "Blocker added: $blocker" "$directory" 2>/dev/null || true
    fi

    log_info "Location: $dir_path/$id/README.md"
}

# Run main
main "$@"
