# Jellyfin Plugin Development Guide

## Based on Real-World Experience Building the Ratings Plugin

This guide documents the **hardest parts, gotchas, and critical tips** learned from developing a production Jellyfin plugin from scratch.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Critical Backend Patterns](#critical-backend-patterns)
3. [Frontend JavaScript Integration](#frontend-javascript-integration)
4. [The Hardest Parts & Solutions](#the-hardest-parts--solutions)
5. [Request Plugin Implementation Plan](#request-plugin-implementation-plan)
6. [Common Pitfalls & How to Avoid Them](#common-pitfalls--how-to-avoid-them)

---

## Project Structure

### Essential Files

```
YourPlugin/
├── Plugin.cs                          # Main plugin class (REQUIRED)
├── PluginConfiguration.cs             # Configuration model
├── YourPlugin.csproj                  # Project file with dependencies
├── Api/
│   └── YourController.cs             # REST API endpoints
├── Data/
│   └── Repository.cs                 # Data persistence layer
├── Models/
│   └── YourModels.cs                 # Data transfer objects
├── Web/
│   └── yourscript.js                 # Frontend JavaScript (embedded resource)
├── Configuration/
│   └── configPage.html               # Admin settings page (optional)
└── manifest.json                      # Plugin catalog manifest
```

### Critical .csproj Configuration

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <AssemblyName>Jellyfin.Plugin.YourPlugin</AssemblyName>
    <Version>1.0.0.0</Version>
  </PropertyGroup>

  <ItemGroup>
    <!-- CRITICAL: These exact versions must match your Jellyfin version -->
    <PackageReference Include="Jellyfin.Controller" Version="10.11.0" />
    <PackageReference Include="Jellyfin.Model" Version="10.11.0" />
  </ItemGroup>

  <ItemGroup>
    <!-- CRITICAL: Embed JavaScript for auto-injection -->
    <EmbeddedResource Include="Web\**\*.*" />
    <EmbeddedResource Include="Configuration\*.html" />
  </ItemGroup>
</Project>
```

---

## Critical Backend Patterns

### 1. Plugin.cs - Main Entry Point

**HARDEST PART**: Getting Jellyfin to recognize and load your plugin.

```csharp
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.YourPlugin
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        public Plugin(
            IApplicationPaths applicationPaths,
            IXmlSerializer xmlSerializer)
            : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
        }

        public static Plugin? Instance { get; private set; }

        public override string Name => "YourPlugin";
        public override Guid Id => Guid.Parse("YOUR-GUID-HERE-1234-5678");

        // CRITICAL: This makes your JavaScript auto-inject
        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "yourscript",
                    EmbeddedResourcePath = string.Format(
                        "{0}.Web.yourscript.js",
                        GetType().Namespace)
                }
            };
        }
    }
}
```

**KEY TIPS**:
- Generate a **unique GUID** - never reuse from other plugins
- `Instance` property allows accessing plugin from anywhere
- `GetPages()` makes JavaScript auto-inject on **ALL** Jellyfin pages

---

### 2. API Controller - REST Endpoints

**HARDEST PART**: Authentication and getting user context.

```csharp
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;

namespace Jellyfin.Plugin.YourPlugin.Api
{
    [ApiController]
    [Route("YourPlugin")]
    [Authorize] // CRITICAL: Requires authenticated user
    public class YourController : ControllerBase
    {
        private readonly ILogger<YourController> _logger;
        private readonly IUserManager _userManager;
        private readonly IAuthorizationContext _authContext;

        public YourController(
            ILogger<YourController> logger,
            IUserManager userManager,
            IAuthorizationContext authContext)
        {
            _logger = logger;
            _userManager = userManager;
            _authContext = authContext;
        }

