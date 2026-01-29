import React, { FunctionComponent, ReactElement } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@asgardeo/auth-react";

import { AppConfig } from "./config";
import { ErrorBoundary } from "./error-boundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./components/NotificationContext";
import TrafficTracerPanel from "./components/TrafficTracerPanel";

import {
    HomePage,
    NotFoundPage,
    AccountSummaryPage,
    AccountsPage,
    ViewAccount,
    CreateAccountPage,
    EditAccount,
    TransferFunds,
    DepositFunds,
    WithdrawFunds,
    Chat
} from "./pages";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./app.css";

// Extract AuthConfig
const { AuthConfig: authConfig } = AppConfig;

const AppRoutes: FunctionComponent = (): ReactElement => {
    const { error } = useAuthContext();

    return (
        <ErrorBoundary error={error}>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    <Route path="/summary" element={<ProtectedRoute><AccountSummaryPage /></ProtectedRoute>} />
                    <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
                    <Route path="/accounts/:accountNumber" element={<ProtectedRoute><ViewAccount /></ProtectedRoute>} />
                    <Route path="/create-account" element={<ProtectedRoute><CreateAccountPage /></ProtectedRoute>} />
                    <Route path="/accounts/:accountNumber/edit" element={<ProtectedRoute><EditAccount /></ProtectedRoute>} />
                    <Route path="/accounts/:accountNumber/transfer" element={<ProtectedRoute><TransferFunds /></ProtectedRoute>} />
                    <Route path="/transfer" element={<ProtectedRoute><TransferFunds /></ProtectedRoute>} />
                    <Route path="/accounts/:accountNumber/deposit" element={<ProtectedRoute><DepositFunds /></ProtectedRoute>} />
                    <Route path="/deposit" element={<ProtectedRoute><DepositFunds /></ProtectedRoute>} />
                    <Route path="/accounts/:accountNumber/withdraw" element={<ProtectedRoute><WithdrawFunds /></ProtectedRoute>} />
                    <Route path="/withdraw" element={<ProtectedRoute><WithdrawFunds /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
};

const App: FunctionComponent = () => (
    <AuthProvider config={authConfig}>
        <NotificationProvider>
            <AppRoutes />
            <TrafficTracerPanel />
        </NotificationProvider>
    </AuthProvider>
);

render(<App />, document.getElementById("root"));
