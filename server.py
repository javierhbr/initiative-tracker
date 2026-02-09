#!/usr/bin/env python3
"""
Super lite web server for Personal Initiative Tracker
Serves a single HTML file frontend and provides REST API for file operations
"""

import json
import mimetypes
import os
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime


# Static files directory (React build output)
STATIC_DIR = Path(__file__).parent / 'src' / 'dist'


def load_config():
    """Load configuration from config.json"""
    config_path = Path('config.json')

    # Default configuration
    default_config = {
        'server': {
            'host': 'localhost',
            'port': 3939
        },
        'initiativeTypes': [
            'Discovery', 'PoC', 'Platform change', 'Regulatory', 'Growth', 'Infra'
        ],
        'directories': [
            {
                'name': 'Personal',
                'path': './initiatives',
                'default': True
            }
        ]
    }

    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                # Merge with defaults
                if 'server' not in config:
                    config['server'] = default_config['server']
                if 'initiativeTypes' not in config:
                    config['initiativeTypes'] = default_config['initiativeTypes']
                if 'directories' not in config:
                    config['directories'] = default_config['directories']
                return config
        except Exception as e:
            print(f"Warning: Failed to load config.json: {e}")
            print("Using default configuration")

    return default_config


# Global configuration
CONFIG = load_config()


