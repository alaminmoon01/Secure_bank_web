
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminPages.css";

const API = "http://localhost:5000/api";

const features = [
  ["＋", "Create Customer", "Create a new customer account", "/admin/create-customer"],
  ["♙", "Customer Management", "Search and manage customers", "/admin/customers"],
  ["▣", "Add Money", "Simulate customer deposits", "/admin/deposit"],
  ["↗", "Withdraw", "Simulate withdrawals", "/admin/withdraw"],
  ["⇄", "Transactions", "View transaction records", "/admin/transactions"],
  ["⌁", "Login Requests", "Review login approval requests", "/admin/login-requests"],
  ["▣", "Device Management", "Manage trusted devices", "/admin/devices"],
  ["◆", "Security Reports", "Review security events", "/admin/security-reports"],
  ["▤", "Account Management", "Manage account status", "/admin/accounts"],
  ["☏", "Support Requests", "Review support tickets", "/admin/support"],
  ["▥", "Reports", "View operational reports", "/admin/reports"],
  ["⚙", "Settings", "Admin settings", "/admin/settings"],
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const token = localStorage.getItem("adminToken");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [customerResponse, transactionResponse] =
          await Promise.all([
            fetch(`${API}/admin/customers`, { headers }),
            fetch(`${API}/admin/transactions`, { headers }),
          ]);

        const customerData = await customerResponse
          .json()
          .catch(() => ({}));

        const transactionData = await transactionResponse
          .json()
          .catch(() => ({}));

        if (!customerResponse.ok) {
          throw new Error(
            customerData.message || "Could not load customers."
          );
        }

        if (active) {
          setCustomers(
            customerData.customers || customerData.data || []
          );

          if (transactionResponse.ok) {
            setTransactions(
              transactionData.transactions ||
              transactionData.data ||
              []
            );
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const totalBalance = customers.reduce((sum, customer) => {
    const accounts = customer.accounts || [];

    return (
      sum +
      accounts.reduce(
        (accountSum, account) =>
          accountSum + Number(account.balance || 0),
        0
      )
    );
  }, 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Monitor your SecureBank administration activities.</p>
        </div>

        <span className="status-tag">ADMIN PANEL</span>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="admin-stat-grid">
        <div className="admin-stat">
          <div className="stat-icon">♙</div>
          <p>Total Customers</p>
          <h3>
            {loading ? "—" : customers.length.toLocaleString()}
          </h3>
          <small>Customer records</small>
        </div>

        <div className="admin-stat">
          <div className="stat-icon">৳</div>
          <p>Visible Account Balance</p>
          <h3>
            {loading
              ? "—"
              : `৳ ${totalBalance.toLocaleString("en-BD", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </h3>
          <small>Based on account data returned by API</small>
        </div>

        <div className="admin-stat">
          <div className="stat-icon">⇄</div>
          <p>Transactions</p>
          <h3>
            {loading ? "—" : transactions.length.toLocaleString()}
          </h3>
          <small>Records returned by API</small>
        </div>
      </div>

      <div className="page-heading">
        <div>
          <h2>Banking Features</h2>
          <p>Select a feature to open its dedicated page.</p>
        </div>
      </div>

      <div className="admin-feature-grid">
        {features.map(([icon, title, description, path]) => (
          <button
            className="feature-card"
            key={path}
            onClick={() => navigate(path)}
          >
            <span className="feature-icon">{icon}</span>

            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>

            <b style={{ marginLeft: "auto", color: "#0a8848" }}>
              ›
            </b>
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ marginTop: 20 }}>
        <h3>Quick Action</h3>
        <p className="muted">
          Create a customer profile and linked account using the
          existing Admin API.
        </p>

        <button
          className="green-button"
          onClick={() => navigate("/admin/create-customer")}
        >
          + Create Customer
        </button>
      </div>
    </>
  );
}
