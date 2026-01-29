import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@asgardeo/auth-react";
import { AppConfig } from "../config";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuthContext();

  if (!AppConfig.USE_AUTH) return <>{children}</>;

  if (state.isLoading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (!state.isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
