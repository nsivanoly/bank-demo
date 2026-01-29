<?php
require_once '../includes/header.php';

// Extract fromAccountNumber from the URL
$fromAccountNumber = $_GET['accountNumber'] ?? "";

// Handle form submission
$transferStatus = null;
$actionMessage = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = [
        'fromAccountNumber' => trim($_POST['fromAccountNumber']),
        'toAccountNumber'   => trim($_POST['toAccountNumber']),
        'amount'            => floatval($_POST['amount']),
    ];

    [$transferStatus, $response] = apiPost('/accounts/transfer', $payload);
    $actionMessage = $response['message'] ?? ($transferStatus === 200 ? 'Transfer completed successfully.' : ($response['error'] ?? 'Transfer failed.'));
}

// Optional: Fetch sender account details
$accountDetails = null;
if (!empty($fromAccountNumber)) {
    [$accStatus, $accountDetails] = apiGet('/accounts/' . urlencode($fromAccountNumber));
}
?>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow-lg">
                <div class="card-body">
                    <h2 class="mb-4 text-center fw-bold">
                        <i class="bi bi-arrow-left-right me-2"></i>Transfer Funds
                    </h2>

                    <?php if ($transferStatus !== null): ?>
                        <div class="alert alert-<?= $transferStatus === 200 ? 'success' : 'danger' ?> alert-dismissible fade show" role="alert">
                            <strong>
                                <i class="bi <?= $transferStatus === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill' ?> me-1"></i>
                                <?= $transferStatus === 200 ? 'Success:' : 'Error:' ?>
                            </strong>
                            <?= htmlspecialchars($actionMessage) ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <?php endif; ?>

                    <?php if (isset($accountDetails['accountNumber'])): ?>
                        <div class="alert alert-info mb-4">
                            <i class="bi bi-info-circle me-1"></i>
                            <strong>From Account:</strong> <?= htmlspecialchars($accountDetails['accountNumber']) ?> —
                            <?= htmlspecialchars($accountDetails['accountHolder'] ?? '') ?>
                            (<?= htmlspecialchars($accountDetails['accountType'] ?? '') ?> /
                            <?= htmlspecialchars($accountDetails['currency'] ?? '') ?>,
                            Balance: <?= number_format($accountDetails['balance'] ?? 0, 2) ?>)
                        </div>
                    <?php endif; ?>

                    <form method="post" novalidate>
                        <div class="mb-3">
                            <label for="fromAccountNumber" class="form-label">
                                <i class="bi bi-box-arrow-in-left me-1"></i>From Account Number
                            </label>
                            <input type="text" class="form-control" id="fromAccountNumber" name="fromAccountNumber" required
                                value="<?= htmlspecialchars($_POST['fromAccountNumber'] ?? $fromAccountNumber) ?>">
                        </div>

                        <div class="mb-3">
                            <label for="toAccountNumber" class="form-label">
                                <i class="bi bi-box-arrow-right me-1"></i>To Account Number
                            </label>
                            <input type="text" class="form-control" id="toAccountNumber" name="toAccountNumber" required
                                value="<?= htmlspecialchars($_POST['toAccountNumber'] ?? '') ?>">
                        </div>

                        <div class="mb-4">
                            <label for="amount" class="form-label">
                                <i class="bi bi-currency-exchange me-1"></i>Amount
                            </label>
                            <input type="number" step="0.01" min="0.01" class="form-control" id="amount" name="amount" required
                                value="<?= htmlspecialchars($_POST['amount'] ?? '') ?>">
                        </div>

                        <div class="d-flex justify-content-between">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-arrow-left-right me-1"></i> Transfer
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
