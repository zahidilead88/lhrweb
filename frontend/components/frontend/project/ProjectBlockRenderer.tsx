"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

interface Block {
  _id?: string;
  type: string;
  heading: string;
  subheading: string;
  text: string;
  images: string[];
  videoUrl: string;
  meta: Record<string, string>;
  order: number;
}

interface Project {
  _id: string;
  title: string;
  image: string;
  shortDescription: string;
  description?: string;
  tags?: string[];
  videoUrl?: string;
  buttonText?: string;
  blocks?: Block[];
}

const IMG = (url: string) => `http://localhost:8000/${url}`;

// ── Block components ───────────────────────────────────────────────────────

function HeroBlock({ block, project }: { block: Block; project: Project }) {
  return (
    <section
      style={{
        background: "#0d0d0d",
        color: "white",
        padding: "80px 40px 0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "auto", paddingBottom: "40px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {(project.tags || []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "4px 12px",
                borderRadius: "9999px",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textAlign: "right", whiteSpace: "nowrap" }}>
          {block.meta?.year && <span>{block.meta.year}</span>}
          {block.meta?.year && block.meta?.client && <span style={{ margin: "0 6px" }}>•</span>}
          {block.meta?.client && <span>{block.meta.client}</span>}
        </div>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(48px, 10vw, 120px)",
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          margin: "0 0 48px",
        }}
      >
        {project.title}
      </h1>

      {/* Hero image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
        {project.videoUrl ? (
          <video
            src={IMG(project.videoUrl)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <Image src={IMG(project.image)} alt={project.title} fill style={{ objectFit: "cover" }} priority />
        )}
      </div>
    </section>
  );
}

function IntroBlock({ block }: { block: Block }) {
  if (!block.heading && !block.text) return null;
  return (
    <section
      style={{
        background: "#0d0d0d",
        color: "white",
        padding: "80px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "80px",
        alignItems: "start",
      }}
    >
      {/* Left */}
      <div>
        {block.heading && (
          <p style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, lineHeight: 1.2, marginBottom: "24px" }}>
            {block.heading}
          </p>
        )}
        {/* Avatars */}
        {block.images?.length > 0 && (
          <div style={{ display: "flex", marginBottom: "24px" }}>
            {block.images.slice(0, 5).map((url, i) => (
              <div
                key={i}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  border: "2px solid #0d0d0d",
                  marginLeft: i > 0 ? "-10px" : 0,
                  position: "relative",
                }}
              >
                <Image src={IMG(url)} alt="" fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
        {block.subheading && (
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{block.subheading}</p>
        )}
      </div>

      {/* Right */}
      <div>
        {block.text && (
          <p style={{ fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.75)", marginBottom: "40px", whiteSpace: "pre-line" }}>
            {block.text}
          </p>
        )}
        {/* Meta grid */}
        {(block.meta?.client || block.meta?.industry || block.meta?.duration) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "32px" }}>
            {block.meta.client && (
              <div>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Client</p>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>{block.meta.client}</p>
              </div>
            )}
            {block.meta.industry && (
              <div>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Industry</p>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>{block.meta.industry}</p>
              </div>
            )}
            {block.meta.duration && (
              <div>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Duration</p>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>{block.meta.duration}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ImageFullBlock({ block }: { block: Block }) {
  if (!block.images?.length) return null;
  return (
    <section style={{ background: "#0d0d0d", padding: "40px" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden" }}>
        <Image src={IMG(block.images[0])} alt={block.heading || ""} fill style={{ objectFit: "cover" }} />
      </div>
    </section>
  );
}

function Image2ColBlock({ block }: { block: Block }) {
  if (!block.images?.length) return null;
  return (
    <section style={{ background: "#0d0d0d", padding: "40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {block.images.slice(0, 2).map((url, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "16px", overflow: "hidden" }}>
            <Image src={IMG(url)} alt="" fill style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function VideoBlock({ block }: { block: Block }) {
  if (!block.videoUrl) return null;
  const src = block.videoUrl.startsWith("http") ? block.videoUrl : IMG(block.videoUrl);
  return (
    <section style={{ background: "#0d0d0d", padding: "40px" }}>
      {block.heading && (
        <h2 style={{ color: "white", fontSize: "clamp(24px, 4vw, 48px)", fontWeight: 700, marginBottom: "32px" }}>
          {block.heading}
        </h2>
      )}
      <div style={{ borderRadius: "16px", overflow: "hidden" }}>
        <video
          src={src}
          controls
          style={{ width: "100%", display: "block" }}
        />
      </div>
    </section>
  );
}

function PullQuoteBlock({ block }: { block: Block }) {
  if (!block.heading && !block.text) return null;
  return (
    <section
      style={{
        background: "#0d0d0d",
        color: "white",
        padding: "80px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "80px",
        alignItems: "center",
      }}
    >
      <div>
        {block.subheading && (
          <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
            {block.subheading}
          </p>
        )}
        {block.heading && (
          <h2 style={{ fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {block.heading}
          </h2>
        )}
      </div>
      <div>
        {block.text && (
          <p style={{ fontSize: "17px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-line" }}>
            {block.text}
          </p>
        )}
      </div>
    </section>
  );
}

function CarouselBlock({ block }: { block: Block }) {
  const [idx, setIdx] = useState(0);
  if (!block.images?.length) return null;
  const prev = () => setIdx((i) => (i === 0 ? block.images.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === block.images.length - 1 ? 0 : i + 1));

  return (
    <section style={{ background: "#0d0d0d", padding: "60px 40px" }}>
      {block.heading && (
        <h2 style={{ color: "white", fontSize: "clamp(24px, 4vw, 48px)", fontWeight: 700, marginBottom: "32px" }}>
          {block.heading}
        </h2>
      )}
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden" }}>
          <Image src={IMG(block.images[idx])} alt="" fill style={{ objectFit: "cover" }} />
        </div>
        {block.images.length > 1 && (
          <>
            <button
              onClick={prev}
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                width: "44px",
                height: "44px",
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ‹
            </button>
            <button
              onClick={next}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                width: "44px",
                height: "44px",
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ›
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
              {block.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    background: i === idx ? "white" : "rgba(255,255,255,0.3)",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function MediaGridBlock({ block }: { block: Block }) {
  if (!block.images?.length) return null;
  return (
    <section style={{ background: "#0d0d0d", padding: "60px 40px" }}>
      {block.heading && (
        <h2 style={{ color: "white", fontSize: "clamp(24px, 4vw, 48px)", fontWeight: 700, marginBottom: "32px" }}>
          {block.heading}
        </h2>
      )}
      <div style={{ columns: 3, gap: "12px" }}>
        {block.images.map((url, i) => (
          <div key={i} style={{ breakInside: "avoid", marginBottom: "12px", borderRadius: "10px", overflow: "hidden" }}>
            <img src={IMG(url)} alt="" style={{ width: "100%", display: "block" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TextPatternBlock({ block }: { block: Block }) {
  const word = block.meta?.patternText || block.heading || "PATTERN";
  const rows = Array.from({ length: 6 }, (_, i) => i);

  return (
    <section style={{ background: "#0d0d0d", color: "white", padding: "60px 40px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center" }}>
        <div style={{ overflow: "hidden" }}>
          {rows.map((i) => (
            <p
              key={i}
              style={{
                fontSize: "clamp(40px, 7vw, 96px)",
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                color: i % 2 === 0 ? "white" : "transparent",
                WebkitTextStroke: i % 2 === 0 ? "none" : "1px rgba(255,255,255,0.3)",
                margin: "0 0 4px",
                whiteSpace: "nowrap",
              }}
            >
              {word}
            </p>
          ))}
        </div>
        {block.images?.length > 0 && (
          <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: "16px", overflow: "hidden" }}>
            <Image src={IMG(block.images[0])} alt="" fill style={{ objectFit: "cover" }} />
          </div>
        )}
      </div>
    </section>
  );
}

// ── Related Projects ────────────────────────────────────────────────────────

function RelatedProjects({ currentId }: { currentId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        const others = data.filter((p) => p._id !== currentId).slice(0, 3);
        setProjects(others);
      })
      .catch(() => {});
  }, [currentId]);

  if (!projects.length) return null;

  return (
    <section style={{ background: "#0d0d0d", color: "white", padding: "80px 40px" }}>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "60px" }}>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, marginBottom: "40px" }}>
          More Work
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {projects.map((p) => (
            <Link
              key={p._id}
              href={`/projects/${p._id}`}
              style={{ textDecoration: "none", color: "white" }}
            >
              <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "12px", aspectRatio: "4/3", position: "relative" }}>
                <Image src={IMG(p.image)} alt={p.title} fill style={{ objectFit: "cover", transition: "transform 0.4s ease" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {(p.tags || []).slice(0, 2).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{p.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main renderer ────────────────────────────────────────────────────────────

export default function ProjectBlockRenderer({ project }: { project: Project }) {
  const blocks = (project.blocks || []).slice().sort((a, b) => a.order - b.order);

  // If no blocks, fall back to classic layout
  if (!blocks.length) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", color: "white" }}>
        {/* Back */}
        <div style={{ padding: "32px 40px 0" }}>
          <Link href="/projects" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            ← Back to Projects
          </Link>
        </div>

        {/* Hero */}
        <section style={{ padding: "60px 40px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {(project.tags || []).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 100px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: "24px" }}>
            {project.title}
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", maxWidth: "600px" }}>
            {project.shortDescription}
          </p>
        </section>

        {/* Image */}
        <div style={{ padding: "0 40px 60px" }}>
          <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden" }}>
            <Image src={IMG(project.image)} alt={project.title} fill style={{ objectFit: "cover" }} priority />
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <section style={{ padding: "0 40px 80px", maxWidth: "700px" }}>
            <p style={{ fontSize: "17px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-line" }}>
              {project.description}
            </p>
          </section>
        )}

        <RelatedProjects currentId={project._id} />
      </div>
    );
  }

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      {/* Back link */}
      <div style={{ position: "fixed", top: "24px", left: "40px", zIndex: 100 }}>
        <Link
          href="/projects"
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            padding: "8px 16px",
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          ← Projects
        </Link>
      </div>

      {blocks.map((block, i) => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={i} block={block} project={project} />;
          case "intro":
            return <IntroBlock key={i} block={block} />;
          case "image-full":
            return <ImageFullBlock key={i} block={block} />;
          case "image-2col":
            return <Image2ColBlock key={i} block={block} />;
          case "video":
            return <VideoBlock key={i} block={block} />;
          case "pull-quote":
            return <PullQuoteBlock key={i} block={block} />;
          case "carousel":
            return <CarouselBlock key={i} block={block} />;
          case "media-grid":
            return <MediaGridBlock key={i} block={block} />;
          case "text-pattern":
            return <TextPatternBlock key={i} block={block} />;
          default:
            return null;
        }
      })}

      <RelatedProjects currentId={project._id} />
    </div>
  );
}
