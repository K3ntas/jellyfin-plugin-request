using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.RequestPlugin
{
    public class JavaScriptInjectionService : IHostedService
    {
        private readonly ILogger<JavaScriptInjectionService> _logger;
        private readonly IApplicationPaths _appPaths;

        public JavaScriptInjectionService(ILogger<JavaScriptInjectionService> logger, IApplicationPaths appPaths)
        {
            _logger = logger;
            _appPaths = appPaths;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                try
                {
                    _logger.LogInformation("Request plugin JavaScript injection service started");

                    // Add a small delay to ensure web files are loaded
                    Thread.Sleep(2000);

                    CleanupOldInjection();
                    InjectRequestScript();
                    _logger.LogInformation("Request plugin JavaScript injection completed");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Request plugin injection failed");
                }
            }, cancellationToken);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Request plugin JavaScript injection service stopped");
            return Task.CompletedTask;
        }

        private void CleanupOldInjection()
        {
            var indexPath = Path.Combine(_appPaths.WebPath, "index.html");
            if (!File.Exists(indexPath))
            {
                _logger.LogWarning("index.html not found at: {Path}", indexPath);
                return;
            }

            try
            {
                var content = File.ReadAllText(indexPath);
                var startComment = Regex.Escape("<!-- BEGIN Request Plugin -->");
                var endComment = Regex.Escape("<!-- END Request Plugin -->");

                var cleanupRegex = new Regex($"{startComment}[\\s\\S]*?{endComment}\\s*", RegexOptions.Multiline);

                if (cleanupRegex.IsMatch(content))
                {
                    content = cleanupRegex.Replace(content, string.Empty);
                    File.WriteAllText(indexPath, content);
                    _logger.LogInformation("Removed old Request plugin injection from index.html");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup old injection from index.html");
            }
        }

        private void InjectRequestScript()
        {
            var indexPath = Path.Combine(_appPaths.WebPath, "index.html");
            if (!File.Exists(indexPath))
            {
                _logger.LogError("index.html not found at: {Path}", indexPath);
                return;
            }

            try
            {
                var content = File.ReadAllText(indexPath);

                // Check if already injected
                if (content.Contains("<!-- BEGIN Request Plugin -->", StringComparison.Ordinal))
                {
                    _logger.LogInformation("Request plugin script already injected");
                    return;
                }

                var startComment = "<!-- BEGIN Request Plugin -->";
                var endComment = "<!-- END Request Plugin -->";
                var scriptTag = "<script defer src=\"/Request/requestplugin\"></script>";

                var injectionBlock = $"{startComment}\n{scriptTag}\n{endComment}\n";

                if (content.Contains("</body>", StringComparison.Ordinal))
                {
                    content = content.Replace("</body>", $"{injectionBlock}</body>", StringComparison.Ordinal);
                    File.WriteAllText(indexPath, content);
                    _logger.LogInformation("Successfully injected Request plugin script into index.html");
                }
                else
                {
                    _logger.LogError("Could not find </body> tag in index.html");
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Permission denied when trying to modify index.html");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to inject script into index.html");
            }
        }
    }
}
