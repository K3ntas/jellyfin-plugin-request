(function () {
    'use strict';

    const RequestPlugin = {
        currentUser: null,
        isAdmin: false,
        modalOpen: false,

        init: function () {
            console.log('[RequestPlugin] Initializing...');
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
            setTimeout(() => this.onPageChange(), 1000);
        },

        onPageChange: function () {
            // Always show the floating button on all pages
            this.getCurrentUser();
            this.injectFloatingButton();
        },

        getCurrentUser: function () {
            try {
                if (window.ApiClient) {
                    const user = window.ApiClient.getCurrentUser();
                    if (user) {
                        this.currentUser = user;
                        this.isAdmin = user.Policy && user.Policy.IsAdministrator;
                        console.log('[RequestPlugin] User loaded:', user.Name, 'Admin:', this.isAdmin);
                    }
                }
            } catch (e) {
                console.error('[RequestPlugin] Error getting current user:', e);
            }
        },

        injectFloatingButton: function () {
            // Remove existing button if any
            const existing = document.getElementById('request-plugin-float-btn');
            if (existing) {
                return; // Already exists
            }

            // Create floating button
            const button = document.createElement('button');
            button.id = 'request-plugin-float-btn';
            button.className = 'request-plugin-float-btn';
            button.innerHTML = '📝 Request';
            button.onclick = () => this.openRequestModal();

            document.body.appendChild(button);
            console.log('[RequestPlugin] Floating button injected');
        },

        openRequestModal: function () {
            if (this.modalOpen) return;
            this.modalOpen = true;

            const modal = this.createModal();
            document.body.appendChild(modal);

            // Load requests
            this.loadRequests();
        },

        closeModal: function () {
            const modal = document.getElementById('request-plugin-modal');
            if (modal) {
                modal.remove();
                this.modalOpen = false;
            }
        },

        createModal: function () {
            const modal = document.createElement('div');
            modal.id = 'request-plugin-modal';
            modal.className = 'request-plugin-modal';
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            };

            const content = document.createElement('div');
            content.className = 'request-plugin-modal-content';

            content.innerHTML = `
                <div class="request-plugin-header">
                    <h2 style="margin: 0 0 20px 0;">Media Requests</h2>
                    <button class="request-plugin-close-btn" onclick="RequestPlugin.closeModal()">×</button>
                </div>

                <div class="request-plugin-form">
                    <input
                        type="text"
                        id="request-title-input"
                        placeholder="Enter show or movie name..."
                        class="request-plugin-input"
                    />
                    <button onclick="RequestPlugin.submitRequest()" class="request-plugin-submit-btn">
                        Submit Request
                    </button>
                </div>

                <div class="request-plugin-table-container">
                    <h3>Your Requests</h3>
                    <div id="request-plugin-table-wrapper">
                        <p>Loading requests...</p>
                    </div>
                </div>
            `;

            // Add enter key listener for input
            setTimeout(() => {
                const input = document.getElementById('request-title-input');
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.submitRequest();
                        }
                    });
                }
            }, 100);

            modal.appendChild(content);
            return modal;
        },

        submitRequest: function () {
            const input = document.getElementById('request-title-input');
            const title = input ? input.value.trim() : '';

            if (!title) {
                this.showToast('Please enter a title', 'error');
                return;
            }

            const baseUrl = window.ApiClient.serverAddress();
            const headers = this.getHeaders();

            fetch(`${baseUrl}/Requests/Create`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ title: title })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to create request');
                    }
                    return response.json();
                })
                .then(() => {
                    this.showToast('Request submitted successfully!', 'success');
                    if (input) input.value = '';
                    this.loadRequests();
                })
                .catch(error => {
                    console.error('[RequestPlugin] Error submitting request:', error);
                    this.showToast('Error submitting request', 'error');
                });
        },

        loadRequests: function () {
            const baseUrl = window.ApiClient.serverAddress();
            const headers = this.getHeaders();

            fetch(`${baseUrl}/Requests/All`, {
                method: 'GET',
                headers: headers
            })
                .then(response => response.json())
                .then(requests => {
                    this.renderRequestTable(requests);
                })
                .catch(error => {
                    console.error('[RequestPlugin] Error loading requests:', error);
                    this.showToast('Error loading requests', 'error');
                });
        },

        renderRequestTable: function (requests) {
            const wrapper = document.getElementById('request-plugin-table-wrapper');
            if (!wrapper) return;

            if (requests.length === 0) {
                wrapper.innerHTML = '<p>No requests yet.</p>';
                return;
            }

            let tableHtml = `
                <table class="request-plugin-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Requested By</th>
                            <th>Date</th>
                            <th>Status</th>
                            ${this.isAdmin ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
            `;

            requests.forEach(request => {
                const date = new Date(request.RequestedDate).toLocaleDateString();
                const statusClass = `status-${request.Status.toLowerCase()}`;

                tableHtml += `
                    <tr>
                        <td>${this.escapeHtml(request.Title)}</td>
                        <td>${this.escapeHtml(request.RequestedByName)}</td>
                        <td>${date}</td>
                        <td>
                            ${this.isAdmin ?
                                `<select class="request-plugin-status-select ${statusClass}"
                                    onchange="RequestPlugin.updateStatus('${request.Id}', this.value)">
                                    <option value="Pending" ${request.Status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Processing" ${request.Status === 'Processing' ? 'selected' : ''}>Processing</option>
                                    <option value="Complete" ${request.Status === 'Complete' ? 'selected' : ''}>Complete</option>
                                </select>`
                                :
                                `<span class="request-plugin-status-badge ${statusClass}">${request.Status}</span>`
                            }
                        </td>
                        ${this.isAdmin ? `<td>
                            <button onclick="RequestPlugin.deleteRequest('${request.Id}')"
                                class="request-plugin-delete-btn">Delete</button>
                        </td>` : ''}
                    </tr>
                `;
            });

            tableHtml += `
                    </tbody>
                </table>
            `;

            wrapper.innerHTML = tableHtml;
        },

        updateStatus: function (requestId, newStatus) {
            const baseUrl = window.ApiClient.serverAddress();
            const headers = this.getHeaders();

            fetch(`${baseUrl}/Requests/${requestId}/Status?status=${newStatus}`, {
                method: 'PUT',
                headers: headers
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update status');
                    }
                    return response.json();
                })
                .then(() => {
                    this.showToast('Status updated!', 'success');
                    this.loadRequests();
                })
                .catch(error => {
                    console.error('[RequestPlugin] Error updating status:', error);
                    this.showToast('Error updating status', 'error');
                });
        },

        deleteRequest: function (requestId) {
            if (!confirm('Are you sure you want to delete this request?')) {
                return;
            }

            const baseUrl = window.ApiClient.serverAddress();
            const headers = this.getHeaders();

            fetch(`${baseUrl}/Requests/${requestId}`, {
                method: 'DELETE',
                headers: headers
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete request');
                    }
                    return response.json();
                })
                .then(() => {
                    this.showToast('Request deleted!', 'success');
                    this.loadRequests();
                })
                .catch(error => {
                    console.error('[RequestPlugin] Error deleting request:', error);
                    this.showToast('Error deleting request', 'error');
                });
        },

        getHeaders: function () {
            const token = window.ApiClient.accessToken();
            return {
                'Content-Type': 'application/json',
                'X-Emby-Authorization': this.buildAuthHeader(token)
            };
        },

        buildAuthHeader: function (token) {
            let deviceId = localStorage.getItem('_deviceId2');
            if (!deviceId) {
                deviceId = this.generateDeviceId();
                localStorage.setItem('_deviceId2', deviceId);
            }

            return `MediaBrowser Client="Jellyfin Web", Device="Browser", ` +
                `DeviceId="${deviceId}", Version="10.11.0", Token="${token}"`;
        },

        generateDeviceId: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        escapeHtml: function (text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        showToast: function (message, type) {
            // Remove existing toast
            const existingToast = document.getElementById('request-plugin-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.id = 'request-plugin-toast';
            toast.className = `request-plugin-toast request-plugin-toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        injectStyles: function () {
            if (document.getElementById('request-plugin-styles')) return;

            const style = document.createElement('style');
            style.id = 'request-plugin-styles';
            style.textContent = `
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
                    font-family: inherit;
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
                    max-width: 900px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    color: #fff;
                }

                .request-plugin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .request-plugin-close-btn {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 32px;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    line-height: 32px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .request-plugin-close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Form */
                .request-plugin-form {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 30px;
                }

                .request-plugin-input {
                    flex: 1;
                    padding: 12px 16px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 4px;
                    color: #fff;
                    font-size: 16px;
                    font-family: inherit;
                }

                .request-plugin-input:focus {
                    outline: none;
                    border-color: #00a4dc;
                }

                .request-plugin-submit-btn {
                    padding: 12px 24px;
                    background: #00a4dc;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    font-family: inherit;
                }

                .request-plugin-submit-btn:hover {
                    background: #0088bb;
                }

                /* Table container */
                .request-plugin-table-container h3 {
                    margin-top: 0;
                    margin-bottom: 16px;
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

                .request-plugin-table tbody tr:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                /* Status badges */
                .request-plugin-status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 0.85em;
                    font-weight: 500;
                }

                .status-pending {
                    background: #f59e0b;
                    color: white;
                }

                .status-processing {
                    background: #3b82f6;
                    color: white;
                }

                .status-complete {
                    background: #10b981;
                    color: white;
                }

                /* Status select */
                .request-plugin-status-select {
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    font-size: 0.9em;
                    cursor: pointer;
                    font-weight: 500;
                    color: white;
                }

                /* Delete button */
                .request-plugin-delete-btn {
                    padding: 6px 12px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.85em;
                    transition: background 0.2s;
                }

                .request-plugin-delete-btn:hover {
                    background: #b91c1c;
                }

                /* Toast notifications */
                .request-plugin-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 4px;
                    color: white;
                    font-size: 14px;
                    z-index: 10002;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                }

                .request-plugin-toast.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .request-plugin-toast-success {
                    background: #10b981;
                }

                .request-plugin-toast-error {
                    background: #dc2626;
                }
            `;

            document.head.appendChild(style);
        }
    };

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => RequestPlugin.init());
    } else {
        RequestPlugin.init();
    }

    // Also try after delay for Jellyfin load
    setTimeout(() => RequestPlugin.init(), 2000);

    // Expose globally for onclick handlers
    window.RequestPlugin = RequestPlugin;
})();
