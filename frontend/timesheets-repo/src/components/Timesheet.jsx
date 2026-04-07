import { useState } from "react";
import TimeEntry from "./TimeEntry";
import AddEntry from "./AddEntry";
import '../styles/timesheets.css';

const statusClass = (status) => {
    const statuses = {
        'APPROVED': 'status-approved',
        'SUBMITTED': 'status-submitted',
        'REJECTED': 'status-rejected',
        'DRAFT': 'status-draft'
    };
    return `status-icon ${statuses[status] || ''}`;
};

const Timesheet = ({ timesheetId, timesheet, initialEntries = [] }) => {
    const [entries, setEntries] = useState(initialEntries);
    const [showAddEntry, setShowAddEntry] = useState(false);

    const handleEntryAdded = (newEntry) => {
        setEntries((prev) => [...prev, newEntry]);
        setShowAddEntry(false);
    };

    if (!timesheet) return <p>Timesheet not found.</p>;

    return (
        <div className="timesheet">
            <div className="timesheet-header">
                <span className={statusClass(timesheet.status)}>{timesheet.status}</span>
            </div>

            <div className="timesheet-meta">
                <span><strong>Week Commencing:</strong> {timesheet.weekCommencing ?? '—'}</span>
                <span><strong>Week Ending:</strong> {timesheet.weekEnding ?? '—'}</span>
                {timesheet.submitDate && <span><strong>Submit Date:</strong> {timesheet.submitDate}</span>}
                {timesheet.comments && <span><strong>Comments:</strong> {timesheet.comments}</span>}
            </div>

            <div className="timesheet-entries">
                {entries.length === 0
                    ? <p>No entries for this timesheet.</p>
                    : entries.map((entry) => (
                        <TimeEntry
                            key={entry.id}
                            date={entry.date}
                            hours={entry.hoursWorked}
                            desc={entry.description}
                        />
                    ))
                }
            </div>

            <div className="timesheet-add-entry">
                <button
                    className="action-btn action-btn-approve"
                    onClick={() => setShowAddEntry((prev) => !prev)}
                >
                    {showAddEntry ? "✕ Cancel" : "+ Add Entry"}
                </button>

                {showAddEntry && (
                    <AddEntry
                        timesheetId={timesheetId}
                        onEntryAdded={handleEntryAdded}
                    />
                )}
            </div>
        </div>
    );
};

export default Timesheet;
