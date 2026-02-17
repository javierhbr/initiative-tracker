#!/bin/bash
# Package the Initiative Tracker for distribution
# Creates a zip file that users can download, unzip, and run immediately.
#
# Usage: ./package-release.sh [version]
# Example: ./package-release.sh 1.0.0

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="${1:-$(date +%Y%m%d)}"
RELEASE_NAME="initiative-tracker-${VERSION}"
BUILD_DIR="/tmp/${RELEASE_NAME}"
OUTPUT="${SCRIPT_DIR}/${RELEASE_NAME}.zip"

echo "==> Packaging Initiative Tracker v${VERSION}"

# 1. Build the React frontend
echo "  Building frontend..."
(cd "${SCRIPT_DIR}/src" && npm run build --silent)

# 2. Clean previous build
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# 3. Copy essential files
echo "  Copying files..."

# Core
cp "${SCRIPT_DIR}/server.py" "${BUILD_DIR}/"
cp "${SCRIPT_DIR}/watch-logs.sh" "${BUILD_DIR}/"

# Config — ship the example as the default config.json
cp "${SCRIPT_DIR}/config.example.json" "${BUILD_DIR}/config.example.json"
cat > "${BUILD_DIR}/config.json" << 'EOF'
{
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
    }
  ]
}
EOF

# Scripts
cp -r "${SCRIPT_DIR}/scripts" "${BUILD_DIR}/scripts"

# Built frontend (only the dist output, not source)
mkdir -p "${BUILD_DIR}/src/dist"
cp -r "${SCRIPT_DIR}/src/dist/"* "${BUILD_DIR}/src/dist/"

# Empty initiatives directory so it exists on first run
mkdir -p "${BUILD_DIR}/initiatives"
touch "${BUILD_DIR}/initiatives/.gitkeep"

# Documentation
cp "${SCRIPT_DIR}/README.md" "${BUILD_DIR}/"
cp "${SCRIPT_DIR}/SETUP.md" "${BUILD_DIR}/"
cp "${SCRIPT_DIR}/CONFIG.md" "${BUILD_DIR}/"

# Claude Code skill (optional but useful)
if [ -d "${SCRIPT_DIR}/.claude/skills" ]; then
  mkdir -p "${BUILD_DIR}/.claude/skills"
  cp -r "${SCRIPT_DIR}/.claude/skills/initiative-manager" "${BUILD_DIR}/.claude/skills/initiative-manager"
fi

# 4. Ensure scripts are executable
chmod +x "${BUILD_DIR}/server.py"
chmod +x "${BUILD_DIR}/watch-logs.sh"
chmod +x "${BUILD_DIR}/scripts/"*.sh
find "${BUILD_DIR}/.claude" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# 5. Create zip
echo "  Creating zip..."
(cd /tmp && zip -rq "${OUTPUT}" "${RELEASE_NAME}")

# 6. Cleanup
rm -rf "${BUILD_DIR}"

SIZE=$(du -h "${OUTPUT}" | cut -f1)
echo ""
echo "==> Done! ${OUTPUT} (${SIZE})"
echo ""
echo "Users can run:"
echo "  unzip ${RELEASE_NAME}.zip"
echo "  cd ${RELEASE_NAME}"
echo "  ./scripts/manage.sh open-ui"
