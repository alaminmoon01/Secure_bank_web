
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminPages.css";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/customers",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load customers.");
        }

        setCustomers(data.customers || data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const text = [
      customer.fullName,
      customer.firstName,
      customer.lastName,
      customer.mobileNumber,
      customer.nid,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Customer Management</h2>
          <p>Search and view customer records.</p>
        </div>

        <button
          className="green-button"
          onClick={() => navigate("/admin/create-customer")}
        >
          + Create Customer
        </button>
      </div>

      <div className="admin-card">
        <div className="table-tools">
          <input
            className="search-input"
            placeholder="Search name, mobile or NID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="muted">
            {filteredCustomers.length} customer(s)
          </span>
        </div>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <p className="empty-panel">Loading customers...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>NID</th>
                  <th>Registration</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      {customer.fullName ||
                        `${customer.firstName || ""} ${customer.lastName || ""}`}
                    </td>

                    <td>{customer.mobileNumber}</td>
                    <td>{customer.nid || "—"}</td>

                    <td>
                      {customer.isRegistered
                        ? "Registered"
                        : "Not Registered"}
                    </td>

                    <td>
                      <span
                        className={`status-tag ${
                          customer.isActive === false ? "blocked" : ""
                        }`}
                      >
                        {customer.isActive === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredCustomers.length && (
              <p className="empty-panel">
                No customer records found.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
