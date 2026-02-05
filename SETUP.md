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

## Next Steps

1. **Create your config**: Copy `config.example.json` to `config.json`
2. **Customize directories**: Add your initiative directories
3. **Start the server**: Run `python3 server.py`
4. **Access the UI**: Open http://localhost:3939

Happy tracking! 🚀
