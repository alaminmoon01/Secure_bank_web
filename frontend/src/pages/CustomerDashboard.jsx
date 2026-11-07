
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeviceCard from "../modules/device-monitoring/components/DeviceCard";
import "./CustomerDashboard.css";

const API_URL = "http://localhost:5000/api";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/customer/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load dashboard.");
      }

      setDashboard(result.data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="loading-spinner"></div>
        <p>Loading SecureBank...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-loading">
        <p>{error}</p>
        <button onClick={loadDashboard}>Try Again</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (!dashboard) return null;

  const { customer, accounts, summary, recentTransactions } = dashboard;

  const navigationItems = [
    { name: "Overview", icon: "▦" },
    { name: "Accounts", icon: "▣" },
    { name: "Transactions", icon: "↕" },
    { name: "Device Monitoring", icon: "⌘" },
    { name: "Profile", icon: "♙" },
  ];

  return (
    <div className="customer-dashboard">
      <aside className={`customer-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">S</div>
          <h2>SecureBank</h2>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {customer.fullName?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div>
            <h3>{customer.fullName}</h3>
            <p>Customer Account</p>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              className={activePage === item.name ? "active" : ""}
              onClick={() => {
                setActivePage(item.name);
                setSidebarOpen(false);
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          ↪ <span>Logout</span>
        </button>
      </aside>

      <main className="customer-main">
        <header className="customer-topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div>
            <h1>{activePage}</h1>
            <p>Welcome back, {customer.fullName}</p>
          </div>

          <div className="topbar-user">
            <div className="profile-avatar small">
              {customer.fullName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <span>{customer.fullName}</span>
          </div>
        </header>

        {activePage === "Overview" && (
          <>
            <section className="balance-card">
              <div>
                <p>Total Available Balance</p>
                <h2>{formatMoney(summary.totalBalance)}</h2>
                <span>SecureBank Account Overview</span>
              </div>
              <div className="balance-decoration">৳</div>
            </section>

            <section className="statistics-grid">
              <div className="stat-card">
                <span>Total Accounts</span>
                <h2>{summary.totalAccounts}</h2>
                <p>Your registered accounts</p>
              </div>

              <div className="stat-card">
                <span>Total Transactions</span>
                <h2>{summary.totalTransactions}</h2>
                <p>All account transactions</p>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <h2>My Accounts</h2>
                <span>{accounts.length} Accounts</span>
              </div>

              <div className="accounts-grid">
                {accounts.map((account) => (
                  <div className="account-card" key={account.id}>
                    <div className="account-card-heading">
                      <span>{account.accountType}</span>
                      <span className={`account-status ${account.status.toLowerCase()}`}>
                        {account.status}
                      </span>
                    </div>
                    <p>Account Number</p>
                    <h3>{account.accountNumber}</h3>
                    <div className="account-card-balance">
                      <span>Balance</span>
                      <strong>{formatMoney(account.balance)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <h2>Recent Transactions</h2>
                <button onClick={() => setActivePage("Transactions")}>
                  View All
                </button>
              </div>

              <TransactionTable transactions={recentTransactions} />
            </section>
          </>
        )}

        {activePage === "Accounts" && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>My Accounts</h2>
            </div>
            <div className="accounts-grid">
              {accounts.map((account) => (
                <div className="account-card" key={account.id}>
                  <span>{account.accountType}</span>
                  <h3>{account.accountNumber}</h3>
                  <p>{account.status}</p>
                  <strong>{formatMoney(account.balance)}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {activePage === "Transactions" && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Recent Transactions</h2>
            </div>
            <TransactionTable transactions={recentTransactions} />
            <p className="dashboard-note">
              Showing the latest 5 transactions. Full history will be available
              through the transaction history API.
            </p>
          </section>
        )}

        {activePage === "Device Monitoring" && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Device Security & Monitoring</h2>
              <span>Account Protection</span>
            </div>

            <p className="dashboard-note">
              Review your device information and manage location sharing.
              GPS access requires your permission.
            </p>

            <DeviceCard />
          </section>
        )}

        {activePage === "Profile" && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Customer Profile</h2>
            </div>
            <div className="profile-details">
              <div>
                <span>Full Name</span>
                <strong>{customer.fullName}</strong>
              </div>
              <div>
                <span>Mobile Number</span>
                <strong>{customer.mobileNumber}</strong>
              </div>
              <div>
                <span>Email Address</span>
                <strong>{customer.email || "Not provided"}</strong>
              </div>
              <div>
                <span>Customer ID</span>
                <strong>{customer.id}</strong>
              </div>
            </div>
          </section>
        )}

        <footer className="customer-footer">
          SecureBank © 2026. Educational banking simulation.
        </footer>
      </main>
    </div>
  );
}

function TransactionTable({ transactions = [] }) {
  if (!transactions.length) {
    return <div className="empty-transactions">No transactions found.</div>;
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Type</th>
            <th>Account</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.transactionId}>
              <td>{transaction.transactionId}</td>
              <td>{transaction.type}</td>
              <td>{transaction.account?.accountNumber || "—"}</td>
              <td>{formatMoney(transaction.amount)}</td>
              <td>
                <span className={`transaction-status ${transaction.status.toLowerCase()}`}>
                  {transaction.status}
                </span>
              </td>
              <td>{formatDate(transaction.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
