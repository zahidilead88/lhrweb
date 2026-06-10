"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&q=80",
  "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80",
  "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=900&q=80",
];

const LOGO_COLORS = ["#7c3aed", "#0d9488", "#3b82f6", "#f59e0b"];

interface Project { _id: string; title: string; image?: string }

export default function VoilaBanner() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive]     = useState(0);

  useEffect(() => {
    fetch(`${API}/api/projects`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d.length > 0) setProjects(d); })
      .catch(() => {});
  }, []);

  const images = projects.length > 0
    ? projects.slice(0, 5).map((p) =>
        p.image ? (p.image.startsWith("http") ? p.image : `${API}/${p.image}`) : FALLBACK_IMGS[0]
      )
    : FALLBACK_IMGS;

  const logoItems = projects.length > 0 ? projects.slice(0, 4) : [];

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images.length]);

  const OFFSETS = [
    { x: 0,  y: 0,   rot: 0,   z: 30, scale: 1    },
    { x: 26, y: -12, rot: 3,   z: 20, scale: 0.94 },
    { x: 50, y: -22, rot: 5.5, z: 10, scale: 0.88 },
  ];

  return (
    <section
      className="w-full bg-white overflow-hidden"
      style={{
        height:         "100dvh",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}
    >
      {/* ── centred content block ── */}
      <div
        style={{
          width:   "100%",
          maxWidth: 1200,
          padding: "0 clamp(24px, 5vw, 64px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(24px, 4vh, 48px)",
        }}
      >
        {/* ── Headline ── */}
        <h1
          className="font-black text-black tracking-tight"
          style={{
            fontSize:   "clamp(48px, 7.5vw, 112px)",
            lineHeight: 0.92,
          }}
        >
          Bringing<br />
          Ideas to Life.
        </h1>

        {/* ── Bottom row ── */}
        <div
          style={{
            display:        "flex",
            alignItems:     "flex-end",
            justifyContent: "space-between",
            gap:            32,
          }}
        >
          {/* Left — logo circles + link */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(logoItems.length > 0 ? logoItems : LOGO_COLORS.map((c, i) => ({ _id: String(i), title: "", image: undefined, _color: c }))).map((p: any, i) => {
                const src = p.image
                  ? (p.image.startsWith("http") ? p.image : `${API}/${p.image}`)
                  : null;
                return (
                  <div
                    key={p._id}
                    style={{
                      width: 44, height: 44,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      background: LOGO_COLORS[i % LOGO_COLORS.length],
                      flexShrink: 0,
                    }}
                  >
                    {src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              href="/projects"
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           6,
                fontSize:      13,
                fontWeight:    600,
                color:         "#000",
                borderBottom:  "1px solid #000",
                paddingBottom: 2,
                textDecoration:"none",
                whiteSpace:    "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.5")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Latest work
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Right — stacked project cards */}
          <div
            style={{
              position:  "relative",
              flexShrink: 0,
              width:  "clamp(280px, 44vw, 620px)",
              height: "clamp(190px, 30vw, 420px)",
            }}
          >
            {images.slice(0, 3).map((src, i) => {
              const order   = (i - active + images.length) % images.length;
              const offset  = OFFSETS[Math.min(order, OFFSETS.length - 1)];
              const isFront = order === 0;

              return (
                <div
                  key={src + i}
                  style={{
                    position:     "absolute",
                    inset:        0,
                    borderRadius: 20,
                    overflow:     "hidden",
                    boxShadow:    "0 20px 60px rgba(0,0,0,0.18)",
                    transform:    `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rot}deg) scale(${offset.scale})`,
                    zIndex:       offset.z,
                    transition:   "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                    cursor:       isFront ? "default" : "pointer",
                  }}
                  onClick={() => !isFront && setActive(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={projects[i]?.title || "Project"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                  {isFront && projects[i] && (
                    <div style={{ position: "absolute", top: 16, left: 16 }}>
                      <span style={{
                        display:       "inline-flex",
                        alignItems:    "center",
                        gap:           6,
                        background:    "#fff",
                        color:         "#000",
                        fontSize:      11,
                        fontWeight:    600,
                        padding:       "6px 14px",
                        borderRadius:  999,
                        boxShadow:     "0 4px 16px rgba(0,0,0,0.12)",
                      }}>
                        {projects[i].title}
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
