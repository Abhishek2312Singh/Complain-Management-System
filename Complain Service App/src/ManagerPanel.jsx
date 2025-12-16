import React, { useEffect, useState } from "react";

const MENU_ITEMS = [
  { key: "profile", label: "Update Profile" },
  { key: "complains", label: "Complains" }
];

const ManagerPanel = () => {
  const [activeKey, setActiveKey] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileUpdateMessage, setProfileUpdateMessage] = useState("");
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetCurrentPassword, setResetCurrentPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [managerComplaints, setManagerComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");
  const [openingComplain, setOpeningComplain] = useState(false);
  const [openedComplain, setOpenedComplain] = useState(null);
  const [openError, setOpenError] = useState("");
  const [responses, setResponses] = useState({});
  const [updatingResponse, setUpdatingResponse] = useState({});
  const [responseMessages, setResponseMessages] = useState({});

  const fetchProfile = async (showLoading = true) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setProfileError("You are not authenticated. Please login again.");
      setProfileData(null);
      return;
    }

    if (showLoading) {
      setProfileLoading(true);
    }
    setProfileError("");
    try {
      const response = await fetch("http://localhost:8080/getuser", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setProfileData(data);
      setProfileDirty(false);
    } catch (err) {
      setProfileError("Failed to load profile details from the server.");
      setProfileData(null);
    } finally {
      if (showLoading) {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeKey !== "profile") return;
    fetchProfile();
  }, [activeKey]);

  useEffect(() => {
    if (activeKey !== "complains") return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setComplaintsError("You are not authenticated. Please login again.");
      setManagerComplaints([]);
      return;
    }

    const fetchManagerComplaints = async () => {
      setComplaintsLoading(true);
      setComplaintsError("");
      try {
        const response = await fetch("http://localhost:8080/manager/getcomplain", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          setComplaintsError(
            errorText && errorText.trim().length > 0
              ? errorText.trim()
              : `Failed to load complaints. Status: ${response.status}`
          );
          setManagerComplaints([]);
          return;
        }
        
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = text.split("\n").filter(line => line.trim().length > 0);
          }
        }
        
        // Handle array of complaints
        if (Array.isArray(data)) {
          setManagerComplaints(data);
        } else if (data && typeof data === "object") {
          const extracted = data.complaints || data.data || data.list || [];
          setManagerComplaints(Array.isArray(extracted) ? extracted : []);
        } else {
          setManagerComplaints([]);
        }
      } catch (err) {
        setComplaintsError("Failed to load complaints from the server.");
        setManagerComplaints([]);
      } finally {
        setComplaintsLoading(false);
      }
    };

    fetchManagerComplaints();
  }, [activeKey]);

  const handleOpenComplain = async (complainNumber) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setOpenError("You are not authenticated. Please login again.");
      return;
    }

    setOpeningComplain(true);
    setOpenError("");
    setOpenedComplain(null);
    
    try {
      const response = await fetch(
        `http://localhost:8080/complain/getcomplain?complainNumber=${encodeURIComponent(complainNumber)}`,
        {
          method: "GET",
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
            : `Failed to fetch complain details. Status: ${response.status}`
        );
      }
      
      const data = await response.json();
      setOpenedComplain(data);
    } catch (err) {
      setOpenError(err.message || "Failed to load complain details.");
    } finally {
      setOpeningComplain(false);
    }
  };

  const renderContent = () => {
    switch (activeKey) {
      case "profile":
        return (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}
            >
              <h2>Update Profile</h2>
              <button
                type="button"
                onClick={() => {
                  setShowResetForm((prev) => !prev);
                  setResetError("");
                  setResetSuccessMessage("");
                }}
                style={{
                  width: "auto",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#e5e7eb",
                  color: "#111827",
                  font: "inherit",
                  cursor: "pointer"
                }}
              >
                {showResetForm ? "Close Reset" : "Reset Password"}
              </button>
            </div>
            <p style={{ marginBottom: "8px", color: "#6b7280", fontSize: "0.9rem" }}>
              Here you can update your manager name, email, and contact details, or reset your
              password.
            </p>
            {resetSuccessMessage && (
              <p
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                  color: "#166534",
                  fontWeight: 600
                }}
              >
                {resetSuccessMessage}
              </p>
            )}
            {showResetForm && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe"
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: "8px",
                    fontSize: "0.95rem"
                  }}
                >
                  Reset Password
                </h3>
                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    gridTemplateColumns: "1fr"
                  }}
                >
                  <div>
                    <label
                      htmlFor="current-password"
                      style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}
                    >
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={resetCurrentPassword}
                      onChange={(e) => setResetCurrentPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        font: "inherit"
                      }}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-password"
                      style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        font: "inherit"
                      }}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirm-password"
                      style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        font: "inherit"
                      }}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  {resetError && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: "#b91c1c"
                      }}
                    >
                      {resetError}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!resetCurrentPassword || !resetNewPassword || !resetConfirmPassword) {
                          setResetError("All password fields are required.");
                          return;
                        }
                        if (resetNewPassword !== resetConfirmPassword) {
                          setResetError("New password and confirm password do not match.");
                          return;
                        }
                        const token = localStorage.getItem("authToken");
                        if (!token) {
                          setResetError("You are not authenticated. Please login again.");
                          return;
                        }
                        setResetSubmitting(true);
                        setResetError("");
                        setResetSuccessMessage("");
                        (async () => {
                          try {
                            const response = await fetch(
                              `http://localhost:8080/updatepassword?currentPassword=${encodeURIComponent(
                                resetCurrentPassword
                              )}&newPassword=${encodeURIComponent(
                                resetNewPassword
                              )}&confirmPassword=${encodeURIComponent(resetConfirmPassword)}`,
                              {
                                method: "PUT",
                                headers: {
                                  Authorization: `Bearer ${token}`
                                }
                              }
                            );
                            const serverText = await response.text().catch(() => "");
                            if (!response.ok) {
                              setResetError(
                                serverText && serverText.trim().length > 0
                                  ? serverText.trim()
                                  : `Update failed with status ${response.status}`
                              );
                              return;
                            }
                            setResetCurrentPassword("");
                            setResetNewPassword("");
                            setResetConfirmPassword("");
                            setShowResetForm(false);
                            setResetSuccessMessage(
                              serverText && serverText.trim().length > 0
                                ? serverText.trim()
                                : "Password updated successfully."
                            );
                          } catch (err) {
                            setResetError("Failed to update password. Please try again.");
                          } finally {
                            setResetSubmitting(false);
                          }
                        })();
                      }}
                      disabled={resetSubmitting}
                    >
                      {resetSubmitting ? "Submitting..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {profileLoading && (
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading profile...</p>
            )}
            {profileError && (
              <p style={{ color: "#b91c1c", fontSize: "0.9rem", fontWeight: 600 }}>
                {profileError}
              </p>
            )}
            {profileData && !profileLoading && !profileError && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem"
                  }}
                >
                  <tbody>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb",
                          width: "40%"
                        }}
                      >
                        Full Name
                      </th>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb"
                        }}
                      >
                        {profileData.fullName || "—"}
                      </td>
                    </tr>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb"
                        }}
                      >
                        Email
                      </th>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb"
                        }}
                      >
                        <input
                          type="email"
                          value={profileData.email || ""}
                          onFocus={() => setProfileDirty(true)}
                          onChange={(e) => {
                            setProfileDirty(true);
                            setProfileData((prev) => ({ ...prev, email: e.target.value }));
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            font: "inherit"
                          }}
                          placeholder="Enter email"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb"
                        }}
                      >
                        Mobile
                      </th>
                      <td
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid #e5e7eb"
                        }}
                      >
                        <input
                          type="tel"
                          value={profileData.mobile || ""}
                          onFocus={() => setProfileDirty(true)}
                          onChange={(e) => {
                            setProfileDirty(true);
                            setProfileData((prev) => ({ ...prev, mobile: e.target.value }));
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            font: "inherit"
                          }}
                          placeholder="Enter mobile"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "6px 8px"
                        }}
                      >
                        Username
                      </th>
                      <td
                        style={{
                          padding: "6px 8px"
                        }}
                      >
                        {profileData.username || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {profileDirty && (
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      justifyContent: "flex-end"
                    }}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        if (!profileData) return;
                        const token = localStorage.getItem("authToken");
                        if (!token) {
                          setProfileUpdateMessage(
                            "You are not authenticated. Please login again before updating."
                          );
                          return;
                        }
                        setProfileUpdateMessage("");
                        setProfileUpdateSuccess(false);
                        setProfileUpdating(true);
                        try {
                          const response = await fetch("http://localhost:8080/updateuser", {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              email: profileData.email,
                              mobile: profileData.mobile
                            })
                          });
                          const serverText = await response.text().catch(() => "");
                          if (!response.ok) {
                            setProfileUpdateSuccess(false);
                            setProfileUpdateMessage(
                              serverText && serverText.trim().length > 0
                                ? serverText.trim()
                                : `Update failed with status ${response.status}`
                            );
                            return;
                          }
                          setProfileUpdateSuccess(true);
                          setProfileUpdateMessage(
                            serverText && serverText.trim().length > 0
                              ? serverText.trim()
                              : "Profile updated successfully."
                          );
                          setProfileDirty(false);
                          // Refresh profile data after successful update (without showing loading state)
                          await fetchProfile(false);
                        } catch (err) {
                          setProfileUpdateSuccess(false);
                          setProfileUpdateMessage(
                            "Failed to update profile. Please try again or contact support."
                          );
                        } finally {
                          setProfileUpdating(false);
                        }
                      }}
                      disabled={profileUpdating}
                    >
                      {profileUpdating ? "Updating..." : "Update Profile"}
                    </button>
                  </div>
                )}
                {profileUpdateMessage && (
                  <p
                    style={{
                      marginTop: "6px",
                      fontSize: "0.85rem",
                      color: profileUpdateSuccess ? "#166534" : "#b91c1c",
                      fontWeight: profileUpdateSuccess ? 600 : 400
                    }}
                  >
                    {profileUpdateMessage}
                  </p>
                )}
              </div>
            )}
          </>
        );
      case "complains":
        return (
          <>
            <h2>Complains</h2>
            <p style={{ marginBottom: "12px", color: "#6b7280", fontSize: "0.9rem" }}>
              View and manage complaints assigned to you.
            </p>
            {complaintsLoading && (
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading complaints...</p>
            )}
            {complaintsError && (
              <p style={{ color: "#b91c1c", fontSize: "0.9rem", fontWeight: 600 }}>
                {complaintsError}
              </p>
            )}
            {!complaintsLoading && !complaintsError && managerComplaints.length > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem"
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          borderBottom: "2px solid #d1d5db",
                          fontWeight: 600,
                          color: "#111827"
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          borderBottom: "2px solid #d1d5db",
                          fontWeight: 600,
                          color: "#111827"
                        }}
                      >
                        Complain Number
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          borderBottom: "2px solid #d1d5db",
                          fontWeight: 600,
                          color: "#111827"
                        }}
                      >
                        Response
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "8px 12px",
                          borderBottom: "2px solid #d1d5db",
                          fontWeight: 600,
                          color: "#111827"
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerComplaints.map((complaint, index) => {
                      const complainNumber = complaint.complainNumber || complaint.complain_number || complaint.id || String(complaint);
                      const status = complaint.status || complaint.complainStatus || "—";
                      const currentResponse = responses[complainNumber] !== undefined 
                        ? responses[complainNumber] 
                        : (complaint.response || complaint.complainResponse || complaint.complain_response || "");
                      const isUpdating = updatingResponse[complainNumber] || false;
                      const responseMessage = responseMessages[complainNumber] || "";
                      
                      return (
                        <tr key={index}>
                          <td
                            style={{
                              padding: "8px 12px",
                              borderBottom: "1px solid #e5e7eb"
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              borderBottom: "1px solid #e5e7eb"
                            }}
                          >
                            {String(complainNumber || "—")}
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              borderBottom: "1px solid #e5e7eb"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <textarea
                                value={currentResponse}
                                onChange={(e) => {
                                  setResponses((prev) => ({
                                    ...prev,
                                    [complainNumber]: e.target.value
                                  }));
                                  setResponseMessages((prev) => ({
                                    ...prev,
                                    [complainNumber]: ""
                                  }));
                                }}
                                placeholder="Enter response..."
                                style={{
                                  width: "100%",
                                  minWidth: "200px",
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #d1d5db",
                                  font: "inherit",
                                  fontSize: "0.85rem",
                                  resize: "vertical",
                                  minHeight: "60px"
                                }}
                                disabled={isUpdating}
                              />
                              {responseMessage && (
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.75rem",
                                    color: responseMessage.includes("successfully") || responseMessage.includes("Success") ? "#166534" : "#b91c1c",
                                    fontWeight: 500
                                  }}
                                >
                                  {responseMessage}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  const token = localStorage.getItem("authToken");
                                  if (!token) {
                                    setResponseMessages((prev) => ({
                                      ...prev,
                                      [complainNumber]: "You are not authenticated. Please login again."
                                    }));
                                    return;
                                  }
                                  
                                  setUpdatingResponse((prev) => ({
                                    ...prev,
                                    [complainNumber]: true
                                  }));
                                  setResponseMessages((prev) => ({
                                    ...prev,
                                    [complainNumber]: ""
                                  }));
                                  
                                  try {
                                    const response = await fetch(
                                      `http://localhost:8080/manager/addresponse?complainNumber=${encodeURIComponent(complainNumber)}&response=${encodeURIComponent(currentResponse)}`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          Authorization: `Bearer ${token}`
                                        }
                                      }
                                    );
                                    
                                    const serverText = await response.text().catch(() => "");
                                    if (!response.ok) {
                                      setResponseMessages((prev) => ({
                                        ...prev,
                                        [complainNumber]: serverText && serverText.trim().length > 0
                                          ? serverText.trim()
                                          : `Failed to update response. Status: ${response.status}`
                                      }));
                                    } else {
                                      setResponseMessages((prev) => ({
                                        ...prev,
                                        [complainNumber]: serverText && serverText.trim().length > 0
                                          ? serverText.trim()
                                          : "Response updated successfully."
                                      }));
                                      // Refresh complaints to get updated data
                                      const refreshResponse = await fetch("http://localhost:8080/manager/getcomplain", {
                                        method: "GET",
                                        headers: {
                                          Authorization: `Bearer ${token}`
                                        }
                                      });
                                      if (refreshResponse.ok) {
                                        const refreshData = await refreshResponse.json();
                                        if (Array.isArray(refreshData)) {
                                          setManagerComplaints(refreshData);
                                        } else if (refreshData && typeof refreshData === "object") {
                                          const extracted = refreshData.complaints || refreshData.data || refreshData.list || [];
                                          setManagerComplaints(Array.isArray(extracted) ? extracted : []);
                                        }
                                      }
                                    }
                                  } catch (err) {
                                    setResponseMessages((prev) => ({
                                      ...prev,
                                      [complainNumber]: "Failed to update response. Please try again."
                                    }));
                                  } finally {
                                    setUpdatingResponse((prev) => ({
                                      ...prev,
                                      [complainNumber]: false
                                    }));
                                  }
                                }}
                                disabled={isUpdating}
                                style={{
                                  width: "auto",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #d1d5db",
                                  background: isUpdating ? "#e5e7eb" : "#2563eb",
                                  color: isUpdating ? "#6b7280" : "#ffffff",
                                  font: "inherit",
                                  fontSize: "0.75rem",
                                  cursor: isUpdating ? "not-allowed" : "pointer",
                                  fontWeight: 500,
                                  alignSelf: "flex-start"
                                }}
                              >
                                {isUpdating ? "Updating..." : "Update Response"}
                              </button>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              borderBottom: "1px solid #e5e7eb",
                              textAlign: "right"
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenComplain(complainNumber)}
                              disabled={openingComplain}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                background: openingComplain ? "#e5e7eb" : "#2563eb",
                                color: openingComplain ? "#6b7280" : "#ffffff",
                                font: "inherit",
                                fontSize: "0.85rem",
                                cursor: openingComplain ? "not-allowed" : "pointer",
                                fontWeight: 500,
                                minWidth: "80px"
                              }}
                            >
                              {openingComplain ? "Opening..." : "Open"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!complaintsLoading && !complaintsError && managerComplaints.length === 0 && (
              <p style={{ marginTop: "10px", color: "#6b7280", fontSize: "0.9rem" }}>
                No complaints found.
              </p>
            )}
            {openError && (
              <p style={{ marginTop: "10px", color: "#b91c1c", fontSize: "0.9rem", fontWeight: 600 }}>
                {openError}
              </p>
            )}
            {openedComplain && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px"
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>Complaint Details</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenedComplain(null);
                      setOpenError("");
                    }}
                    style={{
                      width: "auto",
                      padding: "8px 12px",
                      borderRadius: "999px",
                      border: "1px solid #d1d5db",
                      background: "#e5e7eb",
                      color: "#111827",
                      font: "inherit",
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "8px"
                  }}
                >
                  {Object.entries(openedComplain)
                    .filter(([key, value]) => value !== null && value !== undefined && value !== "")
                    .map(([key, value]) => {
                      const displayKey = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();
                      const displayValue = Array.isArray(value)
                        ? value.join("\n")
                        : typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value);
                      return (
                        <div
                          key={key}
                          style={{
                            padding: "8px",
                            borderRadius: "6px",
                            background: "#ffffff",
                            border: "1px solid #e5e7eb"
                          }}
                        >
                          <strong style={{ color: "#111827", fontSize: "0.85rem" }}>
                            {displayKey}:
                          </strong>
                          <div
                            style={{
                              marginTop: "4px",
                              color: "#374151",
                              fontSize: "0.9rem",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word"
                            }}
                          >
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <main style={{ maxWidth: "1120px", margin: "28px auto 40px", padding: "0 16px 24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "flex-start"
        }}
      >
        <aside
          style={{
            background: "#ffffffcc",
            backdropFilter: "blur(10px)",
            borderRadius: "14px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
            padding: "14px 10px 14px 6px",
            marginLeft: "-20px"
          }}
        >
          <nav>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "10px",
                justifyItems: "stretch"
              }}
            >
              {MENU_ITEMS.map((item) => {
                const isActive = item.key === activeKey;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setActiveKey(item.key)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: "999px",
                        border: "none",
                        font: "inherit",
                        cursor: "pointer",
                        background: isActive ? "#2563eb" : "transparent",
                        color: isActive ? "#ffffff" : "#0f172a",
                        transition: "background 0.15s ease, color 0.15s ease"
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <section
          style={{
            background: "#ffffffcc",
            backdropFilter: "blur(10px)",
            borderRadius: "14px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
            padding: "18px 18px 22px"
          }}
        >
          {renderContent()}
        </section>
      </div>
    </main>
  );
};

export default ManagerPanel;

