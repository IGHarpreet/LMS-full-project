import React, { useEffect, useState } from "react";
import {
  SafetyCertificateOutlined,
  MedicineBoxOutlined,
  CoffeeOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import axios from "axios";
import jwt_decode from "../utils/jwtSafe";
import { getToken } from "../utils/auth";
import StatCard from "./StatCard";

const BASE = process.env.REACT_APP_BASE_URL;

// yearly allowance per leave type
const LIMITS = { privilege: 11, sick: 7, casual: 7 };

const remaining = (taken, limit) => Math.max(limit - taken, 0);

const LeaveCards = () => {
  const [balance, setBalance] = useState({ privilege: null, sick: null, casual: null });
  const [holiday, setHoliday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const { _id } = jwt_decode(getToken());

    const load = async () => {
      const [priv, sick, casual, hol] = await Promise.allSettled([
        axios.get(`${BASE}/leave/priviliege/${_id}`),
        axios.get(`${BASE}/leave/sick/${_id}`),
        axios.get(`${BASE}/leave/casual/${_id}`),
        axios.get(`${BASE}/holiday`),
      ]);
      if (cancelled) return;

      const used = (r) => (r.status === "fulfilled" && Array.isArray(r.value?.data) ? r.value.data.length : null);
      const left = (r, limit) => (used(r) === null ? null : remaining(used(r), limit));

      setBalance({
        privilege: left(priv, LIMITS.privilege),
        sick: left(sick, LIMITS.sick),
        casual: left(casual, LIMITS.casual),
      });
      setHoliday(
        hol.status === "fulfilled" && Array.isArray(hol.value?.data?.HolidaysPending)
          ? hol.value.data.HolidaysPending.length
          : null
      );
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const show = (v) => (v === null ? "—" : v);

  return (
    <div className="ebs-stats">
      <StatCard
        label="Privilege leaves pending"
        value={show(balance.privilege)}
        hint={`of ${LIMITS.privilege} days`}
        icon={<SafetyCertificateOutlined />}
        tone="blue"
        loading={loading}
      />
      <StatCard
        label="Sick leaves pending"
        value={show(balance.sick)}
        hint={`of ${LIMITS.sick} days`}
        icon={<MedicineBoxOutlined />}
        tone="brand"
        loading={loading}
      />
      <StatCard
        label="Casual leaves pending"
        value={show(balance.casual)}
        hint={`of ${LIMITS.casual} days`}
        icon={<CoffeeOutlined />}
        tone="amber"
        loading={loading}
      />
      <StatCard
        label={`Holidays pending ${new Date().getFullYear()}`}
        value={show(holiday)}
        icon={<GiftOutlined />}
        tone="green"
        loading={loading}
      />
    </div>
  );
};

export default LeaveCards;
