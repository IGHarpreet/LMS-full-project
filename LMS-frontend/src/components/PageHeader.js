import React, { useEffect, useState } from "react";

/** Page title + live date/time chip. `extra` renders on the right. */
const PageHeader = ({ title, subtitle, extra, showClock = true }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (!showClock) return undefined;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [showClock]);

  return (
    <div className="ebs-page-head">
      <div>
        <h1 className="ebs-page-title">{title}</h1>
        {subtitle && <p className="ebs-page-sub">{subtitle}</p>}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {showClock && (
          <div className="ebs-datetime">
            <span>
              <strong>Date</strong> {now.toLocaleDateString()}
            </span>
            <span>
              <strong>Time</strong> {now.toLocaleTimeString()}
            </span>
          </div>
        )}
        {extra}
      </div>
    </div>
  );
};

export default PageHeader;
