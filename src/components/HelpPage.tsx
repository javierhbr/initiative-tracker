
import React, { useState } from 'react';

interface HelpPageProps {
  onBack: () => void;
}

type SectionId = 'getting-started' | 'config' | 'web-ui' | 'cli' | 'api' | 'file-structure' | 'types-statuses' | 'claude' | 'shortcuts';

const sections: { id: SectionId; icon: string; label: string }[] = [
  { id: 'getting-started', icon: 'rocket_launch', label: 'Getting Started' },
  { id: 'config', icon: 'settings', label: 'Configuration' },
  { id: 'web-ui', icon: 'web', label: 'Web UI' },
  { id: 'cli', icon: 'terminal', label: 'CLI Scripts' },
  { id: 'api', icon: 'api', label: 'REST API' },
  { id: 'file-structure', icon: 'folder_open', label: 'File Structure' },
  { id: 'types-statuses', icon: 'label', label: 'Types & Statuses' },
  { id: 'claude', icon: 'smart_toy', label: 'Claude Integration' },
  { id: 'shortcuts', icon: 'keyboard', label: 'Keyboard Shortcuts' },
];

const CodeBlock: React.FC<{ children: string; title?: string }> = ({ children, title }) => (
  <div className="rounded-lg overflow-hidden border border-border-light dark:border-border-dark my-3">
    {title && (
      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-border-light dark:border-border-dark">
        {title}
      </div>
    )}
    <pre className="bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 overflow-x-auto font-mono leading-relaxed">
      {children}
    </pre>
  </div>
);

const SectionHeading: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 mt-8 first:mt-0">
    <span className="material-icons text-primary">{icon}</span>
    {children}
  </h2>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2">{children}</h3>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{children}</p>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[color] || colors.blue}`}>{children}</span>;
};

