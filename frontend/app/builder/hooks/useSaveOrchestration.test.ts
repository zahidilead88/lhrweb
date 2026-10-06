import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSaveOrchestration } from "./useSaveOrchestration";

describe("useSaveOrchestration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts idle: not saving, not saved, no failure, no recovery prompt", () => {
    const { result } = renderHook(() => useSaveOrchestration("proj-1"));
    expect(result.current.saving).toBe(false);
    expect(result.current.saved).toBe(false);
    expect(result.current.saveFailed).toBe(false);
    expect(result.current.saveRetryCount).toBe(0);
    expect(result.current.showRecovery).toBe(false);
  });

  it("writes and clears a recovery snapshot under a project-scoped key", () => {
    const { result } = renderHook(() => useSaveOrchestration("proj-1"));

    act(() => {
      result.current.elementsForRecovery.current = [{ id: "el-1" } as never];
      result.current.writeRecoverySnapshot();
    });

    const raw = localStorage.getItem("lhrweb_recovery_proj-1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).elements).toEqual([{ id: "el-1" }]);

    act(() => result.current.clearRecoverySnapshot());
    expect(localStorage.getItem("lhrweb_recovery_proj-1")).toBeNull();
  });

  it("checkRecovery surfaces a snapshot newer than the project's last save", () => {
    const { result } = renderHook(() => useSaveOrchestration("proj-1"));

    localStorage.setItem(
      "lhrweb_recovery_proj-1",
      JSON.stringify({ elements: [], frames: [], timestamp: Date.now() })
    );

    act(() => result.current.checkRecovery("proj-1", new Date(0).toISOString()));

    expect(result.current.showRecovery).toBe(true);
    expect(result.current.recoverySnapshot).not.toBeNull();
  });

  it("checkRecovery ignores a snapshot older than the project's last save", () => {
    const { result } = renderHook(() => useSaveOrchestration("proj-1"));

    localStorage.setItem(
      "lhrweb_recovery_proj-1",
      JSON.stringify({ elements: [], frames: [], timestamp: 1000 })
    );

    act(() => result.current.checkRecovery("proj-1", new Date(9_000_000).toISOString()));

    expect(result.current.showRecovery).toBe(false);
  });

  it("falls back to an 'unknown' recovery key when no project id is set yet", () => {
    const { result } = renderHook(() => useSaveOrchestration(undefined));

    act(() => result.current.writeRecoverySnapshot([], []));

    expect(localStorage.getItem("lhrweb_recovery_unknown")).not.toBeNull();
  });
});
