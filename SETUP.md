# Initiative Tracker - Setup & Usage Guide

## Quick Start

1. **Start the server:**
   ```bash
   python3 server.py
   ```

2. **Open your browser:**
   ```
   http://localhost:3939
   ```

3. **Use the app:**
   - Browse existing initiatives in the sidebar
   - Click an initiative to view details
   - Use the directory dropdown to switch between different initiative directories
   - Create new initiatives with the "+ New Initiative" button

## Configuration

### Basic Configuration

The server reads from `config.json` in the root directory. If not present, it uses defaults.

**Default configuration:**
```json
{
  "server": {
    "host": "localhost",
    "port": 3939
  },
  "directories": [
    {
      "name": "Personal",
      "path": "./initiatives",
      "default": true
    }
  ]
}
```

### Adding Multiple Directories

Edit `config.json` to add more initiative directories:

```json
{
  "server": {
    "host": "localhost",
    "port": 3939
  },
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
    },
    {
      "name": "Team Projects",
      "path": "/absolute/path/to/team-initiatives",
      "default": false
    }
  ]
}
```

**Directory settings:**
- `name`: Display name in the UI
- `path`: Relative (./initiatives) or absolute path
- `default`: Set to true for the default directory (only one!)

See [CONFIG.md](CONFIG.md) for detailed configuration options.

## Keyboard Shortcuts

- **⌘K** (Cmd+K on Mac, Ctrl+K on Windows/Linux) - Focus search
- **⌘N** (Cmd+N on Mac, Ctrl+N on Windows/Linux) - New initiative
- **⌘1-4** - Switch tabs (Overview, Notes, Comms, Links)
- **Esc** - Close modals / unfocus inputs

## Features

### Web UI
- ✅ Dashboard with initiative stats
- ✅ Full-text search across all files
- ✅ Multiple directory support with dropdown selector
- ✅ Rich markdown preview
- ✅ Create initiatives
- ✅ Add notes (auto-dated)
- ✅ Log communications
- ✅ Keyboard shortcuts

### CLI Scripts (still work!)
```bash
# Create new initiative
./scripts/new-initiative.sh PROJ-2026-01 "Project Name"

# Add note
./scripts/add-note.sh PROJ-2026-01 "Note text"

# Log communication
./scripts/add-comm.sh PROJ-2026-01 Slack "https://link" "Context"
```

## File Structure

```
personal-initiative-tracker/
├── config.json              # Configuration (create this)
├── server.py                # Python backend server
├── index.html               # Single-file frontend
├── initiatives/             # Default initiative directory
│   └── FRAUD-2026-01/
│       ├── README.md
│       ├── notes.md
│       ├── comms.md
│       └── links.md
├── scripts/                 # CLI bash scripts
│   ├── new-initiative.sh
│   ├── add-note.sh
│   └── add-comm.sh
└── docs/
    ├── CONFIG.md            # Configuration guide
    └── SETUP.md             # This file
```

## Port Configuration

To change the port, edit `config.json`:

```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  }
}
```

## Multiple Directories Use Cases

1. **Separate Personal & Work**
   - Personal projects in `./initiatives`
   - Work projects in `./work-initiatives`

2. **Year-based Archives**
   - `./initiatives/2026` (active)
   - `./initiatives/2025` (archive)

3. **Team-based**
   - Different directories for different teams
   - Switch between teams in the UI

4. **Client-based**
   - Separate directory per client
   - Keep client data isolated

## Troubleshooting

### Port already in use
```bash
# Kill existing server
pkill -f "python3 server.py"

# Or change port in config.json
```

### Directory not found
- Check paths in `config.json`
- Use absolute paths if relative paths don't work
- Ensure the server has read/write permissions

### Changes not showing
- Refresh the browser
- Check the browser console for errors
- Restart the server

## Reminder System (macOS)

The Initiative Tracker includes a local-only reminder loop using native macOS dialogs.

### How It Works

1. A launchd job (`org.initiative-tracker.reminders`) fires every 2 hours during configured workday hours
2. The job runs `scripts/reminder-daemon.sh once`, which calls `GET /api/reminders/check`
3. If reminders are due, `osascript` dialogs appear for each pending item with **Done / Snooze / Dismiss** actions
4. Done actions append a `[REMINDER]` audit entry to the initiative's `notes.md`
5. The React UI shows a bell badge (🔔) with pending count and a daily follow-up modal on first load

### Prerequisites

- macOS (launchd integration)
- The Python server must be running when the daemon fires
- `jq` installed (`brew install jq`)

### Install the Reminder Daemon

```bash
# Install and schedule (every 2 hours)
./scripts/manage.sh install-reminders

# Verify it's scheduled
./scripts/manage.sh reminders-status

# Test immediately (runs one check in foreground)
./scripts/manage.sh reminders-test

# Remove
./scripts/manage.sh uninstall-reminders
```

The daemon installs a launchd plist to `~/Library/LaunchAgents/org.initiative-tracker.reminders.plist` — it survives reboots automatically.

### Logs & Diagnostics

| File | Purpose |
|------|---------|
| `.reminder-daemon.log` | Daemon activity, dialog responses |
| `.reminders-state.json` | Snooze/done/dismiss state (local only) |

### Troubleshooting

**No dialogs appear:**
- Check the server is running: `./scripts/manage.sh status`
- Check daemon log: `cat .reminder-daemon.log`
- Test manually: `./scripts/manage.sh reminders-test`

**`jq: command not found`:**
```bash
brew install jq
```

**Dialogs appear too frequently:**
Reduce `maxDialogsPerDay` or increase `cadenceMinutes` in `config.json`.

**Stale lock file (daemon won't start):**
```bash
rm .reminder-daemon.lock
```

---

## Next Steps

1. **Create your config**: Copy `config.example.json` to `config.json`
2. **Customize directories**: Add your initiative directories
3. **Start the server**: Run `python3 server.py`
4. **Access the UI**: Open http://localhost:3939
5. **Enable reminders** (macOS): Run `./scripts/manage.sh install-reminders`

Happy tracking! 🚀
