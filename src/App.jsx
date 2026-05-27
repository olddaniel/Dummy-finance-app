import { DEFAULT_PAYMENTS } from "./data";
import { usePayments } from "./hooks/usePayments";
import PaymentGroup from "./components/PaymentGroup";
import "./App.css";

function App() {
  const { checked, toggle, values, setItemValue, resetGroup, lastResets } = usePayments();

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="app-icon">💳</span>
          <h1 className="app-title">Contas a Pagar</h1>
        </div>
      </header>

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
            lastReset={lastResets[group.id] ?? null}
          />
        ))}
      </main>
    </div>
  );
}

export default App;
