# Initiative OS — Personal Staff Engineer Playbook

Sistema personal para tracking de iniciativas cross-team usando **Markdown + scripts + Web UI**, pensado como una **EPIC de alto nivel**, no como delivery tooling.

---

## 🎯 Objetivo

- Tener una **single source of truth liviana**
- Mantener **contexto, ownership y decisiones**
- Linkear documentos detallados sin duplicarlos
- Trackear comunicaciones y notas rápidamente
- Cero fricción, cero burocracia
- **Interfaz web moderna** con vista de lista y Kanban board
- **Integración con Claude Code** para gestión por voz/texto

---

## 🚀 Quick Start

### Opción 1: Web UI (Recomendado)

```bash
# Opción A: Todo en uno - Iniciar y abrir navegador automáticamente
./scripts/manage.sh open-ui

# Opción B: Iniciar servidor manualmente
./scripts/manage.sh start

# Opción C: Directamente con Python
python3 server.py

# Abrir navegador manualmente
open http://localhost:3939

# Detener servidor
./scripts/manage.sh stop
```

La interfaz web incluye:
- 📊 Dashboard con estadísticas
- 📋 Vista de lista con búsqueda
- 📌 Kanban board (Idea → Discovery → Progress → Blocked → Delivered)
- ✏️ Formularios para crear/editar iniciativas
- 🔍 Búsqueda full-text en tiempo real
- 📁 Soporte multi-directorio (Personal, Work, etc.)

### Opción 2: Unified Interactive Script (Recomendado para CLI)

El script unificado `manage.sh` soporta tanto modo interactivo como CLI con parámetros:

#### Modo Interactivo
```bash
# Lanzar menú interactivo
./scripts/manage.sh

# Menú con opciones:
# 1) Create new initiative
# 2) Add note to initiative
# 3) Log communication
# 4) List all initiatives
# 5) Start web server
# 6) Stop web server
# 7) Restart web server
# 8) Server status
# 9) Open UI in browser
# h) Help
# 0) Exit
```

#### Modo CLI con Parámetros

```bash
# Gestión del servidor
./scripts/manage.sh open-ui            # Iniciar servidor y abrir navegador
./scripts/manage.sh start              # Iniciar servidor web
./scripts/manage.sh stop               # Detener servidor web
./scripts/manage.sh restart            # Reiniciar servidor web
./scripts/manage.sh status             # Ver estado del servidor

# Crear iniciativa
./scripts/manage.sh new FRAUD-2026-01 "Fraud Real-time Signals Integration"

# Agregar nota
./scripts/manage.sh note FRAUD-2026-01 "Product alignment delayed"

# Registrar comunicación
./scripts/manage.sh comm FRAUD-2026-01 Slack "https://slack/..." "Kickoff with Risk"

# Listar todas las iniciativas
./scripts/manage.sh list

# Ver ayuda
./scripts/manage.sh --help
```

**Características:**
- ✅ Gestión del servidor web (start/stop/status)
- ✅ Modo interactivo con prompts paso a paso
- ✅ Modo CLI para scripting y automatización
- ✅ Soporte multi-directorio con selector interactivo
- ✅ Validación de inputs con mensajes claros
- ✅ Auto-expansión de tilde (`~/path`) en config.json
- ✅ Servidor en background con gestión de PID

### Opción 3: Scripts Individuales (Legacy)

Los scripts originales siguen disponibles para compatibilidad:

```bash
# Crear iniciativa
./scripts/new-initiative.sh FRAUD-2026-01 "Fraud Real-time Signals Integration"

# Agregar nota
./scripts/add-note.sh FRAUD-2026-01 "Product alignment delayed"

# Registrar comunicación
./scripts/add-comm.sh FRAUD-2026-01 Slack "https://slack/..." "Kickoff with Risk"
```

### Opción 4: Claude Code Skill

Si usas Claude Code, el proyecto incluye un skill completo:

```bash
# El skill se activa automáticamente cuando mencionas iniciativas
"Create a new regulatory initiative for fraud detection"
"Update FRAUD-2026-01 status to In progress"
"List all blocked initiatives"
"Search for regulatory mentions"
```

