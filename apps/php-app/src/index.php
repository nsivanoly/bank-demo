<?php require_once 'includes/header.php'; ?>

<!-- Hero Banner -->
<section class="bg-light text-center py-5">
    <div class="container">
        <div class="mb-4">
            <!-- Modern Bank Logo -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100">
                <path fill="currentColor" d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z"/>
                <path fill="currentColor" d="M11 12.5L3 9v10h2v-5h4v5h2v-7.5zM17 15h2v4h-2v-4z"/>
            </svg>
        </div>
        <h1 class="display-5 fw-bold">Welcome to MyBank</h1>
        <p class="lead text-muted">Empowering your financial journey with simplicity, speed, and security.</p>
        
        <!-- Authentication Provider Selection Card -->
        <?php if (!isset($username) || !$username): ?>
            <div class="row justify-content-center mt-5">
                <div class="col-lg-8 col-xl-7">
                    <div class="auth-selection-card">
                        <!-- Decorative gradient border -->
                        <div class="auth-card-border"></div>
                        
                        <div class="auth-card-content">
                            <!-- Icon Header -->
                            <div class="auth-card-icon-wrapper">
                                <div class="auth-card-icon">
                                    <i class="bi bi-shield-lock-fill"></i>
                                </div>
                            </div>
                            
                            <!-- Content -->
                            <h3 class="auth-card-title">
                                Choose Your Authentication Method
                            </h3>
                            <p class="auth-card-description">
                                Select your preferred authentication provider to securely access MyBank's services. 
                                Your current selection will be saved for future sessions.
                            </p>
                            
                            <!-- Current Selection Badge -->
                            <div class="current-auth-badge">
                                <span class="badge-label">Current Provider:</span>
                                <span class="badge-value">
                                    <i class="bi bi-check-circle-fill me-2"></i>
                                    <?php 
                                        $currentAuth = getSelectedAuthType();
                                        $authOptions = getAuthOptions();
                                        foreach ($authOptions as $opt) {
                                            if ($opt['value'] === $currentAuth) {
                                                echo htmlspecialchars($opt['label']);
                                                break;
                                            }
                                        }
                                    ?>
                                </span>
                            </div>
                            
                            <!-- Action Button -->
                            <button 
                                type="button" 
                                class="btn auth-selector-btn" 
                                data-bs-toggle="modal" 
                                data-bs-target="#authSelectorModal"
                            >
                                <span class="btn-icon-left">
                                    <i class="bi bi-gear-fill"></i>
                                </span>
                                <span class="btn-text">Select Authentication Provider</span>
                                <span class="btn-icon-right">
                                    <i class="bi bi-arrow-right"></i>
                                </span>
                            </button>
                            
                            <!-- Security Note -->
                            <div class="security-note">
                                <i class="bi bi-info-circle me-2"></i>
                                <span>All authentication methods use industry-standard security protocols</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>

<style>
/* Authentication Selection Card Styles */
.auth-selection-card {
    position: relative;
    background: white;
    border-radius: 24px;
    padding: 3px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.auth-card-border {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.8;
    animation: borderRotate 3s linear infinite;
}

@keyframes borderRotate {
    0% {
        filter: hue-rotate(0deg);
    }
    100% {
        filter: hue-rotate(360deg);
    }
}

.auth-card-content {
    position: relative;
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
    border-radius: 21px;
    padding: 48px 40px;
    text-align: center;
    z-index: 1;
}

.auth-card-icon-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
}

.auth-card-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: white;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

.auth-card-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.auth-card-description {
    font-size: 1rem;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 28px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.current-auth-badge {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: white;
    padding: 12px 24px;
    border-radius: 16px;
    margin-bottom: 28px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    border: 2px solid rgba(102, 126, 234, 0.2);
}

.badge-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.badge-value {
    font-size: 1rem;
    color: #667eea;
    font-weight: 700;
    display: flex;
    align-items: center;
}

.auth-selector-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 16px 40px;
    font-size: 1.1rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.35);
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
}

.auth-selector-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s ease;
}

.auth-selector-btn:hover::before {
    left: 100%;
}

.auth-selector-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
}

