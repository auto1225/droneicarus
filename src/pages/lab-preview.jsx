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
  // 0) Honor the curated cover_image_url FIRST when it's a real http(s) image
  //    (not a data:image SVG placeholder). This lets the seed/discovery pipeline
  //    pin a known-good thumbnail (Printables og:image, ytimg, thum.io of arxiv, etc.)
  //    instead of having LabPagePreview re-derive (and sometimes fail) every load.
  if (item.cover_image_url && /^https?:\/\//.test(item.cover_image_url)) {
    return item.cover_image_url;
  }
  // 1) YouTube — derive from external_url too (not just document_url)
  if (item.external_url) {
    const ytm = item.external_url.match(/(?:[?&]v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (ytm) return `https://i.ytimg.com/vi/${ytm[1]}/hqdefault.jpg`;
  }
  // 2) GitHub project — opengraph card
  if (item.external_url && /github\.com\/([^/]+\/[^/?#]+)/.test(item.external_url)) {
    const m = item.external_url.match(/github\.com\/([^/]+\/[^/?#]+)/);
    return `https://opengraph.githubassets.com/1/${m[1]}`;
  }
  // 3) YouTube doc (separate document_url path)
  if (item.document_type === 'youtube' && item.document_url) {
    const m = item.document_url.match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})|embed\/([\w-]{11})/);
    const id = m && (m[1] || m[2] || m[3]);
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  // 4) PDF document — image.thum.io renders first page server-side, cached 24h
  if (item.document_type === 'pdf' && item.document_url) {
    return `https://image.thum.io/get/width/480/pdfSource/${item.document_url}`;
  }
  // 5) Any external HTML page — return list of candidates, tried in order
  if (item.external_url) {
    const u = encodeURIComponent(item.external_url);
    return [
      // Microlink extracts og:image (works on DJI / GoPro / most product pages)
      `https://api.microlink.io/?url=${u}&meta=false&embed=image.url`,
      // image.thum.io screenshot fallback
      `https://image.thum.io/get/width/480/${item.external_url}`,
      // last resort: domain favicon (better than nothing)
      `https://www.google.com/s2/favicons?domain=${u}&sz=128`,
    ];
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
          const picked = pickSource(item);
          if (!picked) { setErrored(true); return; }
          const candidates = Array.isArray(picked) ? picked : [picked];
          let i = 0;
          const tryNext = () => {
            if (i >= candidates.length) { setErrored(true); return; }
            const url = candidates[i++];
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            // Treat tiny / non-image responses as failure: check naturalWidth in onload
            img.onload = () => {
              if (img.naturalWidth >= 64) setSrc(url);
              else tryNext();
            };
            img.onerror = tryNext;
            img.src = url;
          };
          tryNext();
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
