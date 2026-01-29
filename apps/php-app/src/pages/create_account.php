<?php
require_once '../includes/header.php';

$createStatus = null;
$actionMessage = null;
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Trim inputs for validation
    $accountNumber = trim($_POST['accountNumber'] ?? '');
    $accountHolder = trim($_POST['accountHolder'] ?? '');
    $accountType = $_POST['accountType'] ?? '';
    $balance = $_POST['balance'] ?? '';
    $currency = strtoupper(trim($_POST['currency'] ?? ''));
    $branch = trim($_POST['branch'] ?? '');
    $ifscCode = trim($_POST['ifscCode'] ?? '');
    $status = $_POST['status'] ?? '';

    // Validation
    if ($accountNumber === '') {
        $errors['accountNumber'] = 'Account Number is required.';
    }

    if ($accountHolder === '') {
        $errors['accountHolder'] = 'Account Holder is required.';
    }

    $validAccountTypes = ['Savings', 'Current', 'Business'];
    if (!in_array($accountType, $validAccountTypes, true)) {
        $errors['accountType'] = 'Please select a valid Account Type.';
    }

    if ($balance === '' || !is_numeric($balance) || floatval($balance) < 0) {
        $errors['balance'] = 'Initial Balance must be a number greater than or equal to 0.';
    }

    if (!preg_match('/^[A-Z]{3}$/', $currency)) {
        $errors['currency'] = 'Currency must be exactly 3 uppercase letters.';
    }

    if ($branch === '') {
        $errors['branch'] = 'Branch is required.';
    }

    // If no validation errors, proceed with API call
    if (empty($errors)) {
        $payload = [
            'accountNumber' => $accountNumber,
            'accountHolder' => $accountHolder,
            'accountType'   => $accountType,
            'balance'       => floatval($balance),
            'currency'      => $currency,
            'branch'        => $branch,
            'ifscCode'      => $ifscCode,
            'status'        => $status,
        ];

        [$createStatus, $response] = apiPost('/accounts', $payload);
        $actionMessage = $response['message'] ?? ($createStatus === 200 ? 'Account created successfully.' : 'Account creation failed.');
    }
}
?>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow-lg">
                <div class="card-body">
                    <h2 class="mb-4 fw-bold text-center">
                        <i class="bi bi-person-plus-fill me-2"></i> Create New Account
                    </h2>

                    <?php if ($createStatus !== null): ?>
                        <div class="alert alert-<?= $createStatus === 200 ? 'success' : 'danger' ?> alert-dismissible fade show" role="alert">
                            <strong>
                                <i class="bi <?= $createStatus === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill' ?> me-2"></i>
                                <?= $createStatus === 200 ? 'Success:' : 'Error:' ?>
                            </strong> <?= htmlspecialchars($actionMessage) ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <?php endif; ?>


                    <form method="post" novalidate>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="accountNumber" class="form-label">
                                    <i class="bi bi-hash me-1"></i> Account Number
                                </label>
                                <input
                                    type="text"
                                    class="form-control <?= isset($errors['accountNumber']) ? 'is-invalid' : '' ?>"
                                    id="accountNumber"
                                    name="accountNumber"
                                    required
                                    value="<?= htmlspecialchars($_POST['accountNumber'] ?? '') ?>"
                                >
                                <?php if (isset($errors['accountNumber'])): ?>
                                    <div class="invalid-feedback"><?= htmlspecialchars($errors['accountNumber']) ?></div>
                                <?php endif; ?>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="accountHolder" class="form-label">
                                    <i class="bi bi-person-fill me-1"></i> Account Holder
                                </label>
                                <input
                                    type="text"
                                    class="form-control <?= isset($errors['accountHolder']) ? 'is-invalid' : '' ?>"
                                    id="accountHolder"
                                    name="accountHolder"
                                    required
                                    value="<?= htmlspecialchars($_POST['accountHolder'] ?? '') ?>"
                                >
                                <?php if (isset($errors['accountHolder'])): ?>
                                    <div class="invalid-feedback"><?= htmlspecialchars($errors['accountHolder']) ?></div>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="accountType" class="form-label">
                                    <i class="bi bi-card-list me-1"></i> Account Type
                                </label>
                                <select
                                    class="form-select <?= isset($errors['accountType']) ? 'is-invalid' : '' ?>"
                                    id="accountType"
                                    name="accountType"
                                    required
                                >
                                    <option value="" disabled <?= !isset($_POST['accountType']) ? 'selected' : '' ?>>Select type</option>
                                    <option value="Savings" <?= ($_POST['accountType'] ?? '') === 'Savings' ? 'selected' : '' ?>>Savings</option>
                                    <option value="Current" <?= ($_POST['accountType'] ?? '') === 'Current' ? 'selected' : '' ?>>Current</option>
                                    <option value="Business" <?= ($_POST['accountType'] ?? '') === 'Business' ? 'selected' : '' ?>>Business</option>
                                </select>
                                <?php if (isset($errors['accountType'])): ?>
                                    <div class="invalid-feedback"><?= htmlspecialchars($errors['accountType']) ?></div>
                                <?php endif; ?>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="balance" class="form-label">
                                    <i class="bi bi-cash-stack me-1"></i> Initial Balance
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    class="form-control <?= isset($errors['balance']) ? 'is-invalid' : '' ?>"
                                    id="balance"
                                    name="balance"
                                    required
                                    value="<?= htmlspecialchars($_POST['balance'] ?? '') ?>"
                                >
                                <?php if (isset($errors['balance'])): ?>
                                    <div class="invalid-feedback"><?= htmlspecialchars($errors['balance']) ?></div>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label for="currency" class="form-label">
                                    <i class="bi bi-currency-exchange me-1"></i> Currency
                                </label>
                                <input
                                    type="text"
                                    maxlength="3"
                                    class="form-control <?= isset($errors['currency']) ? 'is-invalid' : '' ?>"
                                    id="currency"
                                    name="currency"
                                    placeholder="e.g. USD"
                                    required
                                    value="<?= htmlspecialchars($_POST['currency'] ?? '') ?>"
                                >
                                <?php if (isset($errors['currency'])): ?>
                                    <div class="invalid-feedback"><?= htmlspecialchars($errors['currency']) ?></div>
                                <?php endif; ?>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label for="branch" class="form-label">
                                    <i class="bi bi-building me-1"></i> Branch
                                </label>
                                <input
                                    type="text"
                                    class="form-control <?= isset($errors['branch']) ? 'is-invalid' : '' ?>"
                                    id="branch"
                                    name="branch"
                                    required
                                    value="<?= htmlspecialchars($_POST['branch'] ?? '') ?>"
                                >
                                <?php if (isset($errors['branch'])): ?>
                                    <div class="invalid-feedback"><?= htmlspecialchars($errors['branch']) ?></div>
                                <?php endif; ?>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label for="ifscCode" class="form-label">
                                    <i class="bi bi-upc-scan me-1"></i> IFSC Code
                                </label>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="ifscCode"
                                    name="ifscCode"
                                    value="<?= htmlspecialchars($_POST['ifscCode'] ?? '') ?>"
                                >
                            </div>
                        </div>

                        <div class="mb-4">
                            <label for="status" class="form-label">
                                <i class="bi bi-toggle-on me-1"></i> Status
                            </label>
                            <select class="form-select" id="status" name="status" required>
                                <option value="Active" <?= ($_POST['status'] ?? '') === 'Active' ? 'selected' : '' ?>>Active</option>
                                <option value="Inactive" <?= ($_POST['status'] ?? '') === 'Inactive' ? 'selected' : '' ?>>Inactive</option>
                            </select>
                        </div>

                        <div class="d-flex justify-content-between">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-plus-circle me-2"></i> Create Account
                            </button>
                            <a href="/accounts" class="btn btn-secondary">
                                <i class="bi bi-arrow-left-circle me-2"></i> Back to Accounts
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
