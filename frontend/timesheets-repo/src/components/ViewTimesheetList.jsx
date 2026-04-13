import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import Loader from "./loadingAni";
import TimesheetDetail from "./TimesheetDetail";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "./NotificationBell";

const API_BASE = 'http://localhost:8000/api';

const STATUS_STYLE = {
  DRAFT:     { bg: '#fff3cd', color: '#856404' },
  SUBMITTED: { bg: '#cff4fc', color: '#055160' },
  APPROVED:  { bg: '#d1e7dd', color: '#0a3622' },
  REJECTED:  { bg: '#f8d7da', color: '#842029' },
  LATE:      { bg: '#f8d7da', color: '#842029' },
  PAID:      { bg: '#cfe2ff', color: '#084298' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.DRAFT;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '12px',
      fontSize: '0.78rem', fontWeight: 600,
    }}>
      {status}
    </span>
  );
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

const TimesheetList = ({ consultantId, userId, onLogout, onProfileClick}) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultantName, setConsultantName] = useState('');

  const [selectedId, setSelectedId] = useState(null);

  // New timesheet modal
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
      const [res] = await Promise.all([
        axios.get(`${API_BASE}/timesheets/consultant/${consultantId}/`),
        new Promise(resolve => setTimeout(resolve, 800)),
      ]);
      setTimesheets(res.data);
      setError(null);
    } catch {
      setError('Failed to load timesheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!selectedMonday) { setModalError('Please select a week.'); return; }
    if (new Date(selectedMonday + 'T00:00:00').getDay() !== 1) {
      setModalError('Please select a Monday.');
      return;
    }
    setCreating(true);
    setModalError('');
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
      setModalError(err.response?.data?.error || 'Failed to create timesheet.');
    } finally {
      setCreating(false);
    }
  };

  const getDeadline = (weekCommencing) => {
    if (!weekCommencing) return '—';
    const monday = new Date(weekCommencing + 'T00:00:00');
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 6);
    return friday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const initials = consultantName
    ? consultantName.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  if (selectedId !== null) {
    return <TimesheetDetail timesheetId={selectedId} onBack={() => { setSelectedId(null); fetchTimesheets(); }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div
          className="text-white px-5 pt-4 pb-4"
          style={{
            background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)',
            position: 'relative',
          }}
      >
        <div className="position-absolute d-flex align-items-center gap-2" style={{top: '20px', right: '30px'}}>
          <NotificationBell userId={userId} />
          <span style={{fontSize: '0.9rem', opacity: 0.9}}>{consultantName}</span>
          <div onClick={onProfileClick} style={{
            width: '42px', height: '42px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.25)',
            border: '2px solid rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '1rem',
            cursor: 'pointer',
          }}>
            {initials}
          </div>
        </div>

        <h1 className="fw-bold mb-0" style={{fontSize: '2.2rem', marginTop: '10px'}}>
          Welcome, {consultantName}
        </h1>
      </div>

      {/* Stats row above card */}
      <div className="mx-4 d-flex gap-3 align-items-center" style={{marginTop: '20px', marginBottom: '12px'}}>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm"
             style={{fontSize: '0.875rem', color: '#00789A'}}>
          <span><strong>{timesheets.filter(ts => ts.status === 'SUBMITTED').length}</strong> awaiting review</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm"
             style={{fontSize: '0.875rem', color: '#2DB5AA'}}>
          <span><strong>{timesheets.filter(ts => ts.status === 'APPROVED').length}</strong> approved</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: '0.875rem', color: '#084298' }}>
          <span><strong>{timesheets.filter(ts => ts.status === 'PAID').length}</strong> paid</span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-4" style={{marginTop: '0'}}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Timesheets</h2>
            <button
              onClick={() => { setSelectedMonday(''); setModalError(''); setShowModal(true); }}
              style={{ background: '#00789A', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontWeight: 500 }}
            >
              + New Timesheet
            </button>
          </div>

          {loading && <div className="d-flex justify-content-center py-5"><Loader /></div>}
          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
              <tr style={{color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                <th style={{textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee'}}>Week Commencing</th>
                <th style={{textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee'}}>Week Ending</th>
                <th style={{textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee'}}>Status</th>
                <th style={{textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee'}}>Submission Deadline</th>
                <th style={{textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee'}}>Submitted</th>
                <th style={{borderBottom: '1px solid #eee'}}></th>
              </tr>
              </thead>
              <tbody>
              {timesheets.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>No timesheets yet.</td></tr>
                ) : (
                  timesheets.map(ts => (
                      <tr key={ts.timesheetID} style={{borderBottom: '1px solid #f5f5f5'}}>
                        <td style={{padding: '14px 0'}}>{formatDate(ts.weekCommencing)}</td>
                        <td style={{padding: '14px 0'}}>{formatDate(ts.weekEnding)}</td>
                        <td style={{padding: '14px 0'}}><StatusBadge status={ts.status}/></td>
                        <td style={{padding: '14px 0', color: '#888'}}>{getDeadline(ts.weekCommencing)}</td>
                        <td style={{padding: '14px 0', color: '#888'}}>{formatDate(ts.submitDate)}</td>
                        <td style={{padding: '14px 0', textAlign: 'right'}}>
                          <button
                              onClick={() => setSelectedId(ts.timesheetID)}
                              style={{
                                background: 'none',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                padding: '4px 14px',
                                cursor: 'pointer',
                                fontSize: '0.83rem',
                                color: '#555'
                              }}
                          >
                            {ts.status === 'DRAFT' || ts.status === 'REJECTED' ? 'Edit' : (
                                <><FontAwesomeIcon icon={faEye} className="me-1"/>View</>
                            )}
                          </button>
                        </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Timesheet Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Timesheet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Select the Monday of the week you want to create a timesheet for.</p>
          <Form.Group>
            <Form.Label>Week commencing (Monday)</Form.Label>
            <Form.Control
              type="date"
              value={selectedMonday}
              onChange={e => { setSelectedMonday(e.target.value); setModalError(''); }}
            />
          </Form.Group>
          {selectedMonday && new Date(selectedMonday + 'T00:00:00').getDay() === 1 && (
            <Alert variant="success" className="py-2 mt-3">
              Week ending: {new Date(getSunday(selectedMonday) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Alert>
          )}
          {modalError && <Alert variant="danger" className="py-2 mt-2">{modalError}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button
            disabled={creating}
            onClick={handleCreateNew}
            style={{ background: '#00789A', borderColor: '#00789A' }}
          >
            {creating ? <Spinner animation="border" size="sm" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TimesheetList;
