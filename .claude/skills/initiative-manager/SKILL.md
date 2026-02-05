---
name: initiative-manager
description: Manage cross-team initiatives in the personal-initiative-tracker system. Create, update, search, and track initiatives with notes, communications, blockers, and milestones. Use when user wants to work with initiatives, create EPICs, log decisions, track progress, update status, add blockers, manage milestones, or report on initiative status.
compatibility: Requires bash, Python 3, and access to the personal-initiative-tracker project directory
license: Personal use
metadata:
  author: personal
  version: "1.0.0"
  project: personal-initiative-tracker
allowed-tools: Bash(./scripts/*) Read Grep
---

# Initiative Manager

A comprehensive skill for managing cross-team initiatives in a file-based tracking system. This skill enables natural language interaction with the personal-initiative-tracker project through validated operations, robust error handling, and seamless integration with existing tools.

## Overview

This skill manages initiatives stored as directory structures with 4 files each:
- `README.md` - Main EPIC document with metadata, milestones, blockers
- `notes.md` - Append-only decision log with dated entries
- `comms.md` - Communication tracking table
- `links.md` - External artifact references

**Core Capabilities:**
- Create initiatives with proper structure and validation
- Update status, blockers, and milestones
- Add dated notes and log communications
- Search and filter across all initiatives
- Generate reports by status, type, or deadline
- Manage multiple directories (Personal, Work, etc.)
- Archive completed initiatives

**When to Use This Skill:**
- User mentions "initiative", "EPIC", "cross-team project"
- Requests to create, update, or track initiatives
- Wants to add notes, blockers, or log communications
- Needs to search or report on initiative status
- Managing project milestones and deadlines

## Quick Start

### Most Common Operations

**Create a new initiative:**
```bash
.claude/skills/initiative-manager/scripts/create-initiative.sh FRAUD-2026-01 "Fraud Real-time Signals Integration" Regulatory
```

**Update initiative status:**
```bash
.claude/skills/initiative-manager/scripts/update-status.sh FRAUD-2026-01 "In progress"
```

**Add a note (use existing script):**
```bash
scripts/add-note.sh FRAUD-2026-01 "Decided to proceed with Vendor A after architecture review"
```

**Add blocker:**
```bash
.claude/skills/initiative-manager/scripts/add-blocker.sh FRAUD-2026-01 "Waiting for Platform team Q2 capacity"
```

**List all initiatives:**
```bash
.claude/skills/initiative-manager/scripts/list-initiatives.sh --format table
```

**Search initiatives:**
```bash
.claude/skills/initiative-manager/scripts/search-initiatives.sh "regulatory"
```

## Core Operations

### 1. Create Initiative

Creates a new initiative with validated structure.

**Script:** `.claude/skills/initiative-manager/scripts/create-initiative.sh`

**Usage:**
```bash
create-initiative.sh <ID> "<NAME>" <TYPE> [DIRECTORY]
```

**Arguments:**
- `ID` - Format: UPPERCASE-YYYY-NN (e.g., FRAUD-2026-01)
- `NAME` - Initiative name (5-100 characters)
- `TYPE` - One of: Discovery, PoC, Platform change, Regulatory, Growth, Infra
- `DIRECTORY` - Optional directory name (defaults to configured default)

**Example:**
```bash
.claude/skills/initiative-manager/scripts/create-initiative.sh PLATFORM-2026-05 "API Gateway Migration" "Platform change"
```

**What It Does:**
1. Validates ID format and uniqueness
2. Creates directory structure: `{ID}/`
3. Generates README.md from template with metadata
4. Initializes notes.md with creation entry
5. Creates empty comms.md table
6. Creates links.md with standard sections

**Validation:**
- ID must match pattern `^[A-Z][A-Z0-9]*-[0-9]{4}-[0-9]{2}$`
- Prevents directory traversal (no `..` or `/` in ID)
- Type must be from valid list
- Directory must exist in config.json

### 2. Update Status

Updates initiative status with automatic note logging.

**Script:** `.claude/skills/initiative-manager/scripts/update-status.sh`

**Usage:**
```bash
update-status.sh <ID> "<STATUS>" [DIRECTORY]
```

**Valid Statuses:**
- Idea
- In discovery
- In progress
- Blocked
- Waiting approvals
- Delivered
- Paused
- Cancelled

**Example:**
```bash
.claude/skills/initiative-manager/scripts/update-status.sh FRAUD-2026-01 "Blocked"
```

**What It Does:**
1. Validates initiative exists and status is valid
2. Updates Status line in README.md
3. Automatically adds note about status change
4. Uses atomic file operation (temp → mv)

**See:** [references/STATUS-GUIDE.md](references/STATUS-GUIDE.md) for status workflow details

### 3. Add Note

Adds dated note to initiative's append-only log. **Use existing project script.**

**Script:** `scripts/add-note.sh` (existing project script)

**Usage:**
```bash
scripts/add-note.sh <ID> "<NOTE>" [DIRECTORY]
```

**Example:**
```bash
scripts/add-note.sh FRAUD-2026-01 "Architecture review completed. Moving forward with hybrid approach."
```

**What It Does:**
1. Finds or creates today's date header in notes.md
2. Appends note as bullet point
3. Preserves append-only nature (never edits above current position)

**Best Practice:** Log key decisions, scope changes, blocker resolutions, and architecture decisions.

### 4. Log Communication

Logs important communications in structured table. **Use existing project script.**

**Script:** `scripts/add-comm.sh` (existing project script)

**Usage:**
```bash
scripts/add-comm.sh <ID> <CHANNEL> <LINK> "<CONTEXT>"
```

**Example:**
```bash
scripts/add-comm.sh FRAUD-2026-01 Slack "https://slack.com/..." "Legal sign-off obtained for vendor contract"
```

**What It Does:**
1. Adds entry to comms.md table with today's date
2. Records channel, link, and context
3. Maintains table formatting

**When to Log:** Stakeholder approvals, major announcements, kickoffs, sign-off requests, escalations

### 5. Add Blocker

Adds blocker to initiative and increments blocker count.

**Script:** `.claude/skills/initiative-manager/scripts/add-blocker.sh`

**Usage:**
```bash
add-blocker.sh <ID> "<BLOCKER_DESCRIPTION>" [DIRECTORY]
```

**Example:**
```bash
.claude/skills/initiative-manager/scripts/add-blocker.sh FRAUD-2026-01 "Legal review required before proceeding (est. 2 weeks)"
```

**What It Does:**
1. Finds Blockers section in README.md
2. Appends blocker as bullet point
3. Counts total blockers
4. Automatically adds note about new blocker

**Good Blocker Format:**
- What is blocking
- Who owns resolution
- Expected timeline if known
- Impact on initiative

### 6. Remove Blocker

Removes blocker by number or text match.

**Script:** `.claude/skills/initiative-manager/scripts/remove-blocker.sh`

**Usage:**
```bash
remove-blocker.sh <ID> <BLOCKER_NUMBER_OR_TEXT> [DIRECTORY]
```

**Examples:**
```bash
# Remove by number (1-based index)
.claude/skills/initiative-manager/scripts/remove-blocker.sh FRAUD-2026-01 1

# Remove by partial text match
.claude/skills/initiative-manager/scripts/remove-blocker.sh FRAUD-2026-01 "Platform team"
```

**What It Does:**
1. Finds blocker by number or text
2. Removes blocker line
3. Automatically adds note about blocker resolution

### 7. Update Milestone

Checks or unchecks milestone checkbox.

**Script:** `.claude/skills/initiative-manager/scripts/update-milestone.sh`

**Usage:**
```bash
update-milestone.sh <ID> "<MILESTONE_TEXT>" <check|uncheck> [DIRECTORY]
```

**Example:**
```bash
.claude/skills/initiative-manager/scripts/update-milestone.sh FRAUD-2026-01 "Discovery completed" check
```

**What It Does:**
1. Finds milestone by partial text match in High-level Milestones section
2. Toggles checkbox: `- [ ]` → `- [x]` or vice versa
3. Automatically adds note about milestone change

### 8. List Initiatives

Lists initiatives with filtering and formatting options.

**Script:** `.claude/skills/initiative-manager/scripts/list-initiatives.sh`

**Usage:**
```bash
list-initiatives.sh [OPTIONS]
```

**Options:**
- `--status <status>` - Filter by status
- `--type <type>` - Filter by type
- `--directory <name>` - Filter by directory (default: all)
- `--blocked` - Show only initiatives with blockers
- `--overdue` - Show only initiatives past deadline
- `--format <table|json|simple>` - Output format (default: table)

**Examples:**
```bash
# List all blocked initiatives
.claude/skills/initiative-manager/scripts/list-initiatives.sh --status "Blocked" --format table

# List all initiatives with blockers
.claude/skills/initiative-manager/scripts/list-initiatives.sh --blocked

# List overdue regulatory initiatives as JSON
.claude/skills/initiative-manager/scripts/list-initiatives.sh --type Regulatory --overdue --format json
```

**Output Formats:**
- **table** - ASCII table with columns: ID, Name, Status, Type, Deadline, Blockers
- **json** - JSON array of initiative objects
- **simple** - One line per initiative (ID: Name - Status)

### 9. Search Initiatives

Full-text search across all initiative files.

**Script:** `.claude/skills/initiative-manager/scripts/search-initiatives.sh`

**Usage:**
```bash
search-initiatives.sh <QUERY> [OPTIONS]
```

**Options:**
- `--directory <name>` - Search in specific directory
- `--file <readme|notes|comms|links>` - Search in specific file type
- `--context <N>` - Show N lines of context (default: 2)

**Examples:**
```bash
# Search all files for "regulatory"
.claude/skills/initiative-manager/scripts/search-initiatives.sh "regulatory"

# Search only notes for "vendor"
.claude/skills/initiative-manager/scripts/search-initiatives.sh "vendor" --file notes

# Search with more context lines
.claude/skills/initiative-manager/scripts/search-initiatives.sh "architecture" --context 5
```

**Output:**
Shows file:line:match with context lines for each match.

### 10. Generate Reports

Generates aggregated reports on initiative status.

**Script:** `.claude/skills/initiative-manager/scripts/report-initiatives.sh`

**Usage:**
```bash
report-initiatives.sh [OPTIONS]
```

**Options:**
- `--overdue` - Show overdue initiatives
- `--by-status` - Group by status
- `--by-type` - Group by type
- `--summary` - Show counts only
- `--directory <name>` - Scope to directory

**Examples:**
```bash
# Show all overdue initiatives
.claude/skills/initiative-manager/scripts/report-initiatives.sh --overdue

# Group initiatives by status
.claude/skills/initiative-manager/scripts/report-initiatives.sh --by-status

# Summary counts
.claude/skills/initiative-manager/scripts/report-initiatives.sh --summary
```

## Advanced Operations

### Move Initiative Between Directories

**Script:** `.claude/skills/initiative-manager/scripts/move-initiative.sh`

**Usage:**
```bash
move-initiative.sh <ID> <SOURCE_DIR> <TARGET_DIR>
```

**Example:**
```bash
.claude/skills/initiative-manager/scripts/move-initiative.sh FRAUD-2026-01 Personal Work
```

**Use Cases:**
- Personal → Work (initiative became work project)
- Work → Archive (completed initiative)
- Archive → Personal (reviving old initiative)

### Archive Initiative

**Script:** `.claude/skills/initiative-manager/scripts/archive-initiative.sh`

**Usage:**
```bash
archive-initiative.sh <ID> [REASON] [DIRECTORY]
```

**Example:**
```bash
.claude/skills/initiative-manager/scripts/archive-initiative.sh FRAUD-2026-01 "Successfully delivered to production"
```

**What It Does:**
1. Updates status to "Delivered" or "Cancelled"
2. Adds final note with archive reason
3. Moves to archive directory with timestamp

## Data Model & Validation

### Initiative ID Format
```
Pattern: ^[A-Z][A-Z0-9]*-[0-9]{4}-[0-9]{2}$
Examples: FRAUD-2026-01, PLATFORM-2026-15, A-2026-99
Invalid: fraud-2026-01 (lowercase), FRAUD-26-01 (2-digit year), FRAUD/2026/01 (slashes)
```

**Security:** IDs cannot contain `..` or `/` (directory traversal prevention)

### Status Values

| Status | When to Use |
|--------|-------------|
| Idea | Initial concept, not yet started |
| In discovery | Exploring feasibility, scope, requirements |
| In progress | Active development/implementation |
| Blocked | Work stopped due to impediments |
| Waiting approvals | Implementation done, pending sign-offs |
| Delivered | Launched to production |
| Paused | Temporarily suspended |
| Cancelled | No longer pursuing |

See [references/STATUS-GUIDE.md](references/STATUS-GUIDE.md) for detailed workflow.

### Type Values

| Type | Description |
|------|-------------|
| Discovery | Exploration/investigation phase |
| PoC | Proof of concept or pilot |
| Platform change | Infrastructure or architectural change |
| Regulatory | Compliance or legal requirement |
| Growth | Revenue/user growth initiative |
| Infra | Reliability/performance improvement |

### Directory Structure

Each initiative is a directory with exactly 4 files:
```
initiatives/{ID}/
├── README.md          # Main EPIC (metadata, milestones, blockers)
├── notes.md           # Append-only decision log
├── comms.md           # Communication tracking table
└── links.md           # External references
```

## Integration Points

### With Existing Scripts

**Reuse these existing project scripts:**
- `scripts/add-note.sh` - Add dated notes
- `scripts/add-comm.sh` - Log communications
- `scripts/new-initiative.sh` - Alternative creation method

**This skill complements (not replaces) existing tools.**

### With Python API

The project includes a Python REST API (`server.py`) with endpoints:
- `GET /api/initiatives` - List all
- `GET /api/initiatives/{id}` - Get full initiative
- `POST /api/initiatives` - Create initiative
- `POST /api/initiatives/{id}/note` - Add note
- `POST /api/initiatives/{id}/comm` - Add communication
- `GET /api/search?q={query}` - Search

**When to use API vs Scripts:**
- **Scripts:** CLI operations, batch processing, automation
- **API:** Web UI interactions, programmatic access, JSON responses

Both work on the same file structure with no conflicts.

### With config.json

Multi-directory support via configuration file:
```json
{
  "directories": [
    {
      "name": "Personal",
      "path": "./initiatives",
      "default": true
    },
    {
      "name": "Work",
      "path": "./work-initiatives",
      "default": false
    }
  ]
}
```

**Directory Resolution:**
- If no directory specified → uses directory marked `"default": true`
- Falls back to `./initiatives` if config.json missing
- Validates directory exists and is writable

### With Web UI

The project includes a web UI (index.html) with:
- Dashboard view with stats
- Kanban board view
- Search and filtering
- Modal forms for create/update

**Coordination:**
- Scripts create/update files
- Web UI auto-refreshes to show changes
- No conflicts (file-based storage)
- Access at http://localhost:3939 (after starting server.py)

## Best Practices

### When to Create Initiatives

**Create initiatives for:**
- Cross-team projects requiring coordination
- Major features with multiple milestones
- Regulatory or compliance requirements
- Architectural changes affecting multiple systems
- Projects with external stakeholders

**Don't create initiatives for:**
- Single-team features (use Jira)
- Simple bug fixes
- Routine maintenance
- Individual developer tasks

### Note-Taking Patterns

**Log these in notes.md:**
- Key decisions and rationale
- Scope changes
- Blocker resolutions
- Important meetings or conversations
- Architecture decisions
- Risk changes
- Timeline shifts

**Don't log:**
- Daily status updates (use standups)
- Detailed task updates (use Jira)
- General chat (use Slack)
- Implementation details (use code comments)

### Communication Logging

**Log these in comms.md:**
- Stakeholder approvals
- Major announcements
- Kickoff meetings
- Sign-off requests
- Escalations
- External communications

**Include:**
- Channel (Slack, Email, Zoom, etc.)
- Link to conversation
- Brief context (purpose, not content)

## Examples & Common Scenarios

### Scenario 1: Create Regulatory Initiative
```bash
# Create initiative
.claude/skills/initiative-manager/scripts/create-initiative.sh FRAUD-2026-01 "Fraud Real-time Signals Integration" Regulatory

# Add initial note
scripts/add-note.sh FRAUD-2026-01 "Initiative created to comply with new fraud detection regulations. Deadline: 2026-03-31 (regulatory)."
```

### Scenario 2: Track Discovery Phase
```bash
# Update status
.claude/skills/initiative-manager/scripts/update-status.sh PLATFORM-2026-05 "In discovery"

# Add notes as discovery progresses
scripts/add-note.sh PLATFORM-2026-05 "Vendor evaluation completed. Shortlisted: Vendor A, Vendor B"
scripts/add-note.sh PLATFORM-2026-05 "Architecture review scheduled for 2026-02-15"

# Check milestone
.claude/skills/initiative-manager/scripts/update-milestone.sh PLATFORM-2026-05 "Architecture aligned" check
```

### Scenario 3: Handle Blocker
```bash
# Add blocker
.claude/skills/initiative-manager/scripts/add-blocker.sh FRAUD-2026-01 "Waiting for Platform team Q2 capacity allocation (Owner: Jane, Expected: 2026-03-01)"

# Update status to Blocked
.claude/skills/initiative-manager/scripts/update-status.sh FRAUD-2026-01 "Blocked"

# Log escalation
scripts/add-comm.sh FRAUD-2026-01 Email "https://mail/..." "Escalated capacity request to VP Engineering"

# When blocker resolved
.claude/skills/initiative-manager/scripts/remove-blocker.sh FRAUD-2026-01 1
.claude/skills/initiative-manager/scripts/update-status.sh FRAUD-2026-01 "In progress"
```

### Scenario 4: Find Blocked Initiatives
```bash
# List all blocked initiatives
.claude/skills/initiative-manager/scripts/list-initiatives.sh --status "Blocked" --format table

# Or find initiatives with blockers (any status)
.claude/skills/initiative-manager/scripts/list-initiatives.sh --blocked
```

### Scenario 5: Generate Overdue Report
```bash
# Show all overdue initiatives
.claude/skills/initiative-manager/scripts/report-initiatives.sh --overdue

# Group by status to see where overdue initiatives are stuck
.claude/skills/initiative-manager/scripts/report-initiatives.sh --by-status
```

### Scenario 6: Search for Context
```bash
# Find all mentions of "vendor" across initiatives
.claude/skills/initiative-manager/scripts/search-initiatives.sh "vendor"

# Search only in notes
.claude/skills/initiative-manager/scripts/search-initiatives.sh "architecture decision" --file notes
```

### Scenario 7: Complete and Archive Initiative
```bash
# Check final milestones
.claude/skills/initiative-manager/scripts/update-milestone.sh FRAUD-2026-01 "Rollout" check
.claude/skills/initiative-manager/scripts/update-milestone.sh FRAUD-2026-01 "Post-launch review" check

# Update status
.claude/skills/initiative-manager/scripts/update-status.sh FRAUD-2026-01 "Delivered"

# Add final note
scripts/add-note.sh FRAUD-2026-01 "Successfully launched to production. Monitoring shows 40% fraud reduction."

# Archive
.claude/skills/initiative-manager/scripts/archive-initiative.sh FRAUD-2026-01 "Successfully delivered"
```

### Scenario 8: Manage Multiple Directories
```bash
# Create in Work directory
.claude/skills/initiative-manager/scripts/create-initiative.sh INTERNAL-2026-01 "Internal Tool Upgrade" Infra Work

# List only Work initiatives
.claude/skills/initiative-manager/scripts/list-initiatives.sh --directory Work

# Move from Personal to Work
.claude/skills/initiative-manager/scripts/move-initiative.sh PROJECT-2026-03 Personal Work
```

## Troubleshooting

### Initiative Not Found
**Error:** "Initiative 'FRAUD-2026-01' not found"

**Resolution:**
1. Check initiative ID spelling
2. Verify you're looking in correct directory
3. List all initiatives: `.claude/skills/initiative-manager/scripts/list-initiatives.sh`
4. Check if initiative was archived

### Invalid ID Format
**Error:** "Invalid ID format: 'fraud-2026-01'"

**Resolution:**
- IDs must be UPPERCASE
- Format: UPPERCASE-YYYY-NN
- Example: FRAUD-2026-01 (not fraud-2026-01)

### Invalid Status
**Error:** "Invalid status: 'working'"

**Resolution:**
- Use exact status names (case-sensitive)
- Valid statuses: Idea, In discovery, In progress, Blocked, Waiting approvals, Delivered, Paused, Cancelled
- See [references/STATUS-GUIDE.md](references/STATUS-GUIDE.md)

### Directory Not Found
**Error:** "Directory 'Archive' not found in config.json"

**Resolution:**
1. Check available directories: `.claude/skills/initiative-manager/scripts/lib/config.sh` → `list_directories`
2. Add directory to config.json if needed
3. Or use existing directory name

### Permission Denied
**Error:** "Cannot create directory: Permission denied"

**Resolution:**
1. Check file system permissions
2. Verify you have write access to initiatives directory
3. Run with appropriate permissions

## File References

For detailed documentation, see:

- [references/TEMPLATE.md](references/TEMPLATE.md) - Full initiative README template with detailed comments
- [references/STATUS-GUIDE.md](references/STATUS-GUIDE.md) - Status workflow, transitions, and best practices
- [references/OPERATIONS.md](references/OPERATIONS.md) - Detailed operation specifications and edge cases
- [references/VALIDATION.md](references/VALIDATION.md) - Input validation rules and security considerations
- [references/EXAMPLES.md](references/EXAMPLES.md) - 20+ real-world scenarios with full command sequences
- [assets/config-template.json](assets/config-template.json) - Example multi-directory configuration
