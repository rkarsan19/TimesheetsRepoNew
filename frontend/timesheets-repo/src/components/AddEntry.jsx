import { useState } from "react";
import '../styles/timesheets.css';

const AddEntry = ({ timesheetId, onEntryAdded }) => {
  const [formData, setFormData] = useState({
    date: "",
    hoursWorked: "",
    description: "",
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newEntry = {
      model: "api.timesheetentry",
      pk: Date.now(),
      fields: {
        timesheet: Number(timesheetId),
        date: formData.date,
        hoursWorked: parseFloat(formData.hoursWorked).toFixed(2),
        description: formData.description,
      }
    };

    console.log("New Entry Structured:", newEntry);

    setSuccess(true);
    setFormData({ date: "", hoursWorked: "", description: "" });

    if (onEntryAdded) onEntryAdded(newEntry);
  };

  return (
    <div className="addentry-wrapper">
      <div className="addentry-header">
        <h3>Add Time Entry</h3>
        <p>Log your hours for this timesheet</p>
      </div>

      <form className="addentry-form" onSubmit={handleSubmit}>
        <div className="addentry-field">
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="addentry-field">
          <label>Hours Worked</label>
          <input
            type="number"
            name="hoursWorked"
            value={formData.hoursWorked}
            onChange={handleChange}
            required
            min="0.5"
            max="24"
            step="0.5"
            placeholder="e.g. 7.5"
          />
        </div>

        <div className="addentry-field">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="What did you work on?"
            rows={3}
          />
        </div>

        {success && (
          <p className="addentry-success">Entry added successfully!</p>
        )}

        <button className="addentry-submit" type="submit">
          Add Entry
        </button>
      </form>
    </div>
  );
};

export default AddEntry;