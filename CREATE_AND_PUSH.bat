@echo off
cls
echo ============================================================
echo  CREATING JELLYFIN REQUEST PLUGIN REPOSITORY
echo ============================================================
echo.
echo Opening GitHub to create repository...
echo.
start https://github.com/new?name=jellyfin-plugin-request^&description=A+Jellyfin+plugin+for+requesting+movies+and+TV+shows^&visibility=public
echo.
echo ============================================================
echo  INSTRUCTIONS:
echo ============================================================
echo  1. A browser window just opened to GitHub
echo  2. The repository name is already filled: jellyfin-plugin-request
echo  3. Make sure it's set to PUBLIC
echo  4. DO NOT check any boxes (no README, no .gitignore, no license)
echo  5. Click "Create repository"
echo  6. Come back here and press any key to continue...
echo ============================================================
echo.
pause
echo.
echo Pushing code to GitHub...
cd "c:\Users\karol\Desktop\Request"
git push -u origin main
echo.
if errorlevel 1 (
    echo ============================================================
    echo  ERROR: Push failed!
    echo ============================================================
    echo  You may need to authenticate with GitHub.
    echo  Run: git push -u origin main
    echo ============================================================
) else (
    echo ============================================================
    echo  SUCCESS! Code pushed to GitHub!
    echo ============================================================
    echo.
    echo Now creating the release...
    start https://github.com/K3ntas/jellyfin-plugin-request/releases/new?tag=v1.0.0^&title=v1.0.0+-+Initial+Release
    echo.
    echo ============================================================
    echo  RELEASE INSTRUCTIONS:
    echo ============================================================
    echo  1. Upload this file:
    echo     %~dp0bin\Release\net9.0\Jellyfin.Plugin.RequestPlugin.zip
    echo  2. Click "Publish release"
    echo  3. Go back to Jellyfin and refresh the plugin catalog
    echo ============================================================
    echo.
    echo Your repository URL:
    echo https://raw.githubusercontent.com/K3ntas/jellyfin-plugin-request/main/manifest.json
    echo.
)
pause
