import React from "react";
import { useNotificationContext } from "../NotificationContext";

const AlertToasts = () => {
  const { alerts, removeAlert } = useNotificationContext();

  const latestAlerts = alerts.slice(-3);

  const getAlertClass = (type: string): string => {
    switch (type) {
      case "success":
        return "alert-success";
      case "warning":
        return "alert-warning";
      case "danger":
        return "alert-danger";
      default:
        return "alert-primary";
    }
  };

  const getIconClass = (type: string): string => {
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
    <div
      aria-live="polite"
      aria-atomic="true"
      className="alert-wrapper position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1080, minWidth: "300px" }}
    >
      {latestAlerts.map(({ id, message }, index) => (
        <div
          key={id || `alert-${index}`}
          className={`alert ${getAlertClass(message.type)} alert-dismissible fade show d-flex align-items-center`}
          role="alert"
        >
          <i className={`${getIconClass(message.type)} me-2`} style={{ fontSize: "1.2rem" }}></i>
          <div className="flex-grow-1">{message.msg}</div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => removeAlert(id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AlertToasts;
