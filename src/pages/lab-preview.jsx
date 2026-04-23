// pages/lab-preview.jsx — Real first-page thumbnail for lab items
// Strategy:
//   - PDF (research papers, patents): client-side render first page via PDF.js → cache in sessionStorage
//   - GitHub repo: opengraph.githubassets.com (real repo OG card)
//   - Other web docs: microlink.io screenshot service (free 50 req/day cached)
//   - Fallback: existing cover_image_url SVG
// Uses IntersectionObserver lazy loading so off-screen cards don't trigger work.

import React, { useEffect, useRef, useState } from 'react';

// PDF.js loaded once on demand from CDN (ESM build, no server bundle hit)
let _pdfjsPromise = null;
async function loadPdfJs() {
  if (_pdfjsPromise) return _pdfjsPromise;
  _pdfjsPromise = (async () => {
    const m = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs');
    m.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';
    return m;
  })();
  return _pdfjsPromise;
}

// Cache per page-load — keyed by document URL
const _memCache = new Map();
function cacheGet(key) {
  if (_memCache.has(key)) return _memCache.get(key);
  try {
    const v = sessionStorage.getItem('labthumb:' + key);
    if (v) { _memCache.set(key, v); return v; }
  } catch {}
  return null;
}
function cacheSet(key, value) {
  _memCache.set(key, value);
  try { sessionStorage.setItem('labthumb:' + key, value); } catch {}
}

// Render first page of a PDF to a 480-wide jpeg data URL
async function renderPdfFirstPage(url) {
  const cached = cacheGet(url);
  if (cached) return cached;
  try {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({ url, withCredentials: false });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const targetW = 480;
    const scale = targetW / viewport.width;
    const v = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(v.width);
    canvas.height = Math.ceil(v.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: v }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
    cacheSet(url, dataUrl);
    return dataUrl;
  } catch (e) {
    // CORS or load failure — return null so caller falls back
    return null;
  }
}

// Pick the best preview source for a given lab item
function pickSource(item) {
  // 1) GitHub project — opengraph card
  if (item.external_url && /github\.com\/([^/]+\/[^/?#]+)/.test(item.external_url)) {
    const m = item.external_url.match(/github\.com\/([^/]+\/[^/?#]+)/);
    return { kind: 'image', src: `https://opengraph.githubassets.com/1/${m[1]}` };
  }
  // 2) PDF document — render first page client-side
  if (item.document_type === 'pdf' && item.document_url) {
    return { kind: 'pdf', src: item.document_url };
  }
  // 3) YouTube embed — use YouTube thumb if hint present
  if (item.document_type === 'youtube' && item.document_url) {
    const m = item.document_url.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|embed\/([\w-]{11})/);
    const id = m && (m[1] || m[2] || m[3]);
    if (id) return { kind: 'image', src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }
  // 4) HTML page — microlink screenshot service (free tier)
  if (item.external_url) {
    const u = encodeURIComponent(item.external_url);
    return { kind: 'image', src: `https://api.microlink.io/?url=${u}&screenshot=true&meta=false&embed=screenshot.url` };
  }
  return null;
}

export function LabPagePreview({ item, fallback }) {
  const [src, setSrc] = useState(null);
  const [errored, setErrored] = useState(false);
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting && !triggered.current) {
          triggered.current = true;
          io.disconnect();
          const pick = pickSource(item);
          if (!pick) { setErrored(true); return; }
          if (pick.kind === 'image') {
            setSrc(pick.src);
          } else if (pick.kind === 'pdf') {
            renderPdfFirstPage(pick.src).then(d => {
              if (d) setSrc(d); else setErrored(true);
            });
          }
        }
      }
    }, { rootMargin: '200px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [item.id]);

  // Show real preview if loaded; else fallback (cover_image_url SVG); else dim placeholder
  const showSrc = src || (errored && fallback) || fallback;
  return (
    <div ref={ref} style={{
      aspectRatio: '16/9', width: '100%',
      background: showSrc
        ? `var(--forest-900) center / cover no-repeat`
        : 'var(--forest-900)',
      backgroundImage: showSrc ? `url('${String(showSrc).replace(/'/g, "%27")}')` : undefined,
      borderBottom: '1px solid var(--line)',
      transition: 'opacity 0.3s',
      opacity: showSrc ? 1 : 0.5,
    }} onError={() => setErrored(true)} />
  );
}
