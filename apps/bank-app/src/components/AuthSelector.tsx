import React, { useState, forwardRef, useImperativeHandle } from "react";
import { AUTH_OPTIONS, AuthType, getSelectedAuthType, setSelectedAuthType } from "../config";

interface AuthSelectorProps {
  onAuthTypeChange?: (authType: AuthType) => void;
}

export interface AuthSelectorHandle {
  openModal: () => void;
  closeModal: () => void;
}

export const AuthSelector = forwardRef<AuthSelectorHandle, AuthSelectorProps>(
  ({ onAuthTypeChange }, ref) => {
    const [selectedAuth, setSelectedAuth] = useState<AuthType>(getSelectedAuthType());
    const [showModal, setShowModal] = useState(false);

    useImperativeHandle(ref, () => ({
      openModal: () => setShowModal(true),
      closeModal: () => setShowModal(false),
    }));

    const handleAuthChange = (newAuthType: AuthType) => {
      setSelectedAuth(newAuthType);
      setSelectedAuthType(newAuthType);
      
      if (onAuthTypeChange) {
        onAuthTypeChange(newAuthType);
      } else {
        // Reload the page to apply new auth configuration
        window.location.reload();
      }
    };

    const currentOption = AUTH_OPTIONS.find(opt => opt.value === selectedAuth);

    // Get icon for each auth type
    const getAuthIcon = (authType: AuthType) => {
      switch (authType) {
        case "WSO2_APIM_KM":
          return "bi-grid-3x3-gap-fill";
        case "WSO2_IS_KM":
          return "bi-key-fill";
        case "WSO2_IS":
          return "bi-shield-check";
        case "NO_AUTH":
          return "bi-unlock-fill";
        default:
          return "bi-question-circle";
      }
    };

    // Get color for each auth type
    const getAuthColor = (authType: AuthType) => {
      switch (authType) {
        case "WSO2_APIM_KM":
          return "primary";
        case "WSO2_IS_KM":
          return "success";
        case "WSO2_IS":
          return "info";
      case "NO_AUTH":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <div className="auth-selector-container">
        <button
          className="btn btn-primary btn-sm auth-trigger-btn"
          onClick={() => setShowModal(true)}
          title="Change Authentication Provider"
        >
          <i className="bi bi-gear-fill me-2"></i>
          <span className="d-none d-md-inline">{currentOption?.label || "Select Auth"}</span>
          <span className="d-inline d-md-none">Auth</span>
        </button>
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="auth-modal-overlay" onClick={() => setShowModal(false)}>
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content auth-modal-content">
              {/* Gradient Header */}
              <div className="modal-header auth-modal-header border-0">
                <div className="d-flex align-items-center">
                  <div className="auth-icon-wrapper me-3">
                    <i className="bi bi-shield-lock-fill"></i>
                  </div>
                  <div>
                    <h4 className="modal-title mb-0 fw-bold">Authentication Provider</h4>
                    <small className="text-light opacity-75">Choose your preferred login method</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Body with Cards */}
              <div className="modal-body p-4 auth-body">
                <p className="text-muted text-center mb-4">
                  Select how you want to authenticate and access the banking application
                </p>
                
                <div className="row g-3">
                  {AUTH_OPTIONS.map((option, index) => {
                    const isSelected = selectedAuth === option.value;
                    const color = getAuthColor(option.value);
                    const icon = getAuthIcon(option.value);
                    
                    return (
                      <div key={option.value} className="col-12 col-md-6">
                        <button
                          type="button"
                          className={`auth-option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            handleAuthChange(option.value);
                            setShowModal(false);
                          }}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="card-body p-3">
                            <div className="d-flex align-items-start">
                              <div className={`auth-card-icon bg-${color} bg-gradient`}>
                                <i className={`bi ${icon}`}></i>
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0 fw-semibold">{option.label}</h6>
                                  {isSelected && (
                                    <div className="selected-badge">
                                      <i className="bi bi-check-circle-fill"></i>
                                    </div>
                                  )}
                                </div>
                                <p className="mb-0 small text-muted">{option.description}</p>
                              </div>
                            </div>
                          </div>
                          {isSelected && <div className="selected-indicator"></div>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer auth-footer border-0 bg-light">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Changes take effect immediately
                  </small>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Auth Selector Container */
        .auth-selector-container {
          position: relative;
        }
        
        .auth-trigger-btn {
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.25);
          border: none;
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
        }
        
        .auth-trigger-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
          background: linear-gradient(135deg, #0b5ed7 0%, #084298 100%);
        }
        
        .auth-trigger-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(13, 110, 253, 0.3);
        }

        /* Modal Overlay */
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Modal Content */
        .auth-modal-content {
          border: none;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Modal Header */
        .auth-modal-header {
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
          color: white;
          padding: 1.5rem;
        }

        .auth-icon-wrapper {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        /* Auth Option Cards */
        .auth-option-card {
          width: 100%;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          animation: slideInCard 0.5s ease backwards;
        }

        @keyframes slideInCard {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-option-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: #0d6efd;
        }

        .auth-option-card.selected {
          border-color: #0d6efd;
          background: linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%);
          box-shadow: 0 8px 24px rgba(13, 110, 253, 0.2);
        }

        .auth-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.3rem;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .selected-badge {
          color: #0d6efd;
          font-size: 1.3rem;
          animation: checkPop 0.4s ease;
        }

        @keyframes checkPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .selected-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0d6efd 0%, #0a58ca 100%);
          animation: slideInIndicator 0.3s ease;
        }

        @keyframes slideInIndicator {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .auth-modal-content {
            margin: 1rem;
            max-width: calc(100% - 2rem);
          }
          
          .auth-modal-header {
            padding: 1rem;
          }
          
          .auth-icon-wrapper {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
          
          .modal-title {
            font-size: 1.1rem;
          }
        }
        .auth-body {
            background: #f8f9fa;
        }
        .auth-footer {
            padding: 1rem 1.5rem;
        }
      `}</style>
    </>
  );
  }
);

AuthSelector.displayName = "AuthSelector";

export default AuthSelector;
