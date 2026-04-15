import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './loadingAni';

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
      client_id: existing?.client || null,
    };
  });
};

const TimesheetDetail = ({ timesheetId, onBack }) => {
  const [timesheet, setTimesheet] = useState(null);
  const [dayRows, setDayRows] = useState([]);
  const [comments, setComments] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [overtimeLimit, setOvertimeLimit] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tsRes, entriesRes, clientsRes, limitRes] = await Promise.all([
          axios.get(`${API_BASE}/timesheets/${timesheetId}/`),
          axios.get(`${API_BASE}/timesheets/${timesheetId}/entries/`),
          axios.get(`${API_BASE}/clients/`),
          axios.get(`${API_BASE}/settings/overtime-limit/`),
          new Promise(resolve => setTimeout(resolve, 800)),
        ]);
        const ts = tsRes.data;
        setTimesheet(ts);
        setComments(ts.status === 'REJECTED' ? '' : (ts.comments || ''));
        setClients(clientsRes.data);
        if (ts.weekCommencing) {
          setDayRows(buildDayRows(ts.weekCommencing, entriesRes.data));
        }
        setOvertimeLimit(parseFloat(limitRes.data.overtime_limit));
      } catch (err) {
        console.error('Failed to load timesheet:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timesheetId]);

  const handleDayChange = (index, field, value) => {
    setDayRows(prev => {
      const updated = prev.map((row, i) => i === index ? { ...row, [field]: value } : row);
      const row = updated[index];
      const standard = Math.floor(parseFloat(row.hoursWorked)* 10) / 10 || 0;
      const overtime = Math.floor(parseFloat(row.overtime_hours)* 10) / 10 || 0;
      let err = '';
      if (standard > 8) {
        err = 'Standard hours cannot exceed 8 (9am–5pm working day).';
      } else if (overtimeLimit !== null && overtime > overtimeLimit) {
        err = `Overtime cannot exceed the ${overtimeLimit}h limit set by your line manager.`;
      }
      setRowErrors(prev => ({ ...prev, [index]: err }));
      return updated;
    });
  };

  const totalStandard = dayRows.reduce((s, r) => s + (parseFloat(r.hoursWorked) || 0), 0);
  const totalOvertime = dayRows.reduce((s, r) => s + (parseFloat(r.overtime_hours) || 0), 0);
  const totalHours = totalStandard + totalOvertime;

  const getDeadline = () => {
    if (!timesheet?.weekCommencing) return '—';
    const monday = new Date(timesheet.weekCommencing + 'T00:00:00');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    }) + ' · 21:00';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await axios.post(`${API_BASE}/timesheets/${timesheetId}/save-entries/`, {
        entries: dayRows,
        comments,
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

  const hasErrors = Object.values(rowErrors).some(e => e);

  const handleSubmit = async () => {
    if (hasErrors) return;

    if (totalHours === 0) {
      setSubmitError('No Hours Logged! Please enter hours for at least one day before submitting!');
      return;
    }
    await handleSave();
    try {
      await axios.put(`${API_BASE}/timesheets/${timesheetId}/submit/`);
      onBack();
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><Loader /></div>;
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: isMobile ? '1rem' : '2rem', fontFamily: 'system-ui, sans-serif' }}>
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

      {/* Timesheet meta */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>Week commencing</div>
          <div style={{ fontWeight: 600 }}>
            {timesheet.weekCommencing
              ? new Date(timesheet.weekCommencing + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>Submission deadline</div>
          <div style={{ fontWeight: 600, color: '#c0392b' }}>{getDeadline()}</div>
        </div>
      </div>

      {/* Daily Hours */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '1.5rem' }}>Daily hours</div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '13%' }}>Day</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '13%' }}>Standard Hrs</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '13%' }}>Overtime Hrs</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '14%' }}>Work Type</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px', width: '20%' }}>Client</th>
              <th style={{ textAlign: 'left', paddingBottom: '12px' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {dayRows.map((row, i) => (
              <>
                <tr key={row.date} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.dayName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{row.displayDate}</div>
                  </td>
                  <td style={{ padding: '10px 12px 10px 0' }}>
                    <input
                      type="number" min="0" max="8" step="0.5"
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
                      style={{ ...fieldStyle, width: '80px', textAlign: 'center', borderColor: rowErrors[i] ? '#c0392b' : undefined }}
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
                      <option value="SICK">Sick</option>
                      <option value="HOLIDAY">Holiday</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 12px 10px 0' }}>
                    {isEditable ? (
                      <select
                        value={row.client_id || ''}
                        onChange={e => handleDayChange(i, 'client_id', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ ...fieldStyle, width: '100%' }}
                      >
                        <option value="">— Select client —</option>
                        {clients.map(c => (
                          <option key={c.clientId} value={c.clientId}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ fontSize: '0.9rem' }}>
                        {clients.find(c => c.clientId === row.client_id)?.name || '—'}
                      </div>
                    )}
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
                {rowErrors[i] && (
                  <tr key={`err-${i}`}>
                    <td colSpan={6} style={{ padding: '0 0 8px 0', color: '#c0392b', fontSize: '0.8rem' }}>
                      ⚠ {rowErrors[i]}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        </div>

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: '1px solid #ccc',
              background: '#fff', cursor: saving || hasErrors ? 'not-allowed' : 'pointer', fontWeight: 500,
              opacity: hasErrors ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || hasErrors}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              background: '#00789A', color: '#fff', cursor: saving || hasErrors ? 'not-allowed' : 'pointer', fontWeight: 500,
              opacity: hasErrors ? 0.6 : 1,
            }}
          >
            Submit Timesheet
          </button>
          {hasErrors && <span style={{ color: '#c0392b', fontSize: '0.85rem' }}>Fix the errors above before saving.</span>}
          {saveMsg && !hasErrors && <span style={{ color: saveMsg === 'Saved!' ? 'green' : 'red', fontSize: '0.85rem' }}>{saveMsg}</span>}
          {submitError && <span style={{ color: '#c0392b', fontSize: '0.85rem' }}>⚠ {submitError}</span>}
        </div>
      )}
    </div>
  );
};

export default TimesheetDetail;
