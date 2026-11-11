import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { saveAs } from "file-saver";
import jwt_decode from "../utils/jwtSafe";

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Rate,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BankOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

import "./EmployeeProfile.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const BASE_URL = process.env.REACT_APP_BASE_URL;

const DEFAULT_AVATAR =
  "https://cdn.vectorstock.com/i/preview-1x/66/14/default-avatar-photo-placeholder-profile-picture-vector-21806614.webp";

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileForm] = Form.useForm();
  const [documentForm] = Form.useForm();
  const [editDocumentForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [employee, setEmployee] = useState(null);
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [employeeSkills, setEmployeeSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [editDocumentModalOpen, setEditDocumentModalOpen] =
    useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [editDocumentFile, setEditDocumentFile] = useState(null);

  const [documentSearch, setDocumentSearch] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");

  const [currentTab, setCurrentTab] = useState("overview");

  // --------------------------------------------------
  // Authentication / admin access
  // --------------------------------------------------

  const isAdmin = useMemo(() => {
    try {
      const token = localStorage.getItem("access_token1");
      if (!token) return false;

      const decoded = jwt_decode(token);
      return decoded?.role?.toLowerCase() === "admin";
    } catch (error) {
      return false;
    }
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getImageUrl = (filename) => {
    if (!filename) return DEFAULT_AVATAR;

    if (
      filename.startsWith("http://") ||
      filename.startsWith("https://") ||
      filename.startsWith("data:")
    ) {
      return filename;
    }

    return `${BASE_URL}/images/${filename}`;
  };

  const formatDate = (value) => {
    if (!value) return "Not provided";

    const date = moment(value);
    return date.isValid() ? date.format("DD MMM YYYY") : value;
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") {
      return "Not provided";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return value;

    return `₹${numericValue.toLocaleString("en-IN")}`;
  };

  const displayValue = (value) => {
    return value !== undefined && value !== null && value !== ""
      ? value
      : "Not provided";
  };

  const maskAadhaar = (value) => {
    if (!value) return "Not provided";
    const digits = String(value);
    return digits.length >= 4
      ? `XXXX XXXX ${digits.slice(-4)}`
      : "XXXX";
  };

  const maskPAN = (value) => {
    if (!value) return "Not provided";
    const pan = String(value);
    if (pan.length < 5) return "XXXXX";
    return `${pan.slice(0, 2)}XXXXX${pan.slice(-2)}`;
  };

  const getFileExtension = (filename = "") => {
    return filename.split(".").pop()?.toLowerCase();
  };

  const isImageFile = (filename = "") => {
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(
      getFileExtension(filename)
    );
  };

  const isPdfFile = (filename = "") => {
    return getFileExtension(filename) === "pdf";
  };

  // --------------------------------------------------
  // Fetch employee profile
  // --------------------------------------------------

  const fetchEmployee = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const response = await axios.get(`${BASE_URL}/user/${id}`);

      // Your existing backend returns myData as an array.
      const responseData = response?.data?.myData;

      const employeeData = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      if (!employeeData) {
        setEmployee(null);
        message.error("Employee details not found.");
        return;
      }

      setEmployee(employeeData);

      profileForm.setFieldsValue({
        fatherName: employeeData.fatherName || "",
        motherName: employeeData.motherName || "",
        bloodGroup: employeeData.bloodGroup || "",
        joiningDate: employeeData.joiningDate
          ? moment(employeeData.joiningDate)
          : null,
        contactNumber: employeeData.contactNumber || "",
        permanentAddress: employeeData.permanentAddress || "",
        adharNumber: employeeData.adharNumber || "",
        panNumber: employeeData.panNumber || "",
        salary: employeeData.salary || "",
        appraisal: employeeData.appraisal
          ? moment(employeeData.appraisal)
          : null,
      });
    } catch (error) {
      console.error("Employee profile error:", error);
      message.error(
        error?.response?.data?.message ||
        "Unable to load employee profile."
      );
    } finally {
      setLoading(false);
    }
  }, [id, profileForm]);

  // --------------------------------------------------
  // Fetch employee documents
  // --------------------------------------------------

  const fetchDocuments = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axios.get(`${BASE_URL}/document/${id}`);

      setEmployeeDocuments(
        response?.data?.documentDataByEmpID || []
      );
    } catch (error) {
      console.error("Document fetch error:", error);
      message.error("Unable to load employee documents.");
    }
  }, [id]);

  // --------------------------------------------------
  // Fetch employee skills
  // --------------------------------------------------

  const fetchSkills = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axios.get(`${BASE_URL}/skill/emp/${id}`);

      setEmployeeSkills(
        response?.data?.SingleEmpAllData || []
      );
    } catch (error) {
      console.error("Skill fetch error:", error);
      setEmployeeSkills([]);
    }
  }, [id]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetchEmployee();
    fetchDocuments();
    fetchSkills();
  }, [isAdmin, fetchEmployee, fetchDocuments, fetchSkills]);

  // --------------------------------------------------
  // Edit employee information
  // --------------------------------------------------

  const openProfileModal = () => {
    if (!employee) return;

    profileForm.setFieldsValue({
      fatherName: employee.fatherName || "",
      motherName: employee.motherName || "",
      bloodGroup: employee.bloodGroup || "",
      joiningDate: employee.joiningDate
        ? moment(employee.joiningDate)
        : null,
      contactNumber: employee.contactNumber || "",
      permanentAddress: employee.permanentAddress || "",
      adharNumber: employee.adharNumber || "",
      panNumber: employee.panNumber || "",
      salary: employee.salary || "",
      appraisal: employee.appraisal
        ? moment(employee.appraisal)
        : null,
    });

    setProfileModalOpen(true);
  };

  const handleProfileUpdate = async (values) => {
    try {
      setSavingProfile(true);

      const payload = {
        fatherName: values.fatherName,
        motherName: values.motherName,
        bloodGroup: values.bloodGroup,
        joiningDate: values.joiningDate
          ? values.joiningDate.format("YYYY-MM-DD")
          : "",
        contactNumber: values.contactNumber,
        permanentAddress: values.permanentAddress,
        adharNumber: values.adharNumber,
        panNumber: values.panNumber,
        salary: values.salary,
        appraisal: values.appraisal
          ? values.appraisal.format("YYYY-MM-DD")
          : "",
      };

      await axios.put(`${BASE_URL}/user/${id}`, payload);

      message.success("Employee information updated successfully.");
      setProfileModalOpen(false);

      await fetchEmployee();
    } catch (error) {
      console.error("Profile update error:", error);
      message.error(
        error?.response?.data?.message ||
        "Unable to update employee information."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // --------------------------------------------------
  // Document upload
  // --------------------------------------------------

  const validateDocumentFile = (file) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "application/msword",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("Only JPG, PNG, PDF, DOC and DOCX files are allowed.");
      return Upload.LIST_IGNORE;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      message.error("File size must be less than 10 MB.");
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleDocumentUpload = async (values) => {
    if (!documentFile) {
      message.error("Please select a document file.");
      return;
    }

    try {
      setUploadingDocument(true);

      const formData = new FormData();

      formData.append("image", documentFile);
      formData.append("documentname", values.documentname);
      formData.append("documenttype", values.documenttype);

      // IMPORTANT: use the employee ID from the profile URL.
      formData.append("emp_id", id);

      await axios.post(
        `${BASE_URL}/document/add/${id}`,
        formData
      );

      message.success("Document uploaded successfully.");

      setDocumentModalOpen(false);
      setDocumentFile(null);
      documentForm.resetFields();

      await fetchDocuments();
    } catch (error) {
      console.error("Document upload error:", error);
      message.error(
        error?.response?.data?.message || "Document upload failed."
      );
    } finally {
      setUploadingDocument(false);
    }
  };

  // --------------------------------------------------
  // Edit document
  // --------------------------------------------------

  const openEditDocument = (record) => {
    setSelectedDocument(record);
    setEditDocumentFile(null);

    editDocumentForm.setFieldsValue({
      documentname: record.documentname || "",
      documenttype: record.documenttype || "",
    });

    setEditDocumentModalOpen(true);
  };

  const handleDocumentUpdate = async (values) => {
    if (!selectedDocument?._id) return;

    try {
      setSavingDocument(true);

      const formData = new FormData();

      formData.append("documentname", values.documentname);
      formData.append("documenttype", values.documenttype);

      if (editDocumentFile) {
        formData.append("image", editDocumentFile);
      }

      await axios.put(
        `${BASE_URL}/document/editmydoc/${selectedDocument._id}`,
        formData
      );

      message.success("Document updated successfully.");

      setEditDocumentModalOpen(false);
      setSelectedDocument(null);
      setEditDocumentFile(null);
      editDocumentForm.resetFields();

      await fetchDocuments();
    } catch (error) {
      console.error("Document update error:", error);
      message.error(
        error?.response?.data?.message || "Unable to update document."
      );
    } finally {
      setSavingDocument(false);
    }
  };

  // --------------------------------------------------
  // Delete document
  // --------------------------------------------------

  const handleDocumentDelete = (record) => {
    Modal.confirm({
      title: "Delete document?",
      content: `Are you sure you want to delete "${record.documentname}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`${BASE_URL}/document/${record._id}`);

          message.success("Document deleted successfully.");

          setEmployeeDocuments((previous) =>
            previous.filter((doc) => doc._id !== record._id)
          );
        } catch (error) {
          console.error("Document delete error:", error);
          message.error("Unable to delete document.");
        }
      },
    });
  };

  // --------------------------------------------------
  // Document preview and download
  // --------------------------------------------------

  const openDocumentPreview = (record) => {
    setSelectedDocument(record);
    setPreviewModalOpen(true);
  };

  const downloadDocument = (record) => {
    if (!record?.image) {
      message.error("Document file not available.");
      return;
    }

    const fileUrl = `${BASE_URL}/images/${record.image}`;

    saveAs(fileUrl, record.image);
  };

  // --------------------------------------------------
  // Change employee password
  // --------------------------------------------------

  const handlePasswordChange = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      /*
       * This is the password-specific endpoint mentioned in your
       * existing project context. Confirm that this route exists
       * in your backend and accepts { password: ... }.
       */
      await axios.put(
        `${BASE_URL}/user/forchangepassword/${id}`,
        {
          password: values.newPassword,
        }
      );

      message.success("Employee password changed successfully.");

      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error("Password change error:", error);

      message.error(
        error?.response?.data?.message ||
        "Unable to change password. Please verify the password API route."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // --------------------------------------------------
  // Filter documents
  // --------------------------------------------------

  const filteredDocuments = useMemo(() => {
    return employeeDocuments.filter((doc) => {
      const search = documentSearch.toLowerCase();

      const matchesSearch =
        !search ||
        doc.documentname?.toLowerCase().includes(search) ||
        doc.documenttype?.toLowerCase().includes(search) ||
        doc.image?.toLowerCase().includes(search);

      const matchesType =
        documentTypeFilter === "all" ||
        doc.documenttype === documentTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [employeeDocuments, documentSearch, documentTypeFilter]);

  const uniqueDocumentTypes = useMemo(() => {
    return [
      ...new Set(
        employeeDocuments
          .map((doc) => doc.documenttype)
          .filter(Boolean)
      ),
    ];
  }, [employeeDocuments]);

  // --------------------------------------------------
  // Document table
  // --------------------------------------------------

  const documentColumns = [
    {
      title: "DOCUMENT",
      key: "document",
      render: (_, record) => (
        <div className="ep-document-info">
          <div className="ep-document-icon">
            {isPdfFile(record.image) ? (
              <FilePdfOutlined />
            ) : isImageFile(record.image) ? (
              <CameraOutlined />
            ) : (
              <FileTextOutlined />
            )}
          </div>

          <div>
            <Text strong className="ep-document-name">
              {record.documentname || "Untitled document"}
            </Text>
            <Text type="secondary" className="ep-document-filename">
              {record.image || "File not available"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "documenttype",
      key: "documenttype",
      render: (value) => (
        <Tag color="blue">{value || "Other"}</Tag>
      ),
    },
    {
      title: "FILE TYPE",
      dataIndex: "image",
      key: "filetype",
      render: (value) => (
        <Text type="secondary">
          {getFileExtension(value)?.toUpperCase() || "FILE"}
        </Text>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDocumentPreview(record)}
            />
          </Tooltip>

          <Tooltip title="Download">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadDocument(record)}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditDocument(record)}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDocumentDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --------------------------------------------------
  // Skills table
  // --------------------------------------------------

  const skillColumns = [
    {
      title: "SKILL",
      dataIndex: "skillname",
      key: "skillname",
      render: (value) => (
        <Text strong>{displayValue(value)}</Text>
      ),
    },
    {
      title: "EXPERIENCE",
      dataIndex: "skillExperience",
      key: "experience",
      render: (value) => displayValue(value),
    },
    {
      title: "RATING",
      dataIndex: "skillrating",
      key: "rating",
      render: (value) => (
        <Rate disabled value={Number(value) || 0} />
      ),
    },
  ];

  // --------------------------------------------------
  // Access control
  // --------------------------------------------------

  if (!isAdmin) {
    return (
      <div className="ep-access-denied">
        <SafetyCertificateOutlined />
        <Title level={3}>Access restricted</Title>
        <Text type="secondary">
          Only administrators can view employee profiles from the directory.
        </Text>
        <Button type="primary" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="employee-profile-page ep-loading">
        <Skeleton active avatar paragraph={{ rows: 5 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="ep-access-denied">
        <Empty description="Employee profile not found">
          <Button type="primary" onClick={() => navigate(-1)}>
            Back to employees
          </Button>
        </Empty>
      </div>
    );
  }

  // --------------------------------------------------
  // Derived employee information
  // --------------------------------------------------

  const employeeName = employee.name || "Employee";

  const employeeInitials = employeeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const profilePicture = getImageUrl(employee.profilepicture);

  const joiningDate = employee.joiningDate
    ? moment(employee.joiningDate)
    : null;

  const yearsOfService =
    joiningDate && joiningDate.isValid()
      ? Math.max(0, moment().diff(joiningDate, "years"))
      : null;

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="employee-profile-page">
      {/* Page heading */}

      <div className="ep-page-heading">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="ep-back-button"
            onClick={() => navigate(-1)}
          >
            Back to employee directory
          </Button>

          <Title level={3}>Employee Profile</Title>

          <Text type="secondary">
            View and manage employee information, skills and documents.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchEmployee();
              fetchDocuments();
              fetchSkills();
            }}
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={openProfileModal}
          >
            Edit details
          </Button>
        </Space>
      </div>

      {/* Employee hero card */}

      <Card className="ep-hero-card" bordered={false}>
        <Row align="middle" gutter={[24, 20]}>
          <Col>
            <Avatar
              className="ep-profile-avatar"
              size={112}
              src={profilePicture}
              icon={<UserOutlined />}
            >
              {employeeInitials}
            </Avatar>
          </Col>

          <Col flex="1">
            <div className="ep-employee-identity">
              <div className="ep-name-row">
                <Title level={2}>{employeeName}</Title>

                <Tag color="green">
                  <CheckCircleOutlined /> Profile
                </Tag>
              </div>

              <Text className="ep-designation">
                {displayValue(employee.role)}
              </Text>

              <div className="ep-identity-details">
                <span>
                  <MailOutlined />
                  {displayValue(employee.email)}
                </span>

                <span>
                  <PhoneOutlined />
                  {displayValue(employee.contact)}
                </span>

                <span>
                  <IdcardOutlined />
                  ID: {employee._id}
                </span>
              </div>
            </div>
          </Col>

          <Col>
            <div className="ep-hero-actions">
              <Button
                icon={<LockOutlined />}
                onClick={() => setPasswordModalOpen(true)}
              >
                Change password
              </Button>

              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openProfileModal}
              >
                Edit profile
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Summary cards */}

      <Row gutter={[16, 16]} className="ep-stat-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="ep-stat-card">
            <Statistic
              title="Joining date"
              value={joiningDate ? joiningDate.format("DD MMM YYYY") : "—"}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: 18 }}
            />
            <Text type="secondary">
              {yearsOfService !== null
                ? `${yearsOfService} years of service`
                : "Joining date not available"}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="ep-stat-card">
            <Statistic
              title="Department"
              value={employee.department || "—"}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
            <Text type="secondary">Employee department</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="ep-stat-card">
            <Statistic
              title="Skills"
              value={employeeSkills.length}
              prefix={<SafetyCertificateOutlined />}
            />
            <Text type="secondary">Recorded skills</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="ep-stat-card">
            <Statistic
              title="Documents"
              value={employeeDocuments.length}
              prefix={<FileTextOutlined />}
            />
            <Text type="secondary">Uploaded documents</Text>
          </Card>
        </Col>
      </Row>

      {/* Main content */}

      <Card className="ep-main-card" bordered={false}>
        <Tabs
          activeKey={currentTab}
          onChange={setCurrentTab}
          className="ep-tabs"
        >
          {/* OVERVIEW */}

          <TabPane
            tab={
              <span>
                <UserOutlined /> Overview
              </span>
            }
            key="overview"
          >
            <div className="ep-section-heading">
              <div>
                <Title level={4}>Employee overview</Title>
                <Text type="secondary">
                  A quick summary of this employee's profile.
                </Text>
              </div>

              <Button
                icon={<EditOutlined />}
                onClick={openProfileModal}
              >
                Edit information
              </Button>
            </div>

            <Row gutter={[20, 20]}>
              <Col xs={24} lg={14}>
                <Card className="ep-inner-card" title="Personal information">
                  <Descriptions
                    column={{ xs: 1, sm: 2 }}
                    size="middle"
                  >
                    <Descriptions.Item label="Full name">
                      {displayValue(employee.name)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Email">
                      {displayValue(employee.email)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mobile number">
                      {displayValue(employee.contact)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Emergency contact">
                      {displayValue(employee.contactNumber)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Blood group">
                      {displayValue(employee.bloodGroup)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Gender">
                      {displayValue(employee.gender)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Father's name">
                      {displayValue(employee.fatherName)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mother's name">
                      {displayValue(employee.motherName)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} lg={10}>
                <Card className="ep-inner-card" title="Employment summary">
                  <div className="ep-summary-list">
                    <div>
                      <span>Designation</span>
                      <strong>{displayValue(employee.role)}</strong>
                    </div>

                    <div>
                      <span>Department</span>
                      <strong>{displayValue(employee.department)}</strong>
                    </div>

                    <div>
                      <span>Joining date</span>
                      <strong>{formatDate(employee.joiningDate)}</strong>
                    </div>

                    <div>
                      <span>Last appraisal</span>
                      <strong>{formatDate(employee.appraisal)}</strong>
                    </div>

                    <div>
                      <span>Salary</span>
                      <strong>{formatCurrency(employee.salary)}</strong>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24}>
                <Card className="ep-inner-card" title="Address">
                  <Paragraph className="ep-address-text">
                    <EnvironmentOutlined />
                    {displayValue(employee.permanentAddress)}
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* PERSONAL INFORMATION */}

          <TabPane
            tab={
              <span>
                <IdcardOutlined /> Personal information
              </span>
            }
            key="personal"
          >
            <div className="ep-section-heading">
              <div>
                <Title level={4}>Personal information</Title>
                <Text type="secondary">
                  Contact, family and identification information.
                </Text>
              </div>

              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openProfileModal}
              >
                Edit details
              </Button>
            </div>

            <Card className="ep-inner-card">
              <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
                <Descriptions.Item label="Full name">
                  {displayValue(employee.name)}
                </Descriptions.Item>

                <Descriptions.Item label="Email">
                  {displayValue(employee.email)}
                </Descriptions.Item>

                <Descriptions.Item label="Mobile number">
                  {displayValue(employee.contact)}
                </Descriptions.Item>

                <Descriptions.Item label="Emergency contact">
                  {displayValue(employee.contactNumber)}
                </Descriptions.Item>

                <Descriptions.Item label="Father's name">
                  {displayValue(employee.fatherName)}
                </Descriptions.Item>

                <Descriptions.Item label="Mother's name">
                  {displayValue(employee.motherName)}
                </Descriptions.Item>

                <Descriptions.Item label="Blood group">
                  {displayValue(employee.bloodGroup)}
                </Descriptions.Item>

                <Descriptions.Item label="Gender">
                  {displayValue(employee.gender)}
                </Descriptions.Item>

                <Descriptions.Item label="Aadhaar number">
                  {maskAadhaar(employee.adharNumber)}
                </Descriptions.Item>

                <Descriptions.Item label="PAN number">
                  {maskPAN(employee.panNumber)}
                </Descriptions.Item>

                <Descriptions.Item label="Permanent address" span={2}>
                  {displayValue(employee.permanentAddress)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>

          {/* EMPLOYMENT */}

          <TabPane
            tab={
              <span>
                <BankOutlined /> Employment
              </span>
            }
            key="employment"
          >
            <div className="ep-section-heading">
              <div>
                <Title level={4}>Employment information</Title>
                <Text type="secondary">
                  Current employee designation and employment details.
                </Text>
              </div>

              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openProfileModal}
              >
                Edit details
              </Button>
            </div>

            <Card className="ep-inner-card">
              <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
                <Descriptions.Item label="Employee name">
                  {displayValue(employee.name)}
                </Descriptions.Item>

                <Descriptions.Item label="Employee ID">
                  {employee._id}
                </Descriptions.Item>

                <Descriptions.Item label="Role / Designation">
                  <Tag color="blue">{displayValue(employee.role)}</Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Department">
                  {displayValue(employee.department)}
                </Descriptions.Item>

                <Descriptions.Item label="Joining date">
                  {formatDate(employee.joiningDate)}
                </Descriptions.Item>

                <Descriptions.Item label="Years of service">
                  {yearsOfService !== null
                    ? `${yearsOfService} years`
                    : "Not available"}
                </Descriptions.Item>

                <Descriptions.Item label="Current salary">
                  {formatCurrency(employee.salary)}
                </Descriptions.Item>

                <Descriptions.Item label="Last appraisal">
                  {formatDate(employee.appraisal)}
                </Descriptions.Item>

                <Descriptions.Item label="LinkedIn profile" span={2}>
                  {employee.linkedinprofilelink ? (
                    <a
                      href={employee.linkedinprofilelink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkedinOutlined /> View LinkedIn profile
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>

          {/* SKILLS */}

          <TabPane
            tab={
              <span>
                <SafetyCertificateOutlined /> Skills
                <Badge
                  count={employeeSkills.length}
                  className="ep-tab-badge"
                />
              </span>
            }
            key="skills"
          >
            <div className="ep-section-heading">
              <div>
                <Title level={4}>Employee skills</Title>
                <Text type="secondary">
                  Skills, experience and ratings recorded for this employee.
                </Text>
              </div>
            </div>

            <Card className="ep-inner-card">
              <Table
                rowKey={(record, index) => record._id || index}
                columns={skillColumns}
                dataSource={employeeSkills}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty description="No skills have been added yet." />
                  ),
                }}
                scroll={{ x: 600 }}
              />
            </Card>
          </TabPane>

          {/* DOCUMENTS */}

          <TabPane
            tab={
              <span>
                <FileTextOutlined /> Documents
                <Badge
                  count={employeeDocuments.length}
                  className="ep-tab-badge"
                />
              </span>
            }
            key="documents"
          >
            <div className="ep-section-heading ep-document-heading">
              <div>
                <Title level={4}>Employee documents</Title>
                <Text type="secondary">
                  Manage education, experience and certificate documents.
                </Text>
              </div>

              <Button
                type="primary"
                icon={<FileAddOutlined />}
                onClick={() => {
                  documentForm.resetFields();
                  setDocumentFile(null);
                  setDocumentModalOpen(true);
                }}
              >
                Add document
              </Button>
            </div>

            <Card className="ep-inner-card">
              <Row gutter={[12, 12]} className="ep-document-filters">
                <Col xs={24} md={14}>
                  <Input
                    allowClear
                    prefix={<EyeOutlined />}
                    placeholder="Search documents..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                  />
                </Col>

                <Col xs={24} md={10}>
                  <Select
                    value={documentTypeFilter}
                    onChange={setDocumentTypeFilter}
                    style={{ width: "100%" }}
                  >
                    <Option value="all">All document categories</Option>

                    {uniqueDocumentTypes.map((type) => (
                      <Option value={type} key={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>

              <Table
                rowKey="_id"
                columns={documentColumns}
                dataSource={filteredDocuments}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: true,
                  showTotal: (total) => `${total} documents`,
                }}
                scroll={{ x: 700 }}
                locale={{
                  emptyText: (
                    <Empty description="No employee documents found." />
                  ),
                }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* EDIT PROFILE MODAL */}

      <Modal
        title={
          <span>
            <EditOutlined /> Edit employee information
          </span>
        }
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        width={850}
        destroyOnClose={false}
        className="ep-modal"
      >
        <Alert
          type="info"
          showIcon
          message="Update employee information"
          description="Changes will be saved to this employee's profile."
          className="ep-modal-alert"
        />

        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
        >
          <Title level={5}>Family information</Title>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Father's name"
                name="fatherName"
                rules={[
                  { required: true, message: "Please enter father's name." },
                ]}
              >
                <Input placeholder="Enter father's name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Mother's name"
                name="motherName"
                rules={[
                  { required: true, message: "Please enter mother's name." },
                ]}
              >
                <Input placeholder="Enter mother's name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Blood group"
                name="bloodGroup"
                rules={[{ required: true, message: "Select blood group." }]}
              >
                <Select placeholder="Select blood group">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (group) => (
                      <Option key={group} value={group}>
                        {group}
                      </Option>
                    )
                  )}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Emergency contact number"
                name="contactNumber"
                rules={[
                  { required: true, message: "Enter emergency contact." },
                  {
                    pattern: /^\d{10}$/,
                    message: "Enter a valid 10-digit number.",
                  },
                ]}
              >
                <Input maxLength={10} placeholder="10-digit number" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>Employment information</Title>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Date of joining"
                name="joiningDate"
                rules={[
                  { required: true, message: "Select joining date." },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Current salary"
                name="salary"
                rules={[
                  { required: true, message: "Enter current salary." },
                  {
                    pattern: /^\d+(\.\d{1,2})?$/,
                    message: "Enter a valid salary amount.",
                  },
                ]}
              >
                <Input placeholder="Enter salary" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Last appraisal date" name="appraisal">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>Identification and contact</Title>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Aadhaar number"
                name="adharNumber"
                rules={[
                  { required: true, message: "Enter Aadhaar number." },
                  {
                    pattern: /^\d{12}$/,
                    message: "Aadhaar number must contain 12 digits.",
                  },
                ]}
              >
                <Input maxLength={12} placeholder="12-digit Aadhaar number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="PAN number"
                name="panNumber"
                rules={[
                  { required: true, message: "Enter PAN number." },
                  {
                    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/i,
                    message: "Enter a valid PAN number.",
                  },
                ]}
              >
                <Input maxLength={10} placeholder="ABCDE1234F" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Permanent address"
                name="permanentAddress"
                rules={[
                  { required: true, message: "Enter permanent address." },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Enter complete permanent address"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="ep-modal-footer">
            <Button onClick={() => setProfileModalOpen(false)}>
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={savingProfile}
            >
              Save changes
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ADD DOCUMENT MODAL */}

      <Modal
        title={
          <span>
            <FileAddOutlined /> Add employee document
          </span>
        }
        open={documentModalOpen}
        onCancel={() => setDocumentModalOpen(false)}
        footer={null}
        destroyOnClose={false}
        className="ep-modal"
      >
        <Form
          form={documentForm}
          layout="vertical"
          onFinish={handleDocumentUpload}
        >
          <Form.Item
            label="Document name"
            name="documentname"
            rules={[
              { required: true, message: "Enter document name." },
            ]}
          >
            <Input placeholder="e.g. Graduation Certificate" />
          </Form.Item>

          <Form.Item
            label="Document category"
            name="documenttype"
            rules={[
              { required: true, message: "Select document category." },
            ]}
          >
            <Select placeholder="Select category">
              <Option value="Education">Education</Option>
              <Option value="Experience">Experience</Option>
              <Option value="Certificate">Certificate</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Upload file" required>
            <Upload.Dragger
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              maxCount={1}
              beforeUpload={(file) => {
                const result = validateDocumentFile(file);

                if (result === false) {
                  setDocumentFile(file);
                  return false;
                }

                return result;
              }}
              onRemove={() => {
                setDocumentFile(null);
              }}
              fileList={
                documentFile
                  ? [
                    {
                      uid: documentFile.uid,
                      name: documentFile.name,
                      status: "done",
                    },
                  ]
                  : []
              }
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag a file to upload
              </p>
              <p className="ant-upload-hint">
                JPG, PNG, PDF, DOC and DOCX. Maximum 10 MB.
              </p>
            </Upload.Dragger>
          </Form.Item>

          <div className="ep-modal-footer">
            <Button onClick={() => setDocumentModalOpen(false)}>
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={uploadingDocument}
            >
              Upload document
            </Button>
          </div>
        </Form>
      </Modal>

      {/* EDIT DOCUMENT MODAL */}

      <Modal
        title={
          <span>
            <EditOutlined /> Edit document
          </span>
        }
        open={editDocumentModalOpen}
        onCancel={() => setEditDocumentModalOpen(false)}
        footer={null}
        className="ep-modal"
      >
        <Form
          form={editDocumentForm}
          layout="vertical"
          onFinish={handleDocumentUpdate}
        >
          <Form.Item
            label="Document name"
            name="documentname"
            rules={[
              { required: true, message: "Enter document name." },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Document category"
            name="documenttype"
            rules={[
              { required: true, message: "Select document category." },
            ]}
          >
            <Select>
              <Option value="Education">Education</Option>
              <Option value="Experience">Experience</Option>
              <Option value="Certificate">Certificate</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Replace document (optional)">
            <Upload
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              maxCount={1}
              beforeUpload={(file) => {
                const result = validateDocumentFile(file);

                if (result === false) {
                  setEditDocumentFile(file);
                  return false;
                }

                return result;
              }}
              onRemove={() => setEditDocumentFile(null)}
              fileList={
                editDocumentFile
                  ? [
                    {
                      uid: editDocumentFile.uid,
                      name: editDocumentFile.name,
                      status: "done",
                    },
                  ]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>
                Choose replacement file
              </Button>
            </Upload>
          </Form.Item>

          <Text type="secondary">
            Leave this empty if you only want to update the document name or category.
          </Text>

          <div className="ep-modal-footer">
            <Button onClick={() => setEditDocumentModalOpen(false)}>
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={savingDocument}
            >
              Save changes
            </Button>
          </div>
        </Form>
      </Modal>

      {/* DOCUMENT PREVIEW MODAL */}

      <Modal
        title={
          <span>
            <FileTextOutlined /> Document preview
          </span>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setPreviewModalOpen(false)}
          >
            Close
          </Button>,

          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => downloadDocument(selectedDocument)}
          >
            Download
          </Button>,
        ]}
        width={750}
        className="ep-modal"
      >
        {selectedDocument && (
          <div className="ep-preview-container">
            <Title level={5}>
              {selectedDocument.documentname}
            </Title>

            <Text type="secondary">
              {selectedDocument.documenttype}
            </Text>

            <Divider />

            {isImageFile(selectedDocument.image) ? (
              <Image
                src={getImageUrl(selectedDocument.image)}
                className="ep-document-preview-image"
                alt={selectedDocument.documentname}
              />
            ) : isPdfFile(selectedDocument.image) ? (
              <iframe
                title="Employee document PDF"
                src={getImageUrl(selectedDocument.image)}
                className="ep-document-pdf-preview"
              />
            ) : (
              <div className="ep-file-preview">
                <FileTextOutlined />
                <Title level={5}>
                  Preview is not available for this file type.
                </Title>
                <Text type="secondary">
                  Download the file to view its contents.
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CHANGE PASSWORD MODAL */}

      <Modal
        title={
          <span>
            <LockOutlined /> Change employee password
          </span>
        }
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        className="ep-modal"
      >
        <Alert
          type="warning"
          showIcon
          message="Password reset"
          description="You are changing the password for the employee currently being viewed."
          className="ep-modal-alert"
        />

        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: "Enter a new password." },
              { min: 8, message: "Password must be at least 8 characters." },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Confirm the new password." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue("newPassword") === value
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("The two passwords do not match.")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <div className="ep-modal-footer">
            <Button
              onClick={() => {
                setPasswordModalOpen(false);
                passwordForm.resetFields();
              }}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={changingPassword}
            >
              Change password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeProfile;