
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  FilterOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "../../src/LeaveTable.css";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const BASE_URL = process.env.REACT_APP_BASE_URL;

const LeaveTable = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [reason, setReason] = useState("");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  // --------------------------------------------------
  // Fetch all leave requests
  // --------------------------------------------------

  const getData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${BASE_URL}/leave`);
      const records = response.data?.leaveData;

      setDataSource(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Leave data error:", error);
      message.error(
        error.response?.data?.message || "Unable to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getStatus = (status) => {
    if (!status) return "Pending";

    const normalized = status.toLowerCase();

    if (normalized === "approved") return "Approved";
    if (normalized === "denied" || normalized === "rejected") return "Denied";
    if (normalized === "pending") return "Pending";

    return status;
  };

  const getStatusColor = (status) => {
    const value = getStatus(status);

    if (value === "Approved") return "success";
    if (value === "Denied") return "error";

    return "warning";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const parsed = moment(value);
    return parsed.isValid() ? parsed.format("DD MMM YYYY") : value;
  };

  const getEmployeeInitials = (name = "") => {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };
  const getAppliedDate = (record) => {
    return (
      record?.AppliedOn ||
      record?.AppliedDate ||
      record?.createdAt ||
      record?.CreatedAt ||
      null
    );
  };
  const getDuration = (record) => {
    if (record.TotalDaysRequested !== undefined &&
      record.TotalDaysRequested !== null &&
      record.TotalDaysRequested !== "") {
      return `${record.TotalDaysRequested} ${Number(record.TotalDaysRequested) === 1 ? "day" : "days"
        }`;
    }

    if (record.TotalHoursRequested !== undefined &&
      record.TotalHoursRequested !== null &&
      record.TotalHoursRequested !== "") {
      return `${record.TotalHoursRequested} ${Number(record.TotalHoursRequested) === 1 ? "hour" : "hours"
        }`;
    }

    return "—";
  };

  // --------------------------------------------------
  // Search employee using existing backend API
  // --------------------------------------------------

  const handleEmployeeSearch = async () => {
    const value = searchText.trim();

    if (!value) {
      getData();
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${BASE_URL}/leave/dateRange`, {
        EmployeeName: value,
      });

      const records = response.data?.LeaveDataByName;
      setDataSource(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Employee leave search error:", error);
      message.error("Unable to search leave requests.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Search by leave date range using existing API
  // --------------------------------------------------

  const handleDateSearch = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning("Please select both start and end dates.");
      return;
    }

    try {
      setLoading(true);

      const LeaveDate = {
        Start: dateRange[0].format("YYYY-MM-DD"),
        End: dateRange[1].format("YYYY-MM-DD"),
      };

      const response = await axios.post(`${BASE_URL}/leave/dateRange`, {
        LeaveDate,
      });

      const records = response.data?.LeaveDataByDateRange;
      setDataSource(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Leave date search error:", error);
      message.error("Unable to filter leave requests by date.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Clear all filters and reload
  // --------------------------------------------------

  const resetFilters = () => {
    setSearchText("");
    setDateRange(null);
    setLeaveTypeFilter("all");
    setStatusFilter("all");
    getData();
  };

  // --------------------------------------------------
  // Summary counts
  // --------------------------------------------------

  const pendingCount = dataSource.filter(
    (item) => getStatus(item.ApprovalStatus) === "Pending"
  ).length;

  const approvedCount = dataSource.filter(
    (item) => getStatus(item.ApprovalStatus) === "Approved"
  ).length;

  const deniedCount = dataSource.filter(
    (item) => getStatus(item.ApprovalStatus) === "Denied"
  ).length;

  const totalDays = dataSource.reduce((total, item) => {
    const value = Number(item.TotalDaysRequested);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);

  // --------------------------------------------------
  // Local filters
  // --------------------------------------------------

const filteredData = useMemo(() => {
  const getRecordTimestamp = (record) => {
    const appliedDate = getAppliedDate(record);

    if (appliedDate) {
      const timestamp = moment(appliedDate).valueOf();

      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }

    // Fallback: extract creation timestamp from MongoDB ObjectId
    const id = String(record?._id || "");

    if (/^[a-fA-F0-9]{24}$/.test(id)) {
      return parseInt(id.substring(0, 8), 16) * 1000;
    }

    return 0;
  };

  return dataSource
    .filter((record) => {
      const search = searchText.trim().toLowerCase();

      const matchesSearch =
        !search ||
        record.EmployeeName?.toLowerCase().includes(search) ||
        record.Department?.toLowerCase().includes(search) ||
        record.LeaveType?.toLowerCase().includes(search) ||
        record.Reason?.toLowerCase().includes(search);

      const matchesType =
        leaveTypeFilter === "all" ||
        record.LeaveType?.toLowerCase() === leaveTypeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        getStatus(record.ApprovalStatus) === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort(
      (a, b) => getRecordTimestamp(b) - getRecordTimestamp(a)
    );
}, [dataSource, searchText, leaveTypeFilter, statusFilter]);
  // --------------------------------------------------
  // Open approval/rejection modal
  // --------------------------------------------------

  const showModal = (record, status) => {
    setSelectedRecord(record);
    setSelectedStatus(status);
    setReason("");
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    if (!actionLoading) {
      setIsModalOpen(false);
      setSelectedRecord(null);
      setSelectedStatus("");
      setReason("");
    }
  };

  // --------------------------------------------------
  // Approve / deny leave
  // Preserve existing backend payload
  // --------------------------------------------------

  const handleOk = async () => {
    if (!selectedRecord?._id) {
      message.error("Leave request not found.");
      return;
    }

    if (!selectedStatus) {
      message.error("Please select an action.");
      return;
    }

    if (!reason.trim()) {
      message.warning("Please provide a reason before submitting.");
      return;
    }

    try {
      setActionLoading(true);

      const payload = {
        ApprovalStatus: selectedStatus,
        AdminRemarks: reason.trim(),
        department: selectedRecord.Department,
        employeename: selectedRecord.EmployeeName,
        leavedate: selectedRecord.LeaveDate,
        leavetype: selectedRecord.LeaveType,
        returndate: selectedRecord.ReturnDate,
        totaldays: selectedRecord.TotalDaysRequested,
        totalhours: selectedRecord.TotalHoursRequested,
      };

      await axios.put(
        `${BASE_URL}/leave/${selectedRecord._id}`,
        payload
      );

      setDataSource((previous) =>
        previous.map((item) =>
          item._id === selectedRecord._id
            ? {
              ...item,
              ApprovalStatus: selectedStatus,
              AdminRemarks: reason.trim(),
            }
            : item
        )
      );

      message.success(
        selectedStatus === "Approved"
          ? "Leave request approved successfully."
          : "Leave request denied successfully."
      );

      setIsModalOpen(false);
      setSelectedRecord(null);
      setSelectedStatus("");
      setReason("");
    } catch (error) {
      console.error("Leave status update error:", error);
      message.error(
        error.response?.data?.message ||
        "Unable to update leave request. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // View leave details
  // --------------------------------------------------

  const openDetails = (record) => {
    setDetailsRecord(record);
    setDetailsModalOpen(true);
  };

  // --------------------------------------------------
  // Export current filtered records to PDF
  // --------------------------------------------------

  const downloadPdf = () => {
    if (!filteredData.length) {
      message.warning("There are no leave records to export.");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(18);
      doc.text("Employee Leave Report", 14, 17);

      doc.setFontSize(9);
      doc.text(
        `Generated on: ${moment().format("DD MMM YYYY, hh:mm A")}`,
        14,
        24
      );
      doc.text(`Total records: ${filteredData.length}`, 14, 30);

      const rows = filteredData.map((record) => [
        record.EmployeeName || "—",
        record.Department || "—",
        record.LeaveType || "—",
        formatDate(record.LeaveDate),
        formatDate(record.ReturnDate),
        getDuration(record),
        getStatus(record.ApprovalStatus),
        record.Reason || "—",
      ]);

      doc.autoTable({
        startY: 36,
        head: [[
          "Employee",
          "Department",
          "Leave type",
          "From",
          "To",
          "Duration",
          "Status",
          "Reason",
        ]],
        body: rows,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [39, 68, 135],
        },
      });

      doc.save("EmployeeLeaveRecord.pdf");
      message.success("PDF report downloaded.");
    } catch (error) {
      console.error("PDF export error:", error);
      message.error("Unable to generate PDF.");
    }
  };

  // --------------------------------------------------
  // Export current filtered records to Excel
  // --------------------------------------------------

  const downloadExcel = () => {
    if (!filteredData.length) {
      message.warning("There are no leave records to export.");
      return;
    }

    try {
      const exportData = filteredData.map((record) => ({
        Employee: record.EmployeeName || "",
        Department: record.Department || "",
        "Leave Type": record.LeaveType || "",
        "From Date": formatDate(record.LeaveDate),
        "To Date": formatDate(record.ReturnDate),
        "Total Days": record.TotalDaysRequested ?? "",
        "Total Hours": record.TotalHoursRequested ?? "",
        Duration: getDuration(record),
        Status: getStatus(record.ApprovalStatus),
        Reason: record.Reason || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 22 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 40 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Records");
      XLSX.writeFile(workbook, "EmployeeLeaveRecord.xlsx");

      message.success("Excel report downloaded.");
    } catch (error) {
      console.error("Excel export error:", error);
      message.error("Unable to generate Excel report.");
    }
  };

  // --------------------------------------------------
  // Table columns
  // --------------------------------------------------

  const columns = [
    {
      title: "EMPLOYEE",
      dataIndex: "EmployeeName",
      key: "EmployeeName",
      width: 190,
      render: (name, record) => (
        <div className="leave-employee-cell">
          <Avatar className="leave-employee-avatar">
            {getEmployeeInitials(name) || <UserOutlined />}
          </Avatar>
          <div className="leave-employee-info">
            <Text strong>{name || "Unknown employee"}</Text>
            <Text type="secondary">
              {record.Department || "Department not specified"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "LEAVE TYPE",
      dataIndex: "LeaveType",
      key: "LeaveType",
      width: 130,
      render: (type) => (
        <Tag className="leave-type-tag">
          {type || "Not specified"}
        </Tag>
      ),
    },
    {
      title: "DURATION",
      key: "duration",
      width: 210,
      render: (_, record) => (
        <div className="leave-date-cell">
          <Text strong>
            {formatDate(record.LeaveDate)}
          </Text>
          <Text type="secondary">
            to {formatDate(record.ReturnDate)}
          </Text>
          <Text className="leave-duration-text">
            {getDuration(record)}
          </Text>
        </div>
      ),
    },
    {
      title: "APPLIED ON",
      key: "AppliedOn",
      width: 140,
      render: (_, record) => (
        <Text type="secondary">
          {formatDate(getAppliedDate(record))}
        </Text>
      ),
    },
    {
      title: "REASON",
      dataIndex: "Reason",
      key: "Reason",
      width: 190,
      render: (value) => (
        <Tooltip title={value || "No reason provided"}>
          <Text className="leave-reason-text">
            {value || "No reason provided"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "ApprovalStatus",
      key: "ApprovalStatus",
      width: 125,
      render: (status) => {
        const value = getStatus(status);

        return (
          <Tag
            color={getStatusColor(value)}
            className="leave-status-tag"
          >
            {value === "Approved" && <CheckCircleOutlined />}
            {value === "Denied" && <CloseCircleOutlined />}
            {value === "Pending" && <ClockCircleOutlined />}
            <span>{value}</span>
          </Tag>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 190,
      fixed: "right",
      render: (_, record) => {
        const pending = getStatus(record.ApprovalStatus) === "Pending";

        return (
          <Space size={5} className="leave-action-buttons">
            <Tooltip title="View request details">
              <Button
                icon={<EyeOutlined />}
                onClick={() => openDetails(record)}
              />
            </Tooltip>

            {pending && (
              <>
                <Tooltip title="Approve leave">
                  <Button
                    type="primary"
                    className="leave-approve-button"
                    icon={<CheckCircleOutlined />}
                    onClick={() => showModal(record, "Approved")}
                  />
                </Tooltip>

                <Tooltip title="Deny leave">
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => showModal(record, "Denied")}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="leave-admin-page">
      {/* Page heading */}
      <div className="leave-page-header">
        <div>
          <div className="leave-breadcrumb">
            Administration <span>/</span> Leave management
          </div>

          <Title level={2} className="leave-page-title">
            Leave Management
          </Title>

          <Text className="leave-page-subtitle">
            Review employee leave requests, manage approvals and track leave activity.
          </Text>
        </div>

        <Space className="leave-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={getData}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            icon={<FilePdfOutlined />}
            onClick={downloadPdf}
          >
            Export PDF
          </Button>

          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={downloadExcel}
          >
            Export Excel
          </Button>
        </Space>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="leave-summary-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="leave-summary-card">
            <Statistic
              title="Total requests"
              value={dataSource.length}
              prefix={<CalendarOutlined />}
            />
            <Text type="secondary">All loaded leave requests</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className={`leave-summary-card clickable-summary ${statusFilter === "Pending" ? "active-summary" : ""
              }`}
            onClick={() =>
              setStatusFilter(statusFilter === "Pending" ? "all" : "Pending")
            }
          >
            <Statistic
              title="Pending approval"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#d48806" }}
            />
            <Text type="secondary">Requests requiring attention</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className={`leave-summary-card clickable-summary ${statusFilter === "Approved" ? "active-summary" : ""
              }`}
            onClick={() =>
              setStatusFilter(statusFilter === "Approved" ? "all" : "Approved")
            }
          >
            <Statistic
              title="Approved"
              value={approvedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#168451" }}
            />
            <Text type="secondary">Approved leave requests</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className={`leave-summary-card clickable-summary ${statusFilter === "Denied" ? "active-summary" : ""
              }`}
            onClick={() =>
              setStatusFilter(statusFilter === "Denied" ? "all" : "Denied")
            }
          >
            <Statistic
              title="Denied"
              value={deniedCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#cf3d45" }}
            />
            <Text type="secondary">Denied leave requests</Text>
          </Card>
        </Col>
      </Row>

      {/* Attention banner */}
      {pendingCount > 0 && statusFilter === "all" && (
        <Alert
          className="leave-pending-alert"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`${pendingCount} leave ${pendingCount === 1 ? "request needs" : "requests need"
            } your attention`}
          description="Review pending requests and approve or deny them with a reason."
          action={
            <Button
              size="small"
              onClick={() => setStatusFilter("Pending")}
            >
              Review pending
            </Button>
          }
        />
      )}

      {/* Filters and table */}
      <Card className="leave-directory-card">
        <div className="leave-directory-heading">
          <div>
            <Title level={4}>Leave requests</Title>
            <Text type="secondary">
              Showing {filteredData.length} of {dataSource.length} records
            </Text>
          </div>

          <Badge
            count={pendingCount}
            overflowCount={99}
            color="#d48806"
            offset={[-5, 5]}
          >
            <Tag className="leave-pending-count-tag">
              Pending requests
            </Tag>
          </Badge>
        </div>

        <div className="leave-filter-toolbar">
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search employee, department, leave type or reason..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onPressEnter={handleEmployeeSearch}
            className="leave-search-input"
          />

          <Select
            size="large"
            value={leaveTypeFilter}
            onChange={setLeaveTypeFilter}
            className="leave-filter-select"
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All leave types</Option>
            <Option value="casual">Casual</Option>
            <Option value="priviliege">Priviliege</Option>
            <Option value="sick">Sick</Option>
          </Select>

          <Select
            size="large"
            value={statusFilter}
            onChange={setStatusFilter}
            className="leave-filter-select"
          >
            <Option value="all">All statuses</Option>
            <Option value="Pending">Pending</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Denied">Denied</Option>
          </Select>

          <RangePicker
            size="large"
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
            className="leave-date-filter"
            placeholder={["From date", "To date"]}
          />

          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={handleDateSearch}
            disabled={!dateRange}
          >
            Apply dates
          </Button>

          <Button
            size="large"
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>

        <div className="leave-table-wrapper">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record) => record._id}
            loading={loading}
            className="leave-admin-table"
            scroll={{ x: 1050 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No leave requests found"
                />
              ),
            }}
            pagination={{
              defaultPageSize: 10,
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} requests`,
            }}
          />
        </div>

        <div className="leave-table-footer">
          <Text type="secondary">
            Total requested days in loaded records:{" "}
            <Text strong>{totalDays}</Text>
          </Text>
        </div>
      </Card>

      {/* Approve / deny modal */}
      <Modal
        title={
          <div className="leave-modal-title">
            {selectedStatus === "Approved" ? (
              <CheckCircleOutlined className="approve-modal-icon" />
            ) : (
              <CloseCircleOutlined className="deny-modal-icon" />
            )}

            <div>
              <Title level={4}>
                {selectedStatus === "Approved"
                  ? "Approve leave request"
                  : "Deny leave request"}
              </Title>
              <Text type="secondary">
                {selectedRecord?.EmployeeName || "Employee"}
              </Text>
            </div>
          </div>
        }
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={
          selectedStatus === "Approved"
            ? "Confirm approval"
            : "Confirm denial"
        }
        okButtonProps={{
          danger: selectedStatus === "Denied",
          loading: actionLoading,
        }}
        cancelButtonProps={{ disabled: actionLoading }}
        maskClosable={!actionLoading}
        destroyOnClose
        className="leave-action-modal"
      >
        {selectedRecord && (
          <div className="leave-confirm-details">
            <div>
              <Text type="secondary">Leave type</Text>
              <Text strong>{selectedRecord.LeaveType || "—"}</Text>
            </div>
            <div>
              <Text type="secondary">Duration</Text>
              <Text strong>{getDuration(selectedRecord)}</Text>
            </div>
            <div>
              <Text type="secondary">Dates</Text>
              <Text strong>
                {formatDate(selectedRecord.LeaveDate)} –{" "}
                {formatDate(selectedRecord.ReturnDate)}
              </Text>
            </div>
          </div>
        )}

        <Form layout="vertical">
          <Form.Item
            label={
              selectedStatus === "Approved"
                ? "Approval note / reason"
                : "Reason for denial"
            }
            required
          >
            <TextArea
              rows={4}
              maxLength={1000}
              showCount
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                selectedStatus === "Approved"
                  ? "Add an approval note for the employee..."
                  : "Explain why this leave request is being denied..."
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Leave details modal */}
      <Modal
        title="Leave request details"
        open={detailsModalOpen}
        onCancel={() => {
          setDetailsModalOpen(false);
          setDetailsRecord(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsModalOpen(false);
              setDetailsRecord(null);
            }}
          >
            Close
          </Button>,
          ...(detailsRecord &&
            getStatus(detailsRecord.ApprovalStatus) === "Pending"
            ? [
              <Button
                key="deny"
                danger
                onClick={() => {
                  setDetailsModalOpen(false);
                  showModal(detailsRecord, "Denied");
                }}
              >
                Deny
              </Button>,
              <Button
                key="approve"
                type="primary"
                onClick={() => {
                  setDetailsModalOpen(false);
                  showModal(detailsRecord, "Approved");
                }}
              >
                Approve
              </Button>,
            ]
            : []),
        ]}
        width={600}
        className="leave-details-modal"
      >
        {detailsRecord && (
          <div className="leave-details-content">
            <div className="leave-details-profile">
              <Avatar size={48} className="leave-employee-avatar">
                {getEmployeeInitials(detailsRecord.EmployeeName)}
              </Avatar>
              <div>
                <Title level={5}>{detailsRecord.EmployeeName || "Unknown employee"}</Title>
                <Text type="secondary">
                  {detailsRecord.Department || "Department not specified"}
                </Text>
              </div>
              <Tag color={getStatusColor(detailsRecord.ApprovalStatus)}>
                {getStatus(detailsRecord.ApprovalStatus)}
              </Tag>
            </div>

            <Row gutter={[16, 18]}>
              <Col span={12}>
                <Text type="secondary">Leave type</Text>
                <Paragraph strong>{detailsRecord.LeaveType || "—"}</Paragraph>
              </Col>
              <Col span={12}>
                <Text type="secondary">Duration</Text>
                <Paragraph strong>{getDuration(detailsRecord)}</Paragraph>
              </Col>
              <Col span={12}>
                <Text type="secondary">From</Text>
                <Paragraph strong>{formatDate(detailsRecord.LeaveDate)}</Paragraph>
              </Col>
              <Col span={12}>
                <Text type="secondary">To</Text>
                <Paragraph strong>{formatDate(detailsRecord.ReturnDate)}</Paragraph>
              </Col>
              <Col span={12}>
                <Text type="secondary">Total days requested</Text>
                <Paragraph strong>
                  {detailsRecord.TotalDaysRequested ?? "—"}
                </Paragraph>
              </Col>
              <Col span={12}>
                <Text type="secondary">Total hours requested</Text>
                <Paragraph strong>
                  {detailsRecord.TotalHoursRequested ?? "—"}
                </Paragraph>
              </Col>
              <Col span={24}>
                <Text type="secondary">Reason for leave</Text>
                <Paragraph>{detailsRecord.Reason || "No reason provided."}</Paragraph>
              </Col>
              <Col span={24}>
                <Text type="secondary">Admin remarks</Text>
                <Paragraph>{detailsRecord.AdminRemarks || "No remarks yet."}</Paragraph>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveTable;
