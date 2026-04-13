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

// ─────────────────────────────────────────────────────────────────────────────
// Per-entry pay calculation.
//
// Rate priority (highest wins):
//   1. assignmentRates[entry.client]  — from Assignment.daily_rate for this timesheet
//   2. clientsById[entry.client].daily_rate — Client-level fallback
//   3. fallbackRate (consultant daily_rate)  — last resort
// ─────────────────────────────────────────────────────────────────────────────
// assignmentRates shape: { byClient: { clientId: rate }, default: rate }
const calcEntryPay = (entry, clientsById, assignmentRates, fallbackRate) => {
  const std = parseFloat(entry.hoursWorked || 0);
  const ot = parseFloat(entry.overtime_hours || 0);
  const client = entry.client ? clientsById[entry.client] : null;

  const aByClient = assignmentRates?.byClient || {};
  const aDefault = assignmentRates?.default || 0;

  let rate = parseFloat(fallbackRate || 0);
  // Priority: entry-matched client rate → assignment default → client record rate → consultant fallback
  if (client && parseFloat(client.daily_rate) > 0) rate = parseFloat(client.daily_rate);
  if (aDefault > 0) rate = aDefault;
  if (entry.client && aByClient[entry.client] > 0) rate = aByClient[entry.client];

  const hourly = rate / STANDARD_DAY_HOURS;
  return {
    std,
    ot,
    rate,
    stdPay: hourly * std,
    otPay: hourly * 1.5 * ot,
    totalPay: hourly * std + hourly * 1.5 * ot,
    clientName: client?.name || null,
    hasMissingRate: rate === 0,
  };
};

// Build per-client summary for payslip breakdown
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

