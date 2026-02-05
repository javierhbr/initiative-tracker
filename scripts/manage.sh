#!/bin/bash

# Initiative Manager - Unified interactive and CLI script
# Usage: ./manage.sh [SUBCOMMAND] [ARGS...]
#   Interactive: ./manage.sh
#   CLI: ./manage.sh new <ID> <NAME>
#        ./manage.sh note <ID> <NOTE>
#        ./manage.sh comm <ID> <CHANNEL> <LINK> <CONTEXT>
#        ./manage.sh list

set -e

# ============================================================================
# Configuration & Setup
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"
INITIATIVES_DIR=""

# Load configuration
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "✗ Error: config.json not found at $CONFIG_FILE"
        exit 1
    fi

    # Check how many directories are configured
    local dir_count=$(jq '.directories | length' "$CONFIG_FILE")

    if [ "$dir_count" -eq 0 ]; then
        echo "✗ Error: No directories found in config.json"
        exit 1
    elif [ "$dir_count" -eq 1 ]; then
        # Only one directory, use it
        INITIATIVES_DIR=$(jq -r '.directories[0].path' "$CONFIG_FILE")
    else
        # Multiple directories, check for default
        INITIATIVES_DIR=$(jq -r '.directories[] | select(.default == true) | .path' "$CONFIG_FILE" | head -n 1)

        if [ -z "$INITIATIVES_DIR" ]; then
            # No default set, use first directory
            INITIATIVES_DIR=$(jq -r '.directories[0].path' "$CONFIG_FILE")
        fi
    fi

    # Expand tilde to home directory
    INITIATIVES_DIR="${INITIATIVES_DIR/#\~/$HOME}"

    # Create directory if it doesn't exist
    mkdir -p "$INITIATIVES_DIR"
}

# Prompt user to select directory (when multiple exist)
select_directory() {
    local dir_count=$(jq '.directories | length' "$CONFIG_FILE")

    if [ "$dir_count" -eq 1 ]; then
        # Only one directory, use it directly
        INITIATIVES_DIR=$(jq -r '.directories[0].path' "$CONFIG_FILE")
        INITIATIVES_DIR="${INITIATIVES_DIR/#\~/$HOME}"
        return 0
    fi

    # Multiple directories available
    echo ""
    echo "=== Select Directory ==="
    echo ""

    local i=1
    while [ $i -le "$dir_count" ]; do
        local idx=$((i-1))
        local name=$(jq -r ".directories[$idx].name" "$CONFIG_FILE")
        local path=$(jq -r ".directories[$idx].path" "$CONFIG_FILE")
        local is_default=$(jq -r ".directories[$idx].default // false" "$CONFIG_FILE")

        if [ "$is_default" = "true" ]; then
            echo "$i) $name ($path) [default]"
        else
            echo "$i) $name ($path)"
        fi
        i=$((i+1))
    done

    echo ""
    read -p "Choose directory (1-$dir_count): " choice

    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "$dir_count" ]; then
        echo "✗ Error: Invalid choice"
        return 1
    fi

    local selected_idx=$((choice-1))
    INITIATIVES_DIR=$(jq -r ".directories[$selected_idx].path" "$CONFIG_FILE")
    INITIATIVES_DIR="${INITIATIVES_DIR/#\~/$HOME}"

    echo "✓ Selected: $(jq -r ".directories[$selected_idx].name" "$CONFIG_FILE")"
    echo ""
}

# ============================================================================
# Utility Functions
# ============================================================================

# Validate that an initiative exists
validate_initiative_exists() {
    local id="$1"
    local dir="$INITIATIVES_DIR/$id"

    if [ ! -d "$dir" ]; then
        echo "✗ Error: Initiative $id not found at $dir"
        return 1
    fi
    return 0
}

