import Timesheet from "./Timesheet";
import '../styles/timesheets.css';

const phonyTimesheets = [
  { model: "api.timesheet", pk: 1, fields: { consultant: 1, lineManager: "Manager", submitDate: "2024-01-15", status: "APPROVED", comments: "All good" } },
  { model: "api.timesheet", pk: 2, fields: { consultant: 2, lineManager: "Manager", submitDate: "2024-01-15", status: "SUBMITTED", comments: "" } },
  { model: "api.timesheet", pk: 3, fields: { consultant: 1, lineManager: "Manager", submitDate: "2024-01-22", status: "DRAFT", comments: "" } }
];

const phonyEntries = [
  { model: "api.timesheetentry", pk: 1, fields: { timesheet: 1, date: "2024-01-08", hoursWorked: "8.00", description: "Frontend development" } },
  { model: "api.timesheetentry", pk: 2, fields: { timesheet: 1, date: "2024-01-09", hoursWorked: "7.50", description: "API integration" } },
  { model: "api.timesheetentry", pk: 3, fields: { timesheet: 1, date: "2024-01-10", hoursWorked: "8.00", description: "Bug fixes" } },
  { model: "api.timesheetentry", pk: 4, fields: { timesheet: 2, date: "2024-01-08", hoursWorked: "8.00", description: "Backend development" } },
  { model: "api.timesheetentry", pk: 5, fields: { timesheet: 2, date: "2024-01-09", hoursWorked: "6.00", description: "Database setup" } }
];

const ViewTimesheetPage = ({ timesheetId, onBack }) => {
    const timesheetObj = phonyTimesheets.find(ts => ts.pk === Number(timesheetId));
    
    const filteredEntries = phonyEntries.filter(entry => entry.fields.timesheet === Number(timesheetId));

    if (!timesheetObj) return <div className="timesheetlist-content">Timesheet not found.</div>;

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
                timesheet={timesheetObj.fields}
                initialEntries={filteredEntries}
            />
        </div>
    );
};

export default ViewTimesheetPage;