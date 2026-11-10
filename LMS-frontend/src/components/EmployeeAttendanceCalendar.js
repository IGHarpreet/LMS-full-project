import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
  Alert,
  Empty,
  Typography,
  Button,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import axios from "axios";
import jwt_decode from "../utils/jwtSafe";
import moment from "moment";
import "../../src/AttendanceCalendar.css";

const { Title, Text } = Typography;

const AttendanceCalendar = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());

  // Fetch logged-in employee attendance
  const getLoggedAttendanceData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token1");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const decoded = jwt_decode(token);

      if (!decoded?._id) {
        throw new Error("Unable to identify the logged-in employee.");
      }

      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/attendance/singlemploy/${decoded._id}`
      );

      const attendance =
        res?.data?.SingleEmployeeAllAttendance || [];

      setDataSource(Array.isArray(attendance) ? attendance : []);
    } catch (err) {
      console.error("Error fetching attendance:", err);

      setDataSource([]);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to load attendance records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getLoggedAttendanceData();
  }, [getLoggedAttendanceData]);

  // Safely convert attendance date
  const getAttendanceDate = (item) => {
    if (!item?.TodayDate) return null;

    const date = moment(item.TodayDate);

    return date.isValid() ? date.format("YYYY-MM-DD") : null;
  };

  // Create a unique list of attendance dates
  const attendanceDates = useMemo(() => {
    return new Set(
      dataSource
        .map((item) => getAttendanceDate(item))
        .filter(Boolean)
    );
  }, [dataSource]);

  // Attendance records for the selected date
  const selectedAttendance = useMemo(() => {
    const selected = selectedDate.format("YYYY-MM-DD");

    return dataSource.filter(
      (item) => getAttendanceDate(item) === selected
    );
  }, [dataSource, selectedDate]);

  // Monthly attendance calculations
  const monthlyStats = useMemo(() => {
    const start = currentMonth.clone().startOf("month");
    const today = moment().startOf("day");

    // Do not count future dates
    const end = currentMonth
      .clone()
      .endOf("month")
      .isAfter(today)
      ? today
      : currentMonth.clone().endOf("month");

    let workingDays = 0;
    let presentDays = 0;

    if (!start.isAfter(end, "day")) {
      const date = start.clone();

      while (!date.isAfter(end, "day")) {
        // Sunday is excluded. Saturdays are counted as working days.
        if (date.day() !== 0) {
          workingDays++;

          if (attendanceDates.has(date.format("YYYY-MM-DD"))) {
            presentDays++;
          }
        }

        date.add(1, "day");
      }
    }

    const daysWithoutRecord = Math.max(workingDays - presentDays, 0);

    const percentage =
      workingDays > 0
        ? Math.round((presentDays / workingDays) * 100)
        : 0;

    return {
      workingDays,
      presentDays,
      daysWithoutRecord,
      percentage,
    };
  }, [currentMonth, attendanceDates]);

  // Check whether a particular date has attendance
  const isPresentDate = (value) => {
    return attendanceDates.has(value.format("YYYY-MM-DD"));
  };

  // Render complete calendar date cell
  const dateFullCellRender = (value) => {
    const isPresent = isPresentDate(value);
    const isToday = value.isSame(moment(), "day");
    const isSelected = value.isSame(selectedDate, "day");

    const isCurrentMonth = value.isSame(currentMonth, "month");

    return (
      <div
        className={[
          "ant-picker-calendar-date",
          "attendance-date",
          isPresent ? "attendance-present" : "",
          isToday ? "attendance-today" : "",
          isSelected ? "attendance-selected" : "",
          !isCurrentMonth ? "attendance-other-month" : "",
        ].join(" ")}
      >
        <div className="ant-picker-calendar-date-value">
          {value.date()}
        </div>

        <div className="ant-picker-calendar-date-content">
          {isPresent && (
            <span className="attendance-status">
              <CheckCircleOutlined />
              <span>Present</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  // Calendar date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Month navigation
  const handlePanelChange = (date) => {
    setCurrentMonth(date.clone());
    setSelectedDate(date.clone());
  };

  // Refresh attendance
  const handleRefresh = () => {
    getLoggedAttendanceData();
  };

  return (
    <div className="attendance-calendar-wrapper">
      <div className="attendance-calendar-header">
        <div>
          <Title level={3}>My Attendance</Title>
          <Text type="secondary">
            View your daily attendance records and monthly summary.
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          message="Attendance could not be loaded"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 20 }}
        />
      )}

      <Row gutter={[16, 16]} className="attendance-summary">
        <Col xs={12} sm={12} lg={6}>
          <Card className="attendance-stat-card">
            <Statistic
              title="Present Days"
              value={monthlyStats.presentDays}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary">This month</Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="attendance-stat-card">
            <Statistic
              title="Days Without Record"
              value={monthlyStats.daysWithoutRecord}
              prefix={<CalendarOutlined />}
            />
            <Text type="secondary">Past working days</Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="attendance-stat-card">
            <Statistic
              title="Working Days"
              value={monthlyStats.workingDays}
              prefix={<CalendarOutlined />}
            />
            <Text type="secondary">Sundays excluded</Text>
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <Card className="attendance-stat-card">
            <Statistic
              title="Attendance Rate"
              value={monthlyStats.percentage}
              suffix="%"
              prefix={<PercentageOutlined />}
            />
            <Text type="secondary">This month</Text>
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading} tip="Loading attendance...">
        <Card className="attendance-calendar-card">
          <div className="attendance-calendar-legend">
            <div>
              <span className="legend-dot present-dot" />
              <Text>Present</Text>
            </div>

            <div>
              <span className="legend-dot today-dot" />
              <Text>Today</Text>
            </div>

            <div>
              <span className="legend-dot absent-dot" />
              <Text>No attendance record</Text>
            </div>
          </div>

          <Calendar
            value={currentMonth}
            dateFullCellRender={dateFullCellRender}
            onSelect={handleDateSelect}
            onPanelChange={handlePanelChange}
          />

          <div className="attendance-note">
            <Text type="secondary">
              Note: Days without attendance records are not necessarily
              confirmed absences. Holidays and approved leave are not
              excluded because this calendar does not currently retrieve
              those records.
            </Text>
          </div>
        </Card>
      </Spin>

      {/* Selected date details */}
      <Card className="attendance-details-card">
        <div className="attendance-details-header">
          <div>
            <Title level={4}>Attendance Details</Title>
            <Text type="secondary">
              {selectedDate.format("dddd, DD MMMM YYYY")}
            </Text>
          </div>
        </div>

        {selectedAttendance.length > 0 ? (
          <div className="attendance-detail-content">
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Present
            </Tag>

            <Text>
              {selectedAttendance.length === 1
                ? "1 attendance record found."
                : `${selectedAttendance.length} attendance records found.`}
            </Text>

            {selectedAttendance.map((record, index) => (
              <div
                className="attendance-record-item"
                key={record._id || index}
              >
                <Text strong>
                  Attendance Record {index + 1}
                </Text>

                {record.eodoftheday && (
                  <div className="attendance-record-info">
                    <Text type="secondary">EOD Status: </Text>

                    <Tag
                      color={
                        record.eodoftheday.some(
                          (item) =>
                            String(item?.eod || "").toLowerCase() ===
                            "submitted"
                        )
                          ? "success"
                          : "default"
                      }
                    >
                      {record.eodoftheday
                        .map((item) => item?.eod)
                        .filter(Boolean)
                        .join(", ") || "Not available"}
                    </Tag>
                  </div>
                )}

                {Array.isArray(record.Breaks) && (
                  <div className="attendance-record-info">
                    <Text type="secondary">
                      Break records: {record.Breaks.length}
                    </Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No attendance record found for this date."
          />
        )}
      </Card>
    </div>
  );
};

export default AttendanceCalendar;