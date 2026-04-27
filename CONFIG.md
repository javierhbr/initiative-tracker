# Configuration Guide

The Initiative Tracker supports multiple initiative directories through a configuration file.

## Configuration File

Create a `config.json` file in the root directory:

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
    }
  ]
}
```

## Configuration Options

### Server Settings

- **host**: The hostname to bind to (default: `localhost`)
- **port**: The port number to listen on (default: `3939`)

### Directories

Each directory entry supports:

- **name**: Display name shown in the UI dropdown
- **path**: Absolute or relative path to the initiatives directory
  - Relative paths are resolved from the project root
  - Example relative: `./initiatives`
  - Example absolute: `/Users/yourname/Documents/initiatives`
- **default**: Whether this is the default directory (only one should be `true`)

## Multiple Directories

You can manage initiatives across multiple directories:

1. **Personal vs Work**: Separate personal side projects from work initiatives
2. **Team-based**: Different directories for different teams
3. **Client-based**: Separate directories per client
4. **Year-based**: Archive old initiatives by year

### Example Multi-Directory Setup

```json
{
  "server": {
    "host": "localhost",
    "port": 3939
  },
  "directories": [
    {
      "name": "2026 Personal",
      "path": "./initiatives/2026",
      "default": true
    },
    {
      "name": "2025 Archive",
      "path": "./initiatives/2025",
      "default": false
    },
    {
      "name": "Work Projects",
      "path": "/Users/yourname/work/initiatives",
      "default": false
    },
    {
      "name": "Client A",
      "path": "/Users/yourname/clients/client-a/initiatives",
      "default": false
    }
  ]
}
```

## Using the Directory Selector

Once configured, the web UI will show a dropdown in the header to switch between directories:

1. Select a directory from the dropdown
2. All initiatives will load from that directory
3. New initiatives are created in the currently selected directory
4. Search is scoped to the current directory

## Default Configuration

If no `config.json` exists, the server uses these defaults:

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

## CLI Scripts Compatibility

The bash scripts (`add-note.sh`, `add-comm.sh`, `new-initiative.sh`) continue to work with the default `./initiatives` directory. To use them with other directories, either:

1. Change to that directory first
2. Modify the scripts to accept a directory parameter
3. Use symbolic links

## Notes

- The first directory with `default: true` is used as the default
- If no directory is marked as default, the first one is used
- Directory paths are validated to prevent directory traversal attacks
- The server must have read/write permissions to all configured directories

## Reminders

The optional `reminders` block enables a macOS reminder daemon that polls your initiatives and shows follow-up dialogs during working hours.

```json
"reminders": {
  "enabled": true,
  "workdayStart": "09:00",
  "workdayEnd": "18:00",
  "workdays": [1, 2, 3, 4, 5],
  "cadenceMinutes": 120,
  "snoozeMinutes": 30,
  "maxDialogsPerDay": 8,
  "stateFile": ".reminders-state.json",
  "checklistDefaults": [
    "Review initiative status and update if needed",
    "Check for new blockers or risks",
    "Follow up on pending communications",
    "Update milestone progress"
  ]
}
```

### Reminder Options

- **enabled**: Master switch to enable/disable reminders (default: `true`)
- **workdayStart**: Earliest time to show reminders (24-hour `HH:MM`, default: `"09:00"`)
- **workdayEnd**: Latest time to show reminders (24-hour `HH:MM`, default: `"18:00"`)
- **workdays**: Days of week to show reminders — 1=Monday … 7=Sunday (default: `[1,2,3,4,5]`)
- **cadenceMinutes**: Minimum minutes between reminder dialogs (default: `120`)
- **snoozeMinutes**: How long a snooze suppresses reminders (default: `30`)
- **maxDialogsPerDay**: Hard cap on dialogs shown per calendar day (default: `8`)
- **stateFile**: Path (relative to project root) for persisting reminder state (default: `".reminders-state.json"`)
- **checklistDefaults**: List of default follow-up prompts shown for every initiative

### Per-initiative Checklist Overrides

Add lines tagged `<!-- reminder-item: SLUG -->` to an initiative's `notes.md` to override its checklist:

```markdown
- Review security sign-off <!-- reminder-item: review-security-sign-off -->
- Check vendor timeline <!-- reminder-item: check-vendor-timeline -->
```

### macOS Integration

Install the launchd daemon to run reminders automatically every 2 hours:

```bash
./scripts/manage.sh install-reminders    # Register with launchd
./scripts/manage.sh reminders-status     # Check daemon status
./scripts/manage.sh reminders-test       # Run once immediately
./scripts/manage.sh uninstall-reminders  # Remove from launchd
```

The daemon requires `jq` and runs `osascript` dialogs on macOS only.