Ubicación del skill: `.claude/skills/initiative-manager/`

---

## 📂 Estructura del Proyecto

```text
personal-initiative-tracker/
├── initiatives/              # Directorio de iniciativas (configurable)
│   └── FRAUD-2026-01/       # Cada iniciativa = directorio
│       ├── README.md        # EPIC principal (requerido)
│       ├── notes.md         # Log append-only de decisiones
│       ├── comms.md         # Registro de comunicaciones
│       └── links.md         # Referencias externas
│
├── scripts/                 # Scripts CLI
│   ├── manage.sh           # Script unificado interactivo + CLI (RECOMENDADO)
│   ├── new-initiative.sh    # Crear nueva iniciativa (legacy)
│   ├── add-note.sh         # Agregar nota con auto-fecha (legacy)
│   └── add-comm.sh         # Registrar comunicación (legacy)
│
├── .claude/skills/initiative-manager/  # Claude Code Skill
│   ├── SKILL.md            # Definición del skill
│   ├── scripts/            # Scripts especializados
│   │   ├── create-initiative.sh
│   │   ├── update-status.sh
│   │   ├── add-blocker.sh
│   │   ├── remove-blocker.sh
│   │   ├── list-initiatives.sh
│   │   └── search-initiatives.sh
│   ├── references/         # Documentación de referencia
│   └── assets/            # Plantillas
│
├── server.py               # Servidor web Python
├── index.html             # Single-page application
├── config.json            # Configuración multi-directorio
└── README.md              # Este archivo
```

> **Regla:** Si no existe el `README.md`, la iniciativa no existe.

---

## 📋 Archivos de una Iniciativa

### `README.md` — Initiative EPIC

El documento principal con metadata estructurada:

| Sección | Contenido |
|---------|-----------|
| **Overview** | ID, tipo, status, fechas, one-liner |
| **Ownership** | Sponsor, requestor, PO, tech owner, teams |
| **Stakeholders & Approvals** | Checklist de áreas requeridas |
| **High-level Milestones** | Solo hitos clave (5-8 máx), no tareas |
| **Blockers / Risks** | Impedimentos actuales con owners |
| **Final Sign-offs** | Aprobaciones formales con nombres y fechas |
| **References** | Links a los otros archivos |

**Formato de ID:** `UPPERCASE-YYYY-NN` (ej: `FRAUD-2026-01`, `PLATFORM-2026-15`)

### `notes.md` — Notas Vivas (Append-Only)

Log cronológico de decisiones y cambios importantes:

```markdown
# Notes & Decisions

<!--
APPEND-ONLY LOG
Never edit entries above. Only add new entries below.
This maintains an immutable audit trail of decisions.
-->

## 2026-01-10
- Initial discussion with Risk team
- Scope might be reduced to outbound transactions only

## 2026-01-18
- Product flagged roadmap conflict for Q1
- Decision: Proceed with reduced scope, revisit in Q2
```

> **Regla:** Nunca editar hacia arriba, solo agregar abajo (audit trail inmutable).

### `comms.md` — Registro de Comunicaciones

Tabla de comunicaciones importantes (evita el "yo nunca vi eso"):

```markdown
| Date       | Channel | Link              | Context           |
|------------|---------|-------------------|-------------------|
| 2026-01-10 | Slack   | https://slack/... | Kickoff           |
| 2026-01-18 | Email   | https://mail/...  | Approval request  |
| 2026-02-01 | Zoom    | Recording link    | Legal sign-off    |
```

**Cuándo loguear:**
- Kickoffs y alineaciones de stakeholders
- Aprobaciones y sign-offs
- Escalaciones
- Cambios de alcance comunicados

### `links.md` — Artefactos Externos

Referencias a documentos detallados (no duplicar, solo linkear):

```markdown
# Links & Artifacts

## Docs
- PRD: https://...
- Tech Spec / RFC: https://...
- Architecture Diagram: https://...

## Tracking
- Jira Epic: https://jira/...
- Project Board: https://...

## Repos
- Code: https://github.com/org/repo
- Infrastructure: https://github.com/org/infra
```

---

