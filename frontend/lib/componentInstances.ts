import type { ElementNode } from "@/types/builder";

// Phase 4 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §10) — slot-aware master
// push. Deliberately bounded: instances stay full element trees (not stub
// references) — see docs/BLUEPRINT.md §5 for why a full master-linked
// rearchitecture was scoped out. What changes here is that pushing a master
// update no longer blindly destroys instance-specific content: any child
// path the component author marked as a "slot" is preserved from the
// instance's own current tree instead of being overwritten by the new master.

/** "0,2" -> [0, 2]. Empty string -> the root itself ([]). */
export function pathFromKey(key: string): number[] {
  return key === "" ? [] : key.split(",").map(Number);
}

/** [0, 2] -> "0,2". [] -> "" (the root itself). */
export function pathToKey(path: number[]): string {
  return path.join(",");
}

export function getNodeAtPath(root: ElementNode, path: number[]): ElementNode | null {
  let node: ElementNode | undefined = root;
  for (const idx of path) {
    node = node?.children?.[idx];
    if (!node) return null;
  }
  return node ?? null;
}

/**
 * Given a freshly-cloned copy of the (possibly updated) master and an
 * instance's own current tree, returns a new tree with the master's
 * structure everywhere except at `slotPaths`, where the instance's own node
 * (whole subtree, own id) is preserved instead. The instance's own `layout`,
 * `componentId`, and `variantId` are preserved on the root regardless of
 * slots (those describe the instance itself, not its content).
 */
export function mergeMasterIntoInstance(
  newMasterClone: ElementNode,
  oldInstance: ElementNode,
  slotPaths: string[]
): ElementNode {
  const slots = new Set(slotPaths);

  function walk(node: ElementNode, path: number[]): ElementNode {
    if (slots.has(pathToKey(path))) {
      const preserved = getNodeAtPath(oldInstance, path);
      if (preserved) return preserved;
    }
    if (!node.children?.length) return node;
    return { ...node, children: node.children.map((c, i) => walk(c, [...path, i])) };
  }

  const merged = walk(newMasterClone, []);
  return {
    ...merged,
    layout: oldInstance.layout,
    componentId: oldInstance.componentId,
    variantId: oldInstance.variantId,
  };
}

/**
 * Finds the nearest (innermost) ancestor of `targetId` that is itself a
 * component instance (`componentId` set), and the index-path from that
 * ancestor down to the target. Returns null if `targetId` isn't inside any
 * instance, or if `targetId` *is* an instance root itself (an instance's own
 * root can't be a "slot" of itself).
 */
export function findEnclosingInstance(
  roots: ElementNode[],
  targetId: string
): { instance: ElementNode; path: number[] } | null {
  function search(node: ElementNode, nearestInstance: ElementNode | null, pathFromNearest: number[]): { instance: ElementNode; path: number[] } | null {
    if (node.id === targetId) {
      return nearestInstance ? { instance: nearestInstance, path: pathFromNearest } : null;
    }
    const isInstance = !!node.componentId;
    for (let i = 0; i < (node.children?.length ?? 0); i++) {
      const result = search(
        node.children[i],
        isInstance ? node : nearestInstance,
        isInstance ? [i] : [...pathFromNearest, i]
      );
      if (result) return result;
    }
    return null;
  }

  for (const root of roots) {
    const result = search(root, root.componentId ? root : null, []);
    if (result) return result;
  }
  return null;
}
