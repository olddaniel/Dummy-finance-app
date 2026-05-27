import { useState, useRef, useEffect } from "react";
import CheckboxItem from "./CheckboxItem";
import { formatBRL } from "../utils";

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function ResetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1.85 7.5A5.65 5.65 0 1 0 7.5 1.85M1.85 7.5V4M1.85 7.5H5.5"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ collapsed }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
      aria-hidden="true" className={`chevron${collapsed ? " collapsed" : ""}`}>
      <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PaymentGroup({
  group, checked, onToggle, onReset, values, onValueChange,
  lastReset, onAddItem, onRemoveItem,
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const [adding, setAdding]             = useState(false);
  const [newLabel, setNewLabel]         = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const total   = group.items.length;
  const done    = group.items.filter((item) => checked[item.id]).length;
  const allDone = done === total && total > 0;
  const pct     = total === 0 ? 0 : (done / total) * 100;

  const totalSum = group.items.reduce((s, i) => s + (values[i.id] || 0), 0);
  const paidSum  = group.items.reduce((s, i) => s + (checked[i.id] ? values[i.id] || 0 : 0), 0);

  const resetDate = formatDate(lastReset);
  const hasMeta   = totalSum > 0 || resetDate;

  function handleAdd() {
    if (!newLabel.trim()) return;
    onAddItem(newLabel);
    setNewLabel("");
    setAdding(false);
  }

  function cancelAdd() {
    setNewLabel("");
    setAdding(false);
  }

  return (
    <section className={`payment-group${allDone ? " all-done" : ""}`}>
      {/* Header */}
      <div className="group-header">
        <div className="group-title-block">
          <h2 className="group-title">{group.title}</h2>
          {hasMeta && (
            <div className="group-meta">
              {totalSum > 0 && (
                <span className="group-sum">
                  {paidSum > 0 && (
                    <><span className="sum-paid">{formatBRL(paidSum)}</span><span className="sum-sep"> / </span></>
                  )}
                  <span>{formatBRL(totalSum)}</span>
                </span>
              )}
              {resetDate && (
                <span className="group-last-reset">
                  {totalSum > 0 && <span className="meta-dot"> · </span>}
                  reset {resetDate}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="group-header-right">
          <button
            className={`reset-btn${confirmReset ? " confirm" : ""}`}
            onClick={() => { if (confirmReset) { onReset(); setConfirmReset(false); } else setConfirmReset(true); }}
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

      {/* Per-group progress bar */}
      <div className="group-progress-bar">
        <div className="group-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Collapsible items + add row */}
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
              onRemove={() => onRemoveItem(item.id)}
            />
          ))}

          {/* Add bill row */}
          {adding ? (
            <li className="item-add-form">
              <input
                ref={inputRef}
                className="item-add-input"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") cancelAdd();
                }}
                placeholder="Nome da conta..."
                maxLength={60}
              />
              <button
                className="item-add-confirm"
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                aria-label="Confirmar"
              >✓</button>
              <button
                className="item-add-cancel"
                onClick={cancelAdd}
                aria-label="Cancelar"
              >✕</button>
            </li>
          ) : (
            <li className="item-add-btn-row">
              <button className="item-add-btn" onClick={() => setAdding(true)}>
                + Adicionar conta
              </button>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
