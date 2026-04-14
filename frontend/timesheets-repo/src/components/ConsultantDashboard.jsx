// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Button, Badge, Modal, Form, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
// import Loader from './loadingAni';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// const API_BASE = 'http://localhost:8000/api';

// const STATUS_CONFIG = {
//   DRAFT:     { label: 'Draft',     bg: 'warning',   text: 'dark' },
//   SUBMITTED: { label: 'Submitted', bg: 'info',      text: 'dark' },
//   APPROVED:  { label: 'Approved',  bg: 'success',   text: 'white' },
//   REJECTED:  { label: 'Rejected',  bg: 'danger',    text: 'white' },
// };

// const StatusBadge = ({ status }) => {
//   const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
//   return (
//     <Badge bg={config.bg} text={config.text} pill className="px-3 py-2">
//       {config.label}
//     </Badge>
//   );
// };

// const ConsultantDashboard = ({ onNavigate = () => {}, consultantId = 1 }) => {
//   const [timesheets, setTimesheets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filterStatus, setFilterStatus] = useState('');
//   const [actionLoading, setActionLoading] = useState(null);
//   const [user, setUser] = useState(null);
//   const [showNewModal, setShowNewModal] = useState(false);
//   const [selectedMonday, setSelectedMonday] = useState('');
//   const [newTimesheetError, setNewTimesheetError] = useState('');
//   const [creating, setCreating] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   useEffect(() => {
//     fetchUser();
//     fetchTimesheets();
//   }, []);

//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth < 768);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const fetchUser = async () => {
//     try {
//       const response = await axios.get(`${API_BASE}/consultants/${consultantId}/`);
//       setUser(response.data);
//     } catch (err) {
//       console.error('Failed to fetch consultant:', err);
//     }
//   };

//   const fetchTimesheets = async () => {
//     try {
//       setLoading(true);
//       const [response] = await Promise.all([
//         axios.get(`${API_BASE}/timesheets/consultant/${consultantId}/`),
//         new Promise(resolve => setTimeout(resolve, 800)),
//       ]);
//       setTimesheets(response.data);
//       setError(null);
//     } catch (err) {
//       setError('Failed to load timesheets. Is the Django server running?');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (pk) => {
//     if (!window.confirm('Submit this timesheet for approval?')) return;
//     try {
//       setActionLoading(pk);
//       await axios.put(`${API_BASE}/timesheets/${pk}/submit/`);
//       fetchTimesheets();
//     } catch (err) {
//       alert('Failed to submit timesheet.');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleWithdraw = async (pk) => {
//     if (!window.confirm('Withdraw this timesheet? It will return to Draft.')) return;
//     try {
//       setActionLoading(pk);
//       await axios.put(`${API_BASE}/timesheets/${pk}/withdraw/`);
//       fetchTimesheets();
//     } catch (err) {
//       alert('Failed to withdraw timesheet.');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleEdit = (pk) => onNavigate('edit', pk);
//   const handleView = (pk) => onNavigate('view', pk);

//   const handleCreateNew = () => {
//     setSelectedMonday('');
//     setNewTimesheetError('');
//     setShowNewModal(true);
//   };

//   const getSunday = (mondayStr) => {
//     const monday = new Date(mondayStr);
//     const sunday = new Date(monday);
//     sunday.setDate(monday.getDate() + 6);
//     return sunday.toISOString().split('T')[0];
//   };

//   const handleConfirmNew = async () => {
//     if (!selectedMonday) {
//       setNewTimesheetError('Please select a week.');
//       return;
//     }
//     const day = new Date(selectedMonday).getDay();
//     if (day !== 1) {
//       setNewTimesheetError('Please select a Monday.');
//       return;
//     }
//     const weekEnding = getSunday(selectedMonday);
//     try {
//       setCreating(true);
//       setNewTimesheetError('');
//       await axios.post(`${API_BASE}/timesheets/create/`, {
//         consultantId,
//         weekCommencing: selectedMonday,
//         weekEnding,
//       });
//       setShowNewModal(false);
//       fetchTimesheets();
//     } catch (err) {
//       if (err.response?.data?.error) {
//         setNewTimesheetError(err.response.data.error);
//       } else {
//         setNewTimesheetError('Failed to create timesheet.');
//       }
//     } finally {
//       setCreating(false);
//     }
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return '—';
//     const date = new Date(dateStr);
//     return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
//   };