class InitiativeHandler(BaseHTTPRequestHandler):
    # Will be set from config
    DIRECTORIES = []

    @classmethod
    def set_directories(cls, directories):
        """Set the directories from config"""
        cls.DIRECTORIES = [
            {
                'name': d['name'],
                'path': Path(d['path']).resolve(),
                'default': d.get('default', False)
            }
            for d in directories
        ]

    def get_default_directory(self):
        """Get the default directory"""
        for d in self.DIRECTORIES:
            if d['default']:
                return d
        return self.DIRECTORIES[0] if self.DIRECTORIES else None

    def get_directory_by_name(self, name):
        """Get directory by name"""
        for d in self.DIRECTORIES:
            if d['name'] == name:
                return d
        return None

    def get_initiatives_dir(self, dir_name=None):
        """Get the initiatives directory path"""
        if dir_name:
            directory = self.get_directory_by_name(dir_name)
            if directory:
                return directory['path']

        default_dir = self.get_default_directory()
        return default_dir['path'] if default_dir else Path('./initiatives')

    def log_message(self, format, *args):
        """Override to provide cleaner logging"""
        print(f"[{self.log_date_time_string()}] {format % args}")

    def send_json(self, data, status=200):
        """Helper to send JSON responses"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_file(self, filepath, content_type):
        """Helper to send file contents"""
        try:
            with open(filepath, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(f.read())
        except FileNotFoundError:
            self.send_error(404, 'File not found')

    def serve_static(self, path):
        """Serve static files from src/dist/, fall back to index.html for SPA routing"""
        # Try to serve the exact file requested
        if path == '/':
            file_path = STATIC_DIR / 'index.html'
        else:
            file_path = STATIC_DIR / path.lstrip('/')

        # Prevent directory traversal
        try:
            file_path = file_path.resolve()
            if not str(file_path).startswith(str(STATIC_DIR.resolve())):
                self.send_error(403, 'Forbidden')
                return
        except Exception:
            self.send_error(400, 'Bad request')
            return

        if file_path.is_file():
            content_type, _ = mimetypes.guess_type(str(file_path))
            self.send_file(str(file_path), content_type or 'application/octet-stream')
        else:
            # SPA fallback: serve index.html for client-side routing
            self.send_file(str(STATIC_DIR / 'index.html'), 'text/html')

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed = urlparse(self.path)
        path = parsed.path

        # API: Get full config
        if path == '/api/config':
            try:
                config_path = Path('config.json')
                if config_path.exists():
                    with open(config_path, 'r') as f:
                        config = json.load(f)
                else:
                    config = {
                        'server': {'host': 'localhost', 'port': 3939},
                        'directories': [{'name': 'Personal', 'path': './initiatives', 'default': True}]
                    }
                self.send_json(config)
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
            return

        # API: Get directories configuration
        if path == '/api/directories':
            try:
                dirs = [
                    {
                        'name': d['name'],
                        'path': str(d['path']),
                        'default': d['default']
                    }
                    for d in self.DIRECTORIES
                ]
                self.send_json(dirs)
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
            return

        # API: List all initiatives
        if path == '/api/initiatives':
            try:
                dir_name = parse_qs(parsed.query).get('directory', [None])[0]
                initiatives = self.list_initiatives(dir_name)
                self.send_json(initiatives)
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
            return

        # API: Search
        if path == '/api/search':
            try:
                query = parse_qs(parsed.query).get('q', [''])[0]
                dir_name = parse_qs(parsed.query).get('directory', [None])[0]
                results = self.search(query, dir_name)
                self.send_json(results)
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
            return

        # API: Get specific initiative or file
        if path.startswith('/api/initiatives/'):
            parts = path.split('/')
            if len(parts) >= 4:
                init_id = parts[3]
                file_name = parts[4] if len(parts) > 4 else None
                dir_name = parse_qs(parsed.query).get('directory', [None])[0]
                try:
                    data = self.get_initiative(init_id, file_name, dir_name)
                    self.send_json(data)
                except Exception as e:
                    self.send_json({'error': str(e)}, 404)
                return

        # Serve static files from React build (src/dist/)
        self.serve_static(path)

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length).decode())

        parsed = urlparse(self.path)
        path = parsed.path
        print(f"POST {path} - Body: {body}")  # Debug logging

        try:
            # Update config
            if path == '/api/config':
                config_path = Path('config.json')
                # Validate structure
                if 'server' not in body or 'directories' not in body:
                    raise ValueError('Config must have "server" and "directories" keys')
                if not isinstance(body['directories'], list) or len(body['directories']) == 0:
                    raise ValueError('At least one directory is required')
                for d in body['directories']:
                    if not d.get('name') or not d.get('path'):
                        raise ValueError('Each directory must have "name" and "path"')
                # Ensure exactly one default
                has_default = any(d.get('default') for d in body['directories'])
                if not has_default:
                    body['directories'][0]['default'] = True
                with open(config_path, 'w') as f:
                    json.dump(body, f, indent=2)
                    f.write('\n')
                # Hot-reload directories in memory
                self.set_directories(body['directories'])
                global CONFIG
                CONFIG = body
                print(f"Config updated. Directories reloaded: {[d['name'] for d in body['directories']]}")
                self.send_json({'success': True})
                return

            # Create new initiative
            if path == '/api/initiatives':
                result = self.create_initiative(body)
                self.send_json(result, 201)
                return

            # Add note
            if '/note' in path:
                init_id = path.split('/')[3]
                print(f"Adding note to {init_id}: {body.get('note')}")  # Debug
                result = self.add_note(init_id, body)
                print(f"Note added successfully: {result}")  # Debug
                self.send_json(result)
                return

            # Update file content
            if '/file' in path:
                init_id = path.split('/')[3]
                file_name = path.split('/')[5] if len(path.split('/')) > 5 else None
                print(f"Updating file {file_name} in {init_id}")  # Debug
                result = self.update_initiative_file(init_id, file_name, body)
                print(f"File updated successfully: {result}")  # Debug
                self.send_json(result)
                return

            # Add communication
            if '/comm' in path:
                init_id = path.split('/')[3]
                print(f"Adding comm to {init_id}")  # Debug
                result = self.add_comm(init_id, body)
                print(f"Comm added successfully: {result}")  # Debug
                self.send_json(result)
                return

            self.send_error(404, 'Not found')
        except Exception as e:
            print(f"Error in POST: {e}")  # Debug
            import traceback
            traceback.print_exc()
            self.send_json({'error': str(e)}, 400)

    def list_initiatives(self, dir_name=None):
        """List all initiatives with metadata from README"""
        initiatives = []
        initiatives_dir = self.get_initiatives_dir(dir_name)

        if not initiatives_dir.exists():
            return initiatives

        # Get the directory name for response
        dir_info = self.get_directory_by_name(dir_name) if dir_name else self.get_default_directory()
        directory_name = dir_info['name'] if dir_info else 'Personal'

        for init_dir in sorted(initiatives_dir.iterdir()):
            if init_dir.is_dir():
                readme_path = init_dir / 'README.md'
                if readme_path.exists():
                    readme = readme_path.read_text()
                    metadata = self.parse_readme_metadata(readme)
                    initiatives.append({
                        'id': init_dir.name,
                        'name': metadata.get('name', init_dir.name),
                        'status': metadata.get('status', ''),
                        'type': metadata.get('type', ''),
                        'deadline': metadata.get('deadline', ''),
                        'blockers': metadata.get('blockers', 0),
                        'directory': directory_name
                    })

        return initiatives

    def parse_readme_metadata(self, content):
        """Extract metadata from README.md"""
        metadata = {}

        # Extract title (first h1)
        name_match = re.search(r'^# (.+)$', content, re.MULTILINE)
        if name_match:
            metadata['name'] = name_match.group(1)

        # Extract initiative ID
        id_match = re.search(r'\*\*Initiative ID:\*\* (.+)$', content, re.MULTILINE)
        if id_match:
            metadata['id'] = id_match.group(1)

        # Extract type
        type_match = re.search(r'\*\*Type:\*\* (.+)$', content, re.MULTILINE)
        if type_match:
            metadata['type'] = type_match.group(1).replace('<!--', '').replace('-->', '').strip()

        # Extract status
        status_match = re.search(r'\*\*Status:\*\* (.+)$', content, re.MULTILINE)
        if status_match:
            metadata['status'] = status_match.group(1)

        # Extract target deadline
        deadline_match = re.search(r'\*\*Target deadline:\*\* (.+)$', content, re.MULTILINE)
        if deadline_match:
            metadata['deadline'] = deadline_match.group(1)

        # Count blockers
        blockers_section = re.search(r'## Blockers / Risks\n(.+?)(?=\n##|\Z)', content, re.DOTALL)
        if blockers_section:
            blockers_text = blockers_section.group(1).strip()
            # Count non-empty lines that start with -
            blockers = [line for line in blockers_text.split('\n') if line.strip().startswith('-') and len(line.strip()) > 1]
            metadata['blockers'] = len(blockers)
        else:
            metadata['blockers'] = 0

        return metadata

    def get_initiative(self, init_id, file_name=None, dir_name=None):
        """Get full initiative or specific file"""
        # Validate init_id to prevent directory traversal
        if '..' in init_id or '/' in init_id:
            raise ValueError('Invalid initiative ID')

        initiatives_dir = self.get_initiatives_dir(dir_name)
        init_path = initiatives_dir / init_id

        if not init_path.exists():
            raise FileNotFoundError(f'Initiative {init_id} not found')

        # Return specific file
        if file_name:
            if file_name not in ['readme', 'notes', 'comms', 'links']:
                raise ValueError('Invalid file name')
            file_path = init_path / f"{file_name}.md"
            return {'content': file_path.read_text()}

        # Return all files
        return {
            'id': init_id,
            'readme': (init_path / 'README.md').read_text() if (init_path / 'README.md').exists() else '',
            'notes': (init_path / 'notes.md').read_text() if (init_path / 'notes.md').exists() else '',
            'comms': (init_path / 'comms.md').read_text() if (init_path / 'comms.md').exists() else '',
            'links': (init_path / 'links.md').read_text() if (init_path / 'links.md').exists() else ''
        }

    def search(self, query, dir_name=None):
        """Full-text search across all initiatives"""
        if not query:
            return []

        results = []
        query_lower = query.lower()
        initiatives_dir = self.get_initiatives_dir(dir_name)

        if not initiatives_dir.exists():
            return results

        for init_dir in initiatives_dir.iterdir():
            if not init_dir.is_dir():
                continue

            for md_file in init_dir.glob('*.md'):
                try:
                    content = md_file.read_text()
                    if query_lower in content.lower():
                        # Extract context around matches
                        lines = content.split('\n')
                        matches = []
                        for i, line in enumerate(lines, 1):
                            if query_lower in line.lower():
                                matches.append({
                                    'line_num': i,
                                    'text': line[:100]  # Limit line length
                                })
                                if len(matches) >= 3:  # Limit to 3 matches per file
                                    break

                        results.append({
                            'initiative': init_dir.name,
                            'file': md_file.name,
                            'matches': matches
                        })
                except Exception:
                    continue

        return results

    def create_initiative(self, data):
        """Create new initiative (mirrors new-initiative.sh)"""
        init_id = data.get('id', '').strip()
        name = data.get('name', '').strip()
        init_type = data.get('type', '').strip()
        dir_name = data.get('directory')

        if not init_id or not name:
            raise ValueError('ID and name are required')

        # Validate init_id
        if '..' in init_id or '/' in init_id:
            raise ValueError('Invalid initiative ID')

        initiatives_dir = self.get_initiatives_dir(dir_name)
        init_path = initiatives_dir / init_id

        if init_path.exists():
            raise ValueError(f'Initiative {init_id} already exists')

        # Create directory
        init_path.mkdir(parents=True)

        # Create README.md with template
        readme_content = f"""# {name}

