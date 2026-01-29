<?php
/**
 * Application Configuration File - Dynamic Auth Selection
 * 
 * This file contains all authentication and API configuration settings
 * that match the provided JSON structure exactly. It supports multiple
 * authentication providers and allows runtime selection via session/cookie.
 * 
 * Authentication options are stored in session and can be changed via dropdown.
 */

// Source - https://stackoverflow.com/a/21429652
// Posted by Fancy John, modified by community. See post 'Timeline' for change history
// Retrieved 2025-11-27, License - CC BY-SA 4.0

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_name('bank_ui_session');
    session_start();
}

// Handle auth type change via AJAX BEFORE any output
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['auth_type'])) {
    // This will be processed before config array is needed
    // Define a flag to handle this after $authConfigs is loaded
    define('AUTH_SELECTOR_POST_RECEIVED', true);
}

/**
 * Authentication Configuration Array
 * 
 * Exact replica of the JSON configuration in PHP format.
 * Each provider contains:
 * - OAuth2 client credentials
 * - Base URLs for authentication endpoints
 * - API and WebSocket endpoints
 * - Authentication scope settings
 */
$authConfigs = [
    // WSO2 API Manager Key Manager configuration
    'WSO2_APIM_KM' => [
        'TYPE' => 'KM',
        'clientID' => 'oP1VAm9P5WdMoBiSMK93vmmqsxka',
        'baseUrl' => 'https://localhost:9443',
        'containerUrl' => 'https://wso2am:9443',
        'scope' => ['openid profile email groups roles'],
        'USE_AUTH' => true,
        'API_BASE_URL' => 'https://wso2am:8243/bankapi/1.0.0',
        'WEBSOCKET_NOTIFICATION_URL' => 'wss://wso2am:8099/notifications/1.0.0/notifications',
        'WEBSOCKET_SUPPORT_URL' => 'wss://wso2am:8099/chat/1.0.0/support',
        'WEBSOCKET_ROOMS_URL' => 'wss://wso2am:8099/chat/1.0.0/rooms'
    ],
    
    // WSO2 Identity Server Key Manager configuration
    'WSO2_IS_KM' => [
        'TYPE' => 'KM',
        'clientID' => 'FPdSoyTSmuKop1Cxsi3u87AkEWUa',
        'baseUrl' => 'https://localhost:9444',
        'containerUrl' => 'https://wso2is:9444',
        'scope' => ['openid profile email groups roles'],
        'USE_AUTH' => true,
        'API_BASE_URL' => 'https://wso2am:8243/bankapi/1.0.0',
        'WEBSOCKET_NOTIFICATION_URL' => 'wss://wso2am:8099/notifications/1.0.0/notifications',
        'WEBSOCKET_SUPPORT_URL' => 'wss://wso2am:8099/chat/1.0.0/support',
        'WEBSOCKET_ROOMS_URL' => 'wss://wso2am:8099/chat/1.0.0/rooms'
    ],
    
    // WSO2 Identity Server configuration
    'WSO2_IS' => [
        'TYPE' => 'AUTH',
        'clientID' => 'FPdSoyTSmuKop1Cxsi3u87AkEWUa',
        'baseUrl' => 'https://localhost:9444',
        'containerUrl' => 'https://wso2is:9444',
        'scope' => ['openid profile email groups roles'],
        'USE_AUTH' => true,
        'API_BASE_URL' => 'https://bank-api:3443',
        'WEBSOCKET_NOTIFICATION_URL' => 'wss://web-socket:8443/notifications',
        'WEBSOCKET_SUPPORT_URL' => 'wss://web-socket:8443/support',
        'WEBSOCKET_ROOMS_URL' => 'wss://web-socket:8443/rooms'
    ],
    
    // No authentication configuration (public access)
    'NO_AUTH' => [
        'TYPE' => 'NO_AUTH',
        'clientID' => 'NO_AUTH',
        'baseUrl' => 'NO_AUTH',
        'containerUrl' => 'NO_AUTH',
        'scope' => ['openid profile email groups roles'],
        'USE_AUTH' => false,
        'API_BASE_URL' => 'https://bank-api:3443',
        'WEBSOCKET_NOTIFICATION_URL' => 'wss://web-socket:8443/notifications',
        'WEBSOCKET_SUPPORT_URL' => 'wss://web-socket:8443/support',
        'WEBSOCKET_ROOMS_URL' => 'wss://web-socket:8443/rooms'
    ]
];

// Handle auth type POST request BEFORE any output
if (defined('AUTH_SELECTOR_POST_RECEIVED') && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['auth_type'])) {
    $authType = trim($_POST['auth_type']);
    
    // Log for debugging
    error_log("Auth selector POST - received auth_type: " . $authType);
    error_log("Available auth configs: " . implode(', ', array_keys($authConfigs)));
    
    if (setSelectedAuthType($authType)) {
        // Return JSON response for AJAX
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'auth_type' => $authType]);
            exit;
        }
    } else {
        // Invalid auth type
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
            header('Content-Type: application/json');
            http_response_code(400);
            $validTypes = implode(', ', array_keys($authConfigs));
            echo json_encode([
                'success' => false, 
                'error' => "Invalid authentication type: '$authType'. Valid types: $validTypes"
            ]);
            exit;
        }
    }
}

