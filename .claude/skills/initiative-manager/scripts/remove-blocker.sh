#!/bin/bash

# remove-blocker.sh - Remove blocker from initiative
# Usage: ./remove-blocker.sh <ID> <BLOCKER_NUMBER_OR_TEXT> [DIRECTORY]
# Example: ./remove-blocker.sh FRAUD-2026-01 1
# Example: ./remove-blocker.sh FRAUD-2026-01 "Platform team"

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
    echo "Usage: $0 <ID> <BLOCKER_NUMBER_OR_TEXT> [DIRECTORY]"
    echo ""
    echo "Arguments:"
    echo "  ID                     - Initiative ID"
    echo "  BLOCKER_NUMBER_OR_TEXT - Blocker number (1-based) or partial text match"
    echo "  DIRECTORY              - Optional directory name"
    echo ""
    echo "Examples:"
    echo "  $0 FRAUD-2026-01 1                    # Remove first blocker"
    echo "  $0 FRAUD-2026-01 \"Platform team\"     # Remove blocker containing text"
    exit 1
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
    local blocker_ref="$2"
    local directory="${3:-}"

    # Validate inputs
    validate_initiative_exists "$id" "$directory" || exit 1

    # Get paths
    local dir_path=$(get_directory_path "$directory")
    local readme="$dir_path/$id/README.md"

    # Check if Blockers section exists
    if ! grep -q "^## Blockers / Risks" "$readme"; then
        log_error "Blockers section not found in README.md"
        exit 1
    fi

    log_step "Removing blocker from $id..."

    local temp_file="${readme}.tmp.$$"
    local removed_text=""

    # Determine if blocker_ref is a number or text
    if [[ "$blocker_ref" =~ ^[0-9]+$ ]]; then
        # Remove by number (1-based index)
        local blocker_num=$blocker_ref

        # Extract the blocker text before removing
        removed_text=$(awk -v num="$blocker_num" '
            /^## Blockers \/ Risks/,/^\*\*Past Blockers/ {
                if (/^- / && !/^\*\*Past/) {
                    count++
                    if (count == num) {
                        print substr($0, 3)
                    }
                }
            }
        ' "$readme")

        if [[ -z "$removed_text" ]]; then
            log_error "Blocker #$blocker_num not found"
            exit 1
        fi

        # Remove the specified blocker
        awk -v num="$blocker_num" '
            /^## Blockers \/ Risks/,/^\*\*Past Blockers/ {
                if (/^- / && !/^\*\*Past/) {
                    count++
                    if (count == num) {
                        next
                    }
                }
            }
            {print}
        ' "$readme" > "$temp_file"
    else
        # Remove by text match
        removed_text="$blocker_ref"

        # Find and remove first blocker containing text
        local found=0
        awk -v text="$blocker_ref" '
            /^## Blockers \/ Risks/,/^\*\*Past Blockers/ {
                if (/^- / && !/^\*\*Past/ && index($0, text) > 0 && found == 0) {
                    found = 1
                    next
                }
            }
            {print}
        ' found=0 "$readme" > "$temp_file"

        # Check if blocker was found
        if cmp -s "$readme" "$temp_file"; then
            log_error "Blocker containing '$blocker_ref' not found"
            rm -f "$temp_file"
            exit 1
        fi
    fi

    # Atomic replace
    mv "$temp_file" "$readme"

    log_success "Blocker removed from $id"
    log_info "Removed: $removed_text"

    # Auto-add note about blocker resolution
    local project_root=$(get_project_root)
    local add_note_script="$project_root/scripts/add-note.sh"

    if [[ -f "$add_note_script" ]]; then
        log_step "Adding note about blocker resolution..."
        "$add_note_script" "$id" "Blocker resolved: $removed_text" "$directory" 2>/dev/null || true
    fi

    log_info "Location: $dir_path/$id/README.md"
}

# Run main
main "$@"