//   const filteredTimesheets = filterStatus
//     ? timesheets.filter(t => t.status === filterStatus)
//     : timesheets;

//   const userName = user?.name || '';
//   const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

//   return (
//     <div className="min-vh-100" style={{ background: '#f0f0f0' }}>

//       {/* Header */}
//       <div style={{ position: 'relative', overflow: 'hidden', height: isMobile ? '90px' : '110px' }}>
//         <div style={{
//           position: 'absolute', inset: 0,
//           background: 'linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)',
//         }} />
//         {!isMobile && (
//           <svg
//             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
//             viewBox="0 0 7000 4000"
//             preserveAspectRatio="xMinYMid slice"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path style={{ opacity: 0.35 }} fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF"
//               d="M0,1166.876V4000h4030.481C3501.117,1426.369,1382.347,3416.733,0,1166.876" />
//             <path style={{ opacity: 0.29 }} fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF"
//               d="M2414.969,2473.216c-458.236-869.114-1287.852-740.558-2142.418-925.708c-90.707-19.653-181.696-42.841-272.551-71.13V4000h2759.611C2713.274,3292.356,2591.76,2808.533,2414.969,2473.216" />
//             <path style={{ opacity: 0.35 }} fillRule="evenodd" clipRule="evenodd" fill="#FFFFFF"
//               d="M0,1476.377V4000h2759.611h2.687c137.698-641.471,145.109-1104.106,61.803-1450.792C2495.544,1181.905,755.904,1618.136,32.519,0H0v1166.876V1476.377z" />
//           </svg>
//         )}
//         <div className="position-absolute top-0 end-0 h-100 d-flex align-items-center pe-4 gap-3" style={{ paddingRight: isMobile ? '1rem' : undefined, gap: isMobile ? '8px' : undefined }}>
//           <Button
//               variant="outline-light"
//               size={isMobile ? 'sm' : 'sm'}
//               onClick={() => onNavigate('logout')}
//               style={{ fontSize: isMobile ? '0.75rem' : 'inherit', padding: isMobile ? '4px 8px' : undefined }}
//           >
//             Sign out
//           </Button>
//           <span className="text-white" style={{ fontSize: isMobile ? '0.8rem' : 'inherit' }}>{userName}</span>
//           <div
//               className="rounded-circle d-flex align-items-center justify-content-center fw-semibold text-white"
//               style={{width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, background: 'rgba(255,255,255,0.3)', fontSize: isMobile ? 14 : 16}}
//           >
//             {initials}
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <Container className="py-4" style={{ padding: isMobile ? '1rem' : undefined }}>
//         <div className="bg-white rounded-4 p-4 shadow-sm" style={{ padding: isMobile ? '1rem' : undefined }}>

//           {/* Title row */}
//           <Row className="align-items-center mb-4" style={{ flexDirection: isMobile ? 'column' : undefined, alignItems: isMobile ? 'stretch' : undefined, gap: isMobile ? '1rem' : undefined }}>
//             <Col style={{padding: 0}}>
//               <h1 className="fs-3 fw-semibold mb-0" style={{ fontSize: isMobile ? '1.25rem' : undefined }}>Timesheets</h1>
//             </Col>
//             <Col xs="auto" style={{ padding: 0, width: isMobile ? '100%' : 'auto' }}>
//               <Button
//                 onClick={handleCreateNew}
//                 style={{ background: '#2a7a7a', borderColor: '#2a7a7a', width: isMobile ? '100%' : 'auto' }}
//               >
//                 + New Timesheet
//               </Button>
//             </Col>
//           </Row>

//           {/* Filter bar */}
//           <Row className="mb-4" style={{ flexDirection: isMobile ? 'column' : undefined, gap: isMobile ? '0.5rem' : undefined }}>
//             <Col xs="auto" style={{ padding: 0, width: isMobile ? '100%' : 'auto' }}>
//               <Form.Select
//                 value={filterStatus}
//                 onChange={e => setFilterStatus(e.target.value)}
//                 style={{ minWidth: '160px', width: isMobile ? '100%' : 'auto' }}
//               >
//                 <option value="">Filter by status</option>
//                 {Object.entries(STATUS_CONFIG).map(([key, config]) => (
//                   <option key={key} value={key}>{config.label}</option>
//                 ))}
//               </Form.Select>
//             </Col>
//             {filterStatus && (
//               <Col xs="auto" style={{ padding: 0, width: isMobile ? '100%' : 'auto' }}>
//                 <Button variant="outline-secondary" onClick={() => setFilterStatus('')} style={{ width: isMobile ? '100%' : 'auto' }}>
//                   Clear
//                 </Button>
//               </Col>
//             )}
//           </Row>

