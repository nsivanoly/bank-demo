<?php
require_once '../includes/header.php';

$accountNumber = $_GET['accountNumber'] ?? null;
$editStatus = null;
$actionMessage = null;

if (!$accountNumber) {
    header('Location: /accounts');
    exit;
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = [
        'accountHolder' => trim($_POST['accountHolder']),
        'status'        => $_POST['status']
    ];

    [$editStatus, $response] = apiPut('/accounts/' . urlencode($accountNumber), $payload);
    $actionMessage = $response['message'] ?? ($editStatus === 200 ? 'Account updated successfully.' : 'Update failed.');
}

// Fetch current account data
[$status, $account] = apiGet('/accounts/' . urlencode($accountNumber));
?>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow-lg">
                <div class="card-body">
                    <h2 class="mb-4 text-center fw-bold">
                        <i class="bi bi-pencil-square me-2"></i>Edit Account #<?= htmlspecialchars($accountNumber) ?>
                    </h2>

                    <?php if ($editStatus !== null): ?>
                        <div class="alert alert-<?= $editStatus === 200 ? 'success' : 'danger' ?> alert-dismissible fade show" role="alert">
                            <strong>
                                <i class="bi <?= $editStatus === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill' ?> me-1"></i>
                                <?= $editStatus === 200 ? 'Success:' : 'Error:' ?>
                            </strong> <?= htmlspecialchars($actionMessage) ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <?php endif; ?>

                    <?php if ($status !== 200): ?>
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <strong><i class="bi bi-exclamation-triangle-fill me-1"></i>Error:</strong> <?= htmlspecialchars($account['error'] ?? 'Account not found.') ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                        <div class="d-flex justify-content-end">
                            <a href="/accounts" class="btn btn-secondary">
                                <i class="bi bi-arrow-left-circle me-1"></i> Back to Accounts
                            </a>
                        </div>
                    <?php else: ?>
                        <form method="post" novalidate>
                            <div class="mb-3">
                                <label for="accountHolder" class="form-label">
                                    <i class="bi bi-person-fill me-1"></i> Account Holder
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="accountHolder" 
                                    name="accountHolder" 
                                    value="<?= htmlspecialchars($account['accountHolder']) ?>" 
                                    required
                                >
                            </div>
                            
                            <div class="mb-4">
                                <label for="status" class="form-label">
                                    <i class="bi bi-toggle-on me-1"></i> Status
                                </label>
                                <select 
                                    id="status" 
                                    name="status" 
                                    class="form-select" 
                                    required
                                >
                                    <option value="Active" <?= $account['status'] === 'Active' ? 'selected' : '' ?>>Active</option>
                                    <option value="Inactive" <?= $account['status'] === 'Inactive' ? 'selected' : '' ?>>Inactive</option>
                                </select>
                            </div>
                            
                            <div class="d-flex justify-content-between">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-save me-1"></i> Save Changes
                                </button>
                                <a href="/accounts" class="btn btn-secondary">
                                    <i class="bi bi-arrow-left-circle me-1"></i> Back to Accounts
                                </a>
                            </div>
                        </form>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>
<br/><br/>

<?php require_once '../includes/footer.php'; ?>
