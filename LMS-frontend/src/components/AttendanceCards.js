import React, { useEffect, useState } from "react";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CoffeeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import StatCard from "./StatCard";

const BASE = process.env.REACT_APP_BASE_URL;
const arr = (v) => (Array.isArray(v) ? v : null);

/** Admin attendance summary (previously four placeholder "Content" cards). */
const AttendanceCards = () => {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // "TodayData" also returns future leaves, so count today's full-day leaves per type instead
      const [users, today, sick, priv, casual] = await Promise.allSettled([
        axios.get(`${BASE}/user`),
        axios.get(`${BASE}/attendance/todayattendance`),
        axios.get(`${BASE}/leave/alltodaysick`),
        axios.get(`${BASE}/leave/alltodaypriviliege`),
        axios.get(`${BASE}/leave/alltodayCasual`),
      ]);
      if (cancelled) return;
      const ok = (r, key) => (r.status === "fulfilled" ? arr(r.value?.data?.[key]) : null);
      setState({
        loading: false,
        employees: ok(users, "userData"),
        present: ok(today, "todayAttendance"),
        leave: [
          ok(sick, "alltodaySick"),
          ok(priv, "alltodayPriviliege"),
          ok(casual, "alltodayCasual"),
        ].every((x) => x !== null)
          ? [
              ...ok(sick, "alltodaySick"),
              ...ok(priv, "alltodayPriviliege"),
              ...ok(casual, "alltodayCasual"),
            ]
          : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, employees, present, leave } = state;
  const n = (a) => (a === null || a === undefined ? "—" : a.length);
  const presentCount = present ? present.filter((p) => p?.CheckIn).length : null;
  const absent =
    employees && presentCount !== null && leave
      ? Math.max(employees.length - presentCount - leave.length, 0)
      : null;

  return (
    <div className="ebs-stats">
      <StatCard label="Total employees" value={n(employees)} icon={<TeamOutlined />} tone="blue" loading={loading} />
      <StatCard
        label="Present today"
        value={presentCount === null || presentCount === undefined ? "—" : presentCount}
        icon={<CheckCircleOutlined />}
        tone="green"
        loading={loading}
      />
      <StatCard label="On leave today" value={n(leave)} icon={<CoffeeOutlined />} tone="amber" loading={loading} />
      <StatCard
        label="Not checked in"
        value={absent === null || absent === undefined ? "—" : absent}
        icon={<CloseCircleOutlined />}
        tone="brand"
        loading={loading}
      />
    </div>
  );
};

export default AttendanceCards;