# List all initiatives
list_initiatives() {
    echo ""
    echo "=== Initiatives in $INITIATIVES_DIR ==="
    echo ""

    if [ ! -d "$INITIATIVES_DIR" ] || [ -z "$(ls -A "$INITIATIVES_DIR" 2>/dev/null)" ]; then
        echo "  No initiatives found."
        echo ""
        return
    fi

    for dir in "$INITIATIVES_DIR"/*; do
        if [ -d "$dir" ]; then
            local id=$(basename "$dir")
            local name=""

            # Try to extract name from README.md
            if [ -f "$dir/README.md" ]; then
                name=$(head -n 1 "$dir/README.md" | sed 's/^# //')
            fi

            if [ -n "$name" ]; then
                echo "  [$id] $name"
            else
                echo "  [$id]"
            fi
        fi
    done
    echo ""
}

# Show help
show_help() {
    local dir_count=$(jq '.directories | length' "$CONFIG_FILE")

    cat <<EOF

Initiative Manager - Manage cross-team initiatives

USAGE:
  Interactive mode:
    ./manage.sh                    Launch interactive menu

  CLI mode:
    ./manage.sh new <ID> <NAME>    Create new initiative
    ./manage.sh note <ID> <NOTE>   Add note to initiative
    ./manage.sh comm <ID> <CHANNEL> <LINK> <CONTEXT>
                                   Log communication entry
    ./manage.sh list               List all initiatives
    ./manage.sh --help             Show this help

EXAMPLES:
  ./manage.sh new ABC-2026-01 "Fraud Detection Integration"
  ./manage.sh note ABC-2026-01 "Kickoff meeting scheduled"
  ./manage.sh comm ABC-2026-01 Slack https://slack/... "Risk approval"
  ./manage.sh list

CONFIGURATION:
  Config file: $CONFIG_FILE
EOF

    if [ "$dir_count" -gt 1 ]; then
        echo "  Available directories:"
        local i=0
        while [ $i -lt "$dir_count" ]; do
            local name=$(jq -r ".directories[$i].name" "$CONFIG_FILE")
            local path=$(jq -r ".directories[$i].path" "$CONFIG_FILE")
            local is_default=$(jq -r ".directories[$i].default // false" "$CONFIG_FILE")

            if [ "$is_default" = "true" ]; then
                echo "    - $name: $path [default]"
            else
                echo "    - $name: $path"
            fi
            i=$((i+1))
        done
    else
        echo "  Initiatives directory: $INITIATIVES_DIR"
    fi

    echo ""
}

# ============================================================================
# CLI Mode Commands
# ============================================================================

# Create new initiative
cmd_new() {
    local id="$1"
    local name="$2"

    if [ -z "$id" ] || [ -z "$name" ]; then
        echo "✗ Error: Missing required arguments"
        echo "Usage: $0 new <ID> <NAME>"
        exit 1
    fi

    local dir="$INITIATIVES_DIR/$id"

    if [ -d "$dir" ]; then
        echo "✗ Error: Initiative $id already exists at $dir"
        exit 1
    fi

    mkdir -p "$dir"

    # Create README.md (Initiative EPIC)
    cat <<'EOF' > "$dir/README.md"
# __NAME__

## Overview
- **Initiative ID:** __ID__
- **Type:** <!-- Discovery | PoC | Platform change | Regulatory | Growth | Infra -->
- **Status:** Idea
- **Start date:**
- **Target deadline:**
- **Deadline type:** <!-- Soft | Commercial | Contractual | Regulatory -->

**One-liner:**
<!-- What problem does this solve and why does it matter? (1-2 lines) -->

---

## Ownership
- **Sponsor:** <!-- Name - Area -->
- **Requestor:** <!-- Who raised the need -->
- **Product Owner:**
- **Tech / Staff Owner:**

**Teams involved:**
-

---

## Stakeholders & Approvals
- [ ] Product
- [ ] Business
- [ ] Risk
- [ ] Legal
- [ ] Security
- [ ] Compliance
- [ ] Platform Architecture

---

## High-level Milestones
- [ ] Discovery completed
- [ ] Architecture aligned
- [ ] Risk / Legal sign-off
- [ ] Development started
- [ ] Rollout
- [ ] Post-launch review

---

## Blockers / Risks
-

---

## Final Sign-offs
- [ ] Product – Name – Date
- [ ] Tech / Platform – Name – Date
- [ ] Risk / Legal – Name – Date

---

## References
- Links & artifacts → `links.md`
- Notes & decisions → `notes.md`
- Communications log → `comms.md`
EOF

    # Replace placeholders
    sed -i '' "s/__NAME__/$name/g" "$dir/README.md"
    sed -i '' "s/__ID__/$id/g" "$dir/README.md"

    # Create notes.md
    cat <<EOF > "$dir/notes.md"
# Initiative Notes — $id

<!-- Append-only log. Never edit above, only add below. -->

## $(date +%Y-%m-%d)
- Initiative created.
EOF

    # Create comms.md
    cat <<EOF > "$dir/comms.md"
# Communications Log — $id

| Date | Channel | Link | Context |
|------|---------|------|---------|
EOF

    # Create links.md
    cat <<EOF > "$dir/links.md"
# Important Links — $id

## Docs
- PRD:
- Tech Spec / RFC:
- Architecture Diagram:
- Executive Deck:

## Tracking
- Jira Epic(s):
- Roadmap item:

## Repos
-
EOF

    echo "✓ Initiative $id created at $dir"
    echo "  - README.md (Initiative EPIC)"
    echo "  - notes.md"
    echo "  - comms.md"
    echo "  - links.md"
}

# Add note to initiative
cmd_note() {
    local id="$1"
    local note="$2"

    if [ -z "$id" ] || [ -z "$note" ]; then
        echo "✗ Error: Missing required arguments"
        echo "Usage: $0 note <ID> <NOTE>"
        exit 1
    fi

    validate_initiative_exists "$id" || exit 1

    local file="$INITIATIVES_DIR/$id/notes.md"

    if [ ! -f "$file" ]; then
        echo "✗ Error: notes.md not found for initiative $id"
        exit 1
    fi

    # Check if today's date header already exists
    local today=$(date +%Y-%m-%d)
    if grep -q "## $today" "$file"; then
        # Append to existing date section
        echo "- $note" >> "$file"
    else
        # Create new date section
        echo -e "\n## $today\n- $note" >> "$file"
    fi

    echo "✓ Note added to $id"
}

# Log communication entry
cmd_comm() {
    local id="$1"
    local channel="$2"
    local link="$3"
    local context="$4"

    if [ -z "$id" ] || [ -z "$channel" ] || [ -z "$link" ] || [ -z "$context" ]; then
        echo "✗ Error: Missing required arguments"
        echo "Usage: $0 comm <ID> <CHANNEL> <LINK> <CONTEXT>"
        exit 1
    fi

    validate_initiative_exists "$id" || exit 1

    local file="$INITIATIVES_DIR/$id/comms.md"

    if [ ! -f "$file" ]; then
        echo "✗ Error: comms.md not found for initiative $id"
        exit 1
    fi

    local today=$(date +%Y-%m-%d)
    echo "| $today | $channel | $link | $context |" >> "$file"

    echo "✓ Communication logged for $id"
}

# ============================================================================
# Interactive Mode
# ============================================================================

# Prompt for new initiative
prompt_new_initiative() {
    echo ""
    echo "=== Create New Initiative ==="
    echo ""

    # Select directory if multiple exist
    select_directory || return 1

    read -p "Initiative ID (e.g., ABC-2026-01): " id

    if [ -z "$id" ]; then
        echo "✗ Error: ID cannot be empty"
        return 1
    fi

    read -p "Initiative Name: " name

    if [ -z "$name" ]; then
        echo "✗ Error: Name cannot be empty"
        return 1
    fi

    echo ""
    cmd_new "$id" "$name"
    echo ""
    read -p "Press Enter to continue..."
}

# Prompt for adding note
prompt_add_note() {
    echo ""
    list_initiatives

    read -p "Initiative ID: " id

    if [ -z "$id" ]; then
        echo "✗ Error: ID cannot be empty"
        return 1
    fi

    echo ""
    read -p "Note text: " note

    if [ -z "$note" ]; then
        echo "✗ Error: Note cannot be empty"
        return 1
    fi

    echo ""
    cmd_note "$id" "$note"
    echo ""
    read -p "Press Enter to continue..."
}

# Prompt for logging communication
prompt_add_comm() {
    echo ""
    list_initiatives

    read -p "Initiative ID: " id

    if [ -z "$id" ]; then
        echo "✗ Error: ID cannot be empty"
        return 1
    fi

    echo ""
    read -p "Channel (e.g., Slack, Email, Teams): " channel

    if [ -z "$channel" ]; then
        echo "✗ Error: Channel cannot be empty"
        return 1
    fi

    read -p "Link (URL): " link

    if [ -z "$link" ]; then
        echo "✗ Error: Link cannot be empty"
        return 1
    fi

    read -p "Context (brief description): " context

    if [ -z "$context" ]; then
        echo "✗ Error: Context cannot be empty"
        return 1
    fi

    echo ""
    cmd_comm "$id" "$channel" "$link" "$context"
    echo ""
    read -p "Press Enter to continue..."
}

# Main interactive menu
interactive_mode() {
    while true; do
        clear
        echo ""
        echo "=== Initiative Manager ==="
        echo ""
        echo "1) Create new initiative"
        echo "2) Add note to initiative"
        echo "3) Log communication"
        echo "4) List all initiatives"
        echo "5) Help"
        echo "6) Exit"
        echo ""

        read -p "Choose action (1-6): " choice

        case "$choice" in
            1)
                prompt_new_initiative
                ;;
            2)
                prompt_add_note
                ;;
            3)
                prompt_add_comm
                ;;
            4)
                list_initiatives
                read -p "Press Enter to continue..."
                ;;
            5)
                show_help
                read -p "Press Enter to continue..."
                ;;
            6)
                echo ""
                echo "Goodbye!"
                echo ""
                exit 0
                ;;
            *)
                echo ""
                echo "✗ Invalid choice. Please select 1-6."
                sleep 1
                ;;
        esac
    done
}

# ============================================================================
# Main Entry Point
# ============================================================================

# Load configuration first
load_config

# Route to appropriate mode
if [ $# -eq 0 ]; then
    # No arguments - launch interactive mode
    interactive_mode
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
elif [ "$1" = "list" ]; then
    list_initiatives
    exit 0
elif [ "$1" = "new" ]; then
    shift
    cmd_new "$@"
    exit 0
elif [ "$1" = "note" ]; then
    shift
    cmd_note "$@"
    exit 0
elif [ "$1" = "comm" ]; then
    shift
    cmd_comm "$@"
    exit 0
else
    echo "✗ Error: Unknown subcommand '$1'"
    echo ""
    show_help
    exit 1
fi
