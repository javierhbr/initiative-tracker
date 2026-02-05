#!/bin/bash

# formatting.sh - Output formatting and logging functions for initiative-manager skill

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Log error message to stderr
log_error() {
    echo -e "${RED}✗ Error:${NC} $1" >&2
}

# Log success message
log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Log warning message
log_warning() {
    echo -e "${YELLOW}⚠ Warning:${NC} $1"
}

# Log info message
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Log step indicator
log_step() {
    echo -e "${BLUE}→${NC} $1"
}

# Format table output for list-initiatives
# Args: header_line, data_lines (via stdin)
format_table() {
    column -t -s '|'
}

# Format JSON output for list-initiatives
# Args: json_array (via stdin)
format_json() {
    # Pretty print JSON if jq is available
    if command -v jq &> /dev/null; then
        jq '.'
    else
        cat
    fi
}

# Truncate string to max length with ellipsis
# Args: $1=string, $2=max_length
truncate_string() {
    local str="$1"
    local max_len="${2:-30}"

    if [[ ${#str} -gt $max_len ]]; then
        echo "${str:0:$((max_len-3))}..."
    else
        echo "$str"
    fi
}

# Format date as YYYY-MM-DD
# Args: $1=date (optional, defaults to today)
format_date() {
    if [[ -n "$1" ]]; then
        date -j -f "%Y-%m-%d" "$1" "+%Y-%m-%d" 2>/dev/null || date "+%Y-%m-%d"
    else
        date "+%Y-%m-%d"
    fi
}

# Calculate days difference between two dates
# Args: $1=date1 (YYYY-MM-DD), $2=date2 (YYYY-MM-DD, defaults to today)
days_diff() {
    local date1="$1"
    local date2="${2:-$(date +%Y-%m-%d)}"

    if command -v gdate &> /dev/null; then
        # GNU date (if installed on macOS)
        local d1_epoch=$(gdate -d "$date1" +%s)
        local d2_epoch=$(gdate -d "$date2" +%s)
    else
        # BSD date (macOS default)
        local d1_epoch=$(date -j -f "%Y-%m-%d" "$date1" +%s 2>/dev/null || echo 0)
        local d2_epoch=$(date -j -f "%Y-%m-%d" "$date2" +%s 2>/dev/null || date +%s)
    fi

    echo $(( (d2_epoch - d1_epoch) / 86400 ))
}

# Format overdue information
# Args: $1=deadline (YYYY-MM-DD)
format_overdue() {
    local deadline="$1"
    local today=$(date +%Y-%m-%d)

    if [[ "$deadline" < "$today" ]]; then
        local days=$(days_diff "$deadline" "$today")
        echo "${RED}${days} days overdue${NC}"
    elif [[ "$deadline" == "$today" ]]; then
        echo "${YELLOW}Due today${NC}"
    else
        local days=$(days_diff "$today" "$deadline")
        echo "${days} days remaining"
    fi
}
