import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import AdminPanel from "./AdminPanel";
import ManagerPanel from "./ManagerPanel";

const STORAGE_KEY = "complaints";
const STATUS_OPTIONS = ["PENDING", "IN_PROCESS", "Open", "In Progress", "Resolved", "Closed"];
const API_URL = "http://localhost:8080/complain/generatecomplain";
const TRACK_API_URL = "http://localhost:8080/complain/getcomplain";

const loadComplaints = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveComplaints = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const fallbackId = () =>
  `CMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const extractComplaintNumber = (data) => {
  if (data === null || data === undefined) return null;
  if (typeof data === "string" || typeof data === "number") return data;

  const candidates = [
    data.complainNumber,
    data.complaintNumber,
    data.complaintNo,
    data.complainNo,
    data.ticketNumber,
    data.ticketNo,
    data.number,
    data.id,
    data.data?.complainNumber,
    data.data?.complaintNumber,
    data.data?.id,
    data.data?.number
  ];

  return candidates.find((v) => v !== undefined && v !== null) ?? null;
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return value;
};

const formatDate = (value) => {
  if (!value) return "—";
  // If API sends plain date (YYYY-MM-DD), show as-is to avoid TZ shifts.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? displayValue(value) : d.toLocaleString();
};

const renderByStatus = (status, value, { hideOnPending = false, hideOnInProcess = false } = {}) => {
  const normalized = typeof status === "string" ? status.toUpperCase() : status;
  if (hideOnPending && normalized === "PENDING") return "";
  if (hideOnInProcess && normalized === "IN_PROCESS") return "";
  return displayValue(value);
};

const columnsBase = ["Complain No.", "Reporter", "Contact", "Address", "Complain", "Date", "Status"];

const getStatusValue = (item) =>
  typeof (item?.status || item?.complainStatus || item?.complaintStatus) === "string"
    ? (item.status || item.complainStatus || item.complaintStatus).trim()
    : item?.status || item?.complainStatus || item?.complaintStatus || "PENDING";

const renderRow = (item, index, onClose, onUpdateStatus, showManagerBlock) => {
  const dateValue = item.complainDate || item.createdAt;
  const statusValue = getStatusValue(item);
  const rowId = item.complaintNumber || item.complainNumber || item.id;
  return (
    <tr key={item.id || index}>
      <td>{displayValue(rowId)}</td>
      <td>
        <div>
          <strong>{displayValue(item.username)}</strong>
        </div>
        <div style={{ color: "#475569" }}>{displayValue(item.email)}</div>
      </td>
      <td>{displayValue(item.mobile ?? item.mobileNumber ?? item.contactNumber)}</td>
      <td>{displayValue(item.address)}</td>
      <td>{displayValue(item.complain)}</td>
      <td>{formatDate(dateValue)}</td>
      <td>{displayValue(statusValue)}</td>
      {showManagerBlock && (
        <>
          <td>{renderByStatus(statusValue, item.managerName, { hideOnPending: true })}</td>
          <td>{renderByStatus(statusValue, item.managerEmail, { hideOnPending: true })}</td>
          <td>{renderByStatus(statusValue, item.managerMobile, { hideOnPending: true })}</td>
          <td>
            {renderByStatus(statusValue, item.complainResponse, {
              hideOnPending: true,
              hideOnInProcess: true
            })}
          </td>
        </>
      )}
      <td>
        <div className="actions">
          <button
            type="button"
            style={{ background: "#ef4444" }}
            onClick={() => onClose(rowId)}
          >
            Close
          </button>
        </div>
      </td>
    </tr>
  );
};

function App() {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    mobile: "",
    email: "",
    address: "",
    complain: ""
  });
  const [filters] = useState({
    search: "",
    status: "",
    sort: "created_desc"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const formSectionRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    setComplaints(loadComplaints());
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      // Check user type on initial load
      const checkUserType = async () => {
        try {
          const response = await fetch("http://localhost:8080/getuser", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${savedToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const username = data.username || data.userName || "";
            if (username.toLowerCase() === "admin") {
              setIsAdmin(true);
              setIsManager(false);
            } else {
              setIsAdmin(false);
              setIsManager(true);
            }
          } else {
            // If check fails, assume not logged in
            setIsAdmin(false);
            setIsManager(false);
          }
        } catch (err) {
          // If check fails, assume not logged in
          setIsAdmin(false);
          setIsManager(false);
        }
      };
      checkUserType();
    }
  }, []);

  useEffect(() => {
    saveComplaints(complaints);
  }, [complaints]);

  const filteredAndSorted = useMemo(() => {
    return [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [complaints]);

  const hasNonPending = useMemo(
    () =>
      filteredAndSorted.some((item) => getStatusValue(item).toUpperCase() !== "PENDING") ||
      (lookupResult && getStatusValue(lookupResult).toUpperCase() !== "PENDING"),
    [filteredAndSorted, lookupResult]
  );

  const columns = useMemo(
    () =>
      hasNonPending
        ? [...columnsBase, "Manager", "Manager Email", "Manager Mobile", "Response", "Actions"]
        : [...columnsBase, "Actions"],
    [hasNonPending]
  );

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.mobile.trim() ||
      !formData.address.trim() ||
      !formData.complain.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    const payload = {
      username: formData.username.trim(),
      mobile: Number(formData.mobile.trim()),
      email: formData.email.trim(),
      address: formData.address.trim(),
      complain: formData.complain.trim()
    };

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      const complaintNumber = extractComplaintNumber(responseData) ?? fallbackId();
      const complainDate =
        responseData?.complainDate || responseData?.createdAt || new Date().toISOString();
      const statusFromServer = responseData?.status || "Open";

      const entry = {
        id: complaintNumber,
        ...payload,
        ...responseData,
        complaintNumber,
        status: statusFromServer,
        createdAt: complainDate
      };

      // Do not add new complaints to the list/table; only show via search API.
      setFormData({ username: "", mobile: "", email: "", address: "", complain: "" });
      window.alert(
        `Complain Submitted. This is your complain number : ${complaintNumber} \n Save it to track your complain.`
      );
      console.info("Server response for complaint submission:", responseData);
    } catch (err) {
      setError("Failed to submit complaint. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = (id, status) => {
    setComplaints((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const closeComplaint = async (id) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.alert("You are not authenticated. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/closecomplain?complainNumber=${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          errorText && errorText.trim().length > 0
            ? errorText.trim()
            : `Failed to close complain. Status: ${response.status}`
        );
      }

      // API returns void (status-only), so don't attempt to read/parse a body.
      window.alert("Complain closed successfully.");
    } catch (err) {
      window.alert(err?.message || "Failed to close complain.");
      return;
    }

    const matches = (item) =>
      item.id === id || item.complaintNumber === id || item.complainNumber === id;

    setComplaints((prev) => prev.filter((item) => !matches(item)));

    setLookupResult((prev) => {
      if (!prev) return prev;
      return matches(prev) ? null : prev;
    });
  };

  const handleLookup = async () => {
    const trimmed = lookupNumber.trim();
    if (!trimmed) {
      setLookupError("Enter a complaint number.");
      setLookupResult(null);
      return;
    }

    setLookingUp(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const response = await fetch(
        `${TRACK_API_URL}?complainNumber=${encodeURIComponent(trimmed)}`
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setLookupResult(data);
    } catch (err) {
      setLookupError("Could not fetch complaint. Please verify the number.");
      console.error(err);
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <>
      <Header
        onComplainClick={() => {
          setShowForm(true);
        }}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={() => {
          localStorage.removeItem("authToken");
          setIsAdmin(false);
          setIsManager(false);
        }}
        isAdmin={isAdmin}
        isManager={isManager}
      />

      {isAdmin ? (
        <AdminPanel />
      ) : isManager ? (
        <ManagerPanel />
      ) : (
        <main>
        {showForm && (
          <section ref={formSectionRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Complaint Registration Form</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  width: "auto",
                  minWidth: "32px",
                  paddingInline: "10px",
                  borderRadius: "999px",
                  background: "#e5e7eb",
                  color: "#0f172a",
                  boxShadow: "none"
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username">Full Name</label>
                <input
                  id="username"
                  name="username"
                  required
                  placeholder="Jane Doe"
                  value={formData.username}
                  onChange={(e) => updateForm("username", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="mobile">Mobile</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={formData.mobile}
                  onChange={(e) => updateForm("mobile", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  required
                  placeholder="123 Main St, City"
                  value={formData.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="complain">Complain</label>
                <textarea
                  id="complain"
                  name="complain"
                  required
                  placeholder="Describe the issue..."
                  value={formData.complain}
                  onChange={(e) => updateForm("complain", e.target.value)}
                />
              </div>
              {error && (
                <div style={{ gridColumn: "1 / -1", color: "#b91c1c", fontWeight: 600 }}>
                  {error}
                </div>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Add Complaint"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section>
          <h2>Track Complaints</h2>
          <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
            <div>
              <label htmlFor="lookup-number">Enter your Complaint Number :</label>
              <input
                id="lookup-number"
                placeholder="Enter complaint number"
                value={lookupNumber}
                onChange={(e) => setLookupNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLookup();
                  }
                }}
              />
            </div>
            <div>
              <button type="button" onClick={handleLookup} disabled={lookingUp}>
                {lookingUp ? "Looking up..." : "Fetch Complaint"}
              </button>
            </div>
            {lookupError && (
              <div style={{ color: "#b91c1c", fontWeight: 600 }}>{lookupError}</div>
            )}
            {lookupResult && (
              <div className="list" style={{ marginTop: "8px" }}>
                <table>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {renderRow(lookupResult, 0, closeComplaint, updateStatus, hasNonPending)}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="list">
            {filteredAndSorted.length > 0 && (
              <table>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((item, index) =>
                    renderRow(item, index, closeComplaint, updateStatus, hasNonPending)
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
      )}

      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Login</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowLogin(false)}
              >
                ✕
              </button>
            </div>
            <form
              className="modal-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!loginUsername.trim() || !loginPassword.trim()) {
                  setLoginError("Username and password are required.");
                  return;
                }
                setLoginError("");
                setLoggingIn(true);
                try {
                  const response = await fetch("http://localhost:8080/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      username: loginUsername.trim(),
                      password: loginPassword
                    })
                  });
                  if (!response.ok) {
                    throw new Error(`Login failed with status ${response.status}`);
                  }
                  const data = await response.text();
                  const token = typeof data === "string" ? data.trim() : null;
                  if (token) {
                    localStorage.setItem("authToken", token);
                    // Check if user is admin or manager
                    try {
                      const userResponse = await fetch("http://localhost:8080/getuser", {
                        method: "GET",
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });
                      if (userResponse.ok) {
                        const userData = await userResponse.json();
                        const username = userData.username || userData.userName || "";
                        if (username.toLowerCase() === "admin") {
                          setIsAdmin(true);
                          setIsManager(false);
                        } else {
                          setIsAdmin(false);
                          setIsManager(true);
                        }
                      } else {
                        // If user check fails, try to use the login username
                        const loginUser = loginUsername.trim().toLowerCase();
                        if (loginUser === "admin") {
                          setIsAdmin(true);
                          setIsManager(false);
                        } else {
                          setIsAdmin(false);
                          setIsManager(true);
                        }
                      }
                    } catch (err) {
                      // If user check fails, try to use the login username
                      const loginUser = loginUsername.trim().toLowerCase();
                      if (loginUser === "admin") {
                        setIsAdmin(true);
                        setIsManager(false);
                      } else {
                        setIsAdmin(false);
                        setIsManager(true);
                      }
                    }
                    setShowLogin(false);
                    setLoginUsername("");
                    setLoginPassword("");
                  } else {
                    setLoginError("Login succeeded but no token was returned by the server.");
                  }
                } catch (err) {
                  console.error(err);
                  setLoginError("Invalid username or password. Please try again.");
                } finally {
                  setLoggingIn(false);
                }
              }}
            >
              <div>
                <label htmlFor="login-username">Username</label>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              {loginError && (
                <div style={{ color: "#b91c1c", fontWeight: 600, fontSize: "0.9rem" }}>
                  {loginError}
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" disabled={loggingIn}>
                  {loggingIn ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default App;

