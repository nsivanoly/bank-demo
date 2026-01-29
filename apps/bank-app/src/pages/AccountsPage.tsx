import React, { useEffect, useState, useMemo, useCallback } from "react";
import { apiGet, apiDelete } from "./api";
import { DefaultLayout } from "../layouts/default";

interface Account {
  accountNumber: string;
  accountHolder: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  branch?: string;
}

const DeleteModal = ({
  account,
  loading,
  onCancel,
  onConfirm,
}: {
  account: Account;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div
    className="modal fade show d-block"
    tabIndex={-1}
    role="dialog"
    aria-modal="true"
    style={{
      backgroundColor: "rgba(33, 37, 41, 0.75)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
    }}
  >
    <div className="modal-dialog modal-dialog-centered" role="document">
      <div className="modal-content border-danger shadow-lg">
        <div className="modal-header bg-danger text-white border-danger">
          <h5 className="modal-title">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Deletion
          </h5>
          <button type="button" className="btn-close btn-close-white" onClick={onCancel} disabled={loading} />
        </div>
        <div className="modal-body fs-5">
          Are you sure you want to delete account <strong>{account.accountNumber}</strong>?
          <br />
          <small className="text-muted">This action cannot be undone.</small>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Deleting...
              </>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [filters, setFilters] = useState({ type: "", branch: "", days: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<number | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/accounts").then(({ status, data }) => {
      if (status === 200 && Array.isArray(data)) {
        setAllAccounts(data);
      }
    });
  }, []);

  const accountTypes = useMemo(() => [...new Set(allAccounts.map(a => a.accountType))], [allAccounts]);
  const branches = useMemo(() => [...new Set(allAccounts.map(a => a.branch).filter(Boolean))], [allAccounts]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let endpoint = "/accounts";
    const { type, branch, days } = filters;

    if (days) {
      endpoint = `/accounts/recent?days=${encodeURIComponent(days)}`;
    } else if (type || branch) {
      const params = new URLSearchParams();
      if (type) params.append("accountType", type);
      if (branch) params.append("branch", branch);
      endpoint = `/accounts/search?${params}`;
    }

    const { status, data } = await apiGet(endpoint);
    if (status === 200) {
      setAccounts(data);
    } else {
      setError(data?.error || "Failed to load accounts.");
      setAccounts([]);
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleDelete = async (accountNumber: string) => {
    setLoading(true);
    const { status, data } = await apiDelete(`/accounts/${encodeURIComponent(accountNumber)}`);
    setDeleteStatus(status);
    setDeleteMessage(data?.message || (status === 200 ? "Deleted." : "Failed to delete."));
    if (status === 200) {
      setAccounts(prev => prev.filter(acc => acc.accountNumber !== accountNumber));
    }
    setDeleteTarget(null);
    setLoading(false);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(f => ({ ...f, days: "" }));
  };

  const handleRecentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(f => ({ ...f, type: "", branch: "" }));
  };

  return (
    <DefaultLayout>
      <div className="container mt-4">
        {/* Title */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="bi bi-wallet2 me-2" /> Accounts
          </h2>
          <a href="/create-account" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2" /> Create Account
          </a>
        </div>

        {/* Alerts */}
        {deleteStatus !== null && (
          <div className={`alert alert-${deleteStatus === 200 ? "success" : "danger"} alert-dismissible fade show`} role="alert">
            <i className={`bi me-2 ${deleteStatus === 200 ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`} />
            <strong>{deleteStatus === 200 ? "Success:" : "Error:"}</strong> {deleteMessage}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        {/* Filters */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3"><i className="bi bi-funnel me-2" /> Filter Accounts</h5>
                <form onSubmit={handleFilterSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Account Type</label>
                      <select className="form-select" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
                        <option value="">All Types</option>
                        {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Branch</label>
                      <select className="form-select" value={filters.branch} onChange={(e) => setFilters(f => ({ ...f, branch: e.target.value }))}>
                        <option value="">All Branches</option>
                        {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary w-100"><i className="bi bi-filter me-2" /> Apply Filters</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Recent */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3"><i className="bi bi-clock-history me-2" /> Recent Accounts</h5>
                <form onSubmit={handleRecentSubmit}>
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Number of Days</label>
                      <input type="number" min={1} className="form-control" value={filters.days} onChange={(e) => setFilters(f => ({ ...f, days: e.target.value }))} />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <button type="submit" className="btn btn-dark w-100"><i className="bi bi-search me-2" /> </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-5">Loading...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : accounts.length === 0 ? (
          <div className="card text-center py-5 shadow-sm">
            <i className="bi bi-wallet2 text-muted" style={{ fontSize: "3rem" }}></i>
            <h4 className="mt-3">No Accounts Found</h4>
            <p className="text-muted">Try adjusting filters or create a new account</p>
            <a href="/create-account" className="btn btn-primary mt-2">
              <i className="bi bi-plus-circle me-2"></i>Create Account
            </a>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Account No</th>
                      <th>Holder</th>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, i) => (
                      <tr key={acc.accountNumber}>
                        <td>{i + 1}</td>
                        <td>{acc.accountNumber}</td>
                        <td>{acc.accountHolder}</td>
                        <td>{acc.accountType}</td>
                        <td>{acc.balance.toFixed(2)} {acc.currency}</td>
                        <td>{acc.status}</td>
                        <td>
                          <a href={`/accounts/${acc.accountNumber}`} className="btn btn-sm btn-info me-1" title="View"><i className="bi bi-eye" /></a>
                          <a href={`/accounts/${acc.accountNumber}/edit`} className="btn btn-sm btn-primary me-1" title="Edit"><i className="bi bi-pencil-square" /></a>
                          <button className="btn btn-sm btn-danger me-1" title="Delete" onClick={() => setDeleteTarget(acc)}><i className="bi bi-trash" /></button>
                          <a href={`/accounts/${acc.accountNumber}/transfer`} className="btn btn-sm btn-success me-1" title="Transfer"><i className="bi bi-arrow-left-right" /></a>
                          <a href={`/accounts/${acc.accountNumber}/deposit`} className="btn btn-sm btn-warning me-1" title="Deposit"><i className="bi bi-bank2" /></a>
                          <a href={`/accounts/${acc.accountNumber}/withdraw`} className="btn btn-sm btn-secondary" title="Withdraw"><i className="bi bi-cash-stack" /></a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <DeleteModal
            account={deleteTarget}
            loading={loading}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => handleDelete(deleteTarget.accountNumber)}
          />
        )}
      </div>
      <br/>
      <br/>
    </DefaultLayout>
  );
}
