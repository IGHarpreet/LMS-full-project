import React from "react";
import { Button } from "antd";
import { WarningOutlined } from "@ant-design/icons";

/** Catches render errors so one broken page never white-screens the whole app. */
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  componentDidUpdate(prev) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="ebs-state">
        <WarningOutlined className="icon" />
        <h2>This page couldn’t be displayed</h2>
        <span>Something went wrong while loading it. Your data is safe.</span>
        <Button type="primary" onClick={() => window.location.reload()} style={{ marginTop: 12 }}>
          Reload page
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
