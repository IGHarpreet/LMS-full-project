import React, { useState, useEffect, useMemo, useCallback } from "react";

import {
  Button,
  Input,
  Space,
  Table,
  DatePicker,
  Modal,
  Calendar,
  Badge,
  Typography,
  Popover,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Select,
  Alert,
  Empty,
  Tooltip,
} from "antd";

import {
  SearchOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import Highlighter from "react-highlight-words";
import axios from "axios";
import moment from "moment";
import { FcCalendar, FcViewDetails } from "react-icons/fc";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import "../../src/AdminAttendanceTable.css";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BASE = process.env.REACT_APP_BASE_URL;

// Convert time values safely
const parseAttendanceTime = (time) => {
  if (!time || typeof time !== "string") return null;

  const formats = [
    "h:mm:ss A",
    "hh:mm:ss A",
    "HH:mm:ss",
    "h:mm A",
    "hh:mm A",
    "HH:mm",
  ];

  const parsed = moment(time.trim(), formats, false);

  return parsed.isValid() ? parsed : null;
};

// Calculate duration between two time strings
const calculateDuration = (start, end) => {
  const startTime = parseAttendanceTime(start);
  const endTime = parseAttendanceTime(end);

  if (!startTime || !endTime) return "";

  let difference = endTime.diff(startTime);

  // Handle overnight shifts
  if (difference < 0) {
    difference += 24 * 60 * 60 * 1000;
  }

  const totalSeconds = Math.floor(difference / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
};

// Format attendance records without modifying API response objects
const prepareAttendanceRecords = (records) => {
  if (!Array.isArray(records)) return [];

  return records.map((record, index) => {
    const breaks = Array.isArray(record?.Breaks)
      ? record.Breaks.map((item, breakIndex) => ({
        ...item,
        key: item?._id || `${record?._id || index}-break-${breakIndex}`,
        timeconsume:
          item?.timeconsume ||
          calculateDuration(item?.start, item?.end),
      }))
      : [];

    const totalHours =
      record?.CheckIn && record?.CheckOut
        ? calculateDuration(record.CheckIn, record.CheckOut)
        : "";

    return {
      ...record,
      key: record?._id || `attendance-${index}`,
      Breaks: breaks,
      totalhours: record?.totalhours || totalHours,
    };
  });
};

const AttendanceTable = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");

  const [searchDate, setSearchDate] = useState("");
  const [searchColumnDate, setSearchColumnDate] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [vieweod, setViewEod] = useState([]);
  const [isModalOpenForEod, setIsModalOpenForEod] = useState(false);

  const [isopenmodal, setIsOpenModal] = useState(false);
  const [employeeCalendar, setEmployeeCalendar] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(moment());
  const [calendarEmployeeName, setCalendarEmployeeName] = useState("");

  // Fetch all attendance records
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${BASE}/attendance`);

      const records = prepareAttendanceRecords(
        res?.data?.attendanceData || []
      );

      setDataSource(records);
    } catch (err) {
      console.error("Error fetching attendance:", err);

      setDataSource([]);
      setError(
        err?.response?.data?.message ||
        "Unable to load attendance records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refresh and reset filters
  const handleRefresh = () => {
    setGlobalSearch("");
    setSearchText("");
    setSearchedColumn("");
    setSearchDate("");
    setSearchColumnDate("");
    setStatusFilter("all");
    fetchAllData();
  };

  // Attendance status
  const getAttendanceStatus = (record) => {
    if (!record?.CheckIn) return "not-checked-in";
    if (!record?.CheckOut) return "in-progress";
    return "completed";
  };

  // Summary cards
  const stats = useMemo(() => {
    const total = dataSource.length;

    const checkedIn = dataSource.filter(
      (record) => Boolean(record?.CheckIn)
    ).length;

    const completed = dataSource.filter(
      (record) =>
        Boolean(record?.CheckIn) && Boolean(record?.CheckOut)
    ).length;

    const inProgress = dataSource.filter(
      (record) =>
        Boolean(record?.CheckIn) && !record?.CheckOut
    ).length;

    const withoutCheckIn = dataSource.filter(
      (record) => !record?.CheckIn
    ).length;

    return {
      total,
      checkedIn,
      completed,
      inProgress,
      withoutCheckIn,
    };
  }, [dataSource]);

  // Apply global search and status filters
  const filteredData = useMemo(() => {
    let result = [...dataSource];

    if (globalSearch.trim()) {
      const search = globalSearch.trim().toLowerCase();

      result = result.filter((record) =>
        [
          record?.name,
          record?.EmployeeName,
          record?.TodayDate,
          record?.CheckIn,
          record?.CheckOut,
        ].some((value) =>
          String(value || "").toLowerCase().includes(search)
        )
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (record) => getAttendanceStatus(record) === statusFilter
      );
    }

    return result;
  }, [dataSource, globalSearch, statusFilter]);

  // Search by employee name using existing backend endpoint
  const handleSearch = async (
    selectedKeys,
    confirm,
    dataIndex
  ) => {
    confirm();

    const value = selectedKeys[0] || "";

    setSearchText(value);
    setSearchedColumn(dataIndex);

    if (!value.trim()) {
      fetchAllData();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BASE}/attendance`, {
        name: value,
      });

      setDataSource(
        prepareAttendanceRecords(
          res?.data?.attendanceDataByName || []
        )
      );
    } catch (err) {
      console.error("Error searching attendance:", err);

      setError(
        err?.response?.data?.message ||
        "Unable to search attendance records."
      );
    } finally {
      setLoading(false);
    }
  };

  // Employee name search dropdown
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div className="attendance-filter-dropdown">
        <Input
          autoFocus
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(event) =>
            setSelectedKeys(
              event.target.value ? [event.target.value] : []
            )
          }
          onPressEnter={() =>
            handleSearch(selectedKeys, confirm, dataIndex)
          }
        />

        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="small"
            onClick={() =>
              handleSearch(selectedKeys, confirm, dataIndex)
            }
          >
            Search
          </Button>

          <Button
            size="small"
            onClick={() => {
              clearFilters?.();
              setSearchText("");
              setSearchedColumn("");
              fetchAllData();
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),

    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),

    render: (text) =>
      searchedColumn === dataIndex && searchText ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#fff1b8",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? String(text) : ""}
        />
      ) : (
        text || "—"
      ),
  });

  // Date range search using existing backend endpoint
  const handleDateSearch = async (
    selectedKeys,
    confirm,
    dataIndex
  ) => {
    const range = selectedKeys[0];

    if (!range || !range[0] || !range[1]) {
      return;
    }

    confirm();

    setSearchColumnDate(dataIndex);
    setSearchDate(
      `${range[0].format("YYYY-MM-DD")} - ${range[1].format(
        "YYYY-MM-DD"
      )}`
    );

    const TodayDate = {
      Start: range[0].format("YYYY-MM-DD"),
      End: range[1].format("YYYY-MM-DD"),
    };

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BASE}/attendance`, {
        TodayDate,
      });

      setDataSource(
        prepareAttendanceRecords(
          res?.data?.AttendanceDataByDateRange || []
        )
      );
    } catch (err) {
      console.error("Error filtering attendance by date:", err);

      setError(
        err?.response?.data?.message ||
        "Unable to filter attendance by date."
      );
    } finally {
      setLoading(false);
    }
  };

  const columnSearch = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div className="attendance-filter-dropdown">
        <RangePicker
          value={selectedKeys[0]}
          onChange={(range) =>
            setSelectedKeys(range ? [range] : [])
          }
          format="YYYY-MM-DD"
          placeholder={["Start date", "End date"]}
        />

        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="small"
            onClick={() =>
              handleDateSearch(selectedKeys, confirm, dataIndex)
            }
          >
            Search
          </Button>

          <Button
            size="small"
            onClick={() => {
              clearFilters?.();
              setSearchDate("");
              setSearchColumnDate("");
              fetchAllData();
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),

    filterIcon: (filtered) => (
      <CalendarOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),

    render: (text) =>
      searchColumnDate === dataIndex && searchDate ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#fff1b8",
            padding: 0,
          }}
          searchWords={[searchDate]}
          autoEscape
          textToHighlight={text ? String(text) : ""}
        />
      ) : (
        text || "—"
      ),
  });

  // Open employee attendance calendar
  const getCalendarSingleRowData = async (record) => {
    setCalendarEmployeeName(
      `${record?.name || "Employee"}'s Attendance Record`
    );

    setCalendarLoading(true);
    setCalendarError("");
    setEmployeeCalendar([]);
    setCalendarMonth(moment());

    try {
      const res = await axios.get(
        `${BASE}/attendance/single/${record._id}`
      );

      const records = res?.data?.SingleAttendance;

      setEmployeeCalendar(
        Array.isArray(records) ? records : []
      );

      setIsOpenModal(true);
    } catch (err) {
      console.error("Error fetching employee calendar:", err);

      setCalendarError(
        err?.response?.data?.message ||
        "Unable to load this employee's attendance calendar."
      );

      setIsOpenModal(true);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleCancel = () => {
    setIsOpenModal(false);
    setEmployeeCalendar([]);
    setCalendarError("");
  };

  // Calendar date display
  const dateCellRender = (value) => {
    const dateKey = value.format("YYYY-MM-DD");

    const matchingRecords = employeeCalendar.filter((item) => {
      if (!item?.TodayDate) return false;

      return moment(item.TodayDate).isValid()
        ? moment(item.TodayDate).format("YYYY-MM-DD") === dateKey
        : false;
    });

    if (!matchingRecords.length) return null;

    return (
      <Popover
        title="Attendance"
        content={
          <div>
            {matchingRecords.map((item, index) => (
              <div key={item?._id || index}>
                <Text strong>
                  {item?.CheckIn || "No check-in"}
                </Text>
                {" — "}
                <Text>
                  {item?.CheckOut || "No check-out"}
                </Text>
              </div>
            ))}
          </div>
        }
      >
        <div className="attendance-calendar-present">
          <Badge status="success" text="Present" />
        </div>
      </Popover>
    );
  };

  // Open EOD details
  const showModalForEod = (record) => {
    setViewEod(
      Array.isArray(record?.eodoftheday)
        ? record.eodoftheday
        : []
    );

    setIsModalOpenForEod(true);
  };

  const handleCancelForEod = () => {
    setIsModalOpenForEod(false);
    setViewEod([]);
  };

  // EOD table columns
  const columnsforeod = [
    {
      title: "S. No.",
      width: "70px",
      render: (_, __, index) => index + 1,

    },
    {
      title: "Task",
      width: "350px",

      dataIndex: "eod",
      key: "eod",
      render: (value) => value || "—",
    },
    {
      title: "Time spent",
      width: "100px",

      dataIndex: "time spent",
      key: "time spent",
      render: (value) => value || "—",
    },
  ];

  // Break details columns
  const nestedColumns = [
    {
      title: "S. No.",
      key: "index",
      width: 75,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Break start",
      dataIndex: "start",
      key: "start",
      render: (value) => value || "—",
    },
    {
      title: "Break end",
      dataIndex: "end",
      key: "end",
      render: (value) => value || "—",
    },
    {
      title: "Duration",
      dataIndex: "timeconsume",
      key: "timeconsume",
      render: (value) => value || "In progress",
    },
  ];

  // Export only displayed records
  const exportRows = useMemo(() => {
    return filteredData.map((record) => ({
      Employee: record?.name || record?.EmployeeName || "",
      Date: record?.TodayDate || "",
      "Check-in": record?.CheckIn || "",
      "Check-out": record?.CheckOut || "",
      "Total hours": record?.totalhours || "",
      Status:
        getAttendanceStatus(record) === "completed"
          ? "Completed"
          : getAttendanceStatus(record) === "in-progress"
            ? "In Progress"
            : "Not Checked In",
      "Break count": record?.Breaks?.length || 0,
      "EOD tasks": record?.eodoftheday?.length || 0,
    }));
  }, [filteredData]);

  // Export PDF
  const downloadPdf = () => {
    if (!exportRows.length) {
      Modal.info({
        title: "No records to export",
        content: "There are no attendance records matching your filters.",
      });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.setFontSize(16);
      doc.text("Employee Attendance Report", 14, 15);

      doc.setFontSize(9);
      doc.text(
        `Generated: ${moment().format("DD MMM YYYY, hh:mm A")}`,
        14,
        22
      );

      doc.autoTable({
        startY: 28,
        theme: "grid",
        head: [
          [
            "Employee",
            "Date",
            "Check-in",
            "Check-out",
            "Total hours",
            "Status",
            "Breaks",
            "EOD tasks",
          ],
        ],
        body: exportRows.map((row) => [
          row.Employee,
          row.Date,
          row["Check-in"],
          row["Check-out"],
          row["Total hours"],
          row.Status,
          row["Break count"],
          row["EOD tasks"],
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [38, 50, 72],
        },
      });

      doc.save("EmployeeAttendanceReport.pdf");
    } catch (err) {
      console.error("PDF export error:", err);

      Modal.error({
        title: "PDF export failed",
        content:
          "Please check that jspdf and jspdf-autotable are installed correctly.",
      });
    }
  };

  // Export Excel
  const downloadExcel = () => {
    if (!exportRows.length) {
      Modal.info({
        title: "No records to export",
        content: "There are no attendance records matching your filters.",
      });
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Attendance Records"
      );

      XLSX.writeFile(
        workbook,
        "EmployeeAttendanceReport.xlsx"
      );
    } catch (err) {
      console.error("Excel export error:", err);

      Modal.error({
        title: "Excel export failed",
        content: "Unable to generate the Excel file.",
      });
    }
  };

  // Main attendance table
  const columns = [
    {
      title: "Employee Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      fixed: "left",
      ...getColumnSearchProps("name"),
      sorter: (a, b) =>
        String(a?.name || "").localeCompare(
          String(b?.name || "")
        ),
      render: (value) => (
        <Text strong className="tablerowtext">
          {value || "—"}
        </Text>
      ),
    },
    {
      title: "Check-in",
      dataIndex: "CheckIn",
      key: "CheckIn",
      width: 125,
      sorter: (a, b) =>
        String(a?.CheckIn || "").localeCompare(
          String(b?.CheckIn || "")
        ),
      render: (value) => (
        <Text className="tablerowtext">
          {value || "—"}
        </Text>
      ),
    },
    {
      title: "Check-out",
      dataIndex: "CheckOut",
      key: "CheckOut",
      width: 125,
      render: (value) => (
        <Text className="tablerowtext">
          {value || "—"}
        </Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "TodayDate",
      key: "TodayDate",
      width: 135,
      ...columnSearch("TodayDate"),
      sorter: (a, b) =>
        moment(a?.TodayDate).valueOf() -
        moment(b?.TodayDate).valueOf(),
      render: (value) => (
        <Text className="tablerowtext">
          {value
            ? moment(value).isValid()
              ? moment(value).format("DD MMM YYYY")
              : value
            : "—"}
        </Text>
      ),
    },
    {
      title: "Total Hours",
      dataIndex: "totalhours",
      key: "totalhours",
      width: 140,
      render: (value, record) => (
        <Popover
          title="Break Details"
          content={
            record?.Breaks?.length ? (
              <div className="attendance-break-popover">
                {record.Breaks.map((item, index) => (
                  <div
                    key={item.key || index}
                    className="attendance-break-item"
                  >
                    <Text strong>Break {index + 1}</Text>
                    <div>
                      <Text type="secondary">Start: </Text>
                      {item?.start || "—"}
                    </div>
                    <div>
                      <Text type="secondary">End: </Text>
                      {item?.end || "—"}
                    </div>
                    <div>
                      <Text type="secondary">Duration: </Text>
                      {item?.timeconsume || "In progress"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">No break records available.</Text>
            )
          }
        >
          <Button type="link" className="attendance-hours-link">
            {value || "In progress"}
          </Button>
        </Popover>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 145,
      filters: [
        { text: "Completed", value: "completed" },
        { text: "In progress", value: "in-progress" },
        { text: "Not checked in", value: "not-checked-in" },
      ],
      onFilter: (value, record) =>
        getAttendanceStatus(record) === value,
      render: (_, record) => {
        const status = getAttendanceStatus(record);

        if (status === "completed") {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Completed
            </Tag>
          );
        }

        if (status === "in-progress") {
          return (
            <Tag color="processing" icon={<ClockCircleOutlined />}>
              In progress
            </Tag>
          );
        }

        return (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            Not checked in
          </Tag>
        );
      },
    },
    {
      title: "Breaks",
      key: "breaks",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Badge
          count={record?.Breaks?.length || 0}
          showZero
          color="#64748b"
        />
      ),
    },
    {
      title: "EOD",
      key: "eod",
      width: 85,
      align: "center",
      render: (_, record) => (
        <Tooltip title="View End of Day tasks">
          <Button
            type="text"
            icon={<FcViewDetails size={23} />}
            onClick={() => showModalForEod(record)}
            aria-label="View EOD"
          />
        </Tooltip>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      width: 150,
      align: "center",
      filters: [
        { text: "Present", value: "present" },
        { text: "Not Checked In", value: "not-present" },
      ],
      onFilter: (value, record) => {
        const isPresent = Boolean(record?.CheckIn);

        return value === "present"
          ? isPresent
          : !isPresent;
      },
      render: (_, record) => {
        const isPresent = Boolean(record?.CheckIn);

        return (
          <Tooltip title="Click to view employee attendance calendar">
            <Button
              type="link"
              onClick={() => getCalendarSingleRowData(record)}
              className="attendance-status-button"
            >
              <Tag
                color={isPresent ? "success" : "default"}
                icon={
                  isPresent
                    ? <CheckCircleOutlined />
                    : <CloseCircleOutlined />
                }
              >
                {isPresent ? "Present" : "Not Checked In"}
              </Tag>
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div className="admin-attendance-page">
      <div className="admin-attendance-header">
        <div>
          <Title level={3}>Employee Attendance</Title>
          <Text type="secondary">
            Monitor employee check-ins, check-outs, breaks and daily reports.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            icon={<FilePdfOutlined />}
            onClick={downloadPdf}
            className="exportbtn"
          >
            Export PDF
          </Button>

          <Button
            icon={<FileExcelOutlined />}
            onClick={downloadExcel}
            className="exportbtn"
          >
            Export Excel
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Attendance data error"
          description={error}
          closable
          onClose={() => setError("")}
          style={{ marginBottom: 18 }}
        />
      )}

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="admin-attendance-stats">
        <Col xs={12} sm={12} lg={3}>
          <Card className="admin-attendance-stat">
            <Statistic
              title="Total Records"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={3}>
          <Card className="admin-attendance-stat">
            <Statistic
              title="Checked In"
              value={stats.checkedIn}
              valueStyle={{ color: "#16a34a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={3}>
          <Card className="admin-attendance-stat">
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={3}>
          <Card className="admin-attendance-stat">
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              valueStyle={{ color: "#1677ff" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} lg={3}>
          <Card className="admin-attendance-stat">
            <Statistic
              title="Without Check-in"
              value={stats.withoutCheckIn}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="admin-attendance-table-card">
        <div className="admin-attendance-toolbar">
          <div>
            <Title level={5}>Attendance Records</Title>
            <Text type="secondary">
              Track daily employee presence, check-in/out times, breaks and EOD reports.
              Click an attendance status to view the employee's calendar.
            </Text>
          </div>

          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search records..."
              value={globalSearch}
              onChange={(event) =>
                setGlobalSearch(event.target.value)
              }
              className="admin-attendance-global-search"
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="admin-attendance-status-filter"
            >
              <Option value="all">All statuses</Option>
              <Option value="completed">Completed</Option>
              <Option value="in-progress">In progress</Option>
              <Option value="not-checked-in">
                Not checked in
              </Option>
            </Select>
          </Space>
        </div>

        {(globalSearch || statusFilter !== "all" || searchDate) && (
          <div className="admin-attendance-active-filters">
            <Text type="secondary">
              Showing {filteredData.length} matching records
            </Text>

            <Button
              type="link"
              onClick={() => {
                setGlobalSearch("");
                setStatusFilter("all");
                setSearchText("");
                setSearchedColumn("");
                setSearchDate("");
                setSearchColumnDate("");
                fetchAllData();
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        <Table
          rowKey={(record) => record?._id || record?.key}
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          className="tabledash admin-attendance-table"
          scroll={{ x: 1150 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Total ${total} records`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No attendance records found."
              />
            ),
          }}
          expandable={{
            rowExpandable: () => true,

            expandedRowRender: (record) => (
              <div className="attendance-expanded-content">
                <div className="attendance-expanded-heading">
                  <Text strong>Break details</Text>
                  <Tag color="blue">
                    {record?.Breaks?.length || 0} breaks
                  </Tag>
                </div>

                <Table
                  columns={nestedColumns}
                  dataSource={record?.Breaks || []}
                  pagination={false}
                  rowKey="key"
                  size="small"
                  locale={{
                    emptyText: "No break records available.",
                  }}
                />

                {record?.eodoftheday?.length > 0 && (
                  <div className="attendance-expanded-eod">
                    <Text strong>End of Day tasks</Text>

                    <Table
                      columns={columnsforeod}
                      dataSource={record.eodoftheday}
                      pagination={false}
                      rowKey={(item, index) =>
                        item?._id || `${record?._id}-eod-${index}`
                      }
                      size="small"
                    />
                  </div>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {/* Employee attendance calendar modal */}
      <Modal
        title={calendarEmployeeName}
        open={isopenmodal}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
        ]}
        width="min(1000px, 94vw)"
        destroyOnClose
      >
        {calendarError && (
          <Alert
            type="error"
            showIcon
            message={calendarError}
            style={{ marginBottom: 15 }}
          />
        )}

        <div className="employee-attendance-calendar">
          <Calendar
            value={calendarMonth}
            onPanelChange={(date) => setCalendarMonth(date)}
            dateCellRender={dateCellRender}
          />
        </div>

        {calendarLoading && (
          <Text type="secondary">
            Loading employee attendance...
          </Text>
        )}
      </Modal>

      {/* EOD modal */}
      <Modal
        title="End of Day Report"
        open={isModalOpenForEod}
        onOk={handleCancelForEod}
        onCancel={handleCancelForEod}
        okText="Close"
        cancelButtonProps={{ style: { display: "none" } }}
        width={750}
      >
        <Table
          dataSource={vieweod}
          rowKey={(record, index) =>
            record?._id || `eod-${index}`
          }
          columns={columnsforeod}
          pagination={false}
          scroll={{ x: 500 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No EOD tasks submitted for this attendance record."
              />
            ),
          }}
        />
      </Modal>
    </div>
  );
};

export default AttendanceTable;