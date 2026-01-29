<?php
require_once '../includes/header.php';

$title = "Accounts";

// Handle delete
$deleteStatus = null;
$deleteMessage = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accountNumber'])) {
    [$delStatus, $delResponse] = apiDelete('/accounts/' . urlencode($_POST['accountNumber']));
    $deleteStatus = $delStatus;
    $deleteMessage = $delResponse['message'] ?? ($delStatus === 200 ? 'Account deleted successfully.' : 'Failed to delete account.');
}

// Handle search filters
$selectedType = $_GET['accountType'] ?? '';
$selectedBranch = $_GET['branch'] ?? '';
$recentDays = $_GET['recentDays'] ?? '';

// Fetch accounts based on the selected filter
if ($recentDays !== '') {
    [$status, $accounts] = apiGet('/accounts/recent?days=' . urlencode($recentDays));
} elseif ($selectedType !== '' || $selectedBranch !== '') {
    $queryParams = [];
    if ($selectedType !== '') $queryParams['accountType'] = $selectedType;
    if ($selectedBranch !== '') $queryParams['branch'] = $selectedBranch;
    $query = http_build_query($queryParams);
    [$status, $accounts] = apiGet('/accounts/search?' . $query);
} else {
    [$status, $accounts] = apiGet('/accounts');
}

// Fetch dropdown options for dynamic filters
[$_, $allAccounts] = apiGet('/accounts');
$accountTypes = array_unique(array_column($allAccounts, 'accountType'));
$branches = array_unique(array_column($allAccounts, 'branch'));
?>

