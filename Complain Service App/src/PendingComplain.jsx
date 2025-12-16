import React, { useEffect, useState } from "react";

const PendingComplain = () => {
  const [complainNumbers, setComplainNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openingComplain, setOpeningComplain] = useState(false);
  const [openedComplain, setOpenedComplain] = useState(null);
  const [openError, setOpenError] = useState("");
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [selectedManagers, setSelectedManagers] = useState({});
  const [updatingComplain, setUpdatingComplain] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    const fetchPendingComplains = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("http://localhost:8080/getallcomplain?status=PENDING", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error("API Error:", response.status, errorText);
          setError(
            errorText && errorText.trim().length > 0
              ? errorText.trim()
              : `Failed to load pending complaints. Status: ${response.status}`
          );
          setComplainNumbers([]);
          return;
        }
        
        // Try to parse as JSON first, fallback to text
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            // If it's not JSON, treat as array of strings (one per line)
            data = text.split("\n").filter(line => line.trim().length > 0);
          }
        }
        
        // Handle list of strings - ensure we get an array of strings
        if (Array.isArray(data)) {
          // Map each item to string to handle any type conversion
          setComplainNumbers(data.map(item => String(item).trim()).filter(item => item.length > 0));
        } else if (data && typeof data === "object") {
          // If it's an object, try to extract an array from common properties
          const numbers = data.complainNumbers || data.data || data.list || [];
          setComplainNumbers(Array.isArray(numbers) ? numbers.map(item => String(item).trim()).filter(item => item.length > 0) : []);
        } else {
          setComplainNumbers([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to load pending complaints: ${err.message}`);
        setComplainNumbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingComplains();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return;
    }

    const fetchManagers = async () => {
      setManagersLoading(true);
      try {
        const response = await fetch("http://localhost:8080/manager/getall", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          console.error("Failed to load managers:", response.status);
          setManagers([]);
          return;
        }
        const data = await response.json();
        // Store full manager objects
        const managerList = Array.isArray(data) ? data : [];
        setManagers(managerList);
      } catch (err) {
        console.error("Error fetching managers:", err);
        setManagers([]);
      } finally {
        setManagersLoading(false);
      }
    };

    fetchManagers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      // Reset to show all complaints when search is cleared
      const token = localStorage.getItem("authToken");
      if (!token) return;
      
      const fetchPendingComplains = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch("http://localhost:8080/getallcomplain?status=PENDING", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            setError(
              errorText && errorText.trim().length > 0
                ? errorText.trim()
                : `Failed to load pending complaints. Status: ${response.status}`
            );
            setComplainNumbers([]);
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
          
          if (Array.isArray(data)) {
            setComplainNumbers(data.map(item => String(item).trim()).filter(item => item.length > 0));
          } else if (data && typeof data === "object") {
            const numbers = data.complainNumbers || data.data || data.list || [];
            setComplainNumbers(Array.isArray(numbers) ? numbers.map(item => String(item).trim()).filter(item => item.length > 0) : []);
          } else {
            setComplainNumbers([]);
          }
        } catch (err) {
          console.error("Fetch error:", err);
          setError(`Failed to load pending complaints: ${err.message}`);
          setComplainNumbers([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPendingComplains();
    } else {
      const timeoutId = setTimeout(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("You are not authenticated. Please login again.");
          return;
        }

        const searchComplains = async () => {
          setLoading(true);
          setError("");
          try {
            const response = await fetch(
              `http://localhost:8080/complain/searchcomplain?status=PENDING&complainNumber=${encodeURIComponent(searchTerm.trim())}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            if (!response.ok) {
              const errorText = await response.text().catch(() => "");
              setError(
                errorText && errorText.trim().length > 0
                  ? errorText.trim()
                  : `Failed to search complaints. Status: ${response.status}`
              );
              setComplainNumbers([]);
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
            
            // Handle search response - could be array of numbers or full objects
            let numbers = [];
            if (Array.isArray(data)) {
              if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
                // Full objects - extract complain numbers
                numbers = data.map(item => {
                  const num = item.complainNumber || item.complain_number || item.id || "";
                  return String(num).trim();
                }).filter(num => num.length > 0);
              } else {
                // Just numbers
                numbers = data.map(item => String(item).trim()).filter(item => item.length > 0);
              }
            } else if (data && typeof data === "object" && !Array.isArray(data)) {
              const extracted = data.complainNumbers || data.data || data.list || [];
              if (Array.isArray(extracted) && extracted.length > 0) {
                if (typeof extracted[0] === "object") {
                  numbers = extracted.map(item => {
                    const num = item.complainNumber || item.complain_number || item.id || "";
                    return String(num).trim();
                  }).filter(num => num.length > 0);
                } else {
                  numbers = extracted.map(item => String(item).trim()).filter(item => item.length > 0);
                }
              }
            }
            
            setComplainNumbers(numbers);
          } catch (err) {
            setError(`Failed to search complaints: ${err.message}`);
            setComplainNumbers([]);
          } finally {
            setLoading(false);
          }
        };
        
        searchComplains();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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
      console.error("Error fetching complain:", err);
      setOpenError(err.message || "Failed to load complain details.");
    } finally {
      setOpeningComplain(false);
    }
  };

  const handleUpdateComplain = async (complainNumber) => {
    const selectedManager = selectedManagers[complainNumber];
    if (!selectedManager) {
      setUpdateMessage("Please select a manager first.");
      setTimeout(() => setUpdateMessage(""), 3000);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setUpdateMessage("You are not authenticated. Please login again.");
      setTimeout(() => setUpdateMessage(""), 3000);
      return;
    }

    setUpdatingComplain(true);
    setUpdateMessage("");
    
    try {
      // Update the complain with the selected manager
      const response = await fetch(
        `http://localhost:8080/assignmanager?complainNumber=${encodeURIComponent(complainNumber)}&managerUsername=${encodeURIComponent(selectedManager)}`,
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
            : `Failed to update complain. Status: ${response.status}`
        );
      }
      
      const data = await response.text().catch(() => "");
      setUpdateMessage(data && data.trim().length > 0 ? data.trim() : "Complain updated successfully.");
      setTimeout(() => setUpdateMessage(""), 3000);
    } catch (err) {
      console.error("Error updating complain:", err);
      setUpdateMessage(err.message || "Failed to update complain.");
      setTimeout(() => setUpdateMessage(""), 3000);
    } finally {
      setUpdatingComplain(false);
    }
  };

  const fetchPendingComplains = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8080/getallcomplain?status=PENDING", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("API Error:", response.status, errorText);
        setError(
          errorText && errorText.trim().length > 0
            ? errorText.trim()
            : `Failed to load pending complaints. Status: ${response.status}`
        );
        setComplainNumbers([]);
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
      
      if (Array.isArray(data)) {
        setComplainNumbers(data.map(item => String(item).trim()).filter(item => item.length > 0));
      } else if (data && typeof data === "object") {
        const numbers = data.complainNumbers || data.data || data.list || [];
        setComplainNumbers(Array.isArray(numbers) ? numbers.map(item => String(item).trim()).filter(item => item.length > 0) : []);
      } else {
        setComplainNumbers([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load pending complaints: ${err.message}`);
      setComplainNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0 }}>Pending Complain</h2>
          <button
            type="button"
            onClick={fetchPendingComplains}
            disabled={loading}
            style={{
              width: "auto",
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              background: "#e5e7eb",
              color: "#111827",
              font: "inherit",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            Refresh
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by complain number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            font: "inherit",
            fontSize: "0.9rem",
            width: "250px",
            outline: "none"
          }}
        />
      </div>
      <p style={{ marginBottom: "12px", color: "#6b7280", fontSize: "0.9rem" }}>
        View and manage all complaints that are currently in pending state.
      </p>
      {loading && <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading pending complaints...</p>}
      {error && (
        <p style={{ color: "#b91c1c", fontSize: "0.9rem", fontWeight: 600 }}>
          {error}
        </p>
      )}
      {updateMessage && (
        <p
          style={{
            color: updateMessage.includes("successfully") || updateMessage.includes("success") ? "#166534" : "#b91c1c",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginTop: "8px",
            marginBottom: "8px"
          }}
        >
          {updateMessage}
        </p>
      )}
      {!loading && !error && (
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
                  Assign Manager
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
              {complainNumbers.length > 0 ? (
                complainNumbers.map((complainNumber, index) => (
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
                      <select
                        value={selectedManagers[complainNumber] || ""}
                        onChange={(e) => {
                          setSelectedManagers(prev => ({
                            ...prev,
                            [complainNumber]: e.target.value
                          }));
                        }}
                        disabled={managersLoading}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "#ffffff",
                          font: "inherit",
                          fontSize: "0.85rem",
                          cursor: managersLoading ? "not-allowed" : "pointer"
                        }}
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager, idx) => {
                          // Try multiple possible field names for manager name
                          const managerName = manager.fullName || 
                                            manager.name || 
                                            manager.managerName ||
                                            manager.fullname ||
                                            manager.managerFullName ||
                                            manager.manager_fullName ||
                                            (manager.firstName && manager.lastName ? `${manager.firstName} ${manager.lastName}` : null) ||
                                            manager.username || 
                                            manager.managerUsername || 
                                            manager.userName ||
                                            "";
                          // Try multiple possible field names for username
                          const managerUsername = manager.username || 
                                                manager.managerUsername || 
                                                manager.userName ||
                                                manager.manager_userName ||
                                                manager.id ||
                                                `manager_${idx}`;
                          return (
                            <option key={managerUsername || manager.id || idx} value={managerUsername}>
                              {managerName || "Unknown Manager"}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        textAlign: "right"
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateComplain(complainNumber)}
                          disabled={updatingComplain || !selectedManagers[complainNumber]}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            background: updatingComplain || !selectedManagers[complainNumber] ? "#e5e7eb" : "#10b981",
                            color: updatingComplain || !selectedManagers[complainNumber] ? "#6b7280" : "#ffffff",
                            font: "inherit",
                            fontSize: "0.85rem",
                            cursor: updatingComplain || !selectedManagers[complainNumber] ? "not-allowed" : "pointer",
                            fontWeight: 500,
                            minWidth: "80px"
                          }}
                        >
                          {updatingComplain ? "Updating..." : "Update"}
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "16px 12px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "0.9rem"
                    }}
                  >
                    {searchTerm ? "No complaints found matching your search." : "No pending complaints found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {openError && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "0.9rem"
          }}
        >
          {openError}
        </div>
      )}
      
      {openedComplain && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "10px",
            background: "#f0f9ff",
            border: "1px solid #bae6fd"
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
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0c4a6e" }}>
              Complain Details
            </h3>
            <button
              type="button"
              onClick={() => {
                setOpenedComplain(null);
                setOpenError("");
              }}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #bae6fd",
                background: "#ffffff",
                color: "#0c4a6e",
                font: "inherit",
                cursor: "pointer",
                fontSize: "0.85rem"
              }}
            >
              Close
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: "8px",
              fontSize: "0.9rem"
            }}
          >
            {Object.entries(openedComplain)
              .filter(([key, value]) => value !== null && value !== undefined && value !== "")
              .map(([key, value]) => {
                // Format the key for display
                let displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
                
                // Replace Manager name related keys with "Assign Manager Name"
                if (key.toLowerCase().includes("manager") && (key.toLowerCase().includes("name") || key.toLowerCase() === "manager")) {
                  displayKey = "Assign Manager Name";
                }
                
                return (
                  <div
                    key={key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "150px 1fr",
                      gap: "8px",
                      padding: "6px 0",
                      borderBottom: "1px solid #e0f2fe"
                    }}
                  >
                    <strong style={{ color: "#075985" }}>
                      {displayKey}:
                    </strong>
                    <span style={{ color: "#0c4a6e" }}>
                      {String(value)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </section>
  );
};

export default PendingComplain;
