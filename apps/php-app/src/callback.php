<?php
require_once 'includes/config.php';

/**
 * OAuth2 Callback Handler - Public Client (SPA)
 * 
 * This handles the OAuth2 authorization code flow for a PUBLIC CLIENT.
 * No client secret is required as the application is registered as a
 * Single Page Application (SPA) / public client in WSO2 Identity Server.
 * 
 * Flow:
 * 1. Receives authorization code from Identity Provider
 * 2. Exchanges code for tokens (without client secret)
 * 3. Stores tokens in session
 * 4. Redirects to protected page
 */

// Decode ID token (JWT)
function decode_jwt_payload($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    return json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
}

if (session_status() === PHP_SESSION_NONE) {
    session_name('bank_ui_session');
    session_start();
}

// Check for authorization code
if (!isset($_GET['code'])) {
    // No code, redirect to login page to start auth flow
    header("Location: login");
    exit;
}

$code = $_GET['code'];

// Token exchange request - PUBLIC CLIENT (no client_secret)
$postFields = http_build_query([
    'grant_type'    => 'authorization_code',
    'code'          => $code,
    'redirect_uri'  => OAUTH2_REDIRECT_URI,
    'client_id'     => OAUTH2_CLIENT_ID
    // Note: client_secret is NOT required for public clients
]);

$ch = curl_init(OAUTH2_TOKEN_URL);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $postFields,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_SSL_VERIFYPEER => false, // For localhost HTTPS; remove in production
    CURLOPT_SSL_VERIFYHOST => false,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);


if ($response === false) {
    exit('cURL Error: ' . curl_error($ch));
}

$tokenData = json_decode($response, true);

if (!isset($tokenData['id_token'])) {
    echo "Failed to obtain access token.<br>";
    print_r($tokenData);
    exit;
}

if ($httpCode === 200 && isset($tokenData['id_token'])) {
    $_SESSION['id_token_decoded'] = decode_jwt_payload($tokenData['id_token']);
    $_SESSION['id_token'] = $tokenData['id_token'];
    $_SESSION['user'] = $_SESSION['id_token_decoded']['username'] ?? "User";
    $_SESSION['access_token'] = $tokenData['access_token'] ?? null;
    $_SESSION['refresh_token'] = $tokenData['refresh_token'] ?? null;
    header("Location: accounts");
    exit;
} else {
    require_once 'includes/header.php';
    $error = $tokenData['error_description'] ?? 'Unknown error during token exchange.';
    echo "<div class='container mt-5'><div class='alert alert-danger'>Token exchange failed: " . htmlspecialchars($error) . "</div></div>";
    require_once 'includes/footer.php';
    exit;
}
