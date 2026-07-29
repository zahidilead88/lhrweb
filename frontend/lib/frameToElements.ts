import type { ElementNode } from "@/types/builder";

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
 */
export function frameToElements(children: ElementNode[], frameWidth?: number): ElementNode[] {
  return children.map(el => cleanNode(el, frameWidth));
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
