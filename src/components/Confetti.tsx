"use client";

import React, { useEffect } from 'react';

interface Props {
  active?: boolean;
  duration?: number; // ms
  particleCount?: number;
  colors?: string[];
}

export const DEFAULT_CONFETTI_DURATION = 700;

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Very small confetti implementation using canvas. Lightweight and no deps.
export default function Confetti({ active = false, duration = DEFAULT_CONFETTI_DURATION, particleCount = 40, colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'] }: Props) {
  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const c = ctx;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const particles: Array<any> = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * -h,
        velX: (Math.random() - 0.5) * 6,
        velY: 2 + Math.random() * 6,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    let raf = 0;
    const start = performance.now();

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function draw() {
      c.clearRect(0, 0, w, h);
      for (let p of particles) {
        p.x += p.velX;
        p.y += p.velY;
        p.rot += p.rotSpeed;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        c.restore();
      }
    }

    function loop() {
      draw();
      const now = performance.now();
      if (now - start < duration) {
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        // fade out quickly
        try { document.body.removeChild(canvas); } catch {}
      }
    }

    window.addEventListener('resize', resize);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      try { document.body.removeChild(canvas); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, duration, particleCount, colors]);

  return null;
}
