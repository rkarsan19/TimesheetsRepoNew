import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheckDouble } from "@fortawesome/free-solid-svg-icons";

const API_BASE = "http://localhost:8000/api";

// Left-border colour per notification type
const TYPE_COLOR = {
  SUBMITTED: "#2DB5AA",
  APPROVED:  "#198754",
  REJECTED:  "#dc3545",
  PAID:      "#00789A",
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/notifications/${userId}/`);
      setNotifications(res.data);
    } catch {
      // silently fail — never crash the page for a notification error
    }
  }, [userId]);

  // Initial load + 30-second poll
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_BASE}/notifications/${userId}/read-all/`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>

      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Notifications"
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          position: "relative",
          padding: "4px 8px",
          fontSize: "1.2rem",
          lineHeight: 1,
        }}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              background: "#dc3545",
              color: "#fff",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "0.62rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: "360px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "13px 16px",
              borderBottom: "1px solid #eee",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#333" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ color: "#00789A", marginLeft: "6px" }}>
                  ({unreadCount} new)
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  color: "#00789A",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: 0,
                }}
              >
                <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: "0.75rem" }} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "2.5rem",
                  textAlign: "center",
                  color: "#bbb",
                  fontSize: "0.88rem",
                }}
              >
                <FontAwesomeIcon
                  icon={faBell}
                  style={{ fontSize: "1.6rem", marginBottom: "8px", display: "block", opacity: 0.3 }}
                />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f5f5f5",
                    borderLeft: `3px solid ${TYPE_COLOR[n.notif_type] || "#ccc"}`,
                    background: n.is_read ? "#fff" : "#f5fbff",
                    cursor: n.is_read ? "default" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.82rem",
                        color: "#333",
                        lineHeight: 1.45,
                        fontWeight: n.is_read ? 400 : 600,
                        wordBreak: "break-word",
                      }}
                    >
                      {n.message}
                    </p>
                    <span
                      style={{
                        fontSize: "0.71rem",
                        color: "#aaa",
                        marginTop: "4px",
                        display: "block",
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {!n.is_read && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#00789A",
                        flexShrink: 0,
                        marginTop: "5px",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
