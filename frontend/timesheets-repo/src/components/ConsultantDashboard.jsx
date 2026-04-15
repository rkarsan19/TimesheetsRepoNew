
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Badge, Modal, Form, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Loader from './loadingAni';

const API_BASE = 'http://localhost:8000/api';

// color palette
const STATUS_CONFIG = {
  DRAFT:     { label: 'Draft',     bg: '#fff3cd', text: '#856404', color: '#ffc107' },
  SUBMITTED: { label: 'Submitted', bg: '#fff3cd', text: '#856404', color: '#ffc107' }, // Matches 'Submitted' yellow in your pic
  APPROVED:  { label: 'Approved',  bg: '#d4edda', text: '#155724', color: '#2DB5AA' }, // Matches 'Approved' green
  REJECTED:  { label: 'Rejected',  bg: '#f8d7da', text: '#721c24', color: '#dc3545' },
};

const ConsultantDashboard = ({ onNavigate = () => {}, consultantId = 1 }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [user, setUser] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedMonday, setSelectedMonday] = useState('');
  const [newTimesheetError, setNewTimesheetError] = useState('');
  const [creating, setCreating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchUser();
    fetchTimesheets();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/consultants/${consultantId}/`);
      setUser(response.data);
    } catch (err) { console.error('Failed to fetch consultant:', err); }
  };

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const [response] = await Promise.all([
        axios.get(`${API_BASE}/timesheets/consultant/${consultantId}/`),
        new Promise(resolve => setTimeout(resolve, 800)),
      ]);
      setTimesheets(response.data);
    } catch (err) { setError('Failed to load timesheets.'); }
    finally { setLoading(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Returns the Monday of the current week as a YYYY-MM-DD string,
  // used as the min value on the date picker to block past weeks.
  const getCurrentMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const daysToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Returns "Sunday DD Month YYYY at 9:00pm" for a given Monday string.
  const getDueDate = (mondayStr) => {
    if (!mondayStr) return null;
    const monday = new Date(mondayStr + 'T00:00:00');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' at 9:00pm';
  };

  const handleConfirmNew = async () => {
    if (!selectedMonday) return setNewTimesheetError('Please select a week.');

    const selected = new Date(selectedMonday + 'T00:00:00');

    // Must not be a past week
    const todayMonday = new Date(getCurrentMonday() + 'T00:00:00');
    if (selected < todayMonday) {
      return setNewTimesheetError('You cannot create a timesheet for a past week.');
    }

    // Compute week ending (Sunday) safely in local time
    const weekEndDate = new Date(selected);
    weekEndDate.setDate(selected.getDate() + 6);
    const pad = n => String(n).padStart(2, '0');
    const weekEnding = `${weekEndDate.getFullYear()}-${pad(weekEndDate.getMonth() + 1)}-${pad(weekEndDate.getDate())}`;

    try {
      setCreating(true);
      await axios.post(`${API_BASE}/timesheets/create/`, {
        consultantId,
        weekCommencing: selectedMonday,
        weekEnding,
      });
      setShowNewModal(false);
      fetchTimesheets();
    } catch (err) {
      setNewTimesheetError(err.response?.data?.error || 'Failed to create timesheet.');
    } finally {
      setCreating(false);
    }
  };

  const filteredTimesheets = filterStatus ? timesheets.filter(t => t.status === filterStatus) : timesheets;
  const userName = user?.name || 'Jane Smith';

  return (
    <div className="min-vh-100 pb-5" style={{ background: '#f8f9fa' }}>
      
      {/* welcome header */}
      <div className="text-white px-4 py-4 mb-4" style={{ background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="fw-bold mb-0" style={{ fontSize: '1.5rem' }}>Welcome, {userName}</h1>
          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" 
               style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', border: '1px solid white' }}>
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>

      <Container>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="fs-5 fw-bold mb-0">My Timesheets</h2>
            <Button onClick={() => setShowNewModal(true)} size="sm" style={{ background: '#00789A', border: 'none' }}>+ New Timesheet</Button>
        </div>

        {/* Filter matching search/filter bars */}
        <div className="mb-4">
          <Form.Control className="mb-2 bg-dark text-white border-0" placeholder="Search ID..." style={{ opacity: 0.8 }} />
          <Form.Select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            className="bg-dark text-white border-0"
            style={{ opacity: 0.8 }}
          >
            <option value="">Filter Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
          </Form.Select>
        </div>

        {loading ? <div className="text-center py-5"><Loader /></div> : (
          <div className="d-flex flex-column gap-3">
            {filteredTimesheets.map((ts) => {
              const config = STATUS_CONFIG[ts.status] || STATUS_CONFIG.DRAFT;
              return (
                <div 
                  key={ts.timesheetID} 
                  className="bg-white rounded-3 shadow-sm p-3" 
                  style={{ borderLeft: `6px solid ${config.color}`, position: 'relative' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>{userName}</h5>
                      <div className="text-muted small">ID: #{ts.timesheetID}</div>
                    </div>
                    <Badge 
                      pill 
                      style={{ 
                        backgroundColor: config.bg, 
                        color: config.text, 
                        fontSize: '0.7rem', 
                        padding: '5px 12px' 
                      }}
                    >
                      {config.label}
                    </Badge>
                  </div>

                  <div className="mb-3" style={{ fontSize: '0.9rem' }}>
                    <div className="mb-1">
                        <strong>Assigned:</strong> {formatDate(ts.weekCommencing)} to {formatDate(ts.weekEnding)}
                    </div>
                    {ts.submitDate && (
                        <div><strong>Submitted:</strong> {formatDate(ts.submitDate)}</div>
                    )}
                  </div>

                  {/* Teal View Details Button*/}
                  <Button 
                    className="w-100 border-0 d-flex align-items-center justify-content-center gap-2 py-2" 
                    style={{ background: '#2DB5AA', borderRadius: '8px', fontWeight: '500' }}
                    onClick={() => onNavigate(ts.status === 'DRAFT' || ts.status === 'REJECTED' ? 'edit' : 'view', ts.timesheetID)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    {ts.status === 'DRAFT' ? 'Edit Details' : 'View Details'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Container>

      {/* New Modal */}
      <Modal show={showNewModal} onHide={() => { setShowNewModal(false); setNewTimesheetError(''); setSelectedMonday(''); }} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">New Timesheet</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Select the Monday of the week you want to create a timesheet for.</p>
          <Form.Group>
            <Form.Label className="small fw-bold">WEEK COMMENCING (MONDAY)</Form.Label>
            <Form.Control
              type="date"
              value={selectedMonday}
              min={getCurrentMonday()}
              onChange={e => {
                const val = e.target.value;
                if (!val) { setSelectedMonday(''); setNewTimesheetError(''); return; }
                // Snap to the Monday of whatever week the user picks.
                // This means picking Tuesday 15th automatically sets Monday 14th.
                const picked = new Date(val + 'T00:00:00');
                const day = picked.getDay();
                const daysToMonday = day === 0 ? -6 : 1 - day;
                const monday = new Date(picked);
                monday.setDate(picked.getDate() + daysToMonday);
                const y = monday.getFullYear();
                const m = String(monday.getMonth() + 1).padStart(2, '0');
                const d = String(monday.getDate()).padStart(2, '0');
                setSelectedMonday(`${y}-${m}-${d}`);
                setNewTimesheetError('');
              }}
            />
          </Form.Group>
          {/* Show the due date once a Monday is selected */}
          {selectedMonday && (
            <div className="mt-2 px-3 py-2 rounded" style={{ background: '#e8f4f8', fontSize: '0.85rem', color: '#00789A' }}>
              <strong>Due:</strong> {getDueDate(selectedMonday)}
            </div>
          )}
          {newTimesheetError && <Alert variant="danger" className="mt-2 py-1 small">{newTimesheetError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => { setShowNewModal(false); setNewTimesheetError(''); setSelectedMonday(''); }}>Cancel</Button>
          <Button onClick={handleConfirmNew} disabled={creating} style={{ background: '#00789A', border: 'none' }}>
            {creating ? <Spinner animation="border" size="sm" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ConsultantDashboard;