/**
 * Get the currently selected authentication type
 * Reads from session, defaults to 'WSO2_IS' if not set
 * 
 * @return string The selected auth type key
 */
function getSelectedAuthType() {
    $default = 'WSO2_IS';
    
    // Check if explicitly set in session
    if (isset($_SESSION['auth_type']) && array_key_exists($_SESSION['auth_type'], $GLOBALS['authConfigs'])) {
        return $_SESSION['auth_type'];
    }
    
    return $default;
}

/**
 * Set the authentication type selection
 * Stores selection in session for persistence across page loads
 * 
 * @param string $authType The auth type key to select
 * @return bool True if successful, false if invalid type
 */
function setSelectedAuthType($authType) {
    global $authConfigs;
    
    if (!array_key_exists($authType, $authConfigs)) {
        return false;
    }
    
    $_SESSION['auth_type'] = $authType;
    return true;
}

/**
 * Get all available authentication options formatted for UI display
 * 
 * @return array Array of auth options with 'value' and 'label' keys
 */
function getAuthOptions() {
    return [
        ['value' => 'WSO2_APIM_KM', 'label' => 'WSO2 API Manager (Key Manager)'],
        ['value' => 'WSO2_IS_KM', 'label' => 'WSO2 Identity Server (Key Manager)'],
        ['value' => 'WSO2_IS', 'label' => 'WSO2 Identity Server'],
        ['value' => 'NO_AUTH', 'label' => 'No Authentication']
    ];
}

/**
 * Get the color badge for each auth type (for UI display)
 * 
 * @param string $authType The authentication type
 * @return string Bootstrap badge color class
 */
function getAuthBadgeColor($authType) {
    $colors = [
        'WSO2_APIM_KM' => 'warning',
        'WSO2_IS_KM' => 'success',
        'WSO2_IS' => 'info',
        'NO_AUTH' => 'secondary'
    ];
    
    return $colors[$authType] ?? 'secondary';
}

/**
 * Get the icon class for each auth type (Bootstrap Icons)
 * 
 * @param string $authType The authentication type
 * @return string Bootstrap icon class name
 */
function getAuthIcon($authType) {
    $icons = [
        'WSO2_APIM_KM' => 'key',
        'WSO2_IS_KM' => 'lock',
        'WSO2_IS' => 'shield-lock',
        'NO_AUTH' => 'globe'
    ];
    
    return $icons[$authType] ?? 'gear';
}

// Get the currently selected authentication provider
define('AUTH_BY', getSelectedAuthType());

// Validate the selected authentication provider exists
if (!array_key_exists(AUTH_BY, $authConfigs)) {
    throw new Exception("Invalid AUTH_BY value: " . AUTH_BY);
}

// Get configuration for selected provider
$currentAuthConfig = $authConfigs[AUTH_BY];

/**
 * Session Configuration
 * 
 * Initialize session with custom name for security
 */
session_name('bank_ui_session');
session_start();

// Core application configuration constants from selected provider
define('TYPE', $currentAuthConfig['TYPE']); // Authentication toggle
define('AUTH_ENABLED', $currentAuthConfig['USE_AUTH']); // Authentication toggle
define('API_BASE_URL', $currentAuthConfig['API_BASE_URL']); // Base URL for API calls

// WebSocket endpoints for real-time communication
define('WEBSOCKET_NOTIFICATION_URL', $currentAuthConfig['WEBSOCKET_NOTIFICATION_URL']);
define('WEBSOCKET_SUPPORT_URL', $currentAuthConfig['WEBSOCKET_SUPPORT_URL']);
define('WEBSOCKET_ROOMS_URL', $currentAuthConfig['WEBSOCKET_ROOMS_URL']);

/**
 * OAuth2 Configuration
 * 
 * Constants for OAuth2 authentication flow
 */
define('OAUTH2_CLIENT_ID', $currentAuthConfig['clientID']); // Client identifier
define('OAUTH2_AUTH_URL', $currentAuthConfig['baseUrl'] . '/oauth2/authorize'); // Authorization endpoint
define('OAUTH2_TOKEN_URL', $currentAuthConfig['containerUrl'] . '/oauth2/token'); // Token endpoint
define('OAUTH2_LOGOUT_URL', $currentAuthConfig['baseUrl'] . '/oidc/logout'); // Logout endpoint
define('OAUTH2_SCOPE', implode(' ', $currentAuthConfig['scope'])); // Convert scope array to string

/**
 * URL Detection and Dynamic Routing
 * 
 * Automatically detect protocol and host for dynamic URL generation
 */
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost'; // Fallback to default if not detected
$baseUrl = $protocol . '://' . $host; // Construct full base URL

// OAuth2 callback URL (must match provider configuration)
define('OAUTH2_REDIRECT_URI', $baseUrl . '/callback');
define('REDIRECT_URI', $baseUrl); // Base redirect URL

/**
 * Application Branding
 */
define('APP_NAME', 'My Bank Portal'); // Application display name
