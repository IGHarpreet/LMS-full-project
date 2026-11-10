import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";

import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";

import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { useNavigate, useParams } from "react-router-dom";

import "./Documentation.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const BASE_URL = (
  process.env.REACT_APP_BASE_URL || "http://localhost:1999"
).replace(/\/+$/, "");

const DOCUMENT_TYPES = [
  "Identity",
  "Address",
  "Education",
  "Experience",
  "Certificate",
  "Offer Letter",
  "Employment Agreement",
  "Bank Details",
  "Tax",
  "Other",
  "Picture",
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Verified", value: "Verified" },
  { label: "Rejected", value: "Rejected" },
];

const MAX_FILE_SIZE = 10;

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = dayjs(date);

  return parsed.isValid() ? parsed.format("DD MMM YYYY") : "—";
};

const getFileExtension = (filename = "") => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

const getFileIcon = (filename = "") => {
  const extension = getFileExtension(filename);

  if (extension === "pdf") {
    return <FilePdfOutlined />;
  }

  if (["jpg", "jpeg", "png"].includes(extension)) {
    return <FileImageOutlined />;
  }

  if (["doc", "docx"].includes(extension)) {
    return <FileWordOutlined />;
  }

  return <FileOutlined />;
};

const getStatusColor = (status) => {
  switch (status) {
    case "Verified":
      return "success";

    case "Rejected":
      return "error";

    default:
      return "warning";
  }
};

const getExpiryInfo = (expiryDate) => {
  if (!expiryDate) {
    return {
      label: "No expiry date",
      color: "default",
    };
  }

  const expiry = dayjs(expiryDate);
  const today = dayjs().startOf("day");

  if (!expiry.isValid()) {
    return {
      label: "Invalid date",
      color: "default",
    };
  }

  if (expiry.isBefore(today)) {
    return {
      label: "Expired",
      color: "error",
    };
  }

  if (expiry.diff(today, "day") <= 30) {
    return {
      label: "Expiring soon",
      color: "warning",
    };
  }

  return {
    label: "Valid",
    color: "success",
  };
};