const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('getting-started');

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <nav className="w-56 shrink-0 border-r border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 py-4 px-3 space-y-1 overflow-y-auto">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-primary rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-4"
        >
          <span className="material-icons text-lg">arrow_back</span>
          Back to app
        </button>
        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Documentation</div>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all ${
              activeSection === s.id
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className={`material-icons text-base ${activeSection === s.id ? 'text-primary' : 'text-slate-400'}`}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl">
        {activeSection === 'getting-started' && (
          <>
            <SectionHeading icon="rocket_launch">Getting Started</SectionHeading>
            <P>
              Personal Initiative Tracker is a lightweight, file-based system for managing cross-team initiatives and EPICs.
              It combines Markdown files for storage, a Python web server, shell scripts for CLI operations, and Claude Code integration.
            </P>
            <P>
              This is not a replacement for Jira or PRDs — it's a central index that links and contextualizes everything
              while maintaining focus on ownership, decisions, and communications.
            </P>

            <SubHeading>Prerequisites</SubHeading>
            <div className="grid grid-cols-2 gap-2 my-3">
              {[
                { name: 'Python 3.7+', req: true },
                { name: 'Bash', req: true },
                { name: 'Git', req: true },
                { name: 'Modern browser', req: true },
                { name: 'jq', req: false },
                { name: 'ripgrep', req: false },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm">
                  <span className={`material-icons text-sm ${t.req ? 'text-primary' : 'text-slate-400'}`}>
                    {t.req ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{t.name}</span>
                  <Badge color={t.req ? 'blue' : 'slate'}>{t.req ? 'Required' : 'Optional'}</Badge>
                </div>
              ))}
            </div>

            <SubHeading>Quick Start</SubHeading>
            <CodeBlock title="Start the server and open the UI">{`./scripts/manage.sh open-ui`}</CodeBlock>
            <P>Or start manually:</P>
            <CodeBlock title="Manual start">{`python3 server.py\n# Then open http://localhost:3939`}</CodeBlock>

            <SubHeading>Your First Initiative</SubHeading>
            <P>Click the <strong>"+ New Initiative"</strong> button in the header, fill in the ID (e.g., FRAUD-2026-01), name, and type, then click Create.</P>
            <P>Each initiative creates a folder with 4 Markdown files: README.md, notes.md, comms.md, and links.md.</P>
          </>
        )}

        {activeSection === 'config' && (
          <>
            <SectionHeading icon="settings">Configuration</SectionHeading>
            <P>
              All configuration lives in <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">config.json</code> at the project root.
              You can also edit it from the Settings modal in the app (click the gear icon in the sidebar).
            </P>

            <SubHeading>Full config.json Structure</SubHeading>
            <CodeBlock title="config.json">{`{
  "server": {
    "host": "localhost",
    "port": 3939
  },
  "initiativeTypes": [
    "Discovery",
    "PoC",
    "Platform change",
    "Regulatory",
    "Growth",
    "Infra"
  ],
  "directories": [
    {
      "name": "Personal",
      "path": "./initiatives",
      "default": true
    },
    {
      "name": "Work",
      "path": "/absolute/path/to/work-initiatives",
      "default": false
    }
  ]
}`}</CodeBlock>

            <SubHeading>Options Reference</SubHeading>
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border-light dark:border-border-dark">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Setting</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400">
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3 font-mono text-xs">server.host</td><td className="py-2 px-3">string</td><td className="py-2 px-3">Server bind address</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3 font-mono text-xs">server.port</td><td className="py-2 px-3">number</td><td className="py-2 px-3">Server port</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3 font-mono text-xs">initiativeTypes</td><td className="py-2 px-3">string[]</td><td className="py-2 px-3">Available types shown in the "New Initiative" modal</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3 font-mono text-xs">directories[].name</td><td className="py-2 px-3">string</td><td className="py-2 px-3">Display name in workspace selector</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3 font-mono text-xs">directories[].path</td><td className="py-2 px-3">string</td><td className="py-2 px-3">Relative (./init) or absolute (/path)</td></tr>
                  <tr><td className="py-2 px-3 font-mono text-xs">directories[].default</td><td className="py-2 px-3">boolean</td><td className="py-2 px-3">Default workspace (exactly one must be true)</td></tr>
                </tbody>
              </table>
            </div>

            <SubHeading>Multi-Directory Support</SubHeading>
            <P>
              You can configure multiple directories to separate initiatives by context (Personal, Work, Archive).
              The workspace selector in the header lets you switch between them. Each directory is independent.
            </P>
            <P>
              Paths can be relative (resolved from the project root) or absolute. Tilde (~) is expanded to your home directory.
            </P>
          </>
        )}

        {activeSection === 'web-ui' && (
          <>
            <SectionHeading icon="web">Web UI</SectionHeading>
            <P>The web interface runs at <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">http://localhost:3939</code> and provides a full dashboard for managing initiatives.</P>

            <SubHeading>Views</SubHeading>
            <div className="space-y-2 my-3">
              {[
                { icon: 'view_list', name: 'List View', desc: 'Table of all initiatives with status, type, and deadline' },
                { icon: 'view_kanban', name: 'Board View', desc: 'Kanban board with columns: Idea, Discovery, In Progress, Blocked, Delivered' },
              ].map(v => (
                <div key={v.name} className="flex items-start gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800">
                  <span className="material-icons text-primary mt-0.5">{v.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{v.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <SubHeading>Features</SubHeading>
            <ul className="space-y-1.5 my-3 text-sm text-slate-600 dark:text-slate-400">
              {[
                'Create initiatives with ID, name, and type',
                'Full-text search across all initiative files (Cmd+K)',
                'Inline markdown editing for README, notes, comms, and links',
                'Multi-directory workspace selector',
                'Dark mode toggle',
                'Settings modal for editing config.json from the UI',
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="material-icons text-green-500 text-sm mt-0.5">check</span>
                  {f}
                </li>
              ))}
            </ul>

            <SubHeading>Building the Frontend</SubHeading>
            <P>If you modify the React source, rebuild:</P>
            <CodeBlock title="Build commands">{`cd src\nnpm install     # first time only\nnpm run build   # production build → src/dist/\nnpm run dev     # development server with hot reload`}</CodeBlock>
          </>
        )}

        {activeSection === 'cli' && (
          <>
            <SectionHeading icon="terminal">CLI Scripts</SectionHeading>
            <P>
              The primary CLI tool is <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">scripts/manage.sh</code> which supports both interactive and command modes.
            </P>

            <SubHeading>Server Management</SubHeading>
            <CodeBlock>{`./scripts/manage.sh start       # Start server in background
./scripts/manage.sh stop        # Stop server
./scripts/manage.sh restart     # Restart server
./scripts/manage.sh status      # Check if server is running
./scripts/manage.sh open-ui     # Start server + open browser`}</CodeBlock>

            <SubHeading>Initiative Operations</SubHeading>
            <CodeBlock>{`./scripts/manage.sh new <ID> <NAME>
# Example: ./scripts/manage.sh new FRAUD-2026-01 "Fraud Detection"

./scripts/manage.sh note <ID> <NOTE>
# Example: ./scripts/manage.sh note FRAUD-2026-01 "Risk team approved"

./scripts/manage.sh comm <ID> <CHANNEL> <LINK> <CONTEXT>
# Example: ./scripts/manage.sh comm FRAUD-2026-01 Slack https://... "Kickoff"

./scripts/manage.sh list        # List all initiatives`}</CodeBlock>

            <SubHeading>Interactive Mode</SubHeading>
            <P>Run without arguments to get an interactive menu:</P>
            <CodeBlock>{`./scripts/manage.sh
# Shows menu: create, note, comm, list, start, stop, restart, status, open-ui, help`}</CodeBlock>

            <SubHeading>Log Monitoring</SubHeading>
            <CodeBlock>{`./watch-logs.sh    # Tail server logs in real-time`}</CodeBlock>
          </>
        )}

        {activeSection === 'api' && (
          <>
            <SectionHeading icon="api">REST API</SectionHeading>
            <P>The Python server exposes a REST API on the configured port. All endpoints return JSON.</P>

            <SubHeading>GET Endpoints</SubHeading>
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border-light dark:border-border-dark">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Endpoint</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">GET /api/config</td><td className="py-2 px-3 font-sans text-sm">Full configuration</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">GET /api/directories</td><td className="py-2 px-3 font-sans text-sm">List configured directories</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">GET /api/initiatives?directory=...</td><td className="py-2 px-3 font-sans text-sm">List all initiatives</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">GET /api/initiatives/:id?directory=...</td><td className="py-2 px-3 font-sans text-sm">Get initiative detail (all 4 files)</td></tr>
                  <tr><td className="py-2 px-3">GET /api/search?q=...&directory=...</td><td className="py-2 px-3 font-sans text-sm">Full-text search</td></tr>
                </tbody>
              </table>
            </div>

            <SubHeading>POST Endpoints</SubHeading>
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-border-light dark:border-border-dark">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Endpoint</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Body</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">POST /api/config</td><td className="py-2 px-3 font-sans text-sm">Full config object</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">POST /api/initiatives</td><td className="py-2 px-3 font-sans text-sm">{"{ id, name, type?, directory? }"}</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">POST /api/initiatives/:id/note</td><td className="py-2 px-3 font-sans text-sm">{"{ note, directory? }"}</td></tr>
                  <tr className="border-b border-border-light dark:border-border-dark"><td className="py-2 px-3">POST /api/initiatives/:id/comm</td><td className="py-2 px-3 font-sans text-sm">{"{ channel, link, context, directory? }"}</td></tr>
                  <tr><td className="py-2 px-3">POST /api/initiatives/:id/file/:name</td><td className="py-2 px-3 font-sans text-sm">{"{ content, directory? }"}</td></tr>
                </tbody>
              </table>
            </div>

            <SubHeading>Examples</SubHeading>
            <CodeBlock title="Create an initiative">{`curl -X POST http://localhost:3939/api/initiatives \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "TEST-2026-01",
    "name": "Test Initiative",
    "type": "Discovery",
    "directory": "Personal"
  }'`}</CodeBlock>
            <CodeBlock title="Search initiatives">{`curl "http://localhost:3939/api/search?q=regulatory" | jq`}</CodeBlock>
            <CodeBlock title="Add a note">{`curl -X POST http://localhost:3939/api/initiatives/TEST-2026-01/note \\
  -H "Content-Type: application/json" \\
  -d '{"note": "Risk team approved the proposal"}'`}</CodeBlock>
          </>
        )}

        {activeSection === 'file-structure' && (
          <>
            <SectionHeading icon="folder_open">File Structure</SectionHeading>
            <P>Each initiative is a directory containing 4 Markdown files:</P>

            <div className="space-y-4 my-4">
              {[
                {
                  file: 'README.md',
                  icon: 'description',
                  color: 'blue',
                  desc: 'Main EPIC document with metadata, ownership, milestones, blockers, and sign-offs.',
                  sections: ['Overview (ID, Type, Status, Dates)', 'Ownership (Sponsor, PO, Tech Owner)', 'Stakeholders & Approvals', 'High-level Milestones', 'Blockers / Risks', 'Final Sign-offs'],
                },
                {
                  file: 'notes.md',
                  icon: 'edit_note',
                  color: 'green',
                  desc: 'Append-only decision log grouped by date. Never edit existing entries (audit trail).',
                  sections: ['Auto-dated sections (## YYYY-MM-DD)', 'Bullet-point entries', 'Chronological order'],
                },
                {
                  file: 'comms.md',
                  icon: 'forum',
                  color: 'purple',
                  desc: 'Communication tracking table with date, channel, link, and context.',
                  sections: ['Table format: Date | Channel | Link | Context', 'Channels: Slack, Email, Meeting, etc.'],
                },
                {
                  file: 'links.md',
                  icon: 'link',
                  color: 'amber',
                  desc: 'External references organized by category.',
                  sections: ['Docs: PRD, Tech Spec, Architecture', 'Tracking: Jira, Roadmap', 'Repos: Code, Infrastructure'],
                },
              ].map(f => (
                <div key={f.file} className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-icons text-${f.color}-500`}>{f.icon}</span>
                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{f.file}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{f.desc}</p>
                  <ul className="space-y-1">
                    {f.sections.map((s, i) => (
                      <li key={i} className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <SubHeading>Project Layout</SubHeading>
            <CodeBlock>{`personal-initiative-tracker/
├── config.json              # App configuration
├── server.py                # Python backend
├── initiatives/             # Default initiative storage
│   └── FRAUD-2026-01/
│       ├── README.md
│       ├── notes.md
│       ├── comms.md
│       └── links.md
├── scripts/
│   └── manage.sh            # Unified CLI tool
├── src/                     # React frontend
│   ├── index.html
│   ├── App.tsx
│   ├── components/
│   └── dist/                # Built output (served by server.py)
└── .claude/skills/          # Claude Code skill`}</CodeBlock>
          </>
        )}

        {activeSection === 'types-statuses' && (
          <>
            <SectionHeading icon="label">Types & Statuses</SectionHeading>

            <SubHeading>Initiative Types</SubHeading>
            <P>Configurable in config.json and the Settings modal. Default types:</P>
            <div className="grid grid-cols-2 gap-2 my-3">
              {[
                { type: 'Discovery', desc: 'Exploration, investigation, evaluate vendor', color: 'blue' },
                { type: 'PoC', desc: 'Proof of concept, pilot new architecture', color: 'purple' },
                { type: 'Platform change', desc: 'Infrastructure changes, migrations', color: 'amber' },
                { type: 'Regulatory', desc: 'Compliance requirements (GDPR, etc.)', color: 'red' },
                { type: 'Growth', desc: 'Business initiatives, new product lines', color: 'green' },
                { type: 'Infra', desc: 'Reliability improvements, latency reduction', color: 'slate' },
              ].map(t => (
                <div key={t.type} className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800">
                  <Badge color={t.color}>{t.type}</Badge>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{t.desc}</div>
                </div>
              ))}
            </div>

            <SubHeading>Initiative Statuses</SubHeading>
            <P>Status workflow for tracking initiative lifecycle:</P>
            <div className="space-y-2 my-3">
              {[
                { status: 'Idea', desc: 'Initial concept, not yet approved', duration: '1-4 weeks', color: 'slate' },
                { status: 'In discovery', desc: 'Exploring feasibility and scope', duration: '2-8 weeks', color: 'blue' },
                { status: 'In Progress', desc: 'Active development', duration: '4-16 weeks', color: 'green' },
                { status: 'Blocked', desc: 'Stopped by external impediments', duration: 'Until resolved', color: 'red' },
                { status: 'Waiting approvals', desc: 'Code complete, pending sign-offs', duration: '1-3 weeks', color: 'amber' },
                { status: 'Delivered', desc: 'In production, done', duration: '-', color: 'green' },
                { status: 'Paused', desc: 'Temporarily suspended', duration: 'Variable', color: 'slate' },
                { status: 'Cancelled', desc: 'Will not continue', duration: '-', color: 'red' },
              ].map(s => (
                <div key={s.status} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm">
                  <Badge color={s.color}>{s.status}</Badge>
                  <span className="text-slate-600 dark:text-slate-400 flex-1">{s.desc}</span>
                  <span className="text-xs text-slate-400 shrink-0">{s.duration}</span>
                </div>
              ))}
            </div>

            <SubHeading>Workflow</SubHeading>
            <CodeBlock>{`Idea → In discovery → In Progress → Waiting approvals → Delivered
                         ↓              ↓
                       Paused         Blocked
                         ↓              ↓
                     Cancelled     [resolve] → In Progress`}</CodeBlock>
          </>
        )}

        {activeSection === 'claude' && (
          <>
            <SectionHeading icon="smart_toy">Claude Code Integration</SectionHeading>
            <P>
              The project includes a Claude Code skill that enables natural language commands
              for managing initiatives directly from the Claude CLI.
            </P>

            <SubHeading>Available Commands</SubHeading>
            <div className="space-y-2 my-3">
              {[
                { cmd: 'Create initiative', example: '"Create a new regulatory initiative for fraud detection"' },
                { cmd: 'Update status', example: '"Update FRAUD-2026-01 to In progress"' },
                { cmd: 'Add note', example: '"Add a note to FRAUD-2026-01: Risk team approved"' },
                { cmd: 'Add blocker', example: '"Add blocker to FRAUD-2026-01: Waiting for platform capacity"' },
                { cmd: 'List initiatives', example: '"What initiatives are blocked?" or "List all regulatory initiatives"' },
                { cmd: 'Search', example: '"Search for anything related to compliance"' },
              ].map(c => (
                <div key={c.cmd} className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.cmd}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{c.example}</div>
                </div>
              ))}
            </div>

            <SubHeading>Skill Scripts</SubHeading>
            <P>Located in <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">.claude/skills/initiative-manager/scripts/</code>:</P>
            <CodeBlock>{`create-initiative.sh   # Create with full validation
update-status.sh       # Update status + auto-note
add-blocker.sh         # Add blocker to README
remove-blocker.sh      # Remove blocker by index
list-initiatives.sh    # List with filters (--status, --type, --blocked)
search-initiatives.sh  # Full-text search with context`}</CodeBlock>
          </>
        )}

        {activeSection === 'shortcuts' && (
          <>
            <SectionHeading icon="keyboard">Keyboard Shortcuts</SectionHeading>
            <div className="space-y-2 my-3">
              {[
                { keys: ['Cmd', 'K'], desc: 'Focus search bar' },
                { keys: ['Cmd', 'N'], desc: 'New initiative' },
                { keys: ['Cmd', '1'], desc: 'Switch to README tab' },
                { keys: ['Cmd', '2'], desc: 'Switch to Notes tab' },
                { keys: ['Cmd', '3'], desc: 'Switch to Comms tab' },
                { keys: ['Cmd', '4'], desc: 'Switch to Links tab' },
                { keys: ['Esc'], desc: 'Close modals / go back' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <span className="text-slate-400 text-xs">+</span>}
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm min-w-[28px] text-center">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{s.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-4">On Windows/Linux, use <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Ctrl</kbd> instead of <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Cmd</kbd>.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
