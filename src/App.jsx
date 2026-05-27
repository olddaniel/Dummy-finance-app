import { useState } from "react";
import { DEFAULT_PAYMENTS } from "./data";
import { usePayments } from "./hooks/usePayments";
import PaymentGroup from "./components/PaymentGroup";
import "./App.css";

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function App() {
  const { checked, toggle, resetGroup, resetAll, lastReset, values, setItemValue } = usePayments();
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const totalItems = DEFAULT_PAYMENTS.reduce((sum, g) => sum + g.items.length, 0);
  const totalDone = Object.values(checked).filter(Boolean).length;

  function handleResetAll() {
    if (confirmResetAll) {
      resetAll();
      setConfirmResetAll(false);
    } else {
      setConfirmResetAll(true);
    }
  }

  return (
    <div className="app">
      {/* Top bar */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="app-title-block">
            <span className="app-icon">💳</span>
            <h1 className="app-title">Contas a Pagar</h1>
          </div>

          <div className="top-bar-right">
            <span className="global-progress">
              {totalDone}/{totalItems} pago{totalDone !== 1 ? "s" : ""}
            </span>
            <button
              className={`reset-all-btn${confirmResetAll ? " confirm" : ""}`}
              onClick={handleResetAll}
              onBlur={() => setConfirmResetAll(false)}
              title="Reset all cycles"
            >
              {confirmResetAll ? "⚠️ Confirmar?" : "↺ Reset geral"}
            </button>
          </div>
        </div>

        {/* Global progress bar */}
        <div
          className="global-progress-bar"
          role="progressbar"
          aria-valuenow={totalDone}
          aria-valuemax={totalItems}
        >
          <div
            className="global-progress-fill"
            style={{
              width: `${totalItems === 0 ? 0 : (totalDone / totalItems) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* Payment groups */}
      <main className="main">
        {DEFAULT_PAYMENTS.map((group) => (
          <PaymentGroup
            key={group.id}
            group={group}
            checked={checked}
            onToggle={toggle}
            onReset={() => resetGroup(group.id)}
            values={values}
            onValueChange={setItemValue}
          />
        ))}
      </main>

      {/* Footer */}
      {lastReset && (
        <footer className="footer">
          Último reset: {formatDate(lastReset)}
        </footer>
      )}
    </div>
  );
}

export default App;
