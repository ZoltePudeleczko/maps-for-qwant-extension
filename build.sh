#!/usr/bin/env bash
# Builds the Chrome Web Store upload package: dist/maps-tab-for-qwant-<version>.zip
set -euo pipefail
cd "$(dirname "$0")"
version=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
mkdir -p dist
out="dist/maps-tab-for-qwant-${version}.zip"
rm -f "$out"
(cd extension && zip -qr "../$out" . -x '.*')
echo "Built $out"
