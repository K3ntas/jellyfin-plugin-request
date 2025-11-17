# Manual Installation Guide

If you're unable to install via the Jellyfin plugin catalog, you can install manually:

## Prerequisites
- .NET 9.0 SDK installed
- Jellyfin server running

## Installation Steps

### 1. Build the Plugin

From the plugin repository directory, run:

```bash
./build.sh
```

This will create `release/Jellyfin.Plugin.RequestPlugin.zip`

### 2. Locate Your Jellyfin Plugins Directory

Find your Jellyfin plugins folder based on your installation:

**Windows:**
```
C:\ProgramData\Jellyfin\Server\plugins\
```

**Linux:**
```
/var/lib/jellyfin/plugins/
```

**Docker:**
```
/config/plugins/
```

**macOS:**
```
~/.local/share/jellyfin/plugins/
```

### 3. Install the Plugin

**Option A: Extract and Copy**
1. Extract `Jellyfin.Plugin.RequestPlugin.zip`
2. Copy the `Jellyfin.Plugin.RequestPlugin` folder to your Jellyfin plugins directory
3. The structure should be:
   ```
   plugins/
   └── Jellyfin.Plugin.RequestPlugin/
       └── Jellyfin.Plugin.RequestPlugin.dll
   ```

**Option B: Manual Copy**
1. Create folder: `plugins/Jellyfin.Plugin.RequestPlugin/`
2. Copy the DLL from `bin/Release/net9.0/Jellyfin.Plugin.RequestPlugin.dll` to this folder

### 4. Restart Jellyfin

Restart your Jellyfin server:

**Windows Service:**
```powershell
Restart-Service Jellyfin
```

**Linux Systemd:**
```bash
sudo systemctl restart jellyfin
```

**Docker:**
```bash
docker restart jellyfin
```

### 5. Verify Installation

1. Go to Jellyfin Dashboard
2. Navigate to **Plugins** → **My Plugins**
3. You should see "Request Plugin" listed
4. The floating request button should appear on all pages

## Usage

**For Users:**
- Click the floating "Request" button on any page
- Fill out the form with the movie/TV show title and description
- Submit the request
- View your requests and their status

**For Admins:**
- Click "Manage Requests" in the request dialog
- View all user requests
- Update request status (Pending → Processing → Complete)
- Delete requests if needed

## Troubleshooting

### Plugin doesn't appear
- Check Jellyfin logs for errors: `Dashboard → Logs`
- Verify the DLL is in the correct location
- Ensure .NET runtime is compatible (net9.0)
- Check file permissions

### Button doesn't appear
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check browser console for JavaScript errors

### API errors
- Verify Jellyfin version is 10.11.0 or higher
- Check that the plugin DLL matches the targetAbi in manifest.json
- Restart Jellyfin after installation

## Uninstallation

1. Delete the plugin folder: `plugins/Jellyfin.Plugin.RequestPlugin/`
2. Restart Jellyfin
3. (Optional) Delete the request data file: `config/data/requestplugin/requests.json`
