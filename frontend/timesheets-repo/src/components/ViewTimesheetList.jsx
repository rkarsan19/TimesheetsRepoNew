import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Alert, Spinner, Container } from "react-bootstrap";
import Loader from "./loadingAni";
import TimesheetDetail from "./TimesheetDetail";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "./NotificationBell";

const API_BASE = 'http://localhost:8000/api';

const STATUS_STYLE = {
  DRAFT:     { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  SUBMITTED: { bg: '#cff4fc', color: '#055160', border: '#0dcaf0' },
  APPROVED:  { bg: '#d1e7dd', color: '#0a3622', border: '#2DB5AA' },
  REJECTED:  { bg: '#f8d7da', color: '#842029', border: '#dc3545' },
  LATE:      { bg: '#f8d7da', color: '#842029', border: '#dc3545' },
  PAID:      { bg: '#cfe2ff', color: '#084298', border: '#0d6efd' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.DRAFT;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: '12px',
      fontSize: '0.7rem', fontWeight: 600,
      display: 'inline-block', textTransform: 'uppercase'
    }}>
      {status}
    </span>
  );
};

const TimesheetList = ({ consultantId, userId, onLogout, onProfileClick }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultantName, setConsultantName] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMonday, setSelectedMonday] = useState('');
  const [modalError, setModalError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/consultants/${consultantId}/`)
      .then(res => setConsultantName(res.data.name || ''))
      .catch(() => {});
    fetchTimesheets();
  }, [consultantId]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/timesheets/consultant/${consultantId}/`);
      setTimesheets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!selectedMonday) { setModalError('Please select a week.'); return; }
    setCreating(true);
    try {
      await axios.post(`${API_BASE}/timesheets/create/`, {
        consultantId,
        weekCommencing: selectedMonday,
        weekEnding: getSunday(selectedMonday),
      });
      setShowModal(false);
      setSelectedMonday('');
      fetchTimesheets();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to create.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getSunday = (mondayStr) => {
    const monday = new Date(mondayStr + 'T00:00:00');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toISOString().split('T')[0];
  };

  const getDeadline = (weekCommencing) => {
    if (!weekCommencing) return '—';
    const monday = new Date(weekCommencing + 'T00:00:00');
    const deadline = new Date(monday);
    deadline.setDate(monday.getDate() + 6);
    return deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const initials = consultantName ? consultantName.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  if (selectedId !== null) {
    return <TimesheetDetail timesheetId={selectedId} onBack={() => { setSelectedId(null); fetchTimesheets(); }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f7' }}>
      
      {/* BLUE HEADER BAR */}
      <div className="text-white px-4 py-4" style={{ background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="fw-bold mb-0" style={{ fontSize: '1.8rem' }}>Welcome, {consultantName}</h1>
          <div className="d-flex align-items-center gap-3">
            <NotificationBell userId={userId} />
            <div onClick={onProfileClick} style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', cursor: 'pointer'
            }}>
              {initials}
            </div>
          </div>
        </div>
      </div>

      <Container fluid className="px-md-5 py-4">
        
        {/* STATUS SUMMARY TAGS - Now positioned above the list/card */}
        <div className="d-none d-md-flex gap-2 mb-3">
          <div className="bg-white text-dark rounded-2 px-3 py-1 small fw-bold shadow-sm border border-info">
            <span className="text-info">{timesheets.filter(ts => ts.status === 'SUBMITTED').length}</span> awaiting review
          </div>
          <div className="bg-white text-dark rounded-2 px-3 py-1 small fw-bold shadow-sm border border-success">
            <span className="text-success">{timesheets.filter(ts => ts.status === 'APPROVED').length}</span> approved
          </div>
          <div className="bg-white text-dark rounded-2 px-3 py-1 small fw-bold shadow-sm border border-primary">
            <span className="text-primary">{timesheets.filter(ts => ts.status === 'PAID').length}</span> paid
          </div>
        </div>

        {loading ? <div className="text-center py-5"><Loader /></div> : (
          <>
            {/* DESKTOP VIEW: White Card Layout */}
            <div className="d-none d-md-block bg-white rounded-4 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold h4 mb-0">Timesheets</h2>
                <Button 
                  onClick={() => setShowModal(true)} 
                  style={{ background: '#00789A', border: 'none', borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  + New Timesheet
                </Button>
              </div>

              <table className="table">
                <thead>
                  <tr style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' }}>
                    <th className="border-0">Week Commencing</th>
                    <th className="border-0">Week Ending</th>
                    <th className="border-0">Status</th>
                    <th className="border-0">Submission Deadline</th>
                    <th className="border-0">Submitted</th>
                    <th className="border-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map(ts => (
                    <tr key={ts.timesheetID} style={{ verticalAlign: 'middle' }}>
                      <td className="py-3 border-light">{formatDate(ts.weekCommencing)}</td>
                      <td className="py-3 border-light">{formatDate(ts.weekEnding)}</td>
                      <td className="py-3 border-light"><StatusBadge status={ts.status} /></td>
                      <td className="py-3 border-light text-muted small">{getDeadline(ts.weekCommencing)}</td>
                      <td className="py-3 border-light text-muted small">{ts.submitDate ? formatDate(ts.submitDate) : '—'}</td>
                      <td className="py-3 border-light text-end">
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="d-flex align-items-center gap-1 ms-auto"
                          style={{ fontSize: '0.8rem', borderRadius: '6px' }}
                          onClick={() => setSelectedId(ts.timesheetID)}
                        >
                          <FontAwesomeIcon icon={faEye} size="xs" />
                          {ts.status === 'DRAFT' || ts.status === 'REJECTED' ? 'Edit' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Side-Border Card Layout */}
            <div className="d-md-none d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <h2 className="fw-bold h4 mb-0">My Timesheets</h2>
                <Button onClick={() => setShowModal(true)} size="sm" style={{ background: '#00789A', border: 'none' }}>+ New</Button>
              </div>
              {timesheets.map(ts => {
                const style = STATUS_STYLE[ts.status] || STATUS_STYLE.DRAFT;
                return (
                  <div key={ts.timesheetID} className="bg-white rounded-3 shadow-sm p-3" 
                       style={{ borderLeft: `6px solid ${style.border}`, border: '1px solid #eee', borderLeftWidth: '6px' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-0">{consultantName}</h6>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: #{ts.timesheetID}</div>
                      </div>
                      <StatusBadge status={ts.status} />
                    </div>
                    <div className="mb-3 small">
                      <strong>Assigned:</strong> {formatDate(ts.weekCommencing)} to {formatDate(ts.weekEnding)}
                    </div>
                    <Button 
                      className="w-100 border-0 d-flex align-items-center justify-content-center gap-2 py-2" 
                      style={{ background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)', borderRadius: '8px', fontWeight: 500 }}
                      onClick={() => setSelectedId(ts.timesheetID)}
                    >
                      <FontAwesomeIcon icon={faEye} />
                      {ts.status === 'DRAFT' || ts.status === 'REJECTED' ? 'Edit Details' : 'View Details'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Container>

      {/* NEW TIMESHEET MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">New Timesheet</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">WEEK COMMENCING (MONDAY)</Form.Label>
            <Form.Control type="date" value={selectedMonday} onChange={e => setSelectedMonday(e.target.value)} />
          </Form.Group>
          {modalError && <Alert variant="danger" className="py-2 small">{modalError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleCreateNew} disabled={creating} style={{ background: '#00789A', border: 'none' }}>
            {creating ? <Spinner size="sm" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TimesheetList;