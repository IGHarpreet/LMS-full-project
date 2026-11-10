import React from "react";
import { LockOutlined } from "@ant-design/icons";

function ErrorPage() {
  return (
    <div className="ebs-state">
      <LockOutlined className="icon" />
      <h2>Access restricted</h2>
      <span>You don’t have permission to view this page. Please contact an administrator.</span>
    </div>
  );
}

export default ErrorPage;
