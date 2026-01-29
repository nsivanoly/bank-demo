</div> <!-- End of .container -->
<footer class="footer bg-dark pt-5 pb-4">
    <div class="container">
        <div class="row g-4">
            <!-- Branding Column -->
            <div class="col-lg-4 mb-4">
                <div class="footer-brand d-flex align-items-center mb-3">
                    <div class="bank-logo me-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                            <path fill="currentColor" d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z"/>
                            <path fill="currentColor" d="M11 12.5L3 9v10h2v-5h4v5h2v-7.5zM17 15h2v4h-2v-4z"/>
                        </svg>
                    </div>
                    <span class="brand-text fs-5 fw-bold">MyBank</span>
                </div>
                <p class="footer-text text-white-50 mb-3">Your trusted financial partner for secure and innovative banking solutions.</p>
                <div class="social-links">
                    <a href="#" class="social-icon me-2">
                        <i class="bi bi-facebook"></i>
                    </a>
                    <a href="#" class="social-icon me-2">
                        <i class="bi bi-twitter"></i>
                    </a>
                    <a href="#" class="social-icon me-2">
                        <i class="bi bi-linkedin"></i>
                    </a>
                    <a href="#" class="social-icon">
                        <i class="bi bi-instagram"></i>
                    </a>
                </div>
            </div>

            <!-- Quick Links Column -->
            <div class="col-lg-2 col-md-4 mb-4">
                <h5 class="footer-heading mb-3">Services</h5>
                <ul class="footer-links list-unstyled">
                    <li class="mb-2"><a href="/accounts" class="footer-link">Accounts</a></li>
                    <li class="mb-2"><a href="/transfer" class="footer-link">Transfers</a></li>
                    <li class="mb-2"><a href="/deposit" class="footer-link">Deposits</a></li>
                    <li class="mb-2"><a href="/withdraw" class="footer-link">Withdrawals</a></li>
                    <li><a href="/summary" class="footer-link">Reports</a></li>
                </ul>
            </div>

            <!-- Support Column -->
            <div class="col-lg-2 col-md-4 mb-4">
                <h5 class="footer-heading mb-3">Support</h5>
                <ul class="footer-links list-unstyled">
                    <li class="mb-2"><a href="#" class="footer-link">Help Center</a></li>
                    <li class="mb-2"><a href="#" class="footer-link">Contact Us</a></li>
                    <li class="mb-2"><a href="#" class="footer-link">Security</a></li>
                    <li><a href="#" class="footer-link">FAQs</a></li>
                    <li><a href="/chat" class="footer-link"><i class="bi bi-chat-dots-fill ms-2"></i> Live Chat</a></li>
                </ul>
            </div>

            <!-- Legal Column with Auth Mode Dropdown -->
            <div class="col-lg-2 col-md-4 mb-4">
                <h5 class="footer-heading mb-3">Legal</h5>
                <ul class="footer-links list-unstyled mb-3">
                    <li class="mb-2"><a href="#" class="footer-link">Privacy Policy</a></li>
                    <li class="mb-2"><a href="#" class="footer-link">Terms of Use</a></li>
                    <li class="mb-2"><a href="#" class="footer-link">Compliance</a></li>
                    <li><a href="#" class="footer-link">Disclosures</a></li>
                </ul>
            </div>

            <!-- Contact Column -->
            <div class="col-lg-2 mb-4">
                <h5 class="footer-heading mb-3">Contact</h5>
                <ul class="footer-contacts list-unstyled">
                    <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-geo-alt-fill me-2 mt-1"></i>
                        <span>123 Finance St, Banking City</span>
                    </li>
                    <li class="mb-2 d-flex align-items-start">
                        <i class="bi bi-telephone-fill me-2 mt-1"></i>
                        <span>1-800-MYBANK</span>
                    </li>
                    <li class="d-flex align-items-start">
                        <i class="bi bi-envelope-fill me-2 mt-1"></i>
                        <span>support@mybank.com</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Copyright Section -->
        <div class="footer-copyright text-center pt-3 mt-3 border-top border-secondary">
            <p class="small text-white-50 mb-0">
                © <?= date('Y') ?> MyBank. All rights reserved. 
                <span class="d-block d-sm-inline-block mt-1 mt-sm-0">Member FDIC. Equal Housing Lender.</span>
            </p>
        </div>
    </div>
</footer>

<!-- Bootstrap JS Bundle with Popper -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>
