import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSelectionState } from "./useSelectionState";

describe("useSelectionState", () => {
  it("starts with nothing selected", () => {
    const { result } = renderHook(() => useSelectionState());
    expect(result.current.selectedElementId).toBeNull();
    expect(result.current.selectedFrameId).toBeNull();
    expect(result.current.freeSelectedIds).toEqual([]);
    expect(result.current.selectedFrameElementIds).toEqual([]);
    expect(result.current.hasSelection).toBe(false);
  });

  it("hasSelection tracks each selection category independently", () => {
    const { result } = renderHook(() => useSelectionState());

    act(() => result.current.setSelectedElementId("el-1"));
    expect(result.current.hasSelection).toBe(true);

    act(() => result.current.setSelectedElementId(null));
    expect(result.current.hasSelection).toBe(false);

    act(() => result.current.setFreeSelectedIds(["a", "b"]));
    expect(result.current.hasSelection).toBe(true);
  });

  it("clearSelection resets every selection field", () => {
    const { result } = renderHook(() => useSelectionState());

    act(() => {
      result.current.setSelectedElementId("el-1");
      result.current.setSelectedFrameId("frame-1");
      result.current.setFreeSelectedIds(["a", "b"]);
      result.current.setSelectedFrameElementIds(["c"]);
    });
    expect(result.current.hasSelection).toBe(true);

    act(() => result.current.clearSelection());

    expect(result.current.selectedElementId).toBeNull();
    expect(result.current.selectedFrameId).toBeNull();
    expect(result.current.freeSelectedIds).toEqual([]);
    expect(result.current.selectedFrameElementIds).toEqual([]);
    expect(result.current.hasSelection).toBe(false);
  });
});
