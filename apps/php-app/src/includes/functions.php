<?php
/**
 * Helper functions for API communication, authentication, and utility tasks.
 */

if (!defined('API_BASE_URL')) {
    require_once 'config.php';
}

/**
 * Send a cURL HTTP request to the API.
 *
 * @param string $method  HTTP method: GET, POST, PUT, DELETE
 * @param string $endpoint API endpoint (relative path)
 * @param array|null $data Optional request payload
 * @param bool $auth Whether to include Bearer token from session
 * @return array [status_code, response_array]
 */
function apiRequest($method, $endpoint, $data = null, $auth = true) {
    $url = rtrim(API_BASE_URL, '/') . '/' . ltrim($endpoint, '/');
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];

    // Add Authorization header if token exists
    if ($auth && isset($_SESSION['access_token'])) {
        $headers[] = 'Authorization: Bearer ' . $_SESSION['access_token'];
    }

    $ch = curl_init($url);

    switch (strtoupper($method)) {
        case 'POST':
            curl_setopt($ch, CURLOPT_POST, true);
            break;
        case 'PUT':
        case 'DELETE':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
            break;
        case 'GET':
            break;
        default:
            throw new InvalidArgumentException("Unsupported method: $method");
    }

    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $errorMsg = curl_error($ch);
        curl_close($ch);
        return [$httpCode, ['error' => $errorMsg]];
    }

    curl_close($ch);
    $decoded = json_decode($response, true);
    return [$httpCode, is_array($decoded) ? $decoded : ['raw' => $response]];
}

/**
 * Simple wrapper for GET requests
 */
function apiGet($endpoint, $auth = true) {
    return apiRequest('GET', $endpoint, null, $auth);
}

/**
 * Simple wrapper for POST requests
 */
function apiPost($endpoint, $data, $auth = true) {
    return apiRequest('POST', $endpoint, $data, $auth);
}

/**
 * Simple wrapper for PUT requests
 */
function apiPut($endpoint, $data, $auth = true) {
    return apiRequest('PUT', $endpoint, $data, $auth);
}

/**
 * Simple wrapper for DELETE requests
 */
function apiDelete($endpoint, $auth = true) {
    return apiRequest('DELETE', $endpoint, null, $auth);
}

/**
 * Debug helper: print array or object and exit
 */
function dd($var) {
    echo '<pre>';
    print_r($var);
    echo '</pre>';
    exit;
}

/**
 * Check if the user is authenticated (session + token)
 */
function isAuthenticated() {
    return isset($_SESSION['user']) && isset($_SESSION['access_token']);
}

/**
 * Redirect to login page if not authenticated
 */
function requireAuth() {
    if (AUTH_ENABLED && !isAuthenticated()) {
        header("Location: /login");
        exit;
    }
}
