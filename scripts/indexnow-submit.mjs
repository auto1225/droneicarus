#!/usr/bin/env node
// IndexNow submission — pings Bing/Yandex with fresh/updated URLs
// Pulls URL list from public/sitemap.xml and posts in a single batch.

import fs from 'node:fs';
import path from 'node:path';

const HOST = 'droneicarus.com';
const KEY = process.env.INDEXNOW_KEY || 'ad90c5c045ee5890e3b2baa19e285989';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP = path.resolve('public/sitemap.xml');

function extractUrls(xml) {
  // very tolerant parse: pull <loc>...</loc> values
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

async function submit(endpoint, urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  return { status: r.status, statusText: r.statusText };
}

async function main() {
  if (!fs.existsSync(SITEMAP)) {
    console.error('sitemap.xml not found at', SITEMAP);
    process.exit(1);
  }
  const xml = fs.readFileSync(SITEMAP, 'utf8');
  const all = extractUrls(xml);
  // IndexNow spec: max 10,000 per request. Split into chunks of 10k to be safe.
  const CHUNK = 10000;
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];
  console.log(`Submitting ${all.length} URLs to IndexNow...`);
  for (let i = 0; i < all.length; i += CHUNK) {
    const chunk = all.slice(i, i + CHUNK);
    for (const ep of endpoints) {
      try {
        const res = await submit(ep, chunk);
        console.log(`[${ep}] chunk ${i}-${i + chunk.length}: ${res.status} ${res.statusText}`);
      } catch (e) {
        console.warn(`[${ep}] chunk ${i}: ${e.message}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
