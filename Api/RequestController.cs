using Jellyfin.Plugin.RequestPlugin.Data;
using Jellyfin.Plugin.RequestPlugin.Models;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using MediaBrowser.Common.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Jellyfin.Plugin.RequestPlugin.Api
{
    [ApiController]
    [Route("Requests")]
    [Authorize] // CRITICAL: Requires authenticated user
    public class RequestController : ControllerBase
    {
        private readonly ILogger<RequestController> _logger;
        private readonly IUserManager _userManager;
        private readonly IAuthorizationContext _authContext;
        private readonly RequestRepository _repository;

        public RequestController(
            ILogger<RequestController> logger,
            IUserManager userManager,
            IAuthorizationContext authContext,
            RequestRepository repository)
        {
            _logger = logger;
            _userManager = userManager;
            _authContext = authContext;
            _repository = repository;
        }

        // GET /Requests/All - Get all requests (admin sees all, users see their own)
        [HttpGet("All")]
        public ActionResult<List<MediaRequest>> GetAllRequests()
        {
            try
            {
                var userId = GetUserId();
                var isAdmin = IsAdmin(userId);

                if (isAdmin)
                {
                    // Admin sees all requests
                    return Ok(_repository.GetAllRequests());
                }
                else
                {
                    // Users see only their own requests
                    return Ok(_repository.GetRequestsByUser(userId.ToString()));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting requests");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST /Requests/Create - Create new request
        [HttpPost("Create")]
        public ActionResult CreateRequest([FromBody] CreateRequestDto dto)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName(userId);

                // Validate input
                if (string.IsNullOrWhiteSpace(dto.Title))
                {
                    return BadRequest("Title is required");
                }

                var request = new MediaRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = dto.Title.Trim(),
                    RequestedBy = userId.ToString(),
                    RequestedByName = userName,
                    RequestedDate = DateTime.UtcNow,
                    Status = RequestStatus.Pending
                };

                _repository.AddRequest(request);

                _logger.LogInformation("Request created: {Title} by {User}", request.Title, userName);

                return Ok(new { success = true, requestId = request.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating request");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT /Requests/{id}/Status - Update status (admin only)
        [HttpPut("{id}/Status")]
        public ActionResult UpdateStatus(string id, [FromQuery] RequestStatus status)
        {
            try
            {
                var userId = GetUserId();
                if (!IsAdmin(userId))
                {
                    return Forbid();
                }

                var request = _repository.GetRequest(id);
                if (request == null)
                {
                    return NotFound("Request not found");
                }

                request.Status = status;
                _repository.UpdateRequest(request);

                _logger.LogInformation("Request {Id} status updated to {Status}", id, status);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating request status");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE /Requests/{id} - Delete request (admin only)
        [HttpDelete("{id}")]
        public ActionResult DeleteRequest(string id)
        {
            try
            {
                var userId = GetUserId();
                if (!IsAdmin(userId))
                {
                    return Forbid();
                }

                var request = _repository.GetRequest(id);
                if (request == null)
                {
                    return NotFound("Request not found");
                }

                _repository.DeleteRequest(id);

                _logger.LogInformation("Request {Id} deleted", id);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting request");
                return StatusCode(500, "Internal server error");
            }
        }

        // CRITICAL: Get authenticated user ID
        private Guid GetUserId()
        {
            var authInfo = _authContext.GetAuthorizationInfo(Request).Result;
            // In Jellyfin 10.11+, UserId is a Guid type
            return authInfo.UserId;
        }

        // Get username from user ID
        private string GetUserName(Guid userId)
        {
            try
            {
                var user = _userManager.GetUserById(userId);
                return user?.Username ?? "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        // Check if user is admin
        private bool IsAdmin(Guid userId)
        {
            try
            {
                var user = _userManager.GetUserById(userId);
                if (user == null) return false;

                // Check admin status - different Jellyfin versions use different APIs
                var props = user.GetType().GetProperty("Policy");
                if (props != null)
                {
                    var policy = props.GetValue(user);
                    var isAdminProp = policy?.GetType().GetProperty("IsAdministrator");
                    if (isAdminProp != null)
                    {
                        return (bool)(isAdminProp.GetValue(policy) ?? false);
                    }
                }
                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}
