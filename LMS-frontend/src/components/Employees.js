
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Table,
  message,
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  Typography,
  Card,
  Tag,
  Space,
  Avatar,
  Statistic,
  Tooltip,
  Empty,
  Spin,
  Popconfirm,
  Descriptions,
  DatePicker,
} from "antd";
import {
  FileAddOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  SearchOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  LinkedinOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import jwt_decode from "../utils/jwtSafe";
import "../../src/Employees.css";
import moment from "moment";
const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = process.env.REACT_APP_BASE_URL;

const Employees = ({ dataSource }) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const navigate = useNavigate();

  const [employeeData, setEmployeeData] = useState([]);
  const [employeename, setEmployeeName] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [departmentOptions, setDepartmentOptions] = useState([]);
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/announcements/meta/audience`
        );

        const departments = response.data?.departments || [];

        setDepartmentOptions(
          departments.map((department) => {
            if (typeof department === "string") {
              return {
                label: department,
                value: department,
              };
            }

            return {
              label: department.name || department.department,
              value: department.name || department.department,
            };
          }).filter((department) => department.label && department.value)
        );
      } catch (error) {
        console.error("Unable to fetch departments:", error);
        message.error("Unable to load department options.");
      }
    };

    fetchDepartments();
  }, []);
  // Get logged-in user's role
  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token1");

      if (!token) {
        message.error("Please log in to continue.");
        return;
      }

      const decoded = jwt_decode(token);
      setEmployeeName(decoded || {});
    } catch (error) {
      console.error("Unable to decode login token:", error);
      message.error("Unable to verify your login session.");
    }
  }, []);

  // Fetch employees
  const employeelist = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${BASE_URL}/user`);
      const employees = response.data?.userData;

      if (Array.isArray(employees)) {
        setEmployeeData(employees);
      } else {
        setEmployeeData([]);
        message.warning("No employee records were returned.");
      }
    } catch (error) {
      console.error("Employee list error:", error);
      message.error(
        error.response?.data?.message || "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeename.role === "admin") {
      employeelist();
    }
  }, [employeename.role]);

  // Add employee modal
  const showModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    if (!saving) {
      setIsModalOpen(false);
      form.resetFields();
    }
  };

  // Add employee
  const handleAddEmployee = async (values) => {
    try {
      setSaving(true);

      const payload = {
        name: values.name.trim(),
        password: values.password,
        email: values.email.trim(),
        contact: String(values.contact ?? "").trim(),
        gender: values.gender,
        role: values.role,
        linkedinprofilelink: values.linkedinprofilelink?.trim() || "Null",
        profilepicture: "",
      };

      const response = await axios.post(
        `${BASE_URL}/user/signup`,
        payload
      );

      if (response.status >= 200 && response.status < 300) {
        message.success("Employee added successfully.");
        setIsModalOpen(false);
        form.resetFields();
        await employeelist();
      }
    } catch (error) {
      console.error("Add employee error:", error);
      message.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to add employee. Please check the details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal
  const onEditEmployee = (record) => {
    setEditingEmployee(record);

    editForm.setFieldsValue({
      name: record.name || "",
      email: record.email || "",
      contact: record.contact != null ? String(record.contact) : "",
      gender: record.gender || undefined,
      role: record.role || undefined,
      department: record.department || undefined,

      // Keep joiningDate as a string because it still uses Input type="date"
      joiningDate: record.joiningDate || "",

      // Convert appraisal string into a Moment object
      appraisal:
        record.appraisal && moment(record.appraisal).isValid()
          ? moment(record.appraisal)
          : null,
      fatherName: record.fatherName || "",
      motherName: record.motherName || "",
      bloodGroup: record.bloodGroup || "",
      contactNumber: record.contactNumber || "",
      permanentAddress: record.permanentAddress || "",
      adharNumber: record.adharNumber || "",
      panNumber: record.panNumber || "",
      salary: record.salary || "",
      linkedinprofilelink: record.linkedinprofilelink || "",
      profilepicture: record.profilepicture || "",
      employeeskills: Array.isArray(record.employeeskills)
        ? record.employeeskills.join(", ")
        : "",
    });

    setIsEditing(true);
  };

  const resetEditing = () => {
    if (!saving) {
      setIsEditing(false);
      setEditingEmployee(null);
      editForm.resetFields();
    }
  };

  // Update employee
  const editEmployee = async (values) => {
    if (!editingEmployee?._id) {
      message.error("Employee record not found.");
      return;
    }

    try {
      setSaving(true);

      console.log("Edit form values:", values);

      const payload = {
        name: String(values.name ?? "").trim(),
        email: String(values.email ?? "").trim().toLowerCase(),
        contact: String(values.contact ?? "").trim(),
        gender: values.gender,
        role: values.role,
        department: values.department || "",
        joiningDate: values.joiningDate || "",
        appraisal: values.appraisal
          ? values.appraisal.format("YYYY-MM-DD")
          : "",
        fatherName: String(values.fatherName ?? "").trim(),
        motherName: String(values.motherName ?? "").trim(),
        bloodGroup: values.bloodGroup || "",
        contactNumber: String(values.contactNumber ?? "").trim(),
        permanentAddress: String(values.permanentAddress ?? "").trim(),
        adharNumber: String(values.adharNumber ?? "").trim(),
        panNumber: String(values.panNumber ?? "").trim(),
        salary: String(values.salary ?? "").trim(),
        linkedinprofilelink: String(values.linkedinprofilelink ?? "").trim(),
        profilepicture: String(values.profilepicture ?? "").trim(),
        employeeskills: String(values.employeeskills ?? "")
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      };

      console.log("Update payload:", payload);

      const response = await axios.put(
        `${BASE_URL}/user/${editingEmployee._id}`,
        payload
      );

      const updatedEmployee = response.data?.updated_employee;

      if (!updatedEmployee) {
        console.error("Unexpected API response:", response.data);
        message.error("Employee update response is invalid.");
        return;
      }

      setEmployeeData((previous) =>
        previous.map((employee) =>
          employee._id === editingEmployee._id
            ? { ...employee, ...updatedEmployee }
            : employee
        )
      );

      message.success("Employee details updated successfully.");

      setIsEditing(false);
      setEditingEmployee(null);
      editForm.resetFields();

    } catch (error) {
      console.error("Employee update error:", error);
      console.error("Response:", error.response?.data);
      console.error("Status:", error.response?.status);

      message.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to update employee"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete employee
  const deleteEmployee = async (id) => {
    try {
      setDeletingId(id);

      await axios.delete(`${BASE_URL}/user/empdel/${id}`);

      setEmployeeData((previous) =>
        previous.filter((employee) => employee._id !== id)
      );

      message.success("Employee deleted successfully.");
    } catch (error) {
      console.error("Delete employee error:", error);
      message.error(
        error.response?.data?.message || "Unable to delete employee."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Existing navigation functionality
  const profile = (record) => {
    navigate("/profile/" + record._id);
  };

  const documentation = (userId) => {
    navigate("/documentation/" + userId);
  };

  // Search and filters
  const filteredEmployees = useMemo(() => {
    return employeeData.filter((employee) => {
      const search = searchText.toLowerCase().trim();

      const matchesSearch =
        !search ||
        employee.name?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.contact?.toString().toLowerCase().includes(search);

      const matchesRole =
        roleFilter === "all" || employee.role === roleFilter;

      const matchesGender =
        genderFilter === "all" ||
        employee.gender?.toLowerCase() === genderFilter;

      return matchesSearch && matchesRole && matchesGender;
    });
  }, [employeeData, searchText, roleFilter, genderFilter]);

  // Dashboard counts
  const totalEmployees = employeeData.length;
  const adminCount = employeeData.filter(
    (employee) => employee.role === "admin"
  ).length;
  const employeeCount = employeeData.filter(
    (employee) => employee.role === "employee"
  ).length;
  const maleCount = employeeData.filter(
    (employee) => employee.gender?.toLowerCase() === "male"
  ).length;
  const femaleCount = employeeData.filter(
    (employee) => employee.gender?.toLowerCase() === "female"
  ).length;

  const getInitials = (name = "") => {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };

  const columns = [
    {
      title: "EMPLOYEE",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (name, record) => (
        <div className="employee-name-cell">
          <Avatar
            className="employee-avatar"
            src={record.profilepicture || record.imageUrl || undefined}
            icon={<UserOutlined />}
          >
            {!record.profilepicture && !record.imageUrl
              ? getInitials(name)
              : null}
          </Avatar>
          <div className="employee-name-details">
            <Text strong className="employee-primary-name">
              {name || "Unnamed employee"}
            </Text>
            <Text type="secondary" className="employee-id">
              ID: {record._id || "—"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "EMAIL ADDRESS",
      dataIndex: "email",
      key: "email",
      render: (email) => (
        <div className="employee-contact-cell">
          <MailOutlined />
          <Text>{email || "Not provided"}</Text>
        </div>
      ),
    },
    {
      title: "CONTACT",
      dataIndex: "contact",
      key: "contact",
      render: (contact) => (
        <div className="employee-contact-cell">
          <PhoneOutlined />
          <Text>{contact || "Not provided"}</Text>
        </div>
      ),
    },
    {
      title: "GENDER",
      dataIndex: "gender",
      key: "gender",
      width: 110,
      render: (gender) => (
        <Text className="employee-gender">
          {gender
            ? gender.charAt(0).toUpperCase() + gender.slice(1)
            : "—"}
        </Text>
      ),
    },
    {
      title: "ROLE",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role) => (
        <Tag
          className={`employee-role-tag ${role === "admin" ? "admin-role" : "employee-role"
            }`}
        >
          {role || "Not assigned"}
        </Tag>
      ),
    },
    {
      title: "DEPARTMENT",
      dataIndex: "department",
      key: "department",
      render: (department) => (
        <Tag color="geekblue">{department || "Not assigned"}</Tag>
      ),
    },
    {
      title: "JOINING DATE",
      dataIndex: "joiningDate",
      key: "joiningDate",
      render: (date) => date || "—",
    },
    {
      title: "BLOOD GROUP",
      dataIndex: "bloodGroup",
      key: "bloodGroup",
      render: (group) => group || "—",
    },
    {
      title: "SALARY",
      dataIndex: "salary",
      key: "salary",
      render: (salary) => salary ? `₹${salary}` : "—",
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 170,
      fixed: "right",
      render: (_, record) => (
        <Space size={4} className="employee-actions">
          <Tooltip title="View profile">
            <Button
              className="employee-action-btn"
              icon={<EyeOutlined />}
              onClick={() => profile(record)}
            />
          </Tooltip>

          <Tooltip title="Employee documents">
            <Button
              className="employee-action-btn"
              icon={<FileAddOutlined />}
              onClick={() => documentation(record._id)}
            />
          </Tooltip>

          <Tooltip title="Edit employee">
            <Button
              className="employee-action-btn"
              icon={<EditOutlined />}
              onClick={() => onEditEmployee(record)}
            />
          </Tooltip>

          <Tooltip title="Delete employee">
            <Popconfirm
              title="Delete this employee?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteEmployee(record._id)}
            >
              <Button
                danger
                className="employee-action-btn delete-action"
                icon={<DeleteOutlined />}
                loading={deletingId === record._id}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Only admin can access this employee-management screen
  if (employeename.role !== "admin") {
    return (
      <div className="employee-access-denied">
        <SafetyCertificateOutlined />
        <Title level={4}>Access restricted</Title>
        <Text type="secondary">
          Only administrators can manage employee records.
        </Text>
      </div>
    );
  }

  return (
    <div className="employees-page">
      {/* Page heading */}
      <div className="employees-page-header">
        <div>
          <div className="employees-breadcrumb">
            Administration <span>/</span> Employees
          </div>
          <Title level={2} className="employees-page-title">
            Employee Management
          </Title>
          <Text className="employees-page-subtitle">
            Manage your workforce, employee details, roles and documents.
          </Text>
        </div>

        <Space className="employees-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={employeelist}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={showModal}
            className="add-employee-button"
          >
            Add employee
          </Button>
        </Space>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="employee-stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="employee-stat-card">
            <Statistic
              title="Total people"
              value={totalEmployees}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">All registered accounts</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="employee-stat-card">
            <Statistic
              title="Employees"
              value={employeeCount}
              prefix={<UserOutlined />}
            />
            <Text type="secondary">Employee accounts</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="employee-stat-card">
            <Statistic
              title="Administrators"
              value={adminCount}
              prefix={<SafetyCertificateOutlined />}
            />
            <Text type="secondary">Admin accounts</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="employee-stat-card">
            <Statistic
              title="Gender distribution"
              value={`${maleCount} / ${femaleCount}`}
              prefix={<UserSwitchOutlined />}
            />
            <Text type="secondary">Male / Female</Text>
          </Card>
        </Col>
      </Row>

      {/* Employee table */}
      <Card className="employee-directory-card">
        <div className="employee-directory-header">
          <div>
            <Title level={4}>Employee directory</Title>
            <Text type="secondary">
              {filteredEmployees.length} of {totalEmployees} records
            </Text>
          </div>
          <Tag color="blue">{totalEmployees} total</Tag>
        </div>

        <div className="employee-filters">
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder="Search by name, email or contact..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="employee-search-input"
          />

          <Select
            size="large"
            value={roleFilter}
            onChange={setRoleFilter}
            className="employee-filter-select"
            aria-label="Filter by role"
          >
            <Option value="all">All roles</Option>
            <Option value="employee">Employees</Option>
            <Option value="admin">Administrators</Option>
          </Select>

          <Select
            size="large"
            value={genderFilter}
            onChange={setGenderFilter}
            className="employee-filter-select"
            aria-label="Filter by gender"
          >
            <Option value="all">All genders</Option>
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
          </Select>

          <Button
            size="large"
            onClick={() => {
              setSearchText("");
              setRoleFilter("all");
              setGenderFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey="_id"
            className="employee-directory-table"
            scroll={{ x: 1500 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchText || roleFilter !== "all" || genderFilter !== "all"
                      ? "No employees match your filters"
                      : "No employees found"
                  }
                />
              ),
            }}
            pagination={{
              defaultPageSize: 10,
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} employees`,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
                  <Descriptions.Item label="Father's name">
                    {record.fatherName || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Mother's name">
                    {record.motherName || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Alternate contact">
                    {record.contactNumber || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Blood group">
                    {record.bloodGroup || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Joining date">
                    {record.joiningDate || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Salary">
                    {record.salary ? `₹${record.salary}` : "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Appraisal date">
                    {record.appraisal && moment(record.appraisal).isValid()
                      ? moment(record.appraisal).format("DD MMM YYYY")
                      : "—"}
                  </Descriptions.Item>

                  {/* <Descriptions.Item label="Skills">
                    {Array.isArray(record.employeeskills)
                      ? record.employeeskills.join(", ") || "—"
                      : record.employeeskills || "—"}
                  </Descriptions.Item> */}

                  <Descriptions.Item label="LinkedIn">
                    {record.linkedinprofilelink ? (
                      <a
                        href={record.linkedinprofilelink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View LinkedIn
                      </a>
                    ) : "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Permanent address" span={3}>
                    {record.permanentAddress || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Aadhaar">
                    {record.adharNumber
                      ? `XXXX-XXXX-${record.adharNumber.slice(-4)}`
                      : "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="PAN">
                    {record.panNumber
                      ? `${record.panNumber.slice(0, 2)}******${record.panNumber.slice(-2)}`
                      : "—"}
                  </Descriptions.Item>
                </Descriptions>
              ),
            }}
          />
        </Spin>
      </Card>

      {/* Add employee modal */}
      <Modal
        title={
          <div className="employee-modal-heading">
            <div className="employee-modal-icon">
              <UserAddOutlined />
            </div>
            <div>
              <Title level={4}>Add new employee</Title>
              <Text type="secondary">
                Enter the employee's account and contact details.
              </Text>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={650}
        destroyOnClose
        maskClosable={!saving}
        className="employee-form-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEmployee}
          autoComplete="off"
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Full name"
                name="name"
                rules={[
                  { required: true, message: "Please enter the full name." },
                  { min: 2, message: "Name must contain at least 2 characters." },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="Enter full name"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Email address"
                name="email"
                rules={[
                  { required: true, message: "Please enter an email address." },
                  { type: "email", message: "Enter a valid email address." },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="name@example.com"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter a password." },
                  { min: 6, message: "Password must be at least 6 characters." },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<SafetyCertificateOutlined />}
                  placeholder="Create login password"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Contact number"
                name="contact"
                rules={[
                  { required: true, message: "Please enter a contact number." },
                  {
                    pattern: /^\d{10}$/,
                    message: "Enter a valid 10-digit mobile number.",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<PhoneOutlined />}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Gender"
                name="gender"
                rules={[{ required: true, message: "Please select gender." }]}
              >
                <Select size="large" placeholder="Select gender">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="System role"
                name="role"
                rules={[{ required: true, message: "Please select a role." }]}
              >
                <Select size="large" placeholder="Select role">
                  <Option value="employee">Employee</Option>
                  <Option value="admin">Admin</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="LinkedIn profile link"
                name="linkedinprofilelink"
              >
                <Input
                  size="large"
                  prefix={<LinkedinOutlined />}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="employee-modal-footer">
            <Button onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              icon={<UserAddOutlined />}
            >
              Create employee
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit employee modal */}
      <Modal
        title={
          <div className="employee-modal-heading">
            <div className="employee-modal-icon edit-modal-icon">
              <EditOutlined />
            </div>
            <div>
              <Title level={4}>Edit employee details</Title>
              <Text type="secondary">
                Update this employee's information and system role.
              </Text>
            </div>
          </div>
        }
        open={isEditing}
        onCancel={resetEditing}
        footer={null}
        width={600}
        destroyOnClose
        maskClosable={!saving}
        className="employee-form-modal"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={editEmployee}
          autoComplete="off"
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Full name"
                name="name"
                rules={[{ required: true, message: "Please enter the name." }]}
              >
                <Input size="large" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Email address"
                name="email"
                rules={[
                  { required: true, message: "Please enter the email." },
                  { type: "email", message: "Enter a valid email." },
                ]}
              >
                <Input size="large" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Primary contact"
                name="contact"
                rules={[
                  { required: true, message: "Please enter the contact number." },
                  { pattern: /^\d{10}$/, message: "Enter a valid 10-digit number." },
                ]}
              >
                <Input size="large" maxLength={10} inputMode="numeric" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Alternate contact" name="contactNumber">
                <Input size="large" maxLength={15} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Gender" name="gender">
                <Select size="large">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="System role" name="role">
                <Select size="large">
                  <Option value="employee">Employee</Option>
                  <Option value="admin">Admin</Option>
                  <Option value="hr">HR</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Department" name="department">
                <Select
                  size="large"
                  placeholder="Select department"
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  options={departmentOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Joining date" name="joiningDate">
                <Input size="large" type="date" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Father's name" name="fatherName">
                <Input size="large" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Mother's name" name="motherName">
                <Input size="large" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Blood group" name="bloodGroup">
                <Select size="large" allowClear placeholder="Select blood group">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <Option key={group} value={group}>{group}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Salary" name="salary">
                <Input size="large" placeholder="Enter salary" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Appraisal date" name="appraisal">
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  format="DD MMM YYYY"
                  placeholder="Select appraisal date"
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Aadhaar number" name="adharNumber">
                <Input size="large" maxLength={12} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="PAN number" name="panNumber">
                <Input size="large" maxLength={10} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Permanent address" name="permanentAddress">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>

            {/* <Col span={24}>
              <Form.Item label="Employee skills (comma separated)" name="employeeskills">
                <Input.TextArea
                  rows={2}
                  placeholder="React, Node.js, JavaScript, MongoDB"
                />
              </Form.Item>
            </Col> */}

            <Col span={24}>
              <Form.Item label="LinkedIn profile" name="linkedinprofilelink">
                <Input
                  size="large"
                  prefix={<LinkedinOutlined />}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Profile picture URL" name="profilepicture">
                <Input size="large" placeholder="Enter an image URL" />
              </Form.Item>
            </Col>
          </Row>

          <div className="employee-modal-footer">
            <Button onClick={resetEditing} disabled={saving}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Employees;
