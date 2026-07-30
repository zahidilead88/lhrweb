import type { ElementNode, Frame } from "@/types/builder";

/**
 * Convert a frame's children (which carry layout.x/y/width/height for the free canvas)
 * into clean ElementNode[] suitable for flow-mode rendering and the published site.
 *
 * Rules applied (recursively):
 * - Strip the `layout` field from every node
 * - Reset `position: "absolute"` to `"relative"` (free canvas uses absolute for placement;
 *   flow mode and the published site don't want random absolute children)
 * - If `width` is a px value equal to frameWidth, replace with "100%" (full-width element)
 * - Never mutate input
 *
 * When `frame.layoutMode !== "none"` the frame's Auto Layout config (direction, gap,
 * padding, alignment) is carried into the publish output as a single flex/grid wrapper —
 * matching what FrameContent.tsx already renders in the editor — instead of silently
 * discarding it in favor of plain document-order stacking.
 */
export function frameToElements(children: ElementNode[], frameWidth?: number): ElementNode[];
export function frameToElements(frame: Frame): ElementNode[];
export function frameToElements(childrenOrFrame: ElementNode[] | Frame, frameWidth?: number): ElementNode[] {
  if (Array.isArray(childrenOrFrame)) {
    return childrenOrFrame.map(el => cleanNode(el, frameWidth));
  }
  const frame = childrenOrFrame;
  const cleaned = frame.children.map(el => cleanNode(el, frame.width));
  if (!frame.layoutMode || frame.layoutMode === "none") return cleaned;

  const wrapper: ElementNode = {
    id: `el-al-${frame.id.slice(-8)}`,
    tag: "div",
    label: frame.name,
    styles: {
      desktop: {
        display: frame.layoutMode === "grid" ? "grid" : "flex",
        flexDirection: frame.layoutMode === "vertical" ? "column" : frame.layoutMode === "horizontal" ? "row" : undefined,
        flexWrap: "wrap",
        gap: `${frame.gap ?? 0}px`,
        padding: `${frame.paddingTop ?? 0}px ${frame.paddingRight ?? 0}px ${frame.paddingBottom ?? 0}px ${frame.paddingLeft ?? 0}px`,
        justifyContent: frame.justifyContent,
        alignItems: frame.alignItems,
        gridTemplateColumns: frame.layoutMode === "grid" ? `repeat(${frame.gridColumns ?? 3}, 1fr)` : undefined,
        width: "100%",
      },
    },
    children: cleaned,
  };
  return [wrapper];
}

function cleanNode(el: ElementNode, frameWidth?: number): ElementNode {
  const desktop = { ...(el.styles?.desktop ?? {}) };

  // Strip absolute positioning left over from free canvas placement
  if (desktop.position === "absolute") {
    desktop.position = "relative";
    // Remove the directional offsets that were set for canvas placement
    delete desktop.top;
    delete desktop.left;
    delete desktop.right;
    delete desktop.bottom;
  }

  // If width was locked to the frame's full width, make it fluid instead
  if (frameWidth && typeof desktop.width === "string") {
    const px = parseFloat(desktop.width);
    if (!isNaN(px) && Math.abs(px - frameWidth) < 4) {
      desktop.width = "100%";
    }
  }

  return {
    ...el,
    layout: undefined,      // strip free-canvas positioning
    styles: {
      ...el.styles,
      desktop,
    },
    children: el.children.map(child => cleanNode(child, frameWidth)),
  };
}
