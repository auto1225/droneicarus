# 01 · Product Overview

## What is Drone Icarus?

A map-first marketplace where **buyers find aerial footage by location**, not by keyword. Drop into the map, click a landmark, and see every drone clip ever shot there. Sellers (pilots + studios) upload with GPS metadata; buyers license for personal, commercial, or exclusive use.

### Core value prop

> **"I need a 4K shot of the Pyramids at golden hour."**
> On other stock sites: 40 keywords, wrong location, generic tourist photos mixed in.
> On Icarus: open the map → click Giza → 47 clips, filtered by time-of-day, altitude, season.

---

## Target personas

### 1. **Pixel** — Documentary editor (buyer)
- Cuts 10 hrs/week of travel/nature doc. Needs establishing shots fast.
- Cares about: resolution (≥4K), color space (raw/log preferred), clearance (no people/logos), instant download.
- Pain: stock sites return off-target results. Hours spent auditioning clips.

### 2. **Nomad** — Solo pilot creator (seller)
- Travels with a Mavic 3 Pro. Uploads 3–8 clips/month. Part-time income.
- Cares about: easy upload, automated GPS tagging, fair revenue share, discoverability.
- Pain: YouTube pays pennies. Stock libraries reject 60% of submissions.

### 3. **Atlas Studio** — Production house (seller + buyer)
- Licenses footage in + out. Has a library of 12k clips.
- Cares about: bulk upload, team seats, enterprise billing, exclusive deals, brand page.

### 4. **Patron** — Viewer / explorer (freemium)
- Uses the site like Google Earth. Watches drone videos for fun.
- Cares about: beautiful map UX, curation, creator stories, ad-free.

---

## Product pillars

| Pillar | What it means |
|---|---|
| **Map-first discovery** | Primary navigation is a globe, not a search bar. |
| **GPS-truth** | Every video is tied to real coordinates. "I was there" is a first-class fact. |
| **Creator-respecting** | 70/30 revenue split. Pilots keep ownership. No exclusivity lock-in by default. |
| **Hi-fi preview** | 3-second full-quality preview, then paywall. No shitty watermarks on free tier. |
| **Transparent licensing** | 4 clearly-defined tiers. No legalese fine print. One-click certificate. |

---

## In scope (MVP)

- [x] Map hero with clustered pins, 200+ landmarks
- [x] Video player with 3s preview paywall
- [x] Upload wizard (file → metadata → GPS → pricing → review)
- [x] Creator profiles + dashboard (uploads, analytics, earnings)
- [x] 4-tier licensing (Personal, Commercial, Extended, Exclusive)
- [x] Stripe checkout + invoices
- [x] User collections ("Morocco Oct 2025")
- [x] Comments with timestamp annotations
- [x] Pilot verification (drone reg + ID)
- [x] Search (client-side filter in proto; elastic/typesense in prod)
- [x] Rankings (trending, this week, all-time)

## Out of scope (post-MVP)

- Live streaming from drones (see `#live` prototype page for intent)
- Commissioning ("I'll pay you $X to fly here next week") — intent prototyped at `#commission`
- Real-time collaboration on clip review
- Mobile apps (iOS/Android) — prototype is web-first
- AI auto-tagging of footage content
- Regional content restrictions / geofencing

---

## Non-goals

We are **not**:
- A YouTube clone. This is a marketplace, not an attention platform.
- A generic stock library. Everything must have GPS truth.
- A social network. Follows exist; feeds do not.

---

## Success metrics (proposed)

| Metric | 6-mo target | 12-mo target |
|---|---|---|
| Paid downloads / week | 200 | 2,500 |
| Creators w/ ≥1 sale | 50 | 600 |
| GMV | $40k | $450k |
| Map interactions / session | 3+ | 5+ |
| Median search → purchase time | < 4 min | < 90 sec |
