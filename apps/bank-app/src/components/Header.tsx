import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuthContext } from "@asgardeo/auth-react";
import { AppConfig } from "../config";
import WebSocketService, { NotificationMessage } from "../services/WebSocketService";
import { useNotificationContext } from "./NotificationContext";
import QuickActionsMenu from "./Header/QuickActionsMenu";
import NotificationBell from "./Header/NotificationBell";
import AlertToasts from "./Header/AlertToasts";
import { AuthSelector } from "./AuthSelector";

const Header = () => {
  const { state, signIn, signOut } = useAuthContext();
  const { addNotification, addAlert } = useNotificationContext();
  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = useMemo(
    () => (AppConfig.USE_AUTH ? state?.isAuthenticated : true),
    [state]
  );

  const username = useMemo(
    () => (AppConfig.USE_AUTH ? state?.username : "Guest"),
    [state]
  );

  const ucfirst = useCallback(
    (str?: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : ""),
    []
  );

  const wsUrl = useMemo(() => {
    let url = AppConfig.WEBSOCKET_NOTIFICATION_URL;
    if (AppConfig.USE_AUTH) {
      const token = localStorage.getItem("access_token");
      url += `?access_token=${token}`;
    }
    return url;
  }, []);

  const toggleNotifOpen = useCallback(() => {
    setNotifOpen((prev) => !prev);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
      setNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    WebSocketService.connect(wsUrl);

    const handleMessage = (msg: NotificationMessage) => {
      addNotification(msg);
      addAlert(msg);
    };

    WebSocketService.subscribe(handleMessage);
    return () => WebSocketService.unsubscribe(handleMessage);
  }, [addNotification, addAlert, wsUrl]);

  useEffect(() => {
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isNotifOpen, handleClickOutside]);

  return (
    <>
      <AlertToasts />
      <nav className="navbar mybg navbar-expand-lg navbar-dark shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
              <path fill="currentColor" d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
              <path fill="currentColor" d="M11 12.5L3 9v10h2v-5h4v5h2v-7.5zM17 15h2v4h-2v-4z" />
            </svg>
            <span className="brand-text ms-2">MyBank</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div className="navbar-nav ms-auto align-items-center">
              {/* Auth Selector - Always visible */}
              <div className="me-3">
                <AuthSelector />
              </div>
              
              {isAuthenticated ? (
                <>
                  <NavLink className="nav-link menu-item" to="/accounts">
                    <i className="bi bi-wallet2 me-1"></i> Accounts
                  </NavLink>
                  <NavLink className="nav-link menu-item" to="/create-account">
                    <i className="bi bi-plus-circle me-1"></i> Create
                  </NavLink>
                  <QuickActionsMenu />
                  <NavLink className="nav-link menu-item" to="/summary">
                    <i className="bi bi-graph-up-arrow me-1"></i> Summary
                  </NavLink>

                  <div ref={notifRef}>
                    <NotificationBell isOpen={isNotifOpen} toggleOpen={toggleNotifOpen} />
                  </div>

                  <span className="text-white mx-3">
                    Welcome, <strong>{ucfirst(username)}</strong>
                  </span>

                  {AppConfig.USE_AUTH && (
                    <button className="nav-link menu-item btn btn-link logout-btn" onClick={() => signOut()}>
                      <i className="bi bi-box-arrow-right me-1"></i> Logout
                    </button>
                  )}
                </>
              ) : (
                AppConfig.USE_AUTH && (
                  <button className="nav-link menu-item btn btn-link login-btn" onClick={() => signIn?.()}>
                    <i className="bi bi-box-arrow-in-right me-1"></i> Login
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