//           {/* Table header - hidden on mobile */}
//           {!isMobile && (
//             <Row className="border-bottom pb-2 mb-2 text-muted small fw-semibold">
//             <Col xs={2}>Status</Col>
//             <Col xs={3}></Col>
//             </Row>
//           )}

//           {/* Loading */}
//           {loading && (
//             <div className="d-flex justify-content-center py-5">
//               <Loader />
//             </div>
//           )}

//           {/* Error */}
//           {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

//           {/* Empty */}
//           {!loading && !error && filteredTimesheets.length === 0 && (
//             <p className="text-center text-muted py-5">No timesheets found.</p>
//           )}

//           {/* Desktop Rows */}
//           {!isMobile && !loading && !error && filteredTimesheets.map((ts) => (
//             <Row
//               key={ts.timesheetID}
//               className="align-items-center border-bottom py-3"
//               style={{ opacity: actionLoading === ts.timesheetID ? 0.5 : 1, transition: 'opacity 0.2s' }}
//             >
//               <Col>{formatDate(ts.weekCommencing)}</Col>
//               <Col>{formatDate(ts.weekEnding)}</Col>
//               <Col xs={2}><StatusBadge status={ts.status} /></Col>
//               <Col xs={3} className="d-flex justify-content-end gap-2">
//                 {ts.status === 'DRAFT' && (
//                   <>
//                     <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(ts.timesheetID)}>Edit</Button>
//                     <Button size="sm" variant="outline-primary" onClick={() => handleSubmit(ts.timesheetID)}>Submit</Button>
//                   </>
//                 )}
//                 {ts.status === 'SUBMITTED' && (
//                   <>
//                     <Button size="sm" variant="outline-secondary" onClick={() => handleView(ts.timesheetID)}>View</Button>
//                     <Button size="sm" variant="outline-warning" onClick={() => handleWithdraw(ts.timesheetID)}>Withdraw</Button>
//                   </>
//                 )}
//                 {ts.status === 'REJECTED' && (
//                   <>
//                     <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(ts.timesheetID)}>Edit</Button>
//                     <Button size="sm" variant="outline-primary" onClick={() => handleSubmit(ts.timesheetID)}>Submit</Button>
//                   </>
//                 )}
//                 {['APPROVED'].includes(ts.status) && (
//                   <Button size="sm" variant="outline-secondary" onClick={() => handleView(ts.timesheetID)}>View</Button>
//                 )}
//               </Col>
//             </Row>
//           ))}

//           {/* Mobile Card Layout */}
//           {isMobile && !loading && !error && filteredTimesheets.map((ts) => (
//             <div
//               key={ts.timesheetID}
//               className="border rounded-3 p-3 mb-3"
//               style={{ 
//                 borderColor: '#e0e0e0',
//                 opacity: actionLoading === ts.timesheetID ? 0.5 : 1,
//                 transition: 'opacity 0.2s'
//               }}
//             >
//               <div className="d-flex justify-content-between align-items-start mb-2">
//                 <div>
//                   <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Week of {formatDate(ts.weekCommencing)}</div>
//                   <div style={{ fontSize: '0.75rem', color: '#999' }}>ID: {ts.timesheetID}</div>
//                 </div>
//                 <StatusBadge status={ts.status} />
//               </div>
//               <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '12px' }}>Ends: {formatDate(ts.weekEnding)}</div>
//               <div className="d-flex flex-wrap gap-2">
//                 {ts.status === 'DRAFT' && (
//                   <>
//                     <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(ts.timesheetID)} style={{ flex: '1 1 45%' }}>Edit</Button>
//                     <Button size="sm" variant="outline-primary" onClick={() => handleSubmit(ts.timesheetID)} style={{ flex: '1 1 45%' }}>Submit</Button>
//                   </>
//                 )}
//                 {ts.status === 'SUBMITTED' && (
//                   <>
//                     <Button size="sm" variant="outline-secondary" onClick={() => handleView(ts.timesheetID)} style={{ flex: '1 1 45%' }}>View</Button>
//                     <Button size="sm" variant="outline-warning" onClick={() => handleWithdraw(ts.timesheetID)} style={{ flex: '1 1 45%' }}>Withdraw</Button>
//                   </>
//                 )}
//                 {ts.status === 'REJECTED' && (
//                   <>
//                     <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(ts.timesheetID)} style={{ flex: '1 1 45%' }}>Edit</Button>
//                     <Button size="sm" variant="outline-primary" onClick={() => handleSubmit(ts.timesheetID)} style={{ flex: '1 1 45%' }}>Submit</Button>
//                   </>
//                 )}
//                 {['APPROVED'].includes(ts.status) && (
//                   <Button size="sm" variant="outline-secondary" onClick={() => handleView(ts.timesheetID)} style={{ flex: '1 1 100%' }}>View</Button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </Container>

