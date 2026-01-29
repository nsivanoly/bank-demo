<?php
require_once 'config.php';
require_once 'functions.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$currentPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($currentPath !== '/' && $currentPath !== '/index.php') {
    requireAuth();
}

$username = $_SESSION['user'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title><?php echo APP_NAME; ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <!-- Font Awesome (optional) -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet" />
    <link href="/assets/css/style.css" rel="stylesheet" />
</head>

<body class="d-flex flex-column min-vh-100">

    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="/">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                    <path fill="currentColor" d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
                    <path fill="currentColor" d="M11 12.5L3 9v10h2v-5h4v5h2v-7.5zM17 15h2v4h-2v-4z" />
                </svg>
                <span class="brand-text">MyBank</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div class="navbar-nav ms-auto align-items-center">

                        <div class="nav-item" style="margin: 0 12px;">
                            <?php require_once 'auth-selector.php'; ?>
                        </div>
                    <?php if (!AUTH_ENABLED || $username): ?>
                        <a class="nav-link menu-item" href="/accounts">
                            <i class="bi bi-wallet2 me-1"></i> <span class="menu-label">Accounts</span>
                        </a>
                        <a class="nav-link menu-item" href="/create-account">
                            <i class="bi bi-plus-circle me-1"></i> <span class="menu-label">Create</span>
                        </a>
                        <div class="nav-item dropdown quick-actions">
                            <a class="nav-link dropdown-toggle menu-item" href="#" role="button" data-bs-toggle="dropdown">
                                <i class="bi bi-lightning-fill me-1"></i> <span class="menu-label">Quick Actions</span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-dark">
                                <li>
                                    <a class="dropdown-item d-flex align-items-center" href="/transfer">
                                        <i class="bi bi-arrow-left-right me-2"></i> Transfer
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item d-flex align-items-center" href="/deposit">
                                        <i class="bi bi-bank2 me-2"></i> Deposit
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item d-flex align-items-center" href="/withdraw">
                                        <i class="bi bi-cash-stack me-2"></i> Withdraw
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <a class="nav-link menu-item" href="/summary">
                            <i class="bi bi-graph-up-arrow me-1"></i> <span class="menu-label">Summary</span>
                        </a>
                        <div class="nav-item dropdown">
                            <a class="nav-link menu-item position-relative" href="#" id="notificationBell" role="button"
                                data-bs-toggle="dropdown">
                                <i class="bi bi-bell me-1"></i>
                                <span class="menu-label"></span>
                                <span
                                    class="top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge d-none">
                                    0
                                </span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" id="notificationDropdown"
                                aria-labelledby="notificationBell">
                                <li class="dropdown-header d-flex justify-content-between align-items-center">
                                    <span>Notifications</span>
                                    <button id="clearAllNotifications" class="btn btn-sm btn-outline-light">Clear
                                        All</button>
                                </li>
                                <li class="dropdown-item text-center py-3" id="noNotificationsMessage">No new notifications
                                </li>
                            </ul>
                        </div>
                        <?php if (AUTH_ENABLED && $username): ?>
                            <div class="user-welcome text-white mx-3">
                                Welcome, <strong><?php echo ucfirst(htmlspecialchars($username)); ?></strong>
                            </div>
                            <a class="nav-link menu-item logout-btn" href="/logout">
                                <i class="bi bi-box-arrow-right me-1"></i> <span class="menu-label">Logout</span>
                            </a>
                        <?php endif; ?>
                    <?php else: ?>
                        <a class="nav-link menu-item login-btn" href="/login">
                            <i class="bi bi-box-arrow-in-right me-1"></i> <span class="menu-label">Login</span>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const notificationBell = document.getElementById('notificationBell');
            const notificationDropdown = document.getElementById('notificationDropdown');
            let notifications = [];

            // Connect to WebSocket
            <?php  if (AUTH_ENABLED && TYPE=="KM" && isset($_SESSION['access_token'])) { ?>
            const socket = new WebSocket('<?php echo WEBSOCKET_NOTIFICATION_URL; ?>?access_token=<?php echo $_SESSION['access_token']; ?>');
            <?php } else { ?>
            const socket = new WebSocket('<?php echo WEBSOCKET_NOTIFICATION_URL; ?>');
            <?php } ?>

            socket.onmessage = function (event) {
                try {
                    if (typeof event.data === "string") {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        const newNotification = {
                            id: Date.now(),
                            msg: data.message.msg,
                            type: data.message.type,
                            timestamp: data.timestamp
                        };

                        notifications.unshift(newNotification);

                        // Keep only last 5 notifications
                        if (notifications.length > 5) {
                            notifications = notifications.slice(0, 5);
                        }

                        updateNotificationBadge();
                        updateNotificationDropdown();

                        // Show toast for new notification
                        showToast(newNotification.msg, newNotification.type);
                    }
                }
                } catch (e) {
                    console.error('Error processing WebSocket message:', e);
                }
            };

            function updateNotificationBadge() {
                const badge = notificationBell.querySelector('.notification-badge');
                if (notifications.length > 0) {
                    let lengthz = notifications.length;
                    if (lengthz > 4) {
                        lengthz = "5+" 
                    }
                    badge.textContent = lengthz;
                    badge.classList.remove('d-none');
                } else {
                    badge.classList.add('d-none');
                }
            }

            function updateNotificationDropdown() {
                // Get the Bootstrap Dropdown instance
                const dropdown = bootstrap.Dropdown.getInstance(notificationBell);

                notificationDropdown.innerHTML = `
            <li class="dropdown-header d-flex justify-content-between align-items-center">
                <span>Notifications</span>
                ${notifications.length > 0 ?
                        '<button id="clearAllNotifications" class="btn btn-sm btn-outline-light">Clear All</button>' :
                        ''}
            </li>
        `;

                if (notifications.length === 0) {
                    notificationDropdown.innerHTML += `
                <li class="dropdown-item text-center py-3">
                    No new notifications
                </li>
            `;
                    return;
                }

                notifications.forEach(notification => {
                    const icon = notification.type === 'info' ? 'bi-info-circle' :
                        notification.type === 'warning' ? 'bi-exclamation-triangle' :
                            notification.type === 'error' ? 'bi-x-circle' : 'bi-bell';

                    const notificationItem = document.createElement('li');
                    notificationItem.className = 'dropdown-item d-flex justify-content-between align-items-center';
                    notificationItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi ${icon} me-2 text-${notification.type === 'error' ? 'danger' :
                            notification.type === 'warning' ? 'warning' : 'info'}"></i>
                    <div>
                        <div class="small text-muted time-stamp">${formatTime(notification.timestamp)}</div>
                        <div>${notification.msg}</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger delete-notification" data-id="${notification.id}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
                    notificationDropdown.appendChild(notificationItem);
                });

                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-notification').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const id = parseInt(this.getAttribute('data-id'));
                        notifications = notifications.filter(n => n.id !== id);
                        updateNotificationBadge();
                        updateNotificationDropdown();
                        // Keep dropdown open after deletion
                        dropdown.show();
                    });
                });
            }

            // Handle Clear All button clicks using event delegation
            document.addEventListener('click', function (e) {
                if (e.target && e.target.id === 'clearAllNotifications') {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropdown = bootstrap.Dropdown.getInstance(notificationBell);
                    notifications = [];
                    updateNotificationBadge();
                    updateNotificationDropdown();
                    // Keep dropdown open after clearing
                    dropdown.show();
                }
            });

            function formatTime(timestamp) {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                });
            }

            function showToast(message, type = 'info') {
                const toastContainer = document.getElementById('toastContainer') || createToastContainer();
                const toastId = 'toast-' + Date.now();

                const toast = document.createElement('div');
                toast.className = `toast show align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
                toast.setAttribute('role', 'alert');
                toast.setAttribute('aria-live', 'assertive');
                toast.setAttribute('aria-atomic', 'true');
                toast.id = toastId;

                toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

                toastContainer.appendChild(toast);

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    const toastElement = document.getElementById(toastId);
                    if (toastElement) {
                        toastElement.remove();
                    }
                }, 5000);
            }

            function createToastContainer() {
                const container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'position-fixed bottom-0 end-0 p-3';
                container.style.zIndex = '11';
                document.body.appendChild(container);
                return container;
            }

            // Initialize
            updateNotificationBadge();
            updateNotificationDropdown();
        });
    </script>

    <div class="container mt-4 flex-fill">
        <!-- page content continues here -->