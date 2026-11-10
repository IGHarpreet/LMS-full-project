import React from "react";

/**
 * Small KPI card used on every dashboard.
 * tone: brand | green | amber | blue | violet
 */
const StatCard = ({ label, value, hint, icon, tone = "brand", lines, loading }) => (
  <div className={`ebs-stat tone-${tone}`}>
    {icon && <div className="ebs-stat-icon">{icon}</div>}
    <div className="ebs-stat-body">
      <div className="ebs-stat-label">{label}</div>
      {value !== undefined && (
        <div
          className={`ebs-stat-value${typeof value === "string" && value.length > 6 ? " is-text" : ""}`}
        >
          {loading ? "…" : value === "" || value === null ? "—" : value}
        </div>
      )}
      {lines && (
        <div className="ebs-stat-lines">
          {lines.map(([k, v]) => (
            <span key={k}>
              {k}: <b>{loading ? "…" : v}</b>
            </span>
          ))}
        </div>
      )}
      {hint && <div className="ebs-stat-hint">{hint}</div>}
    </div>
  </div>
);

export default StatCard;
