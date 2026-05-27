import { useState, useRef, useMemo, useEffect } from "react";
import { usePayments } from "./hooks/usePayments";
import PaymentGroup from "./components/PaymentGroup";
import Toast from "./components/Toast";
import "./App.css";

const SORT_CYCLE     = ["manual", "value", "date"];
const TOAST_DURATION = 3500;
const NOOP = () => {};

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
    addGroup, removeGroup, renameGroup, changeGroupDateMode, applyGroupOrder,
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
  // drag = { groupId, pointerY, offsetY, floatLeft, floatWidth, floatHeight, insertAt }
  const [drag, setDrag] = useState(null);
  const dragRef  = useRef(null); // live mirror — avoids stale closures in event handlers
  const groupEls = useRef({});

  // orderedGroups: for the main list. During drag the moving card is replaced
  // by a placeholder at the current insertAt position.
  const { orderedGroups, draggedGroup } = useMemo(() => {
    if (!drag) return { orderedGroups: groups, draggedGroup: null };
    const dragged  = groups.find((g) => g.id === drag.groupId) ?? null;
    const without  = groups.filter((g) => g.id !== drag.groupId);
    const at       = Math.min(drag.insertAt, without.length);
    without.splice(at, 0, { __placeholder: true, height: drag.floatHeight });
    return { orderedGroups: without, draggedGroup: dragged };
  }, [groups, drag]);

  // Keep dragRef.groups in sync so stale-closure handlers see current group list
  useEffect(() => { if (dragRef.current) dragRef.current.groups = groups; }, [groups]);

  function handleGroupDragStart(groupId, pointerY) {
    const el = groupEls.current[groupId];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const idx  = groups.findIndex((g) => g.id === groupId);
    const state = {
      groupId,
      pointerY,
      offsetY:     pointerY - rect.top,
      floatLeft:   rect.left,
      floatWidth:  rect.width,
      floatHeight: rect.height,
      insertAt:    idx,
    };
    dragRef.current = { ...state, groups };

    // ── Attach listeners SYNCHRONOUSLY (same event-handler tick as pointerdown) ──
    // This prevents the browser from committing to scroll/context-menu before
    // our handlers exist. A useEffect fires after re-render — too late on mobile.
    function onMove(e) {
      if (e.cancelable) e.preventDefault();
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      if (!dragRef.current) return;
      const { groupId: gid, groups: snap } = dragRef.current;
      const without = snap.filter((g) => g.id !== gid);
      let insertAt = 0;
      for (let i = 0; i < without.length; i++) {
        const node = groupEls.current[without[i].id];
        if (!node) continue;
        const r = node.getBoundingClientRect();
        if (y > r.top + r.height / 2) insertAt = i + 1;
      }
      insertAt = Math.max(0, Math.min(insertAt, without.length));
      dragRef.current.pointerY = y;
      dragRef.current.insertAt = insertAt;
      setDrag((prev) => prev ? { ...prev, pointerY: y, insertAt } : null);
    }

    function onEnd() {
      if (!dragRef.current) return;
      const { groupId: gid, insertAt, groups: snap } = dragRef.current;
      const without = snap.filter((g) => g.id !== gid);
      const dragged = snap.find((g) => g.id === gid);
      if (dragged) {
        without.splice(Math.min(insertAt, without.length), 0, dragged);
        applyGroupOrder(without.map((g) => g.id));
      }
      window.removeEventListener("pointermove",  onMove);
      window.removeEventListener("pointerup",    onEnd);
      window.removeEventListener("pointercancel", onEnd);
      document.removeEventListener("touchmove",  preventScroll);
      dragRef.current = null;
      setDrag(null);
    }

    function preventScroll(e) { if (e.cancelable) e.preventDefault(); }

    window.addEventListener("pointermove",   onMove,        { passive: false });
    window.addEventListener("pointerup",     onEnd);
    window.addEventListener("pointercancel", onEnd);
    document.addEventListener("touchmove",   preventScroll, { passive: false });

    setDrag(state);
    collapseAllGroups(groups.map((g) => g.id));
  }

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
    if (item) showToast(`"${item.label}" removida`, () => restoreItem(groupId, index, item, value, date));
  }

  function handleToggle(itemId) {
    const wasChecked = !!checked[itemId];
    toggle(itemId);
    if (!wasChecked) {
      const found = findItem(itemId);
      showToast(`"${found?.item.label ?? "Conta"}" paga`, () => toggle(itemId));
    }
  }

  function handleToggleSnooze(itemId) {
    const wasSnoozed = !!snoozed[itemId];
    toggleSnooze(itemId);
    if (!wasSnoozed) {
      const found = findItem(itemId);
      showToast(`"${found?.item.label ?? "Conta"}" adiada`, () => toggleSnooze(itemId));
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
    setNewGroupLabel(""); setNewGroupDateMode("none"); setAddingGroup(false);
  }
  function cancelAddGroup() {
    setNewGroupLabel(""); setNewGroupDateMode("none"); setAddingGroup(false);
  }

  // Shared props builder to avoid duplication between list and float renders
  function groupProps(group) {
    return {
      group,
      checked, onToggle: (id) => handleToggle(id),
      snoozed, onToggleSnooze: (id) => handleToggleSnooze(id),
      onReset: () => resetGroup(group.id),
      values, onValueChange: setItemValue,
      dates,  onDateChange:  setItemDate,
      lastReset: lastResets[group.id] ?? null,
      onAddItem:    (label) => addItem(group.id, label),
      onRemoveItem: (itemId) => handleRemoveItem(group.id, itemId),
      onRenameItem: (itemId, label) => renameItem(group.id, itemId, label),
      sortMode,
      viewState:          collapsedGroups[group.id] ?? "open",
      onToggleCollapsed:  () => toggleGroupCollapsed(group.id),
      onRemoveGroup:      () => removeGroup(group.id),
      onRenameGroup:      (t) => renameGroup(group.id, t),
      onChangeDateMode:   (m) => changeGroupDateMode(group.id, m),
    };
  }

  return (
    <div className={`app${drag ? " is-dragging" : ""}`}>
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
        {orderedGroups.map((group) =>
          group.__placeholder ? (
            <div
              key="__placeholder"
              className="group-drag-placeholder"
              style={{ height: group.height }}
            />
          ) : (
            <PaymentGroup
              key={group.id}
              {...groupProps(group)}
              groupRef={(el) => { groupEls.current[group.id] = el; }}
              onDragStart={(py) => handleGroupDragStart(group.id, py)}
              isDragging={false}
            />
          )
        )}

        {!addingGroup && (
          <button className="group-add-btn" onClick={() => setAddingGroup(true)}>
            + Adicionar grupo
          </button>
        )}
        {addingGroup && (
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
                >{label}</button>
              ))}
            </div>
            <div className="group-add-actions">
              <button className="item-add-confirm" onClick={handleAddGroup} disabled={!newGroupLabel.trim()} aria-label="Confirmar">✓</button>
              <button className="item-add-cancel" onClick={cancelAddGroup} aria-label="Cancelar">✕</button>
            </div>
          </div>
        )}
      </main>

      {/* Floating card — fixed under the finger during drag */}
      {drag && draggedGroup && (
        <div
          className="group-drag-float"
          style={{
            top:   drag.pointerY - drag.offsetY,
            left:  drag.floatLeft,
            width: drag.floatWidth,
          }}
        >
          <PaymentGroup
            {...groupProps(draggedGroup)}
            groupRef={null}
            onDragStart={NOOP}
            isDragging={true}
            viewState="closed"
            onToggle={NOOP} onToggleSnooze={NOOP}
            onReset={NOOP}  onValueChange={NOOP} onDateChange={NOOP}
            onAddItem={NOOP} onRemoveItem={NOOP} onRenameItem={NOOP}
            onToggleCollapsed={NOOP} onRemoveGroup={NOOP}
            onRenameGroup={NOOP}    onChangeDateMode={NOOP}
          />
        </div>
      )}

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
