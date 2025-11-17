# Quick Start - Publish Your Plugin

## 🚀 Fast Track to Publishing

### 1️⃣ Create GitHub Repo
```bash
# Go to github.com and create new public repository named: jellyfin-plugin-request
```

### 2️⃣ Push Code
```bash
cd "c:\Users\karol\Desktop\Request"
git remote add origin https://github.com/YOUR_USERNAME/jellyfin-plugin-request.git
git branch -M main
git push -u origin main
```

### 3️⃣ Create Release
1. Go to: `https://github.com/YOUR_USERNAME/jellyfin-plugin-request/releases`
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Upload file: `bin\Release\net9.0\Jellyfin.Plugin.RequestPlugin.zip`
5. Click "Publish release"

### 4️⃣ Update manifest.json
```bash
# Edit manifest.json and replace YOUR_USERNAME with your GitHub username
# Then commit and push:
git add manifest.json
git commit -m "Update manifest with username"
git push
```

### 5️⃣ Add to Jellyfin
In Jellyfin Dashboard → Plugins → Repositories → Add:

**Repository URL:**
```
https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-request/main/manifest.json
```

Then install from Catalog!

---

## 📦 Files Ready for Release

- **DLL**: `bin\Release\net9.0\Jellyfin.Plugin.RequestPlugin.dll`
- **ZIP**: `bin\Release\net9.0\Jellyfin.Plugin.RequestPlugin.zip`
- **Checksum (MD5)**: `64d8263aa86c7da6c183f5f3636d8651`

---

## 📋 Your Custom Repository URL Template

After replacing YOUR_USERNAME:
```
https://raw.githubusercontent.com/YOUR_USERNAME/jellyfin-plugin-request/main/manifest.json
```

Example for user "john123":
```
https://raw.githubusercontent.com/john123/jellyfin-plugin-request/main/manifest.json
```

---

Need detailed instructions? See [SETUP_GITHUB.md](SETUP_GITHUB.md)
