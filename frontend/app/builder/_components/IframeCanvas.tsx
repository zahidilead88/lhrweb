"use client";

import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import type { ElementNode, StyleClass, SiteTokens } from "@/types/builder";
import { generateHTML } from "@/lib/generateHTML";
import { generateCSS } from "@/lib/generateCSS";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Viewport = "desktop" | "tablet" | "mobile";

export interface IframeCanvasProps {
  elements: ElementNode[];
  classes?: StyleClass[];
  tokens?: SiteTokens;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onUpdateContent?: (id: string, content: string) => void;
  onResize?: (id: string, width: string, height: string) => void;
  onReparent?: (dragId: string, targetId: string) => void;
  onReady?: (iframe: HTMLIFrameElement) => void;
  viewport?: Viewport;
  onViewportChange?: (v: Viewport) => void;
  showViewportSwitcher?: boolean;
}

// ── Injected script (runs inside the iframe) ──────────────────────────────────

const IFRAME_SCRIPT = `
<script>
(function () {
  // Click: find nearest data-id ancestor and notify parent
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-id]');
    if (!el) return;
    parent.postMessage({ type: 'SELECT', id: el.getAttribute('data-id') }, '*');
  }, true);

  // Double-click: inline text editing
  document.addEventListener('dblclick', function (e) {
    var el = e.target.closest('[data-id]');
    if (!el) return;
    var tag = el.tagName.toLowerCase();
    if (['img','input','textarea','select','video','iframe','svg'].indexOf(tag) !== -1) return;
    if (el.querySelector('[data-id]')) return;
    e.preventDefault();
    el.contentEditable = 'true';
    el.focus();
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    function finish() {
      el.contentEditable = 'false';
      parent.postMessage({ type: 'CONTENT', id: el.getAttribute('data-id'), content: el.innerText }, '*');
    }
    el.addEventListener('blur', finish, { once: true });
  });

  // Receive messages from parent
  window.addEventListener('message', function (e) {
    if (!e.data) return;

    // Selection highlight + resize capture
    if (e.data.type === 'el-sel') {
      var prev = document.querySelector('.__sel');
      if (prev) {
        prev.classList.remove('.__sel');
        var w = prev.style.width;
        var h = prev.style.height;
        if (w || h) {
          parent.postMessage({
            type: 'RESIZE',
            id: prev.getAttribute('data-id'),
            width: w || Math.round(prev.offsetWidth) + 'px',
            height: h || Math.round(prev.offsetHeight) + 'px'
          }, '*');
        }
      }
      if (e.data.id) {
        var target = document.querySelector('[data-id="' + e.data.id + '"]');
        if (target) {
          target.classList.add('__sel');
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    // Find element at drop point for panel drag-and-drop
    if (e.data.type === 'FIND_AT_POINT') {
      var x = e.data.x, y = e.data.y;
      var hits = document.elementsFromPoint(x, y);
      var found = null;
      for (var i = 0; i < hits.length; i++) {
        if (hits[i].getAttribute && hits[i].getAttribute('data-id')) {
          found = hits[i]; break;
        }
      }
      var resultId = null, resultPos = 'append';
      if (found) {
        resultId = found.getAttribute('data-id');
        // If the found element has child [data-id] elements, the cursor is on the
        // container's empty space (children would have been found first otherwise)
        // → drop inside the container, not before/after it
        var childEl = found.querySelector('[data-id]');
        if (childEl) {
          resultPos = 'inside';
        } else {
          var rect = found.getBoundingClientRect();
          resultPos = y < (rect.top + rect.height / 2) ? 'before' : 'after';
        }
      }
      parent.postMessage({ type: 'POINT_RESULT', id: resultId, position: resultPos }, '*');
    }

    // Return element bounding rect + CSS position info for overlay rendering
    if (e.data.type === 'GET_BOUNDS') {
      var target2 = document.querySelector('[data-id="' + e.data.id + '"]');
      if (target2) {
        var r2 = target2.getBoundingClientRect();
        var cs2 = window.getComputedStyle(target2);
        parent.postMessage({
          type: 'BOUNDS_RESULT',
          id: e.data.id,
          x: Math.round(r2.left),
          y: Math.round(r2.top),
          width: Math.round(r2.width),
          height: Math.round(r2.height),
          cssPosition: cs2.position,
          cssTop: target2.style.top || '',
          cssLeft: target2.style.left || '',
        }, '*');
      }
    }
  });
})();
</script>
`;

// ── Animation runtime (reads data-animate attributes) ────────────────────────

