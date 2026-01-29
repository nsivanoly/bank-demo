<?php
/**
 * Authentication Provider Selector Component
 * 
 * Displays a modal dialog for users to select their preferred authentication
 * provider. Changes are persisted in the session and applied on page reload.
 * 
 * This component mirrors the React version in the bank-app with PHP/Bootstrap
 * styling and session-based storage instead of localStorage.
 * 
 * NOTE: POST handler is in config.php to ensure it runs before any HTML output
 */

if (!function_exists('getSelectedAuthType')) {
    require_once __DIR__ . '/config.php';
}

$currentAuth = getSelectedAuthType();
$authOptions = getAuthOptions();
?>

<!-- Authentication Provider Selector Modal -->
<div class="modal fade" id="authSelectorModal" tabindex="-1" aria-labelledby="authSelectorLabel" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content auth-modal-content">
            <div class="modal-header auth-modal-header">
                <div class="d-flex align-items-center">
                    <div class="auth-icon-wrapper me-3">
                        <i class="bi bi-shield-lock-fill"></i>
                    </div>
                    <h5 class="modal-title mb-0" id="authSelectorLabel">
                        Select Authentication Provider
                    </h5>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body auth-modal-body">
                <p class="text-muted text-center mb-3 small">Choose your preferred authentication method</p>
                
                <div class="auth-options-list" id="authOptionsContainer">
                    <?php foreach ($authOptions as $index => $option): 
                        $isSelected = $option['value'] === $currentAuth;
                        $icon = getAuthIcon($option['value']);
                    ?>
                        <div class="auth-option-item <?php echo $isSelected ? 'selected' : ''; ?>" 
                             data-auth-type="<?php echo htmlspecialchars($option['value']); ?>"
                             style="animation-delay: <?php echo ($index * 60); ?>ms;">
                            <div class="auth-option-icon">
                                <i class="bi bi-<?php echo htmlspecialchars($icon); ?>"></i>
                            </div>
                            <div class="auth-option-content">
                                <div class="auth-option-title"><?php echo htmlspecialchars($option['label']); ?></div>
                                <div class="auth-option-desc"><?php echo htmlspecialchars($option['description']); ?></div>
                            </div>
                            <?php if ($isSelected): ?>
                                <div class="auth-option-badge">
                                    <i class="bi bi-check-circle-fill"></i>
                                </div>
                            <?php endif; ?>
                            <div class="auth-option-check">
                                <i class="bi bi-check-lg"></i>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <div class="modal-footer auth-modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    Cancel
                </button>
                <button type="button" class="btn btn-primary auth-btn-confirm" id="confirmAuthBtn" disabled>
                    <i class="bi bi-check-circle-fill me-2"></i>Apply Changes
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Auth Selector Button for Header/Navigation -->
<button 
    type="button" 
    class="btn btn-sm auth-selector-button" 
    data-bs-toggle="modal" 
    data-bs-target="#authSelectorModal"
    id="authSelectorBtn"
    title="Change authentication provider"
>
    <i class="bi bi-shield-lock-fill auth-btn-icon"></i>
    <span id="currentAuthLabel" class="auth-btn-label"><?php 
        $currentLabel = '';
        foreach ($authOptions as $opt) {
            if ($opt['value'] === $currentAuth) {
                $currentLabel = $opt['label'];
                break;
            }
        }
        echo htmlspecialchars($currentLabel);
    ?></span>
    <i class="bi bi-chevron-down auth-btn-chevron"></i>
</button>

<style>
/* ================================
   AUTHENTICATION MODAL STYLING
   ================================ */

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes slideInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes checkPop {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

/* Modal Content */
.auth-modal-content {
    border: none;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: fadeIn 0.3s ease;
}

/* Modal Header */
.auth-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1.25rem 1.5rem;
}

.auth-icon-wrapper {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
}

.auth-modal-header .modal-title {
    font-weight: 700;
    font-size: 1.15rem;
    color: white;
}