## Overview
- **Initiative ID:** {init_id}
- **Type:** {init_type or '<!-- ' + ' | '.join(CONFIG.get('initiativeTypes', [])) + ' -->'}
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
"""
        (init_path / 'README.md').write_text(readme_content)

        # Create notes.md
        today = datetime.now().strftime('%Y-%m-%d')
        notes_content = f"""# Initiative Notes — {init_id}

<!-- Append-only log. Never edit above, only add below. -->

## {today}
- Initiative created.
"""
        (init_path / 'notes.md').write_text(notes_content)

        # Create comms.md
        comms_content = f"""# Communications Log — {init_id}

| Date | Channel | Link | Context |
|------|---------|------|---------|
"""
        (init_path / 'comms.md').write_text(comms_content)

        # Create links.md
        links_content = f"""# Important Links — {init_id}

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
"""
        (init_path / 'links.md').write_text(links_content)

        return {'success': True, 'id': init_id}

    def add_note(self, init_id, data):
        """Add note (mirrors add-note.sh)"""
        # Validate init_id
        if '..' in init_id or '/' in init_id:
            raise ValueError('Invalid initiative ID')

        note = data.get('note', '').strip()
        dir_name = data.get('directory')
        if not note:
            raise ValueError('Note is required')

        initiatives_dir = self.get_initiatives_dir(dir_name)
        notes_file = initiatives_dir / init_id / 'notes.md'

        if not notes_file.exists():
            raise FileNotFoundError(f'Initiative {init_id} not found')

        today = datetime.now().strftime('%Y-%m-%d')
        content = notes_file.read_text()

        # Check if today's header exists
        if f"## {today}" in content:
            # Append to today's section
            with open(notes_file, 'a') as f:
                f.write(f"- {note}\n")
        else:
            # Create new date section
            with open(notes_file, 'a') as f:
                f.write(f"\n## {today}\n- {note}\n")

        return {'success': True}

    def add_comm(self, init_id, data):
        """Add communication (mirrors add-comm.sh)"""
        # Validate init_id
        if '..' in init_id or '/' in init_id:
            raise ValueError('Invalid initiative ID')

        channel = data.get('channel', '').strip()
        link = data.get('link', '').strip()
        context = data.get('context', '').strip()
        dir_name = data.get('directory')

        if not channel or not link or not context:
            raise ValueError('Channel, link, and context are required')

        initiatives_dir = self.get_initiatives_dir(dir_name)
        comms_file = initiatives_dir / init_id / 'comms.md'

        if not comms_file.exists():
            raise FileNotFoundError(f'Initiative {init_id} not found')

        today = datetime.now().strftime('%Y-%m-%d')

        with open(comms_file, 'a') as f:
            f.write(f"| {today} | {channel} | {link} | {context} |\n")

        return {'success': True}

    def update_initiative_file(self, init_id, file_name, data):
        """Update specific file content"""
        # Validate init_id
        if '..' in init_id or '/' in init_id:
            raise ValueError('Invalid initiative ID')

        content = data.get('content')
        dir_name = data.get('directory')

        if content is None:
            raise ValueError('Content is required')

        if file_name not in ['readme', 'notes', 'comms', 'links']:
            raise ValueError('Invalid file name')

        initiatives_dir = self.get_initiatives_dir(dir_name)
        
        # Map file_name to actual filename
        filename_map = {
            'readme': 'README.md',
            'notes': 'notes.md',
            'comms': 'comms.md',
            'links': 'links.md'
        }
        
        actual_filename = filename_map.get(file_name)
        file_path = initiatives_dir / init_id / actual_filename

        if not file_path.exists():
            raise FileNotFoundError(f'File {actual_filename} not found in initiative {init_id}')

        file_path.write_text(content)

        return {'success': True}


def main():
    """Start the server"""
    host = CONFIG['server'].get('host', 'localhost')
    port = CONFIG['server'].get('port', 3939)

    # Set directories on the handler class
    InitiativeHandler.set_directories(CONFIG['directories'])

    server = HTTPServer((host, port), InitiativeHandler)

    print("=" * 60)
    print("  Personal Initiative Tracker - Web UI")
    print("=" * 60)
    print(f"\n✓ Server running at http://{host}:{port}")
    if STATIC_DIR.exists():
        print(f"✓ Serving React app from {STATIC_DIR}")
    else:
        print(f"⚠ React build not found at {STATIC_DIR}")
        print(f"  Run: cd src && npm run build")
    print(f"✓ Directories configured:")
    for d in CONFIG['directories']:
        marker = " (default)" if d.get('default') else ""
        print(f"  - {d['name']}: {d['path']}{marker}")
    print("✓ Press Ctrl+C to stop\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")
        server.shutdown()


if __name__ == '__main__':
    main()
