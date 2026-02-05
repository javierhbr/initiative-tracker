#!/bin/bash

# create-initiative.sh - Create new initiative with validation and structure
# Usage: ./create-initiative.sh <ID> "<NAME>" <TYPE> [DIRECTORY]
# Example: ./create-initiative.sh FRAUD-2026-01 "Fraud Signals" Regulatory Personal

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
    echo "Usage: $0 <ID> <NAME> <TYPE> [DIRECTORY]"
    echo ""
    echo "Arguments:"
    echo "  ID        - Initiative ID (Format: UPPERCASE-YYYY-NN, e.g., FRAUD-2026-01)"
    echo "  NAME      - Initiative name (5-100 characters)"
    echo "  TYPE      - One of: Discovery, PoC, Platform change, Regulatory, Growth, Infra"
    echo "  DIRECTORY - Optional directory name (defaults to configured default)"
    echo ""
    echo "Examples:"
    echo "  $0 FRAUD-2026-01 \"Fraud Real-time Signals\" Regulatory"
    echo "  $0 PLATFORM-2026-05 \"API Gateway Migration\" \"Platform change\" Work"
    exit 1
}

# Main function
main() {
    # Check arguments
    if [[ $# -lt 3 ]]; then
        log_error "Missing required arguments"
        echo ""
        usage
    fi

    local id="$1"
    local name="$2"
    local type="$3"
    local directory="${4:-}"

    log_step "Validating inputs..."

    # Validate inputs
    validate_initiative_id "$id" || exit 1
    validate_name "$name" || exit 1
    validate_type "$type" || exit 1
    validate_directory "$directory" || exit 1
    validate_initiative_not_exists "$id" "$directory" || exit 1

    # Get directory path
    local dir_path=$(get_directory_path "$directory")
    local init_path="$dir_path/$id"

    log_step "Creating initiative structure at $init_path..."

    # Create directory
    mkdir -p "$init_path"

    # Get template directory
    local template_dir="$SCRIPT_DIR/../assets/initiative-template"
    local today=$(date +%Y-%m-%d)

    # Create README.md from template
    if [[ -f "$template_dir/README.md" ]]; then
        # Use template if available
        sed -e "s/__NAME__/$name/g" \
            -e "s/__ID__/$id/g" \
            -e "s/__TYPE__/$type/g" \
            "$template_dir/README.md" > "$init_path/README.md"
    else
        # Fallback: create inline
        cat > "$init_path/README.md" <<EOF
# $name

## Overview
- **Initiative ID:** $id
- **Type:** $type
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
<!-- Check off as you get alignment -->
- [ ] Product
- [ ] Business
- [ ] Risk
- [ ] Legal
- [ ] Security
- [ ] Compliance
- [ ] Platform Architecture

---

## High-level Milestones
<!-- Keep this to 5-8 key milestones -->
- [ ] Discovery completed
- [ ] Architecture aligned
- [ ] Risk / Legal sign-off
- [ ] Development started
- [ ] Testing completed
- [ ] Rollout
- [ ] Post-launch review

---

## Blockers / Risks
<!-- Current impediments. Remove when resolved -->

**Past Blockers (resolved):**

---

## Final Sign-offs
- [ ] Product – [Name] – [Date]
- [ ] Tech / Platform – [Name] – [Date]
- [ ] Risk / Legal – [Name] – [Date]

---

## References
- Links & artifacts → \`links.md\`
- Notes & decisions → \`notes.md\`
- Communications log → \`comms.md\`
EOF
    fi

    # Create notes.md
    cat > "$init_path/notes.md" <<EOF
# Notes & Decisions

<!--
APPEND-ONLY LOG
Never edit entries above. Only add new entries below.
This maintains an immutable audit trail of decisions.
-->

## $today
- Initiative created
EOF

    # Create comms.md
    cat > "$init_path/comms.md" <<EOF
# Communications Log

<!-- Track important communications with stakeholders -->

| Date       | Channel | Link | Context |
|------------|---------|------|---------|
EOF

    # Create links.md
    cat > "$init_path/links.md" <<EOF
# Links & Artifacts

## Docs
- PRD:
- Tech Spec:
- Architecture:

## Tracking
- Jira Epic:
- Project Board:

## Repos
- Code:
- Infrastructure:
EOF

    log_success "Initiative $id created successfully"
    log_info "Location: $init_path"
    log_info ""
    log_info "Next steps:"
    echo "  1. Edit $init_path/README.md to fill in details"
    echo "  2. Add notes: scripts/add-note.sh $id \"Your note\""
    echo "  3. Update status when work starts: .claude/skills/initiative-manager/scripts/update-status.sh $id \"In progress\""
    echo ""
    log_info "View in browser: http://localhost:3939?init=$id"
}

# Run main
main "$@"
