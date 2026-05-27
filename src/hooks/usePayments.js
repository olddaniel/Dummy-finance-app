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
  const [groups,          setGroups]          = useState(() => loadState()?.groups          ?? DEFAULT_PAYMENTS.map((g) => ({ ...g, items: [...g.items] })));
  const [checked,         setChecked]         = useState(() => loadState()?.checked         ?? {});
  const [values,          setValues]          = useState(() => loadState()?.values          ?? {});
  const [lastResets,      setLastResets]      = useState(() => loadState()?.lastResets      ?? {});
  const [dates,           setDates]           = useState(() => loadState()?.dates           ?? {});
  const [sortMode,        setSortModeState]   = useState(() => loadState()?.sortMode        ?? "manual");
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    const saved = loadState()?.collapsedGroups ?? {};
    // migrate old boolean values → "open" | "semi" | "closed"
    return Object.fromEntries(
      Object.entries(saved).map(([k, v]) =>
        [k, v === true ? "closed" : (v === "semi" || v === "closed") ? v : "open"]
      )
    );
  });

  useEffect(() => {
    saveState({ groups, checked, values, lastResets, dates, sortMode, collapsedGroups });
  }, [groups, checked, values, lastResets, dates, sortMode, collapsedGroups]);

  const toggle = useCallback((id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setItemValue = useCallback((id, rawValue) => {
    const num = parseFloat(rawValue);
    setValues((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  }, []);

  const setItemDate = useCallback((id, rawValue) => {
    const num = parseInt(rawValue, 10);
    setDates((prev) => ({ ...prev, [id]: isNaN(num) ? null : num }));
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
    setDates((prev)   => { const n = { ...prev }; delete n[itemId]; return n; });
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

  const setSortMode = useCallback((mode) => setSortModeState(mode), []);

  const VIEW_CYCLE = { open: "semi", semi: "closed", closed: "open" };
  const toggleGroupCollapsed = useCallback((groupId) => {
    setCollapsedGroups((prev) => {
      const cur = prev[groupId] ?? "open";
      return { ...prev, [groupId]: VIEW_CYCLE[cur] ?? "open" };
    });
  }, []);

  return {
    groups, checked, toggle,
    values, setItemValue,
    dates, setItemDate,
    lastResets, resetGroup,
    addItem, removeItem, renameItem,
    sortMode, setSortMode,
    collapsedGroups, toggleGroupCollapsed,
  };
}
