<?php
require_once '../includes/header.php';

$title = "Account Summary";

// Fetch summary data
[$status, $summary] = apiGet('/accounts/summary');
?>

<div class="container my-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">
            <i class="bi bi-graph-up-arrow me-3" style="font-size: 2.5rem;" aria-hidden="true"></i>
            <?= htmlspecialchars($title) ?>
        </h2>
        <p class="text-muted fs-5">Overview of all accounts and balances</p>
    </div>

    <?php if ($status !== 200): ?>
        <div class="alert alert-danger alert-dismissible fade show text-center" role="alert">
            <strong>Oops!</strong> Failed to load summary data. Please try again later.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php else: ?>
        <div class="row g-4 justify-content-center">

            <!-- Total Accounts -->
            <div class="col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow border-0 h-100">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-4 mb-3">
                            <i class="bi bi-people-fill text-primary" style="font-size: 3rem;" aria-hidden="true"></i>
                        </div>
                        <h5 class="card-title fw-semibold mb-2">Total Accounts</h5>
                        <p class="display-4 text-dark mb-0"><?= htmlspecialchars($summary['totalAccounts']) ?></p>
                    </div>
                </div>
            </div>

            <!-- Total Balance by Currency -->
            <div class="col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow border-0 h-100">
                    <div class="card-body">
                        <div class="text-success text-center mb-4">
                            <i class="bi bi-currency-dollar" style="font-size: 3rem;" aria-hidden="true"></i>
                        </div>
                        <h5 class="card-title fw-semibold text-center mb-3">Balance by Currency</h5>
                        <ul class="list-group list-group-flush fs-5">
                            <?php foreach ($summary['totalBalanceByCurrency'] as $currency => $amount): ?>
                                <li class="list-group-item d-flex justify-content-between border-0 px-0 py-2">
                                    <span class="text-muted"><?= htmlspecialchars($currency) ?></span>
                                    <span class="fw-bold"><?= number_format($amount, 2) ?></span>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Accounts by Type -->
            <div class="col-sm-8 col-md-6 col-lg-4">
                <div class="card shadow border-0 h-100">
                    <div class="card-body">
                        <div class="text-info text-center mb-4">
                            <i class="bi bi-wallet2" style="font-size: 3rem;" aria-hidden="true"></i>
                        </div>
                        <h5 class="card-title fw-semibold text-center mb-3">Accounts by Type</h5>
                        <ul class="list-group list-group-flush fs-5">
                            <?php foreach ($summary['byType'] as $type => $count): ?>
                                <li class="list-group-item d-flex justify-content-between border-0 px-0 py-2">
                                    <span class="text-muted"><?= htmlspecialchars($type) ?></span>
                                    <span class="fw-bold"><?= htmlspecialchars($count) ?></span>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>
