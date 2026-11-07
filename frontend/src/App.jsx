
import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
  Outlet,
} from "react-router-dom";

import "./App.css";

import CustomerDashboard from "./pages/CustomerDashboard";
import AdminLayout from "./layouts/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateCustomer from "./pages/admin/CreateCustomer";
import CustomerManagement from "./pages/admin/CustomerManagement";
import Deposit from "./pages/admin/Deposit";
import Withdraw from "./pages/admin/Withdraw";
import Transactions from "./pages/admin/Transactions";
import LoginRequests from "./pages/admin/LoginRequests";
import DeviceManagement from "./pages/admin/DeviceManagement";
import SecurityReports from "./pages/admin/SecurityReports";
import AccountManagement from "./pages/admin/AccountManagement";
import SupportRequests from "./pages/admin/SupportRequests";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import Help from "./pages/admin/Help";
import CustomerRegistration from "./pages/CustomerRegistration";

const API_URL = "http://localhost:5000/api";

// API REQUEST HELPER
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

// CREATE A STABLE ID FOR THIS BROWSER
function getDeviceFingerprint() {
  const storageKey = "securebank_device_id";

  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    if (window.crypto?.randomUUID) {
      deviceId = window.crypto.randomUUID();
    } else {
      deviceId =
        "device-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).substring(2, 15);
    }

    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

// DEVICE NAME
function getDeviceName() {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Windows")) return "Windows PC";
  if (userAgent.includes("Android")) return "Android Device";
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("Linux")) return "Linux Device";

  return "Unknown Device";
}

// BRAND
function Brand() {
  return (
    <div className="brand">
      <div className="brand-icon">S</div>
      <span>
        Secure<span className="brand-highlight">Bank</span>
      </span>
    </div>
  );
}

// CUSTOMER LOGIN
function CustomerLogin() {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loginRequestId, setLoginRequestId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [approvalPending, setApprovalPending] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const deviceFingerprint = getDeviceFingerprint();

      const result = await apiRequest("/auth/customer/login", {
        method: "POST",
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim(),
          password,
          deviceFingerprint,
          deviceName: getDeviceName(),
        }),
      });

      if (result.requiresAdminApproval) {
        setApprovalPending(true);
        setRequiresTwoFactor(false);

        setMessage(
          result.message ||
          "Your device is waiting for Admin approval."
        );

        return;
      }

      if (result.requiresTwoFactor) {
        setLoginRequestId(result.loginRequestId);
        setRequiresTwoFactor(true);
        setApprovalPending(false);

        setMessage(
          result.message ||
          "Enter the OTP to continue."
        );

        // Development testing only.
        if (result.developmentOTP) {
          setOtp(result.developmentOTP);
        }

        return;
      }

      if (!result.token) {
        throw new Error("Login token was not received.");
      }

      localStorage.setItem("token", result.token);

      const customerData = result.user || result.customer;

      if (customerData) {
        localStorage.setItem(
          "user",
          JSON.stringify(customerData)
        );
      }

      navigate("/customer/dashboard");
    } catch (err) {
      setError(err.message || "Customer login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPVerification(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await apiRequest(
        "/auth/customer/verify-2fa",
        {
          method: "POST",
          body: JSON.stringify({
            loginRequestId,
            otp: otp.trim(),
          }),
        }
      );

      if (!result.token) {
        throw new Error("Verification token was not received.");
      }

      localStorage.setItem("token", result.token);

      const customerData = result.user || result.customer;

      if (customerData) {
        localStorage.setItem(
          "user",
          JSON.stringify(customerData)
        );
      }

      setMessage("Verification successful!");

      navigate("/customer/dashboard");
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function resetLogin() {
    setRequiresTwoFactor(false);
    setApprovalPending(false);
    setLoginRequestId(null);
    setOtp("");
    setPassword("");
    setError("");
    setMessage("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Brand />

        <div className="auth-heading">
          <h1>
            {requiresTwoFactor
              ? "Two-Factor Verification"
              : approvalPending
              ? "Device Approval Pending"
              : "Customer Login"}
          </h1>

          <p>
            {requiresTwoFactor
              ? "Verify your identity to access your account."
              : approvalPending
              ? "Your new device requires Admin approval."
              : "Sign in to access your SecureBank account."}
          </p>
        </div>

        {approvalPending ? (
          <div className="approval-pending">
            <h3>Admin Approval Required</h3>

            <p>
              Your login request has been submitted.
              Please wait until an administrator approves
              your device.
            </p>

            {message && (
              <p className="auth-success">{message}</p>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={resetLogin}
            >
              Back to Login
            </button>
          </div>
        ) : requiresTwoFactor ? (
          <form onSubmit={handleOTPVerification}>
            <div className="form-group">
              <label>Verification Code</label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                required
              />
            </div>

            {message && (
              <p className="auth-success">{message}</p>
            )}

            {error && (
              <p className="auth-error">{error}</p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="text-button"
              onClick={resetLogin}
              style={{ marginTop: "15px" }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Mobile Number</label>

              <input
                type="tel"
                placeholder="Enter your registered mobile number"
                value={mobileNumber}
                onChange={(e) =>
                  setMobileNumber(e.target.value)
                }
                autoComplete="tel"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="auth-error">{error}</p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        )}

        {!approvalPending && !requiresTwoFactor && (
          <div className="auth-footer">
            <p>
              First time here?{" "}
              <Link to="/register">
                Create Password / Register
              </Link>
            </p>

            <p>
              Are you an administrator?{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => navigate("/admin/login")}
              >
                Admin Login
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ADMIN LOGIN
function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await apiRequest("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          pin,
          password,
        }),
      });

      if (!result.token) {
        throw new Error("Admin login token was not received.");
      }

      localStorage.setItem("adminToken", result.token);

      const adminData = result.user || result.admin;

      if (adminData) {
        localStorage.setItem(
          "adminUser",
          JSON.stringify(adminData)
        );
      }

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Brand />

        <div className="auth-heading">
          <h1>Admin Login</h1>
          <p>Secure administrator access.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="form-group">
            <label>Admin PIN</label>

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              placeholder="Enter admin PIN"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Admin Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Customer?{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/login")}
            >
              Customer Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ADMIN PROTECTED ROUTE
function AdminGuard() {
  if (!localStorage.getItem("adminToken")) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

// CUSTOMER PROTECTED ROUTE
function CustomerRoute() {
  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  return <CustomerDashboard />;
}

// MAIN APP
export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route path="/login" element={<CustomerLogin />} />

      <Route
        path="/register"
        element={<CustomerRegistration />}
      />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/customer/dashboard"
        element={<CustomerRoute />}
      />

      <Route path="/admin" element={<AdminGuard />}>
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="create-customer"
          element={<CreateCustomer />}
        />

        <Route
          path="customers"
          element={<CustomerManagement />}
        />

        <Route path="deposit" element={<Deposit />} />

        <Route path="withdraw" element={<Withdraw />} />

        <Route
          path="transactions"
          element={<Transactions />}
        />

        <Route
          path="login-requests"
          element={<LoginRequests />}
        />

        <Route
          path="devices"
          element={<DeviceManagement />}
        />

        <Route
          path="security-reports"
          element={<SecurityReports />}
        />

        <Route
          path="accounts"
          element={<AccountManagement />}
        />

        <Route
          path="support"
          element={<SupportRequests />}
        />

        <Route path="reports" element={<Reports />} />

        <Route path="settings" element={<Settings />} />

        <Route path="help" element={<Help />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
