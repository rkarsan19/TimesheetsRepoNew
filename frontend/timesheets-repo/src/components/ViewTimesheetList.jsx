import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import TimesheetDetail from "./TimesheetDetail";

const API_BASE = 'http://localhost:8000/api';

const STATUS_STYLE = {
  DRAFT:     { bg: '#fff3cd', color: '#856404' },
  SUBMITTED: { bg: '#cff4fc', color: '#055160' },
  APPROVED:  { bg: '#d1e7dd', color: '#0a3622' },
  REJECTED:  { bg: '#f8d7da', color: '#842029' },
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

const getSunday = (mondayStr) => {
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split('T')[0];
};

const TimesheetList = ({ consultantId, onLogout }) => {
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
      const res = await axios.get(`${API_BASE}/timesheets/consultant/${consultantId}/`);
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

  const initials = consultantName
    ? consultantName.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  if (selectedId !== null) {
    return <TimesheetDetail timesheetId={selectedId} onBack={() => { setSelectedId(null); fetchTimesheets(); }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '110px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)',
        }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 7000 4000" preserveAspectRatio="xMinYMid slice">
          <path style={{ opacity: 0.35 }} fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF"
            d="M0,1166.876V4000h4030.481C3501.117,1426.369,1382.347,3416.733,0,1166.876" />
          <path style={{ opacity: 0.29 }} fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF"
            d="M2414.969,2473.216c-458.236-869.114-1287.852-740.558-2142.418-925.708c-90.707-19.653-181.696-42.841-272.551-71.13V4000h2759.611C2713.274,3292.356,2591.76,2808.533,2414.969,2473.216" />
          <path style={{ opacity: 0.35 }} fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF"
            d="M0,1476.377V4000h2759.611h2.687c137.698-641.471,145.109-1104.106,61.803-1450.792C2495.544,1181.905,755.904,1618.136,32.519,0H0v1166.876V1476.377z" />
        </svg>
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', display: 'flex', alignItems: 'center', paddingRight: '1.5rem', gap: '12px' }}>
          <button
            onClick={onLogout}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.7)', color: '#fff', borderRadius: '6px', padding: '4px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Sign out
          </button>
          <span style={{ color: '#fff', fontSize: '0.9rem' }}>{consultantName}</span>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {initials}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
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

          {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}><Spinner animation="border" size="sm" /></div>}
          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee' }}>Week Commencing</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee' }}>Week Ending</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #eee' }}>Submitted</th>
                  <th style={{ borderBottom: '1px solid #eee' }}></th>
                </tr>
              </thead>
              <tbody>
                {timesheets.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>No timesheets yet.</td></tr>
                ) : (
                  timesheets.map(ts => (
                    <tr key={ts.timesheetID} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '14px 0' }}>{ts.weekCommencing || '—'}</td>
                      <td style={{ padding: '14px 0' }}>{ts.weekEnding || '—'}</td>
                      <td style={{ padding: '14px 0' }}><StatusBadge status={ts.status} /></td>
                      <td style={{ padding: '14px 0', color: '#888' }}>{ts.submitDate || '—'}</td>
                      <td style={{ padding: '14px 0', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedId(ts.timesheetID)}
                          style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 14px', cursor: 'pointer', fontSize: '0.83rem', color: '#555' }}
                        >
                          {ts.status === 'DRAFT' || ts.status === 'REJECTED' ? 'Edit' : 'View'}
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
