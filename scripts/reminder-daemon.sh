#!/bin/bash
# Initiative Tracker Reminder Daemon
# Polls GET /api/reminders/check and shows osascript dialogs during workday
# Usage: scripts/reminder-daemon.sh [once|--once] [--force]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"
LOCK_FILE="$SCRIPT_DIR/../.reminder-daemon.lock"
LOG_FILE="$SCRIPT_DIR/../.reminder-daemon.log"
MAX_LOG_LINES=500

# Read server config
get_server_url() {
    local host port
    host=$(jq -r '.server.host // "localhost"' "$CONFIG_FILE" 2>/dev/null || echo "localhost")
    port=$(jq -r '.server.port // 3939' "$CONFIG_FILE" 2>/dev/null || echo "3939")
    echo "http://${host}:${port}"
}

# Rotate log file if too large
rotate_log() {
    if [ -f "$LOG_FILE" ]; then
        local lines
        lines=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
        if [ "$lines" -gt "$MAX_LOG_LINES" ]; then
            tail -n $((MAX_LOG_LINES / 2)) "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
        fi
    fi
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Single-instance lock
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid
        pid=$(cat "$LOCK_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log "Another daemon instance is running (PID: $pid). Exiting."
            exit 0
        fi
        rm -f "$LOCK_FILE"
    fi
    echo $$ > "$LOCK_FILE"
}

release_lock() {
    rm -f "$LOCK_FILE"
}

# Server health check
check_server() {
    local url="$1"
    curl -sf --max-time 3 "${url}/api/directories" > /dev/null 2>&1
}

# Post action to API
post_action() {
    local url="$1" action="$2" item_id="$3"
    curl -sf --max-time 5 -X POST "${url}/api/reminders/action" \
        -H 'Content-Type: application/json' \
        -d "{\"action\":\"${action}\",\"itemId\":\"${item_id}\"}" > /dev/null 2>&1
}

# Open dashboard URL with fallbacks and logging
open_dashboard_url() {
    local dashboard_url="$1"
    if [ -z "$dashboard_url" ]; then
        return 1
    fi

    if open "$dashboard_url" >/dev/null 2>&1; then
        log "Opened dashboard URL via 'open': $dashboard_url"
        return 0
    fi

    # Fallback for environments where `open` fails.
    if osascript -e "open location \"$dashboard_url\"" >/dev/null 2>&1; then
        log "Opened dashboard URL via AppleScript: $dashboard_url"
        return 0
    fi

    log "Failed to open dashboard URL: $dashboard_url"
    return 1
}

# Build a deterministic dashboard URL for an item using itemId as source of truth.
build_item_dashboard_url() {
    local base_url="$1" item_id="$2" directory_name="$3"
    local initiative_id
    initiative_id="${item_id%%::*}"

    if [ -n "$directory_name" ]; then
        printf '%s/%s?directory=%s&tab=notes' "$base_url" "$initiative_id" "$directory_name"
    else
        printf '%s/%s?tab=notes' "$base_url" "$initiative_id"
    fi
}

# Show osascript dialog for one item, return user choice
show_dialog() {
    local item_text="$1" initiative_id="$2" overdue="$3"
    local title="Initiative Reminder"
    local message
    if [ "$overdue" = "true" ]; then
        message="⚠️ OVERDUE — ${initiative_id}

${item_text}"
    else
        message="📋 ${initiative_id}

${item_text}"
    fi
    # Escape backslashes and double-quotes before embedding in AppleScript string
    local escaped_message escaped_title
    escaped_message=$(printf '%s' "$message" | sed 's/\\/\\\\/g; s/"/\\"/g')
    escaped_title=$(printf '%s' "$title" | sed 's/\\/\\\\/g; s/"/\\"/g')

    # AppleScript dialogs support at most 3 buttons.
    # Use Close/Snooze/Complete and auto-open UI on Complete.
    local result
    result=$(osascript <<EOF 2>&1
try
    return button returned of (display dialog "${escaped_message}" with title "${escaped_title}" buttons {"Close", "Snooze", "Complete"} default button "Complete" cancel button "Close")
on error errMsg number errNum
    return "__ERROR__:" & errNum & ":" & errMsg
end try
EOF
)
    echo "$result"
}

run_once() {
    local force_mode="$1"
    local url
    url=$(get_server_url)

    rotate_log

    if ! check_server "$url"; then
        log "Server not reachable at $url. Skipping."
        return 0
    fi

    local endpoint="/api/reminders/check"
    if [ "$force_mode" = "true" ]; then
        endpoint="/api/reminders/daily"
    fi

    local response
    response=$(curl -sf --max-time 10 "${url}${endpoint}" 2>/dev/null || echo "")

    if [ -z "$response" ]; then
        log "Empty response from ${endpoint}"
        return 0
    fi

    local due
    due=$(echo "$response" | jq -r '.due // false')

    if [ "$force_mode" != "true" ] && [ "$due" != "true" ]; then
        log "No reminders due (inWorkday=$(echo "$response" | jq -r '.inWorkday'), snoozeActive=$(echo "$response" | jq -r '.snoozeActive'))"
        return 0
    fi

    local items_count
    items_count=$(echo "$response" | jq '.items | length')
    if [ "$items_count" -eq 0 ]; then
        log "No pending reminder items to show"
        return 0
    fi
    log "Reminders due. Showing $items_count items."

    # Iterate items and show one dialog per item (up to 3 per run to avoid storms)
    local shown=0
    while IFS= read -r item; do
        [ $shown -ge 3 ] && break
        local item_id item_text initiative_id overdue dashboard_url item_directory expected_dashboard_url
        item_id=$(echo "$item" | jq -r '.id')
        item_text=$(echo "$item" | jq -r '.text')
        initiative_id=$(echo "$item" | jq -r '.initiativeId')
        overdue=$(echo "$item" | jq -r '.overdue')
        dashboard_url=$(echo "$item" | jq -r '.dashboardUrl // empty')
        item_directory=$(echo "$item" | jq -r '.directory // empty')
        expected_dashboard_url=$(build_item_dashboard_url "$url" "$item_id" "$item_directory")

        # Enforce that opened URL matches current itemId (prevents wrong-initiative opens).
        if [ -z "$dashboard_url" ] || [[ "$dashboard_url" != *"/${item_id%%::*}"* ]]; then
            dashboard_url="$expected_dashboard_url"
        fi

        local choice
        choice=$(show_dialog "$item_text" "$initiative_id" "$overdue")

        if [[ "$choice" == __ERROR__:* ]]; then
            log "Dialog error for item $item_id: $choice"
            choice="Dismiss"
        fi

        log "User chose '$choice' for item: $item_id"

        case "$choice" in
            Complete)
                post_action "$url" "done" "$item_id"
                open_dashboard_url "$dashboard_url" || true
                ;;
            Snooze)  post_action "$url" "snooze" "$item_id" ;;
            Close|*) post_action "$url" "dismiss" "$item_id" ;;
        esac

        shown=$((shown + 1))
    done < <(echo "$response" | jq -c '.items[]')
}

# Parse args
ONCE_MODE="false"
FORCE_MODE="false"
for arg in "$@"; do
    case "$arg" in
        once|--once)
            ONCE_MODE="true"
            ;;
        --force)
            FORCE_MODE="true"
            ;;
    esac
done

# Safety: --force without --once should not start an endless interactive loop.
if [ "$FORCE_MODE" = "true" ] && [ "$ONCE_MODE" != "true" ]; then
    ONCE_MODE="true"
fi

# Run once and exit (for testing or launchd single-shot)
if [ "$ONCE_MODE" = "true" ]; then
    acquire_lock
    trap release_lock EXIT
    run_once "$FORCE_MODE"
    exit 0
fi

# Continuous loop mode (if run directly)
acquire_lock
trap release_lock EXIT

log "Reminder daemon started (PID: $$)"
while true; do
    run_once "$FORCE_MODE"
    sleep 60
done
