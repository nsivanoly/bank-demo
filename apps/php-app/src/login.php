<?php
require_once 'includes/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_name('bank_ui_session');
    session_start();
}

// If user logged in (id_token in session), show welcome
if (isset($_SESSION['id_token'])) {
    $idToken = $_SESSION['id_token'];

    // Decode JWT payload (base64url decode)
    $parts = explode('.', $idToken);
    if (count($parts) === 3) {
        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    } else {
        $payload = [];
    }
    $name = $payload['name'] ?? $payload['sub'] ?? 'User';

    require_once 'includes/header.php';
    ?>

    <div class="container mt-5">
        <div class="card shadow rounded-4">
            <div class="card-header">
                <h4 class="mb-0">Welcome, <?= htmlspecialchars($name) ?>!</h4>
            </div>
            <div class="card-body">
                <p class="mb-2"><strong>ID Token:</strong></p>
                <pre class="bg-light p-3 rounded-3" style="max-height: 200px; overflow:auto;"><?= htmlspecialchars($idToken) ?></pre>
                <a href="logout.php" class="btn btn-outline-danger mt-3">Logout</a>
            </div>
        </div>
    </div>


    <?php
    require_once 'includes/footer.php';
    exit;
}

// If not logged in, redirect to OAuth2 authorization endpoint
$authUrl = OAUTH2_AUTH_URL . '?' . http_build_query([
    'response_type' => 'code',
    'client_id'     => OAUTH2_CLIENT_ID,
    'redirect_uri'  => OAUTH2_REDIRECT_URI,
    'scope'         => OAUTH2_SCOPE,
]);

header("Location: $authUrl");
exit;
