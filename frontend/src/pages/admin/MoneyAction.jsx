
import { useState } from "react";
import "./adminPages.css";

export default function MoneyAction({ mode }) {
  const isDeposit = mode === "deposit";

  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/accounts/${encodeURIComponent(
          accountNumber
        )}/${isDeposit ? "deposit" : "withdraw"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Transaction failed.");
      }

      setMessage(
        data.message ||
          `${isDeposit ? "Deposit" : "Withdrawal"} completed successfully.`
      );

      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>{isDeposit ? "Add Money" : "Withdraw Money"}</h2>
          <p>
            {isDeposit
              ? "Simulate a deposit into a customer account."
              : "Simulate a withdrawal from a customer account."}
          </p>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="field full">
            <label>Account Number *</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              placeholder="Enter customer account number"
            />
          </div>

          <div className="field">
            <label>Amount (BDT) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {error && (
            <div className="form-error field full">{error}</div>
          )}

          {message && (
            <div className="form-message field full">{message}</div>
          )}

          <div className="form-actions">
            <button className="green-button" disabled={loading}>
              {loading
                ? "Processing..."
                : isDeposit
                  ? "Confirm Deposit"
                  : "Confirm Withdrawal"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