## 🏷️ Tipos de Iniciativa

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Discovery** | Exploración / investigación | Evaluar vendor de autenticación |
| **PoC** | Prueba de concepto | Pilot de nueva arquitectura |
| **Platform change** | Cambio de infraestructura | Migración a Kubernetes |
| **Regulatory** | Cumplimiento normativo | GDPR compliance |
| **Growth** | Iniciativas de negocio | Nueva línea de producto |
| **Infra** | Mejoras de confiabilidad | Reducir latencia P99 |

---

## 📊 Estados de una Iniciativa

| Status | Cuándo usar | Duración típica |
|--------|-------------|-----------------|
| **Idea** | Concepto inicial, no aprobado | 1-4 semanas |
| **In discovery** | Explorando viabilidad, scope | 2-8 semanas |
| **In progress** | Desarrollo activo | 4-16 semanas |
| **Blocked** | Detenida por impedimentos | N/A |
| **Waiting approvals** | Esperando sign-offs finales | 1-3 semanas |
| **Delivered** | En producción | N/A |
| **Paused** | Temporalmente suspendida | N/A |
| **Cancelled** | No se continuará | N/A |

**Workflow típico:**
```
Idea → In discovery → In progress → Waiting approvals → Delivered
       ↓              ↓
     Paused        Blocked
       ↓              ↓
   Cancelled      [resolver] → In progress
```

> Ver `.claude/skills/initiative-manager/references/STATUS-GUIDE.md` para guía detallada.

---

## ⏰ Tipos de Deadline

| Tipo | Descripción | Flexibilidad |
|------|-------------|--------------|
| **Soft** | Fecha interna, flexible | Alta |
| **Commercial** | Compromiso con cliente/partner | Media |
| **Contractual** | Obligación contractual | Baja |
| **Regulatory** | Requerimiento legal | **Cero** (non-negotiable) |

---

## 🌐 Web UI - Características

### Dashboard
- Contadores por status (Idea, In discovery, In progress, etc.)
- Lista de iniciativas con metadata visible
- Búsqueda en tiempo real con indicador de carga
- Filtros por status, tipo, directorio

### Vista de Lista
- Tabs: Overview, Notes, Comms, Links
- Markdown renderizado en tiempo real
- Formularios modales para agregar notas/comunicaciones
- Navegación con browser history (botón back funciona)

### Kanban Board
- 5 columnas: Idea → Discovery → Progress → Blocked → Delivered
- Drag & drop (próximamente)
- Contador de bloqueadores visible
- Deadlines destacados

### Búsqueda
- Full-text search en todos los archivos
- Resultados en tiempo real
- Highlighting de matches
- Keyboard shortcut: `⌘K` / `Ctrl+K`

### Multi-Directory
- Selector de directorio con icono de carpeta
- Soporte para Personal, Work, Archive, etc.
- Configuración en `config.json`
- Cambio instantáneo sin recargar

---

## ⚙️ Configuración Multi-Directorio

Edita `config.json` para separar iniciativas por contexto:

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
      "path": "~/work-initiatives",
      "default": false
    },
    {
      "name": "Archive",
      "path": "./archive",
      "default": false
    }
  ]
}
```

**Casos de uso:**
- Separar proyectos personales y del trabajo
- Organizar por cliente
- Archivar iniciativas completadas
- Separar por año

### Comportamiento por Herramienta

**Web UI:**
- Selector de directorio en el dashboard
- Cambio instantáneo entre directorios

**Script Unificado (manage.sh):**
- **Modo Interactivo:** Prompt para seleccionar directorio al crear iniciativa
- **Modo CLI:** Usa el directorio marcado como `"default": true`

**Scripts Individuales (legacy):**
- Siempre usan el directorio marcado como `"default": true`

**Soporte de Rutas:**
- ✅ Rutas relativas: `./initiatives`
- ✅ Rutas absolutas: `/Users/nombre/initiatives`
- ✅ Tilde expansion: `~/Documents/initiatives` (se expande automáticamente)

---

## 🤖 Claude Code Skill

El proyecto incluye un skill completo de Claude Code que sigue el estándar [agentskills.io](https://agentskills.io).

### Ubicación
```
.claude/skills/initiative-manager/
```

### Operaciones Disponibles

**Crear iniciativas:**
```bash
.claude/skills/initiative-manager/scripts/create-initiative.sh \
  FRAUD-2026-01 "Fraud Signals" Regulatory
