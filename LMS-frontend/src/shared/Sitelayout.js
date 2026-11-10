import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import LoginNew from "../components/LoginNew";
import Middle from "../components/Middle";
import Routing from "../components/Routing";
import Sidebar from "../components/Sidebar";
import Top from "../components/Top";
import ErrorBoundary from "../components/ErrorBoundary";
import { applyTheme } from "../components/Drop";
import { isLoggedIn } from "../utils/auth";

const { Content } = Layout;

const Shell = () => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
useEffect(() => {
  const handleResize = () => {
    setCollapsed(window.innerWidth < 992);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
  return (
    <Layout className="ebs-app">
      <Top collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Layout>
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout className="ebs-main">
          <Content className="ebs-content">
            <Middle />
            {/* resetKey: navigating to another page clears a previous crash */}
            <ErrorBoundary resetKey={pathname}>
              <Routing />
            </ErrorBoundary>
          </Content>
          <div className="ebs-footer">© {new Date().getFullYear()} SBS Bela · Employee Management System</div>
        </Layout>
      </Layout>
    </Layout>
  );
};

const SiteLayout = () => {
  // bump to re-evaluate auth after the login form stores a token
  const [, setTick] = useState(0);

  useEffect(() => {
    applyTheme(localStorage.getItem("DARK_MODE") ? "dark" : "light");
  }, []);

  return (
    <Router>
      {isLoggedIn() ? <Shell /> : <LoginNew onLogin={() => setTick((t) => t + 1)} />}
    </Router>
  );
};

export default SiteLayout;
