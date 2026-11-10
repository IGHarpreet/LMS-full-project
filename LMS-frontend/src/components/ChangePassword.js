import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  LockOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SettingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import jwt_decode from "../utils/jwtSafe";
import "./ChangePassword.css";

const { Title, Text, Paragraph } = Typography;

const ChangePassword = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(moment());
  const [form] = Form.useForm();

  // --------------------------------------------------
  // LIVE DATE AND TIME
  // --------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --------------------------------------------------
  // PASSWORD REQUIREMENTS
  // --------------------------------------------------

  const passwordRequirements = useMemo(() => {
    return [
      {
        label: "At least 8 characters",
        valid: newPassword.length >= 8,
      },
      {
        label: "One uppercase letter",
        valid: /[A-Z]/.test(newPassword),
      },
      {
        label: "One lowercase letter",
        valid: /[a-z]/.test(newPassword),
      },
      {
        label: "One number",
        valid: /\d/.test(newPassword),
      },
      {
        label: "One special character",
        valid: /[^A-Za-z0-9]/.test(newPassword),
      },
    ];
  }, [newPassword]);

  const passwordStrength = useMemo(() => {
    const score = passwordRequirements.filter(
      (item) => item.valid
    ).length;

    if (!newPassword) {
      return {
        score: 0,
        percent: 0,
        label: "Not entered",
        status: "normal",
      };
    }

    if (score <= 2) {
      return {
        score,
        percent: 30,
        label: "Weak",
        status: "exception",
      };
    }

    if (score <= 4) {
      return {
        score,
        percent: 70,
        label: "Moderate",
        status: "normal",
      };
    }

    return {
      score,
      percent: 100,
      label: "Strong",
      status: "success",
    };
  }, [newPassword, passwordRequirements]);

  // --------------------------------------------------
  // OPEN / CLOSE PASSWORD MODAL
  // --------------------------------------------------

  const showModal = () => {
    form.resetFields();
    setNewPassword("");
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    if (changingPassword) return;

    form.resetFields();
    setNewPassword("");
    setIsModalOpen(false);
  };

  // --------------------------------------------------
  // CHANGE PASSWORD
  // --------------------------------------------------

  const onFinish = async (values) => {
    try {
      if (values.newPassword !== values.confirmPassword) {
        message.error("New password and confirm password do not match.");
        return;
      }

      const token = localStorage.getItem("access_token1");

      if (!token) {
        message.error("Your session has expired. Please log in again.");
        return;
      }

      const decoded = jwt_decode(token);
      const userId = decoded?._id;

      if (!userId) {
        message.error("Unable to identify your account. Please log in again.");
        return;
      }

      setChangingPassword(true);

      await axios.put(
        `${process.env.REACT_APP_BASE_URL}/user/forchangepassword/${userId}`,
        {
          password: values.newPassword,
        }
      );

      message.success("Your password has been changed successfully.");

      form.resetFields();
      setNewPassword("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Change password error:", error);

      message.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to change your password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // --------------------------------------------------
  // RETRY / RESET
  // --------------------------------------------------

  const resetPasswordForm = () => {
    form.resetFields();
    setNewPassword("");
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="settings-page">
      {/* PAGE HEADER */}

      <div className="settings-page-header">
        <div className="settings-heading-content">
          <div className="settings-heading-icon">
            <SettingOutlined />
          </div>

          <div>
            <Title level={3}>My Settings</Title>
            <Text type="secondary">
              Manage your account preferences and security.
            </Text>
          </div>
        </div>

        <Tag color="success" icon={<SafetyCertificateOutlined />}>
          Account settings
        </Tag>
      </div>

      {/* DATE AND TIME */}

      <Card className="settings-time-card">
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} sm={12}>
            <div className="settings-time-item">
              <div className="settings-time-icon">
                <CalendarOutlined />
              </div>

              <div>
                <Text type="secondary">Today's date</Text>
                <Title level={5}>
                  {currentDateTime.format("dddd, DD MMMM YYYY")}
                </Title>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div className="settings-time-item">
              <div className="settings-time-icon">
                <ClockCircleOutlined />
              </div>

              <div>
                <Text type="secondary">Current local time</Text>
                <Title level={5} className="settings-live-time">
                  {currentDateTime.format("hh:mm:ss A")}
                </Title>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* SETTINGS CONTENT */}

      <Row gutter={[20, 20]} className="settings-content-row">
        {/* LEFT COLUMN */}

        <Col xs={24} lg={15}>
          <Card className="settings-main-card">
            <div className="settings-section-heading">
              <div className="settings-section-icon">
                <SafetyCertificateOutlined  />
              </div>

              <div>
                <Title level={4}>Account security</Title>
                <Text type="secondary">
                  Keep your account secure by maintaining a strong password.
                </Text>
              </div>
            </div>

            <Divider />

            <div className="settings-option">
              <div className="settings-option-left">
                <Avatar
                  size={48}
                  icon={<LockOutlined />}
                  className="settings-option-avatar"
                />

                <div className="settings-option-details">
                  <Text strong>Password</Text>
                  <Text type="secondary">
                    Update your password to protect your account.
                  </Text>
                  <Badge
                    status="processing"
                    text="Password management"
                  />
                </div>
              </div>

              <Button
                type="primary"
                icon={<KeyOutlined />}
                onClick={showModal}
              >
                Change password
              </Button>
            </div>

            <Divider />

            <div className="settings-security-note">
              <SafetyCertificateOutlined />

              <div>
                <Text strong>Security recommendation</Text>
                <Paragraph type="secondary">
                  Use a unique password that you do not use on other
                  websites. Avoid sharing your password with anyone.
                </Paragraph>
              </div>
            </div>
          </Card>

          {/* ACCOUNT INFORMATION */}

          {/* <Card className="settings-main-card settings-account-card">
            <div className="settings-section-heading">
              <div className="settings-section-icon">
                <UserOutlined />
              </div>

              <div>
                <Title level={4}>Account information</Title>
                <Text type="secondary">
                  Your account settings are linked to your logged-in account.
                </Text>
              </div>
            </div>

            <Divider />

            <div className="settings-account-info">
              <div className="settings-info-row">
                <Text type="secondary">Account status</Text>
                <Tag color="success">
                  <CheckCircleOutlined /> Active session
                </Tag>
              </div>

              <div className="settings-info-row">
                <Text type="secondary">Date</Text>
                <Text strong>
                  {currentDateTime.format("DD MMM YYYY")}
                </Text>
              </div>

              <div className="settings-info-row">
                <Text type="secondary">Local time</Text>
                <Text strong>
                  {currentDateTime.format("hh:mm:ss A")}
                </Text>
              </div>
            </div>
          </Card> */}
        </Col>

        {/* RIGHT COLUMN */}

        <Col xs={24} lg={9}>
          <Card className="settings-security-card">
            <div className="settings-security-card-icon">
              <SafetyCertificateOutlined />
            </div>

            <Title level={4}>Protect your account</Title>

            <Paragraph type="secondary">
              A strong password helps prevent unauthorized access to your
              personal and account information.
            </Paragraph>

            <Divider />

            <div className="settings-security-tip">
              <CheckCircleOutlined />
              <Text>Use at least 8 characters.</Text>
            </div>

            <div className="settings-security-tip">
              <CheckCircleOutlined />
              <Text>Combine uppercase and lowercase letters.</Text>
            </div>

            <div className="settings-security-tip">
              <CheckCircleOutlined />
              <Text>Include numbers and special characters.</Text>
            </div>

            <div className="settings-security-tip">
              <CheckCircleOutlined />
              <Text>Avoid common or easily guessed passwords.</Text>
            </div>

            <Button
              block
              type="primary"
              icon={<LockOutlined />}
              onClick={showModal}
              className="settings-security-button"
            >
              Update my password
            </Button>
          </Card>
        </Col>
      </Row>

      {/* CHANGE PASSWORD MODAL */}

      <Modal
        title={
          <div className="settings-modal-title">
            <div className="settings-modal-title-icon">
              <LockOutlined />
            </div>

            <div>
              <Title level={4}>Change password</Title>
              <Text type="secondary">
                Choose a new password for your account.
              </Text>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={540}
        centered
        destroyOnClose={false}
        maskClosable={!changingPassword}
        closable={!changingPassword}
        className="settings-password-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
          autoComplete="off"
        >
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              {
                required: true,
                message: "Please enter your new password.",
              },
              {
                min: 8,
                message: "Password must contain at least 8 characters.",
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  if (/\s/.test(value)) {
                    return Promise.reject(
                      new Error("Password cannot contain spaces.")
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
              autoComplete="new-password"
              onChange={(event) => {
                const value = event.target.value;
                setNewPassword(value);

                const confirmPassword = form.getFieldValue(
                  "confirmPassword"
                );

                if (confirmPassword) {
                  form.validateFields(["confirmPassword"]).catch(() => {});
                }
              }}
            />
          </Form.Item>

          {/* PASSWORD STRENGTH */}

          <div className="settings-password-strength">
            <div className="settings-strength-header">
              <Text type="secondary">Password strength</Text>

              <Text
                strong
                type={
                  passwordStrength.label === "Weak"
                    ? "danger"
                    : passwordStrength.label === "Strong"
                    ? "success"
                    : "secondary"
                }
              >
                {passwordStrength.label}
              </Text>
            </div>

            <Progress
              percent={passwordStrength.percent}
              showInfo={false}
              status={passwordStrength.status}
              size="small"
            />
          </div>

          {/* PASSWORD REQUIREMENTS */}

          <div className="settings-password-requirements">
            <Text strong>Make sure your password contains:</Text>

            <Row gutter={[8, 8]}>
              {passwordRequirements.map((requirement) => (
                <Col xs={24} sm={12} key={requirement.label}>
                  <div className="settings-requirement-item">
                    {requirement.valid ? (
                      <CheckCircleOutlined className="requirement-valid" />
                    ) : (
                      <CloseCircleOutlined className="requirement-invalid" />
                    )}

                    <Text
                      type={requirement.valid ? "success" : "secondary"}
                    >
                      {requirement.label}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <Divider />

          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              {
                required: true,
                message: "Please confirm your new password.",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("The passwords do not match.")
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Re-enter your new password"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <div className="settings-modal-security-note">
            <SafetyCertificateOutlined />
            <Text type="secondary">
              Your new password will be saved to your account after
              successful verification by the server.
            </Text>
          </div>

          <div className="settings-modal-actions">
            <Button
              onClick={resetPasswordForm}
              icon={<ReloadOutlined />}
              disabled={changingPassword}
            >
              Reset
            </Button>

            <Space>
              <Button
                onClick={handleCancel}
                disabled={changingPassword}
              >
                Cancel
              </Button>

              <Button
                type="primary"
                htmlType="submit"
                loading={changingPassword}
                icon={<CheckCircleOutlined />}
              >
                Change password
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ChangePassword;