//       {/* New Timesheet Modal */}
//       <Modal show={showNewModal} onHide={() => setShowNewModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>New Timesheet</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <p className="text-muted small mb-3">
//             Select the Monday of the week you want to create a timesheet for.
//           </p>
//           <Form.Group className="mb-3">
//             <Form.Label>Week commencing (Monday)</Form.Label>
//             <Form.Control
//               type="date"
//               value={selectedMonday}
//               onChange={e => { setSelectedMonday(e.target.value); setNewTimesheetError(''); }}
//             />
//           </Form.Group>

//           {selectedMonday && new Date(selectedMonday).getDay() === 1 && (
//             <Alert variant="success" className="py-2">
//               Week ending: {new Date(getSunday(selectedMonday)).toLocaleDateString('en-GB', {
//                 day: 'numeric', month: 'long', year: 'numeric'
//               })}
//             </Alert>
//           )}

//           {newTimesheetError && (
//             <Alert variant="danger" className="py-2">{newTimesheetError}</Alert>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="outline-secondary" onClick={() => setShowNewModal(false)}>
//             Cancel
//           </Button>
//           <Button
//             disabled={creating}
//             onClick={handleConfirmNew}
//             style={{ background: '#2a7a7a', borderColor: '#2a7a7a' }}
//           >
//             {creating ? <Spinner animation="border" size="sm" /> : 'Confirm'}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//     </div>
//   );
// };

// export default ConsultantDashboard;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Badge, Modal, Form, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Loader from './loadingAni';

const API_BASE = 'http://localhost:8000/api';

// Updated to match the specific color palette in your screenshots
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
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleConfirmNew = async () => {
    if (!selectedMonday) return setNewTimesheetError('Please select a Monday.');
    try {
      setCreating(true);
      await axios.post(`${API_BASE}/timesheets/create/`, { 
        consultantId, 
        weekCommencing: selectedMonday, 
        weekEnding: new Date(new Date(selectedMonday).setDate(new Date(selectedMonday).getDate() + 6)).toISOString().split('T')[0] 
      });
      setShowNewModal(false);
      fetchTimesheets();
    } catch (err) { setNewTimesheetError('Failed to create.'); }
    finally { setCreating(false); }
  };

  const filteredTimesheets = filterStatus ? timesheets.filter(t => t.status === filterStatus) : timesheets;
  const userName = user?.name || 'Jane Smith';

  return (
    <div className="min-vh-100 pb-5" style={{ background: '#f8f9fa' }}>
      
      {/* Header matching the James Smith screenshot */}
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

                  {/* The specific Teal View Details Button from your screenshot */}
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
      <Modal show={showNewModal} onHide={() => setShowNewModal(false)} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">New Timesheet</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold">WEEK COMMENCING (MONDAY)</Form.Label>
            <Form.Control type="date" value={selectedMonday} onChange={e => setSelectedMonday(e.target.value)} />
          </Form.Group>
          {newTimesheetError && <Alert variant="danger" className="mt-2 py-1 small">{newTimesheetError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleConfirmNew} style={{ background: '#00789A', border: 'none' }}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ConsultantDashboard;
