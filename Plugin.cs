using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using System;
using System.Collections.Generic;

namespace Jellyfin.Plugin.RequestPlugin
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

        public override string Name => "Request Plugin";

        public override Guid Id => Guid.Parse("a1b2c3d4-5678-90ab-cdef-123456789abc");

        public override string Description => "Allow users to request movies/shows with admin management";

        // CRITICAL: This makes your JavaScript auto-inject
        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "requestplugin",
                    EmbeddedResourcePath = string.Format(
                        "{0}.Web.requestplugin.js",
                        GetType().Namespace)
                }
            };
        }
    }
}
