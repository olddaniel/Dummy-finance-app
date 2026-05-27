import { usePayments } from "./hooks/usePayments";
import PaymentGroup from "./components/PaymentGroup";
import "./App.css";

function App() {
  const { groups, checked, toggle, values, setItemValue, resetGroup, lastResets, addItem, removeItem } = usePayments();

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="app-icon">💳</span>
          <h1 className="app-title">Contas a Pagar</h1>
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
            lastReset={lastResets[group.id] ?? null}
            onAddItem={(label) => addItem(group.id, label)}
            onRemoveItem={(itemId) => removeItem(group.id, itemId)}
          />
        ))}
      </main>
    </div>
  );
}

export default App;
