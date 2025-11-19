using Jellyfin.Plugin.RequestPlugin.Data;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.RequestPlugin
{
    public class PluginServiceRegistrator : IPluginServiceRegistrator
    {
        public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
        {
            // Register RequestRepository as a singleton
            serviceCollection.AddSingleton<RequestRepository>();

            // Register hosted service for JavaScript injection
            serviceCollection.AddHostedService<JavaScriptInjectionService>();
        }
    }
}
