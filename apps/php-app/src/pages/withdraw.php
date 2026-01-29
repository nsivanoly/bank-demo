<?php
require_once '../includes/header.php';

$withdrawStatus = null;
$actionMessage = null;
$availableBalance = null;

// Extract account number from URL or POST
$accountNumber = $_GET['accountNumber'] ?? '';
$amount = '';

// Fetch balance if account number is available (GET or POST)
if ($accountNumber !== '') {
    [$status, $accountDetails] = apiGet('/accounts/' . urlencode($accountNumber));
    if ($status === 200 && !empty($accountDetails)) {
        $availableBalance = $accountDetails['balance'] ?? null;
    }
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accountNumber = trim($_POST['accountNumber']);
    $amount = floatval($_POST['amount']);

    if ($accountNumber === '') {
        $withdrawStatus = 400;
        $actionMessage = 'Account number is required.';
    } elseif ($amount <= 0) {
        $withdrawStatus = 400;
        $actionMessage = 'Amount must be greater than zero.';
    } else {
        [$withdrawStatus, $response] = apiPost("/accounts/" . urlencode($accountNumber) . "/withdraw", ['amount' => $amount]);
        $actionMessage = $response['message'] ?? ($withdrawStatus === 200 ? 'Withdrawal successful.' : ($response['error'] ?? 'Withdrawal failed.'));
        
        // Refresh balance after withdrawal if successful
        if ($withdrawStatus === 200) {
            [$status, $accountDetails] = apiGet('/accounts/' . urlencode($accountNumber));
            if ($status === 200 && !empty($accountDetails)) {
                $availableBalance = $accountDetails['balance'] ?? null;
            }
        }
    }
}
?>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow-lg">
                <div class="card-body">
                    <h2 class="mb-4 text-center fw-bold">
                        <i class="bi bi-cash-stack me-2"></i>Withdraw Funds
                    </h2>

                    <?php if ($availableBalance !== null): ?>
                        <div class="mb-3">
                            <i class="bi bi-wallet2 me-1 text-muted"></i>
                            <strong>Available Balance:</strong>
                            <?= number_format($availableBalance, 2) ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($withdrawStatus !== null): ?>
                        <div class="alert alert-<?= $withdrawStatus === 200 ? 'success' : 'danger' ?> alert-dismissible fade show" role="alert">
                            <strong>
                                <i class="bi <?= $withdrawStatus === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill' ?> me-1"></i>
                                <?= $withdrawStatus === 200 ? 'Success:' : 'Error:' ?>
                            </strong>
                            <?= htmlspecialchars($actionMessage) ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <?php endif; ?>

                    <form method="post" novalidate>
                        <div class="mb-3">
                            <label for="accountNumber" class="form-label">
                                <i class="bi bi-hash me-1"></i> Account Number
                            </label>
                            <input
                                type="text"
                                class="form-control"
                                id="accountNumber"
                                name="accountNumber"
                                required
                                value="<?= htmlspecialchars($accountNumber) ?>"
                            >
                        </div>

                        <div class="mb-4">
                            <label for="amount" class="form-label">
                                <i class="bi bi-currency-exchange me-1"></i> Amount
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0.01" 
                                class="form-control" 
                                id="amount" 
                                name="amount" 
                                required
                                value="<?= htmlspecialchars($amount) ?>"
                            >
                        </div>

                        <div class="d-flex justify-content-between">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-cash-stack me-1"></i> Withdraw
                            </button>
                            <a href="/accounts" class="btn btn-secondary">
                                <i class="bi bi-arrow-left-circle me-1"></i> Back to Accounts
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
<br/>
<br/>

<?php require_once '../includes/footer.php'; ?>
