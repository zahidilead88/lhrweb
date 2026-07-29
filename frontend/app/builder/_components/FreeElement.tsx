"use client";

import React from "react";
import type { ElementNode } from "@/types/builder";

const VOID_TAGS = new Set(["img","input","br","hr","meta","link","area","base","embed","source","track","wbr"]);

interface Props {
  element: ElementNode;
  depth?: number;
}

export default function FreeElement({ element, depth = 0 }: Props) {
  const { tag, id, className, content, attrs, children, styles } = element;

  const style: React.CSSProperties = {
    ...(styles.desktop as React.CSSProperties),
    ...(depth === 0 ? { position: "relative", width: "100%", height: "100%" } : {}),
  };

  // Pen tool paths — stored as inline SVG string in data-svg attr
  if (attrs?.["data-svg"]) {
    return (
      <div
        data-id={id}
        className={className ?? undefined}
        style={style}
        dangerouslySetInnerHTML={{ __html: attrs["data-svg"] as string }}
      />
    );
  }

  const commonProps: Record<string, unknown> = {
    "data-id": id,
    className: className ?? undefined,
    style,
    ...attrs,
  };

  if (VOID_TAGS.has(tag)) {
    return React.createElement(tag, commonProps);
  }

  const innerContent =
    children.length > 0
      ? children.map((child) => <FreeElement key={child.id} element={child} depth={depth + 1} />)
      : content ?? null;

  return React.createElement(tag, commonProps, innerContent);
}
