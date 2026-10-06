import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCanvasModeState } from "./useCanvasModeState";

describe("useCanvasModeState", () => {
  it("defaults to the flow editor at desktop viewport, no preview", () => {
    const { result } = renderHook(() => useCanvasModeState());
    expect(result.current.canvasMode).toBe("flow");
    expect(result.current.canvasViewport).toBe("desktop");
    expect(result.current.canvasZoom).toBe(0.75);
    expect(result.current.activeTool).toBe("move");
    expect(result.current.previewMode).toBe("none");
    expect(result.current.previewDevice).toBe("desktop");
  });

  it("updates each field independently of the others", () => {
    const { result } = renderHook(() => useCanvasModeState());

    act(() => {
      result.current.setCanvasModeState("free");
      result.current.setPreviewMode("split");
      result.current.setPreviewDevice("mobile");
    });

    expect(result.current.canvasMode).toBe("free");
    expect(result.current.previewMode).toBe("split");
    expect(result.current.previewDevice).toBe("mobile");
    // untouched fields keep their defaults
    expect(result.current.canvasViewport).toBe("desktop");
    expect(result.current.activeTool).toBe("move");
  });
});
