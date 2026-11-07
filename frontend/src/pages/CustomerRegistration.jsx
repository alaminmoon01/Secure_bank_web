import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerRegistration.css";

const API_URL = "http://localhost:5000/api";

export default function CustomerRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    accountNumber: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/customer/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Registration failed."
        );
      }

      setSuccess(
        "Registration successful! You can now login."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registration-page">
      <div className="registration-card">

        <div className="registration-brand">
          <div className="registration-logo">S</div>

          <h2>
            Secure<span>Bank</span>
          </h2>
        </div>

        <div className="registration-heading">
          <h1>Customer Registration</h1>

          <p>
            Create your password using your existing
            SecureBank account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="registration-field">
            <label>Account Number</label>

            <input
              type="text"
              name="accountNumber"
              placeholder="Enter your account number"
              value={formData.accountNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registration-field">
            <label>Registered Mobile Number</label>

            <input
              type="tel"
              name="mobileNumber"
              placeholder="Enter your registered mobile number"
              value={formData.mobileNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registration-field">
            <label>Create Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="registration-field">
            <label>Confirm Password</label>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="registration-error">
              {error}
            </div>
          )}

          {success && (
            <div className="registration-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="registration-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <div className="registration-footer">
          Already registered?

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login Now
          </button>
        </div>

      </div>
    </div>
  );
}