const Documentation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [dataSource, setDataSource] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  const [fileList, setFileList] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [previewDocument, setPreviewDocument] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  // --------------------------------------------------
  // API URL
  // --------------------------------------------------

  const getFileUrl = useCallback((filename) => {
    if (!filename) return "";

    return `${BASE_URL}/images/${encodeURIComponent(filename)}`;
  }, []);

  const fetchEmployeeDetails = useCallback(async () => {
    if (!id) return;

    try {
      setEmployeeLoading(true);

      const response = await axios.get(`${BASE_URL}/user/${id}`);

      // Your existing API may return myData as an array.
      const employee = response.data?.myData;

      setEmployeeDetails(
        Array.isArray(employee) ? employee[0] || null : employee || null
      );
    } catch (error) {
      console.error(
        "Employee details fetch error:",
        error.response?.data || error
      );

      setEmployeeDetails(null);
      message.error("Unable to load employee details.");
    } finally {
      setEmployeeLoading(false);
    }
  }, [id]);
  // --------------------------------------------------
  // FETCH EMPLOYEE DOCUMENTS
  // --------------------------------------------------

  const showHandle = useCallback(async () => {
    if (!id) {
      message.error("Employee ID is missing.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${BASE_URL}/document/${id}`
      );

      const documents =
        response?.data?.documentDataByEmpID || [];

      setDataSource(documents);
    } catch (error) {
      console.error(
        "Document fetch error:",
        error.response?.data || error
      );

      message.error(
        error.response?.data?.message ||
        "Unable to load employee documents."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    showHandle();
    fetchEmployeeDetails();
  }, [showHandle, fetchEmployeeDetails]);

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetDocumentForm = () => {
    form.resetFields();
    setFileList([]);
    setEditingDocument(null);
  };

  // --------------------------------------------------
  // OPEN ADD MODAL
  // --------------------------------------------------

  const showModal = () => {
    resetDocumentForm();

    form.setFieldsValue({
      verificationStatus: "Pending",
    });

    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // OPEN EDIT MODAL
  // --------------------------------------------------

  const handleEdit = (record) => {
    setEditingDocument(record);

    form.setFieldsValue({
      documentname: record.documentname,
      documenttype: record.documenttype,
      description: record.description || "",
      expiryDate: record.expiryDate
        ? dayjs(record.expiryDate)
        : null,
      verificationStatus:
        record.verificationStatus || "Pending",
    });

    setFileList([]);

    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const handleCancel = () => {
    if (saving) return;

    setIsModalOpen(false);
    resetDocumentForm();
  };

  // --------------------------------------------------
  // FILE VALIDATION
  // --------------------------------------------------

  const beforeUpload = (file) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".pdf",
      ".doc",
      ".docx",
    ];

    const extension = `.${getFileExtension(file.name)}`;

    const validType = allowedTypes.includes(file.type);
    const validExtension = allowedExtensions.includes(extension);

    if (!validType || !validExtension) {
      message.error(
        "Only JPG, JPEG, PNG, PDF, DOC and DOCX files are allowed."
      );

      return Upload.LIST_IGNORE;
    }

    const isWithinLimit = file.size / 1024 / 1024 <= MAX_FILE_SIZE;

    if (!isWithinLimit) {
      message.error("File size cannot exceed 10 MB.");

      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));
  };

  // --------------------------------------------------
  // ADD / UPDATE DOCUMENT
  // --------------------------------------------------

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!editingDocument && fileList.length === 0) {
        message.error("Please select a document file.");
        return;
      }

      setSaving(true);

      const formData = new FormData();

      formData.append("documentname", values.documentname.trim());
      formData.append("documenttype", values.documenttype);
      formData.append("description", values.description || "");

      formData.append(
        "expiryDate",
        values.expiryDate
          ? values.expiryDate.format("YYYY-MM-DD")
          : ""
      );

      formData.append(
        "verificationStatus",
        values.verificationStatus || "Pending"
      );

      if (fileList.length > 0) {
        const selectedFile = fileList[0].originFileObj || fileList[0];

        formData.append("image", selectedFile);
      }

      if (editingDocument) {
        await axios.put(
          `${BASE_URL}/document/editmydoc/${editingDocument._id}`,
          formData
        );

        message.success("Document updated successfully.");
      } else {
        formData.append("emp_id", id);

        await axios.post(
          `${BASE_URL}/document/add/${id}`,
          formData
        );

        message.success("Document uploaded successfully.");
      }

      setIsModalOpen(false);
      resetDocumentForm();

      await showHandle();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      console.error(
        "Document save error:",
        error.response?.data || error
      );

      message.error(
        error.response?.data?.message ||
        "Unable to save document. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DELETE DOCUMENT
  // --------------------------------------------------

  const handleDelete = async (documentId) => {
    try {
      setDeletingId(documentId);

      await axios.delete(
        `${BASE_URL}/document/${documentId}`
      );

      message.success("Document deleted successfully.");

      setDataSource((previous) =>
        previous.filter((item) => item._id !== documentId)
      );
    } catch (error) {
      console.error(
        "Document delete error:",
        error.response?.data || error
      );

      message.error(
        error.response?.data?.message ||
        "Unable to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // --------------------------------------------------
  // PREVIEW DOCUMENT
  // --------------------------------------------------

  const handlePreview = (record) => {
    setPreviewDocument(record);
  };

  const closePreview = () => {
    setPreviewDocument(null);
  };

  // --------------------------------------------------
  // FILTER DOCUMENTS
  // --------------------------------------------------

  const filteredDocuments = useMemo(() => {
    return dataSource.filter((document) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        !search ||
        document.documentname?.toLowerCase().includes(search) ||
        document.documenttype?.toLowerCase().includes(search) ||
        document.description?.toLowerCase().includes(search);

      const matchesType =
        selectedType === "All" ||
        document.documenttype === selectedType;

      const matchesStatus =
        selectedStatus === "All" ||
        (document.verificationStatus || "Pending") === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [
    dataSource,
    searchText,
    selectedType,
    selectedStatus,
  ]);

  // --------------------------------------------------
  // DASHBOARD COUNTS
  // --------------------------------------------------

  const totalDocuments = dataSource.length;

  const verifiedDocuments = dataSource.filter(
    (item) => item.verificationStatus === "Verified"
  ).length;

  const pendingDocuments = dataSource.filter(
    (item) =>
      !item.verificationStatus ||
      item.verificationStatus === "Pending"
  ).length;

  const rejectedDocuments = dataSource.filter(
    (item) => item.verificationStatus === "Rejected"
  ).length;

  const expiredDocuments = dataSource.filter((item) => {
    if (!item.expiryDate) return false;

    return dayjs(item.expiryDate).isBefore(
      dayjs().startOf("day")
    );
  }).length;

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------

  const columns = [
    {
      title: "DOCUMENT",
      key: "document",
      width: 270,

      render: (_, record) => (
        <Space align="start" size={12}>
          <Avatar
            shape="square"
            size={42}
            className="document-file-avatar"
            icon={getFileIcon(record.image)}
          />

          <div className="document-file-info">
            <Text strong className="document-file-name">
              {record.documentname}
            </Text>

            <Text type="secondary" className="document-file-description">
              {record.image || "Document"}
            </Text>

            {record.description && (
              <Tooltip title={record.description}>
                <Text
                  type="secondary"
                  className="document-short-description"
                  ellipsis
                >
                  {record.description}
                </Text>
              </Tooltip>
            )}
          </div>
        </Space>
      ),
    },

    {
      title: "CATEGORY",
      dataIndex: "documenttype",
      key: "documenttype",
      width: 150,

      render: (type) => (
        <Tag color="blue">{type || "Other"}</Tag>
      ),
    },

    {
      title: "UPLOADED",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,

      render: (date) => (
        <Text type="secondary">
          {formatDate(date)}
        </Text>
      ),
    },

    {
      title: "EXPIRY",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 160,

      render: (date) => {
        const expiry = getExpiryInfo(date);

        return (
          <Space direction="vertical" size={2}>
            <Text>{formatDate(date)}</Text>

            {date && (
              <Tag color={expiry.color}>
                {expiry.label}
              </Tag>
            )}
          </Space>
        );
      },
    },

    {
      title: "STATUS",
      dataIndex: "verificationStatus",
      key: "verificationStatus",
      width: 130,

      render: (status) => {
        const currentStatus = status || "Pending";

        return (
          <Tag color={getStatusColor(currentStatus)}>
            {currentStatus === "Verified" && (
              <CheckCircleOutlined />
            )}

            {currentStatus === "Pending" && (
              <ClockCircleOutlined />
            )}

            {currentStatus === "Rejected" && (
              <CloseCircleOutlined />
            )}

            {" "}{currentStatus}
          </Tag>
        );
      },
    },

    {
      title: "ACTIONS",
      key: "actions",
      fixed: "right",
      width: 165,

      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Preview document">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>

          <Tooltip title="Download document">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              href={getFileUrl(record.image)}
              target="_blank"
              rel="noopener noreferrer"
              download={record.image}
            />
          </Tooltip>

          <Tooltip title="Edit document">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this document?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Tooltip title="Delete document">
              <Button
                danger
                type="text"
                loading={deletingId === record._id}
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --------------------------------------------------
  // PREVIEW CONTENT
  // --------------------------------------------------

  const renderPreview = () => {
    if (!previewDocument) return null;

    const extension = getFileExtension(previewDocument.image);
    const fileUrl = getFileUrl(previewDocument.image);

    if (["jpg", "jpeg", "png"].includes(extension)) {
      return (
        <div className="document-preview-image-wrapper">
          <img
            src={fileUrl}
            alt={previewDocument.documentname}
            className="document-preview-image"
          />
        </div>
      );
    }

    if (extension === "pdf") {
      return (
        <iframe
          title={previewDocument.documentname}
          src={fileUrl}
          className="document-preview-pdf"
        />
      );
    }

    return (
      <Empty
        image={<FileOutlined className="document-preview-empty-icon" />}
        description={
          <div>
            <Text strong>
              Preview is not available for this file type.
            </Text>

            <Paragraph type="secondary">
              Download the file to view it on your device.
            </Paragraph>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              href={fileUrl}
              download={previewDocument.image}
              target="_blank"
            >
              Download document
            </Button>
          </div>
        }
      />
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="documentation-page">

      {/* HEADER */}

      {/* HEADER */}

      <div className="documentation-header">
        <div>

          <Space align="center" size={10}>
            <div className="documentation-header-icon">
              <FolderOpenOutlined />
            </div>

            <div>
              <Title level={4} className="documentation-title">
                Employee Documents
              </Title>

              <Text type="secondary">
                Manage, review and track employee documents in one place.
              </Text>
            </div>

          </Space>
        </div>

        <Space wrap>

          <Button
            icon={<LeftOutlined />}
            onClick={() => navigate("/employees")}
          >
            Back to Employees
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={showHandle}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showModal}
          >
            Add Document
          </Button>
        </Space>
      </div>
      {/* EMPLOYEE INFORMATION */}

      <Card
        className="document-employee-card"
        loading={employeeLoading}
      >
        {employeeDetails ? (
          <Row align="middle" gutter={[20, 16]}>
            <Col>
              <Avatar
                size={68}
                src={
                  employeeDetails.profilepicture ||
                  employeeDetails.imageUrl ||
                  undefined
                }
                icon={<UserOutlined />}
              >
                {!employeeDetails.profilepicture &&
                  !employeeDetails.imageUrl &&
                  employeeDetails.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Col>

            <Col flex="1">
              <Text type="secondary" className="document-employee-label">
                CURRENTLY VIEWING DOCUMENTS FOR
              </Text>

              <Title level={4} className="document-employee-name">
                {employeeDetails.name || "Unnamed Employee"}
              </Title>

              <Space wrap size={[16, 8]}>
                <Text type="secondary">
                  <MailOutlined /> {employeeDetails.email || "No email"}
                </Text>

                <Text type="secondary">
                  <PhoneOutlined /> {employeeDetails.contact || "No contact"}
                </Text>

                <Text type="secondary">
                  <TeamOutlined /> {employeeDetails.department || "No department"}
                </Text>

                <Tag color="blue">
                  {employeeDetails.role || "Employee"}
                </Tag>
              </Space>

              <div className="document-employee-id">
                Employee ID: {employeeDetails._id || id}
              </div>
            </Col>

            <Col>
              <Button
                icon={<EyeOutlined />}
                onClick={() => navigate(`/profile/${id}`)}
              >
                View Profile
              </Button>
            </Col>
          </Row>
        ) : (
          <Alert
            type="warning"
            showIcon
            message="Employee details unavailable"
            description={`Showing documents for employee ID: ${id || "Not available"}`}
          />
        )}
      </Card>
      {/* SUMMARY CARDS */}

      <Row gutter={[16, 16]} className="document-summary-row">

        <Col xs={12} sm={12} md={8} lg={4}>
          <Card className="document-summary-card">
            <Statistic
              title="Total Documents"
              value={totalDocuments}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={5}>
          <Card className="document-summary-card">
            <Statistic
              title="Verified"
              value={verifiedDocuments}
              valueStyle={{ color: "#16a34a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={5}>
          <Card className="document-summary-card">
            <Statistic
              title="Pending Review"
              value={pendingDocuments}
              valueStyle={{ color: "#d97706" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={5}>
          <Card className="document-summary-card">
            <Statistic
              title="Rejected"
              value={rejectedDocuments}
              valueStyle={{ color: "#dc2626" }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={8} lg={5}>
          <Card className="document-summary-card">
            <Statistic
              title="Expired"
              value={expiredDocuments}
              valueStyle={{ color: "#dc2626" }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>

      </Row>

      {/* DOCUMENT TABLE CARD */}

      <Card className="document-table-card">

        <div className="document-table-header">
          <div>
            <Title level={5} className="document-table-title">
              All Documents
            </Title>

            <Text type="secondary">
              {filteredDocuments.length} of {totalDocuments} documents
            </Text>
          </div>
        </div>

        {/* FILTERS */}

        <Row
          gutter={[12, 12]}
          className="document-filter-row"
        >
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search by document name, category or description..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>

          <Col xs={12} sm={12} md={7} lg={7}>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              className="document-filter-select"
              options={[
                { label: "All Categories", value: "All" },
                ...DOCUMENT_TYPES.map((type) => ({
                  label: type,
                  value: type,
                })),
              ]}
            />
          </Col>

          <Col xs={12} sm={12} md={7} lg={7}>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="document-filter-select"
              options={[
                { label: "All Statuses", value: "All" },
                ...STATUS_OPTIONS,
              ]}
            />
          </Col>
        </Row>

        {/* EXPIRY ALERT */}

        {expiredDocuments > 0 && (
          <Alert
            className="document-expiry-alert"
            type="warning"
            showIcon
            message={`${expiredDocuments} document(s) have expired. Please review them.`}
          />
        )}

        {/* TABLE */}

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredDocuments}
          loading={loading}
          scroll={{ x: 1050 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ["8", "15", "30", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} documents`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchText ||
                    selectedType !== "All" ||
                    selectedStatus !== "All"
                    ? "No matching documents found"
                    : "No documents uploaded yet"
                }
              >
                {!searchText &&
                  selectedType === "All" &&
                  selectedStatus === "All" && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={showModal}
                    >
                      Upload first document
                    </Button>
                  )}
              </Empty>
            ),
          }}
        />

      </Card>

      {/* ADD / EDIT MODAL */}

      <Modal
        title={
          <Space>
            {editingDocument ? <EditOutlined /> : <UploadOutlined />}

            {editingDocument
              ? "Edit Employee Document"
              : "Upload Employee Document"}
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText={editingDocument ? "Save Changes" : "Upload Document"}
        cancelText="Cancel"
        confirmLoading={saving}
        width={650}
        destroyOnClose
        maskClosable={!saving}
      >

        <Alert
          className="document-modal-alert"
          type="info"
          showIcon
          message={
            editingDocument
              ? "Update document details or select a replacement file."
              : "Upload a clear and readable employee document."
          }
        />

        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          className="document-form"
        >

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Document Name"
                name="documentname"
                rules={[
                  {
                    required: true,
                    message: "Please enter document name.",
                  },
                  {
                    max: 150,
                    message: "Maximum 150 characters allowed.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="e.g. Bachelor's Degree Certificate"
                  maxLength={150}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Document Category"
                name="documenttype"
                rules={[
                  {
                    required: true,
                    message: "Please select a category.",
                  },
                ]}
              >
                <Select
                  size="large"
                  placeholder="Select category"
                  options={DOCUMENT_TYPES.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Verification Status"
                name="verificationStatus"
                rules={[
                  {
                    required: true,
                    message: "Please select status.",
                  },
                ]}
              >
                <Select
                  size="large"
                  options={STATUS_OPTIONS}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
              >
                <TextArea
                  rows={3}
                  maxLength={1000}
                  showCount
                  placeholder="Add notes about this document (optional)"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
              >
                <DatePicker
                  size="large"
                  className="document-full-width"
                  format="DD MMM YYYY"
                  placeholder="Select expiry date (optional)"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Document File">
                {editingDocument && (
                  <Alert
                    className="document-existing-file-alert"
                    type="info"
                    showIcon
                    message={
                      <>
                        Current file:{" "}
                        <Text strong>
                          {editingDocument.image}
                        </Text>
                      </>
                    }
                    description="Leave the file selection empty to keep the existing file."
                  />
                )}

                <Dragger
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  maxCount={1}
                  multiple={false}
                  fileList={fileList}
                  beforeUpload={beforeUpload}
                  onChange={handleFileChange}
                  onRemove={() => {
                    setFileList([]);
                    return true;
                  }}
                  disabled={saving}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>

                  <p className="ant-upload-text">
                    Click or drag a file to this area
                  </p>

                  <p className="ant-upload-hint">
                    JPG, PNG, PDF, DOC or DOCX. Maximum file size: 10 MB.
                  </p>
                </Dragger>
              </Form.Item>
            </Col>
          </Row>

        </Form>

      </Modal>

      {/* DOCUMENT PREVIEW MODAL */}

      <Modal
        title={
          <Space>
            <FileOutlined />

            {previewDocument?.documentname || "Document Preview"}
          </Space>
        }
        open={!!previewDocument}
        onCancel={closePreview}
        footer={
          previewDocument && (
            <Space>
              <Button onClick={closePreview}>
                Close
              </Button>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href={getFileUrl(previewDocument.image)}
                download={previewDocument.image}
                target="_blank"
              >
                Download
              </Button>
            </Space>
          )
        }
        width={900}
        centered
        destroyOnClose
      >
        {previewDocument && (
          <>
            <Descriptions
              size="small"
              column={2}
              bordered
              className="document-preview-details"
            >
              <Descriptions.Item label="Category">
                {previewDocument.documenttype}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Tag
                  color={getStatusColor(
                    previewDocument.verificationStatus || "Pending"
                  )}
                >
                  {previewDocument.verificationStatus || "Pending"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Uploaded">
                {formatDate(previewDocument.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Expiry">
                {formatDate(previewDocument.expiryDate)}
              </Descriptions.Item>
            </Descriptions>

            <div className="document-preview-content">
              {renderPreview()}
            </div>
          </>
        )}
      </Modal>

    </div>
  );
};

export default Documentation;