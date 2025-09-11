#!/usr/bin/env bash
set -euo pipefail

EXT_REPO="https://github.com/ts-uc/StationAPI.git"
EXT_BRANCH="dev"
EXT_DIR="data"   # 取得したいディレクトリ
DEST_DIR="station_data"

rm -rf "$DEST_DIR"
git clone --depth=1 --filter=tree:0 --sparse -b "$EXT_BRANCH" "$EXT_REPO" "$DEST_DIR"
git -C "$DEST_DIR" sparse-checkout set --no-cone "$EXT_DIR"
