import React, { useEffect, useState } from "react";
import {
  TeamOutlined,
  CoffeeOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import StatCard from "./StatCard";

const BASE = process.env.REACT_APP_BASE_URL;

const asArray = (v) => (Array.isArray(v) ? v : []);

/**
 * Admin / HR overview cards.
 * Each endpoint is requested independently: if one fails the others still
 * render (that card just shows "—") instead of crashing the whole page.
 */
const DashboardCards = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    employees: [],
    sick: [],
    privilege: [],
    casual: [],
    short: [],
    week: [],
    month: [],
  });

  useEffect(() => {
    let cancelled = false;

    const endpoints = {
      employees: ["/user", "userData"],
      sick: ["/leave/alltodaysick", "alltodaySick"],
      privilege: ["/leave/alltodaypriviliege", "alltodayPriviliege"],
      casual: ["/leave/alltodayCasual", "alltodayCasual"],
      short: ["/leave/alltodayShortleave", "alltodayShortLeave"],
      week: ["/leave/WeekData", "data"],
      month: ["/leave/monthdata", "MonthLeaveData"],
    };

    const load = async () => {
      const keys = Object.keys(endpoints);
      const results = await Promise.allSettled(
        keys.map((k) => axios.get(`${BASE}${endpoints[k][0]}`))
      );
      if (cancelled) return;
      const next = {};
      keys.forEach((k, i) => {
        const r = results[i];
        next[k] = r.status === "fulfilled" ? asArray(r.value?.data?.[endpoints[k][1]]) : null;
      });
      setData(next);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = (k) => (data[k] === null ? "—" : data[k].length);

  return (
    <div className="ebs-stats">
      <StatCard
        label="Total employees"
        value={count("employees")}
        icon={<TeamOutlined />}
        tone="blue"
        loading={loading}
      />
      <StatCard
        label="On leave today"
        icon={<CoffeeOutlined />}
        tone="amber"
        loading={loading}
        lines={[
          ["Sick", count("sick")],
          ["Privilege", count("privilege")],
          ["Casual", count("casual")],
          ["Short", count("short")],
        ]}
      />
      <StatCard
        label="Leaves this week"
        value={count("week")}
        icon={<FieldTimeOutlined />}
        tone="violet"
        loading={loading}
      />
      <StatCard
        label="Leaves this month"
        value={count("month")}
        icon={<CalendarOutlined />}
        tone="green"
        loading={loading}
      />
    </div>
  );
};

export default DashboardCards;
