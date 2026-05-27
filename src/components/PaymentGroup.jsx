import { useState } from "react";
import CheckboxItem from "./CheckboxItem";

function ResetIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.85 7.5A5.65 5.65 0 1 0 7.5 1.85M1.85 7.5V4M1.85 7.5H5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PaymentGroup({ group, checked, onToggle, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const total = group.items.length;
  const done = group.items.filter((item) => checked[item.id]).length;
  const allDone = done === total;

  function handleResetClick() {
    if (confirmReset) {
      onReset();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  }

  function handleBlur() {
    setConfirmReset(false);
  }

  return (
    <section className={`payment-group${allDone ? " all-done" : ""}`}>
      {/* Group header */}
      <div className="group-header">
        <div className="group-header-left">
          <div
            className={`group-checkbox${allDone ? " checked" : ""}`}
            aria-label={allDone ? "All paid" : "Not all paid"}
          >
            {allDone && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <h2 className="group-title">{group.title}</h2>
        </div>

        <div className="group-header-right">
          <button
            className={`reset-btn${confirmReset ? " confirm" : ""}`}
            onClick={handleResetClick}
            onBlur={handleBlur}
            title={confirmReset ? "Click again to confirm reset" : `Reset ${group.cycle === "monthly" ? "monthly" : "yearly"} cycle`}
          >
            <ResetIcon />
            {confirmReset ? "Confirm?" : "Reset cycle"}
          </button>

          <span className="progress-badge">
            <span className="progress-done">{done}</span>
            <span className="progress-sep">/</span>
            <span className="progress-total">{total}</span>
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="item-list">
        {group.items.map((item) => (
          <CheckboxItem
            key={item.id}
            label={item.label}
            checked={!!checked[item.id]}
            onChange={() => onToggle(item.id)}
          />
        ))}
      </ul>
    </section>
  );
}
