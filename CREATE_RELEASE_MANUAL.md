# Manual Release Creation Guide

Since the automated workflow isn't working yet, follow these steps to create the release manually:

## Step 1: Build the Plugin Locally

You need .NET 9.0 SDK installed. Then run:

```bash
./build.sh
```

This creates `release/Jellyfin.Plugin.RequestPlugin.zip` and shows you the MD5 checksum.

## Step 2: Create the Release on GitHub

1. Go to: https://github.com/K3ntas/jellyfin-plugin-request/releases/new
2. Fill in the form:
   - **Tag version:** `v1.0.1`
   - **Target:** Select `claude/fix-jellyfin-plugin-install-01PmwvQqkgb9n8NNyYctdwQ2` (or main if merged)
   - **Release title:** `Release v1.0.1`
   - **Description:**
     ```
     Release of Jellyfin Request Plugin v1.0.1

     **MD5 Checksum:** [paste checksum from build.sh output here]

     To install:
     1. Add the plugin repository to Jellyfin
     2. Install from the plugin catalog
     3. Or download the ZIP and extract to your Jellyfin plugins directory
     ```
3. Drag and drop `release/Jellyfin.Plugin.RequestPlugin.zip` into the assets section
4. Click **Publish release**

## Step 3: Update manifest.json

After creating the release:

1. Copy the MD5 checksum from step 1
2. Edit `manifest.json` and replace `PLACEHOLDER_UPDATE_AFTER_BUILD` with the actual checksum
3. Commit and push:
   ```bash
   git add manifest.json
   git commit -m "Update manifest with v1.0.1 checksum"
   git push
   ```

## Step 4: Test Installation

1. In Jellyfin, go to **Dashboard → Plugins → Repositories**
2. Add your repository:
   - **Repository Name:** Jellyfin Request Plugin
   - **Repository URL:** `https://raw.githubusercontent.com/K3ntas/jellyfin-plugin-request/main/manifest.json`

     (Or use the raw URL from your branch)

3. Go to **Dashboard → Plugins → Catalog**
4. Find "Request Plugin" and click **Install**
5. Restart Jellyfin

## Alternative: If You Don't Have .NET SDK

If you don't have .NET 9.0 SDK installed:

### Option A: Let GitHub Build It

1. Go to: https://github.com/K3ntas/jellyfin-plugin-request/actions
2. Click on "Build and Release Plugin"
3. Click "Run workflow" button (if available)
4. Wait for it to complete
5. It will automatically create the v1.0.1 release

### Option B: Use GitHub Codespaces

1. Go to your repository on GitHub
2. Click the green "Code" button
3. Select "Codespaces" tab
4. Create a codespace
5. In the terminal, run:
   ```bash
   ./build.sh
   ```
6. Download the ZIP file and follow Step 2 above

## Troubleshooting

**GitHub Actions not running:**
- Check if Actions are enabled: Go to Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected

**Can't push tags:**
- Create the tag through the GitHub web interface when creating the release (Step 2)

**Checksum mismatch:**
- Make sure you copied the exact checksum from the build output
- The checksum must match the ZIP file you uploaded

**Plugin won't install:**
- Verify the ZIP file is accessible: https://github.com/K3ntas/jellyfin-plugin-request/releases/download/v1.0.1/Jellyfin.Plugin.RequestPlugin.zip
- Check Jellyfin logs for specific errors
- Ensure Jellyfin version is 10.11.0 or higher
