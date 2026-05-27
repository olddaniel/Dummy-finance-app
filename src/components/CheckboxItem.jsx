export default function CheckboxItem({ label, checked, onChange, value, onValueChange }) {
  return (
    <li className={`item${checked ? " item-checked" : ""}`}>
      <button
        className={`item-checkbox${checked ? " checked" : ""}`}
        onClick={onChange}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M1.5 5.5l3 3 5-5"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <span className="item-label" onClick={onChange}>{label}</span>

      {/* Value input — click is isolated so it doesn't toggle the checkbox */}
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
    </li>
  );
}
