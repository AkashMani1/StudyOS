#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

firebase use studyos-4d50d
firebase deploy --only firestore:rules,firestore:indexes,database

echo "Firebase rules and database deploy finished for studyos-4d50d."
