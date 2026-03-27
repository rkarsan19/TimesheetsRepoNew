import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

// Font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faChartPie,
  faSearch,
  faFilter,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import backgroundPattern from "../assets/background.svg";

const ReviewTimesheets = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch timesheets from Django backend (MySQL data)
  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/getTimesheets/"
        );
        setTimesheets(response.data);
      } catch (error) {
        console.error("Error fetching timesheets:", error);
      }
    };
    fetchTimesheets();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/approveTimesheet/${id}/`);
    } catch (error) {
      console.error("Approval failed", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setShowFilterMenu(false);
  };

  const filteredTimesheets = timesheets.filter((ts) => {
    const matchesSearch =
      ts.consultant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ts.timesheetID.toString().includes(searchTerm);
    const matchesStatus = statusFilter
      ? ts.status === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });

  const statusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "badge rounded-pill bg-success-subtle text-success";
      case "PENDING":
        return "badge rounded-pill bg-warning-subtle text-warning";
      case "REJECTED":
        return "badge rounded-pill bg-danger-subtle text-danger";
      default:
        return "badge rounded-pill bg-secondary-subtle text-secondary";
    }
  };

  return (
    <div
      className="container-fluid p-0"
      style={{ backgroundColor: "#f0f4f4", minHeight: "100vh" }}
    >
      {/* ── HEADER BANNER ── */}
      <div
        className="text-white px-5 pt-4 pb-5"
        style={{
          backgroundImage: `url(${backgroundPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1a6b6b",
          minHeight: "180px",
          position: "relative",
        }}
      >
        {/* Profile badge – top right */}
        <div
          className="position-absolute d-flex align-items-center gap-2"
          style={{ top: "20px", right: "30px" }}
        >
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
            James Smith | Line Manager
          </span>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.25)",
              border: "2px solid rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "1rem",
            }}
          >
            JS
          </div>
        </div>

        {/* Welcome heading */}
        <h1
          className="fw-bold mb-3"
          style={{ fontSize: "2.6rem", marginTop: "10px" }}
        >
          Welcome, James Smith
        </h1>

        {/* Stats row */}
        <div className="d-flex gap-4 align-items-center flex-wrap">
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
            <FontAwesomeIcon icon={faClock} className="me-2" />
            75% left to review
          </span>
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
            <FontAwesomeIcon icon={faChartPie} className="me-2" />
            25% approved
          </span>
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div
        className="mx-4 bg-white rounded-4 shadow-sm p-4"
        style={{ marginTop: "-30px", position: "relative" }}
      >
        {/* Toolbar */}
        <style>{"#ts-search::placeholder { color: #fff; opacity: 0.7; }"}</style>
        <div className="d-flex gap-2 mb-3 align-items-center">
          {/* Search */}
          <div className="position-relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="position-absolute text-white"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              id="ts-search"
              type="text"
              value={searchTerm}
              className="form-control border-0 text-white ps-5"
              placeholder="Search"
              style={{
                backgroundColor: "#3a3a3a",
                width: "220px",
                borderRadius: "6px",
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter dropdown */}
          <div className="position-relative">
            <button
              className="btn text-white d-flex align-items-center gap-2"
              style={{ backgroundColor: "#3a3a3a", borderRadius: "6px" }}
              onClick={() => setShowFilterMenu((v) => !v)}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filter
              <span style={{ fontSize: "0.7rem" }}>▼</span>
            </button>
            {showFilterMenu && (
              <div
                className="position-absolute bg-white border rounded shadow-sm p-2 mt-1"
                style={{ zIndex: 100, minWidth: "150px" }}
              >
                {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    className={`dropdown-item rounded ${statusFilter === s ? "active" : ""}`}
                    onClick={() => {
                      setStatusFilter(s);
                      setShowFilterMenu(false);
                    }}
                  >
                    {s === "" ? "All Statuses" : s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            style={{ borderRadius: "6px" }}
            onClick={clearFilters}
          >
            <FontAwesomeIcon icon={faTimes} />
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <table className="table table-hover align-middle mb-0">
          <thead className="text-secondary" style={{ fontSize: "0.9rem" }}>
            <tr>
              <th>ID</th>
              <th>Consultant</th>
              <th>Status</th>
              <th>Date Submitted</th>
              <th>Due Date</th>
              <th>Sent?</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary py-4">
                  No timesheets found.
                </td>
              </tr>
            ) : (
              filteredTimesheets.map((ts) => (
                <tr key={ts.timesheetID}>
                  <td>{ts.timesheetID}</td>
                  <td>{ts.consultant_name ?? "John Doe"}</td>
                  <td>
                    <span className={statusBadgeClass(ts.status)}>
                      {ts.status}
                    </span>
                  </td>
                  <td>{ts.date_submitted ?? "19/05/26"}</td>
                  <td>{ts.due_date ?? "—"}</td>
                  <td>{ts.sent ? "Yes" : "No"}</td>
                  <td className="text-center">
                    <button
                      onClick={() => handleApprove(ts.timesheetID)}
                      className="btn btn-sm btn-success"
                      disabled={ts.status === "APPROVED"}
                    >
                      <FontAwesomeIcon icon={faCheck} className="me-1" />
                      Approve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewTimesheets;
