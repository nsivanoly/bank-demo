import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from './api';
import { DefaultLayout } from '../layouts/default';

interface WithdrawResponse {
  message?: string;
  error?: string;
}

export default function WithdrawFunds() {
  const { accountNumber: paramAccountNumber } = useParams<{ accountNumber: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ accountNumber: paramAccountNumber || '', amount: '' });
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBalance = useCallback(async (acctNum: string) => {
    try {
      const { status, data } = await apiGet(`/accounts/${encodeURIComponent(acctNum)}`);
      if (status === 200 && typeof data?.balance === 'number') {
        setAvailableBalance(data.balance);
      } else {
        setAvailableBalance(null);
      }
    } catch {
      setAvailableBalance(null);
    }
  }, []);

  useEffect(() => {
    if (formData.accountNumber) {
      fetchBalance(formData.accountNumber);
    }
  }, [formData.accountNumber, fetchBalance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawStatus(null);
    setActionMessage(null);

    const accNum = formData.accountNumber.trim();
    const amt = parseFloat(formData.amount);

    if (!accNum) {
      setWithdrawStatus(400);
      setActionMessage('Account number is required.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setWithdrawStatus(400);
      setActionMessage('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { status, data } = await apiPost<WithdrawResponse>(`/accounts/${encodeURIComponent(accNum)}/withdraw`, { amount: amt });
      setWithdrawStatus(status);
      setActionMessage(data.message ?? (status === 200 ? 'Withdrawal successful.' : data.error ?? 'Withdrawal failed.'));
      if (status === 200) {
        await fetchBalance(accNum);
        setFormData(prev => ({ ...prev, amount: '' }));
      }
    } catch (err) {
      setWithdrawStatus(500);
      setActionMessage('Unexpected error occurred during withdrawal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Alert = () => {
    if (withdrawStatus === null || actionMessage === null) return null;
    const alertClass = withdrawStatus === 200 ? 'success' : 'danger';
    const iconClass = withdrawStatus === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
    const label = withdrawStatus === 200 ? 'Success:' : 'Error:';

    return (
      <div className={`alert alert-${alertClass} alert-dismissible fade show`} role="alert">
        <strong>
          <i className={`bi ${iconClass} me-1`}></i> {label}
        </strong>{' '}
        {actionMessage}
        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    );
  };

  const BalanceInfo = () => {
    if (availableBalance === null) return null;
    return (
      <div className="mb-3 text-muted">
        <i className="bi bi-wallet2 me-1"></i>
        <strong>Available Balance:</strong> {availableBalance.toFixed(2)}
      </div>
    );
  };

  return (
    <DefaultLayout>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body">
                <h2 className="mb-4 text-center fw-bold">
                  <i className="bi bi-cash-stack me-2"></i>Withdraw Funds
                </h2>

                <BalanceInfo />
                <Alert />

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="accountNumber" className="form-label">
                      <i className="bi bi-hash me-1"></i>Account Number
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      className="form-control"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      required
                      disabled={!!paramAccountNumber} // Disable if from URL param to prevent editing
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="amount" className="form-label">
                      <i className="bi bi-currency-exchange me-1"></i>Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      className="form-control"
                      min="0.01"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="d-flex justify-content-between">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      <i className="bi bi-cash-stack me-1"></i> Withdraw
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/accounts')}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-arrow-left-circle me-1"></i> Back to Accounts
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <br />
    </DefaultLayout>
  );
}
