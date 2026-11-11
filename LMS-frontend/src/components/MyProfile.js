
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import jwt_decode from "../utils/jwtSafe";
import { saveAs } from "file-saver";

import {
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
  List,
  message,
  Modal,
  Progress,
  Rate,
  Row,
  Select,
  Skeleton,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";

import {
  UserOutlined,
  EditOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  IdcardOutlined,
  LinkedinOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  CopyOutlined,
  BankOutlined,
  ReloadOutlined,
  HomeOutlined,
} from "@ant-design/icons";

import "./MyProfile.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const BASE_URL = process.env.REACT_APP_BASE_URL;

const IMAGE_PLACEHOLDER =
  "https://cdn.vectorstock.com/i/preview-1x/66/14/default-avatar-photo-placeholder-profile-picture-vector-21806614.webp";

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = moment(
    value,
    ["DD/MM/YYYY", "YYYY-MM-DD", moment.ISO_8601],
    true
  );

  return date.isValid() ? date.format("DD MMM YYYY") : value;
};

const getFileUrl = (filename) => {
  if (!filename) return "";

  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("data:")
  ) {
    return filename;
  }

  return `${BASE_URL}/images/${filename}`;
};

const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getUserFromResponse = (data) => {
  const user = data?.myData;

  return Array.isArray(user) ? user[0] : user;
};

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [addDocumentModalOpen, setAddDocumentModalOpen] = useState(false);
  const [editDocumentModalOpen, setEditDocumentModalOpen] = useState(false);
  const [viewDocumentModalOpen, setViewDocumentModalOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentPreview, setDocumentPreview] = useState("");

  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [editDocumentFile, setEditDocumentFile] = useState(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [personalForm] = Form.useForm();
  const [addDocumentForm] = Form.useForm();
  const [editDocumentForm] = Form.useForm();

  const getLoggedInUserId = () => {
    const token = localStorage.getItem("access_token1");

    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const decoded = jwt_decode(token);

    if (!decoded?._id) {
      throw new Error("Unable to identify the logged-in user.");
    }

    return decoded._id;
  };
  const maskAadhaar = (value) => {
    if (!value) return "Not provided";
    const digits = String(value).replace(/\s/g, "");
    return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : "XXXX";
  };

  const formatAadhaar = (value) => {
    if (!value) return "Not provided";
    return String(value).replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const maskPAN = (value) => {
    if (!value) return "Not provided";
    const pan = String(value);
    return pan.length >= 5 ? `${pan.slice(0, 2)}XXXXX${pan.slice(-2)}` : "XXXXX";
  };

  const formatSalary = (value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "Not provided";
    }
    const n = Number(value);
    return Number.isNaN(n) ? value : `₹ ${n.toLocaleString("en-IN")}`;
  };
  // ----------------------------------------------------
  // FETCH PROFILE, SKILLS AND DOCUMENTS
  // ----------------------------------------------------

  const fetchProfile = async () => {
    const userId = getLoggedInUserId();

    const response = await axios.get(`${BASE_URL}/user/${userId}`);

    const user = getUserFromResponse(response.data);

    if (!user) {
      throw new Error("Your profile not found.");
    }

    setProfile(user);

    return user;
  };

  const fetchSkills = async () => {
    const userId = getLoggedInUserId();

    try {
      const response = await axios.get(`${BASE_URL}/skill/emp/${userId}`);

      const result = response.data?.SingleEmpAllData;

      setSkills(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Skills fetch error:", error);
      setSkills([]);
    }
  };
  const getVerificationColor = (status) => {
    switch (status) {
      case "Verified":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "processing";
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) {
      return {
        label: "No expiry",
        color: "default",
      };
    }

    const expiry = moment(expiryDate).startOf("day");
    const today = moment().startOf("day");
    const daysLeft = expiry.diff(today, "days");

    if (daysLeft < 0) {
      return {
        label: "Expired",
        color: "error",
      };
    }

    if (daysLeft <= 30) {
      return {
        label: `Expires in ${daysLeft} days`,
        color: "warning",
      };
    }

    return {
      label: expiry.format("DD MMM YYYY"),
      color: "success",
    };
  };
  const fetchDocuments = async () => {
    const userId = getLoggedInUserId();

    try {
      const response = await axios.get(`${BASE_URL}/document/${userId}`);

      const result = response.data?.documentDataByEmpID;

      setDocuments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Documents fetch error:", error);
      setDocuments([]);
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchProfile(),
        fetchSkills(),
        fetchDocuments(),
      ]);
    } catch (error) {
      console.error("Profile loading error:", error);

      message.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------
  // PROFILE COMPLETION
  // ----------------------------------------------------

  const completionFields = [
    "name",
    "email",
    "contact",
    "gender",
    "department",
    "joiningDate",
    "fatherName",
    "motherName",
    "bloodGroup",
    "contactNumber",
    "permanentAddress",
    "linkedinprofilelink",
    "profilepicture",
  ];

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;

    const completed = completionFields.filter((field) => {
      return (
        profile[field] !== undefined &&
        profile[field] !== null &&
        String(profile[field]).trim() !== ""
      );
    }).length;

    return Math.round((completed / completionFields.length) * 100);
  }, [profile]);

  // ----------------------------------------------------
  // PROFILE IMAGE
  // ----------------------------------------------------

  const profileImage = getFileUrl(
    profile?.profilepicture || profile?.imageUrl
  );

  const handleProfilePictureUpload = async (file) => {
    const isValidType = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ].includes(file.type);

    if (!isValidType) {
      message.error("Please upload a JPG, PNG or WEBP image.");
      return Upload.LIST_IGNORE;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error("Profile picture must be smaller than 5 MB.");
      return Upload.LIST_IGNORE;
    }

    try {
      setUploadingPicture(true);

      const userId = getLoggedInUserId();

      const formData = new FormData();

      formData.append("image", file);
      formData.append("documenttype", "Picture");
      formData.append("documentname", "Profile Picture");
      formData.append("emp_id", userId);

      const uploadResponse = await axios.post(
        `${BASE_URL}/document/add/${userId}`,
        formData
      );

      const uploadedImage =
        uploadResponse.data?.documentRecord?.image;

      if (!uploadedImage) {
        throw new Error("Image upload did not return a file name.");
      }

      await axios.put(`${BASE_URL}/user/${userId}`, {
        profilepicture: uploadedImage,
      });

      // Preserve the existing attendance profile-picture update.
      try {
        const attendanceResponse = await axios.get(
          `${BASE_URL}/attendance/singlemploy/${userId}`
        );

        const attendanceRecords =
          attendanceResponse.data?.SingleEmployeeAllAttendance || [];

        if (attendanceRecords.length > 0) {
          await axios.put(
            `${BASE_URL}/attendance/addon/${attendanceRecords[0]._id}`,
            {
              myprofilepic: uploadedImage,
            }
          );
        }
      } catch (attendanceError) {
        console.error(
          "Attendance picture update error:",
          attendanceError
        );
      }

      setProfile((previous) => ({
        ...previous,
        profilepicture: uploadedImage,
      }));

      message.success("Profile picture updated successfully.");

      fetchDocuments();
    } catch (error) {
      console.error("Profile picture upload error:", error);

      message.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to upload profile picture."
      );
    } finally {
      setUploadingPicture(false);
    }

    return false;
  };

  // ----------------------------------------------------
  // EDIT PERSONAL INFORMATION
  // ----------------------------------------------------

  const openPersonalModal = () => {
    if (!profile) return;

    personalForm.setFieldsValue({
      name: profile.name || "",
      email: profile.email || "",
      contact:
        profile.contact !== undefined && profile.contact !== null
          ? String(profile.contact)
          : "",
      gender: profile.gender || undefined,
      fatherName: profile.fatherName || "",
      motherName: profile.motherName || "",
      bloodGroup: profile.bloodGroup || undefined,
      contactNumber: profile.contactNumber || "",
      permanentAddress: profile.permanentAddress || "",
      linkedinprofilelink: profile.linkedinprofilelink || "",
      joiningDate: profile.joiningDate
        ? moment(
          profile.joiningDate,
          ["DD/MM/YYYY", "YYYY-MM-DD", moment.ISO_8601],
          true
        )
        : null,
      adharNumber: profile.adharNumber || "",
      panNumber: profile.panNumber || "",
      salary: profile.salary || "",
      appraisal: profile.appraisal
        ? moment(
          profile.appraisal,
          ["DD/MM/YYYY", "YYYY-MM-DD", moment.ISO_8601],
          true
        )
        : null,
    });

    setPersonalModalOpen(true);
  };

  const savePersonalInformation = async () => {
    try {
      const values = await personalForm.validateFields();

      setSavingProfile(true);

      const userId = getLoggedInUserId();

      const payload = {
        name: values.name?.trim(),
        email: values.email?.trim().toLowerCase(),
        contact: values.contact?.trim(),
        gender: values.gender,
        fatherName: values.fatherName?.trim(),
        motherName: values.motherName?.trim(),
        bloodGroup: values.bloodGroup,
        contactNumber: values.contactNumber?.trim(),
        permanentAddress: values.permanentAddress?.trim(),
        linkedinprofilelink: values.linkedinprofilelink?.trim(),
        joiningDate: values.joiningDate
          ? values.joiningDate.format("DD/MM/YYYY")
          : "",
        adharNumber: values.adharNumber?.trim(),
        panNumber: values.panNumber?.trim().toUpperCase(),
        salary: values.salary?.trim(),
        appraisal: values.appraisal
          ? values.appraisal.format("DD/MM/YYYY")
          : "",
      };

      const response = await axios.put(
        `${BASE_URL}/user/${userId}`,
        payload
      );

      const updatedUser =
        response.data?.updated_employee ||
        getUserFromResponse(response.data);

      if (updatedUser) {
        setProfile((previous) => ({
          ...previous,
          ...updatedUser,
        }));
      } else {
        await fetchProfile();
      }

      message.success("Personal information updated successfully.");

      setPersonalModalOpen(false);
    } catch (error) {
      if (error.errorFields) return;

      console.error("Profile update error:", error);

      message.error(
        error.response?.data?.message ||
        "Unable to update personal information."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // DOCUMENT UPLOAD
  // ----------------------------------------------------

  const validateDocumentFile = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("Only JPG, PNG, PDF and Word files are allowed.");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("Document size must be smaller than 10 MB.");
      return false;
    }

    return true;
  };

  const handleAddDocument = async () => {
    try {
      const values = await addDocumentForm.validateFields();

      if (!selectedDocumentFile) {
        message.error("Please select a document file.");
        return;
      }

      setSavingDocument(true);

      const userId = getLoggedInUserId();
      const formData = new FormData();

      formData.append("image", selectedDocumentFile);
      formData.append("documentname", values.documentname.trim());
      formData.append("documenttype", values.documenttype);
      formData.append("description", values.description || "");
      formData.append(
        "expiryDate",
        values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : ""
      );
      formData.append("emp_id", userId);

      await axios.post(`${BASE_URL}/document/add/${userId}`, formData);

      message.success("Document uploaded successfully.");

      setAddDocumentModalOpen(false);
      addDocumentForm.resetFields();
      setSelectedDocumentFile(null);

      await fetchDocuments();
    } catch (error) {
      if (error.errorFields) return;

      console.error("Document upload error:", error);

      message.error(
        error.response?.data?.message || "Unable to upload document."
      );
    } finally {
      setSavingDocument(false);
    }
  };

  // ----------------------------------------------------
  // EDIT DOCUMENT
  // ----------------------------------------------------

  const openEditDocument = (record) => {
    setSelectedDocument(record);
    setEditDocumentFile(null);

    editDocumentForm.setFieldsValue({
      documentname: record.documentname || "",
      documenttype: record.documenttype || undefined,
      description: record.description || "",
      expiryDate: record.expiryDate
        ? moment(record.expiryDate)
        : null,
    });

    setEditDocumentModalOpen(true);
  };

  const handleEditDocument = async () => {
    try {
      const values = await editDocumentForm.validateFields();

      setSavingDocument(true);

      const formData = new FormData();

      formData.append("documentname", values.documentname.trim());
      formData.append("documenttype", values.documenttype);
      formData.append("description", values.description || "");
      formData.append(
        "expiryDate",
        values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : ""
      );

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

      await fetchDocuments();
    } catch (error) {
      if (error.errorFields) return;

      console.error("Document update error:", error);

      message.error(
        error.response?.data?.message || "Unable to update document."
      );
    } finally {
      setSavingDocument(false);
    }
  };

  // ----------------------------------------------------
  // VIEW AND DOWNLOAD DOCUMENT
  // ----------------------------------------------------

  const openViewDocument = (record) => {
    setSelectedDocument(record);
    setDocumentPreview(getFileUrl(record.image));
    setViewDocumentModalOpen(true);
  };

  const downloadDocument = () => {
    if (!selectedDocument?.image) {
      message.error("Document file is not available.");
      return;
    }

    const fileUrl = getFileUrl(selectedDocument.image);

    saveAs(
      fileUrl,
      selectedDocument.image.split("/").pop() ||
      selectedDocument.documentname ||
      "document"
    );
  };

  // ----------------------------------------------------
  // DELETE DOCUMENT
  // ----------------------------------------------------

  const deleteDocument = (record) => {
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

          setDocuments((previous) =>
            previous.filter((item) => item._id !== record._id)
          );
        } catch (error) {
          console.error("Document deletion error:", error);

          message.error(
            error.response?.data?.message ||
            "Unable to delete document."
          );
        }
      },
    });
  };

  // ----------------------------------------------------
  // DOCUMENT TABLE
  // ----------------------------------------------------

  const documentColumns = [
    {
      title: "DOCUMENT",
      dataIndex: "documentname",
      key: "documentname",
      width: 220,
      render: (value, record) => (
        <Space align="start">
          <div className="profile-document-icon">
            <FileTextOutlined />
          </div>

          <div>
            <Text strong>{value || "Untitled document"}</Text>
            <br />
            <Text type="secondary" className="profile-small-text">
              {record.image?.split("/").pop() || "File unavailable"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "documenttype",
      key: "documenttype",
      render: (value) => <Tag color="blue">{value || "Other"}</Tag>,
    },
    {
      title: "DESCRIPTION",
      dataIndex: "description",
      key: "description",
      width: 200,
      render: (value) => (
        <Tooltip title={value || "No description"}>
          <Text type="secondary" ellipsis style={{ maxWidth: 180 }}>
            {value || "—"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "VERIFICATION",
      dataIndex: "verificationStatus",
      key: "verificationStatus",
      render: (value) => (
        <Tag color={getVerificationColor(value)}>
          {value || "Pending"}
        </Tag>
      ),
    },
    {
      title: "EXPIRY",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (value) => {
        const status = getExpiryStatus(value);

        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: "UPLOADED",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) =>
        value ? moment(value).format("DD MMM YYYY") : "—",
    },
    {
      title: "ACTIONS",
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              disabled={!record.image}
              onClick={() => openViewDocument(record)}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditDocument(record)}
            />
          </Tooltip>

          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              disabled={!record.image}
              onClick={() =>
                saveAs(
                  getFileUrl(record.image),
                  record.image?.split("/").pop() || "document"
                )
              }
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteDocument(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ----------------------------------------------------
  // COPY INFORMATION
  // ----------------------------------------------------

  const copyText = async (value, label) => {
    if (!value) {
      message.info(`${label} is not available.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      message.success(`${label} copied.`);
    } catch (error) {
      message.error("Unable to copy.");
    }
  };

  // ----------------------------------------------------
  // PROFILE INFORMATION HELPERS
  // ----------------------------------------------------

  const displayValue = (value) => {
    return value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
      ? value
      : "Not provided";
  };

  const profileTabs = [
    {
      key: "overview",
      label: (
        <span>
          <HomeOutlined /> Overview
        </span>
      ),
      children: (
        <div className="profile-tab-content">
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={16}>
              <Card
                className="profile-section-card"
                title="Personal overview"
                extra={
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={openPersonalModal}
                  >
                    Edit details
                  </Button>
                }
              >
                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  size="middle"
                  colon={false}
                >
                  <Descriptions.Item label="Full name">
                    {displayValue(profile?.name)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email address">
                    {displayValue(profile?.email)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Contact number">
                    {displayValue(profile?.contact)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Gender">
                    {displayValue(profile?.gender)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Department">
                    {displayValue(profile?.department)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Designation">
                    {displayValue(profile?.role)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Joining date">
                    {formatDate(profile?.joiningDate)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Blood group">
                    {displayValue(profile?.bloodGroup)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                className="profile-section-card"
                title="Professional skills"
                extra={
                  <Button
                    type="link"
                    onClick={() => setActiveTab("skills")}
                  >
                    View all
                  </Button>
                }
              >
                {skills.length > 0 ? (
                  <Row gutter={[12, 12]}>
                    {skills.slice(0, 4).map((skill, index) => (
                      <Col xs={24} sm={12} key={skill._id || index}>
                        <div className="profile-skill-mini">
                          <div className="profile-skill-mini-header">
                            <Text strong>
                              {skill.skillname}
                            </Text>
                            <Text type="secondary">
                              {skill.skillrating || 0}/5
                            </Text>
                          </div>

                          <Rate
                            disabled
                            value={Number(skill.skillrating) || 0}
                          />

                          {skill.skilldescription && (
                            <Paragraph
                              type="secondary"
                              ellipsis={{ rows: 2 }}
                            >
                              {skill.skilldescription}
                            </Paragraph>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No skills added yet"
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                className="profile-section-card profile-completion-card"
                title="Profile completion"
              >
                <Progress
                  type="circle"
                  percent={completionPercentage}
                  strokeWidth={9}
                  size={130}
                />

                <Title level={5}>
                  {completionPercentage === 100
                    ? "Profile completed"
                    : "Complete your profile"}
                </Title>

                <Text type="secondary">
                  Keep your personal and account information up to date.
                </Text>

                <Divider />

                <Button
                  type="primary"
                  block
                  icon={<EditOutlined />}
                  onClick={openPersonalModal}
                >
                  Update profile
                </Button>
              </Card>

              <Card
                className="profile-section-card"
                title="Quick information"
              >
                <div className="profile-quick-item">
                  <MailOutlined />
                  <div>
                    <Text type="secondary">Email</Text>
                    <Text strong>{displayValue(profile?.email)}</Text>
                  </div>
                </div>

                <div className="profile-quick-item">
                  <PhoneOutlined />
                  <div>
                    <Text type="secondary">Emergency contact</Text>
                    <Text strong>
                      {displayValue(profile?.contactNumber)}
                    </Text>
                  </div>
                </div>

                <div className="profile-quick-item">
                  <CalendarOutlined />
                  <div>
                    <Text type="secondary">Date of joining</Text>
                    <Text strong>
                      {formatDate(profile?.joiningDate)}
                    </Text>
                  </div>
                </div>

                <div className="profile-quick-item">
                  <FileTextOutlined />
                  <div>
                    <Text type="secondary">My documents</Text>
                    <Text strong>{documents.length} uploaded</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },

    {
      key: "personal",
      label: (
        <span>
          <UserOutlined /> Personal information
        </span>
      ),
      children: (
        <div className="profile-tab-content">
          <Card
            className="profile-section-card"
            title="Personal information"
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openPersonalModal}
              >
                Edit information
              </Button>
            }
          >
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, lg: 2 }}
              size="middle"
            >
              <Descriptions.Item label="Full name">
                {displayValue(profile?.name)}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {displayValue(profile?.email)}
              </Descriptions.Item>

              <Descriptions.Item label="Contact">
                {displayValue(profile?.contact)}
              </Descriptions.Item>

              <Descriptions.Item label="Gender">
                {displayValue(profile?.gender)}
              </Descriptions.Item>

              <Descriptions.Item label="Father's name">
                {displayValue(profile?.fatherName)}
              </Descriptions.Item>

              <Descriptions.Item label="Mother's name">
                {displayValue(profile?.motherName)}
              </Descriptions.Item>

              <Descriptions.Item label="Blood group">
                {displayValue(profile?.bloodGroup)}
              </Descriptions.Item>

              <Descriptions.Item label="Emergency contact">
                {displayValue(profile?.contactNumber)}
              </Descriptions.Item>
              <Descriptions.Item label="Aadhaar number">
                <Space>
                  <Text>
                    {showSensitive
                      ? formatAadhaar(profile?.adharNumber)
                      : maskAadhaar(profile?.adharNumber)}
                  </Text>
                  {profile?.adharNumber && (
                    <Tooltip title="Copy">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyText(profile.adharNumber, "Aadhaar number")}
                      />
                    </Tooltip>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="PAN number">
                <Space>
                  <Text>
                    {showSensitive ? displayValue(profile?.panNumber) : maskPAN(profile?.panNumber)}
                  </Text>
                  {profile?.panNumber && (
                    <Tooltip title="Copy">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyText(profile.panNumber, "PAN number")}
                      />
                    </Tooltip>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Permanent address" span={2}>
                {displayValue(profile?.permanentAddress)}
              </Descriptions.Item>

              <Descriptions.Item label="LinkedIn profile" span={2}>
                {profile?.linkedinprofilelink ? (
                  <a
                    href={profile.linkedinprofilelink}
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
        </div>
      ),
    },

    {
      key: "employment",
      label: (
        <span>
          <BankOutlined /> Employment
        </span>
      ),
      children: (
        <div className="profile-tab-content">
          <Card
            className="profile-section-card"
            title="Employment information"
          >
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              size="middle"
            >
              <Descriptions.Item label="Employee name">
                {displayValue(profile?.name)}
              </Descriptions.Item>

              <Descriptions.Item label="Employee ID">
                {displayValue(profile?._id)}
              </Descriptions.Item>

              <Descriptions.Item label="Department">
                {displayValue(profile?.department)}
              </Descriptions.Item>

              <Descriptions.Item label="Designation / Role">
                {displayValue(profile?.role)}
              </Descriptions.Item>

              <Descriptions.Item label="Joining date">
                {formatDate(profile?.joiningDate)}
              </Descriptions.Item>

              <Descriptions.Item label="Last appraisal">
                {formatDate(profile?.appraisal)}
              </Descriptions.Item>

              <Descriptions.Item label="Salary">
                {formatSalary(profile?.salary)}
              </Descriptions.Item>
            </Descriptions>

            <div className="profile-employment-note">
              <SafetyCertificateOutlined />
              <Text type="secondary">
                Employment and compensation details are displayed
                according to the information available in your
                employee record. Contact HR if any information needs
                correction.
              </Text>
            </div>
          </Card>
        </div>
      ),
    },

    // {
    //   key: "skills",
    //   label: (
    //     <span>
    //       <BookOutlined /> Skills
    //     </span>
    //   ),
    //   children: (
    //     <div className="profile-tab-content">
    //       <div className="profile-section-heading">
    //         <div>
    //           <Title level={4}>My professional skills</Title>
    //           <Text type="secondary">
    //             Skills and ratings associated with your employee
    //             profile.
    //           </Text>
    //         </div>

    //         <Tag color="blue">{skills.length} Skills</Tag>
    //       </div>

    //       {skills.length > 0 ? (
    //         <Row gutter={[16, 16]}>
    //           {skills.map((skill, index) => (
    //             <Col xs={24} sm={12} lg={8} key={skill._id || index}>
    //               <Card className="profile-skill-card" hoverable>
    //                 <div className="profile-skill-card-icon">
    //                   <BookOutlined />
    //                 </div>

    //                 <Title level={5}>
    //                   {skill.skillname || "Unnamed skill"}
    //                 </Title>

    //                 <Paragraph type="secondary">
    //                   {skill.skilldescription ||
    //                     "No description available."}
    //                 </Paragraph>

    //                 <Divider />

    //                 <div className="profile-skill-rating">
    //                   <Rate
    //                     disabled
    //                     value={Number(skill.skillrating) || 0}
    //                   />

    //                   <Text type="secondary">
    //                     {Number(skill.skillrating) || 0}/5
    //                   </Text>
    //                 </div>
    //               </Card>
    //             </Col>
    //           ))}
    //         </Row>
    //       ) : (
    //         <Card className="profile-section-card">
    //           <Empty description="No professional skills found." />
    //         </Card>
    //       )}
    //     </div>
    //   ),
    // },

    {
      key: "documents",
      label: (
        <span>
          <FileTextOutlined /> Documents
        </span>
      ),
      children: (
        <div className="profile-tab-content">
          <Card
            className="profile-section-card"
            title="My documents"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  addDocumentForm.resetFields();
                  setSelectedDocumentFile(null);
                  setAddDocumentModalOpen(true);
                }}
              >
                Add document
              </Button>
            }
          >
            <div className="profile-document-summary">
              <div>
                <Title level={3}>{documents.length}</Title>
                <Text type="secondary">Total documents</Text>
              </div>

              <div>
                <Title level={3}>
                  {documents.filter((doc) => doc.image).length}
                </Title>
                <Text type="secondary">Files available</Text>
              </div>
            </div>

            <Table
              rowKey="_id"
              columns={documentColumns}
              dataSource={documents}
              pagination={{
                pageSize: 6,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} documents`,
              }}
              scroll={{ x: 650 }}
              locale={{
                emptyText: (
                  <Empty description="No documents uploaded yet." />
                ),
              }}
            />
          </Card>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------

  if (loading) {
    return (
      <div className="my-profile-page">
        <Card className="profile-loading-card">
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="my-profile-page">
        <Card>
          <Empty description="Your profile could not be loaded">
            <Button type="primary" onClick={loadProfileData}>
              <ReloadOutlined /> Try again
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN UI
  // ----------------------------------------------------

  return (
    <div className="my-profile-page">
      <div className="profile-page-heading">
        <div>
          <Title level={3}>My Profile</Title>
          <Text type="secondary">
            Manage your personal information, employment details,
            skills and documents.
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={loadProfileData}
        >
          Refresh
        </Button>
      </div>

      {/* PROFILE HEADER */}

      <Card className="profile-hero-card">
        <Row gutter={[24, 20]} align="middle">
          <Col>
            <div className="profile-picture-wrapper">
              <Avatar
                size={112}
                src={profileImage || undefined}
                icon={<UserOutlined />}
                className="profile-main-avatar"
              >
                {!profileImage && getInitials(profile.name)}
              </Avatar>

              <Upload
                accept="image/png,image/jpeg,image/webp"
                showUploadList={false}
                beforeUpload={handleProfilePictureUpload}
              >
                <Tooltip title="Change profile picture">
                  <Button
                    shape="circle"
                    type="primary"
                    icon={
                      uploadingPicture ? (
                        <Spin size="small" />
                      ) : (
                        <CameraOutlined />
                      )
                    }
                    className="profile-picture-edit"
                    disabled={uploadingPicture}
                  />
                </Tooltip>
              </Upload>
            </div>
          </Col>

          <Col flex="1">
            <div className="profile-hero-details">
              <div className="profile-name-line">
                <Title level={3}>{profile.name || "User"}</Title>

                <Badge
                  status="success"
                  text=""
                />
              </div>

              <Text className="profile-designation">
                {profile.department || "Department not assigned"}
                {profile.role ? ` · ${profile.role}` : ""}
              </Text>

              <div className="profile-contact-line">
                <span>
                  <MailOutlined />
                  {profile.email || "Email not provided"}
                </span>

                <span>
                  <PhoneOutlined />
                  {profile.contact || "Contact not provided"}
                </span>

                <span>
                  <IdcardOutlined />
                  ID: {profile._id}
                </span>
              </div>

              <Space wrap>
                {profile.joiningDate && (
                  <Tag icon={<CalendarOutlined />} color="blue">
                    Joined {formatDate(profile.joiningDate)}
                  </Tag>
                )}

                {profile.gender && (
                  <Tag>{profile.gender}</Tag>
                )}
              </Space>
            </div>
          </Col>

          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={openPersonalModal}
              size="large"
            >
              Edit profile
            </Button>
          </Col>
        </Row>
      </Card>

      {/* STATISTICS */}

      <Row gutter={[16, 16]} className="profile-stat-row">
        <Col xs={12} md={6}>
          <Card className="profile-stat-card">
            <Statistic
              title="Profile completion"
              value={completionPercentage}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="profile-stat-card">
            <Statistic
              title="Professional skills"
              value={skills.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="profile-stat-card">
            <Statistic
              title="My documents"
              value={documents.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="profile-stat-card">
            <Statistic
              title="Years since joining"
              value={
                profile.joiningDate &&
                  moment(
                    profile.joiningDate,
                    ["DD/MM/YYYY", "YYYY-MM-DD"],
                    true
                  ).isValid()
                  ? moment().diff(
                    moment(
                      profile.joiningDate,
                      ["DD/MM/YYYY", "YYYY-MM-DD"],
                      true
                    ),
                    "years",
                    true
                  ).toFixed(1)
                  : "—"
              }
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* PROFILE TABS */}

      <Card className="profile-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={profileTabs}
          tabBarGutter={24}
        />
      </Card>

      {/* EDIT PERSONAL INFORMATION */}

      <Modal
        title={
          <span>
            <EditOutlined /> Edit personal information
          </span>
        }
        open={personalModalOpen}
        onOk={savePersonalInformation}
        onCancel={() => setPersonalModalOpen(false)}
        okText="Save changes"
        confirmLoading={savingProfile}
        width={850}
        destroyOnClose={false}
        className="profile-edit-modal"
      >
        <Form
          form={personalForm}
          layout="vertical"
          requiredMark="optional"
        >
          <div className="profile-form-section-title">
            Basic information
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Full name"
                name="name"
                rules={[
                  { required: true, message: "Please enter your name." },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Full name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Email address"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email." },
                  { type: "email", message: "Enter a valid email." },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email address"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Contact number"
                name="contact"
                rules={[
                  { required: true, message: "Enter your contact number." },
                  {
                    pattern: /^\d{10}$/,
                    message: "Enter a valid 10-digit number.",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Gender" name="gender">
                <Select placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="profile-form-section-title">
            Family and emergency information
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Father's name" name="fatherName">
                <Input placeholder="Father's name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Mother's name" name="motherName">
                <Input placeholder="Mother's name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Blood group" name="bloodGroup">
                <Select placeholder="Select blood group">
                  {[
                    "A+",
                    "A-",
                    "B+",
                    "B-",
                    "AB+",
                    "AB-",
                    "O+",
                    "O-",
                  ].map((group) => (
                    <Option key={group} value={group}>
                      {group}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Emergency contact"
                name="contactNumber"
                rules={[
                  {
                    pattern: /^\d{10}$/,
                    message: "Enter a valid 10-digit number.",
                  },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="Emergency mobile number"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="profile-form-section-title">
            Address and professional information
          </div>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="Permanent address"
                name="permanentAddress"
              >
                <TextArea
                  rows={3}
                  placeholder="Enter your permanent address"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Joining date" name="joiningDate">
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  placeholder="Select joining date"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="LinkedIn profile"
                name="linkedinprofilelink"
                rules={[
                  {
                    type: "url",
                    warningOnly: true,
                    message: "Please enter a valid URL.",
                  },
                ]}
              >
                <Input
                  prefix={<LinkedinOutlined />}
                  placeholder="https://linkedin.com/in/..."
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider />

          <div className="profile-form-section-title">
            Additional information
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Aadhaar number"
                name="adharNumber"
                rules={[
                  {
                    pattern: /^\d{12}$/,
                    message: "Enter a valid 12-digit Aadhaar number.",
                  },
                ]}
              >
                <Input
                  maxLength={12}
                  placeholder="12-digit Aadhaar number"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="PAN number"
                name="panNumber"
                rules={[
                  {
                    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
                    message: "Enter a valid PAN number.",
                  },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Current salary"
                name="salary"
                rules={[
                  {
                    pattern: /^\d+(\.\d{1,2})?$/,
                    message: "Enter a valid salary amount.",
                  },
                ]}
              >
                <Input placeholder="Monthly salary" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Last appraisal date"
                name="appraisal"
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  placeholder="Select appraisal date"
                />
              </Form.Item>
            </Col>
          </Row>
          <div className="profile-form-note">
            <SafetyCertificateOutlined />
            Salary, PAN, Aadhaar and appraisal information are not
            editable from this personal-information form. Please
            contact HR for changes to official employment records.
          </div>
        </Form>
      </Modal>

      {/* ADD DOCUMENT */}

      <Modal
        title="Upload new document"
        open={addDocumentModalOpen}
        onOk={handleAddDocument}
        onCancel={() => setAddDocumentModalOpen(false)}
        okText="Upload document"
        confirmLoading={savingDocument}
        destroyOnClose
      >
        <Form form={addDocumentForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Document name"
                name="documentname"
                rules={[
                  { required: true, message: "Enter a document name." },
                  { max: 150, message: "Maximum 150 characters allowed." },
                ]}
              >
                <Input placeholder="e.g. Graduation Certificate" maxLength={150} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Document category"
                name="documenttype"
                rules={[
                  { required: true, message: "Select a document category." },
                ]}
              >
                <Select placeholder="Select category">
                  {[
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
                  ].map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Description"
                name="description"
                rules={[
                  { max: 1000, message: "Maximum 1000 characters allowed." },
                ]}
              >
                <TextArea
                  rows={3}
                  maxLength={1000}
                  showCount
                  placeholder="Add details about this document..."
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Expiry date (optional)"
                name="expiryDate"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD MMM YYYY"
                  placeholder="Select expiry date"
                  disabledDate={(current) =>
                    current && current.startOf("day").isBefore(moment().startOf("day"))
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Select document file" required>
                <Upload
                  beforeUpload={(file) => {
                    if (validateDocumentFile(file)) {
                      setSelectedDocumentFile(file);
                    }
                    return false;
                  }}
                  onRemove={() => setSelectedDocumentFile(null)}
                  maxCount={1}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                >
                  <Button icon={<UploadOutlined />}>
                    Choose document
                  </Button>
                </Upload>

                <Text type="secondary">
                  JPG, PNG, PDF or Word. Maximum size: 10 MB.
                </Text>

                {selectedDocumentFile && (
                  <div className="profile-selected-file">
                    <FileTextOutlined /> {selectedDocumentFile.name}
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* EDIT DOCUMENT */}

      <Modal
        title="Edit document"
        open={editDocumentModalOpen}
        onOk={handleEditDocument}
        onCancel={() => setEditDocumentModalOpen(false)}
        okText="Save changes"
        confirmLoading={savingDocument}
        destroyOnClose
      >
        <Form form={editDocumentForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Document name"
                name="documentname"
                rules={[
                  { required: true, message: "Enter document name." },
                  { max: 150, message: "Maximum 150 characters allowed." },
                ]}
              >
                <Input maxLength={150} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Document category"
                name="documenttype"
                rules={[
                  { required: true, message: "Select document category." },
                ]}
              >
                <Select>
                  {[
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
                  ].map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Description"
                name="description"
                rules={[
                  { max: 1000, message: "Maximum 1000 characters allowed." },
                ]}
              >
                <TextArea rows={3} maxLength={1000} showCount />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="Expiry date (optional)" name="expiryDate">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD MMM YYYY"
                  placeholder="Select expiry date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Text strong>Replace document file (optional)</Text>

          <div style={{ marginTop: 12 }}>
            <Upload
              beforeUpload={(file) => {
                if (validateDocumentFile(file)) {
                  setEditDocumentFile(file);
                }
                return false;
              }}
              onRemove={() => setEditDocumentFile(null)}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            >
              <Button icon={<UploadOutlined />}>
                Choose replacement file
              </Button>
            </Upload>
          </div>
        </Form>
      </Modal>

      {/* VIEW DOCUMENT */}

      <Modal
        title={selectedDocument?.documentname || "Document preview"}
        open={viewDocumentModalOpen}
        onCancel={() => setViewDocumentModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setViewDocumentModalOpen(false)}
          >
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadDocument}
          >
            Download
          </Button>,
        ]}
        width={750}
        destroyOnClose
      >
        {selectedDocument && (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            style={{ marginTop: 20 }}
          >
            <Descriptions.Item label="Document category">
              {selectedDocument.documenttype || "Other"}
            </Descriptions.Item>

            <Descriptions.Item label="Verification">
              <Tag color={getVerificationColor(selectedDocument.verificationStatus)}>
                {selectedDocument.verificationStatus || "Pending"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Expiry date">
              {selectedDocument.expiryDate
                ? formatDate(selectedDocument.expiryDate)
                : "No expiry date"}
            </Descriptions.Item>

            <Descriptions.Item label="Uploaded on">
              {formatDate(selectedDocument.createdAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Description" span={2}>
              {selectedDocument.description || "No description provided."}
            </Descriptions.Item>
          </Descriptions>
        )}
        <div className="profile-document-preview">
          {selectedDocument?.image &&
            /\.(jpg|jpeg|png|webp|gif)$/i.test(
              selectedDocument.image
            ) ? (
            <Image
              src={documentPreview}
              alt={selectedDocument?.documentname}
              styl
              e={{ maxWidth: "100%", maxHeight: 500 }}
            />
          ) : (
            <Empty
              image={<FileTextOutlined style={{ fontSize: 48 }} />}
              description={
                <div>
                  <Text strong>
                    {selectedDocument?.image || "Document file"}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Preview is not available for this file type.
                    Use Download to open the document.
                  </Text>
                </div>
              }
            />
          )}

        </div>

      </Modal>
    </div>
  );
};

export default MyProfile;
