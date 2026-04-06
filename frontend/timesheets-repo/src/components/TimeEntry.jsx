import '../styles/timesheets.css';

const TimeEntry = ({ date, hours, desc }) => {
    return (
        <div className="timeentry">
            <span className="timeentry-date">{date}</span>
            <span className="timeentry-hours">{Number(hours).toFixed(2)}h</span>
            <span className="timeentry-desc">{desc}</span>
        </div>
    );
};

export default TimeEntry;