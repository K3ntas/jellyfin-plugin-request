#!/bin/bash

# Jellyfin Request Plugin Build Script

set -e

echo "Building Jellyfin Request Plugin..."

# Clean previous builds
rm -rf bin/ obj/ release/

# Restore dependencies
echo "Restoring dependencies..."
dotnet restore

# Build in Release mode
echo "Building project..."
dotnet build -c Release

# Create release directory structure
echo "Creating release structure..."
mkdir -p release/Jellyfin.Plugin.RequestPlugin

# Copy built files
cp bin/Release/net9.0/Jellyfin.Plugin.RequestPlugin.dll release/Jellyfin.Plugin.RequestPlugin/
if [ -f bin/Release/net9.0/Jellyfin.Plugin.RequestPlugin.pdb ]; then
    cp bin/Release/net9.0/Jellyfin.Plugin.RequestPlugin.pdb release/Jellyfin.Plugin.RequestPlugin/
fi

# Create ZIP file
echo "Creating ZIP archive..."
cd release
zip -r Jellyfin.Plugin.RequestPlugin.zip Jellyfin.Plugin.RequestPlugin/
cd ..

# Calculate checksum
echo "Calculating MD5 checksum..."
CHECKSUM=$(md5sum release/Jellyfin.Plugin.RequestPlugin.zip | awk '{print $1}')

echo ""
echo "=========================="
echo "Build Complete!"
echo "=========================="
echo "ZIP file: release/Jellyfin.Plugin.RequestPlugin.zip"
echo "MD5 Checksum: $CHECKSUM"
echo ""
echo "Update manifest.json with this checksum before creating a release."
echo ""
