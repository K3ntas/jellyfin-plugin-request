# GitHub Setup Guide for Request Plugin

Follow these steps to publish your plugin and make it installable in Jellyfin via a custom repository.

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in
2. Click the **"+"** button in the top-right corner and select **"New repository"**
3. Fill in the details:
   - **Repository name**: `jellyfin-plugin-request`
   - **Description**: `A Jellyfin plugin for requesting movies and TV shows with admin management`
   - **Visibility**: **Public** (required for Jellyfin to access it)
   - **Do NOT** check "Initialize this repository with a README" (we already have one)
4. Click **"Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
cd "c:\Users\karol\Desktop\Request"

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/jellyfin-plugin-request.git

# Rename branch to main
git branch -M main

# Push the code
git push -u origin main
```

## Step 3: Create a GitHub Release

1. Go to your repository on GitHub
2. Click on **"Releases"** in the right sidebar (or go to `https://github.com/YOUR_USERNAME/jellyfin-plugin-request/releases`)
3. Click **"Create a new release"**
4. Fill in the release details:
   - **Tag version**: `v1.0.0`
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**: Copy the changelog from below
5. **Upload the ZIP file**:
   - Click "Attach binaries by dropping them here or selecting them"
   - Upload: `c:\Users\karol\Desktop\Request\bin\Release\net9.0\Jellyfin.Plugin.RequestPlugin.zip`
6. Click **"Publish release"**

### Changelog for Release Description:
```markdown
## Features

- 📝 Floating button on all Jellyfin pages for easy access
- 🎬 Request movies and TV shows with a simple form
- 👥 User-specific view - users see only their own requests
- 👨‍💼 Admin panel - admins see all requests from all users
- 🔄 Status tracking with three states:
  - 🟠 **Pending** - New request submitted
  - 🔵 **Processing** - Admin is working on it
  - 🟢 **Complete** - Request fulfilled
- 🗑️ Admin can delete requests
- 💾 Thread-safe JSON data persistence
- 🎨 Clean, modern UI integrated with Jellyfin's design

## Installation

See the README for installation instructions.
```

## Step 4: Update manifest.json

After creating the release, you need to update the `manifest.json` file with your actual GitHub username:

1. Edit `manifest.json` and replace `YOUR_USERNAME` with your actual GitHub username
2. The line should look like:
   ```json
   "sourceUrl": "https://github.com/YOUR_ACTUAL_USERNAME/jellyfin-plugin-request/releases/download/v1.0.0/Jellyfin.Plugin.RequestPlugin.zip",
   ```
3. Commit and push the updated manifest:
   ```bash
   git add manifest.json
   git commit -m "Update manifest with actual GitHub username"
   git push
   ```

## Step 5: Add to Jellyfin

Now you can add your plugin to Jellyfin using the custom repository:

1. Open Jellyfin Dashboard
2. Go to **Plugins** → **Repositories**
3. Click **"+ Add Repository"**
4. Enter:
   - **Repository Name**: `Request Plugin`
   - **Repository URL**: `https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-request/main/manifest.json`

     ⚠️ **Important**: Replace `YOUR_USERNAME` with your actual GitHub username!
5. Click **"Save"**
6. Go to **Plugins** → **Catalog**
7. Find "Request Plugin" in the list
8. Click **"Install"**
9. Restart Jellyfin

## Your Custom Repository URL

After replacing `YOUR_USERNAME`, your custom repository URL will be:

```
https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-request/main/manifest.json
```

Share this URL with others who want to install your plugin!

## Troubleshooting

### Plugin doesn't appear in catalog
- Make sure the repository is **Public**
- Verify the manifest.json URL is accessible (paste it in your browser)
- Check that you replaced `YOUR_USERNAME` in both the manifest and the repository URL

### Download fails
- Verify the release was published successfully
- Check that the ZIP file was uploaded to the release
- Ensure the checksum matches (it should be: `64d8263aa86c7da6c183f5f3636d8651`)

### Plugin doesn't load
- Check Jellyfin logs at: `C:\ProgramData\Jellyfin\Server\logs\`
- Verify Jellyfin version is 10.11.0 or later
- Make sure .NET 9.0 runtime is installed

## Updating the Plugin

When you make changes and want to release a new version:

1. Update the version in `Jellyfin.Plugin.RequestPlugin.csproj`
2. Rebuild: `dotnet build -c Release`
3. Create new ZIP and calculate checksum
4. Update `manifest.json` with new version entry
5. Create a new GitHub release with the new tag (e.g., `v1.0.1`)
6. Users will see the update in Jellyfin's plugin manager
