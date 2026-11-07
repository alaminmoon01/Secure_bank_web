import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/auth";

export default function LoginRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("adminToken");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/login-requests`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load login requests.");
      }

      const list =
        data.requests ||
        data.loginRequests ||
        data.data ||
        [];

      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    try {
      setProcessingId(requestId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/login-requests/${requestId}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} request.`);
      }

      setSuccess(
        data.message ||
          `Login request ${action === "approve" ? "approved" : "rejected"} successfully.`
      );

      await fetchRequests();
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusStyle = (status) => {
    const normalizedStatus = String(status || "PENDING").toUpperCase();

    if (normalizedStatus === "APPROVED") {
      return { background: "#dcfce7", color: "#166534" };
    }

    if (normalizedStatus === "REJECTED") {
      return { background: "#fee2e2", color: "#991b1b" };
    }

    return { background: "#fef3c7", color: "#92400e" };
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Login Requests</h2>
          <p style={styles.description}>
            Review and manage customer login approval requests.
          </p>
        </div>

        <button style={styles.refreshButton} onClick={fetchRequests}>
          Refresh
        </button>
      </div>

      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <h3>{requests.length}</h3>
          <p>Total Requests</p>
        </div>

        <div style={styles.summaryCard}>
          <h3>
            {
              requests.filter(
                (r) => String(r.status).toUpperCase() === "PENDING"
              ).length
            }
          </h3>
          <p>Pending</p>
        </div>

        <div style={styles.summaryCard}>
          <h3>
            {
              requests.filter(
                (r) => String(r.status).toUpperCase() === "APPROVED"
              ).length
            }
          </h3>
          <p>Approved</p>
        </div>

        <div style={styles.summaryCard}>
          <h3>
            {
              requests.filter(
                (r) => String(r.status).toUpperCase() === "REJECTED"
              ).length
            }
          </h3>
          <p>Rejected</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {loading ? (
        <p style={styles.message}>Loading login requests...</p>
      ) : requests.length === 0 ? (
        <p style={styles.message}>No login requests found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Device</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>Browser</th>
                <th style={styles.th}>Operating System</th>
                <th style={styles.th}>Request Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => {
                const customer = request.customer || {};
                const device =
                  request.device || request.trustedDevice || {};

                const status = String(
                  request.status || "PENDING"
                ).toUpperCase();

                const requestId = request.id || request.loginRequestId;

                return (
                  <tr key={requestId}>
                    <td style={styles.td}>
                      <strong>
                        {customer.fullName ||
                          customer.name ||
                          customer.mobileNumber ||
                          request.customerId ||
                          "N/A"}
                      </strong>
                      <br />
                      <small>{customer.mobileNumber || "N/A"}</small>
                    </td>

                    <td style={styles.td}>
                      {device.deviceName || "Unknown Device"}
                    </td>

                    <td style={styles.td}>
                      {device.ipAddress || request.ipAddress || "N/A"}
                    </td>

                    <td style={styles.td}>
                      {device.browser || "N/A"}
                    </td>

                    <td style={styles.td}>
                      {device.operatingSystem || "N/A"}
                    </td>

                    <td style={styles.td}>
                      {formatDate(request.createdAt)}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...getStatusStyle(status),
                        }}
                      >
                        {status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {status === "PENDING" ? (
                        <div style={styles.actions}>
                          <button
                            style={styles.approveButton}
                            disabled={processingId === requestId}
                            onClick={() =>
                              handleAction(requestId, "approve")
                            }
                          >
                            {processingId === requestId
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            style={styles.rejectButton}
                            disabled={processingId === requestId}
                            onClick={() =>
                              handleAction(requestId, "reject")
                            }
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={styles.reviewedText}>
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    color: "#1e293b",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "700",
  },

  description: {
    color: "#64748b",
    marginTop: "7px",
  },

  refreshButton: {
    padding: "10px 18px",
    background: "#1e40af",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },

  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  summaryCard: {
    background: "#fff",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },

  error: {
    padding: "12px",
    marginBottom: "15px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "7px",
  },

  success: {
    padding: "12px",
    marginBottom: "15px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "7px",
  },

  message: {
    padding: "25px",
    textAlign: "center",
    color: "#64748b",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },

  table: {
    width: "100%",
    minWidth: "1050px",
    borderCollapse: "collapse",
  },

  th: {
    padding: "14px",
    background: "#f1f5f9",
    textAlign: "left",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "13px",
  },

  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  actions: {
    display: "flex",
    gap: "7px",
  },

  approveButton: {
    padding: "7px 10px",
    background: "#15803d",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  rejectButton: {
    padding: "7px 10px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  reviewedText: {
    color: "#64748b",
    fontSize: "12px",
  },
};