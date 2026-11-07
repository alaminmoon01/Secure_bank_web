
import { useEffect, useState } from "react";
import "./adminPages.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/transactions",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load transactions.");
        }

        setTransactions(
          data.transactions || data.data || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Transaction History</h2>
          <p>Review simulated banking transactions.</p>
        </div>
      </div>

      <div className="admin-card">
        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <p className="empty-panel">Loading transactions...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transactionId}>
                    <td>{transaction.transactionId}</td>
                    <td>
                      {transaction.account?.accountNumber ||
                        transaction.accountNumber ||
                        "—"}
                    </td>
                    <td>{transaction.type}</td>
                    <td>
                      ৳ {Number(transaction.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="status-tag">
                        {transaction.status}
                      </span>
                    </td>
                    <td>
                      {transaction.createdAt
                        ? new Date(
                            transaction.createdAt
                          ).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!transactions.length && (
              <p className="empty-panel">
                No transactions found.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
