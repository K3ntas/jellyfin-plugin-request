# Release Instructions for Jellyfin Request Plugin

## Problem
The plugin installation is failing because the GitHub release doesn't have the built plugin ZIP file. The manifest.json points to a release that either doesn't exist or is incomplete.

## Solution Steps

### 1. Merge the Build Workflow

First, merge the feature branch into main to get the GitHub Actions workflow:

```bash
git checkout main
git merge claude/fix-jellyfin-plugin-install-01PmwvQqkgb9n8NNyYctdwQ2
git push origin main
```

### 2. Delete and Recreate the v1.0.0 Tag

The existing v1.0.0 tag points to a commit before the build workflow was added. Delete and recreate it:

```bash
# Delete the old tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Create new tag on the latest commit (which has the workflow)
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial release"
git push origin v1.0.0
```

This will trigger the GitHub Actions workflow which will:
- Build the plugin DLL
- Create a ZIP file with the correct structure
- Calculate the MD5 checksum
- Create a GitHub release
- Upload the ZIP file to the release

### 3. Update the Manifest Checksum

After the workflow completes:

1. Go to the GitHub release page: https://github.com/K3ntas/jellyfin-plugin-request/releases/tag/v1.0.0
2. Copy the MD5 checksum from the release notes
3. Update `manifest.json` with the correct checksum:

```json
"checksum": "paste-checksum-here"
```

4. Commit and push the manifest update

### 4. Test the Installation

In Jellyfin:
1. Go to Dashboard → Plugins → Repositories
2. Add your repository (the URL to your manifest.json)
3. Go to Catalog and try to install the Request Plugin

## Alternative: Manual Installation

If you want users to install manually without the plugin catalog:

1. Run the build script:
```bash
./build.sh
```

2. Provide users with these instructions:

```
Manual Installation:
1. Download Jellyfin.Plugin.RequestPlugin.zip from the releases page
2. Extract the ZIP file
3. Copy the Jellyfin.Plugin.RequestPlugin folder to your Jellyfin plugins directory:
   - Windows: C:\ProgramData\Jellyfin\Server\plugins
   - Linux: /var/lib/jellyfin/plugins
   - Docker: /config/plugins
4. Restart Jellyfin
```

## Quick Fix (Automated)

If you have the necessary permissions, run this script:

```bash
#!/bin/bash
# Quick fix script

# Merge to main
git checkout main
git merge claude/fix-jellyfin-plugin-install-01PmwvQqkgb9n8NNyYctdwQ2
git push origin main

# Delete and recreate tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

echo "Done! Check GitHub Actions for the build status."
echo "Once complete, update the checksum in manifest.json"
```

## Troubleshooting

### Build fails in GitHub Actions
- Check that you have enabled GitHub Actions in your repository settings
- Verify the .NET SDK version matches your project requirements

### 403 Error when pushing
- Make sure you have write permissions to the repository
- Check if branch protection rules are blocking the push

### Plugin still won't install
- Verify the manifest.json checksum matches the ZIP file
- Check Jellyfin logs for specific error messages
- Ensure the targetAbi version matches your Jellyfin version
