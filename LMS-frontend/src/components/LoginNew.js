
import React, { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import {
  LockOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  LoginOutlined,
  BankOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { getErrorMessage } from "../shared/api";
import "./LoginNew.css";

const friendly = (err) => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.msg;

  if (status === 401 && /not exist/i.test(msg || "")) {
    return "Invalid username or password. Please check your credentials and try again.";
  }

  if (status === 401) {
    return "Incorrect username or password. Please try again.";
  }

  return getErrorMessage(err, "Unable to sign in right now.");
};

const LoginNew = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async ({ name, password }) => {
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/user/login`,
        {
          name: (name || "").trim(),
          password,
        }
      );

      if (!data?.token) {
        throw new Error("The server did not return a session token.");
      }

      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      localStorage.setItem(
        "access_token1",
        JSON.stringify(data.token)
      );

      if (typeof onLogin === "function") onLogin();

      window.history.replaceState({}, "", "/dashboard");
    } catch (err) {
      setError(friendly(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hrms-login-page">

      <div className="hrms-login-background-shape shape-one" />
      <div className="hrms-login-background-shape shape-two" />

      <div className="hrms-login-wrapper">

        {/* BRAND */}


        {/* LOGIN CARD */}
        <div className="hrms-login-card">

          {/* <div className="hrms-login-card-icon">
            <SafetyCertificateOutlined />
          </div> */}
          <div className="hrms-login-brand">
            <div className="hrms-brand-logo">
              <BankOutlined />
            </div>

            {/* <div className="hrms-brand-text">
              <strong>SBS Bela</strong>
            </div> */}
          </div>
          <div className="hrms-login-heading">
            <h1>SBS Bela</h1>
            {/* <p>Sign in to continue to your workspace</p> */}
          </div>

          <div className="hrms-login-role-label">
            <span className="hrms-role-indicator" />
            Sign in to continue to your workspace
          </div>

          {error && (
            <Alert
              className="hrms-login-error"
              type="error"
              showIcon
              message={error}
              closable
              onClose={() => setError("")}
            />
          )}

          <Form
            layout="vertical"
            onFinish={onFinish}
            autoComplete="on"
            requiredMark={false}
            className="hrms-login-form"
          >

            <Form.Item
              label="Username"
              name="name"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Please enter your username",
                },
              ]}
            >
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: "Please enter your password",
                },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={!loading && <LoginOutlined />}
              className="hrms-login-submit"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

          </Form>

          <div className="hrms-login-security">
            <SafetyCertificateOutlined />
            Secure access for authorised personnel
          </div>

        </div>

        <div className="hrms-login-footer">
          © {new Date().getFullYear()} SBS Bela. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default LoginNew;
