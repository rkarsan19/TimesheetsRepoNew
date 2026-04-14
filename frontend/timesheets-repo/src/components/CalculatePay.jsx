import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner } from "react-bootstrap";
import Loader from "./loadingAni";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar, faUsers, faCheckCircle, faDownload,
  faExclamationTriangle, faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "./NotificationBell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = "http://localhost:8000/api";
const STANDARD_DAY_HOURS = 8;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatMoney = (val) =>
  `£${parseFloat(val || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const getMonthLabel = (monthStr) => {
  const [year, month] = monthStr.split("-");
  return new Date(year, parseInt(month) - 1).toLocaleDateString("en-GB", {
    month: "long", year: "numeric",
  });
};

const getCurrentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const timesheetInMonth = (ts, monthStr) => {
  if (!ts.weekCommencing) return false;
  const [year, month] = monthStr.split("-");
  const d = new Date(ts.weekCommencing + "T00:00:00");
  return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
};

const calcEntryPay = (entry, clientsById, assignmentRates, fallbackRate) => {
  const std = parseFloat(entry.hoursWorked || 0);
  const ot = parseFloat(entry.overtime_hours || 0);
  const client = entry.client ? clientsById[entry.client] : null;
  const aByClient = assignmentRates?.byClient || {};
  const aDefault = assignmentRates?.default || 0;

  let rate = parseFloat(fallbackRate || 0);
  if (client && parseFloat(client.daily_rate) > 0) rate = parseFloat(client.daily_rate);
  if (aDefault > 0) rate = aDefault;
  if (entry.client && aByClient[entry.client] > 0) rate = aByClient[entry.client];

  const hourly = rate / STANDARD_DAY_HOURS;
  return {
    std, ot, rate,
    stdPay: hourly * std,
    otPay: hourly * 1.5 * ot,
    totalPay: hourly * std + hourly * 1.5 * ot,
    clientName: client?.name || null,
    hasMissingRate: rate === 0,
  };
};

const buildClientBreakdown = (entries, clientsById, assignmentRates, fallbackRate) => {
  const map = {};
  for (const entry of entries) {
    const calc = calcEntryPay(entry, clientsById, assignmentRates, fallbackRate);
    const key = entry.client ? `client_${entry.client}` : "no_client";
    const label = calc.clientName || "No client assigned";
    if (!map[key]) {
      map[key] = { label, rate: calc.rate, std: 0, ot: 0, stdPay: 0, otPay: 0, totalPay: 0, hasMissingRate: calc.hasMissingRate };
    }
    map[key].std += calc.std;
    map[key].ot += calc.ot;
    map[key].stdPay += calc.stdPay;
    map[key].otPay += calc.otPay;
    map[key].totalPay += calc.totalPay;
  }
  return Object.values(map);
};

const FinanceDashboard = ({ user, onProfileClick }) => {
  const [consultants, setConsultants] = useState([]);
  const [clientsById, setClientsById] = useState({});
  const [timesheets, setTimesheets] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [entriesMap, setEntriesMap] = useState({});
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payslipDone, setPayslipDone] = useState(false);
  const [payHistory, setPayHistory] = useState([]);
  const [paidTimesheets, setPaidTimesheets] = useState([]);
  const [historyEntriesMap, setHistoryEntriesMap] = useState({});
  const [historyAssignmentsMap, setHistoryAssignmentsMap] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        const [cRes, tRes, clRes] = await Promise.all([
          axios.get(`${API_BASE}/consultants/`),
          axios.get(`${API_BASE}/timesheets/`),
          axios.get(`${API_BASE}/clients/`),
          new Promise((r) => setTimeout(r, 700)),
        ]);
        setConsultants(cRes.data);
        setTimesheets(tRes.data);
        const byId = {};
        clRes.data.forEach((c) => { byId[c.clientId] = c; });
        setClientsById(byId);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadEntries = useCallback(async (consultant, month) => {
    const relevant = timesheets.filter(
      (ts) => ts.consultant === consultant.consultantId && ts.status === "APPROVED" && timesheetInMonth(ts, month)
    );
    if (relevant.length === 0) {
      setEntriesMap({});
      setAssignmentsMap({});
      return;
    }
    setLoadingEntries(true);
    try {
      const results = await Promise.all(
        relevant.map((ts) =>
          Promise.all([
            axios.get(`${API_BASE}/timesheets/${ts.timesheetID}/entries/`),
            axios.get(`${API_BASE}/timesheets/${ts.timesheetID}/assignments/`),
          ]).then(([eRes, aRes]) => ({ id: ts.timesheetID, entries: eRes.data, assignments: aRes.data }))
        )
      );
      const eMap = {};
      const aMap = {};
      results.forEach(({ id, entries, assignments }) => {
        eMap[id] = entries;
        const byClient = {};
        let defaultRate = 0;
        if (assignments.length === 1) {
          defaultRate = parseFloat(assignments[0].daily_rate) || 0;
        } else if (assignments.length > 1) {
          assignments.forEach((a) => {
            if (a.client && parseFloat(a.daily_rate) > 0) byClient[a.client] = parseFloat(a.daily_rate);
          });
          defaultRate = Math.max(...assignments.map((a) => parseFloat(a.daily_rate) || 0), 0);
        }
        aMap[id] = { byClient, default: defaultRate };
      });
      setEntriesMap(eMap);
      setAssignmentsMap(aMap);
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  }, [timesheets]);

  const loadHistory = useCallback(async (consultant) => {
    setLoadingHistory(true);
    try {
      const [psRes, tsRes] = await Promise.all([
        axios.get(`${API_BASE}/payslips/consultant/${consultant.consultantId}/`),
        axios.get(`${API_BASE}/timesheets/consultant/${consultant.consultantId}/`),
      ]);
      const paid = tsRes.data.filter((ts) => ts.status === "PAID");
      setPaidTimesheets(paid);
      setPayHistory(psRes.data);
      if (paid.length === 0) {
        setHistoryEntriesMap({});
        setHistoryAssignmentsMap({});
        return;
      }
      const entryResults = await Promise.all(
        paid.map((ts) =>
          Promise.all([
            axios.get(`${API_BASE}/timesheets/${ts.timesheetID}/entries/`),
            axios.get(`${API_BASE}/timesheets/${ts.timesheetID}/assignments/`),
          ]).then(([eRes, aRes]) => ({ id: ts.timesheetID, entries: eRes.data, assignments: aRes.data }))
        )
      );
      const eMap = {};
      const aMap = {};
      entryResults.forEach(({ id, entries, assignments }) => {
        eMap[id] = entries;
        const byClient = {};
        let dRate = 0;
        if (assignments.length === 1) dRate = parseFloat(assignments[0].daily_rate) || 0;
        else if (assignments.length > 1) {
          assignments.forEach(a => { if (a.client) byClient[a.client] = parseFloat(a.daily_rate); });
          dRate = Math.max(...assignments.map(a => parseFloat(a.daily_rate) || 0), 0);
        }
        aMap[id] = { byClient, default: dRate };
      });
      setHistoryEntriesMap(eMap);
      setHistoryAssignmentsMap(aMap);
    } catch (err) { console.error(err); } finally { setLoadingHistory(false); }
  }, []);

  const handleSelectConsultant = (cId) => {
    const c = consultants.find((c) => c.consultantId === parseInt(cId));
    setSelectedConsultant(c || null);
    setEntriesMap({});
    setAssignmentsMap({});
    setPayslipDone(false);
    if (c) { loadEntries(c, selectedMonth); loadHistory(c); }
  };

  const handleMonthChange = (m) => {
    setSelectedMonth(m);
    setEntriesMap({});
    setAssignmentsMap({});
    setPayslipDone(false);
    if (selectedConsultant) loadEntries(selectedConsultant, m);
  };

  const filteredTimesheets = selectedConsultant
    ? timesheets.filter(ts => ts.consultant === selectedConsultant.consultantId && ts.status === "APPROVED" && timesheetInMonth(ts, selectedMonth))
    : [];

  const calcRow = (ts) => {
    const entries = entriesMap[ts.timesheetID] || [];
    const aRates = assignmentsMap[ts.timesheetID] || {};
    const fallback = parseFloat(selectedConsultant?.daily_rate || 0);
    return entries.reduce((acc, entry) => {
      const c = calcEntryPay(entry, clientsById, aRates, fallback);
      return { stdHrs: acc.stdHrs + c.std, otHrs: acc.otHrs + c.ot, pay: acc.pay + c.totalPay, hasMissingRate: acc.hasMissingRate || c.hasMissingRate };
    }, { stdHrs: 0, otHrs: 0, pay: 0, hasMissingRate: false });
  };

  const totals = filteredTimesheets.reduce((acc, ts) => {
    const r = calcRow(ts);
    return { stdHrs: acc.stdHrs + r.stdHrs, otHrs: acc.otHrs + r.otHrs, pay: acc.pay + r.pay, hasMissingRate: acc.hasMissingRate || r.hasMissingRate };
  }, { stdHrs: 0, otHrs: 0, pay: 0, hasMissingRate: false });

  const missingRateTimesheets = filteredTimesheets.filter(ts => {
    const aInfo = assignmentsMap[ts.timesheetID];
    if (aInfo && (aInfo.default > 0 || Object.keys(aInfo.byClient).length > 0)) return false;
    const entries = entriesMap[ts.timesheetID] || [];
    const hasClientRate = entries.some(e => e.client && clientsById[e.client] && parseFloat(clientsById[e.client].daily_rate) > 0);
    return !hasClientRate && parseFloat(selectedConsultant?.daily_rate || 0) === 0;
  });
  const missingRateClients = missingRateTimesheets.map(ts => `Week ${formatDate(ts.weekCommencing)}`);

  const hasTimesheets = filteredTimesheets.length > 0;
  const canGenerate = hasTimesheets && !loadingEntries && !payslipDone && missingRateClients.length === 0;

  const calcHistoryRow = (ts) => {
    const entries = historyEntriesMap[ts.timesheetID] || [];
    const aRates = historyAssignmentsMap[ts.timesheetID] || {};
    const fb = parseFloat(selectedConsultant?.daily_rate || 0);
    return entries.reduce((acc, entry) => {
      const c = calcEntryPay(entry, clientsById, aRates, fb);
      return { stdHrs: acc.stdHrs + c.std, otHrs: acc.otHrs + c.ot, pay: acc.pay + c.totalPay };
    }, { stdHrs: 0, otHrs: 0, pay: 0 });
  };

  const totalApprovedAwaiting = timesheets.filter(ts => ts.status === "APPROVED").length;
  const totalPaidThisMonth = timesheets.filter(ts => ts.status === "PAID" && timesheetInMonth(ts, selectedMonth)).length;

  const handleGeneratePayslip = async () => {
    setGenerating(true);
    try {
      await Promise.all(filteredTimesheets.map(ts => axios.post(`${API_BASE}/payslips/calculate/`, { consultant_id: selectedConsultant.consultantId, timesheet_id: ts.timesheetID })));
      await Promise.all(filteredTimesheets.map(ts => axios.put(`${API_BASE}/timesheets/${ts.timesheetID}/mark-paid/`)));
      const tRes = await axios.get(`${API_BASE}/timesheets/`);
      setTimesheets(tRes.data);
      setPayslipDone(true);
      if (selectedConsultant) loadHistory(selectedConsultant);
    } catch (err) { console.error(err); } finally { setGenerating(false); }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(0, 120, 154); doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text("TimeDime", 14, 12);
    doc.setFontSize(10); doc.text("Payslip", 14, 21);
    doc.setTextColor(40, 40, 40); doc.setFontSize(13); doc.text(selectedConsultant.name, 14, 38);
    let currentY = 66;
    filteredTimesheets.forEach((ts) => {
      const entries = entriesMap[ts.timesheetID] || [];
      const aRates = assignmentsMap[ts.timesheetID] || {};
      const breakdown = buildClientBreakdown(entries, clientsById, aRates, selectedConsultant.daily_rate);
      autoTable(doc, {
        startY: currentY,
        head: [["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Total Pay"]],
        body: breakdown.map(b => [b.label, formatMoney(b.rate), b.std + "h", b.ot + "h", formatMoney(b.totalPay)]),
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`payslip_${selectedConsultant.name}.pdf`);
  };

  const handleDownloadHistoryPDF = (ts) => {
    const doc = new jsPDF();
    const row = calcHistoryRow(ts);
    doc.text(`Payslip: ${selectedConsultant.name}`, 14, 20);
    doc.text(`Week: ${formatDate(ts.weekCommencing)}`, 14, 30);
    doc.text(`Total Pay: ${formatMoney(row.pay)}`, 14, 40);
    doc.save(`history_${ts.timesheetID}.pdf`);
  };

  const userName = user?.name || "Finance";
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: "#f0f4f4", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-card-view { display: block !important; }
          .stat-card { width: 100% !important; justify-content: center; }
          .filter-container { flex-direction: column !important; align-items: stretch !important; }
          .filter-item { width: 100% !important; }
          .action-bar { flex-direction: column !important; align-items: stretch !important; }
          .action-bar button { width: 100%; justify-content: center; }
        }
        .mobile-card-view { display: none; }
        .timesheet-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 15px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
      `}</style>

      {/* Header */}
      <div className="text-white px-5 pt-4 pb-4" style={{ background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)", position: "relative", padding: isMobile ? '1rem 1.5rem' : undefined }}>
        <div 
          className="position-absolute d-flex align-items-center gap-2" 
          style={{ 
            top: isMobile ? "0.8rem" : "20px", 
            right: isMobile ? "1rem" : "30px" 
          }}
        >
          {/* Bell is now visible on both mobile and desktop */}
          <NotificationBell userId={user?.userID} />
          
          <div className="d-flex align-items-center gap-2 ms-1">
            {!isMobile && (
              <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>{userName}</span>
            )}
            <div 
              onClick={onProfileClick} 
              style={{ 
                width: isMobile ? "34px" : "42px", 
                height: isMobile ? "34px" : "42px", 
                borderRadius: "50%", 
                backgroundColor: "rgba(255,255,255,0.25)", 
                border: "2px solid rgba(255,255,255,0.6)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontWeight: "700", 
                cursor: "pointer",
                fontSize: isMobile ? "0.8rem" : "1rem"
              }}
            >
              {initials}
            </div>
          </div>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: isMobile ? "1.5rem" : "2.2rem", marginTop: "10px" }}>Welcome, {userName}</h1>
      </div>

      {/* Stats row */}
      <div className="mx-4 d-flex gap-3 align-items-center" style={{ marginTop: "20px", marginBottom: "12px", flexDirection: isMobile ? 'column' : 'row' }}>
        <div className="stat-card d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#00789A" }}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          <span><strong>{totalApprovedAwaiting}</strong> approved & awaiting payment</span>
        </div>
        <div className="stat-card d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#2DB5AA" }}>
          <FontAwesomeIcon icon={faUsers} />
          <span><strong>{consultants.length}</strong> consultants</span>
        </div>
        <div className="stat-card d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#198754" }}>
          <FontAwesomeIcon icon={faCheckCircle} />
          <span><strong>{totalPaidThisMonth}</strong> paid</span>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-4 bg-white rounded-4 shadow-sm p-4 mb-3" style={{ margin: isMobile ? '1rem' : undefined }}>
        <div className="filter-container d-flex gap-3 mb-4 align-items-end">
          <div className="filter-item">
            <label className="form-label small fw-semibold text-secondary mb-1">Consultant</label>
            <select className="form-select" style={{ minWidth: "220px", backgroundColor: "#3a3a3a", color: "#fff", border: "none" }} value={selectedConsultant?.consultantId || ""} onChange={(e) => handleSelectConsultant(e.target.value)}>
              <option value="">Select consultant…</option>
              {consultants.map(c => <option key={c.consultantId} value={c.consultantId}>{c.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label small fw-semibold text-secondary mb-1">Month</label>
            <input type="month" className="form-control" style={{ backgroundColor: "#3a3a3a", color: "#fff", border: "none" }} value={selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} />
          </div>
        </div>

        {/* Missing rate warning */}
        {missingRateClients.length > 0 && (
          <div className="d-flex align-items-start gap-2 p-3 mb-3 rounded-3" style={{ background: "#fff8e1", border: "1px solid #ffe082", fontSize: "0.85rem" }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "#f59e0b", marginTop: "2px" }} />
            <div><strong>Missing daily rates</strong> — timesheets for: <strong>{missingRateClients.join(", ")}</strong> have no rate.</div>
          </div>
        )}

        {/* Content Area */}
        {pageLoading || loadingEntries ? (
          <div className="d-flex justify-content-center py-5"><Loader /></div>
        ) : !selectedConsultant ? (
          <div className="text-center text-secondary py-5"><FontAwesomeIcon icon={faUsers} style={{ fontSize: "2rem", opacity: 0.3 }} /><p className="mt-3">Select a consultant to begin.</p></div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className="table table-hover align-middle mb-0 desktop-table">
              <thead className="text-secondary small">
                <tr><th>ID</th><th>Week Commencing</th><th>Week Ending</th><th>Std Hours</th><th>OT Hours</th><th>Clients</th><th>Total Pay</th></tr>
              </thead>
              <tbody>
                {filteredTimesheets.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4">No approved timesheets for {getMonthLabel(selectedMonth)}.</td></tr>
                ) : (
                  filteredTimesheets.map(ts => {
                    const r = calcRow(ts);
                    const clientNames = [...new Set((entriesMap[ts.timesheetID] || []).filter(e => e.client && clientsById[e.client]).map(e => clientsById[e.client].name))];
                    return (
                      <tr key={ts.timesheetID}>
                        <td className="text-muted small">#{ts.timesheetID}</td>
                        <td>{formatDate(ts.weekCommencing)}</td>
                        <td>{formatDate(ts.weekEnding)}</td>
                        <td>{r.stdHrs.toFixed(1)}h</td>
                        <td>{r.otHrs.toFixed(1)}h</td>
                        <td>{clientNames.map(n => <span key={n} className="badge rounded-pill me-1" style={{ background: "#e8f4f8", color: "#00789A" }}>{n}</span>)}</td>
                        <td style={{ fontWeight: 600, color: r.hasMissingRate ? "#f59e0b" : "#00789A" }}>{formatMoney(r.pay)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredTimesheets.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#f0f4f4", borderTop: "2px solid #dee2e6" }}>
                    <td colSpan={3} className="fw-bold p-3">Totals</td>
                    <td className="fw-bold">{totals.stdHrs.toFixed(1)}h</td>
                    <td className="fw-bold">{totals.otHrs.toFixed(1)}h</td>
                    <td></td>
                    <td className="fw-bold text-info fs-6">{formatMoney(totals.pay)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {filteredTimesheets.map(ts => {
                const r = calcRow(ts);
                return (
                  <div key={ts.timesheetID} className="timesheet-card">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">#{ts.timesheetID}</span>
                      <span className="fw-bold text-info">{formatMoney(r.pay)}</span>
                    </div>
                    <div className="small mb-1"><strong>Week:</strong> {formatDate(ts.weekCommencing)}</div>
                    <div className="small"><strong>Hours:</strong> {r.stdHrs}h Std / {r.otHrs}h OT</div>
                  </div>
                );
              })}
              {hasTimesheets && (
                <div className="p-3 rounded-3 mt-2" style={{ background: "#00789A", color: "#fff" }}>
                  <div className="d-flex justify-content-between fw-bold"><span>Total Month Pay</span><span>{formatMoney(totals.pay)}</span></div>
                </div>
              )}
            </div>

            {hasTimesheets && (
              <div className="action-bar d-flex align-items-center gap-3 mt-4 pt-3" style={{ borderTop: "1px solid #eee" }}>
                {payslipDone ? (
                  <>
                    <span className="badge rounded-pill px-3 py-2 bg-success-subtle text-success"><FontAwesomeIcon icon={faCheckCircle} className="me-2" />Processed</span>
                    <button className="btn btn-sm btn-info text-white" onClick={() => setShowPayslip(true)}><FontAwesomeIcon icon={faDownload} /> View PDF</button>
                  </>
                ) : (
                  <button className="btn d-flex align-items-center gap-2" style={{ background: canGenerate ? "#00789A" : "#ccc", color: "#fff" }} disabled={!canGenerate || generating} onClick={() => setShowPayslip(true)}>
                    {generating ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faFileInvoiceDollar} />} Generate Payslip
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pay History */}
      {selectedConsultant && (
        <div className="mx-4 bg-white rounded-4 shadow-sm p-4 mb-4">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><FontAwesomeIcon icon={faClockRotateLeft} style={{ color: "#00789A" }} /> Pay History</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="text-secondary small"><tr><th>Week</th><th>Std/OT</th><th>Total Pay</th><th>Date Paid</th><th></th></tr></thead>
              <tbody>
                {paidTimesheets.sort((a,b) => new Date(b.weekCommencing) - new Date(a.weekCommencing)).map(ts => {
                  const r = calcHistoryRow(ts);
                  const ps = payHistory.find(p => p.timesheet === ts.timesheetID);
                  return (
                    <tr key={ts.timesheetID}>
                      <td>{formatDate(ts.weekCommencing)}</td>
                      <td className="small">{r.stdHrs}h / {r.otHrs}h</td>
                      <td className="fw-bold text-info">{formatMoney(r.pay)}</td>
                      <td className="small">{ps ? formatDate(ps.generatedDate) : "—"}</td>
                      <td><button className="btn btn-sm btn-light text-info" onClick={() => handleDownloadHistoryPDF(ts)}><FontAwesomeIcon icon={faDownload} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <Modal show={showPayslip} onHide={() => setShowPayslip(false)} size="xl" centered fullscreen={isMobile}>
        <Modal.Header closeButton style={{ background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)", color: "#fff" }}>
          <Modal.Title className="fs-6"><FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" /> Payslip — {selectedConsultant?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedConsultant && (
            <>
              <div className="d-flex gap-2 mb-4 flex-wrap">
                {[{ label: "Consultant", value: selectedConsultant.name }, { label: "Period", value: getMonthLabel(selectedMonth) }].map(m => (
                  <div key={m.label} className="p-2 bg-light rounded flex-grow-1">
                    <div className="text-muted small text-uppercase">{m.label}</div>
                    <div className="fw-bold small">{m.value}</div>
                  </div>
                ))}
              </div>
              {filteredTimesheets.map((ts, idx) => {
                const breakdown = buildClientBreakdown(entriesMap[ts.timesheetID] || [], clientsById, assignmentsMap[ts.timesheetID] || {}, selectedConsultant.daily_rate);
                return (
                  <div key={ts.timesheetID} className={idx > 0 ? "mt-4" : ""}>
                    <div className="fw-bold text-info small mb-1">Week {formatDate(ts.weekCommencing)}</div>
                    <div className="table-responsive border rounded">
                      <table className="table table-sm mb-0 small">
                        <thead className="table-light"><tr><th>Client</th><th>Rate</th><th>Total</th></tr></thead>
                        <tbody>{breakdown.map((b, i) => <tr key={i}><td>{b.label}</td><td>{formatMoney(b.rate)}</td><td className="fw-bold">{formatMoney(b.totalPay)}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              <div className="d-flex justify-content-between mt-4 p-3 bg-light rounded fw-bold text-info"><span>Grand Total</span><span>{formatMoney(totals.pay)}</span></div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowPayslip(false)}>Close</Button>
          <Button variant="info" className="text-white" onClick={handleDownloadPDF}><FontAwesomeIcon icon={faDownload} className="me-2" />PDF</Button>
          {!payslipDone && <Button variant="primary" disabled={generating} onClick={handleGeneratePayslip}>{generating ? <Spinner size="sm"/> : "Mark as Paid"}</Button>}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;