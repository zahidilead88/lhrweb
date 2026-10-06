import type { ElementNode, CmsEntry, CmsListQuery } from "@/types/builder";

// Phase 2/3 (docs/BLUEPRINT.md) — projects an element tree's `cmsBinding`s and
// `cmsList` repeats into real content at render time. Pure and non-mutating:
// the caller's own `elements` state (what the editor saves) is never
// touched — this only ever produces a throwaway copy for display/publish.

function queryEntries(entries: CmsEntry[], q: CmsListQuery): CmsEntry[] {
  let list = entries.filter((e) => e.collectionId === q.collectionId && e.published);
  if (q.filterField && q.filterEquals !== undefined) {
    list = list.filter((e) => String(e.values[q.filterField!] ?? "") === q.filterEquals);
  }
  if (q.sortField) {
    const field = q.sortField;
    list = [...list].sort((a, b) => {
      const av = a.values[field], bv = b.values[field];
      const cmp = av === bv ? 0 : (av as never) < (bv as never) ? -1 : 1;
      return q.sortDir === "desc" ? -cmp : cmp;
    });
  }
  if (q.limit) list = list.slice(0, q.limit);
  return list;
}

function applyBinding(el: ElementNode, entryById: Map<string, CmsEntry>, contextEntry: CmsEntry | null): ElementNode {
  const binding = el.cmsBinding;
  if (!binding) return el;
  const entry = binding.entryId ? entryById.get(binding.entryId) : contextEntry ?? undefined;
  const value = entry?.values?.[binding.field];
  if (value === undefined || value === null) return el;
  if (el.tag === "img") return { ...el, attrs: { ...el.attrs, src: String(value) } };
  return { ...el, content: String(value) };
}

/**
 * `contextEntry` is the entry to resolve entry-less `cmsBinding`s against —
 * set when the whole page is a dynamic CMS template (Phase 3 §9.2). Inside a
 * `cmsList` repeat, each iteration supplies its own context regardless.
 */
export function resolveCmsBindings(
  elements: ElementNode[],
  entries: CmsEntry[],
  contextEntry: CmsEntry | null = null
): ElementNode[] {
  if (entries.length === 0 && !contextEntry) return elements;
  const entryById = new Map(entries.map((e) => [e._id, e]));

  function resolveNode(el: ElementNode, ctx: CmsEntry | null): ElementNode {
    if (el.cmsList) {
      const matches = queryEntries(entries, el.cmsList);
      const template = el.children ?? [];
      const repeated = matches.flatMap((entry) => template.map((child) => resolveNode(applyBinding(child, entryById, entry), entry)));
      return { ...applyBinding(el, entryById, ctx), children: repeated };
    }
    const withBinding = applyBinding(el, entryById, ctx);
    const kids = withBinding.children;
    const children = kids?.length ? kids.map((c) => resolveNode(c, ctx)) : kids;
    return children === kids ? withBinding : { ...withBinding, children };
  }

  return elements.map((el) => resolveNode(el, contextEntry));
}
