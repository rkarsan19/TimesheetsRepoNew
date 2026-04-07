import { useState, useEffect } from 'react';
import axios from 'axios';
import Timesheet from "./Timesheet";
import '../styles/timesheets.css';

const API_BASE = 'http://localhost:8000/api';

const ViewTimesheetPage = ({ timesheetId, onBack }) => {
    const [timesheet, setTimesheet] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tsRes, entriesRes] = await Promise.all([
                    axios.get(`${API_BASE}/timesheets/${timesheetId}/`),
                    axios.get(`${API_BASE}/timesheets/${timesheetId}/entries/`),
                ]);
                setTimesheet(tsRes.data);
                setEntries(entriesRes.data);
            } catch (err) {
                setError('Failed to load timesheet.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timesheetId]);

    if (loading) return <div className="timesheetlist-content"><p>Loading...</p></div>;
    if (error)   return <div className="timesheetlist-content"><p className="text-danger">{error}</p></div>;
    if (!timesheet) return <div className="timesheetlist-content"><p>Timesheet not found.</p></div>;

    return (
        <div>
            {onBack && (
                <div className="timesheetlist-content">
                    <button className="timesheetlist-btn-clear" onClick={onBack}>
                        ← Back to list
                    </button>
                </div>
            )}
            <Timesheet
                timesheetId={timesheetId}
                timesheet={timesheet}
                initialEntries={entries}
            />
        </div>
    );
};

export default ViewTimesheetPage;
