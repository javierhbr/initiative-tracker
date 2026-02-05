#!/bin/bash

# config.sh - Configuration file parsing for initiative-manager skill

# Get the project root directory (assumes scripts are in .claude/skills/initiative-manager/scripts/)
get_project_root() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # Go up 4 levels: lib -> scripts -> initiative-manager -> skills -> .claude -> project root
    echo "$(cd "$script_dir/../../../../.." && pwd)"
}

# Get config file path
get_config_file() {
    local project_root=$(get_project_root)
    echo "$project_root/config.json"
}

# Parse config.json and get directory path by name
# Args: $1=directory_name (optional, uses default if not provided)
# Returns: directory path or exits with error
get_directory_path() {
    local dir_name="$1"
    local config_file=$(get_config_file)
    local default_path="$(get_project_root)/initiatives"

    # Check if config file exists
    if [[ ! -f "$config_file" ]]; then
        log_warning "Config file not found: $config_file"
        log_info "Using default directory: $default_path"
        echo "$default_path"
        return 0
    fi

    # If no directory name provided, get default directory
    if [[ -z "$dir_name" ]]; then
        if command -v jq &> /dev/null; then
            local path=$(jq -r '.directories[] | select(.default == true) | .path' "$config_file" 2>/dev/null)
            if [[ -n "$path" && "$path" != "null" ]]; then
                # Convert relative path to absolute
                if [[ "$path" = /* ]]; then
                    echo "$path"
                else
                    echo "$(get_project_root)/$path"
                fi
                return 0
            fi
        else
            # Fallback: use Python to parse JSON
            local path=$(python3 -c "import json; data=json.load(open('$config_file')); print(next((d['path'] for d in data.get('directories', []) if d.get('default')), '$default_path'))" 2>/dev/null)
            if [[ -n "$path" ]]; then
                if [[ "$path" = /* ]]; then
                    echo "$path"
                else
                    echo "$(get_project_root)/$path"
                fi
                return 0
            fi
        fi

        # Fallback to default
        echo "$default_path"
        return 0
    fi

    # Get named directory
    if command -v jq &> /dev/null; then
        local path=$(jq -r ".directories[] | select(.name == \"$dir_name\") | .path" "$config_file" 2>/dev/null)
        if [[ -n "$path" && "$path" != "null" ]]; then
            # Convert relative path to absolute
            if [[ "$path" = /* ]]; then
                echo "$path"
            else
                echo "$(get_project_root)/$path"
            fi
            return 0
        fi
    else
        # Fallback: use Python to parse JSON
        local path=$(python3 -c "import json; data=json.load(open('$config_file')); print(next((d['path'] for d in data.get('directories', []) if d.get('name') == '$dir_name'), ''))" 2>/dev/null)
        if [[ -n "$path" ]]; then
            if [[ "$path" = /* ]]; then
                echo "$path"
            else
                echo "$(get_project_root)/$path"
            fi
            return 0
        fi
    fi

    # Directory not found
    log_error "Directory '$dir_name' not found in config.json"
    log_info "Available directories:"
    list_directories
    return 1
}

# Get default directory name and path
get_default_directory() {
    local config_file=$(get_config_file)

    if [[ ! -f "$config_file" ]]; then
        echo "Personal|$(get_project_root)/initiatives"
        return 0
    fi

    if command -v jq &> /dev/null; then
        local name=$(jq -r '.directories[] | select(.default == true) | .name' "$config_file" 2>/dev/null)
        local path=$(jq -r '.directories[] | select(.default == true) | .path' "$config_file" 2>/dev/null)
        if [[ -n "$name" && "$name" != "null" ]]; then
            echo "$name|$path"
            return 0
        fi
    fi

    # Fallback
    echo "Personal|$(get_project_root)/initiatives"
}

# List all configured directories
# Output: name: path (one per line)
list_directories() {
    local config_file=$(get_config_file)

    if [[ ! -f "$config_file" ]]; then
        echo "Personal: $(get_project_root)/initiatives"
        return 0
    fi

    if command -v jq &> /dev/null; then
        jq -r '.directories[] | "\(.name): \(.path)"' "$config_file" 2>/dev/null
    else
        python3 -c "import json; data=json.load(open('$config_file')); [print(f\"{d['name']}: {d['path']}\") for d in data.get('directories', [])]" 2>/dev/null
    fi
}

# Check if directory exists in config
# Args: $1=directory_name
# Returns: 0 if exists, 1 if not
directory_exists() {
    local dir_name="$1"
    local config_file=$(get_config_file)

    if [[ ! -f "$config_file" ]]; then
        [[ "$dir_name" == "Personal" ]]
        return $?
    fi

    if command -v jq &> /dev/null; then
        jq -e ".directories[] | select(.name == \"$dir_name\")" "$config_file" > /dev/null 2>&1
        return $?
    else
        python3 -c "import json,sys; data=json.load(open('$config_file')); sys.exit(0 if any(d.get('name') == '$dir_name' for d in data.get('directories', [])) else 1)" 2>/dev/null
        return $?
    fi
}

# Get all directory paths (for scanning all initiatives)
# Returns: array of directory paths
get_all_directory_paths() {
    local config_file=$(get_config_file)

    if [[ ! -f "$config_file" ]]; then
        echo "$(get_project_root)/initiatives"
        return 0
    fi

    if command -v jq &> /dev/null; then
        jq -r '.directories[] | .path' "$config_file" 2>/dev/null | while read -r path; do
            if [[ "$path" = /* ]]; then
                echo "$path"
            else
                echo "$(get_project_root)/$path"
            fi
        done
    else
        python3 -c "import json; data=json.load(open('$config_file')); [print(d['path']) for d in data.get('directories', [])]" 2>/dev/null | while read -r path; do
            if [[ "$path" = /* ]]; then
                echo "$path"
            else
                echo "$(get_project_root)/$path"
            fi
        done
    fi
}
