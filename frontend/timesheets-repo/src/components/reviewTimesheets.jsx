import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner, Badge } from "react-bootstrap";
import Loader from "./loadingAni";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock, faChartPie, faSearch, faFilter, faTimes, faCheck, faXmark, faEye,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE = "http://localhost:8000/api";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const statusLabel = (status) => {
  switch (status) {
    case "REJECTED":  return "Awaiting Resubmission";
    case "SUBMITTED": return "Submitted";
    case "LATE":      return "Late Submission";
    case "APPROVED":  return "Approved";
    case "PAID":      return "Paid";
    default:          return status;
  }
};

const ReviewTimesheets = ({ user, onLogout, onProfileClick }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modal state
  const [pageLoading, setPageLoading] = useState(true);

  // Modal state
  const [selectedTs, setSelectedTs] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Empty-fields confirmation
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyConfirmId, setEmptyConfirmId] = useState(null);
  const [emptyDeclinedReason, setEmptyDeclinedReason] = useState('');
  const [emptyDeclinedError, setEmptyDeclinedError] = useState('');
  const [emptyDeclinedMode, setEmptyDeclinedMode] = useState(false); // true = showing rejection form

  const fetchTimesheets = async () => {
    try {
      setPageLoading(true);
      const [response] = await Promise.all([
        axios.get(`${API_BASE}/timesheets/`),
        new Promise(resolve => setTimeout(resolve, 800)),
      ]);
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

  const hasEmptyEntries = (entryList) =>
    entryList.some(e => parseFloat(e.hoursWorked) === 0 && parseFloat(e.overtime_hours || 0) === 0);

  const isActionable = (status) => status === "SUBMITTED" || status === "LATE";

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
    setShowFilterMenu(false);
  };

  const filteredTimesheets = timesheets.filter((ts) => {
    const matchesSearch =
      ts.consultant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ts.timesheetID?.toString().includes(searchTerm);
    const matchesStatus = statusFilter ? ts.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const submitted = timesheets.filter((ts) => ts.status === "SUBMITTED" || ts.status === "LATE").length;
  const approved = timesheets.filter((ts) => ts.status === "APPROVED").length;
  const total = timesheets.length;

  const statusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED":  return "badge rounded-pill bg-success-subtle text-success";
      case "SUBMITTED": return "badge rounded-pill bg-warning-subtle text-warning";
      case "LATE":      return "badge rounded-pill bg-orange-subtle text-orange";
      case "REJECTED":  return "badge rounded-pill bg-danger-subtle text-danger";
      case "PAID":      return "badge rounded-pill bg-primary-subtle text-primary";
      default:          return "badge rounded-pill bg-secondary-subtle text-secondary";
    }
  };

  const statusVariant = (status) => {
    switch (status) {
      case "APPROVED":  return "success";
      case "SUBMITTED": return "warning";
      case "LATE":      return "warning";
      case "REJECTED":  return "danger";
      case "PAID":      return "primary";
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
        }}
      >
        <div className="position-absolute d-flex align-items-center gap-2" style={{top: "20px", right: "30px"}}>
          <button
              onClick={onLogout}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.7)',
                color: '#fff', borderRadius: '6px', padding: '4px 12px',
                fontSize: '0.85rem', cursor: 'pointer',
              }}
          >
            Sign out
          </button>
          <span style={{fontSize: "0.9rem", opacity: 0.9}}>{userName}</span>
          <div onClick={onProfileClick} style={{
            width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)",
            border: "2px solid rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "1rem",
            cursor: 'pointer',
          }}>
            {initials}
          </div>
        </div>

        <h1 className="fw-bold mb-0" style={{fontSize: "2.2rem", marginTop: "10px"}}>
          Welcome, {userName}
        </h1>
      </div>

      {/* Stats row above card */}
      <div className="mx-4 d-flex gap-3 align-items-center" style={{marginTop: "20px", marginBottom: "12px" }}>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#00789A" }}>
          <FontAwesomeIcon icon={faClock} />
          <span><strong>{submitted}</strong> awaiting review</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#2DB5AA" }}>
          <FontAwesomeIcon icon={faChartPie} />
          <span><strong>{total > 0 ? Math.round((approved / total) * 100) : 0}%</strong> approved</span>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-4 bg-white rounded-4 shadow-sm p-4" style={{ marginTop: "0" }}>
        <style>{"#ts-search::placeholder { color: #fff; opacity: 0.7; }"}</style>
        <div className="d-flex gap-2 mb-3 align-items-center">
          <div className="position-relative">
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
              placeholder="Search consultant or ID"
              style={{ backgroundColor: "#3a3a3a", width: "220px", borderRadius: "6px" }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="position-relative">
            <button
              className="btn text-white d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3a3a3a", borderRadius: "6px" }}
              onClick={() => setShowFilterMenu((v) => !v)}
            >
              <FontAwesomeIcon icon={faFilter} /> Filter <span style={{ fontSize: "0.7rem" }}>▼</span>
            </button>
            {showFilterMenu && (
              <div className="position-absolute bg-white border rounded shadow-sm p-2 mt-1" style={{ zIndex: 100, minWidth: "150px" }}>
                {[
                  { value: "", label: "All Statuses" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "LATE", label: "Late Submission" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "PAID", label: "Paid" },
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

          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            style={{ borderRadius: "6px" }}
            onClick={clearFilters}
          >
            <FontAwesomeIcon icon={faTimes} /> Clear Filters
          </button>

          {statusFilter && (
            <div className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill text-white" style={{ backgroundColor: "#00789A", fontSize: "0.8rem" }}>
              <span>
                {{
                  SUBMITTED: "Submitted",
                  LATE: "Late Submission",
                  APPROVED: "Approved",
                  PAID: "Paid",
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
        </div>

        {pageLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Loader />
          </div>
        ) : (
        <table className="table table-hover align-middle mb-0">
          <thead className="text-secondary" style={{ fontSize: "0.9rem" }}>
            <tr>
              <th>ID</th>
              <th>Consultant</th>
              <th>Week Commencing</th>
              <th>Week Ending</th>
              <th>Status</th>
              <th>Date Submitted</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary py-4">No timesheets found.</td>
              </tr>
            ) : (
              filteredTimesheets.map((ts) => (
                <tr key={ts.timesheetID}>
                  <td>{ts.timesheetID}</td>
                  <td>{ts.consultant_name ?? "—"}</td>
                  <td>{formatDate(ts.weekCommencing)}</td>
                  <td>{formatDate(ts.weekEnding)}</td>
                  <td>
                    <span
                      className={statusBadgeClass(ts.status)}
                      style={ts.status === "LATE" ? { backgroundColor: "#ffd798", color: "#e65100" } : {}}
                    >
                      {statusLabel(ts.status)}
                    </span>
                  </td>
                  <td>{formatDate(ts.submitDate)}</td>
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
        )}
      </div>

      {/* Timesheet Detail Modal */}
      <Modal show={!!selectedTs} onHide={() => setSelectedTs(null)} size="xl" centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef', padding: '1.25rem 1.5rem' }}>
          <Modal.Title className="d-flex align-items-center gap-2">
            <span>Timesheet #{selectedTs?.timesheetID}</span>
            <Badge
              bg={statusVariant(selectedTs?.status)}
              style={selectedTs?.status === "LATE" ? { backgroundColor: "#e65100", fontSize: '0.75rem' } : { fontSize: '0.75rem' }}
            >
              {statusLabel(selectedTs?.status)}
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '1.5rem' }}>
          {selectedTs && (
            <>
              {/* Meta info cards */}
              <div className="d-flex gap-3 mb-4 flex-wrap">
                {[
                  { label: 'Consultant', value: selectedTs.consultant_name },
                  { label: 'Week commencing', value: formatDate(selectedTs.weekCommencing) },
                  { label: 'Week ending', value: formatDate(selectedTs.weekEnding) },
                  ...(selectedTs.submitDate ? [{ label: 'Submitted', value: formatDate(selectedTs.submitDate) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 16px', minWidth: '140px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: '#333' }}>Daily entries</div>
              {loadingEntries ? (
                <div className="d-flex justify-content-center py-4">
                  <Loader />
                </div>
              ) : entries.length === 0 ? (
                <p className="text-muted">No entries recorded for this timesheet.</p>
              ) : (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)', color: '#fff' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Type</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Std Hrs</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OT Hrs</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, idx) => (
                        <tr key={entry.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fffe', borderBottom: '1px solid #eef0f0' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{formatDate(entry.date)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: entry.work_type === 'SICK' ? '#fff3cd' : entry.work_type === 'HOLIDAY' ? '#d1e7dd' : '#e8f4f8',
                              color: entry.work_type === 'SICK' ? '#856404' : entry.work_type === 'HOLIDAY' ? '#0a3622' : '#00789A',
                              padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                            }}>
                              {entry.work_type ? entry.work_type.charAt(0) + entry.work_type.slice(1).toLowerCase() : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>{parseFloat(entry.hoursWorked).toFixed(1)}h</td>
                          <td style={{ padding: '12px 16px' }}>{parseFloat(entry.overtime_hours || 0).toFixed(1)}h</td>
                          <td style={{ padding: '12px 16px', color: entry.client_name ? '#333' : '#bbb' }}>{entry.client_name || '—'}</td>
                          <td style={{ padding: '12px 16px', color: entry.description ? '#555' : '#bbb' }}>{entry.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f0f4f4', borderTop: '2px solid #dee2e6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }} colSpan={2}>Total</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{entries.reduce((sum, e) => sum + parseFloat(e.hoursWorked), 0).toFixed(1)}h</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{entries.reduce((sum, e) => sum + parseFloat(e.overtime_hours || 0), 0).toFixed(1)}h</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {selectedTs.status !== 'REJECTED' && selectedTs.comments && (
                <div className="mt-3 p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <div className="small fw-semibold text-muted mb-1">Consultant notes</div>
                  <div className="small">{selectedTs.comments}</div>
                </div>
              )}

              {isActionable(selectedTs.status) && (
                <div className="mt-4">
                  <label className="form-label fw-semibold small">Reason for rejection</label>
                  <textarea
                    className={`form-control ${rejectError ? 'is-invalid' : ''}`}
                    rows={3}
                    placeholder="Enter a reason if you intend to reject this timesheet..."
                    value={rejectReason}
                    onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
                  />
                  {rejectError && <div className="invalid-feedback">{rejectError}</div>}
                </div>
              )}

              {selectedTs.status === 'REJECTED' && selectedTs.comments && (
                <div className="mt-3 p-3 rounded" style={{ background: '#fff5f5', border: '1px solid #f8d7da' }}>
                  <div className="small fw-semibold text-danger mb-1">Rejection reason</div>
                  <div className="small">{selectedTs.comments}</div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSelectedTs(null)}>
            Close
          </Button>
          <Button
            variant="danger"
            disabled={actionLoading || !isActionable(selectedTs?.status)}
            onClick={() => handleReject(selectedTs.timesheetID)}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : (
              <><FontAwesomeIcon icon={faXmark} className="me-1" />Reject</>
            )}
          </Button>
          <Button
            variant="success"
            disabled={actionLoading || !isActionable(selectedTs?.status)}
            onClick={() => handleApprove(selectedTs.timesheetID)}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : (
              <><FontAwesomeIcon icon={faCheck} className="me-1" />Approve</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Empty-fields confirmation modal */}
      <Modal show={showEmptyConfirm} onHide={() => setShowEmptyConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Timesheet has empty fields</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
              />
              {emptyDeclinedError && <div className="invalid-feedback">{emptyDeclinedError}</div>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!emptyDeclinedMode ? (
            <>
              <Button variant="outline-secondary" onClick={() => setShowEmptyConfirm(false)}>Cancel</Button>
              <Button variant="outline-danger" onClick={handleEmptyConfirmNo}>
                No, send back
              </Button>
              <Button variant="success" disabled={actionLoading} onClick={() => doApprove(emptyConfirmId)}>
                {actionLoading ? <Spinner animation="border" size="sm" /> : 'Yes, approve anyway'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={() => setEmptyDeclinedMode(false)}>Back</Button>
              <Button variant="danger" disabled={actionLoading} onClick={handleEmptyConfirmReject}>
                {actionLoading ? <Spinner animation="border" size="sm" /> : (
                  <><FontAwesomeIcon icon={faXmark} className="me-1" />Send back to consultant</>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ReviewTimesheets;