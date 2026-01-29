import React, {
  FunctionComponent,
  ReactElement,
  useCallback,
  useEffect,
  useState
} from "react";
import { useLocation } from "react-router-dom";
import {
  BasicUserInfo,
  Hooks,
  useAuthContext
} from "@asgardeo/auth-react";

import { AppConfig, AUTH_OPTIONS, getSelectedAuthType } from "../config";
import { DefaultLayout } from "../layouts/default";
import { AuthenticationResponse, AuthSelector } from "../components";
import { LogoutRequestDenied } from "../components/LogoutRequestDenied";
import { USER_DENIED_LOGOUT } from "../constants/errors";

const authConfig = AppConfig.AuthConfig;

interface DerivedState {
  authenticateResponse: BasicUserInfo;
  idToken: string[];
  decodedIdTokenHeader: Record<string, unknown>;
  decodedIDTokenPayload: Record<string, string | number | boolean>;
}

export const HomePage: FunctionComponent = (): ReactElement => {
  const {
    state,
    signIn,
    signOut,
    getBasicUserInfo,
    getIDToken,
    getAccessToken,
    getDecodedIDToken,
    on
  } = useAuthContext();

  const [derivedAuthenticationState, setDerivedAuthenticationState] = useState<DerivedState | null>(null);
  const [hasAuthenticationErrors, setHasAuthenticationErrors] = useState(false);
  const [hasLogoutFailureError, setHasLogoutFailureError] = useState(false);

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const stateParam = queryParams.get("state");
  const errorDescParam = queryParams.get("error_description");

  // Fetch and set user auth info on successful authentication
  useEffect(() => {
    if (!state?.isAuthenticated) return;

    const fetchUserInfo = async () => {
      try {
        const [basicUserInfo, idToken, accessToken, decodedIDToken] = await Promise.all([
          getBasicUserInfo(),
          getIDToken(),
          getAccessToken(),
          getDecodedIDToken()
        ]);

        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
        }

        setDerivedAuthenticationState({
          authenticateResponse: basicUserInfo,
          idToken: idToken.split("."),
          decodedIdTokenHeader: JSON.parse(atob(idToken.split(".")[0])),
          decodedIDTokenPayload: decodedIDToken
        });
      } catch {
        setHasAuthenticationErrors(true);
      }
    };

    fetchUserInfo();
  }, [state?.isAuthenticated, getBasicUserInfo, getIDToken, getAccessToken, getDecodedIDToken]);

  // Detect logout denial error
  useEffect(() => {
    setHasLogoutFailureError(
      Boolean(stateParam && errorDescParam === "End User denied the logout request")
    );
  }, [stateParam, errorDescParam]);

  // Login handler with error reset
  const handleLogin = useCallback(() => {
    setHasLogoutFailureError(false);
    setHasAuthenticationErrors(false);

    signIn().catch(() => setHasAuthenticationErrors(true));
  }, [signIn]);

  // Setup logout event listeners
  useEffect(() => {
    const signOutListener = () => setHasLogoutFailureError(false);
    const signOutFailedListener = () => {
      if (!errorDescParam) {
        handleLogin();
      }
    };

    on(Hooks.SignOut, signOutListener);
    on(Hooks.SignOutFailed, signOutFailedListener);

    // Cleanup listeners on unmount
    return () => {
      // Note: Assuming `off` method exists; if not, depends on implementation
      // on.off(Hooks.SignOut, signOutListener);
      // on.off(Hooks.SignOutFailed, signOutFailedListener);
    };
  }, [on, handleLogin, errorDescParam]);

  if (!authConfig?.clientID) {
    return (
      <div className="content">
        <h2>You need to update the Client ID to proceed.</h2>
        <p>
          Please open <code>src/config.json</code> and update the <code>clientID</code>.
        </p>
      </div>
    );
  }

  if (hasLogoutFailureError) {
    return (
      <LogoutRequestDenied
        errorMessage={USER_DENIED_LOGOUT}
        handleLogin={handleLogin}
        handleLogout={signOut}
      />
    );
  }

  return (
    <DefaultLayout isLoading={state.isLoading} hasErrors={hasAuthenticationErrors}>
      {state.isAuthenticated ? (
        <div className="content text-center">
          <h2 className="text-success">Welcome back!</h2>
          <AuthenticationResponse derivedResponse={derivedAuthenticationState} />
          <button
            className="btn btn-outline-secondary logout-btn mt-4"
            onClick={() => signOut()}
          >
            Logout
          </button>
        </div>
      ) : (
        <>
          {/* Hero Banner */}
          <section className="bg-light text-center py-5">
            <div className="container">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="100"
                  height="100"
                >
                  <path
                    fill="currentColor"
                    d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z"
                  />
                  <path
                    fill="currentColor"
                    d="M11 12.5L3 9v10h2v-5h4v5h2v-7.5zM17 15h2v4h-2v-4z"
                  />
                </svg>
              </div>
              <h1 className="display-5 fw-bold">Welcome to MyBank</h1>
              <p className="lead text-muted">
                Empowering your financial journey with simplicity, speed, and
                security.
              </p>
            </div>
          </section>


          {/* Authentication Section */}
          <section className="py-5 bg-white" style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)'
          }}>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8 text-center">
                  <h2 className="fw-bold text-dark mb-3" style={{
                    fontSize: '2.2rem',
                    animation: 'fadeInUp 0.6s ease-out'
                  }}>
                    <i className="bi bi-shield-lock me-2 text-primary"></i>
                    Secure Authentication
                  </h2>
                  <p className="lead text-muted mb-5" style={{
                    lineHeight: 1.8,
                    fontSize: '1.05rem',
                    animation: 'fadeInUp 0.6s ease-out 0.1s backwards'
                  }}>
                    MyBank provides multiple authentication methods to ensure your account is protected with industry-leading security standards. Choose the authentication provider that works best for you.
                  </p>
                  <div className="bg-light p-4 rounded-4 mb-4 border mx-auto" style={{
                    maxWidth: '500px',
                    background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.05) 0%, rgba(13, 110, 253, 0.02) 100%)',
                    borderColor: 'rgba(13, 110, 253, 0.2)',
                    boxShadow: '0 4px 15px rgba(13, 110, 253, 0.1)',
                    transition: 'all 0.3s ease',
                    animation: 'fadeInUp 0.6s ease-out 0.2s backwards'
                  }}>
                    <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.9rem', color: '#495057' }}>
                      <i className="bi bi-check-circle-fill me-2 text-success"></i>
                      CURRENTLY SELECTED
                    </h6>
                    <p className="mb-0 h5 text-primary fw-bold" style={{
                      fontSize: '1.4rem',
                      color: '#0d6efd'
                    }}>
                      {AUTH_OPTIONS.find(opt => opt.value === getSelectedAuthType())?.label || 'Not Selected'}
                    </p>
                    <small className="text-muted d-block mt-2">
                      {AUTH_OPTIONS.find(opt => opt.value === getSelectedAuthType())?.description || ''}
                    </small>
                  </div>
                  <div style={{ animation: 'fadeInUp 0.6s ease-out 0.3s backwards' }}>
                    <AuthSelector />
                  </div>
                </div>
              </div>
            </div>
            <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </section>

          {/* Feature Cards */}
          <section className="py-5 bg-white">
            <div className="container">
              <div className="row g-4 row-cols-1 row-cols-md-2 row-cols-lg-3">
                {[
                  {
                    icon: "bi-wallet2",
                    title: "Manage Accounts",
                    text: "View balances and transaction details across all your accounts.",
                    color: "text-primary"
                  },
                  {
                    icon: "bi-plus-circle",
                    title: "Open New Account",
                    text: "Create checking, savings, or other account types instantly.",
                    color: "text-success"
                  },
                  {
                    icon: "bi-arrow-left-right",
                    title: "Transfer Funds",
                    text: "Send money between accounts or users securely.",
                    color: "text-info"
                  },
                  {
                    icon: "bi-bank2",
                    title: "Deposit Money",
                    text: "Deposit money to your account in seconds.",
                    color: "text-warning"
                  },
                  {
                    icon: "bi-cash-stack",
                    title: "Withdraw Cash",
                    text: "Withdraw funds anywhere, anytime.",
                    color: "text-danger"
                  },
                  {
                    icon: "bi-graph-up-arrow",
                    title: "Track Your Finances",
                    text: "Visualize your financial health in real-time.",
                    color: "text-secondary"
                  }
                ].map(({ icon, title, text, color }, idx) => (
                  <div key={idx} className="col">
                    <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                      <div className={`mb-3 ${color}`}>
                        <i className={`bi ${icon} display-4`}></i>
                      </div>
                      <h4 className="text-dark fw-semibold">{title}</h4>
                      <p className="text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA + Login Button */}
          <section className="py-5 bg-light text-center">
            <div className="container">
              <h2 className="fw-bold text-dark">
                Join thousands of customers who trust MyBank
              </h2>
              <p className="lead text-muted">
                Bank smarter. Bank safer. Bank with confidence.
              </p>
              <button
                className="btn btn-primary btn-lg rounded-pill mt-3 px-4 py-2"
                onClick={handleLogin}
              >
                Login to Continue
              </button>
            </div>
          </section>
        </>
      )}
    </DefaultLayout>
  );
};