const ANIMATION_SCRIPT = `
<script>
(function () {
  function toTf(p) {
    var parts = [];
    if (p.x !== undefined) parts.push('translateX(' + (typeof p.x === 'number' ? p.x + 'px' : p.x) + ')');
    if (p.y !== undefined) parts.push('translateY(' + (typeof p.y === 'number' ? p.y + 'px' : p.y) + ')');
    if (p.scale !== undefined) parts.push('scale(' + p.scale + ')');
    if (p.rotate !== undefined) parts.push('rotate(' + p.rotate + 'deg)');
    return parts.join(' ');
  }
  function applyProps(el, p, tr) {
    el.style.transition = tr || 'none';
    if (p.opacity !== undefined) el.style.opacity = p.opacity;
    var tf = toTf(p);
    el.style.transform = tf || '';
  }
  function setup(el, cfg) {
    var dur   = (cfg.transition && cfg.transition.duration) || 0.4;
    var dly   = (cfg.transition && cfg.transition.delay)    || 0;
    var ease  = (cfg.transition && cfg.transition.ease)     || 'ease';
    var tr    = 'opacity '+dur+'s '+ease+' '+dly+'s,transform '+dur+'s '+ease+' '+dly+'s';
    var trFst = 'opacity 0.2s ease,transform 0.2s ease';
    var trTap = 'opacity 0.1s ease,transform 0.1s ease';
    if (cfg.initial) applyProps(el, cfg.initial, 'none');
    var inView = cfg.whileInView || null;
    var onLoad = cfg.animate || null;
    if (inView) {
      var once   = !cfg.viewport || cfg.viewport.once !== false;
      var amount = (cfg.viewport && cfg.viewport.amount) || 0.15;
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            requestAnimationFrame(function () { applyProps(el, inView, tr); });
            if (once) obs.unobserve(el);
          } else if (!once && cfg.initial) {
            applyProps(el, cfg.initial, tr);
          }
        });
      }, { threshold: amount });
      obs.observe(el);
    } else if (onLoad) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { applyProps(el, onLoad, tr); });
      });
    }
    if (cfg.whileHover) {
      var base = inView || onLoad;
      el.addEventListener('mouseenter', function () { applyProps(el, cfg.whileHover, trFst); });
      el.addEventListener('mouseleave', function () {
        if (base) applyProps(el, base, trFst);
        else { el.style.transition = trFst; el.style.opacity = ''; el.style.transform = ''; }
      });
    }
    if (cfg.whileTap) {
      var tapBase = cfg.whileHover || cfg.whileInView || cfg.animate;
      el.addEventListener('mousedown', function () { applyProps(el, cfg.whileTap, trTap); });
      document.addEventListener('mouseup', function onUp() {
        if (tapBase) applyProps(el, tapBase, trTap);
        else { el.style.opacity = ''; el.style.transform = ''; }
        document.removeEventListener('mouseup', onUp);
      });
    }
  }
  function init() {
    document.querySelectorAll('[data-animate]').forEach(function (el) {
      try { var c = JSON.parse(el.getAttribute('data-animate')); if (c) setup(el, c); } catch (e) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
`;

// ── Drag-and-drop reparenting script (runs inside the iframe) ────────────────

const DRAG_SCRIPT = `
<script>
(function () {
  var draggingId = null;

  function clearOver() {
    document.querySelectorAll('.__drag-over').forEach(function (el) {
      el.classList.remove('__drag-over');
    });
  }

  function isDescendant(ancestorId, el) {
    return !!el.closest('[data-id="' + ancestorId + '"]');
  }

  function init() {
    document.querySelectorAll('[data-id]').forEach(function (el) {
      el.setAttribute('draggable', 'true');

      el.addEventListener('dragstart', function (e) {
        draggingId = el.getAttribute('data-id');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggingId);
        setTimeout(function () { el.style.opacity = '0.35'; }, 0);
        e.stopPropagation();
      }, false);

      el.addEventListener('dragend', function () {
        el.style.opacity = '';
        draggingId = null;
        clearOver();
      }, false);

      el.addEventListener('dragover', function (e) {
        if (!draggingId) return;
        var thisId = el.getAttribute('data-id');
        if (thisId === draggingId) return;
        if (isDescendant(draggingId, el)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        clearOver();
        el.classList.add('__drag-over');
      }, false);

      el.addEventListener('dragleave', function (e) {
        if (!el.contains(e.relatedTarget)) {
          el.classList.remove('__drag-over');
        }
      }, false);

      el.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var targetId = el.getAttribute('data-id');
        clearOver();
        if (draggingId && targetId && draggingId !== targetId) {
          parent.postMessage({ type: 'REPARENT', dragId: draggingId, targetId: targetId }, '*');
        }
        draggingId = null;
      }, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
`;

// ── Base CSS injected into every iframe ───────────────────────────────────────

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  a { text-decoration: none; }
  img { max-width: 100%; display: block; }
  [data-id] { cursor: pointer; }
  [data-id]:hover:not(.__sel):not(.__drag-over) {
    outline: 1px dashed rgba(99, 68, 212, 0.55);
    outline-offset: 2px;
  }
  [data-id].__sel {
    outline: 2px solid #6344d4 !important;
    outline-offset: 2px;
    resize: both;
    overflow: auto;
    min-width: 20px;
    min-height: 20px;
  }
  [data-id].__drag-over {
    outline: 2px dashed #6344d4 !important;
    outline-offset: 4px;
    background-color: rgba(99, 68, 212, 0.06) !important;
  }
