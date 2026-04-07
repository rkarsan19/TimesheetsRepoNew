import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const buildDayRows = (weekCommencing, entries) => {
  const monday = new Date(weekCommencing + 'T00:00:00');
  return DAYS.map((dayName, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const existing = entries.find(e => e.date === dateStr);
    return {
      dayName,
      date: dateStr,
      displayDate: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      hoursWorked: existing ? parseFloat(existing.hoursWorked) : 0,
      overtime_hours: existing ? parseFloat(existing.overtime_hours || 0) : 0,
      work_type: existing?.work_type || 'STANDARD',
      description: existing?.description || '',
    };
  });
};

const TimesheetDetail = ({ timesheetId, onBack }) => {
  const [timesheet, setTimesheet] = useState(null);
  const [dayRows, setDayRows] = useState([]);
  const [comments, setComments] = useState('');
  const [clientName, setClientName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tsRes, entriesRes, assignmentsRes] = await Promise.all([
          axios.get(`${API_BASE}/timesheets/${timesheetId}/`),
          axios.get(`${API_BASE}/timesheets/${timesheetId}/entries/`),
          axios.get(`${API_BASE}/timesheets/${timesheetId}/assignments/`),
        ]);
        const ts = tsRes.data;
        setTimesheet(ts);
        setComments(ts.status === 'REJECTED' ? '' : (ts.comments || ''));
        const a = assignmentsRes.data[0] || null;
        setClientName(a?.client_name || '');
        setAssignmentName(a?.assignment_name || '');
        if (ts.weekCommencing) {
          setDayRows(buildDayRows(ts.weekCommencing, entriesRes.data));
        }
      } catch (err) {
        console.error('Failed to load timesheet:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timesheetId]);

  const handleDayChange = (index, field, value) => {
    setDayRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const totalStandard = dayRows.reduce((s, r) => s + (parseFloat(r.hoursWorked) || 0), 0);
  const totalOvertime = dayRows.reduce((s, r) => s + (parseFloat(r.overtime_hours) || 0), 0);
  const totalHours = totalStandard + totalOvertime;

  const getDeadline = () => {
    if (!timesheet?.weekCommencing) return '—';
    const monday = new Date(timesheet.weekCommencing + 'T00:00:00');
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    }) + ' · 17:00';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await axios.post(`${API_BASE}/timesheets/${timesheetId}/save-entries/`, {
        entries: dayRows,
        comments,
        client_name: clientName,
        assignment_name: assignmentName,
      });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveMsg('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
    try {
      await axios.put(`${API_BASE}/timesheets/${timesheetId}/submit/`);
      onBack();
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  if (loading) return <div className="p-5 text-center text-muted">Loading...</div>;
  if (!timesheet) return <div className="p-5 text-center text-danger">Timesheet not found.</div>;

  const isEditable = timesheet.status === 'DRAFT' || timesheet.status === 'REJECTED';

  const fieldStyle = {
    background: isEditable ? '#fff' : '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.9rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}
      >
        ← Back to timesheets
      </button>

      {/* Rejection reason banner */}
      {timesheet.status === 'REJECTED' && timesheet.comments && (
        <div style={{
          background: '#fff5f5', border: '1px solid #f8d7da', borderRadius: '10px',
          padding: '1rem 1.25rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#842029', marginBottom: '2px', fontSize: '0.9rem' }}>
              Timesheet rejected
            </div>
            <div style={{ color: '#6c1b23', fontSize: '0.875rem' }}>
              <strong>Reason:</strong> {timesheet.comments}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '1rem' }}>Assignment details</div>
        <hr style={{ margin: '0 0 1rem 0', borderColor: '#eee' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Client</div>
            {isEditable ? (
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Barclays"
                style={{ ...fieldStyle, width: '100%' }}
              />
            ) : (
              <div style={{ fontWeight: 600 }}>{clientName || '—'}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Assignment</div>
            {isEditable ? (
              <input
                type="text"
                value={assignmentName}
                onChange={e => setAssignmentName(e.target.value)}
                placeholder="e.g. Project Alpha"
                style={{ ...fieldStyle, width: '100%' }}
              />
            ) : (
              <div style={{ fontWeight: 600 }}>{assignmentName || '—'}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Week commencing</div>
            <div style={{ fontWeight: 600 }}>
              {timesheet.weekCommencing
                ? new Date(timesheet.weekCommencing + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Submission deadline</div>
            <div style={{ fontWeight: 600, color: '#c0392b' }}>{getDeadline()}</div>
          </div>
        </div>
      </div>

      {/* Daily Hours */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '1.5rem' }}>Daily hours</div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '16%' }}>Day</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '18%' }}>Standard Hrs</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '18%' }}>Overtime Hrs</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '18%' }}>Work Type</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {dayRows.map((row, i) => (
              <tr key={row.date} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 0' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.dayName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{row.displayDate}</div>
                </td>
                <td style={{ padding: '10px 12px 10px 0' }}>
                  <input
                    type="number" min="0" max="24" step="0.5"
                    value={row.hoursWorked}
                    disabled={!isEditable}
                    onChange={e => handleDayChange(i, 'hoursWorked', e.target.value)}
                    style={{ ...fieldStyle, width: '80px', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '10px 12px 10px 0' }}>
                  <input
                    type="number" min="0" max="24" step="0.5"
                    value={row.overtime_hours}
                    disabled={!isEditable}
                    onChange={e => handleDayChange(i, 'overtime_hours', e.target.value)}
                    style={{ ...fieldStyle, width: '80px', textAlign: 'center' }}
                  />
                </td>
                <td style={{ padding: '10px 12px 10px 0' }}>
                  <select
                    value={row.work_type}
                    disabled={!isEditable}
                    onChange={e => handleDayChange(i, 'work_type', e.target.value)}
                    style={{ ...fieldStyle, width: '130px' }}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="OVERTIME">Overtime</option>
                    <option value="SICK">Sick</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </td>
                <td style={{ padding: '10px 0' }}>
                  <input
                    type="text"
                    placeholder="Optional note..."
                    value={row.description}
                    disabled={!isEditable}
                    onChange={e => handleDayChange(i, 'description', e.target.value)}
                    style={{ ...fieldStyle, width: '100%' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Total hours this week</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h</span>
        </div>
      </div>

      {/* Comments */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '1rem' }}>Comments</div>
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Additional notes</div>
        <textarea
          rows={4}
          placeholder="Add any notes for your manager..."
          value={comments}
          disabled={!isEditable}
          onChange={e => setComments(e.target.value)}
          style={{ ...fieldStyle, width: '100%', resize: 'vertical', padding: '10px 12px' }}
        />
      </div>

      {/* Actions */}
      {isEditable && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: '1px solid #ccc',
              background: '#fff', cursor: 'pointer', fontWeight: 500,
            }}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: '#00789A', color: '#fff', cursor: 'pointer', fontWeight: 500,
            }}
          >
            Submit Timesheet
          </button>
          {saveMsg && <span style={{ color: saveMsg === 'Saved!' ? 'green' : 'red', fontSize: '0.85rem' }}>{saveMsg}</span>}
        </div>
      )}
    </div>
  );
};

export default TimesheetDetail;
