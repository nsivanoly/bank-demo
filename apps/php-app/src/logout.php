<?php
require_once 'includes/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_name('bank_ui_session');
    session_start();
}

// Get id_token from session before destroying session
$id_token = $_SESSION['id_token'] ?? '';

// Destroy session properly
session_unset();
session_destroy();

// Build logout URL with id_token_hint and post_logout_redirect_uri
$params = [
    'post_logout_redirect_uri' => REDIRECT_URI,
    'id_token_hint' => $id_token,
];

$logoutUrl = OAUTH2_LOGOUT_URL . '?' . http_build_query($params);

header("Location: $logoutUrl");
exit;
