import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiPost } from './api';
import { DefaultLayout } from '../layouts/default';

export default function DepositFunds() {
  const { accountNumber } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    accountNumber: accountNumber || '',
    amount: '',
  });

  const [statusInfo, setStatusInfo] = useState({ status: null, message: '' });

  const handleChange = ({ target: { name, value } }) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const accNum = formData.accountNumber.trim();
    const amt = parseFloat(formData.amount);

    if (!accNum) {
      setStatusInfo({ status: 400, message: 'Account number is required.' });
      return;
    }

    if (isNaN(amt) || amt <= 0) {
      setStatusInfo({ status: 400, message: 'Amount must be greater than zero.' });
      return;
    }

    try {
      const { status, data } = await apiPost(`/accounts/${encodeURIComponent(accNum)}/deposit`, {
        amount: amt,
      });

      setStatusInfo({
        status,
        message: data?.message || (status === 200 ? 'Deposit successful.' : data?.error || 'Deposit failed.'),
      });
    } catch (err) {
      setStatusInfo({
        status: 500,
        message: err?.response?.data?.message || 'An unexpected error occurred.',
      });
    }
  };

  const { status, message } = statusInfo;

  return (
    <DefaultLayout>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body">
                <h2 className="mb-4 text-center fw-bold">
                  <i className="bi bi-bank2 me-2"></i>Deposit Funds
                </h2>

                {status !== null && (
                  <div className={`alert alert-${status === 200 ? 'success' : 'danger'} alert-dismissible fade show`}>
                    <strong>
                      <i className={`bi ${status === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i>
                      {status === 200 ? 'Success:' : 'Error:'}
                    </strong>{' '}
                    {message}
                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="accountNumber" className="form-label">
                      <i className="bi bi-person-badge me-1"></i>Account Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="amount" className="form-label">
                      <i className="bi bi-currency-dollar me-1"></i>Amount
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="amount"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="d-flex justify-content-between">
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-bank2 me-1"></i> Deposit
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/accounts')}>
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
