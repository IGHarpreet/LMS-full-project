
import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Input,
  Space,
  Table,
  DatePicker,
  Typography,
  Tag,
  Card,
  Row,
  Col,
  Select,
  message,
  Empty,
  Tooltip,
} from "antd";

import {
  SearchOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CoffeeOutlined,
} from "@ant-design/icons";

import Highlighter from "react-highlight-words";
import axios from "axios";
import moment from "moment";
import jwt_decode from "../utils/jwtSafe";

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import "../../src/EmployeeAttendanceTable.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const EmployeeAttendanceTable = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [eodFilter, setEodFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const [employeeId, setEmployeeId] = useState(null);

  // Check whether an EOD has been submitted
  const hasEOD = (record) => {
    return (
      Array.isArray(record?.eodoftheday) &&
      record.eodoftheday.some(
        (item) => item?.eod && String(item.eod).trim()
      )
    );
  };

  // Fetch original employee attendance
  const fetchEmployeeAttendance = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token1");

      if (!token) {
        message.error("Authentication token not found");
        return;
      }

      const decoded = jwt_decode(token);
      setEmployeeId(decoded?._id);

      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/attendance/singlemploy/${decoded._id}`
      );

      setDataSource(
        res?.data?.SingleEmployeeAllAttendance || []
      );
    } catch (error) {
      console.error("Attendance fetch error:", error);
      message.error("Unable to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeAttendance();
  }, []);

  // Date range search using existing API
  const Search = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning("Please select a start date and end date");
      return;
    }

    try {
      setLoading(true);

      const TodayDate = {
        Start: dateRange[0].format("YYYY-MM-DD"),
        End: dateRange[1].format("YYYY-MM-DD"),
      };

      const res = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/attendance`,
        { TodayDate }
      );

      setDataSource(
        res?.data?.AttendanceDataByDateRange || []
      );

      setDateFilterActive(true);
      message.success("Attendance records filtered successfully");
    } catch (error) {
      console.error("Date range search error:", error);
      message.error("Unable to filter attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Reset filters and reload original employee records
  const Reset = () => {
    setSearchText("");
    setEodFilter("all");
    setDateRange(null);
    setDateFilterActive(false);
    fetchEmployeeAttendance();
  };

  // Calculate time consumed
  const calculateTimeConsumed = (start, end) => {
    if (!start) return "N/A";

    const formats = [
      "h:mm:ss A",
      "hh:mm:ss A",
      "HH:mm:ss",
      "h:mm A",
      "hh:mm A",
      "HH:mm",
    ];

    const startTime = moment(start, formats, true);
    const endTime = end
      ? moment(end, formats, true)
      : moment();

    if (!startTime.isValid() || !endTime.isValid()) {
      return "N/A";
    }

    let duration = moment.duration(endTime.diff(startTime));

    // Handle overnight attendance
    if (duration.asMilliseconds() < 0 && end) {
      endTime.add(1, "day");
      duration = moment.duration(endTime.diff(startTime));
    }

    const totalSeconds = Math.max(
      0,
      Math.floor(duration.asSeconds())
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  // Convert time to seconds for summary calculations
  const getDurationSeconds = (start, end) => {
    if (!start || !end) return 0;

    const formats = [
      "h:mm:ss A",
      "hh:mm:ss A",
      "HH:mm:ss",
      "h:mm A",
      "hh:mm A",
      "HH:mm",
    ];

    const startTime = moment(start, formats, true);
    const endTime = moment(end, formats, true);

    if (!startTime.isValid() || !endTime.isValid()) {
      return 0;
    }

    if (endTime.isBefore(startTime)) {
      endTime.add(1, "day");
    }

    return Math.max(0, endTime.diff(startTime, "seconds"));
  };

  // Format total seconds
  const formatTotalDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  // Search highlighting
  const highlightText = (text) => {
    return (
      <Highlighter
        highlightStyle={{
          backgroundColor: "#ffe58f",
          padding: 0,
        }}
        searchWords={[searchText]}
        autoEscape
        textToHighlight={String(text || "N/A")}
      />
    );
  };

  // Filter attendance records
  const filteredData = useMemo(() => {
    return dataSource.filter((record) => {
      const search = searchText.trim().toLowerCase();

      const eodDescriptions = Array.isArray(record?.eodoftheday)
        ? record.eodoftheday
            .map((item) => item?.eod || "")
            .join(" ")
        : "";

      const matchesSearch =
        !search ||
        [
          record?.TodayDate,
          record?.CheckIn,
          record?.CheckOut,
          eodDescriptions,
        ].some((value) =>
          String(value || "").toLowerCase().includes(search)
        );

      const submitted = hasEOD(record);

      const matchesEOD =
        eodFilter === "all" ||
        (eodFilter === "submitted" && submitted) ||
        (eodFilter === "notSubmitted" && !submitted);

      return matchesSearch && matchesEOD;
    });
  }, [dataSource, searchText, eodFilter]);

  // Summary information
  const totalDays = filteredData.length;

  const submittedDays = filteredData.filter(
    (record) => hasEOD(record)
  ).length;

  const notSubmittedDays = totalDays - submittedDays;

  const totalWorkingSeconds = filteredData.reduce(
    (total, record) =>
      total +
      getDurationSeconds(record?.CheckIn, record?.CheckOut),
    0
  );

  const totalBreaks = filteredData.reduce(
    (total, record) =>
      total +
      (Array.isArray(record?.Breaks)
        ? record.Breaks.length
        : 0),
    0
  );

  // EOD table columns
  const eodColumns = [
    {
      title: "No.",
      key: "index",
      width: 60,
      render: (_, record, index) => index + 1,
    },
    {
      title: "Work Description",
      dataIndex: "eod",
      key: "eod",
      render: (text) => (
        <Text>{text || "N/A"}</Text>
      ),
    },
    {
      title: "Time Spent",
      dataIndex: "time spent",
      key: "timeSpent",
      width: 150,
      render: (text) => (
        <Tag color="blue">{text || "N/A"}</Tag>
      ),
    },
  ];

  // Break table columns
  const breakColumns = [
    {
      title: "No.",
      key: "index",
      width: 60,
      render: (_, record, index) => index + 1,
    },
    {
      title: "Start",
      dataIndex: "start",
      key: "start",
    },
    {
      title: "End",
      dataIndex: "end",
      key: "end",
    },
    {
      title: "Time Consumed",
      key: "timeconsumed",
      render: (_, record) => (
        <Tag color="orange">
          {calculateTimeConsumed(record.start, record.end)}
        </Tag>
      ),
    },
  ];

  // Main table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "TodayDate",
      key: "TodayDate",
      width: 145,
      sorter: (a, b) =>
        moment(a.TodayDate).valueOf() -
        moment(b.TodayDate).valueOf(),
      render: (text) => (
        <Space>
          <CalendarOutlined />
          {highlightText(
            moment(text).isValid()
              ? moment(text).format("DD MMM YYYY")
              : text
          )}
        </Space>
      ),
    },
    {
      title: "Check-in",
      dataIndex: "CheckIn",
      key: "CheckIn",
      width: 130,
      render: (text) => (
        <Text>
          {text ? highlightText(text) : "Not checked in"}
        </Text>
      ),
    },
    {
      title: "Check-out",
      dataIndex: "CheckOut",
      key: "CheckOut",
      width: 130,
      render: (text) => (
        <Text>
          {text ? highlightText(text) : "Not checked out"}
        </Text>
      ),
    },
    {
      title: "Working Time",
      key: "workingTime",
      width: 145,
      render: (_, record) => (
        <Tag color="blue" icon={<ClockCircleOutlined />}>
          {record?.CheckIn
            ? record?.CheckOut
              ? calculateTimeConsumed(
                  record.CheckIn,
                  record.CheckOut
                )
              : `${calculateTimeConsumed(
                  record.CheckIn,
                  null
                )} (In progress)`
            : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Breaks",
      key: "breaks",
      width: 95,
      render: (_, record) => (
        <Tag
          color={
            record?.Breaks?.length > 0 ? "orange" : "default"
          }
        >
          {Array.isArray(record?.Breaks)
            ? record.Breaks.length
            : 0}
        </Tag>
      ),
    },
    {
      title: "EOD Status",
      key: "EODStatus",
      width: 145,
      filters: [
        { text: "Submitted", value: "submitted" },
        { text: "Not Submitted", value: "notSubmitted" },
      ],
      onFilter: (value, record) =>
        value === "submitted"
          ? hasEOD(record)
          : !hasEOD(record),
      render: (_, record) =>
        hasEOD(record) ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Submitted
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Not Submitted
          </Tag>
        ),
    },
  ];

  // Export Excel
  const exportExcel = () => {
    if (!filteredData.length) {
      message.warning("No attendance records to export");
      return;
    }

    const exportData = filteredData.map((record) => ({
      Date: record.TodayDate
        ? moment(record.TodayDate).format("DD-MM-YYYY")
        : "",
      "Check-in": record.CheckIn || "",
      "Check-out": record.CheckOut || "",
      "Working Time":
        record.CheckIn && record.CheckOut
          ? calculateTimeConsumed(
              record.CheckIn,
              record.CheckOut
            )
          : "In progress",
      "EOD Status": hasEOD(record)
        ? "Submitted"
        : "Not Submitted",
      "EOD Work": Array.isArray(record.eodoftheday)
        ? record.eodoftheday
            .map((item) => item.eod || "")
            .join("; ")
        : "",
      "Break Count": Array.isArray(record.Breaks)
        ? record.Breaks.length
        : 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance"
    );

    XLSX.writeFile(
      workbook,
      `Employee_Attendance_${moment().format("YYYY-MM-DD")}.xlsx`
    );

    message.success("Excel file exported successfully");
  };

  // Export PDF
  const exportPDF = () => {
    if (!filteredData.length) {
      message.warning("No attendance records to export");
      return;
    }

    const doc = new jsPDF("landscape");

    doc.setFontSize(16);
    doc.text("Employee Attendance Report", 14, 15);

    doc.setFontSize(9);
    doc.text(
      `Generated on: ${moment().format("DD MMM YYYY, hh:mm A")}`,
      14,
      22
    );

    const rows = filteredData.map((record) => [
      record.TodayDate
        ? moment(record.TodayDate).format("DD-MM-YYYY")
        : "",
      record.CheckIn || "N/A",
      record.CheckOut || "N/A",
      record.CheckIn && record.CheckOut
        ? calculateTimeConsumed(
            record.CheckIn,
            record.CheckOut
          )
        : "In progress",
      hasEOD(record) ? "Submitted" : "Not Submitted",
      Array.isArray(record.Breaks)
        ? record.Breaks.length
        : 0,
    ]);

    doc.autoTable({
      startY: 28,
      head: [[
        "Date",
        "Check-in",
        "Check-out",
        "Working Time",
        "EOD Status",
        "Breaks",
      ]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [35, 49, 66],
      },
    });

    doc.save(
      `Employee_Attendance_${moment().format("YYYY-MM-DD")}.pdf`
    );

    message.success("PDF exported successfully");
  };

  return (
    <div className="employee-attendance-container">

      {/* Page heading */}
      <div className="attendance-page-heading">
        <div>
          <h2>My Attendance</h2>
          <p>
            Review your daily attendance, working hours, breaks
            and end-of-day work reports.
          </p>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={Reset}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="attendance-summary-row">

        <Col xs={12} sm={6}>
          <Card className="attendance-summary-card">
            <Text type="secondary">Attendance Days</Text>
            <h2>{totalDays}</h2>
            <CalendarOutlined className="attendance-summary-icon" />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="attendance-summary-card eod-submitted-card">
            <Text type="secondary">EOD Submitted</Text>
            <h2>{submittedDays}</h2>
            <CheckCircleOutlined className="attendance-summary-icon" />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="attendance-summary-card eod-missing-card">
            <Text type="secondary">EOD Missing</Text>
            <h2>{notSubmittedDays}</h2>
            <CloseCircleOutlined className="attendance-summary-icon" />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="attendance-summary-card working-time-card">
            <Text type="secondary">Total Working Time</Text>
            <h2>{formatTotalDuration(totalWorkingSeconds)}</h2>
            <ClockCircleOutlined className="attendance-summary-icon" />
          </Card>
        </Col>

      </Row>

      {/* Attendance history */}
      <div className="attendance-history-card">

        <div className="attendance-history-heading">
          <div>
            <h3>Attendance History</h3>
            <p>
              View daily attendance records and detailed work logs.
            </p>
          </div>

          <Space wrap>
            <Tooltip title="Export attendance to Excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportExcel}
                className="excel-export-btn"
              >
                Excel
              </Button>
            </Tooltip>

            <Tooltip title="Export attendance to PDF">
              <Button
                icon={<FilePdfOutlined />}
                onClick={exportPDF}
                className="pdf-export-btn"
              >
                PDF
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* Filters */}
        <div className="attendance-filters">

          <Input
            placeholder="Search date, time or EOD work..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="attendance-search"
          />

          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            format="YYYY-MM-DD"
            placeholder={["Start date", "End date"]}
            className="attendance-date-range"
            allowClear
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={Search}
            loading={loading}
          >
            Search
          </Button>

          <Select
            value={eodFilter}
            onChange={setEodFilter}
            className="attendance-eod-filter"
          >
            <Option value="all">All EOD Status</Option>
            <Option value="submitted">Submitted</Option>
            <Option value="notSubmitted">Not Submitted</Option>
          </Select>

          <Button onClick={Reset}>
            Reset
          </Button>

        </div>

        {dateFilterActive && (
          <div className="attendance-filter-info">
            <CalendarOutlined />
            Showing records for selected date range.
            <Button
              type="link"
              size="small"
              onClick={Reset}
            >
              Clear date range
            </Button>
          </div>
        )}

        {/* Main attendance table */}
        <Table
          dataSource={filteredData}
          rowKey={(record) =>
            record._id || record.TodayDate
          }
          columns={columns}
          loading={loading}
          scroll={{ x: 950 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} records`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No attendance records found"
              />
            ),
          }}
          expandable={{
            rowExpandable: () => true,

            expandedRowRender: (record) => (
              <div className="attendance-expanded-details">

                {/* EOD details */}
                <div className="attendance-detail-section">
                  <div className="attendance-detail-heading">
                    <h4>End-of-Day Work Details</h4>

                    {hasEOD(record) ? (
                      <Tag color="success">Submitted</Tag>
                    ) : (
                      <Tag color="error">Not Submitted</Tag>
                    )}
                  </div>

                  <Table
                    columns={eodColumns}
                    dataSource={record?.eodoftheday || []}
                    pagination={false}
                    rowKey={(item, index) =>
                      item._id || `${item.eod}-${index}`
                    }
                    locale={{
                      emptyText: "No EOD submitted for this day",
                    }}
                    size="small"
                  />
                </div>

                {/* Break details */}
                <div className="attendance-detail-section">
                  <div className="attendance-detail-heading">
                    <h4>
                      <CoffeeOutlined /> Break Details
                    </h4>

                    <Tag color="orange">
                      {record?.Breaks?.length || 0} Breaks
                    </Tag>
                  </div>

                  <Table
                    columns={breakColumns}
                    dataSource={record?.Breaks || []}
                    pagination={false}
                    rowKey={(item, index) =>
                      item._id || `${item.start}-${index}`
                    }
                    locale={{
                      emptyText: "No breaks recorded",
                    }}
                    size="small"
                  />
                </div>

              </div>
            ),
          }}
        />

      </div>
    </div>
  );
};

export default EmployeeAttendanceTable;
