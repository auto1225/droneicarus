// pages/lab-preview.jsx — Real first-page thumbnail for lab items
// Uses image.thum.io free thumbnail service (CDN-cached, server-side rendered).
//   - PDF: image.thum.io/get/pdfSource/{url}   (arxiv, GP patents, generic PDFs)
//   - GitHub: opengraph.githubassets.com (real OG card)
//   - YouTube: i.ytimg.com hqdefault
//   - HTML pages: image.thum.io/get/{url}     (any web page screenshot)
//   - Fallback: existing cover_image_url SVG when external services 404/timeout
// IntersectionObserver lazy load so off-screen cards don't trigger thumbnail builds.

import React, { useEffect, useRef, useState } from 'react';

function pickSource(item) {
  // 1) GitHub project — opengraph card
  if (item.external_url && /github\.com\/([^/]+\/[^/?#]+)/.test(item.external_url)) {
    const m = item.external_url.match(/github\.com\/([^/]+\/[^/?#]+)/);
    return `https://opengraph.githubassets.com/1/${m[1]}`;
  }
  // 2) YouTube doc
  if (item.document_type === 'youtube' && item.document_url) {
    const m = item.document_url.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|embed\/([\w-]{11})/);
    const id = m && (m[1] || m[2] || m[3]);
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  // 3) PDF document — image.thum.io renders first page server-side, cached 24h
  if (item.document_type === 'pdf' && item.document_url) {
    return `https://image.thum.io/get/width/480/pdfSource/${item.document_url}`;
  }
  // 4) Any external HTML page — image.thum.io screenshot
  if (item.external_url) {
    return `https://image.thum.io/get/width/480/${item.external_url}`;
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
          const url = pickSource(item);
          if (!url) { setErrored(true); return; }
          // Pre-load the image — only swap in once it resolves to avoid flicker
          const img = new Image();
          img.referrerPolicy = 'no-referrer';
          img.onload = () => setSrc(url);
          img.onerror = () => setErrored(true);
          img.src = url;
        }
      }
    }, { rootMargin: '300px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [item.id]);

  const showSrc = src || (errored ? fallback : fallback);
  return (
    <div ref={ref} style={{
      aspectRatio: '16/9', width: '100%',
      background: 'var(--forest-900)',
      backgroundImage: showSrc ? `url('${String(showSrc).replace(/'/g, "%27")}')` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      borderBottom: '1px solid var(--line)',
      transition: 'opacity 0.3s',
    }}/>
  );
}