`;

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyCanvas() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-gray-300">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Monitor size={24} className="text-gray-200" />
      </div>
      <p className="text-[13px] font-semibold text-gray-400">No elements yet</p>
      <p className="text-[12px] text-gray-300 text-center max-w-[200px]">
        Generate with AI or add elements from the panel
      </p>
    </div>
  );
}

// ── Viewport switcher ─────────────────────────────────────────────────────────

function ViewportSwitcher({ value, onChange }: { value: Viewport; onChange: (v: Viewport) => void }) {
  const options: { v: Viewport; icon: React.ReactNode; label: string }[] = [
    { v: "desktop", icon: <Monitor size={13} />, label: "Desktop" },
    { v: "tablet",  icon: <Tablet size={13} />,  label: "Tablet" },
    { v: "mobile",  icon: <Smartphone size={13} />, label: "Mobile" },
  ];
  return (
    <div className="flex items-center gap-0.5 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
      {options.map(({ v, icon, label }) => (
        <button
          key={v}
          title={label}
          onClick={() => onChange(v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            value === v
              ? "bg-black text-white"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IframeCanvas({
  elements,
  classes = [],
  tokens,
  selectedId,
  onSelect,
  onUpdateContent,
  onResize,
  onReparent,
  onReady,
  viewport = "desktop",
  onViewportChange,
  showViewportSwitcher = true,
}: IframeCanvasProps) {
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSrcDoc, setDebouncedSrcDoc] = useState("");

  // Build the full srcdoc whenever the element tree, classes or tokens change.
  // Separate from selectedId so a selection doesn't reload the iframe.
  // Debounced by 100ms to avoid visible flicker on rapid slider changes.
  const latestSrcDoc = useMemo(() => {
    const userCSS  = generateCSS(elements, classes, tokens);
    const bodyHTML = generateHTML(elements);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${BASE_CSS}${userCSS}</style>
</head>
<body>
${bodyHTML}
${IFRAME_SCRIPT}
${DRAG_SCRIPT}
${ANIMATION_SCRIPT}
</body>
</html>`;
  }, [elements, classes, tokens]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSrcDoc(latestSrcDoc);
    }, 100);
    return () => clearTimeout(debounceRef.current);
  }, [latestSrcDoc]);

  // Send highlight to iframe
  const sendHighlight = useCallback((id: string | null | undefined) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "el-sel", id: id ?? null },
      "*"
    );
  }, []);

  // When debouncedSrcDoc changes, mark not loaded yet
  useEffect(() => {
    setLoaded(false);
  }, [debouncedSrcDoc]);

  // After iframe loads, restore current selection
  const handleLoad = useCallback(() => {
    setLoaded(true);
    sendHighlight(selectedId);
    if (iframeRef.current) onReady?.(iframeRef.current);
  }, [selectedId, sendHighlight, onReady]);

  // When selectedId changes (without srcdoc change), update highlight
  useEffect(() => {
    if (loaded) sendHighlight(selectedId);
  }, [selectedId, loaded, sendHighlight]);

  // Listen for messages from inside the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SELECT" && typeof e.data.id === "string") {
        onSelect?.(e.data.id);
      }
      if (e.data?.type === "CONTENT" && typeof e.data.id === "string" && typeof e.data.content === "string") {
        onUpdateContent?.(e.data.id, e.data.content);
      }
      if (e.data?.type === "RESIZE" && typeof e.data.id === "string") {
        onResize?.(e.data.id, e.data.width, e.data.height);
      }
      if (e.data?.type === "REPARENT" && typeof e.data.dragId === "string" && typeof e.data.targetId === "string") {
        onReparent?.(e.data.dragId, e.data.targetId);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelect, onUpdateContent, onResize, onReparent]);

  // Width corresponding to the selected viewport
  const iframeWidth =
    viewport === "mobile"  ? "375px" :
    viewport === "tablet"  ? "768px" :
    "100%";

  const isEmpty = elements.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {showViewportSwitcher && onViewportChange && (
        <div className="flex items-center justify-center py-2 flex-shrink-0 border-b border-gray-50">
          <ViewportSwitcher value={viewport} onChange={onViewportChange} />
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 flex justify-center overflow-auto bg-[#F3F4F6]">
        {isEmpty ? (
          <EmptyCanvas />
        ) : (
          <div
            className="relative transition-all duration-300"
            style={{
              width: iframeWidth,
              minHeight: "100%",
              background: "#fff",
              boxShadow: viewport !== "desktop"
                ? "0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.1)"
                : undefined,
            }}
          >
            {/* Loading overlay */}
            {!loaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <div className="w-5 h-5 border-2 border-[#6344d4] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={debouncedSrcDoc}
              onLoad={handleLoad}
              sandbox="allow-scripts"
              title="Page canvas"
              className="w-full border-0"
              style={{ minHeight: "600px", height: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
