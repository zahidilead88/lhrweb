"use client";

import dynamic from "next/dynamic";

const TunnelScroll = dynamic(() => import("./TunnelScroll"), { ssr: false });

export default function TunnelScrollLoader() {
  return <TunnelScroll />;
}
