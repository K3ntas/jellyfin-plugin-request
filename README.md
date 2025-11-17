# Jellyfin Request Plugin

A Jellyfin plugin that allows users to request movies and TV shows, with admin management capabilities.

## Features

- **Floating Button**: Always-visible request button on all Jellyfin pages
- **User Requests**: Users can submit requests for movies or TV shows
- **Request Management**: View all submitted requests in a clean table interface
- **Admin Controls**: Admins can manage request statuses (Pending → Processing → Complete)
- **Real-time Updates**: Status changes are visible to all users
- **User-specific Views**: Regular users see only their own requests, admins see all requests

## Installation

1. Download the latest release DLL from the [Releases](https://github.com/yourusername/jellyfin-plugin-request/releases) page
2. Copy the DLL to your Jellyfin plugins directory:
   - **Windows**: `C:\ProgramData\Jellyfin\Server\plugins\RequestPlugin\`
   - **Linux**: `/var/lib/jellyfin/plugins/RequestPlugin/`
   - **Docker**: `/config/plugins/RequestPlugin/`
3. Restart Jellyfin
4. The plugin should appear in Dashboard → Plugins

## Usage

### For Users

1. Click the "📝 Request" button in the top-right corner of any page
2. Enter the name of the movie or TV show you'd like to request
3. Click "Submit Request"
4. View the status of your requests in the table below

### For Admins

1. Click the "📝 Request" button to see all user requests
2. Change request statuses using the dropdown:
   - **Pending**: New request (default)
   - **Processing**: Currently working on it
   - **Complete**: Request fulfilled
3. Delete requests using the "Delete" button

## Request Statuses

- **Pending** (Orange): Request submitted, waiting for admin action
- **Processing** (Blue): Admin is working on the request
- **Complete** (Green): Request has been fulfilled

## Building from Source

### Prerequisites

- .NET 9.0 SDK
- Jellyfin 10.11.0 or later

### Build Steps

```bash
# Clean and build
dotnet clean
dotnet build -c Release

# The DLL will be in: bin/Release/net9.0/Jellyfin.Plugin.RequestPlugin.dll
```

## Development

This plugin follows the standard Jellyfin plugin architecture:

- **Backend**: ASP.NET Core API with authentication
- **Frontend**: Vanilla JavaScript injected into Jellyfin Web UI
- **Data Storage**: JSON file-based persistence with thread-safe operations

## File Structure

```
RequestPlugin/
├── Api/
│   └── RequestController.cs       # REST API endpoints
├── Data/
│   └── RequestRepository.cs       # Data persistence layer
├── Models/
│   └── MediaRequest.cs            # Data models
├── Web/
│   └── requestplugin.js           # Frontend JavaScript
├── Plugin.cs                      # Main plugin class
├── PluginConfiguration.cs         # Configuration model
└── Jellyfin.Plugin.RequestPlugin.csproj
```

## API Endpoints

- `GET /Requests/All` - Get all requests (filtered by user role)
- `POST /Requests/Create` - Create a new request
- `PUT /Requests/{id}/Status` - Update request status (admin only)
- `DELETE /Requests/{id}` - Delete a request (admin only)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues, please [open an issue](https://github.com/yourusername/jellyfin-plugin-request/issues) on GitHub.