```

**Actualizar status:**
```bash
.claude/skills/initiative-manager/scripts/update-status.sh \
  FRAUD-2026-01 "In progress"
```

**Gestionar blockers:**
```bash
# Agregar
.claude/skills/initiative-manager/scripts/add-blocker.sh \
  FRAUD-2026-01 "Waiting for Platform team capacity"

# Remover
.claude/skills/initiative-manager/scripts/remove-blocker.sh \
  FRAUD-2026-01 1
```

**Listar y filtrar:**
```bash
# Listar todas
.claude/skills/initiative-manager/scripts/list-initiatives.sh

# Solo bloqueadas
.claude/skills/initiative-manager/scripts/list-initiatives.sh --status "Blocked"

# Por tipo
.claude/skills/initiative-manager/scripts/list-initiatives.sh --type Regulatory

# Output JSON
.claude/skills/initiative-manager/scripts/list-initiatives.sh --format json
```

**Buscar:**
```bash
# Búsqueda general
.claude/skills/initiative-manager/scripts/search-initiatives.sh "regulatory"

# En archivo específico
.claude/skills/initiative-manager/scripts/search-initiatives.sh "vendor" --file notes
```

### Usar con Claude

Simplemente menciona iniciativas en lenguaje natural:

```
"Create a new platform initiative for API migration"
→ Claude ejecuta create-initiative.sh con los parámetros correctos

"What initiatives are blocked?"
→ Claude ejecuta list-initiatives.sh --status Blocked

"Update FRAUD-2026-01 to In progress"
→ Claude ejecuta update-status.sh
```

### Documentación del Skill

- **SKILL.md** - Instrucciones principales (488 líneas)
- **references/STATUS-GUIDE.md** - Workflow de estados
- **references/TEMPLATE.md** - Template completo de README
- **scripts/lib/** - Librerías compartidas (validación, config, formato)

---

## 🛠️ Power Tips (Staff-level)

### Buscar decisiones en todas las iniciativas

```bash
# Con ripgrep (más rápido)
rg "Risk" initiatives/
rg "blocked" initiatives/
rg "Legal" initiatives/

# Con grep
grep -r "vendor" initiatives/*/notes.md
```

### Ver evolución de una iniciativa

```bash
# Historial de commits
git log initiatives/FRAUD-2026-01

# Cambios en formato compacto
git log --oneline initiatives/

# Ver un cambio específico
git show abc123:initiatives/FRAUD-2026-01/README.md
```

### Listar todas las iniciativas

```bash
# Lista simple
ls -la initiatives/

# Con status
grep -r "Status:" initiatives/*/README.md

# Con el skill de Claude
.claude/skills/initiative-manager/scripts/list-initiatives.sh --format simple
```

### Encontrar iniciativas bloqueadas

```bash
# Grep tradicional
grep -r "Blocked" initiatives/*/README.md

# Con el skill
.claude/skills/initiative-manager/scripts/list-initiatives.sh --blocked

# Con ripgrep
rg "Status.*Blocked" initiatives/
```

### Generar reportes

```bash
# Iniciativas vencidas
.claude/skills/initiative-manager/scripts/list-initiatives.sh --overdue

# Por status
grep -h "Status:" initiatives/*/README.md | sort | uniq -c

