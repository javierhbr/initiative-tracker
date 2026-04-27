#!/bin/bash
# Initiative Tracker Reminder Daemon
# Polls GET /api/reminders/check and shows osascript dialogs during workday
# Usage: scripts/reminder-daemon.sh [once]

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

# Show osascript dialog for one item, return user choice
show_dialog() {
    local item_text="$1" initiative_id="$2" overdue="$3"
    local title="Initiative Reminder"
    local message
    if [ "$overdue" = "true" ]; then
        message="⚠️ OVERDUE — ${initiative_id}\n\n${item_text}"
    else
        message="📋 ${initiative_id}\n\n${item_text}"
    fi
    # Returns button name chosen (Done / Snooze / Dismiss)
    osascript -e "button returned of (display dialog \"${message}\" with title \"${title}\" buttons {\"Dismiss\", \"Snooze\", \"Done\"} default button \"Done\")" 2>/dev/null || echo "Dismiss"
}

run_once() {
    local url
    url=$(get_server_url)

    rotate_log

    if ! check_server "$url"; then
        log "Server not reachable at $url. Skipping."
        return 0
    fi

    local response
    response=$(curl -sf --max-time 10 "${url}/api/reminders/check" 2>/dev/null || echo "")

    if [ -z "$response" ]; then
        log "Empty response from /api/reminders/check"
        return 0
    fi

    local due
    due=$(echo "$response" | jq -r '.due // false')

    if [ "$due" != "true" ]; then
        log "No reminders due (inWorkday=$(echo "$response" | jq -r '.inWorkday'), snoozeActive=$(echo "$response" | jq -r '.snoozeActive'))"
        return 0
    fi

    local items_count
    items_count=$(echo "$response" | jq '.items | length')
    log "Reminders due. Showing $items_count items."

    # Iterate items and show one dialog per item (up to 3 per run to avoid storms)
    local shown=0
    while IFS= read -r item; do
        [ $shown -ge 3 ] && break
        local item_id item_text initiative_id overdue
        item_id=$(echo "$item" | jq -r '.id')
        item_text=$(echo "$item" | jq -r '.text')
        initiative_id=$(echo "$item" | jq -r '.initiativeId')
        overdue=$(echo "$item" | jq -r '.overdue')

        local choice
        choice=$(show_dialog "$item_text" "$initiative_id" "$overdue")
        log "User chose '$choice' for item: $item_id"

        case "$choice" in
            Done)    post_action "$url" "done" "$item_id" ;;
            Snooze)  post_action "$url" "snooze" "$item_id" ;;
            *)       post_action "$url" "dismiss" "$item_id" ;;
        esac

        shown=$((shown + 1))
    done < <(echo "$response" | jq -c '.items[]')
}

# Run once and exit (for testing or launchd single-shot)
if [ "${1}" = "once" ]; then
    acquire_lock
    trap release_lock EXIT
    run_once
    exit 0
fi

# Continuous loop mode (if run directly)
acquire_lock
trap release_lock EXIT

log "Reminder daemon started (PID: $$)"
while true; do
    run_once
    sleep 60
done
