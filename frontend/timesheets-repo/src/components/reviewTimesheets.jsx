import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner, Badge } from "react-bootstrap";
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
    case "APPROVED":  return "Approved";
    default:          return status;
  }
};

const ReviewTimesheets = ({ user, onLogout, onProfileClick }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modal state
  const [selectedTs, setSelectedTs] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const fetchTimesheets = async () => {
    try {
      const response = await axios.get(`${API_BASE}/timesheets/`);
      const nonDraft = response.data.filter((ts) => ts.status !== "DRAFT");
      setTimesheets(nonDraft);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
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
      const res = await axios.get(`${API_BASE}/timesheets/${ts.timesheetID}/entries/`);
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE}/timesheets/${id}/approve/`);
      setSelectedTs(null);
      fetchTimesheets();
    } catch (error) {
      console.error("Approval failed", error);
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

  const submitted = timesheets.filter((ts) => ts.status === "SUBMITTED").length;
  const approved = timesheets.filter((ts) => ts.status === "APPROVED").length;
  const total = timesheets.length;

  const statusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED": return "badge rounded-pill bg-success-subtle text-success";
      case "SUBMITTED": return "badge rounded-pill bg-warning-subtle text-warning";
      case "REJECTED":  return "badge rounded-pill bg-danger-subtle text-danger";
      default:          return "badge rounded-pill bg-secondary-subtle text-secondary";
    }
  };

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
        className="text-white px-5 pt-4 pb-5"
        style={{
          background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)",
          minHeight: "180px",
          position: "relative",
        }}
      >
        <div className="position-absolute d-flex align-items-center gap-2" style={{ top: "20px", right: "30px" }}>
          <button className="btn btn-outline-light btn-sm" onClick={onLogout}>Sign out</button>
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>{userName}</span>
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

        <h1 className="fw-bold mb-3" style={{ fontSize: "2.2rem", marginTop: "10px" }}>
          Welcome, {userName}
        </h1>
        <div className="d-flex gap-4 align-items-center flex-wrap">
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
            <FontAwesomeIcon icon={faClock} className="me-2" />
            {submitted} awaiting review
          </span>
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
            <FontAwesomeIcon icon={faChartPie} className="me-2" />
            {total > 0 ? Math.round((approved / total) * 100) : 0}% approved
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-4 bg-white rounded-4 shadow-sm p-4" style={{ marginTop: "-30px", position: "relative" }}>
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

          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            style={{ borderRadius: "6px" }}
            onClick={clearFilters}
          >
            <FontAwesomeIcon icon={faTimes} /> Clear Filters
          </button>
        </div>

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
                  <td><span className={statusBadgeClass(ts.status)}>{statusLabel(ts.status)}</span></td>
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
      </div>

      {/* Timesheet Detail Modal */}
      <Modal show={!!selectedTs} onHide={() => setSelectedTs(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Timesheet #{selectedTs?.timesheetID} —{" "}
            <Badge bg={statusVariant(selectedTs?.status)}>{statusLabel(selectedTs?.status)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTs && (
            <>
              <div className="d-flex gap-4 mb-4 text-muted small">
                <span><strong>Consultant:</strong> {selectedTs.consultant_name}</span>
                <span><strong>Week:</strong> {formatDate(selectedTs.weekCommencing)} → {formatDate(selectedTs.weekEnding)}</span>
                {selectedTs.submitDate && <span><strong>Submitted:</strong> {formatDate(selectedTs.submitDate)}</span>}
              </div>

              <h6 className="fw-semibold mb-2">Entries</h6>
              {loadingEntries ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : entries.length === 0 ? (
                <p className="text-muted">No entries recorded for this timesheet.</p>
              ) : (
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Work Type</th>
                      <th>Hours</th>
                      <th>Overtime Hours</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.work_type ? entry.work_type.charAt(0) + entry.work_type.slice(1).toLowerCase() : "—"}</td>
                        <td>{parseFloat(entry.hoursWorked).toFixed(1)}</td>
                        <td>{parseFloat(entry.overtime_hours || 0).toFixed(1)}</td>
                        <td>{entry.description || "—"}</td>
                      </tr>
                    ))}
                    <tr className="table-light fw-semibold">
                      <td>Total</td>
                      <td></td>
                      <td>{entries.reduce((sum, e) => sum + parseFloat(e.hoursWorked), 0).toFixed(1)}</td>
                      <td>{entries.reduce((sum, e) => sum + parseFloat(e.overtime_hours || 0), 0).toFixed(1)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {selectedTs.status !== 'REJECTED' && selectedTs.comments && (
                <div className="mt-3 p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <div className="small fw-semibold text-muted mb-1">Consultant notes</div>
                  <div className="small">{selectedTs.comments}</div>
                </div>
              )}

              {selectedTs.status === 'SUBMITTED' && (
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
            disabled={actionLoading || selectedTs?.status !== "SUBMITTED"}
            onClick={() => handleReject(selectedTs.timesheetID)}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : (
              <><FontAwesomeIcon icon={faXmark} className="me-1" />Reject</>
            )}
          </Button>
          <Button
            variant="success"
            disabled={actionLoading || selectedTs?.status !== "SUBMITTED"}
            onClick={() => handleApprove(selectedTs.timesheetID)}
          >
            {actionLoading ? <Spinner animation="border" size="sm" /> : (
              <><FontAwesomeIcon icon={faCheck} className="me-1" />Approve</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ReviewTimesheets;