<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold mb-0">
            <i class="bi bi-wallet2 me-2"></i>
            <?= htmlspecialchars($title) ?>
        </h2>
        <a href="/create-account" class="btn btn-primary btn-hover-grow">
            <i class="bi bi-plus-circle me-2"></i> Create Account
        </a>
    </div>

    <?php if ($deleteStatus !== null): ?>
        <div class="alert alert-<?= $deleteStatus === 200 ? 'success' : 'danger' ?> alert-dismissible fade show shadow-sm" role="alert">
            <strong><?= $deleteStatus === 200 ? 'Success:' : 'Error:' ?></strong> <?= htmlspecialchars($deleteMessage) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <!-- Filter Cards -->
    <div class="row g-4 mb-4">
        <div class="col-lg-6">
            <div class="card shadow-sm hover-scale">
                <div class="card-body">
                    <h5 class="card-title mb-3">
                        <i class="bi bi-funnel me-2"></i>Filter Accounts
                    </h5>
                    <form method="get">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="accountType" class="form-label">Account Type</label>
                                <select name="accountType" id="accountType" class="form-select">
                                    <option value="">All Types</option>
                                    <?php foreach ($accountTypes as $type): ?>
                                        <option value="<?= htmlspecialchars($type) ?>" <?= $selectedType === $type ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($type) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="branch" class="form-label">Branch</label>
                                <select name="branch" id="branch" class="form-select">
                                    <option value="">All Branches</option>
                                    <?php foreach ($branches as $branch): ?>
                                        <option value="<?= htmlspecialchars($branch) ?>" <?= $selectedBranch === $branch ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($branch) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-primary w-100 btn-hover-grow">
                                    <i class="bi bi-filter me-2"></i>Apply Filters
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-6">
            <div class="card shadow-sm hover-scale">
                <div class="card-body">
                    <h5 class="card-title mb-3">
                        <i class="bi bi-clock-history me-2"></i>Recent Accounts
                    </h5>
                    <form method="get">
                        <div class="row g-3">
                            <div class="col-md-8">
                                <label for="recentDays" class="form-label">Number of Days</label>
                                <input type="number" min="1" name="recentDays" id="recentDays" class="form-control" 
                                       value="<?= htmlspecialchars($recentDays) ?>" placeholder="Enter days">
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button type="submit" class="btn btn-dark w-100 btn-hover-grow">
                                    <i class="bi bi-search me-2"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Results Section -->
    <?php if ($status !== 200): ?>
        <div class="card shadow-sm hover-scale">
            <div class="card-body">
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error:</strong> <?= htmlspecialchars($accounts['error'] ?? 'Unable to fetch accounts.') ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        </div>
    <?php elseif (empty($accounts)): ?>
        <div class="card shadow-sm hover-scale">
            <div class="card-body text-center py-5">
                <i class="bi bi-wallet2 text-muted" style="font-size: 3rem;"></i>
                <h4 class="mt-3">No Accounts Found</h4>
                <p class="text-muted">Try adjusting your filters or create a new account</p>
                <a href="/create-account" class="btn btn-primary mt-2 btn-hover-grow">
                    <i class="bi bi-plus-circle me-2"></i>Create Account
                </a>
            </div>
        </div>
    <?php else: ?>
        <div class="card shadow-sm hover-scale">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Account No</th>
                                <th>Holder</th>
                                <th>Type</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($accounts as $index => $account): ?>
                                <tr class="hover-raise">
                                    <td class="fw-semibold"><?= $index + 1 ?></td>
                                    <td><?= htmlspecialchars($account['accountNumber'] ?? '-') ?></td>
                                    <td><?= htmlspecialchars($account['accountHolder'] ?? '-') ?></td>
                                    <td><?= htmlspecialchars($account['accountType'] ?? '-') ?></td>
                                    <td class="fw-semibold">
                                        <?= number_format($account['balance'] ?? 0, 2) ?>
                                        <span class="text-muted"><?= htmlspecialchars($account['currency'] ?? '') ?></span>
                                    </td>
                                    <td>
                                        <span class="badge rounded-pill <?= ($account['status'] ?? '') === 'Active' ? 'bg-success' : 'bg-secondary' ?>">
                                            <?= htmlspecialchars($account['status'] ?? '-') ?>
                                        </span>
                                    </td>
                                    <td>
                                        <div class="d-flex gap-2">
                                            <a href="/account-details/<?= urlencode($account['accountNumber']) ?>" 
                                               class="btn btn-sm btn-outline-primary action-btn" 
                                               data-bs-toggle="tooltip" 
                                               data-bs-title="View Details">
                                                <i class="bi bi-eye"></i>
                                            </a>
                                            <a href="/edit-account/<?= urlencode($account['accountNumber']) ?>" 
                                               class="btn btn-sm btn-outline-secondary action-btn" 
                                               data-bs-toggle="tooltip" 
                                               data-bs-title="Edit Account">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                            <button type="button" 
                                                    class="btn btn-sm btn-outline-danger action-btn" 
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#deleteModal<?= $index ?>"
                                                    data-bs-title="Delete Account">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                            <a href="/transfer/<?= urlencode($account['accountNumber']) ?>" 
                                               class="btn btn-sm btn-outline-warning action-btn" 
                                               data-bs-toggle="tooltip" 
                                               data-bs-title="Transfer">
                                                <i class="bi bi-arrow-left-right"></i>
                                            </a>
                                            <a href="/deposit/<?= urlencode($account['accountNumber']) ?>" 
                                               class="btn btn-sm btn-outline-success action-btn" 
                                               data-bs-toggle="tooltip" 
                                               data-bs-title="Deposit">
                                                <i class="bi bi-bank2"></i>
                                            </a>
                                            <a href="/withdraw/<?= urlencode($account['accountNumber']) ?>" 
                                               class="btn btn-sm btn-outline-dark action-btn" 
                                               data-bs-toggle="tooltip" 
                                               data-bs-title="Withdraw">
                                                <i class="bi bi-cash-stack"></i>
                                            </a>
                                        </div>

                                        <!-- Delete Modal -->
                                        <div class="modal fade" id="deleteModal<?= $index ?>" tabindex="-1" aria-hidden="true">
                                            <div class="modal-dialog">
                                                <div class="modal-content">
                                                    <div class="modal-header bg-danger text-white">
                                                        <h5 class="modal-title">Confirm Deletion</h5>
                                                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <p>Are you sure you want to delete account <strong><?= htmlspecialchars($account['accountNumber']) ?></strong>?</p>
                                                        <p class="text-danger">This action cannot be undone.</p>
                                                    </div>
                                                    <div class="modal-footer">
                                                        <form method="post">
                                                            <input type="hidden" name="accountNumber" value="<?= htmlspecialchars($account['accountNumber']) ?>">
                                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                            <button type="submit" class="btn btn-danger">Delete Account</button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<style>
    /* Hover animations */
    .btn-hover-grow {
        transition: all 0.3s ease;
    }
    .btn-hover-grow:hover {
        transform: scale(1.05);
    }
    
    .hover-scale {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .hover-raise {
        transition: transform 0.2s ease;
    }

    
    .action-btn {
        transition: all 0.2s ease;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px !important;
    }
</style>
<br/>
<br/>
<?php require_once '../includes/footer.php'; ?>