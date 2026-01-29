import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from './api';
import { DefaultLayout } from '../layouts/default';

export default function EditAccount() {
  const { accountNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [formData, setFormData] = useState({ accountHolder: '', status: 'Active' });
  const [feedback, setFeedback] = useState({ status: null, message: null });

  const fetchAccount = useCallback(async () => {
    if (!accountNumber) {
      navigate('/accounts');
      return;
    }

    setLoading(true);
    const { status, data } = await apiGet(`/accounts/${encodeURIComponent(accountNumber)}`);
    if (status === 200) {
      setAccount(data);
      setFormData({ accountHolder: data.accountHolder || '', status: data.status || 'Active' });
    } else {
      setAccount({ error: data.error || 'Account not found.' });
    }
    setLoading(false);
  }, [accountNumber, navigate]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFeedback({ status: null, message: null });

    const payload = {
      accountHolder: formData.accountHolder.trim(),
      status: formData.status,
    };

    const { status, data } = await apiPut(`/accounts/${encodeURIComponent(accountNumber)}`, payload);
    setFeedback({
      status,
      message: data.message || (status === 200 ? 'Account updated successfully.' : 'Update failed.'),
    });

    if (status === 200) setAccount(payload);
  }, [formData, accountNumber]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body">
                <h2 className="mb-4 text-center fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>Edit Account #{accountNumber}
                </h2>

                {feedback.status && (
                  <div className={`alert alert-${feedback.status === 200 ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                    <strong>
                      <i className={`bi ${feedback.status === 200 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`} />
                      {feedback.status === 200 ? 'Success:' : 'Error:'}
                    </strong>{' '}
                    {feedback.message}
                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
                  </div>
                )}

                {account?.error ? (
                  <>
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                      <strong><i className="bi bi-exclamation-triangle-fill me-1" />Error:</strong> {account.error}
                      <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
                    </div>
                    <div className="d-flex justify-content-end">
                      <button className="btn btn-secondary" onClick={() => navigate('/accounts')}>
                        <i className="bi bi-arrow-left-circle me-1" />Back to Accounts
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-3">
                      <label htmlFor="accountHolder" className="form-label">
                        <i className="bi bi-person-fill me-1" />Account Holder
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="accountHolder"
                        name="accountHolder"
                        value={formData.accountHolder}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="status" className="form-label">
                        <i className="bi bi-toggle-on me-1" />Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleChange}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-save me-1" />Save Changes
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => navigate('/accounts')}>
                        <i className="bi bi-arrow-left-circle me-1" />Back to Accounts
                      </button>
                    </div>
                  </form>
                )}
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
