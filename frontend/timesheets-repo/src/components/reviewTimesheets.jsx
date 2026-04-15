import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner, Badge } from "react-bootstrap";
import Loader from "./loadingAni";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock, faChartPie, faSearch, faFilter, faTimes, faCheck, faXmark, faEye,
} from "@fortawesome/free-solid-svg-icons";
// ADDED NOTIFICATION BELL IMPORT
import NotificationBell from "./NotificationBell";

const API_BASE = "http://localhost:8000/api";

// Appending T00:00:00 forces the date to be parsed as local time.
// Without it, JS treats the date string as UTC and the displayed date can shift by a day depending on the user's timezone.
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

// Maps internal status values to user-facing labels.
// REJECTED is shown as "Awaiting Resubmission" so the consultant understands the next action needed.
const statusLabel = (status) => {
  switch (status) {
    case "REJECTED":  return "Awaiting Resubmission";
    case "SUBMITTED": return "Submitted";
    case "APPROVED":  return "Approved";
    default:          return status;
  }
};

const ReviewTimesheets = ({ user, onLogout, onProfileClick }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [timesheets, setTimesheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Controls the full-page loader shown while the initial timesheet list is fetching
  const [pageLoading, setPageLoading] = useState(true);

  // selectedTs holds the timesheet object the manager clicked on, which opens the detail modal
  const [selectedTs, setSelectedTs] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // State for the modal that appears when a manager tries to approve a timesheet with empty hour entries.
  // emptyDeclinedMode switches the modal from "are you sure?" to the rejection reason form.
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyConfirmId, setEmptyConfirmId] = useState(null);
  const [emptyDeclinedReason, setEmptyDeclinedReason] = useState('');
  const [emptyDeclinedError, setEmptyDeclinedError] = useState('');
  const [emptyDeclinedMode, setEmptyDeclinedMode] = useState(false); // true = showing rejection form

  const fetchTimesheets = async () => {
    try {
      setPageLoading(true);
      // The 800ms delay is run alongside the API call so the loader always shows for at least 0.8s,
      // preventing a jarring flash if the response comes back very fast.
      const [response] = await Promise.all([
        axios.get(`${API_BASE}/timesheets/`),
        new Promise(resolve => setTimeout(resolve, 800)),
      ]);
      // Managers only review submitted or actioned timesheets, not ones still being drafted.
      const nonDraft = response.data.filter((ts) => ts.status !== "DRAFT");
      setTimesheets(nonDraft);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const handleViewTimesheet = async (ts) => {
    setSelectedTs(ts);
    setEntries([]);
    setRejectReason('');
    setRejectError('');
    setLoadingEntries(true);
    try {
      const [res] = await Promise.all([
        axios.get(`${API_BASE}/timesheets/${ts.timesheetID}/entries/`),
        new Promise(resolve => setTimeout(resolve, 800)),
      ]);
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  // Returns true if any entry in the list has both 0 standard hours and 0 overtime hours logged.
  // Used to warn managers before approving a timesheet that looks incomplete.
  const hasEmptyEntries = (entryList) =>
    entryList.some(e => parseFloat(e.hoursWorked) === 0 && parseFloat(e.overtime_hours || 0) === 0);

  // If the timesheet has empty entries, stop and show the confirmation modal instead of approving immediately.
  // The manager can then choose to approve anyway or send it back with a reason.
  const handleApprove = async (id) => {
    if (hasEmptyEntries(entries)) {
      setEmptyConfirmId(id);
      setEmptyDeclinedMode(false);
      setEmptyDeclinedReason('');
      setEmptyDeclinedError('');
      setShowEmptyConfirm(true);
      return;
    }
    await doApprove(id);
  };

  const doApprove = async (id) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE}/timesheets/${id}/approve/`);
      setSelectedTs(null);
      setShowEmptyConfirm(false);
      fetchTimesheets();
    } catch (error) {
      console.error("Approval failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Manager chose not to approve the timesheet with empty entries.
  // Switches the confirmation modal to show the rejection reason textarea.
  const handleEmptyConfirmNo = () => {
    setEmptyDeclinedMode(true);
  };

  const handleEmptyConfirmReject = async () => {
    if (!emptyDeclinedReason.trim()) {
      setEmptyDeclinedError('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    setEmptyDeclinedError('');
    try {
      await axios.put(`${API_BASE}/timesheets/${emptyConfirmId}/reject/`, { comments: emptyDeclinedReason.trim() });
      setSelectedTs(null);
      setShowEmptyConfirm(false);
      fetchTimesheets();
    } catch (error) {
      console.error("Rejection failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    setRejectError('');
    try {
      await axios.put(`${API_BASE}/timesheets/${id}/reject/`, { comments: rejectReason.trim() });
      setSelectedTs(null);
      fetchTimesheets();
    } catch (error) {
      console.error("Rejection failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setMonthFilter("");
    setShowFilterMenu(false);
  };

  // Derive a sorted list of unique year-month strings from the loaded timesheets for the month dropdown.
  const availableMonths = [...new Set(
    timesheets
      .filter(ts => ts.weekCommencing)
      .map(ts => ts.weekCommencing.slice(0, 7))
  )].sort((a, b) => b.localeCompare(a));

  // Format "YYYY-MM" as "Month YYYY" for display in the dropdown.
  const formatMonthLabel = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  // Filters by search term, status, and month, then sorts by weekCommencing newest first.
  const filteredTimesheets = timesheets
    .filter((ts) => {
      const matchesSearch = ts.consultant_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? ts.status === statusFilter : true;
      const matchesMonth = monthFilter ? ts.weekCommencing?.startsWith(monthFilter) : true;
      return matchesSearch && matchesStatus && matchesMonth;
    })
    .sort((a, b) => {
      if (!a.weekCommencing) return 1;
      if (!b.weekCommencing) return -1;
      return b.weekCommencing.localeCompare(a.weekCommencing);
    });

  // LATE is treated the same as SUBMITTED for the "awaiting review" count since both need manager action.
  const submitted = timesheets.filter((ts) => ts.status === "SUBMITTED" || ts.status === "LATE").length;
  const approved = timesheets.filter((ts) => ts.status === "APPROVED").length;
  const total = timesheets.length;

  // Returns the full Bootstrap class string for the status badge used in the table rows.
  const statusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED": return "badge rounded-pill bg-success-subtle text-success";
      case "SUBMITTED": return "badge rounded-pill bg-warning-subtle text-warning";
      case "REJECTED":  return "badge rounded-pill bg-danger-subtle text-danger";
      default:          return "badge rounded-pill bg-secondary-subtle text-secondary";
    }
  };

  // Returns the Bootstrap variant name used by the react-bootstrap Badge component in the modal header.
  const statusVariant = (status) => {
    switch (status) {
      case "APPROVED":  return "success";
      case "SUBMITTED": return "warning";
      case "REJECTED":  return "danger";
      default:          return "secondary";
    }
  };

  const userName = user?.name || "Line Manager";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: "#f0f4f4", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="text-white px-5 pt-4 pb-4"
        style={{
          background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)",
          position: "relative",
          padding: isMobile ? '1rem 1.5rem' : undefined,
        }}
      >
        <div className="position-absolute d-flex align-items-center gap-2" style={{ top: isMobile ? "12px" : "20px", right: isMobile ? "12px" : "30px" }}>
          
          {/* ADDED NOTIFICATION BELL HERE */}
          <NotificationBell userId={user?.userID} />

          <span className="d-none d-md-inline" style={{ fontSize: isMobile ? "0.75rem" : "0.9rem", opacity: 0.9 }}>{userName}</span>
          <div onClick={onProfileClick} style={{
            width: isMobile ? "36px" : "42px", height: isMobile ? "36px" : "42px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)",
            border: "2px solid rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: isMobile ? "0.85rem" : "1rem",
            cursor: 'pointer',
          }}>
            {initials}
          </div>
        </div>

        <h1 className="fw-bold mb-0" style={{ fontSize: isMobile ? "1.5rem" : "2.2rem", marginTop: isMobile ? "0" : "10px" }}>
          Welcome, {userName}
        </h1>
      </div>

      {/* Stats row above card */}
      <div className="mx-4 d-flex gap-3 align-items-center" style={{ marginTop: isMobile ? "12px" : "20px", marginBottom: isMobile ? "12px" : "12px", flexDirection: isMobile ? 'column' : 'row', marginLeft: isMobile ? '1rem' : undefined, marginRight: isMobile ? '1rem' : undefined }}>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: isMobile ? "0.8rem" : "0.875rem", color: "#00789A", width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faClock} />
          <span><strong>{submitted}</strong> awaiting review</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: isMobile ? "0.8rem" : "0.875rem", color: "#2DB5AA", width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faChartPie} />
          <span><strong>{total > 0 ? Math.round((approved / total) * 100) : 0}%</strong> approved</span>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-4 bg-white rounded-4 shadow-sm p-4" style={{ marginTop: "0", marginLeft: isMobile ? '1rem' : undefined, marginRight: isMobile ? '1rem' : undefined, padding: isMobile ? '1rem' : undefined }}>
        <style>{"#ts-search::placeholder { color: #fff; opacity: 0.7; }"}</style>
        <div className="d-flex gap-2 mb-3 align-items-center" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div className="position-relative" style={{ width: isMobile ? '100%' : 'auto' }}>
            <FontAwesomeIcon
              icon={faSearch}
              className="position-absolute text-white"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              id="ts-search"
              type="text"
              value={searchTerm}
              className="form-control border-0 text-white ps-5"
              placeholder="Search for consultant"
              style={{ backgroundColor: "#3a3a3a", width: isMobile ? '100%' : "220px", borderRadius: "6px" }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="position-relative" style={{ width: isMobile ? '100%' : 'auto' }}>
            <button
              className="btn text-white d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3a3a3a", borderRadius: "6px", width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}
              onClick={() => setShowFilterMenu((v) => !v)}
            >
              <FontAwesomeIcon icon={faFilter} /> Filter <span style={{ fontSize: "0.7rem" }}>▼</span>
            </button>
            {showFilterMenu && (
              <div className="position-absolute bg-white border rounded shadow-sm p-2 mt-1" style={{ zIndex: 100, minWidth: "150px", width: isMobile ? '100%' : 'auto', left: isMobile ? 0 : undefined }}>
                {[
                  { value: "", label: "All Statuses" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Awaiting Resubmission" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    className={`dropdown-item rounded ${statusFilter === value ? "active" : ""}`}
                    onClick={() => { setStatusFilter(value); setShowFilterMenu(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="form-select border-0 text-white"
            style={{ backgroundColor: "#3a3a3a", width: isMobile ? '100%' : '160px', borderRadius: "6px", fontSize: '0.9rem', color: monthFilter ? '#fff' : 'rgba(255,255,255,0.7)' }}
          >
            <option value="">All Months</option>
            {availableMonths.map(ym => (
              <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
            ))}
          </select>

          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            style={{ borderRadius: "6px", width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}
            onClick={clearFilters}
          >
            <FontAwesomeIcon icon={faTimes} /> Clear Filters
          </button>

          {statusFilter && (
            <div className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill text-white" style={{ backgroundColor: "#00789A", fontSize: "0.8rem" }}>
              <span>
                {{
                  SUBMITTED: "Submitted",
                  APPROVED: "Approved",
                  REJECTED: "Awaiting Resubmission",
                }[statusFilter]}
              </span>
              <button
                onClick={clearFilters}
                className="btn-close btn-close-white ms-1"
                style={{ fontSize: "0.55rem" }}
                aria-label="Remove filter"
              />
            </div>
          )}

          {monthFilter && (
            <div className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill text-white" style={{ backgroundColor: "#2DB5AA", fontSize: "0.8rem" }}>
              <span>{formatMonthLabel(monthFilter)}</span>
              <button
                onClick={() => setMonthFilter("")}
                className="btn-close btn-close-white ms-1"
                style={{ fontSize: "0.55rem" }}
                aria-label="Remove month filter"
              />
            </div>
          )}
        </div>

        {pageLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Loader />
          </div>
        ) : (
        <>
          {isMobile ? (
            // Mobile Card View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTimesheets.length === 0 ? (
                <div className="text-center text-secondary py-4">No timesheets found.</div>
              ) : (
                filteredTimesheets.map((ts) => {
                  const statusColor = ts.status === 'APPROVED' ? '#00789A' : ts.status === 'SUBMITTED' ? '#2DB5AA' : '#ff6b6b';
                  return (
                    <div
                      key={ts.timesheetID}
                      style={{
                        background: '#fff',
                        borderRadius: '10px',
                        padding: '16px',
                        borderLeft: `5px solid ${statusColor}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handleViewTimesheet(ts)}
                      onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                      onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a202c', marginBottom: '4px' }}>
                            {ts.consultant_name ?? "—"}
                          </div>
                        </div>
                        <span className={statusBadgeClass(ts.status)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                          {statusLabel(ts.status)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#4a5568', marginBottom: '12px' }}>
                        <div><strong>Assigned:</strong> {formatDate(ts.weekCommencing)} to {formatDate(ts.weekEnding)}</div>
                        {ts.submitDate && <div><strong>Submitted:</strong> {formatDate(ts.submitDate)}</div>}
                      </div>

                      <button
                        className="btn btn-sm"
                        style={{
                          background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)',
                          color: '#fff',
                          border: 'none',
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} className="me-2" />
                        View Details
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Desktop Table View
            <div style={{ overflowX: 'visible', borderRadius: '8px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="text-secondary" style={{ fontSize: "0.9rem" }}>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Consultant</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Week Commencing</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Week Ending</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Date Submitted</th>
                    <th className="text-center" style={{ whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimesheets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-secondary py-4">No timesheets found.</td>
                    </tr>
                  ) : (
                    filteredTimesheets.map((ts) => (
                      <tr key={ts.timesheetID}>
                        <td style={{ whiteSpace: 'nowrap' }}>{ts.consultant_name ?? "—"}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ts.weekCommencing)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ts.weekEnding)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}><span className={statusBadgeClass(ts.status)}>{statusLabel(ts.status)}</span></td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ts.submitDate)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewTimesheet(ts)}
                          >
                            <FontAwesomeIcon icon={faEye} className="me-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
        )}
      </div>

      {/* Timesheet Detail Modal */}
      {/* CHANGE THIS LINE */}
      <Modal show={!!selectedTs} onHide={() => setSelectedTs(null)} size={isMobile ? "lg" : "xl"} centered><Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef', padding: isMobile ? '1rem' : '1.25rem 1.5rem' }}>
          <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: isMobile ? '0.95rem' : undefined }}>
            <span>{selectedTs?.consultant_name}</span>
            <Badge bg={statusVariant(selectedTs?.status)} style={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>{statusLabel(selectedTs?.status)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: isMobile ? '1rem' : '1.5rem', maxHeight: isMobile ? '70vh' : undefined, overflowY: isMobile ? 'auto' : undefined }}>
          {selectedTs && (
            <>
              {/* Meta info cards */}
              <div className="d-flex gap-3 mb-4 flex-wrap" style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : undefined, marginBottom: isMobile ? '1.5rem' : undefined }}>
                {[
                  { label: 'Consultant', value: selectedTs.consultant_name },
                  { label: 'Week commencing', value: formatDate(selectedTs.weekCommencing) },
                  { label: 'Week ending', value: formatDate(selectedTs.weekEnding) },
                  ...(selectedTs.submitDate ? [{ label: 'Submitted', value: formatDate(selectedTs.submitDate) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8f9fa', borderRadius: '8px', padding: isMobile ? '12px' : '10px 16px', minWidth: isMobile ? '100%' : '140px', fontSize: isMobile ? '0.85rem' : undefined }}>
                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: isMobile ? '4px' : '2px' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: isMobile ? '0.95rem' : '0.9rem', color: '#1a202c' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 600, fontSize: isMobile ? '0.9rem' : '0.9rem', marginBottom: '12px', color: '#333' }}>Daily entries</div>
              {loadingEntries ? (
                <div className="d-flex justify-content-center py-4">
                  <Loader />
                </div>
              ) : entries.length === 0 ? (
                <p className="text-muted">No entries recorded for this timesheet.</p>
              ) : (
                <div style={{ borderRadius: '10px', overflow: isMobile ? 'auto' : 'hidden', border: '1px solid #e9ecef' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '0.7rem' : '0.875rem', minWidth: isMobile ? '700px' : undefined }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)', color: '#fff' }}>
                        <th style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                        <th style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Work Type</th>
                        <th style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Std Hrs</th>
                        <th style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>OT Hrs</th>
                        <th style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Client</th>
                        <th style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 600, fontSize: isMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, idx) => (
                        <tr key={entry.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fffe', borderBottom: '1px solid #eef0f0' }}>
                          <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</td>
                          <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              background: entry.work_type === 'SICK' ? '#fff3cd' : entry.work_type === 'HOLIDAY' ? '#d1e7dd' : '#e8f4f8',
                              color: entry.work_type === 'SICK' ? '#856404' : entry.work_type === 'HOLIDAY' ? '#0a3622' : '#00789A',
                              padding: '3px 10px', borderRadius: '12px', fontSize: isMobile ? '0.65rem' : '0.78rem', fontWeight: 600,
                            }}>
                              {entry.work_type ? entry.work_type.charAt(0) + entry.work_type.slice(1).toLowerCase() : '—'}
                            </span>
                          </td>
                          <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', whiteSpace: 'nowrap' }}>{parseFloat(entry.hoursWorked).toFixed(1)}h</td>
                          <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', whiteSpace: 'nowrap' }}>{parseFloat(entry.overtime_hours || 0).toFixed(1)}h</td>
                          <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', color: entry.client_name ? '#333' : '#bbb', whiteSpace: 'nowrap' }}>{entry.client_name || '—'}</td>
                          <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', color: entry.description ? '#555' : '#bbb' }}>{entry.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f0f4f4', borderTop: '2px solid #dee2e6' }}>
                        <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 700, whiteSpace: 'nowrap' }} colSpan={2}>Total</td>
                        <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>{entries.reduce((sum, e) => sum + parseFloat(e.hoursWorked), 0).toFixed(1)}h</td>
                        <td style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>{entries.reduce((sum, e) => sum + parseFloat(e.overtime_hours || 0), 0).toFixed(1)}h</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {selectedTs.status !== 'REJECTED' && selectedTs.comments && (
                <div className="mt-3 p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #dee2e6', marginTop: isMobile ? '1.5rem' : undefined, padding: isMobile ? '1rem' : undefined }}>
                  <div className="small fw-semibold text-muted mb-1" style={{ fontSize: isMobile ? '0.8rem' : undefined }}>Consultant notes</div>
                  <div className="small" style={{ fontSize: isMobile ? '0.9rem' : undefined, lineHeight: isMobile ? 1.5 : undefined }}>{selectedTs.comments}</div>
                </div>
              )}

              {(selectedTs.status === 'SUBMITTED' || selectedTs.status === 'LATE') && (
                <div className="mt-4" style={{ marginTop: isMobile ? '1.5rem' : undefined }}>
                  <label className="form-label fw-semibold small" style={{ fontSize: isMobile ? '0.85rem' : undefined, marginBottom: isMobile ? '0.75rem' : undefined }}>Reason for rejection</label>
                  <textarea
                    className={`form-control ${rejectError ? 'is-invalid' : ''}`}
                    rows={isMobile ? 4 : 3}
                    placeholder="Enter a reason if you intend to reject this timesheet..."
                    value={rejectReason}
                    onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
                    style={{ fontSize: isMobile ? '0.95rem' : undefined, padding: isMobile ? '0.75rem' : undefined }}
                  />
                  {rejectError && <div className="invalid-feedback" style={{ fontSize: isMobile ? '0.8rem' : undefined }}>{rejectError}</div>}
                </div>
              )}

              {selectedTs.status === 'REJECTED' && selectedTs.comments && (
                <div className="mt-3 p-3 rounded" style={{ background: '#fff5f5', border: '1px solid #f8d7da', marginTop: isMobile ? '1.5rem' : undefined, padding: isMobile ? '1rem' : undefined }}>
                  <div className="small fw-semibold text-danger mb-1" style={{ fontSize: isMobile ? '0.8rem' : undefined }}>Rejection reason</div>
                  <div className="small" style={{ fontSize: isMobile ? '0.9rem' : undefined, lineHeight: isMobile ? 1.5 : undefined }}>{selectedTs.comments}</div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ padding: isMobile ? '1rem' : undefined, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : undefined }}>
          <Button variant="outline-secondary" onClick={() => setSelectedTs(null)} style={{ width: isMobile ? '100%' : 'auto' }}>
            Close
          </Button>
          <Button
            variant="danger"
            disabled={actionLoading || (selectedTs?.status !== "SUBMITTED" && selectedTs?.status !== "LATE")}
            onClick={() => handleReject(selectedTs.timesheetID)}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : (
              <><FontAwesomeIcon icon={faXmark} className="me-1" />Reject</>
            )}
          </Button>
          <Button
            variant="success"
            disabled={actionLoading || (selectedTs?.status !== "SUBMITTED" && selectedTs?.status !== "LATE")}
            onClick={() => handleApprove(selectedTs.timesheetID)}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : (
              <><FontAwesomeIcon icon={faCheck} className="me-1" />Approve</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Empty-fields confirmation modal */}
      <Modal show={showEmptyConfirm} onHide={() => setShowEmptyConfirm(false)} centered size={isMobile ? "sm" : "md"}>
        <Modal.Header closeButton style={{ padding: isMobile ? '1rem' : undefined }}>
          <Modal.Title style={{ fontSize: isMobile ? '1rem' : undefined }}>Timesheet has empty fields</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: isMobile ? '1rem' : undefined, fontSize: isMobile ? '0.9rem' : undefined }}>
          {!emptyDeclinedMode ? (
            <p className="mb-0">
              Some days have no hours recorded. Do you still want to approve this timesheet?
            </p>
          ) : (
            <>
              <p className="text-muted small mb-3">Please provide a reason so the consultant knows what to fix.</p>
              <label className="form-label fw-semibold small">Reason for rejection</label>
              <textarea
                className={`form-control ${emptyDeclinedError ? 'is-invalid' : ''}`}
                rows={3}
                placeholder="Enter a reason..."
                value={emptyDeclinedReason}
                onChange={e => { setEmptyDeclinedReason(e.target.value); setEmptyDeclinedError(''); }}
                style={{ fontSize: isMobile ? '0.9rem' : undefined }}
              />
              {emptyDeclinedError && <div className="invalid-feedback">{emptyDeclinedError}</div>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ padding: isMobile ? '1rem' : undefined, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : undefined }}>
          {!emptyDeclinedMode ? (
            <>
              <Button variant="outline-secondary" onClick={() => setShowEmptyConfirm(false)} style={{ width: isMobile ? '100%' : 'auto' }}>Cancel</Button>
              <Button variant="outline-danger" onClick={handleEmptyConfirmNo} style={{ width: isMobile ? '100%' : 'auto' }}>
                No, send back
              </Button>
              <Button variant="success" onClick={() => doApprove(emptyConfirmId)} style={{ width: isMobile ? '100%' : 'auto' }}>
                Yes, approve
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={() => setEmptyDeclinedMode(false)} style={{ width: isMobile ? '100%' : 'auto' }}>Back</Button>
              <Button variant="danger" onClick={handleEmptyConfirmReject} style={{ width: isMobile ? '100%' : 'auto' }}>
                Reject Timesheet
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ReviewTimesheets;