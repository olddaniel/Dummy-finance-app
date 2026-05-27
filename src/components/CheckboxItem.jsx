import { useState, useRef } from "react";

const DELETE_WIDTH = 72;

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CheckboxItem({ label, checked, onChange, value, onValueChange, onRemove }) {
  const [offset, setOffset]   = useState(0);
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

    // Decide direction once movement is unambiguous
    if (touch.current.dir === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      touch.current.dir = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    }
    if (touch.current.dir !== "h") return;

    // Allow left swipe only (right swipe closes if already revealed)
    const base = revealed ? -DELETE_WIDTH : 0;
    setOffset(Math.max(-DELETE_WIDTH, Math.min(0, base + dx)));
  }

  function handleTouchEnd() {
    if (touch.current.dir !== "h") return;
    snap(offset <= -(DELETE_WIDTH / 2) ? -DELETE_WIDTH : 0);
  }

  return (
    <li className={`item-outer${checked ? " item-checked" : ""}`}>
      {/* Delete zone — sits behind the sliding row */}
      <button
        className="item-delete-zone"
        onClick={onRemove}
        tabIndex={revealed ? 0 : -1}
        aria-label={`Remover ${label}`}
      >
        <TrashIcon />
        <span>Remover</span>
      </button>

      {/* Sliding content */}
      <div
        className="item"
        style={{
          transform: `translateX(${offset}px)`,
          transition: animate ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // capture phase: any tap while revealed just closes instead of acting
        onClickCapture={revealed ? (e) => { e.stopPropagation(); snap(0); } : undefined}
      >
        <button
          className={`item-checkbox${checked ? " checked" : ""}`}
          onClick={onChange}
          role="checkbox"
          aria-checked={checked}
          aria-label={label}
        >
          {checked && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 5.5l3 3 5-5" stroke="#fff" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <span className="item-label" onClick={onChange}>{label}</span>

        <span className="item-value-wrapper" onClick={(e) => e.stopPropagation()}>
          <span className="item-value-prefix">R$</span>
          <input
            type="number"
            className="item-value-input"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="—"
            aria-label={`Valor estimado: ${label}`}
          />
        </span>
      </div>
    </li>
  );
}
