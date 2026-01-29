import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "./api";
import { DefaultLayout } from "../layouts/default";

export default function TransferFunds() {
  const { accountNumber } = useParams<{ accountNumber?: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fromAccountNumber: accountNumber ?? "",
    toAccountNumber: "",
    amount: "",
  });

  const [transferStatus, setTransferStatus] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<any>(null);

  useEffect(() => {
    if (!accountNumber) return;

    (async () => {
      try {
        const { status, data } = await apiGet(
          `/accounts/${encodeURIComponent(accountNumber)}`
        );
        if (status === 200) {
          setAccountDetails(data);
        }
      } catch {
        setAccountDetails(null);
      }
    })();
  }, [accountNumber]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setTransferStatus(null);
      setActionMessage(null);

      const payload = {
        fromAccountNumber: formData.fromAccountNumber.trim(),
        toAccountNumber: formData.toAccountNumber.trim(),
        amount: parseFloat(formData.amount),
      };

      try {
        const { status, data: response } = await apiPost(
          "/accounts/transfer",
          payload
        );

        setTransferStatus(status);
        setActionMessage(
          response.message ||
            (status === 200
              ? "Transfer completed successfully."
              : response.error || "Transfer failed.")
        );
      } catch (error) {
        setTransferStatus(500);
        setActionMessage("An unexpected error occurred during transfer.");
      }
    },
    [formData]
  );

  return (
    <DefaultLayout>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body">
                <h2 className="mb-4 text-center fw-bold">
                  <i className="bi bi-arrow-left-right me-2"></i>Transfer Funds
                </h2>

                {transferStatus !== null && actionMessage && (
                  <div
                    className={`alert alert-${
                      transferStatus === 200 ? "success" : "danger"
                    } alert-dismissible fade show`}
                    role="alert"
                    aria-live="assertive"
                  >
                    <strong>
                      <i
                        className={`bi ${
                          transferStatus === 200
                            ? "bi-check-circle-fill"
                            : "bi-exclamation-triangle-fill"
                        } me-1`}
                      ></i>
                      {transferStatus === 200 ? "Success:" : "Error:"}
                    </strong>{" "}
                    {actionMessage}
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="alert"
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                {accountDetails?.accountNumber && (
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>From Account:</strong> {accountDetails.accountNumber} —{" "}
                    {accountDetails.accountHolder} ({accountDetails.accountType} /{" "}
                    {accountDetails.currency}, Balance:{" "}
                    {Number(accountDetails.balance).toFixed(2)})
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="fromAccountNumber" className="form-label">
                      <i className="bi bi-box-arrow-in-left me-1"></i>From Account
                      Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="fromAccountNumber"
                      name="fromAccountNumber"
                      value={formData.fromAccountNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="toAccountNumber" className="form-label">
                      <i className="bi bi-box-arrow-right me-1"></i>To Account Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="toAccountNumber"
                      name="toAccountNumber"
                      value={formData.toAccountNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="amount" className="form-label">
                      <i className="bi bi-currency-exchange me-1"></i>Amount
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
                      <i className="bi bi-arrow-left-right me-1"></i> Transfer
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate("/accounts")}
                    >
                      <i className="bi bi-arrow-left-circle me-1"></i> Back to
                      Accounts
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
