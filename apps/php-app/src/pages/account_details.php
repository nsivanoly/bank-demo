<?php
require_once '../includes/header.php';

$accountNumber = $_GET['accountNumber'] ?? null;

// Fetch single account
[$status, $account] = apiGet('/accounts/' . urlencode($accountNumber));
?>

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-body">
                    <h2 class="mb-4 fw-bold text-center">
                        <i class="bi bi-info-circle-fill me-2"></i>Account Details
                    </h2>

                    <?php if ($status !== 200): ?>
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <strong><i class="bi bi-exclamation-triangle-fill me-2"></i>Error:</strong>
                            <?= htmlspecialchars($account['error'] ?? 'Account not found.') ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                        <div class="d-flex justify-content-center mt-3">
                            <a href="/accounts" class="btn btn-secondary">
                                <i class="bi bi-arrow-left-circle me-2"></i> Back to Accounts
                            </a>
                        </div>
                    <?php else: ?>
                        <div class="account-details">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h3 class="fw-semibold mb-0">
                                    <i class="bi bi-wallet2 me-2"></i>
                                    Account #<?= htmlspecialchars($account['accountNumber']) ?>
                                </h3>
                                <span class="badge rounded-pill <?= $account['status'] === 'Active' ? 'bg-success' : 'bg-secondary' ?> fs-6">
                                    <?= htmlspecialchars($account['status']) ?>
                                </span>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="detail-item mb-3">
                                        <h6 class="text-muted mb-1">
                                            <i class="bi bi-person-fill me-1"></i> Account Holder
                                        </h6>
                                        <p class="fs-5 fw-semibold"><?= htmlspecialchars($account['accountHolder']) ?></p>
                                    </div>

                                    <div class="detail-item mb-3">
                                        <h6 class="text-muted mb-1">
                                            <i class="bi bi-card-list me-1"></i> Account Type
                                        </h6>
                                        <p class="fs-5 fw-semibold"><?= htmlspecialchars($account['accountType']) ?></p>
                                    </div>

                                    <div class="detail-item mb-3">
                                        <h6 class="text-muted mb-1">
                                            <i class="bi bi-building me-1"></i> Branch
                                        </h6>
                                        <p class="fs-5 fw-semibold"><?= htmlspecialchars($account['branch']) ?></p>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="detail-item mb-3">
                                        <h6 class="text-muted mb-1">
                                            <i class="bi bi-cash-stack me-1"></i> Current Balance
                                        </h6>
                                        <p class="fs-5 fw-semibold">
                                            <?= number_format($account['balance'], 2) ?>
                                            <span class="text-muted"><?= htmlspecialchars($account['currency']) ?></span>
                                        </p>
                                    </div>

                                    <div class="detail-item mb-3">
                                        <h6 class="text-muted mb-1">
                                            <i class="bi bi-upc-scan me-1"></i> IFSC Code
                                        </h6>
                                        <p class="fs-5 fw-semibold"><?= htmlspecialchars($account['ifscCode']) ?></p>
                                    </div>

                                    <div class="detail-item mb-3">
                                        <h6 class="text-muted mb-1">
                                            <i class="bi bi-calendar-event me-1"></i> Created Date
                                        </h6>
                                        <p class="fs-5 fw-semibold"><?= htmlspecialchars($account['createdDate']) ?></p>
                                    </div>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between mt-4">
                                <a href="/edit-account/<?= urlencode($account['accountNumber']) ?>" class="btn btn-primary">
                                    <i class="bi bi-pencil-square me-2"></i> Edit Account
                                </a>
                                <a href="/accounts" class="btn btn-secondary">
                                    <i class="bi bi-arrow-left-circle me-2"></i> Back to Accounts
                                </a>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>
<br/><br/>

<?php require_once '../includes/footer.php'; ?>
