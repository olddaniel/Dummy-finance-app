import { useState, useRef, useEffect, useMemo } from "react";
import CheckboxItem from "./CheckboxItem";
import { formatBRL } from "../utils";

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}


// Three-state chevron: open=down, semi=diagonal, closed=right
function ChevronIcon({ viewState }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
      aria-hidden="true" className={`chevron chevron-${viewState}`}>
      <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PaymentGroup({
  group, checked, onToggle, onReset,
  snoozed, onToggleSnooze,
  values, onValueChange,
  dates, onDateChange,
  lastReset,
  onAddItem, onRemoveItem, onRenameItem,
  sortMode,
  viewState = "open",
  onToggleCollapsed,
  onRemoveGroup,
  onRenameGroup,
  onChangeDateMode,
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [adding, setAdding]             = useState(false);
  const [newLabel, setNewLabel]         = useState("");
  const inputRef = useRef(null);

  // ── Edit panel state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName]   = useState(group.title);
  const [editMode, setEditMode]   = useState(group.dateMode);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditName(group.title);
      setEditMode(group.dateMode);
      setConfirmDelete(false);
    }
  }, [isEditing, group.title, group.dateMode]);

  function saveGroupEdit() {
    if (editName.trim() && editName.trim() !== group.title) onRenameGroup(editName.trim());
    if (editMode !== group.dateMode) onChangeDateMode(editMode);
    setIsEditing(false);
  }

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const isClosed = viewState === "closed";
  const isSemi   = viewState === "semi";

  // Sorted items
  const sortedItems = useMemo(() => {
    if (sortMode === "value") {
      return [...group.items].sort((a, b) => (values[b.id] || 0) - (values[a.id] || 0));
    }
    if (sortMode === "date") {
      return [...group.items].sort((a, b) => (dates[a.id] ?? 999) - (dates[b.id] ?? 999));
    }
    return group.items;
  }, [group.items, sortMode, values, dates]);

  // In semi mode only show unchecked + un-snoozed items
  const displayItems = isSemi
    ? sortedItems.filter((item) => !checked[item.id] && !snoozed[item.id])
    : sortedItems;

  const total   = group.items.length;
  // snoozed counts as "handled" for the progress badge
  const done    = group.items.filter((item) => checked[item.id] || snoozed[item.id]).length;
  const allDone = done === total && total > 0;
  const pct     = total === 0 ? 0 : (done / total) * 100;

  // snoozed items are excluded from the sum (they reduce the group total)
  const activeItems = group.items.filter((i) => !snoozed[i.id]);
  const totalSum = activeItems.reduce((s, i) => s + (values[i.id] || 0), 0);
  const paidSum  = activeItems.reduce((s, i) => s + (checked[i.id] ? values[i.id] || 0 : 0), 0);

  const resetDate = formatDate(lastReset);

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
    <section className={`payment-group${allDone ? " all-done" : ""}${isEditing ? " editing" : ""}`}>
      {/* Header */}
      <div
        className={`group-header${isClosed ? " group-header-collapsed" : ""}`}
        onClick={isClosed ? () => onToggleCollapsed(total === 0) : undefined}
      >
        <div className="group-title-block">
          <div className="group-title-row">
            <h2 className="group-title">{group.title}</h2>
            {!isClosed && !isSemi && (
              <button
                className={`group-edit-btn${isEditing ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setIsEditing((v) => !v); }}
                aria-label="Editar grupo"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          {totalSum > 0 && (
            <div className="group-meta">
              <span className="group-sum">
                {paidSum > 0 && (
                  <><span className="sum-paid">{formatBRL(paidSum)}</span><span className="sum-sep"> / </span></>
                )}
                <span>{formatBRL(totalSum)}</span>
              </span>
            </div>
          )}
        </div>

        <div className="group-header-right">
          <button
            className={`progress-badge${isSemi ? " semi" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleCollapsed(total === 0); }}
            aria-label={
              isClosed ? "Mostrar pendentes" :
              isSemi   ? "Expandir tudo" :
                         "Recolher grupo"
            }
          >
            <span className="progress-done">{done}</span>
            <span className="progress-sep">/</span>
            <span className="progress-total">{total}</span>
            <ChevronIcon viewState={viewState} />
          </button>
        </div>
      </div>

      {/* Per-group progress bar */}
      <div className="group-progress-bar">
        <div className="group-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Edit panel — slides open below header when isEditing */}
      <div className={`group-edit-panel${isEditing ? " open" : ""}`}>
        <div className="group-edit-inner">

          {/* Rename */}
          <input
            className="group-edit-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveGroupEdit(); if (e.key === "Escape") setIsEditing(false); }}
            placeholder="Nome do grupo"
            maxLength={40}
          />

          {/* Date mode */}
          <div className="group-edit-modes">
            {[
              { value: "none",   label: "Sem data" },
              { value: "days",   label: "Dias" },
              { value: "months", label: "Meses" },
            ].map(({ value, label }) => (
              <button
                key={value}
                className={`group-add-mode-btn${editMode === value ? " active" : ""}`}
                onClick={() => setEditMode(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Actions row */}
          <div className="group-edit-actions">
            {(done > 0 || resetDate) && (
              <button className="group-edit-action-btn reset" onClick={() => { onReset(); setIsEditing(false); }}>
                Resetar
              </button>
            )}
            <button
              className={`group-edit-action-btn delete${confirmDelete ? " confirm" : ""}`}
              onClick={() => { if (confirmDelete) onRemoveGroup(); else setConfirmDelete(true); }}
              onBlur={() => setConfirmDelete(false)}
            >
              {confirmDelete ? "Confirmar?" : "Excluir grupo"}
            </button>
            <button className="group-edit-action-btn save" onClick={saveGroupEdit}>
              Salvar
            </button>
          </div>

        </div>
      </div>

      {/* Collapsible items + add row */}
      <div className={`item-list-wrapper${isClosed ? " collapsed" : ""}`}>
        <ul className="item-list">
          {displayItems.map((item) => (
            <CheckboxItem
              key={item.id}
              label={item.label}
              checked={!!checked[item.id]}
              onChange={() => onToggle(item.id)}
              snoozed={!!snoozed[item.id]}
              onToggleSnooze={() => onToggleSnooze(item.id)}
              value={values[item.id] || ""}
              onValueChange={(val) => onValueChange(item.id, val)}
              dueDate={dates[item.id] ?? null}
              onDateChange={(val) => onDateChange(item.id, val)}
              dateMode={group.dateMode}
              onRemove={() => onRemoveItem(item.id)}
              onRename={(newLabel) => onRenameItem(item.id, newLabel)}
            />
          ))}

          {!isSemi && (adding ? (
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
              <button className="item-add-confirm" onClick={handleAdd} disabled={!newLabel.trim()} aria-label="Confirmar">✓</button>
              <button className="item-add-cancel" onClick={cancelAdd} aria-label="Cancelar">✕</button>
            </li>
          ) : (
            <li className="item-add-btn-row">
              <button className="item-add-btn" onClick={() => setAdding(true)}>+ Adicionar conta</button>
              {(done > 0 || resetDate) && (
                <button
                  className={`reset-btn${confirmReset ? " confirm" : ""}`}
                  onClick={() => { if (confirmReset) { onReset(); setConfirmReset(false); } else setConfirmReset(true); }}
                  onBlur={() => setConfirmReset(false)}
                  title={confirmReset ? "Clique novamente para confirmar" : "Resetar ciclo"}
                >
                  {confirmReset ? "Confirmar?" : resetDate ?? "Resetar"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