// ─────────────────────────────────────────────────────────────────────────────
// Finance Dashboard
// ─────────────────────────────────────────────────────────────────────────────
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

  // Payslip modal
  const [showPayslip, setShowPayslip] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payslipDone, setPayslipDone] = useState(false);

  // Pay history
  const [payHistory, setPayHistory] = useState([]);           // payslip records (for generatedDate)
  const [paidTimesheets, setPaidTimesheets] = useState([]);   // PAID timesheets for selected consultant
  const [historyEntriesMap, setHistoryEntriesMap] = useState({});
  const [historyAssignmentsMap, setHistoryAssignmentsMap] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load consultants, timesheets, and client lookup on mount
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

  // Load entries + assignments for the selected consultant's approved timesheets in the chosen month.
  // Assignments give us the per-client daily_rate for each timesheet.
  const loadEntries = useCallback(
    async (consultant, month) => {
      const relevant = timesheets.filter(
        (ts) =>
          ts.consultant === consultant.consultantId &&
          ts.status === "APPROVED" &&
          timesheetInMonth(ts, month)
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
        // assignmentsMap[timesheetID] = { byClient: { clientId: rate }, default: rate }
        // If single assignment → default rate applies to all entries (entries have no client FK).
        // If multiple assignments → match by client FK where possible, else use default.
        const aMap = {};
        results.forEach(({ id, entries, assignments }) => {
          eMap[id] = entries;
          const byClient = {};
          let defaultRate = 0;
          if (assignments.length === 1) {
            defaultRate = parseFloat(assignments[0].daily_rate) || 0;
          } else if (assignments.length > 1) {
            assignments.forEach((a) => {
              if (a.client && parseFloat(a.daily_rate) > 0) {
                byClient[a.client] = parseFloat(a.daily_rate);
              }
            });
            defaultRate = Math.max(...assignments.map((a) => parseFloat(a.daily_rate) || 0), 0);
          }
          aMap[id] = { byClient, default: defaultRate };
        });
        setEntriesMap(eMap);
        setAssignmentsMap(aMap);
      } catch (err) {
        console.error("Failed to load entries/assignments:", err);
      } finally {
        setLoadingEntries(false);
      }
    },
    [timesheets]
  );

  // Fetch pay history for a consultant: payslips + entries/assignments for each PAID timesheet.
  // Self-contained — fetches its own data so it doesn't depend on stale timesheets closure.
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
      setHistoryEntriesMap(eMap);
      setHistoryAssignmentsMap(aMap);
    } catch (err) {
      console.error("Failed to load pay history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleSelectConsultant = (cId) => {
    const c = consultants.find((c) => c.consultantId === parseInt(cId));
    setSelectedConsultant(c || null);
    setEntriesMap({});
    setAssignmentsMap({});
    setPayslipDone(false);
    setPayHistory([]);
    setPaidTimesheets([]);
    setHistoryEntriesMap({});
    setHistoryAssignmentsMap({});
    if (c) {
      loadEntries(c, selectedMonth);
      loadHistory(c);
    }
  };

  const handleMonthChange = (m) => {
    setSelectedMonth(m);
    setEntriesMap({});
    setAssignmentsMap({});
    setPayslipDone(false);
    if (selectedConsultant) loadEntries(selectedConsultant, m);
    // History is not month-filtered, no reload needed
  };

  // Derived: filtered timesheets for selected consultant + month
  const filteredTimesheets = selectedConsultant
    ? timesheets.filter(
        (ts) =>
          ts.consultant === selectedConsultant.consultantId &&
          ts.status === "APPROVED" &&
          timesheetInMonth(ts, selectedMonth)
      )
    : [];

  // Per-timesheet aggregated pay — uses assignment rates first, then client rates, then fallback
  const calcRow = (ts) => {
    const entries = entriesMap[ts.timesheetID] || [];
    const aRates = assignmentsMap[ts.timesheetID] || {};
    const fallback = parseFloat(selectedConsultant?.daily_rate || 0);
    return entries.reduce(
      (acc, entry) => {
        const c = calcEntryPay(entry, clientsById, aRates, fallback);
        return {
          stdHrs: acc.stdHrs + c.std,
          otHrs: acc.otHrs + c.ot,
          pay: acc.pay + c.totalPay,
          hasMissingRate: acc.hasMissingRate || c.hasMissingRate,
        };
      },
      { stdHrs: 0, otHrs: 0, pay: 0, hasMissingRate: false }
    );
  };

  const totals = filteredTimesheets.reduce(
    (acc, ts) => {
      const r = calcRow(ts);
      return {
        stdHrs: acc.stdHrs + r.stdHrs,
        otHrs: acc.otHrs + r.otHrs,
        pay: acc.pay + r.pay,
        hasMissingRate: acc.hasMissingRate || r.hasMissingRate,
      };
    },
    { stdHrs: 0, otHrs: 0, pay: 0, hasMissingRate: false }
  );

  // A timesheet has a missing rate only if it has no assignment rate, no client rate on entries,
  // and no consultant fallback rate.
  const consultantFallback = parseFloat(selectedConsultant?.daily_rate || 0);
  const missingRateTimesheets = filteredTimesheets.filter((ts) => {
    const aInfo = assignmentsMap[ts.timesheetID];
    const hasAssignmentRate = aInfo && (aInfo.default > 0 || Object.keys(aInfo.byClient).length > 0);
    if (hasAssignmentRate) return false;
    const entries = entriesMap[ts.timesheetID] || [];
    const hasClientRate = entries.some((e) => e.client && clientsById[e.client] && parseFloat(clientsById[e.client].daily_rate) > 0);
    return !hasClientRate && consultantFallback === 0;
  });
  const missingRateClients = missingRateTimesheets.map(
    (ts) => `Week ${formatDate(ts.weekCommencing)}`
  );

  const hasTimesheets = filteredTimesheets.length > 0;
  const canGenerate = hasTimesheets && !loadingEntries && !payslipDone && missingRateClients.length === 0;

  // Per-row pay calc for history (uses historyEntriesMap / historyAssignmentsMap)
  const calcHistoryRow = (ts) => {
    const entries = historyEntriesMap[ts.timesheetID] || [];
    const aRates = historyAssignmentsMap[ts.timesheetID] || {};
    const fallback = parseFloat(selectedConsultant?.daily_rate || 0);
    return entries.reduce(
      (acc, entry) => {
        const c = calcEntryPay(entry, clientsById, aRates, fallback);
        return { stdHrs: acc.stdHrs + c.std, otHrs: acc.otHrs + c.ot, pay: acc.pay + c.totalPay };
      },
      { stdHrs: 0, otHrs: 0, pay: 0 }
    );
  };

  // Stats
  const totalApprovedAwaiting = timesheets.filter((ts) => ts.status === "APPROVED").length;
  const totalPaidThisMonth = timesheets.filter(
    (ts) => ts.status === "PAID" && timesheetInMonth(ts, selectedMonth)
  ).length;

  // Generate payslip: create PaySlip records → mark PAID
  const handleGeneratePayslip = async () => {
    setGenerating(true);
    try {
      await Promise.all(
        filteredTimesheets.map((ts) =>
          axios.post(`${API_BASE}/payslips/calculate/`, {
            consultant_id: selectedConsultant.consultantId,
            timesheet_id: ts.timesheetID,
          })
        )
      );
      await Promise.all(
        filteredTimesheets.map((ts) =>
          axios.put(`${API_BASE}/timesheets/${ts.timesheetID}/mark-paid/`)
        )
      );
      const tRes = await axios.get(`${API_BASE}/timesheets/`);
      setTimesheets(tRes.data);
      setPayslipDone(true);
      // Refresh pay history to include the newly paid timesheets
      if (selectedConsultant) loadHistory(selectedConsultant);
    } catch (err) {
      console.error("Failed to generate payslip:", err);
    } finally {
      setGenerating(false);
    }
  };

  // PDF generation
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(0, 120, 154);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TimeDime", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Payslip", 14, 21);

    // Consultant info
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(selectedConsultant.name, 14, 38);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${getMonthLabel(selectedMonth)}`, 14, 45);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 51);

    // Formula note
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Standard pay = (Daily Rate ÷ 8) × Std Hours  |  OT pay = (Daily Rate ÷ 8 × 1.5) × OT Hours", 14, 57);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 61, pageW - 14, 61);

    // Build table rows grouped by timesheet → client breakdown
    let currentY = 66;
    const consultantFallback = parseFloat(selectedConsultant?.daily_rate || 0);

    filteredTimesheets.forEach((ts, tsIdx) => {
      const entries = entriesMap[ts.timesheetID] || [];
      const aRates = assignmentsMap[ts.timesheetID] || {};
      const breakdown = buildClientBreakdown(entries, clientsById, aRates, consultantFallback);
      const tsLabel = `Week: ${formatDate(ts.weekCommencing)} – ${formatDate(ts.weekEnding)}`;

      // Timesheet header row
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 120, 154);
      if (currentY > 260) { doc.addPage(); currentY = 20; }
      doc.text(tsLabel, 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Std Pay", "OT Pay", "Total Pay"]],
        body: breakdown.map((b) => [
          b.label,
          formatMoney(b.rate),
          b.std.toFixed(1) + "h",
          b.ot.toFixed(1) + "h",
          formatMoney(b.stdPay),
          formatMoney(b.otPay),
          formatMoney(b.totalPay),
        ]),
        headStyles: {
          fillColor: [0, 120, 154], textColor: [255, 255, 255],
          fontSize: 7.5, fontStyle: "bold",
        },
        bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [248, 255, 254] },
        margin: { left: 14, right: 14 },
      });
      currentY = doc.lastAutoTable.finalY + (tsIdx < filteredTimesheets.length - 1 ? 8 : 4);
    });

    // Grand totals
    autoTable(doc, {
      startY: currentY,
      body: [[
        { content: "TOTAL", styles: { fontStyle: "bold" } },
        "",
        { content: totals.stdHrs.toFixed(1) + "h", styles: { fontStyle: "bold" } },
        { content: totals.otHrs.toFixed(1) + "h", styles: { fontStyle: "bold" } },
        "", "",
        { content: formatMoney(totals.pay), styles: { fontStyle: "bold", textColor: [0, 120, 154] } },
      ]],
      columnStyles: { 0: { cellWidth: 40 } },
      bodyStyles: { fontSize: 8, fillColor: [240, 244, 244] },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text("This payslip was generated by TimeDime. Please retain for your records.", 14, finalY);

    doc.save(`payslip_${selectedConsultant.name.replace(/\s+/g, "_")}_${selectedMonth}.pdf`);
  };

  // PDF download for a single historical (already-paid) timesheet
  const handleDownloadHistoryPDF = (ts) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const fallback = parseFloat(selectedConsultant?.daily_rate || 0);
    const entries = historyEntriesMap[ts.timesheetID] || [];
    const aRates = historyAssignmentsMap[ts.timesheetID] || {};
    const breakdown = buildClientBreakdown(entries, clientsById, aRates, fallback);
    const rowTotals = calcHistoryRow(ts);
    const weekLabel = `${formatDate(ts.weekCommencing)} – ${formatDate(ts.weekEnding)}`;
    const ps = payHistory.find((p) => p.timesheet === ts.timesheetID);

    // Header
    doc.setFillColor(0, 120, 154);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TimeDime", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Payslip", 14, 21);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(selectedConsultant.name, 14, 38);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Week: ${weekLabel}`, 14, 45);
    doc.text(`Generated: ${ps ? formatDate(ps.generatedDate) : new Date().toLocaleDateString("en-GB")}`, 14, 51);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Standard pay = (Daily Rate ÷ 8) × Std Hours  |  OT pay = (Daily Rate ÷ 8 × 1.5) × OT Hours", 14, 57);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 61, pageW - 14, 61);

    autoTable(doc, {
      startY: 66,
      head: [["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Std Pay", "OT Pay", "Total Pay"]],
      body: breakdown.map((b) => [
        b.label,
        formatMoney(b.rate),
        b.std.toFixed(1) + "h",
        b.ot.toFixed(1) + "h",
        formatMoney(b.stdPay),
        formatMoney(b.otPay),
        formatMoney(b.totalPay),
      ]),
      headStyles: { fillColor: [0, 120, 154], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 255, 254] },
      margin: { left: 14, right: 14 },
    });

    const afterTable = doc.lastAutoTable.finalY + 4;
    autoTable(doc, {
      startY: afterTable,
      body: [[
        { content: "TOTAL", styles: { fontStyle: "bold" } },
        "",
        { content: rowTotals.stdHrs.toFixed(1) + "h", styles: { fontStyle: "bold" } },
        { content: rowTotals.otHrs.toFixed(1) + "h", styles: { fontStyle: "bold" } },
        "", "",
        { content: formatMoney(rowTotals.pay), styles: { fontStyle: "bold", textColor: [0, 120, 154] } },
      ]],
      columnStyles: { 0: { cellWidth: 40 } },
      bodyStyles: { fontSize: 8, fillColor: [240, 244, 244] },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text("This payslip was generated by TimeDime. Please retain for your records.", 14, finalY);

    const weekStr = ts.weekCommencing ? ts.weekCommencing.replace(/-/g, "") : "week";
    doc.save(`payslip_${selectedConsultant.name.replace(/\s+/g, "_")}_w${weekStr}.pdf`);
  };

  const userName = user?.name || "Finance";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: "#f0f4f4", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="text-white px-5 pt-4 pb-4"
        style={{ background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)", position: "relative" }}
      >
        <div className="position-absolute d-flex align-items-center gap-2" style={{ top: "20px", right: "30px" }}>
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>{userName}</span>
          <div onClick={onProfileClick} style={{
            width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "1rem", cursor: "pointer",
          }}>
            {initials}
          </div>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: "2.2rem", marginTop: "10px" }}>
          Welcome, {userName}
        </h1>
      </div>

      {/* Stats row */}
      <div className="mx-4 d-flex gap-3 align-items-center" style={{ marginTop: "20px", marginBottom: "12px" }}>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#00789A" }}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          <span><strong>{totalApprovedAwaiting}</strong> approved and awaiting payment</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#2DB5AA" }}>
          <FontAwesomeIcon icon={faUsers} />
          <span><strong>{consultants.length}</strong> consultants</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white shadow-sm" style={{ fontSize: "0.875rem", color: "#198754" }}>
          <FontAwesomeIcon icon={faCheckCircle} />
          <span><strong>{totalPaidThisMonth}</strong> paid this month</span>
        </div>
      </div>

      {/* Main card */}
      <div className="mx-4 bg-white rounded-4 shadow-sm p-4 mb-3">

        {/* Filters */}
        <div className="d-flex gap-3 mb-4 align-items-end flex-wrap">
          <div>
            <label className="form-label small fw-semibold text-secondary mb-1">Consultant</label>
            <select
              className="form-select"
              style={{ minWidth: "220px", backgroundColor: "#3a3a3a", color: "#fff", border: "none", borderRadius: "6px" }}
              value={selectedConsultant?.consultantId || ""}
              onChange={(e) => handleSelectConsultant(e.target.value)}
              disabled={pageLoading}
            >
              <option value="">Select consultant…</option>
              {consultants.map((c) => (
                <option key={c.consultantId} value={c.consultantId}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label small fw-semibold text-secondary mb-1">Month</label>
            <input
              type="month"
              className="form-control"
              style={{ backgroundColor: "#3a3a3a", color: "#fff", border: "none", borderRadius: "6px", minWidth: "160px" }}
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
            />
          </div>
        </div>

        {/* Missing rate warning */}
        {missingRateClients.length > 0 && (
          <div
            className="d-flex align-items-start gap-2 p-3 mb-3 rounded-3"
            style={{ background: "#fff8e1", border: "1px solid #ffe082", fontSize: "0.85rem" }}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: "#f59e0b", marginTop: "2px" }} />
            <div>
              <strong>Missing daily rates</strong> — the following timesheets have no rate set in the assignments table:
              <strong> {missingRateClients.join(", ")}</strong>.
              Please ensure assignment records exist for these timesheets.
            </div>
          </div>
        )}

        {/* Table */}
        {pageLoading ? (
          <div className="d-flex justify-content-center py-5"><Loader /></div>
        ) : !selectedConsultant ? (
          <div className="text-center text-secondary py-5">
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: "2rem", opacity: 0.3 }} />
            <p className="mt-3 mb-0">Select a consultant to view their timesheets and calculate pay.</p>
          </div>
        ) : loadingEntries ? (
          <div className="d-flex justify-content-center py-5"><Loader /></div>
        ) : (
          <>
            <table className="table table-hover align-middle mb-0">
              <thead className="text-secondary" style={{ fontSize: "0.85rem" }}>
                <tr>
                  <th>ID</th>
                  <th>Week Commencing</th>
                  <th>Week Ending</th>
                  <th>Std Hours</th>
                  <th>OT Hours</th>
                  <th>Clients</th>
                  <th>Total Pay</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-4">
                      No approved timesheets for {getMonthLabel(selectedMonth)}.
                    </td>
                  </tr>
                ) : (
                  filteredTimesheets.map((ts) => {
                    const r = calcRow(ts);
                    const entries = entriesMap[ts.timesheetID] || [];
                    const clientNames = [...new Set(
                      entries
                        .filter((e) => e.client && clientsById[e.client])
                        .map((e) => clientsById[e.client].name)
                    )];
                    return (
                      <tr key={ts.timesheetID}>
                        <td style={{ color: "#888", fontSize: "0.85rem" }}>#{ts.timesheetID}</td>
                        <td>{formatDate(ts.weekCommencing)}</td>
                        <td>{formatDate(ts.weekEnding)}</td>
                        <td>{entriesMap[ts.timesheetID] ? `${r.stdHrs.toFixed(1)}h` : <span className="text-secondary">—</span>}</td>
                        <td>{entriesMap[ts.timesheetID] ? `${r.otHrs.toFixed(1)}h` : <span className="text-secondary">—</span>}</td>
                        <td style={{ fontSize: "0.8rem", color: "#555" }}>
                          {clientNames.length > 0
                            ? clientNames.map((n) => (
                                <span key={n}>
                                  <span
                                    className="badge rounded-pill me-1"
                                    style={{ background: "#e8f4f8", color: "#00789A", fontWeight: 500, fontSize: "0.72rem" }}
                                  >
                                    {n}
                                  </span>
                                </span>
                              ))
                            : <span className="text-secondary">—</span>
                          }
                        </td>
                        <td style={{ fontWeight: 600, color: r.hasMissingRate ? "#f59e0b" : "#00789A" }}>
                          {entriesMap[ts.timesheetID]
                            ? <>{formatMoney(r.pay)}{r.hasMissingRate && <FontAwesomeIcon icon={faExclamationTriangle} className="ms-1" style={{ fontSize: "0.75rem", color: "#f59e0b" }} />}</>
                            : "—"
                          }
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredTimesheets.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#f0f4f4", borderTop: "2px solid #dee2e6" }}>
                    <td colSpan={3} style={{ fontWeight: 700, padding: "12px 8px" }}>Totals</td>
                    <td style={{ fontWeight: 700 }}>{totals.stdHrs.toFixed(1)}h</td>
                    <td style={{ fontWeight: 700 }}>{totals.otHrs.toFixed(1)}h</td>
                    <td></td>
                    <td style={{ fontWeight: 700, color: "#00789A", fontSize: "1rem" }}>
                      {formatMoney(totals.pay)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            {hasTimesheets && (
              <div className="d-flex align-items-center gap-3 mt-4 pt-3" style={{ borderTop: "1px solid #eee" }}>
                {payslipDone ? (
                  <>
                    <span
                      className="badge rounded-pill px-3 py-2"
                      style={{ background: "#d1e7dd", color: "#0a3622", fontSize: "0.85rem" }}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                      Payslip generated — timesheets marked as Paid
                    </span>
                    <button
                      className="btn btn-sm d-flex align-items-center gap-2"
                      style={{ background: "#00789A", color: "#fff", borderRadius: "6px" }}
                      onClick={() => setShowPayslip(true)}
                    >
                      <FontAwesomeIcon icon={faDownload} /> Download PDF
                    </button>
                  </>
                ) : (
                  <>
                    {missingRateClients.length > 0 && (
                      <span className="text-warning small">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                        Set missing client rates before generating.
                      </span>
                    )}
                    <button
                      className="btn d-flex align-items-center gap-2"
                      style={{
                        background: canGenerate ? "#00789A" : "#ccc",
                        color: "#fff", borderRadius: "6px",
                        cursor: canGenerate ? "pointer" : "not-allowed",
                      }}
                      disabled={!canGenerate || generating}
                      onClick={() => setShowPayslip(true)}
                    >
                      {generating
                        ? <Spinner animation="border" size="sm" />
                        : <FontAwesomeIcon icon={faFileInvoiceDollar} />
                      }
                      Generate Payslip
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pay History */}
      {selectedConsultant && (
        <div className="mx-4 bg-white rounded-4 shadow-sm p-4 mb-4">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "#444" }}>
            <FontAwesomeIcon icon={faClockRotateLeft} style={{ color: "#00789A" }} />
            Pay History — {selectedConsultant.name}
          </h6>
          {loadingHistory ? (
            <div className="d-flex justify-content-center py-4"><Loader /></div>
          ) : paidTimesheets.length === 0 ? (
            <p className="text-secondary small mb-0">No paid timesheets on record for this consultant yet.</p>
          ) : (
            <table className="table table-hover align-middle mb-0">
              <thead className="text-secondary" style={{ fontSize: "0.85rem" }}>
                <tr>
                  <th>ID</th>
                  <th>Week Commencing</th>
                  <th>Week Ending</th>
                  <th>Std Hours</th>
                  <th>OT Hours</th>
                  <th>Total Pay</th>
                  <th>Date Paid</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paidTimesheets
                  .slice()
                  .sort((a, b) => new Date(b.weekCommencing) - new Date(a.weekCommencing))
                  .map((ts) => {
                    const r = calcHistoryRow(ts);
                    const ps = payHistory.find((p) => p.timesheet === ts.timesheetID);
                    return (
                      <tr key={ts.timesheetID}>
                        <td style={{ color: "#888", fontSize: "0.85rem" }}>#{ts.timesheetID}</td>
                        <td>{formatDate(ts.weekCommencing)}</td>
                        <td>{formatDate(ts.weekEnding)}</td>
                        <td>{historyEntriesMap[ts.timesheetID] ? `${r.stdHrs.toFixed(1)}h` : <span className="text-secondary">—</span>}</td>
                        <td>{historyEntriesMap[ts.timesheetID] ? `${r.otHrs.toFixed(1)}h` : <span className="text-secondary">—</span>}</td>
                        <td style={{ fontWeight: 600, color: "#00789A" }}>
                          {historyEntriesMap[ts.timesheetID] ? formatMoney(r.pay) : "—"}
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>
                          {ps ? formatDate(ps.generatedDate) : "—"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1"
                            style={{ background: "#f0f4f4", color: "#00789A", borderRadius: "6px", fontSize: "0.78rem" }}
                            disabled={!historyEntriesMap[ts.timesheetID]}
                            onClick={() => handleDownloadHistoryPDF(ts)}
                          >
                            <FontAwesomeIcon icon={faDownload} />
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0f4f4", borderTop: "2px solid #dee2e6" }}>
                  <td colSpan={5} style={{ fontWeight: 700, padding: "12px 8px" }}>
                    Total paid — {paidTimesheets.length} timesheet{paidTimesheets.length !== 1 ? "s" : ""}
                  </td>
                  <td style={{ fontWeight: 700, color: "#00789A", fontSize: "1rem" }}>
                    {formatMoney(paidTimesheets.reduce((sum, ts) => sum + calcHistoryRow(ts).pay, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Payslip Modal */}
      <Modal show={showPayslip} onHide={() => setShowPayslip(false)} size="xl" centered>
        <Modal.Header
          closeButton
          style={{ background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)", color: "#fff" }}
        >
          <Modal.Title style={{ fontSize: "1.1rem" }}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" />
            Payslip — {selectedConsultant?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "1.5rem" }}>
          {selectedConsultant && (
            <>
              {/* Meta */}
              <div className="d-flex gap-3 mb-4 flex-wrap">
                {[
                  { label: "Consultant", value: selectedConsultant.name },
                  { label: "Period", value: getMonthLabel(selectedMonth) },
                  { label: "Generated", value: new Date().toLocaleDateString("en-GB") },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#f8f9fa", borderRadius: "8px", padding: "10px 16px", minWidth: "130px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Per-timesheet breakdown with per-client rows */}
              {filteredTimesheets.map((ts, tsIdx) => {
                const entries = entriesMap[ts.timesheetID] || [];
                const aRates = assignmentsMap[ts.timesheetID] || {};
                const fallback = parseFloat(selectedConsultant?.daily_rate || 0);
                const breakdown = buildClientBreakdown(entries, clientsById, aRates, fallback);
                return (
                  <div key={ts.timesheetID} className={tsIdx > 0 ? "mt-4" : ""}>
                    <div
                      className="d-flex align-items-center gap-2 mb-2"
                      style={{ fontSize: "0.8rem", fontWeight: 600, color: "#00789A" }}
                    >
                      <span>Week {formatDate(ts.weekCommencing)} – {formatDate(ts.weekEnding)}</span>
                    </div>
                    <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #e9ecef" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)", color: "#fff" }}>
                            {["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Std Pay", "OT Pay", "Total Pay"].map((h) => (
                              <th key={h} style={{ padding: "9px 12px", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.map((b, rowIdx) => (
                            <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "#fff" : "#f8fffe", borderBottom: "1px solid #eef0f0" }}>
                              <td style={{ padding: "9px 12px", fontWeight: 500 }}>
                                {b.label}
                                {b.hasMissingRate && (
                                  <FontAwesomeIcon icon={faExclamationTriangle} className="ms-1" style={{ color: "#f59e0b", fontSize: "0.7rem" }} />
                                )}
                              </td>
                              <td style={{ padding: "9px 12px" }}>{formatMoney(b.rate)}</td>
                              <td style={{ padding: "9px 12px" }}>{b.std.toFixed(1)}h</td>
                              <td style={{ padding: "9px 12px" }}>{b.ot.toFixed(1)}h</td>
                              <td style={{ padding: "9px 12px" }}>{formatMoney(b.stdPay)}</td>
                              <td style={{ padding: "9px 12px" }}>{formatMoney(b.otPay)}</td>
                              <td style={{ padding: "9px 12px", fontWeight: 700, color: "#00789A" }}>{formatMoney(b.totalPay)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Grand total */}
              <div
                className="d-flex justify-content-between align-items-center mt-4 px-3 py-3 rounded-3"
                style={{ background: "#f0f4f4" }}
              >
                <span style={{ fontWeight: 600, color: "#555" }}>
                  Total — {totals.stdHrs.toFixed(1)}h standard + {totals.otHrs.toFixed(1)}h overtime
                </span>
                <span style={{ fontWeight: 700, fontSize: "1.25rem", color: "#00789A" }}>
                  {formatMoney(totals.pay)}
                </span>
              </div>

              <p className="text-muted small mt-3 mb-0">
                Standard pay = (Daily Rate ÷ 8) × Std Hours &nbsp;·&nbsp; OT pay = (Daily Rate ÷ 8 × 1.5) × OT Hours
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowPayslip(false)}>Close</Button>
          <Button
            style={{ background: "#2DB5AA", borderColor: "#2DB5AA" }}
            onClick={handleDownloadPDF}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Download PDF
          </Button>
          {!payslipDone && (
            <Button
              style={{ background: "#00789A", borderColor: "#00789A" }}
              disabled={generating || missingRateClients.length > 0}
              onClick={handleGeneratePayslip}
            >
              {generating
                ? <Spinner animation="border" size="sm" />
                : <><FontAwesomeIcon icon={faCheckCircle} className="me-2" />Mark as Paid</>
              }
            </Button>
          )}
          {payslipDone && (
            <span className="badge rounded-pill px-3 py-2" style={{ background: "#d1e7dd", color: "#0a3622" }}>
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />Paid
            </span>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;
