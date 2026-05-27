import { useState } from "react";
import { usePayments } from "./hooks/usePayments";
import PaymentGroup from "./components/PaymentGroup";
import "./App.css";

const SORT_CYCLE = ["manual", "value", "date"];

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
    values, setItemValue,
    dates, setItemDate,
    lastResets, resetGroup,
    addItem, removeItem, renameItem,
    sortMode, setSortMode,
    collapsedGroups, toggleGroupCollapsed,
    addGroup, removeGroup, renameGroup, changeGroupDateMode,
  } = usePayments();

  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupDateMode, setNewGroupDateMode] = useState("none");

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
        {groups.map((group) => (
          <PaymentGroup
            key={group.id}
            group={group}
            checked={checked}
            onToggle={toggle}
            onReset={() => resetGroup(group.id)}
            values={values}
            onValueChange={setItemValue}
            dates={dates}
            onDateChange={setItemDate}
            lastReset={lastResets[group.id] ?? null}
            onAddItem={(label) => addItem(group.id, label)}
            onRemoveItem={(itemId) => removeItem(group.id, itemId)}
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
    </div>
  );
}

export default App;
