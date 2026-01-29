import React from "react";
import { useNotificationContext } from "../NotificationContext";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

interface Props {
  isOpen: boolean;
  toggleOpen: () => void;
}

const NotificationBell: React.FC<Props> = ({ isOpen, toggleOpen }) => {
  const { notifications, removeNotification, clearNotifications } = useNotificationContext();

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing the dropdown
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case "success":
        return "bi bi-check-circle-fill text-success";
      case "warning":
        return "bi bi-exclamation-triangle-fill text-warning";
      case "danger":
        return "bi bi-x-circle-fill text-danger";
      default:
        return "bi bi-info-circle-fill text-primary";
    }
  };

  return (
    <div className="nav-item dropdown notification-dropdown" onClick={(e) => e.stopPropagation()}>
      <button
        className="nav-link menu-item btn btn-link position-relative"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Notifications"
        type="button"
        onClick={toggleOpen}
      >
        <i className="bi bi-bell-fill"></i>
        {notifications.length > 0 && (
          <span
            className="translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.65rem", padding: "0.15em 0.4em", userSelect: "none" }}
          >
            {notifications.length >= 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <ul
          className="dropdown-menu dropdown-menu-end p-2 shadow show"
          style={{ minWidth: "300px", maxHeight: "350px", overflowY: "auto" }}
          onClick={handleItemClick}
        >
          {notifications.length === 0 ? (
            <li className="dropdown-item text-center text-muted">No notifications</li>
          ) : (
            <>
              <li className="btn-close-all dropdown-item d-flex justify-content-end">
                <button
                  className="btn btn-sm btn-outline-danger mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotifications();
                  }}
                >
                  Clear All
                </button>
              </li>
              {notifications
                .slice(-10)
                .reverse()
                .map(({ id, message, timestamp }, index) => {
                  const key = id || `notif-${index}`;
                  return (
                    <li key={key} className="d-flex justify-content-between align-items-start dropdown-item">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: "0.7rem" }}>
                          {formatDate(timestamp)}
                        </small>
                        <span>
                          <i className={`${getIconClass(message.type)} me-1`} />
                        </span>
                        <span>{message.msg}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        aria-label="Dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(id);
                        }}
                      />
                    </li>
                  );
                })}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default NotificationBell;
