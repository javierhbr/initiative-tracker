#!/bin/bash

# update-status.sh - Update initiative status
# Usage: ./update-status.sh <ID> "<STATUS>" [DIRECTORY]
# Example: ./update-status.sh FRAUD-2026-01 "In progress"

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
    echo "Usage: $0 <ID> <STATUS> [DIRECTORY]"
    echo ""
    echo "Arguments:"
    echo "  ID        - Initiative ID"
    echo "  STATUS    - New status (see valid statuses below)"
    echo "  DIRECTORY - Optional directory name"
    echo ""
    echo "Valid Statuses:"
    for status in "${VALID_STATUSES[@]}"; do
        echo "  - $status"
    done
    echo ""
    echo "Examples:"
    echo "  $0 FRAUD-2026-01 \"In progress\""
    echo "  $0 PLATFORM-2026-05 \"Blocked\" Work"
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
    local new_status="$2"
    local directory="${3:-}"

    # Validate inputs
    validate_initiative_exists "$id" "$directory" || exit 1
    validate_status "$new_status" || exit 1

    # Get paths
    local dir_path=$(get_directory_path "$directory")
    local readme="$dir_path/$id/README.md"

    # Get current status
    local current_status=$(grep "^- \*\*Status:\*\*" "$readme" | sed 's/^- \*\*Status:\*\* //' || echo "Unknown")

    # Check if status is already set
    if [[ "$current_status" == "$new_status" ]]; then
        log_warning "Status already set to '$new_status'. No change made."
        exit 0
    fi

    log_step "Updating status from '$current_status' to '$new_status'..."

    # Update status atomically
    local temp_file="${readme}.tmp.$$"

    # Update status line
    sed "s/^- \*\*Status:\*\* .*/- **Status:** $new_status/" "$readme" > "$temp_file"

    # Validate modification worked
    if ! grep -qF "Status:** $new_status" "$temp_file"; then
        log_error "Failed to update status in README.md"
        rm -f "$temp_file"
        exit 1
    fi

    # Atomic replace
    mv "$temp_file" "$readme"

    log_success "Status updated to: $new_status"

    # Auto-add note about status change
    local project_root=$(get_project_root)
    local add_note_script="$project_root/scripts/add-note.sh"

    if [[ -f "$add_note_script" ]]; then
        log_step "Adding note about status change..."
        "$add_note_script" "$id" "Status updated from '$current_status' to '$new_status'" "$directory" 2>/dev/null || true
    fi

    log_info "Initiative: $id"
    log_info "Location: $dir_path/$id"
}

# Run main
main "$@"
