#!/bin/bash

# Complete Fix and Release Script for Jellyfin Request Plugin
# This script will build the plugin and help you create the release

set -e

echo "=========================================="
echo "Jellyfin Request Plugin - Complete Fix"
echo "=========================================="
echo ""

# Check if dotnet is installed
if ! command -v dotnet &> /dev/null; then
    echo "ERROR: .NET SDK is not installed"
    echo ""
    echo "Please install .NET 9.0 SDK from: https://dotnet.microsoft.com/download"
    echo ""
    echo "Alternatively, follow the manual instructions in CREATE_RELEASE_MANUAL.md"
    echo "to use GitHub Codespaces or GitHub Actions to build the plugin."
    exit 1
fi

echo "✓ .NET SDK found"
echo ""

# Build the plugin
echo "Step 1: Building plugin..."
echo "------------------------"
./build.sh

echo ""
echo "Step 2: Getting checksum..."
echo "------------------------"
CHECKSUM=$(md5sum release/Jellyfin.Plugin.RequestPlugin.zip | awk '{print $1}')
echo "MD5 Checksum: $CHECKSUM"

echo ""
echo "Step 3: Updating manifest.json..."
echo "------------------------"
sed -i "s/PLACEHOLDER_UPDATE_AFTER_BUILD/$CHECKSUM/g" manifest.json
echo "✓ Manifest updated with checksum"

echo ""
echo "Step 4: Committing changes..."
echo "------------------------"
git add manifest.json
git commit -m "Update manifest with v1.0.1 checksum: $CHECKSUM" || echo "No changes to commit (already up to date)"

echo ""
echo "Step 5: Pushing to GitHub..."
echo "------------------------"
git push -u origin claude/fix-jellyfin-plugin-install-01PmwvQqkgb9n8NNyYctdwQ2

echo ""
echo "=========================================="
echo "✓✓✓ Build Complete! ✓✓✓"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Go to: https://github.com/K3ntas/jellyfin-plugin-request/releases/new"
echo "2. Create a new release:"
echo "   - Tag: v1.0.1"
echo "   - Title: Release v1.0.1"
echo "   - Description: (copy below)"
echo ""
echo "---Release Description---"
echo "Release of Jellyfin Request Plugin v1.0.1"
echo ""
echo "**MD5 Checksum:** $CHECKSUM"
echo ""
echo "To install:"
echo "1. Add the plugin repository to Jellyfin"
echo "2. Install from the plugin catalog"
echo "3. Or download the ZIP and extract to your Jellyfin plugins directory"
echo "-------------------------"
echo ""
echo "3. Upload this file as a release asset:"
echo "   File: $(pwd)/release/Jellyfin.Plugin.RequestPlugin.zip"
echo ""
echo "4. Publish the release"
echo ""
echo "5. In Jellyfin:"
echo "   - Go to Dashboard → Plugins → Repositories"
echo "   - Add repository URL: https://raw.githubusercontent.com/K3ntas/jellyfin-plugin-request/main/manifest.json"
echo "   - Go to Catalog and install 'Request Plugin'"
echo "   - Restart Jellyfin"
echo ""
echo "The plugin will now install successfully!"
echo ""