        // GET endpoint example
        [HttpGet("Items")]
        public ActionResult<List<YourModel>> GetItems()
        {
            try
            {
                // Get current authenticated user
                var userId = GetUserId();

                // Your logic here
                return Ok(yourData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting items");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST endpoint example
        [HttpPost("Items")]
        public ActionResult CreateItem([FromBody] YourModel model)
        {
            try
            {
                var userId = GetUserId();

                // Validate input
                if (string.IsNullOrWhiteSpace(model.Title))
                {
                    return BadRequest("Title required");
                }

                // Save to repository
                // Return success
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating item");
                return StatusCode(500, "Internal server error");
            }
        }

        // CRITICAL: Get authenticated user ID
        private Guid GetUserId()
        {
            var authInfo = _authContext.GetAuthorizationInfo(Request).Result;
            var user = _userManager.GetUserById(Guid.Parse(authInfo.UserId));
            return user.Id;
        }

        // Check if user is admin
        private bool IsAdmin()
        {
            var userId = GetUserId();
            var user = _userManager.GetUserById(userId);
            return user.HasPermission(MediaBrowser.Model.Users.PermissionKind.IsAdministrator);
        }
    }
}
```

**KEY TIPS**:
- `[Authorize]` attribute is **CRITICAL** for authentication
- Use `IAuthorizationContext` to get current user
- Always wrap in try-catch and return proper status codes
- Use `IUserManager` to check admin permissions

---

### 3. Data Repository - Persistence

**HARDEST PART**: Thread-safe file operations and data integrity.

```csharp
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;

namespace Jellyfin.Plugin.YourPlugin.Data
{
    public class YourRepository
    {
        private readonly ILogger<YourRepository> _logger;
        private readonly string _dataPath;
        private readonly SemaphoreSlim _saveLock = new SemaphoreSlim(1, 1);

        public YourRepository(ILogger<YourRepository> logger, string dataPath)
        {
            _logger = logger;
            _dataPath = dataPath;

            // Ensure directory exists
            var directory = Path.GetDirectoryName(_dataPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            LoadData();
        }

        private Dictionary<string, YourModel> _data = new();

        // CRITICAL: Thread-safe loading
        private void LoadData()
        {
            try
            {
                if (File.Exists(_dataPath))
                {
                    var json = File.ReadAllText(_dataPath);
                    _data = JsonSerializer.Deserialize<Dictionary<string, YourModel>>(json)
                        ?? new Dictionary<string, YourModel>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data from {Path}", _dataPath);
                _data = new Dictionary<string, YourModel>();
            }
        }

        // CRITICAL: Thread-safe saving with lock
        public async Task SaveDataAsync()
        {
            await _saveLock.WaitAsync();
            try
            {
                var json = JsonSerializer.Serialize(_data, new JsonSerializerOptions
                {
                    WriteIndented = true
                });
                await File.WriteAllTextAsync(_dataPath, json);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving data to {Path}", _dataPath);
            }
            finally
            {
                _saveLock.Release();
            }
        }

        public void AddItem(string id, YourModel item)
        {
            _data[id] = item;
            _ = SaveDataAsync(); // Fire and forget
        }

        public List<YourModel> GetAllItems()
        {
            return _data.Values.ToList();
        }

        public YourModel? GetItem(string id)
        {
            return _data.TryGetValue(id, out var item) ? item : null;
        }

        public void DeleteItem(string id)
        {
            _data.Remove(id);
            _ = SaveDataAsync();
        }
    }
}
```

**KEY TIPS**:
- **Always use `SemaphoreSlim`** for thread-safe file operations
- Store data in `Plugin.ApplicationPaths.PluginConfigurationsPath`
- Use JSON for simple data, SQLite for complex queries
- Handle file corruption gracefully

---

## Frontend JavaScript Integration

### The HARDEST Part: SPA Navigation Detection

**CRITICAL ISSUE**: Jellyfin is a Single Page Application (SPA) using hash-based routing. Normal page load events **DON'T WORK**.

### Solution: Multi-Method Detection

```javascript
(function () {
    'use strict';

    const YourPlugin = {
        init: function () {
            this.injectStyles();
            this.observePageChanges();
        },

        /**
         * CRITICAL: SPA Navigation Detection
         * Jellyfin uses hash routing - must detect URL changes manually
         */
        observePageChanges: function () {
            const self = this;
            let lastUrl = location.href;

            // Method 1: Polling (MOST RELIABLE)
            setInterval(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    self.onPageChange();
                }
            }, 500);

            // Method 2: Hash change events
            window.addEventListener('hashchange', () => {
                self.onPageChange();
            });

            // Method 3: Popstate (back/forward)
            window.addEventListener('popstate', () => {
                self.onPageChange();
            });

            // Initial check
            this.onPageChange();
        },

        onPageChange: function () {
            // Check if we're on the right page
            if (this.isTargetPage()) {
                this.injectUI();
            } else {
                this.removeUI(); // Clean up if navigating away
            }
        },

        isTargetPage: function () {
            // Example: Check if on home page
            return location.href.includes('#/home') ||
                   location.href.includes('#!/home');
        },

        /**
         * CRITICAL: Wait for Jellyfin elements before injecting
         */
        injectUI: function () {
            const self = this;
            let attempts = 0;
            const maxAttempts = 100;

            const checkInterval = setInterval(() => {
                attempts++;

                // Check if target element exists
                const targetElement = document.querySelector('.headerButtons');

                if (targetElement) {
                    clearInterval(checkInterval);
                    self.createFloatingButton(targetElement);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                }
            }, 100); // Check every 100ms
        },

        removeUI: function () {
            const existing = document.getElementById('yourPluginUI');
            if (existing) {
                existing.remove();
            }
        }
    };

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => YourPlugin.init());
    } else {
        YourPlugin.init();
    }

    // Also try after delay for Jellyfin load
    setTimeout(() => YourPlugin.init(), 2000);

    window.YourPlugin = YourPlugin;
})();
```

**KEY TIPS**:
- **Polling every 500ms is the MOST RELIABLE method** for SPA detection
- Always check if target elements exist before injecting
- Clean up old UI elements when navigating away
- Use multiple detection methods as fallbacks

---

### Authentication in JavaScript

```javascript
// Get access token for API calls
const accessToken = ApiClient.accessToken();
const baseUrl = ApiClient.serverAddress();

// Make authenticated API request
fetch(`${baseUrl}/YourPlugin/Items`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': buildAuthHeader(accessToken)
    }
})
.then(response => response.json())
.then(data => {
    console.log('Success:', data);
})
.catch(error => {
    console.error('Error:', error);
});

