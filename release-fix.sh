#!/bin/bash

# Quick Fix Script for Jellyfin Request Plugin Release
# This script will merge the workflow to main and recreate the release tag

set -e

echo "=========================================="
echo "Jellyfin Request Plugin - Release Fix"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "Error: manifest.json not found. Are you in the correct directory?"
    exit 1
fi

echo "Step 1: Merging workflow to main branch..."
git checkout main
git merge claude/fix-jellyfin-plugin-install-01PmwvQqkgb9n8NNyYctdwQ2 -m "Merge build workflow and release automation"
git push origin main

echo ""
echo "Step 2: Deleting old v1.0.0 tag..."
git tag -d v1.0.0 2>/dev/null || echo "Local tag doesn't exist, skipping..."
git push origin :refs/tags/v1.0.0 2>/dev/null || echo "Remote tag doesn't exist or can't be deleted, continuing..."

echo ""
echo "Step 3: Creating new v1.0.0 tag..."
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial release of Jellyfin Request Plugin

This release includes:
- Floating button UI on all Jellyfin pages
- Request submission form for movies and TV shows
- Admin request management panel
- Status tracking (Pending/Processing/Complete)
- User-specific views
- Thread-safe JSON data storage"

git push origin v1.0.0

echo ""
echo "=========================================="
echo "✓ Release process initiated!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/K3ntas/jellyfin-plugin-request/actions"
echo "2. Wait for the build workflow to complete (usually 2-3 minutes)"
echo "3. Go to: https://github.com/K3ntas/jellyfin-plugin-request/releases/tag/v1.0.0"
echo "4. Copy the MD5 checksum from the release notes"
echo "5. Update manifest.json with the correct checksum"
echo "6. Commit and push the manifest update"
echo ""
echo "Then you can install the plugin from Jellyfin's plugin catalog!"
echo ""
