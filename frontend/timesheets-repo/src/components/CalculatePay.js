import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:8000/api";

function CalculatePay({ onBack, onProfileClick, user }) {
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState("");
  const [result, setResult] = useState(null);
  const [loadingTimesheets, setLoadingTimesheets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/timesheets/`);
        if (!response.ok) {
          throw new Error("Failed to load timesheets.");
        }

        const data = await response.json();
        setTimesheets(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoadingTimesheets(false);
      }
    };

    fetchTimesheets();
  }, []);

  const selectedTimesheet = timesheets.find(
    (timesheet) => String(timesheet.timesheetID) === selectedTimesheetId
  );

  const handleSubmit = async () => {
    if (!selectedTimesheet) {
      setError("Please select a timesheet.");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/payslips/calculate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consultant_id: selectedTimesheet.consultant,
          timesheet_id: selectedTimesheet.timesheetID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to calculate pay.");
      }

      setResult(data);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const userName = user?.name || "Admin";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="container-fluid p-0 vh-100">
      <div className="row g-0 h-100">
        <div
          className="col-6 d-flex flex-column justify-content-between p-4 text-white"
          style={{
            background:
              "linear-gradient(180deg, #0d7a7a 0%, #0b6a6a 45%, #095858 100%)",
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 mb-4">
              <div
                className="rounded-circle border border-white border-2 d-flex align-items-center justify-content-center"
                style={{ width: 46, height: 46 }}
              >
                T
              </div>
              <div>
                <div className="fw-bold lh-1" style={{ fontSize: "1.3rem" }}>
                  TimeDime
                </div>
                <div className="opacity-75" style={{ fontSize: "0.7rem" }}>
                  Finance tools for payslip generation
                </div>
              </div>
            </div>

            <p className="opacity-75 mb-2">Finance Team</p>
            <h1 className="fw-normal" style={{ fontSize: "2.6rem" }}>
              Calculate Pay
            </h1>
            <p className="mb-0" style={{ maxWidth: "420px", opacity: 0.9 }}>
              Select a timesheet, send it to the backend calculation endpoint,
              and review the generated payslip values.
            </p>
          </div>

          {onBack && (
            <div>
              <button
                type="button"
                className="btn text-white fw-semibold px-4"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                onClick={onBack}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        

        <div
          className="col-6 d-flex align-items-center justify-content-center p-4"
          style={{
            background:
              "linear-gradient(135deg, #b2e8e0 0%, #d4f5ef 55%, #e8faf7 100%)",
          }}
        >
          <div
            className="rounded-3 p-4 shadow w-100"
            style={{ backgroundColor: "#00a896", maxWidth: "440px" }}
          >
            <h2 className="text-white fw-bold mb-4">Generate Payslip</h2>

            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="timesheet-select"
                className="d-block text-white mb-2"
              >
                Select Timesheet
              </label>
              <select
                id="timesheet-select"
                value={selectedTimesheetId}
                onChange={(event) => {
                  setSelectedTimesheetId(event.target.value);
                  setResult(null);
                  setError("");
                }}
                disabled={loadingTimesheets}
                className="form-select"
              >
                <option value="">
                  {loadingTimesheets
                    ? "Loading timesheets..."
                    : "Choose a timesheet"}
                </option>
                {timesheets.map((timesheet) => (
                  <option key={timesheet.timesheetID} value={timesheet.timesheetID}>
                    {`Timesheet #${timesheet.timesheetID} - Consultant ${timesheet.consultant}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loadingTimesheets || !selectedTimesheet}
              className="btn w-100 fw-semibold"
              style={{ padding: "10px 16px", backgroundColor: "#a8dfe8" }}
            >
              {submitting ? "Calculating..." : "Calculate Pay"}
            </button>

            {error && (
              <p className="mt-3 mb-0 text-white" style={{ color: "#fff3cd" }}>
                {error}
              </p>
            )}

            {result && (
              <div
                className="mt-4 rounded-3 p-3"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#123" }}
              >
                <h3 style={{ fontSize: "1.1rem" }}>Calculated Payslip</h3>
                <p className="mb-2">
                  <strong>Total Hours:</strong> {result.totalHours}
                </p>
                <p className="mb-2">
                  <strong>Pay Rate:</strong> {result.payRate}
                </p>
                <p className="mb-2">
                  <strong>Total Pay:</strong> {result.totalPay}
                </p>
                <p className="mb-0">
                  <strong>Generated Date:</strong> {result.generatedDate}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* user profile button */}      
      <div className="position-absolute d-flex align-items-center gap-2" style={{ top: "20px", right: "30px" }}>
          <span style={{ color: '#0d7a7a', fontSize: '0.9rem' }}>{user.name}</span>
          <div onClick={onProfileClick} style={{
            width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "rgba(49, 163, 142, 0.51)",
            border: "2px solid rgba(78, 203, 194, 0.6)",
            color: '#fff',
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "1rem",
            cursor: 'pointer',
          }}>
            {initials}
          </div>
          </div>
    </div>
  );
}

export default CalculatePay;