// Build Jellyfin auth header
function buildAuthHeader(token) {
    let deviceId = localStorage.getItem('_deviceId2');
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('_deviceId2', deviceId);
    }

    return `MediaBrowser Client="Jellyfin Web", Device="Browser", ` +
           `DeviceId="${deviceId}", Version="10.11.0", Token="${token}"`;
}

function generateDeviceId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

---

## The Hardest Parts & Solutions

### 1. **Plugin Not Loading**

**Problem**: Jellyfin doesn't recognize your plugin.

**Solutions**:
- ✅ Ensure GUID is unique
- ✅ Check `TargetFramework` matches (net9.0 for Jellyfin 10.11+)
- ✅ Verify package versions match Jellyfin version
- ✅ Build in Release mode
- ✅ Restart Jellyfin after installing plugin

### 2. **JavaScript Not Injecting**

**Problem**: Your script doesn't load on pages.

**Solutions**:
- ✅ `GetPages()` must return `PluginPageInfo` with correct embedded resource path
- ✅ Use `{Namespace}.Web.filename.js` format
- ✅ Mark as `<EmbeddedResource>` in .csproj
- ✅ Check browser console for 404 errors

### 3. **SPA Navigation Breaks Plugin**

**Problem**: Plugin works on first load, breaks on navigation.

**Solutions**:
- ✅ Use **polling every 500ms** to detect URL changes
- ✅ Add hashchange and popstate listeners
- ✅ Remove old UI before injecting new
- ✅ Check for element existence before injecting

### 4. **API Authentication Fails**

**Problem**: API returns 401 Unauthorized.

**Solutions**:
- ✅ Add `[Authorize]` attribute to controller
- ✅ Use proper `X-Emby-Authorization` header format
- ✅ Include access token from `ApiClient.accessToken()`
- ✅ Use `credentials: 'include'` in fetch

### 5. **Data Loss / Corruption**

**Problem**: Plugin data gets corrupted or lost.

**Solutions**:
- ✅ Use `SemaphoreSlim` for thread-safe file writes
- ✅ Handle JSON deserialization errors gracefully
- ✅ Create backups before writing
- ✅ Validate data before saving

### 6. **Plugin Crashes Jellyfin**

**Problem**: Unhandled exceptions crash the server.

