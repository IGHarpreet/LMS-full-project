import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";

import {
  Avatar,
  Badge,
  Button,
  Calendar,
  Dropdown,
  Popover,
  Table,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Alert,
  Tag,
  Empty,
  Space,
} from "antd";

import {
  DownOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

import axios from "axios";
import moment from "moment";

import DashboardCards from "./DashboardCards";
import LeaveCards from "./LeaveCards";
import Clock from "./Clock";
import PageHeader from "./PageHeader";
import { getUser } from "../utils/auth";

import "../../src/Dashboard.css";

const { Text } = Typography;
const { Option } = Select;

const BASE = process.env.REACT_APP_BASE_URL;

const Dashboard = () => {
  const user = getUser() || {};
  const isEmployee = user.role === "employee";

  const [todayRows, setTodayRows] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidayError, setHolidayError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
const [selectedHolidayDate, setSelectedHolidayDate] = useState(moment());
  // Fetch today's attendance for admin / HR
  const fetchTodayAttendance = useCallback(async () => {
    if (isEmployee) return;

    setLoadingToday(true);
    setAttendanceError("");

    try {
      const res = await axios.get(
        `${BASE}/attendance/todayattendance`
      );

      const records = res?.data?.todayAttendance;

      setTodayRows(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);

      setAttendanceError(
        error?.response?.data?.message ||
        "Unable to load today's attendance. Please try again."
      );
    } finally {
      setLoadingToday(false);
    }
  }, [isEmployee]);

  // Fetch Google Calendar holidays

  const fetchHolidays = useCallback(async () => {
    setLoadingHolidays(true);
    setHolidayError("");

    try {
      const [googleResult, localResult] = await Promise.allSettled([
        axios.get(`${BASE}/holiday/allindianholidays`),
        axios.get(`${BASE}/holiday`),
      ]);

      let googleEvents = [];
      let localHolidays = [];

      // Google Calendar events
      if (googleResult.status === "fulfilled") {
        const data = googleResult.value?.data?.googleevents;
        googleEvents = Array.isArray(data) ? data : [];
      } else {
        console.error(
          "Google Calendar events error:",
          googleResult.reason
        );
      }

      // MongoDB holidays
      if (localResult.status === "fulfilled") {
        const data = localResult.value?.data?.HolidaysPending;
        localHolidays = Array.isArray(data) ? data : [];
      } else {
        console.error(
          "MongoDB holidays error:",
          localResult.reason
        );
      }

      // Convert MongoDB holidays to Google Calendar-like events
      const formattedLocalHolidays = localHolidays
        .filter((holiday) => holiday?.festivalDate)
        .map((holiday) => ({
          id: holiday._id,
          summary: holiday.festival || "Company Holiday",
          description: "Company holiday",
          start: {
            date: moment(
              holiday.festivalDate
            ).format("YYYY-MM-DD"),
          },
          source: "database",
        }));

      // Combine both sources
      const combinedEvents = [
        ...googleEvents,
        ...formattedLocalHolidays,
      ];

      // Remove duplicate IDs
      const uniqueEvents = Array.from(
        new Map(
          combinedEvents.map((event, index) => [
            event.id || `${event.summary}-${index}`,
            event,
          ])
        ).values()
      );

      setHolidays(uniqueEvents);

      // Show an error only when both sources fail
      if (
        googleResult.status === "rejected" &&
        localResult.status === "rejected"
      ) {
        setHolidayError(
          "Unable to load Google Calendar events or company holidays."
        );
      } else if (
        googleResult.status === "rejected" &&
        localResult.status === "fulfilled"
      ) {
        setHolidayError(
          "Google Calendar is unavailable. Showing company holidays from the database."
        );
      } else if (
        localResult.status === "rejected" &&
        googleResult.status === "fulfilled"
      ) {
        setHolidayError(
          "Company holiday database is unavailable. Showing Google Calendar events."
        );
      } else if (uniqueEvents.length === 0) {
        setHolidayError(
          "No holidays or events are available. Add company holidays or configure your Google Calendar."
        );
      } else {
        setHolidayError("");
      }
    } catch (error) {
      console.error("Holiday loading error:", error);
      setHolidayError("Unable to load events and holidays.");
    } finally {
      setLoadingHolidays(false);
    }
  }, []);


  useEffect(() => {
    fetchHolidays();

    if (!isEmployee) {
      fetchTodayAttendance();
    }
  }, [isEmployee, fetchHolidays, fetchTodayAttendance]);

  // Refresh dashboard data
  const handleRefresh = () => {
    fetchHolidays();

    if (!isEmployee) {
      fetchTodayAttendance();
    }
  };

  // Convert Google Calendar event date into YYYY-MM-DD

  const getHolidayDate = (holiday) => {
    const date =
      holiday?.start?.date ||
      holiday?.start?.dateTime ||
      holiday?.festivalDate;

    if (!date) return null;

    // Preserve all-day dates without timezone shifting
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return moment(date, "YYYY-MM-DD", true).isValid()
        ? date
        : null;
    }

    const parsed = moment(date);

    return parsed.isValid()
      ? parsed.format("YYYY-MM-DD")
      : null;
  };


  // Find holidays for a particular calendar date
  const getHolidaysForDate = (value) => {
    const dateKey = value.format("YYYY-MM-DD");

    return holidays.filter(
      (holiday) => getHolidayDate(holiday) === dateKey
    );
  };

  // Calendar holiday display
  // Calendar holiday display
  const dateCellRender = (value) => {
  const events = getHolidaysForDate(value);

  if (!events.length) return null;

  return (
    <div className="dashboard-calendar-event-indicators">
      <div className="dashboard-calendar-dots">
        {events.slice(0, 3).map((event, index) => (
          <span
            key={event?.id || `${index}-${event?.summary}`}
            className={`dashboard-event-dot ${
              event?.source === "database"
                ? "company-event-dot"
                : "google-event-dot"
            }`}
          />
        ))}
      </div>

      <span className="dashboard-calendar-event-count">
        {events.length} {events.length === 1 ? "event" : "events"}
      </span>
    </div>
  );
};
const selectedDateEvents = getHolidaysForDate(selectedHolidayDate);
  // Holiday calendar dropdown
  const holidayMenu = {
    items: [
      {
        key: "calendar",
        label: (
          <div
            className="dashboard-holiday-calendar"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dashboard-holiday-calendar-heading">
              <Text strong>Company holidays & events</Text>
              {loadingHolidays && (
                <Badge status="processing" text="Updating" />
              )}
            </div>

            {holidayError && (
              <Alert
                type="warning"
                showIcon
                message={holidayError}
                style={{ marginBottom: 10 }}
              />
            )}

            <Calendar
  fullscreen={false}
  dateCellRender={dateCellRender}
  value={selectedHolidayDate}
  onSelect={(date) => setSelectedHolidayDate(date.clone())}
/>

{/* Selected date event details */}
<div className="dashboard-selected-holiday-events">
  <div className="dashboard-selected-holiday-heading">
    <Text strong>
      Events on {selectedHolidayDate.format("DD MMMM YYYY")}
    </Text>

    <Tag color={selectedDateEvents.length ? "blue" : "default"}>
      {selectedDateEvents.length}{" "}
      {selectedDateEvents.length === 1 ? "event" : "events"}
    </Tag>
  </div>

  {selectedDateEvents.length > 0 ? (
    selectedDateEvents.map((event, index) => (
      <div
        key={event?.id || `${event?.summary}-${index}`}
        className="dashboard-selected-event-item"
      >
        <span
          className={`dashboard-event-dot ${
            event?.source === "database"
              ? "company-event-dot"
              : "google-event-dot"
          }`}
        />

        <div className="dashboard-holiday-event-info">
          <Text strong className="dashboard-holiday-event-name">
            {event?.summary || "Holiday"}
          </Text>

          <Text
            type="secondary"
            className="dashboard-holiday-event-source"
          >
            {event?.source === "database"
              ? "Company holiday"
              : "Calendar event"}
          </Text>
        </div>
      </div>
    ))
  ) : (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="No events scheduled for this date."
    />
  )}
</div>

            <Text type="secondary" className="holiday-calendar-note">
              Select a date to view the events marked on the calendar.
            </Text>
          </div>
        ),
      },
    ],
  };

const holidayButton = (
  <Dropdown
    menu={holidayMenu}
    trigger={["click"]}
    placement="bottomRight"
    overlayClassName="dashboard-holiday-dropdown"
    mouseEnterDelay={0}
    mouseLeaveDelay={0}
  >
    <Button icon={<CalendarOutlined />}>
      Events &amp; holidays <DownOutlined />
    </Button>
  </Dropdown>
);

  // Attendance statistics
  const attendanceStats = useMemo(() => {
    const present = todayRows.filter(
      (record) => record?.CheckIn
    );

    const withoutCheckIn = todayRows.filter(
      (record) => !record?.CheckIn
    );

    return {
      totalRecords: todayRows.length,
      present: present.length,
      withoutCheckIn: withoutCheckIn.length,
    };
  }, [todayRows]);

  // Search and status filtering
  const filteredRows = useMemo(() => {
    let result = [...todayRows];

    if (searchText.trim()) {
      const search = searchText.trim().toLowerCase();

      result = result.filter((record) =>
        String(record?.name || "")
          .toLowerCase()
          .includes(search)
      );
    }

    if (statusFilter === "present") {
      result = result.filter((record) => record?.CheckIn);
    } else if (statusFilter === "not-checked-in") {
      result = result.filter((record) => !record?.CheckIn);
    }

    return result;
  }, [todayRows, searchText, statusFilter]);

  // Attendance table columns
  const columns = [
    {
      title: "",
      dataIndex: "myprofilepic",
      key: "pic",
      width: 65,
      render: (pic) =>
        pic ? (
          <Avatar src={`${BASE}/images/${pic}`} />
        ) : (
          <Avatar icon={<UserOutlined />} />
        ),
    },
    {
      title: "Employee Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) =>
        String(a?.name || "").localeCompare(
          String(b?.name || "")
        ),
      render: (name) => (
        <Text strong>{name || "Unknown employee"}</Text>
      ),
    },
    {
      title: "Check-in",
      dataIndex: "CheckIn",
      key: "CheckIn",
      render: (value) =>
        value ? (
          <Text>{value}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Attendance Status",
      key: "status",
      filters: [
        { text: "Present", value: "present" },
        { text: "Not checked in", value: "not-checked-in" },
      ],
      onFilter: (value, record) =>
        value === "present"
          ? Boolean(record?.CheckIn)
          : !record?.CheckIn,
      render: (_, record) =>
        record?.CheckIn ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Present
          </Tag>
        ) : (
          <Tag color="default" icon={<ClockCircleOutlined />}>
            Not checked in
          </Tag>
        ),
    },
  ];

  // Employee dashboard
  if (isEmployee) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-top-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loadingHolidays}
          >
            Refresh
          </Button>

          {holidayButton}
        </div>

        {holidayError && (
          <Alert
            type="warning"
            showIcon
            message={holidayError}
            style={{ marginBottom: 16 }}
          />
        )}

        <Clock />
        <LeaveCards />
      </div>
    );
  }

  // Admin / HR dashboard
  return (
    <div className="dashboard-page">
      <PageHeader
        title={`Welcome back, ${user.name || "there"}`}
        subtitle="Here’s what’s happening across the company today."
        extra={
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loadingToday || loadingHolidays}
            >
              Refresh
            </Button>
            {holidayButton}
          </Space>
        }
      />

      {/* Existing dashboard cards are preserved */}
      <DashboardCards />

      {attendanceError && (
        <Alert
          message="Attendance data unavailable"
          description={attendanceError}
          type="error"
          showIcon
          closable
          onClose={() => setAttendanceError("")}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Today's attendance summary */}
      <Row gutter={[16, 16]} className="dashboard-live-stats">
        <Col xs={12} sm={8}>
          <Card className="dashboard-live-stat-card">
            <Statistic
              title="Present Today"
              value={attendanceStats.present}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#16a34a" }}
            />
            <Text type="secondary">
              Employees with a check-in record
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card className="dashboard-live-stat-card">
            <Statistic
              title="Without Check-in"
              value={attendanceStats.withoutCheckIn}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#64748b" }}
            />
            <Text type="secondary">
              Records returned without check-in
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={8}>
          <Card className="dashboard-live-stat-card">
            <Statistic
              title="Attendance Records"
              value={attendanceStats.totalRecords}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">
              Records returned for today
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Today's employee attendance table */}
      <Card className="dashboard-attendance-panel">
        <div className="dashboard-panel-header">
          <div>
            <div className="dashboard-panel-title">
              <TeamOutlined />
              <span>Today's attendance</span>
              <Badge
                count={attendanceStats.present}
                showZero
                style={{ backgroundColor: "#12a06a" }}
              />
            </div>

            <Text type="secondary">
              {moment().format("dddd, DD MMMM YYYY")}
            </Text>
          </div>

          <Tag color="blue">
            {filteredRows.length} records
          </Tag>
        </div>

        <div className="dashboard-table-filters">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search employee by name..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            className="dashboard-search-input"
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="dashboard-status-filter"
          >
            <Option value="all">All records</Option>
            <Option value="present">Present</Option>
            <Option value="not-checked-in">
              Not checked in
            </Option>
          </Select>
        </div>

        <Table
          rowKey={(record, index) =>
            record?._id || `${record?.name || "employee"}-${index}`
          }
          dataSource={filteredRows}
          columns={columns}
          loading={loadingToday}
          pagination={{
            pageSize: 8,
            hideOnSinglePage: true,
            showSizeChanger: true,
            pageSizeOptions: ["8", "15", "25", "50"],
            showTotal: (total) => `Total ${total} records`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchText || statusFilter !== "all"
                    ? "No matching attendance records found."
                    : "No attendance records available for today."
                }
              />
            ),
          }}
          className="tabledash dashboard-attendance-table"
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;