# Contar blockers
awk '/^## Blockers/,/^##/ {count++} END {print count}' initiatives/*/README.md
```

### Usar la API directamente

```bash
# Listar todas
curl http://localhost:3939/api/initiatives | jq

# Buscar
curl "http://localhost:3939/api/search?q=regulatory" | jq

# Crear
curl -X POST http://localhost:3939/api/initiatives \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST-2026-01","name":"Test Initiative"}'

# Agregar nota
curl -X POST http://localhost:3939/api/initiatives/TEST-2026-01/note \
  -H "Content-Type: application/json" \
  -d '{"note":"This is a test note"}'
```

---

## 🎨 Personalización UI

### Keyboard Shortcuts

| Shortcut | Acción |
|----------|--------|
| `⌘K` / `Ctrl+K` | Focus search |
| `⌘N` / `Ctrl+N` | New initiative |
| `⌘1-4` | Switch tabs |
| `Esc` | Close modals |

### Temas de Color

Edita las variables CSS en `index.html`:

```css
:root {
    --primary: #3b82f6;        /* Azul principal */
    --primary-dark: #2563eb;   /* Azul oscuro */
    --success: #10b981;        /* Verde éxito */
    --danger: #ef4444;         /* Rojo peligro */
    --warning: #f59e0b;        /* Naranja warning */
}
```

---

## 📖 Filosofía del Sistema

### Este sistema NO reemplaza:
- ❌ PRDs (Product Requirements Documents)
- ❌ Jira / Linear / Asana (delivery tracking)
- ❌ Slack / Email (comunicación)
- ❌ Tech Specs / RFCs (diseño técnico)
- ❌ Code / Repos (implementación)

### Este sistema CONECTA todo eso:
- ✅ Es el **índice central** que linkea todo
- ✅ Mantiene el **contexto de alto nivel**
- ✅ Documenta **decisiones y ownership**
- ✅ Trackea **aprobaciones y comunicaciones**
- ✅ Proporciona **visibilidad cross-team**

### Analogía

```
PRD          →  "Qué" queremos construir
Tech Spec    →  "Cómo" lo vamos a construir
Jira         →  "Tareas" para construirlo
Initiative   →  "Contexto" que conecta todo + ownership + decisiones
```

---

## ⚡ Regla de Oro (Staff Survival Rule)

> Si alguien pregunta **"¿dónde está esto?"** → link al `README.md` de la iniciativa.
>
> No explicas, no resumes, no reenvías contexto.
>
> El README tiene todo: owners, status, links, decisiones, comunicaciones.

**Beneficios:**
- Zero context switching
- Single source of truth
- Self-service para stakeholders
- Audit trail completo
- Escalable a N iniciativas

---

## 📦 Instalación y Setup

### Requisitos

- Python 3.7+ (para el servidor web)
- Bash (para scripts CLI)
- Git (para version control)
- Navegador moderno (Chrome, Firefox, Safari)

**Opcional:**
- [ripgrep](https://github.com/BurntSushi/ripgrep) - Para búsquedas más rápidas
- [jq](https://stedolan.github.io/jq/) - Para parsear config.json
- Claude Code - Para usar el skill

### Setup Inicial

1. **Clonar o copiar el proyecto**
   ```bash
   git clone <repo-url>
   cd personal-initiative-tracker
   ```

2. **Configurar directorios**
   ```bash
   # Copiar config de ejemplo
   cp config.example.json config.json

   # Editar según necesites
   nano config.json
   ```

3. **Hacer scripts ejecutables**
   ```bash
   chmod +x scripts/*.sh
   chmod +x .claude/skills/initiative-manager/scripts/*.sh
   chmod +x .claude/skills/initiative-manager/scripts/lib/*.sh
   ```

4. **Instalar dependencias** (opcional pero recomendado)
   ```bash
   # jq - Para parsear config.json (requerido para manage.sh)
   brew install jq  # macOS
   apt-get install jq  # Linux

   # ripgrep - Para búsquedas más rápidas (opcional)
   brew install ripgrep  # macOS
   apt-get install ripgrep  # Linux
   ```

5. **Iniciar servidor**
   ```bash
   python3 server.py
   ```

6. **Abrir navegador**
   ```
   http://localhost:3939
   ```

### Setup con Claude Code

Si usas Claude Code, el skill se detectará automáticamente en:
```
.claude/skills/initiative-manager/
```

No requiere configuración adicional. Solo menciona "initiative" o "EPIC" en tu conversación con Claude.

---

## 🧪 Testing

### Test Manual - Web UI

1. Abrir http://localhost:3939
2. Crear nueva iniciativa (botón "New Initiative")
3. Verificar que aparece en la lista
4. Cambiar a vista Board
5. Buscar por texto
6. Agregar nota
7. Agregar comunicación
8. Cambiar directorio (si tienes múltiples configurados)

### Test Manual - CLI (Script Unificado)

```bash
# Test modo interactivo
./scripts/manage.sh
# Seguir prompts del menú

# Test modo CLI
./scripts/manage.sh new TEST-2026-99 "Test Initiative"
./scripts/manage.sh note TEST-2026-99 "This is a test note"
./scripts/manage.sh comm TEST-2026-99 Slack "https://test" "Test comm"
./scripts/manage.sh list

# Test help
./scripts/manage.sh --help

# Cleanup
rm -rf initiatives/TEST-2026-99
```

### Test Manual - CLI (Scripts Legacy)

```bash
# Test crear
./scripts/new-initiative.sh TEST-2026-99 "Test Initiative"

# Test agregar nota
./scripts/add-note.sh TEST-2026-99 "This is a test note"

# Test agregar comm
./scripts/add-comm.sh TEST-2026-99 Slack "https://test" "Test comm"

# Cleanup
rm -rf initiatives/TEST-2026-99
```

### Test Validación

```bash
# IDs inválidos (deben fallar)
.claude/skills/initiative-manager/scripts/create-initiative.sh "invalid" "Test" Discovery
.claude/skills/initiative-manager/scripts/create-initiative.sh "../etc/passwd" "Test" Discovery

# Status inválido (debe fallar)
.claude/skills/initiative-manager/scripts/update-status.sh FRAUD-2026-01 "InvalidStatus"

# Tipo inválido (debe fallar)
.claude/skills/initiative-manager/scripts/create-initiative.sh TEST-2026-99 "Test" "InvalidType"
```

---

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Verificar Python
python3 --version

# Verificar puerto en uso
lsof -i :3939

# Cambiar puerto en config.json si es necesario
```

### Las iniciativas no aparecen

```bash
# Verificar permisos
ls -la initiatives/

# Verificar config.json
cat config.json

# Verificar que existe README.md
ls initiatives/*/README.md
```

### Scripts no ejecutan

```bash
# Verificar permisos
ls -la scripts/
ls -la .claude/skills/initiative-manager/scripts/