.auth-selector-btn:active {
    transform: translateY(-1px);
}

.btn-icon-left, .btn-icon-right {
    font-size: 1.2rem;
    display: flex;
    align-items: center;
}

.btn-text {
    flex: 1;
}

.security-note {
    display: inline-flex;
    align-items: center;
    font-size: 0.875rem;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
    .auth-card-content {
        padding: 32px 24px;
    }
    
    .auth-card-icon {
        width: 64px;
        height: 64px;
        font-size: 32px;
    }
    
    .auth-card-title {
        font-size: 1.5rem;
    }
    
    .auth-card-description {
        font-size: 0.95rem;
    }
    
    .auth-selector-btn {
        width: 100%;
        padding: 14px 24px;
        font-size: 1rem;
    }
    
    .current-auth-badge {
        flex-direction: column;
        gap: 8px;
        text-align: center;
    }
}
</style>

<!-- Features Grid -->
<section class="py-5 bg-white">
    <div class="container">
        <div class="row g-4 row-cols-1 row-cols-md-2 row-cols-lg-3">
            <!-- Feature: View Accounts -->
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                    <div class="mb-3 text-primary">
                        <i class="bi bi-wallet2 display-4"></i>
                    </div>
                    <h4 class="text-dark fw-semibold">Manage Accounts</h4>
                    <p class="text-muted">View balances and transaction details across all your accounts in one place.</p>
                </div>
            </div>

            <!-- Feature: Create New Account -->
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                    <div class="mb-3 text-success">
                        <i class="bi bi-plus-circle display-4"></i>
                    </div>
                    <h4 class="text-dark fw-semibold">Open New Account</h4>
                    <p class="text-muted">Easily create checking, savings, or other account types in seconds.</p>
                </div>
            </div>

            <!-- Feature: Transfer Funds -->
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                    <div class="mb-3 text-info">
                        <i class="bi bi-arrow-left-right display-4"></i>
                    </div>
                    <h4 class="text-dark fw-semibold">Transfer Funds</h4>
                    <p class="text-muted">Send money between your accounts or to other users securely and instantly.</p>
                </div>
            </div>

            <!-- Feature: Make Deposits -->
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                    <div class="mb-3 text-warning">
                        <i class="bi bi-bank2 display-4"></i>
                    </div>
                    <h4 class="text-dark fw-semibold">Deposit Money</h4>
                    <p class="text-muted">Add funds to your account through quick and simple deposit operations.</p>
                </div>
            </div>

            <!-- Feature: Withdraw Funds -->
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                    <div class="mb-3 text-danger">
                        <i class="bi bi-cash-stack display-4"></i>
                    </div>
                    <h4 class="text-dark fw-semibold">Withdraw Cash</h4>
                    <p class="text-muted">Withdraw funds directly from your account anytime, anywhere.</p>
                </div>
            </div>

            <!-- Feature: Financial Summary -->
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                    <div class="mb-3 text-secondary">
                        <i class="bi bi-graph-up-arrow display-4"></i>
                    </div>
                    <h4 class="text-dark fw-semibold">Track Your Finances</h4>
                    <p class="text-muted">Get a complete overview of your financial health with real-time analytics.</p>
                </div>
            </div>
        </div>
    </div>
</section>



<!-- Call to Action -->
<section class="py-5 bg-light text-center">
    <div class="container">
        <h2 class="fw-bold text-dark">Join thousands of customers who trust MyBank</h2>
        <p class="lead text-muted">Bank smarter. Bank safer. Bank with confidence.</p>
        <?php if (AUTH_ENABLED && $username): ?>
            <a href="/logout" class="btn btn-primary btn-lg rounded-pill mt-3 px-4 py-2" disabled>Logout</a>
        <?php else: ?>
            <a href="/login" class="btn btn-primary btn-lg rounded-pill mt-3 px-4 py-2" disabled>Get Started (Demo Mode)</a>
        <?php endif; ?>
    </div>
</section>

<!-- Include Auth Selector Modal (required for dropdown functionality) -->
<?php require_once 'includes/auth-selector.php'; ?>

<?php require_once 'includes/footer.php'; ?>
