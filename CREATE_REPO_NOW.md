# CREATE GITHUB REPO NOW - 2 MINUTES!

## Step 1: Create Repository (30 seconds)

Click this link: **https://github.com/new**

Fill in:
- **Repository name**: `jellyfin-plugin-request`
- **Description**: `A Jellyfin plugin for requesting movies and TV shows`
- **Public** (must be public!)
- **DO NOT** check "Add a README file"
- **DO NOT** check "Add .gitignore"
- **DO NOT** check "Choose a license"

Click **"Create repository"**

## Step 2: Push Code (30 seconds)

After creating the repo, run this command:

```bash
cd "c:\Users\karol\Desktop\Request"
git push -u origin main
```

Or just double-click: `push-to-github.bat`

## Step 3: Create Release (1 minute)

1. Go to: **https://github.com/K3ntas/jellyfin-plugin-request/releases/new**
2. Click "Choose a tag" and type: `v1.0.0` (then click "Create new tag")
3. Release title: `v1.0.0 - Initial Release`
4. Click "Attach binaries" and upload:
   - `C:\Users\karol\Desktop\Request\bin\Release\net9.0\Jellyfin.Plugin.RequestPlugin.zip`
5. Click **"Publish release"**

## Step 4: Add to Jellyfin (30 seconds)

1. Open Jellyfin Dashboard
2. Go to **Plugins** → **Repositories**
3. Click **+ Add Repository**
4. Paste this URL:
   ```
   https://raw.githubusercontent.com/K3ntas/jellyfin-plugin-request/main/manifest.json
   ```
5. Name: `Request Plugin Repository`
6. Click **Save**
7. Go to **Plugins** → **Catalog**
8. Install "Request Plugin"
9. Restart Jellyfin

---

## Your Repository URL:
```
https://raw.githubusercontent.com/K3ntas/jellyfin-plugin-request/main/manifest.json
```

This is the link you add to Jellyfin!
