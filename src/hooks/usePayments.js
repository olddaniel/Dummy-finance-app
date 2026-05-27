import { useState, useEffect, useCallback } from "react";
import { DEFAULT_PAYMENTS } from "../data";

const STORAGE_KEY = "payment-tracker-state";

function buildInitialChecked() {
  const checked = {};
  DEFAULT_PAYMENTS.forEach((group) => {
    group.items.forEach((item) => {
      checked[item.id] = false;
    });
  });
  return checked;
}

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
  } catch {
    // quota exceeded — silently ignore
  }
}

export function usePayments() {
  const [checked, setChecked] = useState(() => {
    const saved = loadState();
    if (saved?.checked) {
      // Merge in case new items were added to DEFAULT_PAYMENTS
      return { ...buildInitialChecked(), ...saved.checked };
    }
    return buildInitialChecked();
  });

  const [lastReset, setLastReset] = useState(() => {
    const saved = loadState();
    return saved?.lastReset ?? null;
  });

  const [values, setValues] = useState(() => {
    const saved = loadState();
    return saved?.values ?? {};
  });

  // Persist on every change
  useEffect(() => {
    saveState({ checked, lastReset, values });
  }, [checked, lastReset, values]);

  const toggle = useCallback((id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetGroup = useCallback((groupId) => {
    const group = DEFAULT_PAYMENTS.find((g) => g.id === groupId);
    if (!group) return;
    setChecked((prev) => {
      const next = { ...prev };
      group.items.forEach((item) => {
        next[item.id] = false;
      });
      return next;
    });
    setLastReset(new Date().toISOString());
  }, []);

  const resetAll = useCallback(() => {
    setChecked(buildInitialChecked());
    setLastReset(new Date().toISOString());
  }, []);

  const setItemValue = useCallback((id, rawValue) => {
    const num = parseFloat(rawValue);
    setValues((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  }, []);

  return { checked, toggle, resetGroup, resetAll, lastReset, values, setItemValue };
}
