"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const API          = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BG           = 0x0f0f0f;
const SEGMENTS     = 24;
const SEG_W        = 18;
const SEG_H        = 11;
const SEG_DEPTH    = 6;
const LERP_FACTOR  = 0.07;
const SCROLL_SPEED = 0.04;

function addLine(
  group: THREE.Group,
  mat: THREE.LineBasicMaterial,
  a: [number, number, number],
  b: [number, number, number],
) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...a),
    new THREE.Vector3(...b),
  ]);
  group.add(new THREE.Line(geo, mat));
}

function buildFrame(): THREE.Group {
  const group   = new THREE.Group();
  const frameMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
  const gridMat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.13 });

  const hw = SEG_W / 2;
  const hh = SEG_H / 2;
  const d  = SEG_DEPTH;

  // ── Outer frame (12 edges) ──────────────────────────────────────────
  addLine(group, frameMat, [-hw,  hh,  0], [ hw,  hh,  0]);
  addLine(group, frameMat, [ hw,  hh,  0], [ hw, -hh,  0]);
  addLine(group, frameMat, [ hw, -hh,  0], [-hw, -hh,  0]);
  addLine(group, frameMat, [-hw, -hh,  0], [-hw,  hh,  0]);
  addLine(group, frameMat, [-hw,  hh, -d], [ hw,  hh, -d]);
  addLine(group, frameMat, [ hw,  hh, -d], [ hw, -hh, -d]);
  addLine(group, frameMat, [ hw, -hh, -d], [-hw, -hh, -d]);
  addLine(group, frameMat, [-hw, -hh, -d], [-hw,  hh, -d]);
  addLine(group, frameMat, [-hw,  hh,  0], [-hw,  hh, -d]);
  addLine(group, frameMat, [ hw,  hh,  0], [ hw,  hh, -d]);
  addLine(group, frameMat, [ hw, -hh,  0], [ hw, -hh, -d]);
  addLine(group, frameMat, [-hw, -hh,  0], [-hw, -hh, -d]);

  // ── Floor grid (y = -hh) ────────────────────────────────────────────
  // 3 longitudinal lines dividing floor into 4 columns
  for (let i = 1; i <= 3; i++) {
    const x = -hw + (SEG_W / 4) * i;
    addLine(group, gridMat, [x, -hh,  0], [x, -hh, -d]);
  }
  // 1 lateral line at segment midpoint
  addLine(group, gridMat, [-hw, -hh, -d / 2], [hw, -hh, -d / 2]);

  // ── Ceiling grid (y = +hh) — mirrors floor ──────────────────────────
  for (let i = 1; i <= 3; i++) {
    const x = -hw + (SEG_W / 4) * i;
    addLine(group, gridMat, [x, hh,  0], [x, hh, -d]);
  }
  addLine(group, gridMat, [-hw, hh, -d / 2], [hw, hh, -d / 2]);

  // ── Left wall grid (x = -hw) ────────────────────────────────────────
  // horizontal midline on left wall
  addLine(group, gridMat, [-hw,  0,  0], [-hw,  0, -d]);
  // vertical midline on left wall
  addLine(group, gridMat, [-hw, -hh, -d / 2], [-hw, hh, -d / 2]);

  // ── Right wall grid (x = +hw) ───────────────────────────────────────
  addLine(group, gridMat, [ hw,  0,  0], [ hw,  0, -d]);
  addLine(group, gridMat, [ hw, -hh, -d / 2], [ hw, hh, -d / 2]);

  return group;
}

export default function TunnelScroll() {
  const mountRef  = useRef<HTMLDivElement>(null);
  const heroRef   = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    // ── Renderer ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(BG);
    el.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.Fog(BG, 8, 65);

    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    camera.position.set(0, 0, 8);

    // ── Tunnel frames ──────────────────────────────────────────────────
    const totalDepth = SEGMENTS * SEG_DEPTH;
    const segments: THREE.Group[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const seg = buildFrame();
      seg.position.z = -i * SEG_DEPTH;
      scene.add(seg);
      segments.push(seg);
    }

    // ── Wall-mounted image panels ──────────────────────────────────────
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    function placeWallImages(urls: string[]) {
      if (!urls.length) return;

      const panelW = 4.5;
      const panelH = 3.0;
      const hw     = SEG_W / 2;
      // Spread images evenly across the tunnel depth
      const zStep  = totalDepth / (urls.length + 1);

      urls.forEach((url, i) => {
        const isLeft = i % 2 === 0;
        const z      = -((i + 1) * zStep);

        const mat  = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), mat);

        // Flush against the wall, centered vertically
        mesh.position.set(isLeft ? -(hw - 0.05) : (hw - 0.05), 0, z);
        // Rotate 90° so the face looks inward (toward the centre of the corridor)
        mesh.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        scene.add(mesh);

        loader.load(
          url,
          (tex) => {
            mat.map = tex;
            mat.needsUpdate = true;
            gsap.to(mat, { opacity: 0.9, duration: 1, ease: "power2.out" });
          },
          undefined,
          () => console.warn("[TunnelScroll] failed to load:", url),
        );
      });
    }

    async function fetchImages() {
      try {
        const [projRes, blogRes] = await Promise.all([
          fetch(`${API}/api/projects`),
          fetch(`${API}/api/blogs`),
        ]);
        const projects: any[] = projRes.ok ? await projRes.json() : [];
        const blogs: any[]    = blogRes.ok ? await blogRes.json() : [];
        const urls = [
          ...projects.filter((p: any) => p.image).map((p: any) => `${API}/${p.image}`),
          ...blogs.filter((b: any) => b.thumbnail).map((b: any) => `${API}/${b.thumbnail}`),
        ];
        placeWallImages(urls);
      } catch (e) {
        console.warn("[TunnelScroll] fetch error:", e);
      }
    }

    fetchImages();

    // ── Render loop ────────────────────────────────────────────────────
    let currentZ = 8;
    let rafId: number;

    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const targetZ = 8 - scrollRef.current * SCROLL_SPEED;
      currentZ += (targetZ - currentZ) * LERP_FACTOR;
      camera.position.z = currentZ;

      segments.forEach((seg) => {
        while (seg.position.z > currentZ + SEG_DEPTH) {
          seg.position.z -= totalDepth;
        }
      });

      renderer.render(scene, camera);
    };
    tick();

    // ── Resize ─────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Hero entrance ──────────────────────────────────────────────────
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.3, ease: "power3.out", delay: 0.3 },
      );
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full" style={{ height: "400vh" }}>
      <div ref={mountRef} className="fixed inset-0 w-full h-full z-0" />

      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div
          ref={heroRef}
          className="text-center px-6 pointer-events-auto"
          style={{ opacity: 0 }}
        >
          <h1
            className="heading leading-[0.85] tracking-tighter text-white mb-6"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
          >
            We build the web.
          </h1>
          <p className="text-lg max-w-md mx-auto mb-8" style={{ color: "#6b6b6b" }}>
            Digital experiences that move people — and your business forward.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[13px] font-bold uppercase tracking-widest text-white transition-all hover:scale-105 hover:opacity-80"
            style={{ background: "#E85D35" }}
          >
            Start a project
          </a>
        </div>
      </div>
    </div>
  );
}
