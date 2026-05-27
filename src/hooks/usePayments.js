import { useState, useEffect, useCallback } from "react";
import { DEFAULT_PAYMENTS } from "../data";

const STORAGE_KEY = "payment-tracker-state";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

export function usePayments() {
  // Groups own the item list — starts from defaults, fully editable
  const [groups, setGroups] = useState(() => {
    const saved = loadState();
    return saved?.groups ?? DEFAULT_PAYMENTS.map((g) => ({ ...g, items: [...g.items] }));
  });

  // checked / values keyed by item id — undefined treated as false / 0
  const [checked, setChecked] = useState(() => loadState()?.checked ?? {});
  const [values,  setValues]  = useState(() => loadState()?.values  ?? {});

  // Per-group last-reset timestamps
  const [lastResets, setLastResets] = useState(() => loadState()?.lastResets ?? {});

  useEffect(() => {
    saveState({ groups, checked, values, lastResets });
  }, [groups, checked, values, lastResets]);

  const toggle = useCallback((id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setItemValue = useCallback((id, rawValue) => {
    const num = parseFloat(rawValue);
    setValues((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  }, []);

  const resetGroup = useCallback((groupId) => {
    setGroups((prev) => {
      const group = prev.find((g) => g.id === groupId);
      if (!group) return prev;
      setChecked((c) => {
        const next = { ...c };
        group.items.forEach((item) => { next[item.id] = false; });
        return next;
      });
      return prev;
    });
    setLastResets((prev) => ({ ...prev, [groupId]: new Date().toISOString() }));
  }, []);

  const addItem = useCallback((groupId, label) => {
    const id = `${groupId}_${Date.now()}`;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, items: [...g.items, { id, label: label.trim() }] } : g
      )
    );
  }, []);

  const removeItem = useCallback((groupId, itemId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g
      )
    );
    setChecked((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
    setValues((prev)  => { const n = { ...prev }; delete n[itemId]; return n; });
  }, []);

  const renameItem = useCallback((groupId, itemId, newLabel) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, items: g.items.map((i) => i.id === itemId ? { ...i, label: newLabel } : i) }
          : g
      )
    );
  }, []);

  return { groups, checked, toggle, values, setItemValue, resetGroup, lastResets, addItem, removeItem, renameItem };
}