# Hacer ejecutables
chmod +x scripts/*.sh
chmod +x .claude/skills/initiative-manager/scripts/*.sh
```

### Búsqueda no funciona

```bash
# Verificar servidor corriendo
curl http://localhost:3939/api/search?q=test

# Ver logs del servidor
# (El servidor imprime requests en la consola)
```

---

## 📚 Documentación Adicional

- **SETUP.md** - Guía de instalación detallada
- **BOARD-VIEW.md** - Documentación del Kanban board
- **CONFIG.md** - Guía de configuración multi-directorio
- **.claude/skills/initiative-manager/SKILL.md** - Documentación del skill de Claude
- **.claude/skills/initiative-manager/references/** - Referencias detalladas

---

## 🤝 Contribuir

Este es un proyecto personal adaptable. Siéntete libre de:

- Fork y customizar para tu caso de uso
- Agregar features que necesites
- Mejorar scripts o UI
- Compartir tus mejoras

### Ideas para Extender

- [ ] Drag & drop en Kanban board
- [ ] Notificaciones de deadlines
- [ ] Integración con Jira/Linear
- [ ] Export a PDF/Markdown
- [ ] Timeline view
- [ ] Métricas y analytics
- [ ] Mobile app
- [ ] Slack bot integration

---

## 📝 Ejemplo Incluido

El repositorio incluye una iniciativa de ejemplo completa:

```
initiatives/FRAUD-2026-01/
```

Revísala para ver cómo se estructura una iniciativa real con:
- Metadata completa
- Notas fechadas
- Comunicaciones registradas
- Links a artefactos
- Blockers documentados

---

## 📄 Licencia

Personal use. Adapta como necesites.

---

## 🙏 Agradecimientos

Inspirado en prácticas de Staff+ Engineering de:
- Will Larson ([StaffEng](https://staffeng.com))
- Tanya Reilly (The Staff Engineer's Path)
- Pragmatic approaches de equipos de plataforma

---

## 📞 Soporte

Para preguntas o sugerencias:
- Crea un issue en el repo
- O adapta el código directamente a tus necesidades

**Remember:** Este sistema es tuyo. Modifícalo sin miedo.
