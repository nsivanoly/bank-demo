<?php
require_once '../includes/header.php';

$depositStatus = null;
$actionMessage = null;

// Extract account number from URL
$accountNumber = $_GET['accountNumber'] ?? "";
$amount = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accountNumber = trim($_POST['accountNumber']);
    $amount = floatval($_POST['amount']);

    if ($accountNumber === '') {
        $depositStatus = 400;
        $actionMessage = 'Account number is required.';
    } elseif ($amount <= 0) {
        $depositStatus = 400;
        $actionMessage = 'Amount must be greater than zero.';
    } else {
        [$depositStatus, $response] = apiPost("/accounts/" . urlencode($accountNumber) . "/deposit", ['amount' => $amount]);
        $actionMessage = $response['message'] ?? ($depositStatus === 200 ? 'Deposit successful.' : ($response['error'] ?? 'Deposit failed.'));
    }
}
?>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow-lg">
                <div class="card-body">
                    <h2 class="mb-4 text-center fw-bold">
                        <i class="bi bi-bank2 me-2"></i>Deposit Funds
                    </h2>

                    <?php if ($depositStatus !== null): ?>
                        <div class="alert alert-<?= $depositStatus === 200 ? 'success' : 'danger' ?> alert-dismissible fade show" role="alert">
                            <strong>
                                <i class="bi <?= $depositStatus === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill' ?> me-1"></i>
                                <?= $depositStatus === 200 ? 'Success:' : 'Error:' ?>
                            </strong>
                            <?= htmlspecialchars($actionMessage) ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <?php endif; ?>

                    <form method="post" novalidate>
                        <div class="mb-3">
                            <label for="accountNumber" class="form-label">
                                <i class="bi bi-person-badge me-1"></i>Account Number
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
                                <i class="bi bi-currency-dollar me-1"></i>Amount
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
                                <i class="bi bi-bank2 me-1"></i> Deposit
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
