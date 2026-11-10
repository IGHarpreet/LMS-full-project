import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import moment from "moment";
import {
  Calendar,
  Badge,
  Avatar,
  Card,
  Row,
  Col,
  Select,
  Input,
  Button,
  Tag,
  Empty,
  Spin,
  Alert,
  Tooltip,
  Space,
  Typography,
  Divider,
  Statistic,
  message,
  Popover,
} from "antd";

import {
  CalendarOutlined,
  UserOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import "antd/dist/antd.css";
import "../../src/AdminLeaveCalendar.css";

const { Text, Title } = Typography;
const { Option } = Select;

const BASE_URL = process.env.REACT_APP_BASE_URL;

const LeaveCalendar = () => {
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [calendarDate, setCalendarDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());

  const [searchText, setSearchText] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Handles YYYY-MM-DD values without accidentally shifting the date
  // because of timezone conversion.
  const parseLeaveDate = (value) => {
    if (!value) return null;

    if (typeof value === "string") {
      const dateOnly = value.substring(0, 10);

      if (moment(dateOnly, "YYYY-MM-DD", true).isValid()) {
        return moment(dateOnly, "YYYY-MM-DD");
      }
    }

    const parsed = moment(value);
    return parsed.isValid() ? parsed.startOf("day") : null;
  };

  const getStatus = (status) => {
    const value = String(status || "Pending").toLowerCase().trim();

    if (value === "approved" || value === "approve") {
      return "Approved";
    }

    if (
      value === "denied" ||
      value === "rejected" ||
      value === "declined"
    ) {
      return "Denied";
    }

    return "Pending";
  };

  const getStatusColor = (status) => {
    const normalized = getStatus(status);

    if (normalized === "Approved") return "success";
    if (normalized === "Denied") return "error";

    return "warning";
  };

  const getStatusTagColor = (status) => {
    const normalized = getStatus(status);

    if (normalized === "Approved") return "green";
    if (normalized === "Denied") return "red";

    return "orange";
  };

  const getInitials = (name) => {
    if (!name) return "NA";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const getLeaveDuration = (leave) => {
    if (leave.TotalDaysRequested !== undefined &&
        leave.TotalDaysRequested !== null &&
        leave.TotalDaysRequested !== "") {
      return `${leave.TotalDaysRequested} day(s)`;
    }

    if (leave.TotalHoursRequested !== undefined &&
        leave.TotalHoursRequested !== null &&
        leave.TotalHoursRequested !== "") {
      return `${leave.TotalHoursRequested} hour(s)`;
    }

    const start = parseLeaveDate(leave.LeaveDate);
    const end = parseLeaveDate(leave.ReturnDate);

    if (start && end) {
      return `${Math.max(end.diff(start, "days") + 1, 1)} day(s)`;
    }

    return "Not specified";
  };

  const formatDate = (date) => {
    const parsed = parseLeaveDate(date);
    return parsed ? parsed.format("DD MMM YYYY") : "Not specified";
  };

  const fetchLeaveData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${BASE_URL}/leave`);
      const data = response?.data?.leaveData;

      if (Array.isArray(data)) {
        setEmployeeLeaves(data);
      } else {
        setEmployeeLeaves([]);
      }
    } catch (err) {
      console.error("Error fetching leave data:", err);
      setError("Unable to load leave records. Please try again.");
      message.error("Unable to load leave records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  // Filter the records without changing the original API data.
  const filteredLeaves = useMemo(() => {
    return employeeLeaves.filter((leave) => {
      const employeeName = String(leave.EmployeeName || "").toLowerCase();
      const department = String(leave.Department || "").toLowerCase();
      const email = String(leave.EmployeeEmail || "").toLowerCase();
      const search = searchText.trim().toLowerCase();

      const matchesSearch =
        !search ||
        employeeName.includes(search) ||
        department.includes(search) ||
        email.includes(search);

      const matchesType =
        leaveTypeFilter === "all" ||
        String(leave.LeaveType || "").toLowerCase() ===
          leaveTypeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        getStatus(leave.ApprovalStatus) === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [employeeLeaves, searchText, leaveTypeFilter, statusFilter]);

  // Create a date-wise lookup so the calendar does not repeatedly scan
  // every leave record for every date cell.
  const leavesByDate = useMemo(() => {
    const lookup = {};

    filteredLeaves.forEach((leave) => {
      const start = parseLeaveDate(leave.LeaveDate);
      const end = parseLeaveDate(leave.ReturnDate) || start;

      if (!start || !end || end.isBefore(start, "day")) return;

      const current = start.clone();

      while (current.isSameOrBefore(end, "day")) {
        const dateKey = current.format("YYYY-MM-DD");

        if (!lookup[dateKey]) {
          lookup[dateKey] = [];
        }

        lookup[dateKey].push(leave);
        current.add(1, "day");
      }
    });

    return lookup;
  }, [filteredLeaves]);

  const selectedDateKey = selectedDate.format("YYYY-MM-DD");

  const selectedDateLeaves = leavesByDate[selectedDateKey] || [];

  // Monthly statistics count leave requests that overlap the displayed month.
  const monthlyLeaves = useMemo(() => {
    const monthStart = calendarDate.clone().startOf("month");
    const monthEnd = calendarDate.clone().endOf("month");

    return filteredLeaves.filter((leave) => {
      const start = parseLeaveDate(leave.LeaveDate);
      const end = parseLeaveDate(leave.ReturnDate) || start;

      if (!start || !end) return false;

      return (
        start.isSameOrBefore(monthEnd, "day") &&
        end.isSameOrAfter(monthStart, "day")
      );
    });
  }, [filteredLeaves, calendarDate]);

  const totalMonthly = monthlyLeaves.length;

  const pendingMonthly = monthlyLeaves.filter(
    (leave) => getStatus(leave.ApprovalStatus) === "Pending"
  ).length;

  const approvedMonthly = monthlyLeaves.filter(
    (leave) => getStatus(leave.ApprovalStatus) === "Approved"
  ).length;

  const deniedMonthly = monthlyLeaves.filter(
    (leave) => getStatus(leave.ApprovalStatus) === "Denied"
  ).length;

 const dateCellRender = (value) => {
  const dateKey = value.format("YYYY-MM-DD");
  const dayLeaves = leavesByDate[dateKey] || [];

  if (!dayLeaves.length) return null;

  const visibleLeaves = dayLeaves.slice(0, 3);
  const remainingCount = dayLeaves.length - visibleLeaves.length;

  return (
    <div className="admin-leave-calendar-cell">
      {visibleLeaves.map((leave, index) => {
        const status = getStatus(leave.ApprovalStatus);
        const statusClass = status.toLowerCase();

        return (
          <Popover
            key={`${leave._id || index}-popover`}
            placement="top"
            title={
              <span>
                {leave.EmployeeName || "Employee"} — {status}
              </span>
            }
            content={
              <div className="admin-leave-popover">
                <div className="admin-leave-popover-item">
                  <Text strong>
                    {leave.EmployeeName || "Employee"}
                  </Text>

                  <div>
                    {leave.Department || "Department not specified"}
                  </div>

                  <div>
                    <strong>Leave type:</strong>{" "}
                    {leave.LeaveType || "Not specified"}
                  </div>

                  <div>
                    <strong>From:</strong> {formatDate(leave.LeaveDate)}
                  </div>

                  <div>
                    <strong>Return:</strong> {formatDate(leave.ReturnDate)}
                  </div>

                  <div>
                    <strong>Duration:</strong> {getLeaveDuration(leave)}
                  </div>

                  <Tag color={getStatusTagColor(status)}>
                    {status}
                  </Tag>
                </div>
              </div>
            }
          >
            <div
              className={`admin-leave-calendar-event ${statusClass}`}
              title={`${leave.EmployeeName || "Employee"} - ${
                leave.LeaveType || "Leave"
              } - ${status}`}
            >
              <div className="admin-leave-event-top">
                <span className="admin-leave-event-avatar">
                  {getInitials(leave.EmployeeName).charAt(0)}
                </span>

                <span className="admin-leave-event-name">
                  {leave.EmployeeName || "Employee"}
                </span>
              </div>

              <div className="admin-leave-event-type">
                {leave.LeaveType || "Leave"}
              </div>

              <div className="admin-leave-event-status">
                {status}
              </div>
            </div>
          </Popover>
        );
      })}

      {remainingCount > 0 && (
        <div className="admin-leave-more">
          +{remainingCount} more
        </div>
      )}
    </div>
  );
};

  const handleDateSelect = (date) => {
    setSelectedDate(date.clone());
  };

  const handlePanelChange = (date) => {
    setCalendarDate(date.clone());
    setSelectedDate(date.clone());
  };

  const resetFilters = () => {
    setSearchText("");
    setLeaveTypeFilter("all");
    setStatusFilter("all");
  };

  const goToToday = () => {
    const today = moment();
    setCalendarDate(today);
    setSelectedDate(today);
  };

  const renderLeaveCard = (leave, index) => {
    const status = getStatus(leave.ApprovalStatus);

    return (
      <div
        className="admin-leave-detail-card"
        key={leave._id || `${leave.EmployeeName}-${index}`}
      >
        <div className="admin-leave-detail-top">
          <div className="admin-leave-employee">
            <Avatar className="admin-leave-avatar">
              {getInitials(leave.EmployeeName)}
            </Avatar>

            <div className="admin-leave-employee-info">
              <Text strong className="admin-leave-employee-name">
                {leave.EmployeeName || "Employee name unavailable"}
              </Text>

              <Text type="secondary" className="admin-leave-department">
                {leave.Department || "Department not specified"}
              </Text>
            </div>
          </div>

          <Tag color={getStatusTagColor(status)}>{status}</Tag>
        </div>

        <Divider className="admin-leave-card-divider" />

        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6}>
            <div className="admin-leave-info-label">Leave type</div>
            <Text strong>{leave.LeaveType || "Not specified"}</Text>
          </Col>

          <Col xs={12} sm={6}>
            <div className="admin-leave-info-label">From</div>
            <Text strong>{formatDate(leave.LeaveDate)}</Text>
          </Col>

          <Col xs={12} sm={6}>
            <div className="admin-leave-info-label">Return date</div>
            <Text strong>{formatDate(leave.ReturnDate)}</Text>
          </Col>

          <Col xs={12} sm={6}>
            <div className="admin-leave-info-label">Duration</div>
            <Text strong>{getLeaveDuration(leave)}</Text>
          </Col>
        </Row>

        {leave.Reason && (
          <div className="admin-leave-reason">
            <FileTextOutlined />
            <span>{leave.Reason}</span>
          </div>
        )}

        {leave.emp_id && (
          <div className="admin-leave-employee-id">
            Employee ID: {leave.emp_id}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-leave-page">
      {/* Page heading */}
      <div className="admin-leave-page-header">
        <div>
          <div className="admin-leave-heading-icon">
            <CalendarOutlined />
          </div>

          <div>
            <Title level={3} className="admin-leave-page-title">
              Leave Calendar
            </Title>

            <Text type="secondary">
              View and monitor leave schedules across all employees.
            </Text>
          </div>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchLeaveData}
            loading={loading}
          >
            Refresh
          </Button>

          <Button type="primary" onClick={goToToday}>
            Today
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          className="admin-leave-error"
          action={
            <Button size="small" onClick={fetchLeaveData}>
              Retry
            </Button>
          }
        />
      )}

      {/* Monthly summary */}
      <Row gutter={[16, 16]} className="admin-leave-summary">
        <Col xs={12} sm={12} md={6}>
          <Card className="admin-leave-stat-card">
            <Statistic
              title="Leave requests"
              value={totalMonthly}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">
              {calendarDate.format("MMMM YYYY")}
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card className="admin-leave-stat-card pending">
            <Statistic
              title="Pending"
              value={pendingMonthly}
              valueStyle={{ color: "#d48806" }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary">Awaiting approval</Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card className="admin-leave-stat-card approved">
            <Statistic
              title="Approved"
              value={approvedMonthly}
              valueStyle={{ color: "#389e0d" }}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary">Approved requests</Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card className="admin-leave-stat-card denied">
            <Statistic
              title="Denied"
              value={deniedMonthly}
              valueStyle={{ color: "#cf1322" }}
              prefix={<CloseCircleOutlined />}
            />
            <Text type="secondary">Denied requests</Text>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="admin-leave-filter-card">
        <div className="admin-leave-filter-heading">
          <div>
            <Title level={5}>Find leave records</Title>
            <Text type="secondary">
              Filter the calendar by employee, leave type, or approval status.
            </Text>
          </div>

          <Button type="link" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={10} lg={10}>
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search employee or department"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={12} md={7} lg={7}>
            <Select
              size="large"
              value={leaveTypeFilter}
              onChange={setLeaveTypeFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All leave types</Option>
              <Option value="casual">Casual</Option>
              <Option value="priviliege">Privilege</Option>
              <Option value="privilege">Privilege</Option>
              <Option value="sick">Sick</Option>
            </Select>
          </Col>

          <Col xs={12} md={7} lg={7}>
            <Select
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All statuses</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Denied">Denied</Option>
            </Select>
          </Col>
        </Row>

        <div className="admin-leave-filter-result">
          Showing <strong>{filteredLeaves.length}</strong> of{" "}
          <strong>{employeeLeaves.length}</strong> leave requests
        </div>
      </Card>

      {/* Calendar */}
      <Card className="admin-leave-calendar-card">
        <div className="admin-leave-calendar-heading">
          <div>
            <Title level={5}>Employee leave schedule</Title>
            <Text type="secondary">
              Select a date to view the employees who are on leave.
            </Text>
          </div>
        </div>

        <div className="admin-leave-legend">
          <span>
            <Badge status="success" /> Approved
          </span>
          <span>
            <Badge status="warning" /> Pending
          </span>
          <span>
            <Badge status="error" /> Denied
          </span>
        </div>

        <Spin spinning={loading}>
          <Calendar
            value={calendarDate}
            dateCellRender={dateCellRender}
            onSelect={handleDateSelect}
            onPanelChange={handlePanelChange}
          />
        </Spin>
      </Card>

      {/* Selected date details */}
      <Card className="admin-leave-selected-card">
        <div className="admin-leave-selected-header">
          <div>
            <Title level={5}>
              Leave details
            </Title>

            <Text type="secondary">
              {selectedDate.format("dddd, DD MMMM YYYY")}
            </Text>
          </div>

          <Tag color="blue">
            {selectedDateLeaves.length} employee
            {selectedDateLeaves.length === 1 ? "" : "s"} on leave
          </Tag>
        </div>

        {loading ? (
          <div className="admin-leave-loading">
            <Spin />
          </div>
        ) : selectedDateLeaves.length > 0 ? (
          <div className="admin-leave-detail-list">
            {selectedDateLeaves.map(renderLeaveCard)}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No leave records for this date"
          />
        )}
      </Card>
    </div>
  );
};

export default LeaveCalendar;