"use client";
import { useReducer, useCallback } from "react";

type HistoryState<T> = { past: T[]; present: T; future: T[] };
type Action<T> = { type: "SET"; payload: T } | { type: "UNDO" } | { type: "REDO" } | { type: "RESET"; payload: T };

const MAX_HISTORY = 50;

function reducer<T>(state: HistoryState<T>, action: Action<T>): HistoryState<T> {
  switch (action.type) {
    case "SET":
      return {
        past:    [...state.past.slice(-MAX_HISTORY), state.present],
        present: action.payload,
        future:  [],
      };
    case "UNDO":
      if (state.past.length === 0) return state;
      return {
        past:    state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future:  [state.present, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0) return state;
      return {
        past:    [...state.past, state.present],
        present: state.future[0],
        future:  state.future.slice(1),
      };
    case "RESET":
      return { past: [], present: action.payload, future: [] };
    default:
      return state;
  }
}

export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(
    reducer as (s: HistoryState<T>, a: Action<T>) => HistoryState<T>,
    { past: [], present: initial, future: [] }
  );

  const set   = useCallback((val: T) => dispatch({ type: "SET",   payload: val }), []);
  const undo  = useCallback(()       => dispatch({ type: "UNDO"  }), []);
  const redo  = useCallback(()       => dispatch({ type: "REDO"  }), []);
  const reset = useCallback((val: T) => dispatch({ type: "RESET", payload: val }), []);

  return {
    blocks:   state.present,
    set,
    undo,
    redo,
    reset,
    canUndo:  state.past.length > 0,
    canRedo:  state.future.length > 0,
  };
}
