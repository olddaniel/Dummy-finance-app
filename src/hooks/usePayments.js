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

function normalizeDateMode(g) {
  if (g.dateMode) return g.dateMode;        // already migrated
  if (g.noDates) return "none";
  if (g.cycle === "yearly") return "months";
  return "days";
}

function mergeGroups(saved, defaults) {
  if (!saved) return defaults.map((g) => ({ ...g, items: [...g.items] }));
  const defaultIds = new Set(defaults.map((g) => g.id));
  const mergedDefaults = defaults.map((g) => {
    const s = saved.find((sg) => sg.id === g.id);
    if (!s) return { ...g, items: [...g.items] };
    return { ...g, items: s.items };
  });
  // preserve user-added groups (not in defaults)
  const extraGroups = saved
    .filter((sg) => !defaultIds.has(sg.id))
    .map((sg) => ({ ...sg, dateMode: normalizeDateMode(sg) }));
  return [...mergedDefaults, ...extraGroups];
}

export function usePayments() {
  const [groups, setGroups] = useState(() => mergeGroups(loadState()?.groups, DEFAULT_PAYMENTS));
  const [checked,         setChecked]         = useState(() => loadState()?.checked         ?? {});
  const [snoozed,         setSnoozed]         = useState(() => loadState()?.snoozed         ?? {});
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
    saveState({ groups, checked, snoozed, values, lastResets, dates, sortMode, collapsedGroups });
  }, [groups, checked, snoozed, values, lastResets, dates, sortMode, collapsedGroups]);

  // Checking an item clears any snooze on it
  const toggle = useCallback((id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) setSnoozed((s) => ({ ...s, [id]: false }));
      return next;
    });
  }, []);

  // Snoozing an item clears any check on it; toggling off snooze just removes it
  const toggleSnooze = useCallback((id) => {
    setSnoozed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) setChecked((c) => ({ ...c, [id]: false }));
      return next;
    });
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
      const ids = group.items.map((i) => i.id);
      setChecked((c) => {
        const next = { ...c };
        ids.forEach((id) => { next[id] = false; });
        return next;
      });
      setSnoozed((s) => {
        const next = { ...s };
        ids.forEach((id) => { next[id] = false; });
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
    setSnoozed((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
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

  const VIEW_CYCLE      = { closed: "semi", semi: "open",   open: "closed" };
  const VIEW_CYCLE_2WAY = { closed: "open", semi: "open",   open: "closed" };
  const toggleGroupCollapsed = useCallback((groupId, skipSemi = false) => {
    setCollapsedGroups((prev) => {
      const cur = prev[groupId] ?? "open";
      const cycle = skipSemi ? VIEW_CYCLE_2WAY : VIEW_CYCLE;
      return { ...prev, [groupId]: cycle[cur] ?? "open" };
    });
  }, []);

  const addGroup = useCallback((title, dateMode) => {
    const id = `group_${Date.now()}`;
    setGroups((prev) => [...prev, { id, title: title.trim(), dateMode, items: [] }]);
  }, []);

  const removeGroup = useCallback((groupId) => {
    setGroups((prev) => {
      const group = prev.find((g) => g.id === groupId);
      if (group) {
        const ids = group.items.map((i) => i.id);
        setChecked((c) => { const n = { ...c }; ids.forEach((id) => delete n[id]); return n; });
        setSnoozed((s) => { const n = { ...s }; ids.forEach((id) => delete n[id]); return n; });
        setValues((v)  => { const n = { ...v }; ids.forEach((id) => delete n[id]); return n; });
        setDates((d)   => { const n = { ...d }; ids.forEach((id) => delete n[id]); return n; });
      }
      return prev.filter((g) => g.id !== groupId);
    });
    setCollapsedGroups((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
    setLastResets((prev)      => { const n = { ...prev }; delete n[groupId]; return n; });
  }, []);

  const renameGroup = useCallback((groupId, newTitle) => {
    setGroups((prev) =>
      prev.map((g) => g.id === groupId ? { ...g, title: newTitle.trim() } : g)
    );
  }, []);

  const changeGroupDateMode = useCallback((groupId, dateMode) => {
    setGroups((prev) =>
      prev.map((g) => g.id === groupId ? { ...g, dateMode } : g)
    );
  }, []);

  return {
    groups, checked, toggle,
    snoozed, toggleSnooze,
    values, setItemValue,
    dates, setItemDate,
    lastResets, resetGroup,
    addItem, removeItem, renameItem,
    sortMode, setSortMode,
    collapsedGroups, toggleGroupCollapsed,
    addGroup, removeGroup, renameGroup, changeGroupDateMode,
  };
}
