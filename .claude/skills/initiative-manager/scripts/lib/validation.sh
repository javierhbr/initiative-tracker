#!/bin/bash

# validation.sh - Input validation functions for initiative-manager skill

# Valid status values
readonly VALID_STATUSES=(
    "Idea"
    "In discovery"
    "In progress"
    "Blocked"
    "Waiting approvals"
    "Delivered"
    "Paused"
    "Cancelled"
)

# Valid type values
readonly VALID_TYPES=(
    "Discovery"
    "PoC"
    "Platform change"
    "Regulatory"
    "Growth"
    "Infra"
)

# Validate initiative ID format and security
# Args: $1=initiative_id
# Returns: 0 if valid, 1 if invalid
validate_initiative_id() {
    local id="$1"

    # Check required
    if [[ -z "$id" ]]; then
        log_error "Initiative ID is required"
        return 1
    fi

    # Security: Directory traversal prevention
    if [[ "$id" == *".."* ]] || [[ "$id" == *"/"* ]]; then
        log_error "Security: Directory traversal detected in ID '$id'"
        log_info "Initiative IDs cannot contain '..' or '/'"
        return 1
    fi

    # Format: UPPERCASE-YYYY-NN
    if ! [[ "$id" =~ ^[A-Z][A-Z0-9]*-[0-9]{4}-[0-9]{2}$ ]]; then
        log_error "Invalid ID format: '$id'"
        log_info "Expected format: UPPERCASE-YYYY-NN"
        log_info "Examples: FRAUD-2026-01, PLATFORM-2026-15"
        return 1
    fi

    return 0
}

# Validate required field is not empty
# Args: $1=value, $2=field_name
# Returns: 0 if valid, 1 if invalid
validate_required() {
    local value="$1"
    local field_name="$2"

    if [[ -z "$value" ]] || [[ "$value" =~ ^[[:space:]]*$ ]]; then
        log_error "Field '$field_name' is required"
        return 1
    fi

    return 0
}

# Validate status value
# Args: $1=status
# Returns: 0 if valid, 1 if invalid
validate_status() {
    local status="$1"

    # Check required
    if ! validate_required "$status" "Status"; then
        return 1
    fi

    # Check against valid statuses
    for valid in "${VALID_STATUSES[@]}"; do
        if [[ "$status" == "$valid" ]]; then
            return 0
        fi
    done

    log_error "Invalid status: '$status'"
    log_info "Valid statuses:"
    for valid in "${VALID_STATUSES[@]}"; do
        echo "  - $valid"
    done
    log_info "See references/STATUS-GUIDE.md for details"
    return 1
}

# Validate type value
# Args: $1=type
# Returns: 0 if valid, 1 if invalid
validate_type() {
    local type="$1"

    # Check required
    if ! validate_required "$type" "Type"; then
        return 1
    fi

    # Check against valid types
    for valid in "${VALID_TYPES[@]}"; do
        if [[ "$type" == "$valid" ]]; then
            return 0
        fi
    done

    log_error "Invalid type: '$type'"
    log_info "Valid types:"
    for valid in "${VALID_TYPES[@]}"; do
        echo "  - $valid"
    done
    return 1
}

# Validate date format (YYYY-MM-DD)
# Args: $1=date_string
# Returns: 0 if valid, 1 if invalid
validate_date() {
    local date_str="$1"

    # Check format
    if ! [[ "$date_str" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        log_error "Invalid date format: '$date_str'"
        log_info "Expected format: YYYY-MM-DD"
        return 1
    fi

    # Validate using date command (portable check)
    if date -j -f "%Y-%m-%d" "$date_str" > /dev/null 2>&1; then
        # macOS/BSD date
        return 0
    elif date -d "$date_str" > /dev/null 2>&1; then
        # GNU date
        return 0
    else
        log_error "Invalid date: '$date_str'"
        log_info "Date must be a valid calendar date"
        return 1
    fi
}

# Validate directory exists in config
# Args: $1=directory_name
# Returns: 0 if valid, 1 if invalid
validate_directory() {
    local dir_name="$1"

    # Empty means use default
    if [[ -z "$dir_name" ]]; then
        return 0
    fi

    # Source config.sh functions
    if ! directory_exists "$dir_name"; then
        log_error "Directory '$dir_name' not found in config.json"
        log_info "Available directories:"
        list_directories
        return 1
    fi

    # Check directory path is writable
    local dir_path=$(get_directory_path "$dir_name")
    if [[ ! -w "$dir_path" ]]; then
        log_error "Directory '$dir_path' is not writable"
        return 1
    fi

    return 0
}

# Validate initiative exists
# Args: $1=initiative_id, $2=directory_name (optional)
# Returns: 0 if exists, 1 if not
validate_initiative_exists() {
    local id="$1"
    local dir_name="$2"

    # Validate ID format first
    if ! validate_initiative_id "$id"; then
        return 1
    fi

    # Get directory path
    local dir_path=$(get_directory_path "$dir_name")
    if [[ $? -ne 0 ]]; then
        return 1
    fi

    local init_path="$dir_path/$id"

    # Check directory exists
    if [[ ! -d "$init_path" ]]; then
        log_error "Initiative '$id' not found"
        if [[ -n "$dir_name" ]]; then
            log_info "Location: $dir_name directory"
        fi
        log_info "Path: $init_path"
        return 1
    fi

    # Check README.md exists (validates structure)
    if [[ ! -f "$init_path/README.md" ]]; then
        log_error "Initiative '$id' is corrupted (missing README.md)"
        log_info "Path: $init_path"
        return 1
    fi

    return 0
}

# Validate initiative does NOT exist (for create operations)
# Args: $1=initiative_id, $2=directory_name (optional)
# Returns: 0 if does not exist, 1 if already exists
validate_initiative_not_exists() {
    local id="$1"
    local dir_name="$2"

    # Validate ID format first
    if ! validate_initiative_id "$id"; then
        return 1
    fi

    # Get directory path
    local dir_path=$(get_directory_path "$dir_name")
    if [[ $? -ne 0 ]]; then
        return 1
    fi

    local init_path="$dir_path/$id"

    # Check directory does not exist
    if [[ -d "$init_path" ]]; then
        log_error "Initiative '$id' already exists"
        log_info "Location: $init_path"
        log_info "Use a different ID or update the existing initiative"
        return 1
    fi

    return 0
}

# Validate name length
# Args: $1=name
# Returns: 0 if valid, 1 if invalid
validate_name() {
    local name="$1"

    if ! validate_required "$name" "Name"; then
        return 1
    fi

    if [[ ${#name} -lt 5 ]]; then
        log_error "Name too short (minimum 5 characters)"
        return 1
    fi

    if [[ ${#name} -gt 100 ]]; then
        log_error "Name too long (maximum 100 characters)"
        return 1
    fi

    return 0
}

# Validate milestone action
# Args: $1=action (should be "check" or "uncheck")
# Returns: 0 if valid, 1 if invalid
validate_milestone_action() {
    local action="$1"

    if [[ "$action" != "check" && "$action" != "uncheck" ]]; then
        log_error "Invalid milestone action: '$action'"
        log_info "Valid actions: check, uncheck"
        return 1
    fi

    return 0
}