**Solutions**:
- ✅ Wrap all code in try-catch blocks
- ✅ Return proper HTTP status codes (400, 500, etc.)
- ✅ Log errors instead of throwing
- ✅ Validate all user input

---

## Request Plugin Implementation Plan

### Plugin Overview

**Name**: Request Plugin
**Purpose**: Allow users to request movies/shows, admins manage requests with status updates

### Features

1. **Floating Button** (top-right corner, all pages)
2. **Request Form** (popup with title input)
3. **Request Table** (shows existing requests with status)
4. **Admin Panel** (change request status: Pending → Processing → Done)
5. **Real-time Updates** (all users see status changes)

### Data Model

```csharp
public class MediaRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string RequestedBy { get; set; } = string.Empty; // User ID
    public string RequestedByName { get; set; } = string.Empty; // Username
    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public string? AdminNotes { get; set; }
}

public enum RequestStatus
{
    Pending,
    Processing,
    Done
}
```

### API Endpoints

```csharp
// GET /Requests/All - Get all requests (admin sees all, users see their own)
[HttpGet("All")]
public ActionResult<List<MediaRequest>> GetAllRequests()

// POST /Requests/Create - Create new request
[HttpPost("Create")]
public ActionResult CreateRequest([FromBody] CreateRequestDto dto)

// PUT /Requests/{id}/Status - Update status (admin only)
[HttpPut("{id}/Status")]
public ActionResult UpdateStatus(string id, [FromQuery] RequestStatus status)

// DELETE /Requests/{id} - Delete request (admin only)
[HttpDelete("{id}")]
public ActionResult DeleteRequest(string id)
```

### Frontend Structure

```javascript
const RequestPlugin = {
    currentUser: null,
    isAdmin: false,

    init: function() {
        this.getCurrentUser();
        this.observePageChanges();
    },

    getCurrentUser: function() {
        // Get from ApiClient
        this.currentUser = ApiClient.getCurrentUser();
        this.isAdmin = this.currentUser.Policy.IsAdministrator;
    },

    createFloatingButton: function() {
        // Create floating button in top-right
        const button = document.createElement('button');
        button.className = 'request-plugin-float-btn';
        button.innerHTML = '📝 Request';
        button.onclick = () => this.openRequestModal();

        // Position: top-right corner
        document.body.appendChild(button);
    },

    openRequestModal: function() {
        // Show modal with:
        // 1. Input field for title
        // 2. Table of existing requests
        // 3. Admin controls (if admin)
    },

    submitRequest: function(title) {
        fetch(`${ApiClient.serverAddress()}/Requests/Create`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ title: title })
        })
        .then(response => response.json())
        .then(() => {
            this.loadRequests(); // Refresh table
            this.showToast('Request submitted!');
        });
    },

    loadRequests: function() {
        fetch(`${ApiClient.serverAddress()}/Requests/All`, {
            method: 'GET',
            headers: this.getHeaders()
        })
        .then(response => response.json())
        .then(requests => {
            this.renderRequestTable(requests);
        });
    },

    updateStatus: function(requestId, newStatus) {
        // Admin only
        fetch(`${ApiClient.serverAddress()}/Requests/${requestId}/Status?status=${newStatus}`, {
            method: 'PUT',
            headers: this.getHeaders()
        })
        .then(() => {
            this.loadRequests(); // Refresh
            this.showToast('Status updated!');
        });
    },

    renderRequestTable: function(requests) {
        // Build HTML table
        // Show different columns for admin vs user
        // Admin: can change status dropdown
        // User: read-only view
    }
};
```

### CSS Styling

```css
/* Floating button - top right corner */
.request-plugin-float-btn {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10000;
    background: #00a4dc;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 12px 24px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

.request-plugin-float-btn:hover {
    background: #0088bb;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* Modal overlay */
.request-plugin-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Modal content */
.request-plugin-modal-content {
    background: #1c1c1c;
    border-radius: 8px;
    padding: 24px;
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

/* Request table */
.request-plugin-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.request-plugin-table th,
.request-plugin-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #333;
}

.request-plugin-table th {
    background: #2a2a2a;
    font-weight: 600;
}

/* Status badges */
.status-pending {
    background: #f59e0b;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.85em;
}

.status-processing {
    background: #3b82f6;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.85em;
}

.status-done {
    background: #10b981;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.85em;
}
```

