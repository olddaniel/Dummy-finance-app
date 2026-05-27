import { useState, useRef, useMemo, useEffect } from "react";
import { usePayments } from "./hooks/usePayments";
import PaymentGroup from "./components/PaymentGroup";
import Toast from "./components/Toast";
import "./App.css";

const SORT_CYCLE    = ["manual", "value", "date"];
const TOAST_DURATION = 3500;

function SortIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 3h10M1 6h6.5M1 9h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function App() {
  const {
    groups, checked, toggle,
    snoozed, toggleSnooze,
    values, setItemValue,
    dates, setItemDate,
    lastResets, resetGroup,
    addItem, removeItem, restoreItem, renameItem,
    sortMode, setSortMode,
    collapsedGroups, toggleGroupCollapsed, collapseAllGroups,
    addGroup, removeGroup, renameGroup, changeGroupDateMode, reorderGroups,
  } = usePayments();

  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupDateMode, setNewGroupDateMode] = useState("none");

  // ── Toast ──
  const [toast, setToast]      = useState({ visible: false, message: "", undoFn: null });
  const [toastKey, setToastKey] = useState(0);
  const toastTimeout = useRef(null);

  function showToast(message, undoFn) {
    clearTimeout(toastTimeout.current);
    setToastKey((k) => k + 1);
    setToast({ visible: true, message, undoFn });
    toastTimeout.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, TOAST_DURATION);
  }

  function handleUndoToast() {
    clearTimeout(toastTimeout.current);
    toast.undoFn?.();
    setToast((t) => ({ ...t, visible: false }));
  }

  // ── Drag-to-reorder ──
  const [draggingId, setDraggingId] = useState(null);
  const [insertAt,   setInsertAt]   = useState(null);
  const groupEls  = useRef({});   // groupId → DOM element
  const dragState = useRef(null); // live copy to avoid stale closures

  // Derive display order during drag (live visual reorder)
  const orderedGroups = useMemo(() => {
    if (!draggingId || insertAt === null) return groups;
    const from = groups.findIndex((g) => g.id === draggingId);
    if (from === -1) return groups;
    const arr = [...groups];
    const [item] = arr.splice(from, 1);
    arr.splice(insertAt, 0, item);
    return arr;
  }, [groups, draggingId, insertAt]);

  function handleGroupDragStart(groupId) {
    const idx = groups.findIndex((g) => g.id === groupId);
    dragState.current = { groupId, insertAt: idx, groups };
    setDraggingId(groupId);
    setInsertAt(idx);
    collapseAllGroups(groups.map((g) => g.id));
  }

  useEffect(() => {
    if (!draggingId) return;

    function onMove(e) {
      if (e.cancelable) e.preventDefault();
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const { groups: g } = dragState.current;
      let next = 0;
      for (let i = 0; i < g.length; i++) {
        const el = groupEls.current[g[i].id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y > rect.top + rect.height / 2) next = i + 1;
      }
      next = Math.max(0, Math.min(next, g.length - 1));
      dragState.current.insertAt = next;
      setInsertAt(next);
    }

    function onEnd() {
      const { groupId, insertAt: finalIdx } = dragState.current;
      reorderGroups(groupId, finalIdx);
      dragState.current = null;
      setDraggingId(null);
      setInsertAt(null);
    }

    // pointer events handle both mouse and touch uniformly
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup",   onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onEnd);
    };
  }, [draggingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep dragState.groups in sync while drag is live (groups shouldn't change
  // during drag, but keeps the ref fresh just in case)
  useEffect(() => {
    if (dragState.current) dragState.current.groups = groups;
  }, [groups]);

  // ── Helpers ──
  function findItem(itemId) {
    for (const group of groups) {
      const item = group.items.find((i) => i.id === itemId);
      if (item) return { group, item, index: group.items.indexOf(item) };
    }
    return null;
  }

  function handleRemoveItem(groupId, itemId) {
    const group = groups.find((g) => g.id === groupId);
    const index = group?.items.findIndex((i) => i.id === itemId) ?? -1;
    const item  = group?.items[index];
    const value = values[itemId];
    const date  = dates[itemId];
    removeItem(groupId, itemId);
    if (item) {
      showToast(`"${item.label}" removida`, () => restoreItem(groupId, index, item, value, date));
    }
  }

  function handleToggle(itemId) {
    const wasChecked = !!checked[itemId];
    toggle(itemId);
    if (!wasChecked) {
      const found = findItem(itemId);
      const label = found?.item.label ?? "Conta";
      showToast(`"${label}" paga`, () => toggle(itemId));
    }
  }

  function handleToggleSnooze(itemId) {
    const wasSnoozed = !!snoozed[itemId];
    toggleSnooze(itemId);
    if (!wasSnoozed) {
      const found = findItem(itemId);
      const label = found?.item.label ?? "Conta";
      showToast(`"${label}" adiada`, () => toggleSnooze(itemId));
    }
  }

  function cycleSortMode() {
    const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length];
    setSortMode(next);
  }

  const sortLabel = sortMode === "value" ? "R$↓" : sortMode === "date" ? "data↑" : null;

  function handleAddGroup() {
    if (!newGroupLabel.trim()) return;
    addGroup(newGroupLabel, newGroupDateMode);
    setNewGroupLabel("");
    setNewGroupDateMode("none");
    setAddingGroup(false);
  }

  function cancelAddGroup() {
    setNewGroupLabel("");
    setNewGroupDateMode("none");
    setAddingGroup(false);
  }

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="app-icon">💳</span>
          <h1 className="app-title">Finance Tracker</h1>
          <button
            className={`sort-btn${sortMode !== "manual" ? " active" : ""}`}
            onClick={cycleSortMode}
            title={
              sortMode === "manual" ? "Ordenar por valor ou data" :
              sortMode === "value"  ? "Ordenando por valor" : "Ordenando por data"
            }
          >
            {sortLabel ?? <SortIcon />}
          </button>
        </div>
      </header>

      <main className="main">
        {orderedGroups.map((group) => (
          <PaymentGroup
            key={group.id}
            group={group}
            groupRef={(el) => { groupEls.current[group.id] = el; }}
            onDragStart={() => handleGroupDragStart(group.id)}
            isDragging={draggingId === group.id}
            checked={checked}
            onToggle={(id) => handleToggle(id)}
            snoozed={snoozed}
            onToggleSnooze={(itemId) => handleToggleSnooze(itemId)}
            onReset={() => resetGroup(group.id)}
            values={values}
            onValueChange={setItemValue}
            dates={dates}
            onDateChange={setItemDate}
            lastReset={lastResets[group.id] ?? null}
            onAddItem={(label) => addItem(group.id, label)}
            onRemoveItem={(itemId) => handleRemoveItem(group.id, itemId)}
            onRenameItem={(itemId, label) => renameItem(group.id, itemId, label)}
            sortMode={sortMode}
            viewState={collapsedGroups[group.id] ?? "open"}
            onToggleCollapsed={() => toggleGroupCollapsed(group.id)}
            onRemoveGroup={() => removeGroup(group.id)}
            onRenameGroup={(newTitle) => renameGroup(group.id, newTitle)}
            onChangeDateMode={(mode) => changeGroupDateMode(group.id, mode)}
          />
        ))}

        {addingGroup ? (
          <div className="group-add-form">
            <input
              className="group-add-input"
              placeholder="Nome do grupo..."
              value={newGroupLabel}
              onChange={(e) => setNewGroupLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddGroup(); if (e.key === "Escape") cancelAddGroup(); }}
              maxLength={40}
              autoFocus
            />
            <div className="group-add-modes">
              {[
                { value: "none",   label: "Sem data" },
                { value: "days",   label: "Dias" },
                { value: "months", label: "Meses" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`group-add-mode-btn${newGroupDateMode === value ? " active" : ""}`}
                  onClick={() => setNewGroupDateMode(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="group-add-actions">
              <button className="item-add-confirm" onClick={handleAddGroup} disabled={!newGroupLabel.trim()} aria-label="Confirmar">✓</button>
              <button className="item-add-cancel" onClick={cancelAddGroup} aria-label="Cancelar">✕</button>
            </div>
          </div>
        ) : (
          <button className="group-add-btn" onClick={() => setAddingGroup(true)}>
            + Adicionar grupo
          </button>
        )}
      </main>

      <Toast
        message={toast.message}
        onUndo={handleUndoToast}
        visible={toast.visible}
        toastKey={toastKey}
      />
    </div>
  );
}

export default App;