.btn-close-white {
    filter: brightness(0) invert(1);
    opacity: 0.8;
}

.btn-close-white:hover {
    opacity: 1;
}

/* Modal Body */
.auth-modal-body {
    padding: 1.5rem;
    background: #f8f9fa;
}

/* Auth Options List */
.auth-options-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.auth-option-item {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    opacity: 0;
    animation: slideInUp 0.4s ease forwards;
}

.auth-option-item:hover {
    border-color: #667eea;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.auth-option-item.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

/* Option Icon */
.auth-option-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.3rem;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

.auth-option-item:hover .auth-option-icon {
    transform: scale(1.05);
}

.auth-option-item.selected .auth-option-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* Option Content */
.auth-option-content {
    flex: 1;
    min-width: 0;
}

.auth-option-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
}

.auth-option-desc {
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Current Badge */
.auth-option-badge {
    color: #10b981;
    font-size: 1.2rem;
    flex-shrink: 0;
}

/* Check Mark */
.auth-option-check {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s ease;
}

.auth-option-item.selected .auth-option-check {
    opacity: 1;
    transform: scale(1);
    animation: checkPop 0.4s ease;
}

/* Modal Footer */
.auth-modal-footer {
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    padding: 1rem 1.5rem;
}

.auth-btn-confirm {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.auth-btn-confirm:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
}

.auth-btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Header Button */
.auth-selector-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.5rem 1rem;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.auth-selector-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(102, 126, 234, 0.4);
}

.auth-btn-icon {
    font-size: 1rem;
}

.auth-btn-chevron {
    font-size: 0.75rem;
    transition: transform 0.3s ease;
}

.auth-selector-button:hover .auth-btn-chevron {
    transform: translateY(2px);
}

/* Responsive */
@media (max-width: 576px) {
    .auth-modal-body {
        padding: 1rem;
    }
    
    .auth-option-item {
        padding: 0.875rem;
    }
    
    .auth-option-icon {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
    }
    
    .auth-option-title {
        font-size: 0.9rem;
    }
    
    .auth-option-desc {
        font-size: 0.75rem;
    }
}
</style>
<script>
document.addEventListener('DOMContentLoaded', function() {
    let selectedAuthType = '<?php echo htmlspecialchars($currentAuth); ?>';
    const confirmBtn = document.getElementById('confirmAuthBtn');
    
    // Handle auth option selection
    document.querySelectorAll('.auth-option-item').forEach(item => {
        item.addEventListener('click', function() {
            const authType = this.getAttribute('data-auth-type');
            
            // Remove selected class from all items
            document.querySelectorAll('.auth-option-item').forEach(i => {
                i.classList.remove('selected');
            });
            
            // Add selected class to clicked item
            this.classList.add('selected');
            selectedAuthType = authType;
            
            // Enable confirm button if different from current
            confirmBtn.disabled = (authType === '<?php echo htmlspecialchars($currentAuth); ?>');
        });
    });
    
    // Handle confirmation
    confirmBtn.addEventListener('click', function() {
        const formData = new FormData();
        formData.append('auth_type', selectedAuthType);
        
        fetch('<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal and reload page
                const modal = bootstrap.Modal.getInstance(document.getElementById('authSelectorModal'));
                modal.hide();
                
                // Update button label
                const authOptions = <?php echo json_encode($authOptions); ?>;
                const selectedOption = authOptions.find(opt => opt.value === selectedAuthType);
                if (selectedOption) {
                    document.getElementById('currentAuthLabel').textContent = selectedOption.label;
                }
                
                // Reload page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            } else {
                alert('Failed to update authentication provider:\n' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Request failed:', error);
            alert('Failed to update authentication provider. Check browser console for details.');
        });
    });
    
    // Disable confirm button if same as current on modal open
    const modal = document.getElementById('authSelectorModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            confirmBtn.disabled = true;
        });
    }
});
</script>
