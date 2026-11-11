import React, { useCallback, useEffect, useState } from "react";
import {
  Layout, Avatar, Badge, Button, Dropdown, Popover, Tooltip, Tag,
  Divider, Modal, Form, Input, message,
} from "antd";
import {
  MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined,
  FullscreenOutlined, FullscreenExitOutlined, UserOutlined, LogoutOutlined,
  ThunderboltOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleFilled,
  NotificationOutlined, TeamOutlined, FileTextOutlined, PlusOutlined,
  RightOutlined, LockOutlined, BulbOutlined, BulbFilled,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import jwt_decode from "../utils/jwtSafe";
import { getStoredTheme, applyThemeToDocument, storeTheme } from "../utils/theme";
import "./Top.css";

const { Header } = Layout;
const BASE_URL = process.env.REACT_APP_BASE_URL;
const MANAGER = ["admin", "hr"];

/* Adjust these paths to match your router */
const PATHS = {
  profile: "/profileemployee",
  hub: "/announcements",
  document: "/profileemployee",
  leave: "/leave",
  attendance: "/attendance",
  employees: "/employees",
  reports: "/reports",
};

const QUICK_ACTIONS = {
  employee: [
    { key: "document", label: "Add Document", icon: <FileTextOutlined /> },
    { key: "leave", label: "Apply for leave", icon: <CalendarOutlined /> },
    { key: "hub", label: "News & Events", icon: <NotificationOutlined /> },
  ],
  manager: [
    { key: "hub", label: "Create announcement", icon: <NotificationOutlined /> },
    { key: "employees", label: "Employee directory", icon: <TeamOutlined /> },
    { key: "reports", label: "Reports", icon: <FileTextOutlined /> },
  ],
};

const cleanToken = () =>
  (localStorage.getItem("access_token1") || "").replace(/^["']|["']$/g, "");

const getImageUrl = (v) => {
  if (!v) return "";
  if (/^(https?:|data:)/i.test(v)) return v;
  return `${BASE_URL}/images/${v}`;
};

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0].toUpperCase()).join("");

const Top = ({ collapsed, onToggle, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordForm] = Form.useForm();

  const [session, setSession] = useState({ _id: "", name: "", role: "employee" });
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ unread: 0, pending: 0, scheduled: 0, drafts: 0 });
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [now, setNow] = useState(moment());
  const [fullscreen, setFullscreen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [theme, setTheme] = useState(() => getStoredTheme());

  const role = String(session.role || "employee").toLowerCase();
  const isManager = MANAGER.includes(role);

  const authHeaders = useCallback(() => {
    const t = cleanToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  /* session from token */
  useEffect(() => {
    try {
      const token = cleanToken();
      if (!token) return;
      const d = jwt_decode(token);
      setSession({ _id: d?._id || "", name: d?.name || "", role: String(d?.role || "employee").toLowerCase() });
    } catch (e) { /* pages handle auth */ }
  }, []);

  /* theme: sets data-theme on <html>, remembers choice, notifies the app */
  useEffect(() => {
    applyThemeToDocument(theme);   // <html data-theme> + <body class="dark-theme">
    storeTheme(theme);             // localStorage "ebs-theme"
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: theme }));
  }, [theme]);

  /* profile (picture etc.) */
  const loadProfile = useCallback(async () => {
    if (!session._id) return;
    try {
      const res = await axios.get(`${BASE_URL}/user/${session._id}`, { headers: authHeaders() });
      const data = res.data?.myData;
      setProfile(Array.isArray(data) ? data[0] : data);
    } catch (e) { /* initials fallback */ }
  }, [session._id, authHeaders]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => {
    const h = () => loadProfile();
    window.addEventListener("profile-updated", h);
    return () => window.removeEventListener("profile-updated", h);
  }, [loadProfile]);

  /* notification counts */
  const loadCounts = useCallback(async () => {
    if (!session._id) return;
    try {
      if (isManager) {
        const res = await axios.get(`${BASE_URL}/announcements`, { headers: authHeaders() });
        const list = Array.isArray(res.data?.announcements) ? res.data.announcements : [];
        setCounts((c) => ({
          ...c,
          scheduled: list.filter((x) => x.status === "scheduled").length,
          drafts: list.filter((x) => x.status === "draft").length,
        }));
      } else {
        const res = await axios.get(`${BASE_URL}/announcements/unread/count`, { headers: authHeaders() });
        setCounts((c) => ({ ...c, unread: res.data?.unread || 0, pending: res.data?.pendingAcknowledgements || 0 }));
      }
    } catch (e) { /* silent */ }
  }, [session._id, isManager, authHeaders]);

  useEffect(() => {
    loadCounts();
    const t = setInterval(loadCounts, 60000);
    return () => clearInterval(t);
  }, [loadCounts]);
  useEffect(() => { loadCounts(); }, [location.pathname, loadCounts]);

  /* attendance (employee) */

  /* Attendance status (employee) */
  useEffect(() => {
    if (!session._id || isManager) return;

    const loadAttendanceStatus = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/attendance/singlemploy/${session._id}`,
          { headers: authHeaders() }
        );

        const records = res.data?.SingleEmployeeAllAttendance || [];
        const today = moment().format("YYYY-MM-DD");

        const todayRecord = records.find(
          (record) =>
            record.TodayDate === today &&
            record.CheckIn &&
            String(record.CheckIn).trim() !== ""
        );

        setAttendanceMarked(!!todayRecord);

      } catch (error) {
        console.error(
          "Attendance status error:",
          error.response?.data || error.message
        );
      }
    };

    loadAttendanceStatus();
  }, [
    session._id,
    isManager,
    authHeaders,
    location.pathname,
  ]);


  /* clock + fullscreen */
  useEffect(() => {
    const t = setInterval(() => setNow(moment()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  /* logout */
  const doLogout = () => {
    if (onLogout) return onLogout();
    localStorage.removeItem("access_token1");
    message.success("Signed out successfully.");
    navigate("/");
    window.location.reload();
  };
  const confirmLogout = () =>
    Modal.confirm({
      title: "Sign out?",
      content: "You will need to log in again to continue.",
      okText: "Sign out", okType: "danger", cancelText: "Stay", onOk: doLogout,
    });

  /* change password (verifies current password on the server) */
  const handleChangePassword = async (values) => {
    // try {
    //   setChangingPassword(true);
    //   await axios.put(
    //     `${BASE_URL}/user/change-password`,
    //     { currentPassword: values.currentPassword, newPassword: values.newPassword },
    //     { headers: authHeaders() }
    //   );
    //   message.success("Password changed successfully.");
    //   setPasswordOpen(false);
    //   passwordForm.resetFields();
    // } catch (error) {
    //   message.error(error?.response?.data?.message || "Unable to change password.");
    // } finally {
    //   setChangingPassword(false);
    // }
  };

  /* derived */
  const displayName = profile?.name || session.name || "User";
  const avatarSrc = getImageUrl(profile?.profilepicture || profile?.imageUrl) || undefined;
  const roleLabel = role === "hr" ? "HR" : role.charAt(0).toUpperCase() + role.slice(1);
  const roleColor = role === "admin" ? "volcano" : role === "hr" ? "purple" : "blue";
  const bellCount = isManager ? counts.scheduled + counts.drafts : counts.unread + counts.pending;

  const quickItems = (isManager ? QUICK_ACTIONS.manager : QUICK_ACTIONS.employee).map((q) => ({
    key: q.key, icon: q.icon, label: q.label, onClick: () => navigate(PATHS[q.key]),
  }));

  const goHub = () => { setNotifOpen(false); navigate(PATHS.hub); };

  const notificationItems = isManager
    ? [
      {
        key: "scheduled",
        title: "Scheduled announcements",
        description: "Announcements waiting for their scheduled date",
        count: counts.scheduled,
        icon: <ClockCircleOutlined />,
        color: "#1677ff",
        background: "#eaf2ff",
      },
      {
        key: "drafts",
        title: "Draft announcements",
        description: "Announcements saved but not published",
        count: counts.drafts,
        icon: <FileTextOutlined />,
        color: "#d48806",
        background: "#fff7e6",
      },
    ]
    : [
      {
        key: "unread",
        title: "Unread announcements",
        description: "Company updates you haven't viewed yet",
        count: counts.unread,
        icon: <NotificationOutlined />,
        color: "#1677ff",
        background: "#eaf2ff",
      },
      {
        key: "pending",
        title: "Pending acknowledgements",
        description: "Updates that still need your acknowledgement",
        count: counts.pending,
        icon: <CheckCircleFilled />,
        color: "#d48806",
        background: "#fff7e6",
      },
    ];

  const notificationPanel = (
    <div className="tb-notification-center">

      {/* Header */}
      <div className="tb-notification-header">
        <div>
          <div className="tb-notification-heading">
            Notifications
            {bellCount > 0 && (
              <span className="tb-notification-total">{bellCount}</span>
            )}
          </div>

          <div className="tb-notification-subtitle">
            {isManager
              ? "Manage your announcement activity"
              : "Stay updated with company activity"}
          </div>
        </div>

        <div className="tb-notification-header-icon">
          <BellOutlined />
        </div>
      </div>

      {/* Summary */}
      <div className="tb-notification-summary">
        <div className="tb-notification-summary-icon">
          <NotificationOutlined />
        </div>

        <div>
          <strong>
            {bellCount > 0
              ? `${bellCount} item${bellCount !== 1 ? "s" : ""} need attention`
              : "You're all caught up!"}
          </strong>

          <span>
            {bellCount > 0
              ? "Here is a summary of your notifications."
              : "There are no pending notification items right now."}
          </span>
        </div>
      </div>

      {/* Notification categories */}
      <div className="tb-notification-section">
        <div className="tb-notification-section-title">
          {isManager ? "ANNOUNCEMENT ACTIVITY" : "YOUR UPDATES"}
        </div>

        {notificationItems.map((item) => (
          <button
            type="button"
            key={item.key}
            className="tb-notification-item"
            onClick={goHub}
          >
            <span
              className="tb-notification-item-icon"
              style={{
                color: item.color,
                background: item.background,
              }}
            >
              {item.icon}
            </span>

            <span className="tb-notification-item-content">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </span>

            <span
              className={`tb-notification-count ${item.count > 0 ? "has-count" : ""
                }`}
            >
              {item.count}
            </span>

            <RightOutlined className="tb-notification-arrow" />
          </button>
        ))}
      </div>

      {/* Empty state */}
      {bellCount === 0 && (
        <div className="tb-notification-empty">
          <div className="tb-notification-empty-icon">
            <CheckCircleFilled />
          </div>
          <strong>All caught up</strong>
          <span>
            {isManager
              ? "No scheduled or draft announcements at the moment."
              : "You have no unread announcements or pending acknowledgements."}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="tb-notification-footer">
        <Button
          type="primary"
          block
          onClick={goHub}
          icon={<NotificationOutlined />}
        >
          Open News & Events
          <RightOutlined />
        </Button>

        <span className="tb-notification-footer-note">
          {isManager
            ? "Review and manage company announcements"
            : "View company news, updates and events"}
        </span>
      </div>

    </div>
  );

  const userMenuItems = [
    {
      key: "card",
      onClick: () => navigate(PATHS.profile),
      label: (
        <div className="tb-user-card">
          <Avatar size={44} src={avatarSrc} icon={<UserOutlined />}>
            {!avatarSrc && initials(displayName)}
          </Avatar>
          <div className="tb-user-card-text">
            <strong>{displayName}</strong>
            <span>{profile?.email || ""}</span>
            <span>
              <Tag color={roleColor} style={{ marginRight: 4 }}>{roleLabel}</Tag>
              {profile?.department || ""}
            </span>
          </div>
        </div>
      ),
    },
    { type: "divider" },
    { key: "profileemployee", icon: <UserOutlined />, label: "My Profile", onClick: () => navigate("/profileemployee") },
    { key: "hub", icon: <NotificationOutlined />, label: "News & Events", onClick: () => navigate(PATHS.hub) },
    { type: "divider" },
    { key: "password", icon: <LockOutlined />, label: "Change password", onClick: () => navigate("/changepassword") },
    {
      key: "theme",
      icon: theme === "dark" ? <BulbFilled /> : <BulbOutlined />,
      label: theme === "dark" ? "Switch to Light Mode" : "Enable Dark Mode",
      onClick: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      className: "tb-logout-item",
      label: "Sign out",
      onClick: confirmLogout,
    },
  ];

  return (
    <>
      <Header className="ebs-header">
        <div className="ebs-header-left">
          <button
            type="button"
            className="ebs-toggle"
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            onClick={onToggle}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Link to="/dashboard" className="ebs-brand">
            <span className="ebs-brand-mark">S</span>
            <span>SBS<em> Bela</em></span>
          </Link>
        </div>

        <div className="ebs-header-right tb-right">
          <div className="tb-clock">
            <div className="tb-clock-time">{isManager ? now.format("D MMM YYYY") : now.format("hh:mm A")}</div>
            <div className="tb-clock-date">{isManager ? now.format("dddd") : now.format("ddd, D MMM")}</div>
          </div>

          {!isManager && (
            <Tooltip title={attendanceMarked ? "Attendance marked for today" : "Attendance not marked yet"}>
              <Tag
                className="tb-attendance"
                color={attendanceMarked ? "success" : "warning"}
                icon={attendanceMarked ? <CheckCircleFilled /> : <ClockCircleOutlined />}
                onClick={() => navigate(PATHS.attendance)}
              >
                {attendanceMarked ? "Present" : "Not marked"}
              </Tag>
            </Tooltip>
          )}

          <Dropdown menu={{ items: quickItems }} trigger={["click"]} placement="bottomRight">
            <Tooltip title="Quick actions">
              <Button className="tb-icon-btn" type="text" icon={isManager ? <PlusOutlined /> : <ThunderboltOutlined />} />
            </Tooltip>
          </Dropdown>

          <Popover
            content={notificationPanel}
            trigger="click"
            placement="bottomRight"
            open={notifOpen}
            onOpenChange={setNotifOpen}
            overlayClassName="tb-notification-popover"
            mouseEnterDelay={0}
          >
            <Badge
              count={bellCount}
              size="small"
              overflowCount={99}
              offset={[-4, 5]}
            >
              <Button
                className={`tb-icon-btn ${notifOpen ? "tb-notification-active" : ""}`}
                type="text"
                icon={<BellOutlined />}
                aria-label="Notifications"
              />
            </Badge>
          </Popover>

          <Tooltip title={fullscreen ? "Exit full screen" : "Full screen"}>
            <Button
              className="tb-icon-btn tb-hide-sm"
              type="text"
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>

          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]} placement="bottomRight">
            <div className="tb-user" role="button" tabIndex={0}>
              <Avatar size={36} src={avatarSrc} icon={<UserOutlined />}>
                {!avatarSrc && initials(displayName)}
              </Avatar>
              <div className="tb-user-text tb-hide-sm">
                <span className="tb-user-name">{displayName}</span>
                <span className="tb-user-role"><Tag color={roleColor}>{roleLabel}</Tag></span>
              </div>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Modal
        title={<span><LockOutlined /> Change password</span>}
        open={passwordOpen}
        onCancel={() => { setPasswordOpen(false); passwordForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            label="Current password"
            name="currentPassword"
            rules={[{ required: true, message: "Enter your current password." }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: "Enter a new password." },
              { min: 8, message: "Password must be at least 8 characters." },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Confirm the new password." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("The two passwords do not match."));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setPasswordOpen(false); passwordForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={changingPassword}>Change password</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default Top;