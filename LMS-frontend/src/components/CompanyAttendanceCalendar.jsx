
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  Calendar,
} from "antd";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import "../../src/CompanyAttendanceCalendar.css";
const { Title, Text } = Typography;
const { Option } = Select;

const BASE = process.env.REACT_APP_BASE_URL;

// Keep date-only strings in their original local calendar date.
// This avoids shifting YYYY-MM-DD dates because of UTC conversion.
const getDateKey = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (dateOnly) return dateOnly[0];
  }

  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const getEmployeeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getInitials = (name) => {
  return String(name || "Employee")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getRecordStatus = (record) => {
  if (!record) return "no-record";
  if (!record.CheckIn) return "no-checkin";
  if (!record.CheckOut) return "in-progress";
  return "completed";
};

const CompanyAttendanceCalendar = ({ onBack }) => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeError, setEmployeeError] = useState("");

  const [calendarMonth, setCalendarMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError("");
    setEmployeeError("");

    try {
      const [attendanceResult, employeeResult] = await Promise.allSettled([
        axios.get(`${BASE}/attendance`),
        axios.get(`${BASE}/user`),
      ]);

      if (attendanceResult.status === "fulfilled") {
        const rows = attendanceResult.value?.data?.attendanceData;
        setAttendance(Array.isArray(rows) ? rows : []);
      } else {
        setAttendance([]);
        throw attendanceResult.reason;
      }

      if (employeeResult.status === "fulfilled") {
        const rows = employeeResult.value?.data?.userData;

        const employeeList = Array.isArray(rows) ? rows : [];

        // The supplied user API uses "employee" and "admin" roles.
        // Exclude administrative accounts from the employee attendance roster.
        const onlyEmployees = employeeList.filter(
          (employee) =>
            String(employee?.role || "").toLowerCase() === "employee"
        );

        setEmployees(onlyEmployees);
      } else {
        setEmployees([]);
        setEmployeeError(
          "Employee list could not be loaded. Calendar attendance records are still available."
        );
      }
    } catch (err) {
      console.error("Company attendance calendar error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load company attendance. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Group attendance records by date.
  const attendanceByDate = useMemo(() => {
    const grouped = {};

    attendance.forEach((record) => {
      const dateKey = getDateKey(record?.TodayDate);
      if (!dateKey) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(record);
    });

    return grouped;
  }, [attendance]);

  // Return the attendance record for an employee on a particular date.
  const getEmployeeRecord = useCallback(
    (employee, records) => {
      const employeeId = getEmployeeId(employee?._id);
      const employeeName = String(employee?.name || "")
        .trim()
        .toLowerCase();

      const matchingRecords = records.filter((record) => {
        const recordEmployeeId = getEmployeeId(record?.emp_id);

        if (employeeId && recordEmployeeId) {
          return employeeId === recordEmployeeId;
        }

        const recordName = String(
          record?.name || record?.EmployeeName || ""
        )
          .trim()
          .toLowerCase();

        return employeeName && employeeName === recordName;
      });

      if (!matchingRecords.length) return null;

      // If duplicate records exist, prefer the one containing a check-in.
      return (
        matchingRecords.find((record) => record?.CheckIn) ||
        matchingRecords[0]
      );
    },
    []
  );

  // Build the employee-wise attendance list for the selected date.
  const selectedDayEmployees = useMemo(() => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const dayRecords = attendanceByDate[dateKey] || [];

    if (employees.length) {
      return employees.map((employee) => {
        const record = getEmployeeRecord(employee, dayRecords);

        return {
          key: employee._id,
          employeeId: employee._id,
          name: employee.name || "Unnamed employee",
          email: employee.email || "",
          contact: employee.contact || "",
          record,
          status: getRecordStatus(record),
        };
      });
    }

    // Fallback: still show all records if the employee API is unavailable.
    return dayRecords.map((record, index) => ({
      key: record?._id || `attendance-${index}`,
      employeeId: getEmployeeId(record?.emp_id),
      name: record?.name || record?.EmployeeName || "Unknown employee",
      email: "",
      contact: "",
      record,
      status: getRecordStatus(record),
    }));
  }, [
    selectedDate,
    attendanceByDate,
    employees,
    getEmployeeRecord,
  ]);

  const filteredEmployees = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return selectedDayEmployees.filter((employee) => {
      const matchesSearch =
        !search ||
        employee.name.toLowerCase().includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        employee.contact.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [selectedDayEmployees, searchText, statusFilter]);

  const stats = useMemo(() => {
    const total = selectedDayEmployees.length;

    const present = selectedDayEmployees.filter(
      (employee) =>
        employee.status === "completed" ||
        employee.status === "in-progress"
    ).length;

    const completed = selectedDayEmployees.filter(
      (employee) => employee.status === "completed"
    ).length;

    const inProgress = selectedDayEmployees.filter(
      (employee) => employee.status === "in-progress"
    ).length;

    const noCheckIn = selectedDayEmployees.filter(
      (employee) => employee.status === "no-checkin"
    ).length;

    const noRecord = selectedDayEmployees.filter(
      (employee) => employee.status === "no-record"
    ).length;

    return {
      total,
      present,
      completed,
      inProgress,
      noCheckIn,
      noRecord,
    };
  }, [selectedDayEmployees]);

  // Monthly attendance summary for the calendar heading.
  const monthStats = useMemo(() => {
    const monthStart = calendarMonth.clone().startOf("month");
    const monthEnd = calendarMonth.clone().endOf("month");

    let totalPresentRecords = 0;
    let totalAttendanceRecords = 0;

    Object.entries(attendanceByDate).forEach(([date, records]) => {
      const recordDate = moment(date, "YYYY-MM-DD");

      if (
        recordDate.isBetween(monthStart, monthEnd, "day", "[]")
      ) {
        totalAttendanceRecords += records.length;

        totalPresentRecords += records.filter(
          (record) => Boolean(record?.CheckIn)
        ).length;
      }
    });

    return {
      totalAttendanceRecords,
      totalPresentRecords,
    };
  }, [attendanceByDate, calendarMonth]);

  const getStatusTag = (status) => {
    switch (status) {
      case "completed":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Completed
          </Tag>
        );

      case "in-progress":
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            Checked in
          </Tag>
        );

      case "no-checkin":
        return (
          <Tag color="warning" icon={<CloseCircleOutlined />}>
            No check-in
          </Tag>
        );

      default:
        return <Tag color="default">No attendance record</Tag>;
    }
  };

  const renderCalendarCell = (date) => {
    const dateKey = date.format("YYYY-MM-DD");
    const records = attendanceByDate[dateKey] || [];

    const presentCount = records.filter(
      (record) => Boolean(record?.CheckIn)
    ).length;

    const completedCount = records.filter(
      (record) => record?.CheckIn && record?.CheckOut
    ).length;

    if (!records.length) return null;

    return (
      <div className="company-calendar-cell-content">
        <div className="company-calendar-cell-count">
          <span className="company-calendar-dot" />
          <span>{presentCount} present</span>
        </div>

        {completedCount > 0 && (
          <div className="company-calendar-cell-subtext">
            {completedCount} completed
          </div>
        )}
      </div>
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSearchText("");
    setStatusFilter("all");
  };

  const handleMonthChange = (date) => {
    setCalendarMonth(date);
    setSelectedDate(date);
    setSearchText("");
    setStatusFilter("all");
  };

  const handleToday = () => {
    const today = moment();
    setCalendarMonth(today);
    setSelectedDate(today);
    setSearchText("");
    setStatusFilter("all");
  };

  return (
    <div className="company-attendance-calendar-page">
      <div className="company-calendar-header">
        <div className="company-calendar-heading">
          <div className="company-calendar-heading-icon">
            <CalendarOutlined />
          </div>

          <div>
            <Title level={3}>Company Attendance Calendar</Title>
            <Text type="secondary">
              View and monitor attendance across all employees.
            </Text>
          </div>
        </div>

        <div className="company-calendar-header-actions">
          {onBack && (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Go back
            </Button>
          )}

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCalendarData}
            loading={loading}
          >
            Refresh
          </Button>

          <Button onClick={handleToday}>Today</Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          closable
          message="Attendance loading failed"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {employeeError && (
        <Alert
          type="warning"
          showIcon
          message={employeeError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[14, 14]} className="company-calendar-stats">
        <Col xs={12} sm={8} lg={4}>
          <Card className="company-calendar-stat-card">
            <Statistic
              title="Total employees"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card className="company-calendar-stat-card">
            <Statistic
              title="Present"
              value={stats.present}
              valueStyle={{ color: "#16a34a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card className="company-calendar-stat-card">
            <Statistic
              title="Completed"
              value={stats.completed}
              valueStyle={{ color: "#08916b" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card className="company-calendar-stat-card">
            <Statistic
              title="In progress"
              value={stats.inProgress}
              valueStyle={{ color: "#1677ff" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card className="company-calendar-stat-card">
            <Statistic
              title="No check-in"
              value={stats.noCheckIn}
              valueStyle={{ color: "#d97706" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card className="company-calendar-stat-card">
            <Statistic
              title="No record"
              value={stats.noRecord}
              valueStyle={{ color: "#64748b" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]} className="company-calendar-main-row">
        <Col xs={24} xl={14}>
          <Card className="company-calendar-main-card">
            <div className="company-calendar-card-heading">
              <div>
                <Title level={4}>
                  {calendarMonth.format("MMMM YYYY")}
                </Title>
                <Text type="secondary">
                  Select a date to view employee attendance.
                </Text>
              </div>

              <div className="company-calendar-month-summary">
                <span>{monthStats.totalPresentRecords} check-ins</span>
                <span>{monthStats.totalAttendanceRecords} records</span>
              </div>
            </div>

            <Spin spinning={loading}>
              <Calendar
                value={selectedDate}
                onSelect={handleDateSelect}
                onPanelChange={handleMonthChange}
                dateCellRender={renderCalendarCell}
              />
            </Spin>

            <div className="company-calendar-legend">
              <span>
                <i className="legend-dot legend-present" />
                Attendance recorded
              </span>
              <span>
                <i className="legend-dot legend-empty" />
                No attendance record
              </span>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card className="company-calendar-people-card">
            <div className="company-calendar-people-heading">
              <div>
                <Title level={4}>Daily attendance</Title>
                <Text type="secondary">
                  {selectedDate.format("dddd, DD MMMM YYYY")}
                </Text>
              </div>

              <Badge
                count={`${stats.present}/${stats.total}`}
                style={{ backgroundColor: "#1677ff" }}
              />
            </div>

            <div className="company-calendar-filters">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search employee..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
              >
                <Option value="all">All employees</Option>
                <Option value="completed">Completed</Option>
                <Option value="in-progress">Checked in</Option>
                <Option value="no-checkin">No check-in</Option>
                <Option value="no-record">No attendance record</Option>
              </Select>
            </div>

            <div className="company-calendar-employee-list">
              {loading ? (
                <div className="company-calendar-loading">
                  <Spin />
                  <Text type="secondary">Loading attendance...</Text>
                </div>
              ) : filteredEmployees.length ? (
                filteredEmployees.map((employee) => (
                  <div
                    className="company-calendar-employee"
                    key={employee.key}
                  >
                    <div className="company-calendar-employee-info">
                      <Avatar
                        className="company-calendar-avatar"
                        icon={<UserOutlined />}
                      >
                        {getInitials(employee.name)}
                      </Avatar>

                      <div className="company-calendar-employee-details">
                        <Text strong>{employee.name}</Text>

                        <Text type="secondary" className="employee-subtext">
                          {employee.email ||
                            employee.contact ||
                            "Employee"}
                        </Text>

                        {employee.record && (
                          <div className="company-calendar-times">
                            <span>
                              In: {employee.record.CheckIn || "—"}
                            </span>
                            <span>
                              Out: {employee.record.CheckOut || "—"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="company-calendar-employee-status">
                      {getStatusTag(employee.status)}
                    </div>
                  </div>
                ))
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    employees.length
                      ? "No employees match these filters."
                      : "No attendance records found for this date."
                  }
                />
              )}
            </div>

            <div className="company-calendar-list-footer">
              <Text type="secondary">
                Showing {filteredEmployees.length} of{" "}
                {selectedDayEmployees.length} employees
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CompanyAttendanceCalendar;
