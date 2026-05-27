import { useState, useEffect, useRef } from "react";

const DELETE_WIDTH = 72;

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckboxItem({
  label, checked, onChange,
  value, onValueChange,
  dueDate, onDateChange, groupCycle,
  onRemove, onRename,
}) {
  // ── Swipe ──
  const [offset,  setOffset]  = useState(0);
  const [animate, setAnimate] = useState(false);
  const touch = useRef({ x: 0, y: 0, dir: null });
  const revealed = offset <= -(DELETE_WIDTH - 1);

  function snap(x) { setAnimate(true); setOffset(x); }

  function handleTouchStart(e) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dir: null };
    setAnimate(false);
  }
  function handleTouchMove(e) {
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (touch.current.dir === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      touch.current.dir = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (touch.current.dir !== "h") return;
    const base = revealed ? -DELETE_WIDTH : 0;
    setOffset(Math.max(-DELETE_WIDTH, Math.min(0, base + dx)));
  }
  function handleTouchEnd() {
    if (touch.current.dir !== "h") return;
    snap(offset <= -(DELETE_WIDTH / 2) ? -DELETE_WIDTH : 0);
  }

  // ── Edit ──
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(label);
  const labelInputRef = useRef(null);

  useEffect(() => { if (!editing) setDraft(label); }, [label, editing]);
  useEffect(() => { if (editing) labelInputRef.current?.focus(); }, [editing]);

  function save() {
    const t = draft.trim();
    if (t && t !== label) onRename(t);
    setEditing(false);
  }
  function cancel() { setDraft(label); setEditing(false); }

  return (
    <li className={`item-outer${checked ? " item-checked" : ""}`}>
      <button className="item-delete-zone" onClick={onRemove}
        tabIndex={revealed ? 0 : -1} aria-label={`Remover ${label}`}>
        <TrashIcon />
        <span>Remover</span>
      </button>

      <div
        className="item"
        style={{ transform: `translateX(${offset}px)`, transition: animate ? "transform 0.2s ease" : "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={revealed ? (e) => { e.stopPropagation(); snap(0); } : undefined}
        onClick={onChange}
      >
        <button
          className={`item-checkbox${checked ? " checked" : ""}`}
          onClick={(e) => { e.stopPropagation(); onChange(); }}
          role="checkbox" aria-checked={checked} aria-label={label}
        >
          {checked && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 5.5l3 3 5-5" stroke="#fff" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {editing ? (
          <input
            ref={labelInputRef}
            className="item-label-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } if (e.key === "Escape") { e.preventDefault(); cancel(); } }}
            onBlur={save}
            onClick={(e) => e.stopPropagation()}
            maxLength={60}
            aria-label="Editar nome da conta"
          />
        ) : (
          <span className="item-label" onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(label); }}>
            {label}
          </span>
        )}

        {/* Due date picker */}
        <span className="item-date-wrapper" onClick={(e) => e.stopPropagation()}>
          <select
            className={`item-date-select${dueDate ? " has-value" : ""}`}
            value={dueDate ?? ""}
            onChange={(e) => onDateChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
            aria-label={groupCycle === "monthly" ? "Dia do vencimento" : "Mês do vencimento"}
          >
            <option value="">—</option>
            {groupCycle === "monthly"
              ? Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))
              : MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))
            }
          </select>
        </span>

        {/* Value */}
        <span className="item-value-wrapper" onClick={(e) => e.stopPropagation()}>
          <span className="item-value-prefix">R$</span>
          <input
            type="number"
            className="item-value-input"
            min="0" step="0.01"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            placeholder="—"
            aria-label={`Valor estimado: ${label}`}
          />
        </span>
      </div>
    </li>
  );
}
