import { useState } from "react";
import CheckboxItem from "./CheckboxItem";
import { formatBRL } from "../utils";

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
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

function ChevronIcon({ collapsed }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`chevron${collapsed ? " collapsed" : ""}`}
    >
      <path
        d="M2 4.5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PaymentGroup({ group, checked, onToggle, onReset, values, onValueChange }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const total = group.items.length;
  const done = group.items.filter((item) => checked[item.id]).length;
  const allDone = done === total;

  // Money sums
  const totalSum = group.items.reduce((sum, item) => sum + (values[item.id] || 0), 0);
  const paidSum = group.items.reduce(
    (sum, item) => sum + (checked[item.id] ? values[item.id] || 0 : 0),
    0
  );

  function handleResetClick() {
    if (confirmReset) {
      onReset();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  }

  return (
    <section className={`payment-group${allDone ? " all-done" : ""}`}>
      {/* Header */}
      <div className="group-header">
        <div className="group-header-left">
          <div className={`group-checkbox${allDone ? " checked" : ""}`} aria-hidden="true">
            {allDone && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="group-title-block">
            <h2 className="group-title">{group.title}</h2>
            {totalSum > 0 && (
              <span className="group-sum">
                {paidSum > 0 && (
                  <><span className="sum-paid">{formatBRL(paidSum)}</span><span className="sum-sep"> / </span></>
                )}
                <span className="sum-total">{formatBRL(totalSum)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="group-header-right">
          <button
            className={`reset-btn${confirmReset ? " confirm" : ""}`}
            onClick={handleResetClick}
            onBlur={() => setConfirmReset(false)}
            title={confirmReset ? "Clique novamente para confirmar" : "Resetar ciclo"}
          >
            <ResetIcon />
            {confirmReset ? "Confirmar?" : "Reset"}
          </button>

          <button
            className={`progress-badge${collapsed ? " collapsed" : ""}`}
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir grupo" : "Recolher grupo"}
          >
            <span className="progress-done">{done}</span>
            <span className="progress-sep">/</span>
            <span className="progress-total">{total}</span>
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>
      </div>

      {/* Collapsible item list */}
      <div className={`item-list-wrapper${collapsed ? " collapsed" : ""}`}>
        <ul className="item-list">
          {group.items.map((item) => (
            <CheckboxItem
              key={item.id}
              label={item.label}
              checked={!!checked[item.id]}
              onChange={() => onToggle(item.id)}
              value={values[item.id] || ""}
              onValueChange={(val) => onValueChange(item.id, val)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
