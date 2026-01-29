import configJson from "./config.json";

/**
 * Authentication Provider Options
 * 
 * Available authentication configurations that users can select:
 * - "WSO2_APIM_KM": WSO2 API Manager Key Manager
 * - "WSO2_IS_KM": WSO2 Identity Server Key Manager  
 * - "WSO2_IS": WSO2 Identity Server
 * - "NO_AUTH": No authentication (public access)
 */
export type AuthType = "WSO2_APIM_KM" | "WSO2_IS_KM" | "WSO2_IS" | "NO_AUTH";

export const AUTH_OPTIONS: Array<{ value: AuthType; label: string; description: string }> = [
  {
    value: "WSO2_APIM_KM",
    label: "WSO2 API Manager (Key Manager)",
    description: "Use WSO2 API Manager as the authentication provider"
  },
  {
    value: "WSO2_IS_KM",
    label: "WSO2 Identity Server (Key Manager)",
    description: "Use WSO2 Identity Server as Key Manager"
  },
  {
    value: "WSO2_IS",
    label: "WSO2 Identity Server (Direct)",
    description: "Direct authentication through WSO2 Identity Server"
  },
  {
    value: "NO_AUTH",
    label: "No Authentication",
    description: "Public access without authentication"
  }
];

const STORAGE_KEY = "BANK_APP_AUTH_TYPE";
const DEFAULT_AUTH_TYPE: AuthType = "WSO2_APIM_KM";

/**
 * Get the selected authentication type from localStorage or default
 */
export const getSelectedAuthType = (): AuthType => {
  if (typeof window === "undefined") return DEFAULT_AUTH_TYPE;
  
  const stored = localStorage.getItem(STORAGE_KEY) as AuthType | null;
  if (stored && configJson[stored]) {
    return stored;
  }
  return DEFAULT_AUTH_TYPE;
};

/**
 * Set the authentication type in localStorage
 */
export const setSelectedAuthType = (authType: AuthType): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, authType);
  }
};

/**
 * Get application configuration for a specific auth type
 */
export const getAppConfig = (authType?: AuthType) => {
  const AUTH_BY = authType || getSelectedAuthType();
  const config = configJson[AUTH_BY];
  
  return {
    // Whether authentication is required for API access
    USE_AUTH: config.USE_AUTH,
    
    // The currently selected authentication provider
    AUTH_BY,
    
    // The authentication type
    TYPE: config.TYPE,
    
    // Base URL for all API endpoints
    API_BASE_URL: config.API_BASE_URL,
    
    // Complete authentication configuration for the selected provider
    // Includes clientID, baseUrl, redirect URLs, etc.
    AuthConfig: config,
    
    // WebSocket endpoint for notification services
    WEBSOCKET_NOTIFICATION_URL: config.WEBSOCKET_NOTIFICATION_URL,
    
    // WebSocket endpoint for customer support chat
    WEBSOCKET_SUPPORT_URL: config.WEBSOCKET_SUPPORT_URL,
    
    // WebSocket endpoint for room-based chat functionality  
    WEBSOCKET_ROOMS_URL: config.WEBSOCKET_ROOMS_URL
  };
};

/**
 * Application Configuration Export
 * 
 * Consolidates all configuration settings from the selected auth provider
 * into a single exported object for easy consumption throughout the app.
 */
export const AppConfig = getAppConfig();

/**
 * Get all available configuration options
 */
export const getAllConfigs = () => configJson;
