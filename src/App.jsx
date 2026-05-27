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
  } = usePayments();

  function cycleSortMode() {
    const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length];
    setSortMode(next);
  }

  const sortLabel = sortMode === "value" ? "R$↓" : sortMode === "date" ? "data↑" : null;

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="app-icon">💳</span>
          <h1 className="app-title">Contas a Pagar</h1>
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
          />
        ))}
      </main>
    </div>
  );
}

export default App;
