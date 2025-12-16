import React, { useEffect, useState } from "react";

const InProcessComplain = () => {
  const [complainNumbers, setComplainNumbers] = useState([]);
  const [complaints, setComplaints] = useState({}); // Store full complaint details by complain number
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openingComplain, setOpeningComplain] = useState(false);
  const [openedComplain, setOpenedComplain] = useState(null);
  const [openError, setOpenError] = useState("");
  const [closingComplain, setClosingComplain] = useState(false);
  const [closeMessage, setCloseMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    const fetchInProcessComplains = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("http://localhost:8080/getallcomplain?status=IN_PROCESS", {
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
              : `Failed to load in-process complaints. Status: ${response.status}`
          );
          setComplainNumbers([]);
          setComplaints({});
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
        let numbers = [];
        if (Array.isArray(data)) {
          // Map each item to string to handle any type conversion
          numbers = data.map(item => String(item).trim()).filter(item => item.length > 0);
        } else if (data && typeof data === "object") {
          // If it's an object, try to extract an array from common properties
          const extracted = data.complainNumbers || data.data || data.list || [];
          numbers = Array.isArray(extracted) ? extracted.map(item => String(item).trim()).filter(item => item.length > 0) : [];
        } else {
          numbers = [];
        }
        
        setComplainNumbers(numbers);
        
        // Fetch full details for each complaint to show manager name
        if (numbers.length > 0) {
          const complaintsMap = {};
          await Promise.all(
            numbers.map(async (complainNumber) => {
              try {
                const detailResponse = await fetch(
                  `http://localhost:8080/complain/getcomplain?complainNumber=${encodeURIComponent(complainNumber)}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                );
                if (detailResponse.ok) {
                  const detailData = await detailResponse.json();
                  complaintsMap[complainNumber] = detailData;
                }
              } catch {
                // Skip if fetch fails
              }
            })
          );
          setComplaints(complaintsMap);
        } else {
          setComplaints({});
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to load in-process complaints: ${err.message}`);
        setComplainNumbers([]);
        setComplaints({});
      } finally {
        setLoading(false);
      }
    };

    fetchInProcessComplains();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      // Reset to show all complaints when search is cleared
      const token = localStorage.getItem("authToken");
      if (!token) return;
      
      const fetchInProcessComplains = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch("http://localhost:8080/getallcomplain?status=IN_PROCESS", {
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
                : `Failed to load in-process complaints. Status: ${response.status}`
            );
            setComplainNumbers([]);
            setComplaints({});
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
          
          let numbers = [];
          if (Array.isArray(data)) {
            numbers = data.map(item => String(item).trim()).filter(item => item.length > 0);
          } else if (data && typeof data === "object") {
            const extracted = data.complainNumbers || data.data || data.list || [];
            numbers = Array.isArray(extracted) ? extracted.map(item => String(item).trim()).filter(item => item.length > 0) : [];
          }
          
          setComplainNumbers(numbers);
          
          if (numbers.length > 0) {
            const complaintsMap = {};
            await Promise.all(
              numbers.map(async (complainNumber) => {
                try {
                  const detailResponse = await fetch(
                    `http://localhost:8080/complain/getcomplain?complainNumber=${encodeURIComponent(complainNumber)}`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${token}`
                      }
                    }
                  );
                  if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    complaintsMap[complainNumber] = detailData;
                  }
                } catch {
                  // Skip if fetch fails
                }
              })
            );
            setComplaints(complaintsMap);
          } else {
            setComplaints({});
          }
        } catch (err) {
          setError(`Failed to load in-process complaints: ${err.message}`);
          setComplainNumbers([]);
          setComplaints({});
        } finally {
          setLoading(false);
        }
      };
      
      fetchInProcessComplains();
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
              `http://localhost:8080/complain/searchcomplain?status=IN_PROCESS&complainNumber=${encodeURIComponent(searchTerm.trim())}`,
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
              setComplaints({});
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
                // Full objects
                numbers = data.map(item => {
                  const num = item.complainNumber || item.complain_number || item.id || "";
                  return String(num).trim();
                }).filter(num => num.length > 0);
                const complaintsMap = {};
                data.forEach(item => {
                  const num = item.complainNumber || item.complain_number || item.id || "";
                  if (num) {
                    complaintsMap[String(num).trim()] = item;
                  }
                });
                setComplaints(complaintsMap);
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
                  const complaintsMap = {};
                  extracted.forEach(item => {
                    const num = item.complainNumber || item.complain_number || item.id || "";
                    if (num) {
                      complaintsMap[String(num).trim()] = item;
                    }
                  });
                  setComplaints(complaintsMap);
                } else {
                  numbers = extracted.map(item => String(item).trim()).filter(item => item.length > 0);
                }
              }
            }
            
            setComplainNumbers(numbers);
            
            // If we only got numbers, fetch full details
            if (numbers.length > 0) {
              const complaintsMap = {};
              await Promise.all(
                numbers.map(async (num) => {
                  try {
                    const detailResponse = await fetch(
                      `http://localhost:8080/complain/getcomplain?complainNumber=${encodeURIComponent(num)}`,
                      {
                        method: "GET",
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      }
                    );
                    if (detailResponse.ok) {
                      const detailData = await detailResponse.json();
                      complaintsMap[num] = detailData;
                    }
                  } catch {
                    // Skip if fetch fails
                  }
                })
              );
              setComplaints(complaintsMap);
            } else {
              setComplaints({});
            }
          } catch (err) {
            setError(`Failed to search complaints: ${err.message}`);
            setComplainNumbers([]);
            setComplaints({});
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

  const handleCloseComplain = async (complainNumber) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setCloseMessage("You are not authenticated. Please login again.");
      setTimeout(() => setCloseMessage(""), 3000);
      return;
    }

    setClosingComplain(true);
    setCloseMessage("");
    
    try {
      const response = await fetch(
        `http://localhost:8080/closecomplain?complainNumber=${encodeURIComponent(complainNumber)}`,
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
      
      const data = await response.text().catch(() => "");
      setCloseMessage(data && data.trim().length > 0 ? data.trim() : "Complain closed successfully.");
      setTimeout(() => setCloseMessage(""), 3000);
      
      // Refresh the list
      const fetchInProcessComplains = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch("http://localhost:8080/getallcomplain?status=IN_PROCESS", {
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
                : `Failed to load in-process complaints. Status: ${response.status}`
            );
            setComplainNumbers([]);
            setComplaints({});
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
          
          let numbers = [];
          if (Array.isArray(data)) {
            numbers = data.map(item => String(item).trim()).filter(item => item.length > 0);
          } else if (data && typeof data === "object") {
            const extracted = data.complainNumbers || data.data || data.list || [];
            numbers = Array.isArray(extracted) ? extracted.map(item => String(item).trim()).filter(item => item.length > 0) : [];
          }
          
          setComplainNumbers(numbers);
          
          if (numbers.length > 0) {
            const complaintsMap = {};
            await Promise.all(
              numbers.map(async (complainNumber) => {
                try {
                  const detailResponse = await fetch(
                    `http://localhost:8080/complain/getcomplain?complainNumber=${encodeURIComponent(complainNumber)}`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${token}`
                      }
                    }
                  );
                  if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    complaintsMap[complainNumber] = detailData;
                  }
                } catch {
                  // Skip if fetch fails
                }
              })
            );
            setComplaints(complaintsMap);
          } else {
            setComplaints({});
          }
        } catch (err) {
          setError(`Failed to load in-process complaints: ${err.message}`);
          setComplainNumbers([]);
          setComplaints({});
        } finally {
          setLoading(false);
        }
      };
      
      fetchInProcessComplains();
    } catch (err) {
      console.error("Error closing complain:", err);
      setCloseMessage(err.message || "Failed to close complain.");
      setTimeout(() => setCloseMessage(""), 3000);
    } finally {
      setClosingComplain(false);
    }
  };

  const fetchInProcessComplains = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("You are not authenticated. Please login again.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8080/getallcomplain?status=IN_PROCESS", {
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
            : `Failed to load in-process complaints. Status: ${response.status}`
        );
        setComplainNumbers([]);
        setComplaints({});
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
      
      let numbers = [];
      if (Array.isArray(data)) {
        numbers = data.map(item => String(item).trim()).filter(item => item.length > 0);
      } else if (data && typeof data === "object") {
        const extracted = data.complainNumbers || data.data || data.list || [];
        numbers = Array.isArray(extracted) ? extracted.map(item => String(item).trim()).filter(item => item.length > 0) : [];
      }
      
      setComplainNumbers(numbers);
      
      if (numbers.length > 0) {
        const complaintsMap = {};
        await Promise.all(
          numbers.map(async (complainNumber) => {
            try {
              const detailResponse = await fetch(
                `http://localhost:8080/complain/getcomplain?complainNumber=${encodeURIComponent(complainNumber)}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                complaintsMap[complainNumber] = detailData;
              }
            } catch {
              // Skip if fetch fails
            }
          })
        );
        setComplaints(complaintsMap);
      } else {
        setComplaints({});
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load in-process complaints: ${err.message}`);
      setComplainNumbers([]);
      setComplaints({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0 }}>In_Process Complain</h2>
          <button
            type="button"
            onClick={fetchInProcessComplains}
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
        Track complaints that are being worked on by managers.
      </p>
      {loading && <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Loading in-process complaints...</p>}
      {error && (
        <p style={{ color: "#b91c1c", fontSize: "0.9rem", fontWeight: 600 }}>
          {error}
        </p>
      )}
      {closeMessage && (
        <p
          style={{
            color: closeMessage.includes("successfully") || closeMessage.includes("success") ? "#166534" : "#b91c1c",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginTop: "8px",
            marginBottom: "8px"
          }}
        >
          {closeMessage}
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
                  Manager Name
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
                complainNumbers.map((complainNumber, index) => {
                  const complaint = complaints[complainNumber] || {};
                  
                  // Get manager name from complaint object
                  const managerName = complaint.managerName || 
                                    complaint.managerFullName || 
                                    complaint.manager_fullName ||
                                    (complaint.managerFirstName && complaint.managerLastName ? `${complaint.managerFirstName} ${complaint.managerLastName}` : null) ||
                                    complaint.managerUsername ||
                                    complaint.managerUserName ||
                                    "—";
                  
                  // Check if response is null or empty
                  const response = complaint.response || complaint.complainResponse || complaint.complain_response || null;
                  const hasResponse = response !== null && response !== undefined && response !== "" && (!Array.isArray(response) || response.length > 0);
                  
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
                        {String(managerName || "—")}
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
                            onClick={() => handleCloseComplain(complainNumber)}
                            disabled={closingComplain || !hasResponse}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              background: closingComplain || !hasResponse ? "#e5e7eb" : "#ef4444",
                              color: closingComplain || !hasResponse ? "#6b7280" : "#ffffff",
                              font: "inherit",
                              fontSize: "0.85rem",
                              cursor: closingComplain || !hasResponse ? "not-allowed" : "pointer",
                              fontWeight: 500,
                              minWidth: "80px"
                            }}
                          >
                            {closingComplain ? "Closing..." : "Close Complain"}
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
                  );
                })
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
                    {searchTerm ? "No complaints found matching your search." : "No in-process complaints found."}
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
              .filter(([key, value]) => {
                // Always show response fields even if null/empty/array
                const isResponseField = key.toLowerCase() === "response" || 
                                      key.toLowerCase() === "complainresponse" || 
                                      key.toLowerCase() === "complain_response" ||
                                      key.toLowerCase() === "complainResponse";
                if (isResponseField) {
                  return true;
                }
                // Filter out null/undefined/empty for other fields
                // But allow arrays (even empty ones) to be displayed
                if (Array.isArray(value)) {
                  return true;
                }
                return value !== null && value !== undefined && value !== "";
              })
              .map(([key, value]) => {
                // Format the key for display
                let displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
                
                // Replace Manager name related keys with "Manager Name"
                if (key.toLowerCase().includes("manager") && (key.toLowerCase().includes("name") || key.toLowerCase() === "manager")) {
                  displayKey = "Manager Name";
                }
                
                // Handle response field names
                const isResponseField = key.toLowerCase() === "response" || 
                                      key.toLowerCase() === "complainresponse" || 
                                      key.toLowerCase() === "complain_response" ||
                                      key.toLowerCase() === "complainResponse";
                if (isResponseField) {
                  displayKey = "Response";
                }
                
                // Handle null/empty response and array responses
                let displayValue;
                if (value === null || value === undefined || value === "") {
                  displayValue = "—";
                } else if (Array.isArray(value)) {
                  // If response is an array/list, join with newlines
                  displayValue = value.length > 0 ? value.join("\n") : "—";
                } else {
                  displayValue = String(value);
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
                    <span style={{ color: "#0c4a6e", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {displayValue}
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

export default InProcessComplain;
