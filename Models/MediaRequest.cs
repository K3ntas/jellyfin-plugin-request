using System;

namespace Jellyfin.Plugin.RequestPlugin.Models
{
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
        Complete
    }

    public class CreateRequestDto
    {
        public string Title { get; set; } = string.Empty;
    }
}