---

## Common Pitfalls & How to Avoid Them

### 1. **Wrong Package Versions**
❌ **Pitfall**: Using Jellyfin.Controller 10.9.0 with Jellyfin 10.11.0
✅ **Solution**: Always match package versions to your Jellyfin version

### 2. **Forgetting EmbeddedResource**
❌ **Pitfall**: JavaScript file not marked as embedded resource
✅ **Solution**: Add to .csproj: `<EmbeddedResource Include="Web\**\*.*" />`

### 3. **Not Handling SPA Navigation**
❌ **Pitfall**: Plugin only works on first page load
✅ **Solution**: Use polling + event listeners for navigation detection

### 4. **Missing Authentication**
❌ **Pitfall**: API calls return 401
✅ **Solution**: Add `[Authorize]` attribute and proper headers

### 5. **File Locking Issues**
❌ **Pitfall**: Data corruption from concurrent writes
✅ **Solution**: Use `SemaphoreSlim` for thread-safe operations

### 6. **Not Cleaning Up UI**
❌ **Pitfall**: Multiple UI elements stacking up
✅ **Solution**: Remove old elements before injecting new ones

### 7. **Assuming DOM Elements Exist**
❌ **Pitfall**: JavaScript errors when elements not found
✅ **Solution**: Always check element existence before manipulation

### 8. **Hardcoding URLs**
❌ **Pitfall**: URLs break when Jellyfin runs on different ports/domains
✅ **Solution**: Use `ApiClient.serverAddress()` for base URL

---

## Building and Testing

### Build Commands

```bash
# Clean build
dotnet clean
dotnet build -c Release

# Create release ZIP
Compress-Archive -Path bin\Release\net9.0\YourPlugin.dll -DestinationPath YourPlugin.zip
```

### Installation

1. Copy DLL to Jellyfin plugins folder:
   - Windows: `C:\ProgramData\Jellyfin\Server\plugins\YourPlugin\`
   - Linux: `/var/lib/jellyfin/plugins/YourPlugin/`

2. Restart Jellyfin

3. Check Dashboard → Plugins to verify

### Testing Checklist

- ✅ Plugin appears in Dashboard → Plugins
- ✅ JavaScript loads on all pages (check browser console)
- ✅ UI appears on target pages
- ✅ API endpoints return correct data
- ✅ Authentication works
- ✅ Data persists after server restart
- ✅ Navigation between pages works
- ✅ Admin vs user permissions work correctly

---

## Publishing to Plugin Catalog

### Create manifest.json

```json
[
  {
    "guid": "your-unique-guid",
    "name": "YourPlugin",
    "description": "Short description",
    "overview": "Longer overview",
    "owner": "YourName",
    "category": "General",
    "imageUrl": "https://your-repo/logo.png",
    "versions": [
      {
        "version": "1.0.0.0",
        "changelog": "Initial release",
        "targetAbi": "10.11.0.0",
        "sourceUrl": "https://github.com/you/plugin/releases/download/v1.0.0/plugin.zip",
        "checksum": "md5-hash-here",
        "timestamp": "2025-01-01T00:00:00Z"
      }
    ]
  }
]
```

### Generate Checksum

```bash
certutil -hashfile YourPlugin.zip MD5
```

---

## Additional Resources

- **Jellyfin Plugin API**: https://github.com/jellyfin/jellyfin-plugin-template
- **Jellyfin Web Client**: https://github.com/jellyfin/jellyfin-web
- **This Guide**: Based on building the Ratings plugin (v1.0.0 → v1.0.55.0)

---

## Final Tips

1. **Start Simple**: Build the backend API first, then add frontend
2. **Test Frequently**: Test after every feature addition
3. **Log Everything**: Use `ILogger` extensively for debugging
4. **Handle Errors**: Wrap everything in try-catch
5. **Be Patient**: SPA navigation is tricky - use polling
6. **Read Console**: Browser console shows JavaScript errors
7. **Version Control**: Use git from day one
8. **Document**: Write comments explaining WHY, not WHAT

---

**Good luck building your Request plugin!** 🚀

This guide contains everything I learned the hard way. Follow these patterns and you'll save yourself weeks of debugging.
