import React, { createContext, useContext, useState, ReactNode } from "react";

export type NotificationPayload = {
  msg: string;
  type: "info" | "success" | "warning" | "danger";
};

export type NotificationMessage = {
  id: string;
  type: "notification";
  message: NotificationPayload;
  user: string;
  timestamp: string;
  protocol: string;
};

type NotificationContextType = {
  notifications: NotificationMessage[];
  alerts: NotificationMessage[];
  addNotification: (msg: Omit<NotificationMessage, "id">) => void;
  removeNotification: (id: string) => void;
  addAlert: (msg: Omit<NotificationMessage, "id">) => void;
  removeAlert: (id: string) => void;
  clearNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const generateUniqueId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [alerts, setAlerts] = useState<NotificationMessage[]>([]);

  const addNotification = (msg: Omit<NotificationMessage, "id">) => {
    const newNotification: NotificationMessage = {
      id: generateUniqueId(),
      ...msg,
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const addAlert = (msg: Omit<NotificationMessage, "id">) => {
    const newAlert: NotificationMessage = {
      id: generateUniqueId(),
      ...msg,
    };
    setAlerts((prev) => [...prev, newAlert]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        alerts,
        addNotification,
        removeNotification,
        clearNotifications,
        addAlert,
        removeAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};
