import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faUsers,
  faCheckCircle,
  faDownload,
  faTriangleExclamation,
  faHistory,
  faMoneyBillWave,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import NotificationBell from "./NotificationBell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// backend api url
const BASE_URL = "http://localhost:8000/api";
// standard working day is 8 hours, used for hourly rate calc
const HOURS_PER_DAY = 8;

// helper functions i use for formatting stuff

// format date like "14 Apr 2026"
function fmtDate(raw) {
  if (!raw) return "—";
  return new Date(raw + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// format money with pound sign and 2 decimals
function fmtGBP(amount) {
  return "£" + parseFloat(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// turn "2026-04" into "April 2026"
function monthLabel(str) {
  const [y, m] = str.split("-");
  return new Date(y, parseInt(m) - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

// gives todays month in "YYYY-MM" format so the month picker defaults to current month
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// checks if a timesheets week falls inside the selected month
function isInMonth(ts, monthStr) {
  if (!ts.weekCommencing) return false;
  const [y, m] = monthStr.split("-");
  const d = new Date(ts.weekCommencing + "T00:00:00");
  return d.getFullYear() === parseInt(y) && d.getMonth() + 1 === parseInt(m);
}

// main pay calculation logic
// takes one time entry and works out how much the consultant should be paid
// priority for the daily rate:
//   1. consultants own base rate (fallback)
//   2. clients default rate
//   3. assignments default rate
//   4. assignments client-specific rate (highest priority)
function computeEntryPay(entry, clientMap, rateInfo, consultantRate) {
  const stdHrs = parseFloat(entry.hoursWorked || 0);
  const otHrs = parseFloat(entry.overtime_hours || 0);
  const clientObj = entry.client ? clientMap[entry.client] : null;
  const byClient = rateInfo?.byClient || {};
  const defaultRate = rateInfo?.default || 0;

  // start from consultants base rate then override if something more specific exists
  let dailyRate = parseFloat(consultantRate || 0);
  if (clientObj && parseFloat(clientObj.daily_rate) > 0) dailyRate = parseFloat(clientObj.daily_rate);
  if (defaultRate > 0) dailyRate = defaultRate;
  if (entry.client && byClient[entry.client] > 0) dailyRate = byClient[entry.client];

  // hourly rate = daily / 8. OT is 1.5x
  const hourlyRate = dailyRate / HOURS_PER_DAY;
  const stdPay = hourlyRate * stdHrs;
  const otPay = hourlyRate * 1.5 * otHrs;

  return {
    stdHrs,
    otHrs,
    dailyRate,
    stdPay,
    otPay,
    total: stdPay + otPay,
    clientLabel: clientObj?.name || null,
    missingRate: dailyRate === 0, // flag so we can warn the user later
  };
}

// groups entries by client so the payslip shows one row per client
// each row has the totals for that client (std hrs, ot hrs, pay etc)
function buildBreakdown(entries, clientMap, rateInfo, consultantRate) {
  const groups = {};
  for (const entry of entries) {
    const pay = computeEntryPay(entry, clientMap, rateInfo, consultantRate);
    const key = entry.client ? `c_${entry.client}` : "none";
    const label = pay.clientLabel || "Unassigned";
    if (!groups[key]) {
      groups[key] = { label, dailyRate: pay.dailyRate, stdHrs: 0, otHrs: 0, stdPay: 0, otPay: 0, total: 0, missingRate: pay.missingRate };
    }
    // add everything up per client
    groups[key].stdHrs += pay.stdHrs;
    groups[key].otHrs += pay.otHrs;
    groups[key].stdPay += pay.stdPay;
    groups[key].otPay += pay.otPay;
    groups[key].total += pay.total;
  }
  return Object.values(groups);
}

// ─── Inline styles ───────────────────────────────────────────────────────────

const C = {
  dark: "#003d4f",
  mid: "#006680",
  bright: "#00c9b1",
  accent: "#00e5cc",
  bg: "#f2f7f8",
  cardBg: "#ffffff",
  border: "#e4edef",
  muted: "#7a9aa3",
  warning: "#ff7849",
  warningBg: "#fff4f0",
  success: "#00b894",
  successBg: "#e6faf6",
};

const styles = {
  page: {
    backgroundColor: C.bg,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)",
    padding: "0 2rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.01em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "10px",
    backgroundColor: C.bright,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "0.8rem",
    color: C.dark,
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    padding: "1.25rem 1.75rem 0",
  },
  statCard: (accent) => ({
    backgroundColor: C.cardBg,
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accent}`,
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  }),
  statIcon: (bg) => ({
    width: 42,
    height: 42,
    borderRadius: "10px",
    backgroundColor: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  statNum: {
    fontSize: "1.6rem",
    fontWeight: 800,
    color: C.dark,
    lineHeight: 1,
    marginBottom: "0.15rem",
  },
  statLabel: {
    fontSize: "0.72rem",
    color: C.muted,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  filterBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: "1rem",
    padding: "1.25rem 1.75rem",
    backgroundColor: C.cardBg,
    margin: "1.25rem 1.75rem 0",
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    flex: 1,
    minWidth: "180px",
  },
  filterLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  filterSelect: {
    padding: "0.55rem 0.85rem",
    borderRadius: "8px",
    border: `1.5px solid ${C.border}`,
    backgroundColor: C.bg,
    fontSize: "0.875rem",
    color: C.dark,
    outline: "none",
    fontWeight: 500,
  },
  consultantChip: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.55rem 1rem",
    backgroundColor: `${C.bright}18`,
    borderRadius: "8px",
    border: `1px solid ${C.bright}55`,
  },
  bodyWrap: {
    padding: "1.25rem 1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  card: {
    backgroundColor: C.cardBg,
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    overflow: "hidden",
  },
  cardHead: {
    padding: "0.85rem 1.25rem",
    backgroundColor: C.dark,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeadTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.875rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },
  th: {
    padding: "0.65rem 1.1rem",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.7rem",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: `2px solid ${C.border}`,
    whiteSpace: "nowrap",
    backgroundColor: "#f8fbfc",
  },
  td: {
    padding: "0.9rem 1.1rem",
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "middle",
    color: "#334",
  },
  tfootTd: {
    padding: "0.9rem 1.1rem",
    backgroundColor: `${C.bright}15`,
    fontWeight: 700,
    color: C.dark,
    borderTop: `2px solid ${C.bright}55`,
  },
  emptyState: {
    textAlign: "center",
    padding: "3.5rem 1rem",
    color: C.muted,
  },
  clientTag: {
    display: "inline-block",
    padding: "0.18rem 0.55rem",
    borderRadius: "5px",
    fontSize: "0.7rem",
    fontWeight: 600,
    backgroundColor: `${C.bright}22`,
    color: C.mid,
    marginRight: "0.25rem",
    marginBottom: "0.1rem",
  },
  warningBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.65rem",
    padding: "0.85rem 1.25rem",
    backgroundColor: C.warningBg,
    borderLeft: `4px solid ${C.warning}`,
    fontSize: "0.82rem",
    color: "#7a3010",
  },
  actionBar: {
    padding: "0.85rem 1.25rem",
    backgroundColor: "#f8fbfc",
    borderTop: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  generateBtn: (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.55rem 1.3rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: active ? C.dark : "#ccd5d8",
    color: active ? "#fff" : "#999",
    fontWeight: 700,
    fontSize: "0.83rem",
    cursor: active ? "pointer" : "not-allowed",
    transition: "background 0.15s",
  }),
  viewBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    padding: "0.5rem 1.1rem",
    borderRadius: "8px",
    border: `2px solid ${C.bright}`,
    backgroundColor: "transparent",
    color: C.mid,
    fontWeight: 700,
    fontSize: "0.83rem",
    cursor: "pointer",
  },
  doneBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.85rem",
    borderRadius: "8px",
    backgroundColor: C.successBg,
    color: C.success,
    fontWeight: 700,
    fontSize: "0.78rem",
    border: `1px solid ${C.success}44`,
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  histRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.85rem 1.25rem",
    borderBottom: `1px solid ${C.border}`,
    gap: "1rem",
  },
  histWeek: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: C.dark,
    minWidth: "110px",
  },
  histMeta: {
    fontSize: "0.78rem",
    color: C.muted,
    display: "flex",
    gap: "0.75rem",
  },
  histPay: {
    fontWeight: 800,
    fontSize: "1rem",
    color: C.mid,
    marginLeft: "auto",
  },
  histDlBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.75rem",
    borderRadius: "6px",
    border: `1.5px solid ${C.border}`,
    backgroundColor: "#fff",
    color: C.muted,
    fontSize: "0.75rem",
    cursor: "pointer",
    fontWeight: 600,
    flexShrink: 0,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const FinanceDashboard = ({ user, onProfileClick }) => {
  // list of all consultants pulled from api
  const [consultants, setConsultants] = useState([]);
  // client data stored as a map so we can look them up quickly by id
  const [clientMap, setClientMap] = useState({});
  // every timesheet in the system (approved, paid, submitted etc)
  const [allTimesheets, setAllTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  // what the user has currently picked from the filter bar
  const [chosenConsultant, setChosenConsultant] = useState(null);
  const [chosenMonth, setChosenMonth] = useState(currentMonth());

  // entries and rates for the selected consultant/month (keyed by timesheet id)
  const [entriesMap, setEntriesMap] = useState({});
  const [ratesMap, setRatesMap] = useState({});
  const [loadingEntries, setLoadingEntries] = useState(false);

  // controls for the payslip modal + marking as paid flow
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payDone, setPayDone] = useState(false);

  // pay history stuff (shown at the bottom of the page)
  const [payHistory, setPayHistory] = useState([]);
  const [paidSheets, setPaidSheets] = useState([]);
  const [histEntries, setHistEntries] = useState({});
  const [histRates, setHistRates] = useState({});
  const [histLoading, setHistLoading] = useState(false);
  // we snapshot the sheets before marking as paid so the modal still shows data after
  // (otherwise the timesheets become PAID and get filtered out, giving £0)
  const [paySnapshot, setPaySnapshot] = useState(null);
  // filter and sort state for the pay history list
  const [histMonthFilter, setHistMonthFilter] = useState("all");
  const [histSort, setHistSort] = useState("desc"); // desc = newest first

  // first load - grab consultants, timesheets and clients in parallel
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cRes, tRes, clRes] = await Promise.all([
          axios.get(`${BASE_URL}/consultants/`),
          axios.get(`${BASE_URL}/timesheets/`),
          axios.get(`${BASE_URL}/clients/`),
        ]);
        setConsultants(cRes.data);
        setAllTimesheets(tRes.data);
        // turn clients array into a lookup map by id
        const map = {};
        clRes.data.forEach((c) => { map[c.clientId] = c; });
        setClientMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load entries for selected consultant + month
  const fetchEntries = useCallback(async (consultant, month) => {
    // only care about APPROVED timesheets in the chosen month
    const sheets = allTimesheets.filter(
      (ts) => ts.consultant === consultant.consultantId && ts.status === "APPROVED" && isInMonth(ts, month)
    );
    if (!sheets.length) { setEntriesMap({}); setRatesMap({}); return; }
    setLoadingEntries(true);
    try {
      // fetch entries and assignments for each timesheet at the same time
      const results = await Promise.all(
        sheets.map((ts) =>
          Promise.all([
            axios.get(`${BASE_URL}/timesheets/${ts.timesheetID}/entries/`),
            axios.get(`${BASE_URL}/timesheets/${ts.timesheetID}/assignments/`),
          ]).then(([e, a]) => ({ id: ts.timesheetID, entries: e.data, assignments: a.data }))
        )
      );
      // build two maps keyed by timesheet id
      const eMap = {}, rMap = {};
      results.forEach(({ id, entries, assignments }) => {
        eMap[id] = entries;
        const byClient = {};
        let def = 0;
        // if only one assignment just use that rate as the default
        if (assignments.length === 1) {
          def = parseFloat(assignments[0].daily_rate) || 0;
        } else if (assignments.length > 1) {
          // multiple assignments = rate can differ per client
          assignments.forEach((a) => {
            if (a.client && parseFloat(a.daily_rate) > 0) byClient[a.client] = parseFloat(a.daily_rate);
          });
          def = Math.max(...assignments.map((a) => parseFloat(a.daily_rate) || 0), 0);
        }
        rMap[id] = { byClient, default: def };
      });
      setEntriesMap(eMap);
      setRatesMap(rMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEntries(false);
    }
  }, [allTimesheets]);

  // Load pay history for selected consultant (same idea as above but for PAID timesheets)
  const fetchHistory = useCallback(async (consultant) => {
    setHistLoading(true);
    try {
      const [psRes, tsRes] = await Promise.all([
        axios.get(`${BASE_URL}/payslips/consultant/${consultant.consultantId}/`),
        axios.get(`${BASE_URL}/timesheets/consultant/${consultant.consultantId}/`),
      ]);
      const paid = tsRes.data.filter((ts) => ts.status === "PAID");
      setPaidSheets(paid);
      setPayHistory(psRes.data);
      if (!paid.length) { setHistEntries({}); setHistRates({}); return; }
      const results = await Promise.all(
        paid.map((ts) =>
          Promise.all([
            axios.get(`${BASE_URL}/timesheets/${ts.timesheetID}/entries/`),
            axios.get(`${BASE_URL}/timesheets/${ts.timesheetID}/assignments/`),
          ]).then(([e, a]) => ({ id: ts.timesheetID, entries: e.data, assignments: a.data }))
        )
      );
      const eMap = {}, rMap = {};
      results.forEach(({ id, entries, assignments }) => {
        eMap[id] = entries;
        const byClient = {};
        let def = 0;
        if (assignments.length === 1) def = parseFloat(assignments[0].daily_rate) || 0;
        else if (assignments.length > 1) {
          assignments.forEach((a) => { if (a.client) byClient[a.client] = parseFloat(a.daily_rate); });
          def = Math.max(...assignments.map((a) => parseFloat(a.daily_rate) || 0), 0);
        }
        rMap[id] = { byClient, default: def };
      });
      setHistEntries(eMap);
      setHistRates(rMap);
    } catch (e) {
      console.error(e);
    } finally {
      setHistLoading(false);
    }
  }, []);

  // when the user picks a new consultant reset everything and refetch
  const onPickConsultant = (id) => {
    const c = consultants.find((c) => c.consultantId === parseInt(id));
    setChosenConsultant(c || null);
    setEntriesMap({});
    setRatesMap({});
    setPayDone(false);
    setPaySnapshot(null);
    setHistMonthFilter("all"); // reset month filter too
    if (c) { fetchEntries(c, chosenMonth); fetchHistory(c); }
  };

  // same as above but for the month picker
  const onPickMonth = (m) => {
    setChosenMonth(m);
    setEntriesMap({});
    setRatesMap({});
    setPayDone(false);
    setPaySnapshot(null);
    if (chosenConsultant) fetchEntries(chosenConsultant, m);
  };

  // timesheets that should be shown in the main table (approved, in chosen month)
  const visibleSheets = chosenConsultant
    ? allTimesheets.filter((ts) => ts.consultant === chosenConsultant.consultantId && ts.status === "APPROVED" && isInMonth(ts, chosenMonth))
    : [];

  // calc totals for one timesheet row (std hrs, ot hrs, total pay)
  const rowCalc = (ts) => {
    const entries = entriesMap[ts.timesheetID] || [];
    const rInfo = ratesMap[ts.timesheetID] || {};
    const fb = parseFloat(chosenConsultant?.daily_rate || 0);
    return entries.reduce((acc, e) => {
      const p = computeEntryPay(e, clientMap, rInfo, fb);
      return { stdHrs: acc.stdHrs + p.stdHrs, otHrs: acc.otHrs + p.otHrs, total: acc.total + p.total, missingRate: acc.missingRate || p.missingRate };
    }, { stdHrs: 0, otHrs: 0, total: 0, missingRate: false });
  };

  // total for the whole table (all visible sheets added up)
  const grandTotals = visibleSheets.reduce((acc, ts) => {
    const r = rowCalc(ts);
    return { stdHrs: acc.stdHrs + r.stdHrs, otHrs: acc.otHrs + r.otHrs, total: acc.total + r.total, missingRate: acc.missingRate || r.missingRate };
  }, { stdHrs: 0, otHrs: 0, total: 0, missingRate: false });

  // after marking as paid the timesheets switch to PAID so visibleSheets becomes empty
  // so we use a frozen snapshot from the moment payment was done
  const modalSheets = payDone && paySnapshot ? paySnapshot.sheets : visibleSheets;
  const modalEntries = payDone && paySnapshot ? paySnapshot.entries : entriesMap;
  const modalRates = payDone && paySnapshot ? paySnapshot.rates : ratesMap;
  const modalTotals = modalSheets.reduce((acc, ts) => {
    const entries = modalEntries[ts.timesheetID] || [];
    const rInfo = modalRates[ts.timesheetID] || {};
    const fb = parseFloat(chosenConsultant?.daily_rate || 0);
    const r = entries.reduce((a, e) => {
      const p = computeEntryPay(e, clientMap, rInfo, fb);
      return { stdHrs: a.stdHrs + p.stdHrs, otHrs: a.otHrs + p.otHrs, total: a.total + p.total };
    }, { stdHrs: 0, otHrs: 0, total: 0 });
    return { stdHrs: acc.stdHrs + r.stdHrs, otHrs: acc.otHrs + r.otHrs, total: acc.total + r.total };
  }, { stdHrs: 0, otHrs: 0, total: 0 });

  // flags any timesheet where we cant figure out a daily rate at all
  // these get shown in the warning banner so finance team can fix them
  const badRateSheets = visibleSheets.filter((ts) => {
    const ri = ratesMap[ts.timesheetID];
    if (ri && (ri.default > 0 || Object.keys(ri.byClient).length > 0)) return false;
    const entries = entriesMap[ts.timesheetID] || [];
    const hasClientRate = entries.some((e) => e.client && clientMap[e.client] && parseFloat(clientMap[e.client].daily_rate) > 0);
    return !hasClientRate && parseFloat(chosenConsultant?.daily_rate || 0) === 0;
  });

  // only allow generate payslip when theres stuff to pay, not loading, not already done, and no missing rates
  const canPay = visibleSheets.length > 0 && !loadingEntries && !payDone && badRateSheets.length === 0;

  const histRowCalc = (ts) => {
    const entries = histEntries[ts.timesheetID] || [];
    const rInfo = histRates[ts.timesheetID] || {};
    const fb = parseFloat(chosenConsultant?.daily_rate || 0);
    return entries.reduce((acc, e) => {
      const p = computeEntryPay(e, clientMap, rInfo, fb);
      return { stdHrs: acc.stdHrs + p.stdHrs, otHrs: acc.otHrs + p.otHrs, total: acc.total + p.total };
    }, { stdHrs: 0, otHrs: 0, total: 0 });
  };

  // numbers shown in the 3 stat cards at the top of the page
  const awaitingCount = allTimesheets.filter((ts) => ts.status === "APPROVED").length;
  const paidThisMonth = allTimesheets.filter((ts) => ts.status === "PAID" && isInMonth(ts, chosenMonth)).length;

  // called when finance clicks "Mark as Paid" in the modal
  // creates payslip records and flips timesheets to PAID
  const handleGeneratePayslip = async () => {
    setProcessing(true);
    // take a copy of the current sheets/entries/rates before the api changes anything
    // we need this for the modal to still show the right totals after
    setPaySnapshot({
      sheets: [...visibleSheets],
      entries: { ...entriesMap },
      rates: { ...ratesMap },
    });
    try {
      // first create a payslip for each timesheet
      await Promise.all(
        visibleSheets.map((ts) =>
          axios.post(`${BASE_URL}/payslips/calculate/`, {
            consultant_id: chosenConsultant.consultantId,
            timesheet_id: ts.timesheetID,
          })
        )
      );
      // then mark them all as paid
      await Promise.all(visibleSheets.map((ts) => axios.put(`${BASE_URL}/timesheets/${ts.timesheetID}/mark-paid/`)));
      // refresh timesheets so the stats update
      const tRes = await axios.get(`${BASE_URL}/timesheets/`);
      setAllTimesheets(tRes.data);
      setPayDone(true);
      if (chosenConsultant) fetchHistory(chosenConsultant);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  // builds the actual payslip PDF that gets downloaded
  // uses jsPDF + autoTable for the tables
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const teal = [0, 95, 122];
    const tealLight = [0, 168, 150];
    const white = [255, 255, 255];
    const dark = [30, 30, 30];
    const grey = [120, 120, 120];
    const rowAlt = [245, 250, 251];

    // ── Header bar ──
    doc.setFillColor(...teal);
    doc.rect(0, 0, pageW, 30, "F");

    doc.setTextColor(...white);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TimeDime", 14, 13);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Payslip", 14, 22);

    // ── Consultant info block ──
    doc.setTextColor(...dark);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(chosenConsultant.name, 14, 44);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.text(`Period: ${monthLabel(chosenMonth)}`, 14, 51);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 57);

    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(
      "Standard pay = (Daily Rate ÷ 8) × Std Hours  |  OT pay = (Daily Rate ÷ 8 × 1.5) × OT Hours",
      14, 64
    );

    // ── Divider ──
    doc.setDrawColor(220, 230, 232);
    doc.setLineWidth(0.4);
    doc.line(14, 67, pageW - 14, 67);

    let y = 73;

    // grand totals accumulator
    let grandStd = 0, grandOT = 0, grandTotal = 0;

    modalSheets.forEach((ts) => {
      const entries = modalEntries[ts.timesheetID] || [];
      const rInfo = modalRates[ts.timesheetID] || {};
      const breakdown = buildBreakdown(entries, clientMap, rInfo, chosenConsultant.daily_rate);

      // Week heading
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...teal);
      const weekEnd = fmtDate(ts.weekEnding);
      doc.text(`Week: ${fmtDate(ts.weekCommencing)} – ${weekEnd}`, 14, y);
      y += 5;

      // Table
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Std Pay", "OT Pay", "Total Pay"]],
        body: breakdown.map((b) => [
          b.label,
          fmtGBP(b.dailyRate),
          b.stdHrs.toFixed(1) + "h",
          b.otHrs.toFixed(1) + "h",
          fmtGBP(b.stdPay),
          fmtGBP(b.otPay),
          fmtGBP(b.total),
        ]),
        headStyles: {
          fillColor: tealLight,
          textColor: white,
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: dark,
          cellPadding: 3.5,
        },
        alternateRowStyles: { fillColor: rowAlt },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right", fontStyle: "bold" },
        },
        tableLineColor: [220, 230, 232],
        tableLineWidth: 0.3,
      });

      y = doc.lastAutoTable.finalY + 10;

      breakdown.forEach((b) => {
        grandStd += b.stdHrs;
        grandOT += b.otHrs;
        grandTotal += b.total;
      });
    });

    // ── Grand total row ──
    doc.setFillColor(...teal);
    doc.roundedRect(14, y, pageW - 28, 12, 2, 2, "F");
    doc.setTextColor(...white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 20, y + 8);
    doc.text(`${grandStd.toFixed(1)}h`, 80, y + 8, { align: "right" });
    doc.text(`${grandOT.toFixed(1)}h`, 110, y + 8, { align: "right" });
    doc.text(fmtGBP(grandTotal), pageW - 20, y + 8, { align: "right" });

    // ── Footer ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(
      "This payslip was generated by TimeDime. Please retain for your records.",
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );

    doc.save(`payslip_${chosenConsultant.name.replace(/\s+/g, "_")}_${chosenMonth}.pdf`);
  };

  // same thing but for the pay history PDFs (per-week download from the history section)
  const downloadHistPDF = (ts) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const teal = [0, 95, 122];
    const tealLight = [0, 168, 150];
    const white = [255, 255, 255];
    const dark = [30, 30, 30];
    const grey = [120, 120, 120];
    const rowAlt = [245, 250, 251];

    const entries = histEntries[ts.timesheetID] || [];
    const rInfo = histRates[ts.timesheetID] || {};
    const breakdown = buildBreakdown(entries, clientMap, rInfo, chosenConsultant.daily_rate);
    const r = histRowCalc(ts);

    // ── Header bar ──
    doc.setFillColor(...teal);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(...white);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TimeDime", 14, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Payslip", 14, 22);

    // ── Consultant info ──
    doc.setTextColor(...dark);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(chosenConsultant.name, 14, 44);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.text(`Week: ${fmtDate(ts.weekCommencing)} – ${fmtDate(ts.weekEnding)}`, 14, 51);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 57);
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(
      "Standard pay = (Daily Rate ÷ 8) × Std Hours  |  OT pay = (Daily Rate ÷ 8 × 1.5) × OT Hours",
      14, 64
    );

    // ── Divider ──
    doc.setDrawColor(220, 230, 232);
    doc.setLineWidth(0.4);
    doc.line(14, 67, pageW - 14, 67);

    let y = 73;

    // ── Week heading ──
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.text(`Week: ${fmtDate(ts.weekCommencing)} – ${fmtDate(ts.weekEnding)}`, 14, y);
    y += 5;

    // ── Table ──
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Std Pay", "OT Pay", "Total Pay"]],
      body: breakdown.map((b) => [
        b.label,
        fmtGBP(b.dailyRate),
        b.stdHrs.toFixed(1) + "h",
        b.otHrs.toFixed(1) + "h",
        fmtGBP(b.stdPay),
        fmtGBP(b.otPay),
        fmtGBP(b.total),
      ]),
      headStyles: {
        fillColor: tealLight,
        textColor: white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 4,
      },
      bodyStyles: { fontSize: 8, textColor: dark, cellPadding: 3.5 },
      alternateRowStyles: { fillColor: rowAlt },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right", fontStyle: "bold" },
      },
      tableLineColor: [220, 230, 232],
      tableLineWidth: 0.3,
    });

    y = doc.lastAutoTable.finalY + 10;

    // ── Total bar ──
    doc.setFillColor(...teal);
    doc.roundedRect(14, y, pageW - 28, 12, 2, 2, "F");
    doc.setTextColor(...white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 20, y + 8);
    doc.text(`${r.stdHrs.toFixed(1)}h`, 80, y + 8, { align: "right" });
    doc.text(`${r.otHrs.toFixed(1)}h`, 110, y + 8, { align: "right" });
    doc.text(fmtGBP(r.total), pageW - 20, y + 8, { align: "right" });

    // ── Footer ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(
      "This payslip was generated by TimeDime. Please retain for your records.",
      pageW / 2, pageH - 8, { align: "center" }
    );

    doc.save(`payslip_${chosenConsultant.name.replace(/\s+/g, "_")}_week${ts.timesheetID}.pdf`);
  };

  const userLabel = user?.name || "Finance";
  const initials = userLabel.split(" ").map((w) => w[0]).join("").toUpperCase();

  if (loading) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner animation="border" style={{ color: "#005f7a" }} />
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <div
        className="text-white px-5 pt-4 pb-4"
        style={{ background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)", position: "relative" }}
      >
        <div className="position-absolute d-flex align-items-center gap-2" style={{ top: "20px", right: "30px" }}>
          <NotificationBell userId={user?.userID} />
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>{userLabel}</span>
          <div onClick={onProfileClick} style={{
            width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.25)",
            border: "2px solid rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "1rem", cursor: "pointer",
          }}>
            {initials}
          </div>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: "2.2rem", marginTop: "10px" }}>
          Welcome, {userLabel}
        </h1>
      </div>

      {/* ── Stat cards ── */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard(C.bright)}>
          <div style={styles.statIcon(`${C.bright}22`)}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: C.bright, fontSize: "1.1rem" }} />
          </div>
          <div>
            <div style={styles.statNum}>{awaitingCount}</div>
            <div style={styles.statLabel}>Awaiting Payment</div>
          </div>
        </div>
        <div style={styles.statCard(C.mid)}>
          <div style={styles.statIcon(`${C.mid}22`)}>
            <FontAwesomeIcon icon={faUsers} style={{ color: C.mid, fontSize: "1.1rem" }} />
          </div>
          <div>
            <div style={styles.statNum}>{consultants.length}</div>
            <div style={styles.statLabel}>Consultants</div>
          </div>
        </div>
        <div style={styles.statCard(C.success)}>
          <div style={styles.statIcon(`${C.success}22`)}>
            <FontAwesomeIcon icon={faCheckCircle} style={{ color: C.success, fontSize: "1.1rem" }} />
          </div>
          <div>
            <div style={styles.statNum}>{paidThisMonth}</div>
            <div style={styles.statLabel}>Paid This Month</div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <FontAwesomeIcon icon={faUsers} style={{ marginRight: "0.3rem" }} />Consultant
          </label>
          <select
            style={styles.filterSelect}
            value={chosenConsultant?.consultantId || ""}
            onChange={(e) => onPickConsultant(e.target.value)}
          >
            <option value="">Select consultant…</option>
            {consultants.map((c) => (
              <option key={c.consultantId} value={c.consultantId}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "0.3rem" }} />Month
          </label>
          <input
            type="month"
            style={styles.filterSelect}
            value={chosenMonth}
            onChange={(e) => onPickMonth(e.target.value)}
          />
        </div>
        {chosenConsultant && (
          <div style={styles.consultantChip}>
            <div style={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: C.bright, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.75rem", color: C.dark }}>
              {chosenConsultant.name.split(" ").map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: C.dark }}>{chosenConsultant.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div style={styles.bodyWrap}>

        {/* Missing rate warning */}
        {badRateSheets.length > 0 && (
          <div style={styles.warningBanner}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: C.warning, marginTop: "2px", flexShrink: 0 }} />
            <div>
              <strong>No daily rate set</strong> — pay can't be calculated for:{" "}
              <strong>{badRateSheets.map((ts) => `Week of ${fmtDate(ts.weekCommencing)}`).join(", ")}</strong>. Ask an admin to add a rate.
            </div>
          </div>
        )}

        {/* Timesheets card */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.cardHeadTitle}>
              <FontAwesomeIcon icon={faMoneyBillWave} />
              Approved Timesheets — {monthLabel(chosenMonth)}
            </span>
            {visibleSheets.length > 0 && (
              <span style={{ color: C.accent, fontSize: "0.75rem", fontWeight: 600 }}>
                {visibleSheets.length} sheet{visibleSheets.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {!chosenConsultant ? (
            <div style={styles.emptyState}>
              <FontAwesomeIcon icon={faUsers} style={{ fontSize: "2.5rem", opacity: 0.18, display: "block", margin: "0 auto 0.75rem" }} />
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>No consultant selected</div>
              <div style={{ fontSize: "0.8rem" }}>Choose a consultant above to see their timesheets.</div>
            </div>
          ) : loadingEntries ? (
            <div style={styles.emptyState}>
              <Spinner animation="border" size="sm" style={{ color: C.bright }} />
            </div>
          ) : (
            <>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["ID", "Week Commencing", "Week Ending", "Std Hours", "OT Hours", "Clients", "Total Pay"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSheets.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                          No approved timesheets for {monthLabel(chosenMonth)}.
                        </td>
                      </tr>
                    ) : (
                      visibleSheets.map((ts, idx) => {
                        const r = rowCalc(ts);
                        const clientNames = [...new Set(
                          (entriesMap[ts.timesheetID] || [])
                            .filter((e) => e.client && clientMap[e.client])
                            .map((e) => clientMap[e.client].name)
                        )];
                        return (
                          <tr key={ts.timesheetID} style={{ backgroundColor: idx % 2 === 1 ? "#fafcfc" : "#fff" }}>
                            <td style={{ ...styles.td, color: "#ccc", fontSize: "0.78rem" }}>#{ts.timesheetID}</td>
                            <td style={{ ...styles.td, fontWeight: 500 }}>{fmtDate(ts.weekCommencing)}</td>
                            <td style={styles.td}>{fmtDate(ts.weekEnding)}</td>
                            <td style={styles.td}>{r.stdHrs.toFixed(1)}h</td>
                            <td style={styles.td}>{r.otHrs.toFixed(1)}h</td>
                            <td style={styles.td}>
                              {clientNames.length
                                ? clientNames.map((n) => <span key={n} style={styles.clientTag}>{n}</span>)
                                : <span style={{ color: "#ccc", fontSize: "0.78rem" }}>—</span>}
                            </td>
                            <td style={{ ...styles.td, fontWeight: 700, color: r.missingRate ? C.warning : C.mid, fontSize: "0.95rem" }}>
                              {fmtGBP(r.total)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {visibleSheets.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={styles.tfootTd}>Totals</td>
                        <td style={styles.tfootTd}>{grandTotals.stdHrs.toFixed(1)}h</td>
                        <td style={styles.tfootTd}>{grandTotals.otHrs.toFixed(1)}h</td>
                        <td style={styles.tfootTd}></td>
                        <td style={{ ...styles.tfootTd, fontSize: "1.05rem", color: C.dark }}>{fmtGBP(grandTotals.total)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {visibleSheets.length > 0 && (
                <div style={styles.actionBar}>
                  {payDone ? (
                    <>
                      <div style={styles.doneBadge}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Payslip Processed
                      </div>
                      <button style={styles.viewBtn} onClick={() => setModalOpen(true)}>
                        <FontAwesomeIcon icon={faDownload} /> View Payslip
                      </button>
                    </>
                  ) : (
                    <button
                      style={styles.generateBtn(canPay)}
                      disabled={!canPay || processing}
                      onClick={() => setModalOpen(true)}
                    >
                      {processing
                        ? <Spinner animation="border" size="sm" />
                        : <FontAwesomeIcon icon={faFileInvoiceDollar} />}
                      Generate Payslip
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pay history card */}
        {chosenConsultant && (
          <div style={styles.card}>
            <div style={styles.cardHead}>
              <span style={styles.cardHeadTitle}>
                <FontAwesomeIcon icon={faHistory} /> Pay History
              </span>
              {paidSheets.length > 0 && (
                <span style={{ color: C.accent, fontSize: "0.75rem", fontWeight: 600 }}>
                  {paidSheets.length} record{paidSheets.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Search + sort controls */}
            {paidSheets.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", borderBottom: `1px solid ${C.border}` }}>
                <select
                  value={histMonthFilter}
                  onChange={(e) => setHistMonthFilter(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: `1.5px solid ${C.border}`,
                    backgroundColor: C.bg,
                    fontSize: "0.82rem",
                    color: C.dark,
                    outline: "none",
                  }}
                >
                  <option value="all">All months</option>
                  {[...new Set(paidSheets.map((ts) => ts.weekCommencing?.slice(0, 7)))]
                    .sort((a, b) => b.localeCompare(a))
                    .map((m) => (
                      <option key={m} value={m}>{monthLabel(m)}</option>
                    ))}
                </select>
                <button
                  onClick={() => setHistSort(histSort === "desc" ? "asc" : "desc")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: `1.5px solid ${C.border}`,
                    backgroundColor: "#fff",
                    color: C.muted,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {histSort === "desc" ? "↓ Newest first" : "↑ Oldest first"}
                </button>
              </div>
            )}

            <div style={styles.historyList}>
              {histLoading ? (
                <div style={styles.emptyState}><Spinner animation="border" size="sm" style={{ color: C.bright }} /></div>
              ) : paidSheets.length === 0 ? (
                <div style={styles.emptyState}>No payment history for this consultant.</div>
              ) : (() => {
                const filtered = [...paidSheets]
                  .filter((ts) => histMonthFilter === "all" || ts.weekCommencing?.startsWith(histMonthFilter))
                  .sort((a, b) => histSort === "desc"
                    ? new Date(b.weekCommencing) - new Date(a.weekCommencing)
                    : new Date(a.weekCommencing) - new Date(b.weekCommencing)
                  );

                if (filtered.length === 0) return (
                  <div style={styles.emptyState}>No records for {monthLabel(histMonthFilter)}.</div>
                );

                return filtered.map((ts) => {
                  const r = histRowCalc(ts);
                  const ps = payHistory.find((p) => p.timesheet === ts.timesheetID);
                  return (
                    <div key={ts.timesheetID} style={styles.histRow}>
                      <div style={styles.histWeek}>{fmtDate(ts.weekCommencing)}</div>
                      <div style={styles.histMeta}>
                        <span>{r.stdHrs}h std</span>
                        <span>{r.otHrs}h OT</span>
                        {ps && <span>Paid {fmtDate(ps.generatedDate)}</span>}
                      </div>
                      <div style={styles.histPay}>{fmtGBP(r.total)}</div>
                      <button style={styles.histDlBtn} onClick={() => downloadHistPDF(ts)}>
                        <FontAwesomeIcon icon={faDownload} /> PDF
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Total paid to date */}
            {!histLoading && paidSheets.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", borderTop: `2px solid ${C.border}`, backgroundColor: "#f8fbfc" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.muted }}>
                  Total paid to date
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: C.dark }}>
                  {fmtGBP(paidSheets.reduce((sum, ts) => sum + histRowCalc(ts).total, 0))}
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Payslip Modal ── */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton style={{ backgroundColor: C.dark, color: "#fff", borderBottom: `3px solid ${C.bright}` }}>
          <Modal.Title style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-2" style={{ color: C.bright }} />
            Payslip — {chosenConsultant?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: C.bg, padding: "1.5rem" }}>
          {chosenConsultant && (
            <>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Consultant", value: chosenConsultant.name },
                  { label: "Period", value: monthLabel(chosenMonth) },
                  { label: "Total Pay", value: fmtGBP(modalTotals.total) },
                ].map((m) => (
                  <div key={m.label} style={{ flex: 1, padding: "0.85rem 1rem", backgroundColor: "#fff", borderRadius: "10px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>{m.label}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.dark }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {modalSheets.map((ts, i) => {
                const breakdown = buildBreakdown(
                  modalEntries[ts.timesheetID] || [],
                  clientMap,
                  modalRates[ts.timesheetID] || {},
                  chosenConsultant.daily_rate
                );
                return (
                  <div key={ts.timesheetID} style={{ marginTop: i > 0 ? "1.25rem" : 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.78rem", color: C.bright, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                      Week commencing {fmtDate(ts.weekCommencing)}
                    </div>
                    <div style={{ backgroundColor: "#fff", borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      <table style={{ ...styles.table, fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ backgroundColor: C.dark }}>
                            {["Client", "Daily Rate", "Std Hrs", "OT Hrs", "Total"].map((h) => (
                              <th key={h} style={{ ...styles.th, color: "rgba(255,255,255,0.65)", backgroundColor: "transparent" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.map((b, idx) => (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 1 ? "#fafcfc" : "#fff" }}>
                              <td style={{ ...styles.td, padding: "0.55rem 1rem" }}>{b.label}</td>
                              <td style={{ ...styles.td, padding: "0.55rem 1rem" }}>{fmtGBP(b.dailyRate)}</td>
                              <td style={{ ...styles.td, padding: "0.55rem 1rem" }}>{b.stdHrs}h</td>
                              <td style={{ ...styles.td, padding: "0.55rem 1rem" }}>{b.otHrs}h</td>
                              <td style={{ ...styles.td, padding: "0.55rem 1rem", fontWeight: 700, color: C.mid }}>{fmtGBP(b.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: "#fff", borderTop: `1px solid ${C.border}` }}>
          <Button variant="outline-secondary" size="sm" onClick={() => setModalOpen(false)}>Close</Button>
          <Button size="sm" style={{ backgroundColor: C.mid, border: "none", fontWeight: 700 }} onClick={downloadPDF}>
            <FontAwesomeIcon icon={faDownload} className="me-1" /> Download PDF
          </Button>
          {!payDone && (
            <Button size="sm" style={{ backgroundColor: C.dark, border: "none", fontWeight: 700 }} disabled={processing} onClick={handleGeneratePayslip}>
              {processing ? <Spinner size="sm" /> : "Mark as Paid"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;
