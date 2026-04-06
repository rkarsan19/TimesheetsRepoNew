import { useState } from "react";
import ViewTimesheetPage from "./ViewTimesheet";
import '../styles/timesheets.css';

const phonyTimesheets = [
  { model: "api.timesheet", pk: 1, fields: { consultant: 1, lineManager: "Manager", submitDate: "2024-01-15", status: "APPROVED", comments: "All good" } },
  { model: "api.timesheet", pk: 2, fields: { consultant: 2, lineManager: "Manager", submitDate: "2024-01-15", status: "SUBMITTED", comments: "" } },
  { model: "api.timesheet", pk: 3, fields: { consultant: 1, lineManager: "Manager", submitDate: "2024-01-22", status: "DRAFT", comments: "" } }
];

const statusClass = (status) => {
    const classes = {
        'APPROVED': 'status-approved',
        'SUBMITTED': 'status-submitted',
        'REJECTED': 'status-rejected',
        'DRAFT': 'status-draft'
    };
    return `status-icon ${classes[status] || ''}`;
};

const TimesheetList = ({ consultantId }) => {
    const [selectedId, setSelectedId] = useState(null);

    const timesheets = consultantId
        ? phonyTimesheets.filter(t => t.fields.consultant === Number(consultantId))
        : phonyTimesheets;

    if (selectedId !== null) {
        return (
            <ViewTimesheetPage
                timesheetId={selectedId}
                onBack={() => setSelectedId(null)}
            />
        );
    }

    return (
        <div>
            <div className="timesheetlist-hero">
                <div className="hero-user">
                    <span>Consultant</span>
                    <div className="avatar">C</div>
                </div>
                <h1>Timesheets</h1>
            </div>

            <div className="timesheetlist-table-card">
                <table className="timesheetlist-table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Date Submitted</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {timesheets.map((ts) => (
                            <tr
                                key={ts.pk}
                                onClick={() => setSelectedId(ts.pk)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>
                                    <span className={statusClass(ts.fields.status)}>
                                        {ts.fields.status}
                                    </span>
                                </td>
                                <td>{ts.fields.submitDate}</td>
                                <td>{ts.fields.comments || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TimesheetList;