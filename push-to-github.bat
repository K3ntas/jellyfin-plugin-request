@echo off
echo ========================================
echo GitHub Setup for Request Plugin
echo ========================================
echo.
echo Step 1: Create GitHub Repository
echo ---------------------------------
echo 1. Go to: https://github.com/new
echo 2. Repository name: jellyfin-plugin-request
echo 3. Description: A Jellyfin plugin for requesting movies and TV shows
echo 4. Make it PUBLIC
echo 5. Do NOT initialize with README
echo 6. Click "Create repository"
echo.
pause
echo.
echo Step 2: Pushing code to GitHub...
echo ---------------------------------

git remote add origin https://github.com/K3ntas/jellyfin-plugin-request.git
git branch -M main
git push -u origin main

echo.
echo ========================================
echo Success! Your plugin is now on GitHub!
echo ========================================
echo.
echo Your custom repository URL is:
echo https://raw.githubusercontent.com/K3ntas/jellyfin-plugin-request/main/manifest.json
echo.
echo Add this URL to Jellyfin:
echo Dashboard -^> Plugins -^> Repositories -^> Add Repository
echo.
pause
