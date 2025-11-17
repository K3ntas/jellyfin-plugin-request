using Jellyfin.Plugin.RequestPlugin.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Jellyfin.Plugin.RequestPlugin.Data
{
    public class RequestRepository
    {
        private readonly ILogger<RequestRepository> _logger;
        private readonly string _dataPath;
        private readonly SemaphoreSlim _saveLock = new SemaphoreSlim(1, 1);

        public RequestRepository(ILogger<RequestRepository> logger, string dataPath)
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

        private Dictionary<string, MediaRequest> _data = new();

        // CRITICAL: Thread-safe loading
        private void LoadData()
        {
            try
            {
                if (File.Exists(_dataPath))
                {
                    var json = File.ReadAllText(_dataPath);
                    _data = JsonSerializer.Deserialize<Dictionary<string, MediaRequest>>(json)
                        ?? new Dictionary<string, MediaRequest>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading data from {Path}", _dataPath);
                _data = new Dictionary<string, MediaRequest>();
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

        public void AddRequest(MediaRequest request)
        {
            _data[request.Id] = request;
            _ = SaveDataAsync(); // Fire and forget
        }

        public List<MediaRequest> GetAllRequests()
        {
            return _data.Values.OrderByDescending(r => r.RequestedDate).ToList();
        }

        public List<MediaRequest> GetRequestsByUser(string userId)
        {
            return _data.Values
                .Where(r => r.RequestedBy == userId)
                .OrderByDescending(r => r.RequestedDate)
                .ToList();
        }

        public MediaRequest? GetRequest(string id)
        {
            return _data.TryGetValue(id, out var request) ? request : null;
        }

        public void UpdateRequest(MediaRequest request)
        {
            _data[request.Id] = request;
            _ = SaveDataAsync();
        }

        public void DeleteRequest(string id)
        {
            _data.Remove(id);
            _ = SaveDataAsync();
        }
    }
}
