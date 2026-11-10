import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Typography,
  Tag,
  Input,
  Select,
  Button,
  Modal,
  Descriptions,
  Row,
  Col,
  Card,
  Space,
  Empty,
  message,
  Tooltip,
} from "antd";

import axios from "axios";
import jwt_decode from "../utils/jwtSafe";

import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import moment from "moment";
import "../../src/Employeeleavetable.css";

const { Text } = Typography;
const { Option } = Select;

const Employeeleavetable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // Fetch employee leave records
  useEffect(() => {
    employeedata();
  }, []);

  const employeedata = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token1");

      if (!token) {
        message.error("Authentication token not found");
        return;
      }

      const decoded = jwt_decode(token);

      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/leave/${decoded?._id}`
      );

      setData(res?.data?.leaveByEmpID || []);
    } catch (error) {
      console.error("Error fetching leave data:", error);
      message.error("Unable to load leave records");
    } finally {
      setLoading(false);
    }
  };

  // Normalize status
  const normalizeStatus = (status) => {
    return String(status || "").trim().toLowerCase();
  };

  // Status badge
  const renderApprovalStatus = (status) => {
    const normalizedStatus = normalizeStatus(status);

    switch (normalizedStatus) {
      case "pending":
        return (
          <Tag
            color="processing"
            icon={<ClockCircleOutlined />}
            className="leave-status-tag"
          >
            Pending
          </Tag>
        );

      case "approved":
        return (
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            className="leave-status-tag"
          >
            Approved
          </Tag>
        );

      case "denied":
      case "rejected":
        return (
          <Tag
            color="error"
            icon={<CloseCircleOutlined />}
            className="leave-status-tag"
          >
            Rejected
          </Tag>
        );

      default:
        return (
          <Tag
            color="default"
            icon={<QuestionCircleOutlined />}
            className="leave-status-tag"
          >
            {status || "Not Available"}
          </Tag>
        );
    }
  };

  // Format dates
  const formatDate = (date) => {
    if (!date || !moment(date).isValid()) {
      return "N/A";
    }

    return moment(date).format("DD MMM YYYY");
  };

  // Get reason from whichever field your API provides
  const getReason = (record) => {
    return (
      record?.Reason ||
      record?.LeaveReason ||
      record?.Description ||
      "Not provided"
    );
  };

  // Get admin remarks
  const getAdminRemarks = (record) => {
    return (
      record?.AdminRemarks ||
      record?.ApprovalRemarks ||
      record?.Remarks ||
      "No remarks available"
    );
  };

  // Get application date
  const getAppliedDate = (record) => {
    return (
      record?.AppliedOn ||
      record?.AppliedDate ||
      record?.CreatedAt ||
      record?.createdAt ||
      record?._id?.getTimestamp?.() ||
      null
    );
  };

  // Leave duration
  const getDuration = (record) => {
    if (record?.TotalDaysRequested) {
      return `${record.TotalDaysRequested} days`;
    }

    return record?.TotalHoursRequested || "N/A";
  };

  // Unique leave types for filter
  const leaveTypes = useMemo(() => {
    return [
      ...new Set(
        data
          .map((item) => item.LeaveType)
          .filter(Boolean)
      ),
    ];
  }, [data]);

  // Summary counts
  const pendingCount = data.filter(
    (item) => normalizeStatus(item.ApprovalStatus) === "pending"
  ).length;

  const approvedCount = data.filter(
    (item) => normalizeStatus(item.ApprovalStatus) === "approved"
  ).length;

  const rejectedCount = data.filter((item) =>
    ["rejected", "denied"].includes(
      normalizeStatus(item.ApprovalStatus)
    )
  ).length;

  // Search and filters
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        !search ||
        [
          record.LeaveType,
          record.ApprovalStatus,
          record.Reason,
          record.LeaveReason,
          record.Description,
          record._id,
        ].some((value) =>
          String(value || "").toLowerCase().includes(search)
        );

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(record.ApprovalStatus) === statusFilter ||
        (statusFilter === "rejected" &&
          normalizeStatus(record.ApprovalStatus) === "denied");

      const matchesLeaveType =
        leaveTypeFilter === "all" ||
        record.LeaveType === leaveTypeFilter;

      return matchesSearch && matchesStatus && matchesLeaveType;
    });
  }, [data, searchText, statusFilter, leaveTypeFilter]);

  // Open details popup
  const showLeaveDetails = (record) => {
    setSelectedLeave(record);
    setDetailsVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: "Leave ID",
      key: "leaveId",
      width: 110,
      render: (_, record) => (
        <Text className="leave-id">
          #{String(record._id || "").slice(-6).toUpperCase()}
        </Text>
      ),
    },

    {
      title: "Leave Type",
      dataIndex: "LeaveType",
      key: "LeaveType",
      width: 150,
      sorter: (a, b) =>
        String(a.LeaveType || "").localeCompare(
          String(b.LeaveType || "")
        ),
      render: (text) => (
        <Text strong className="leave-type-text">
          {text || "N/A"}
        </Text>
      ),
    },

    {
      title: "From",
      dataIndex: "LeaveDate",
      key: "LeaveDate",
      width: 125,
      sorter: (a, b) =>
        moment(a.LeaveDate).valueOf() -
        moment(b.LeaveDate).valueOf(),
      render: (text) => (
        <Text>{formatDate(text)}</Text>
      ),
    },

    {
      title: "To",
      dataIndex: "ReturnDate",
      key: "ReturnDate",
      width: 125,
      render: (text) => (
        <Text>{formatDate(text)}</Text>
      ),
    },

    {
      title: "Duration",
      dataIndex: "TotalHoursRequested",
      key: "duration",
      width: 130,
      render: (_, record) => (
        <Tag color="blue">
          {getDuration(record)}
        </Tag>
      ),
    },
    {
      title: "ADMIN REMARKS",
      dataIndex: "AdminRemarks",
      key: "AdminRemarks",
      width: 220,
      render: (_, record) => (
        <Tooltip title={getAdminRemarks(record)}>
          <Text ellipsis style={{ maxWidth: 200 }}>{getAdminRemarks(record)}</Text>
        </Tooltip>
      ),
    },
    {
      title: "REASON",
      dataIndex: "Reason",
      key: "Reason",
      width: 220,
      render: (_, record) => (
        <Tooltip title={getReason(record)}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {getReason(record)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Applied On",
      key: "AppliedOn",
      width: 130,
      render: (_, record) => (
        <Text type="secondary">
          {formatDate(getAppliedDate(record))}
        </Text>
      ),
    },

    {
      title: "Approval Status",
      dataIndex: "ApprovalStatus",
      key: "ApprovalStatus",
      width: 150,
      sorter: (a, b) =>
        String(a.ApprovalStatus || "").localeCompare(
          String(b.ApprovalStatus || "")
        ),
      render: (status) => renderApprovalStatus(status),
    },

    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showLeaveDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="employee-leave-container">

      {/* Page heading */}
      <div className="leave-page-heading">
        <div>
          <h2>My Leave Requests</h2>
          <p>
            Track your leave applications and approval status.
          </p>
        </div>

        <Button
          icon={<CalendarOutlined />}
          onClick={employeedata}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="leave-summary-row">

        <Col xs={24} sm={8}>
          <Card className="employee-leave-summary pending-summary">
            <div className="summary-card-content">
              <div>
                <Text type="secondary">Pending Requests</Text>
                <h2>{pendingCount}</h2>
              </div>
              <ClockCircleOutlined className="summary-icon pending-icon" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="employee-leave-summary approved-summary">
            <div className="summary-card-content">
              <div>
                <Text type="secondary">Approved Requests</Text>
                <h2>{approvedCount}</h2>
              </div>
              <CheckCircleOutlined className="summary-icon approved-icon" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="employee-leave-summary rejected-summary">
            <div className="summary-card-content">
              <div>
                <Text type="secondary">Rejected Requests</Text>
                <h2>{rejectedCount}</h2>
              </div>
              <CloseCircleOutlined className="summary-icon rejected-icon" />
            </div>
          </Card>
        </Col>

      </Row>

      {/* Leave history table */}
      <div className="leave-history-card">

        <div className="leave-history-header">
          <div>
            <h3>Leave History</h3>
            <p>View and manage your submitted leave requests.</p>
          </div>

          <Text type="secondary">
            {filteredData.length} requests
          </Text>
        </div>

        {/* Search and filters */}
        <div className="leave-table-filters">

          <Input
            placeholder="Search leave type, reason or ID..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="leave-search-input"
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="leave-filter-select"
            placeholder="Filter by status"
          >
            <Option value="all">All Statuses</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>

          <Select
            value={leaveTypeFilter}
            onChange={setLeaveTypeFilter}
            className="leave-filter-select"
            placeholder="Filter by leave type"
          >
            <Option value="all">All Leave Types</Option>

            {leaveTypes.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>

        </div>

        <Table
          rowKey={(record) => record._id}
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          scroll={{ x: 1050 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ["8", "15", "25", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} requests`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No leave requests found"
              />
            ),
          }}
        />

      </div>

      {/* Leave details modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Leave Request Details
          </Space>
        }
        visible={detailsVisible}
        onCancel={() => {
          setDetailsVisible(false);
          setSelectedLeave(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailsVisible(false);
              setSelectedLeave(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={650}
      >

        {selectedLeave && (
          <div className="leave-details-modal">

            <div className="leave-details-status">
              {renderApprovalStatus(selectedLeave.ApprovalStatus)}
            </div>

            <Descriptions
              bordered
              column={2}
              size="small"
            >

              <Descriptions.Item label="Leave ID">
                #{String(selectedLeave._id || "").slice(-6).toUpperCase()}
              </Descriptions.Item>

              <Descriptions.Item label="Leave Type">
                {selectedLeave.LeaveType || "N/A"}
              </Descriptions.Item>

              <Descriptions.Item label="From">
                {formatDate(selectedLeave.LeaveDate)}
              </Descriptions.Item>

              <Descriptions.Item label="To">
                {formatDate(selectedLeave.ReturnDate)}
              </Descriptions.Item>

              <Descriptions.Item label="Duration">
                {getDuration(selectedLeave)}
              </Descriptions.Item>

              <Descriptions.Item label="Applied On">
                {formatDate(getAppliedDate(selectedLeave))}
              </Descriptions.Item>

              <Descriptions.Item label="Approval Status" span={2}>
                {renderApprovalStatus(selectedLeave.ApprovalStatus)}
              </Descriptions.Item>

              <Descriptions.Item label="Reason" span={2}>
                {getReason(selectedLeave)}
              </Descriptions.Item>

              <Descriptions.Item label="Admin Remarks" span={2}>
                {getAdminRemarks(selectedLeave)}
              </Descriptions.Item>

            </Descriptions>

            {normalizeStatus(selectedLeave.ApprovalStatus) === "pending" && (
              <div className="leave-pending-notice">
                <ClockCircleOutlined />
                Your leave request is awaiting administrator approval.
              </div>
            )}

          </div>
        )}

      </Modal>

    </div>
  );
};

export default Employeeleavetable;