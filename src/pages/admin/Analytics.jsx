// pages/admin/Analytics.jsx — Visitor analytics dashboard
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabase';

const RANGES = [
  ['day',   'Today',     1],
  ['week',  '7 days',    7],
  ['month', '30 days',   30],
  ['quarter','90 days',  90],
  ['year',  '1 year',    365],
  ['all',   'All time',  3650],
];

function fmt(n) { return Number(n || 0).toLocaleString(); }
function pct(n) { return (Number(n || 0)).toFixed(1) + '%'; }
function dur(s) { const v = Number(s) || 0; const m = Math.floor(v/60), sec = Math.floor(v%60); return m ? `${m}m ${sec}s` : `${sec}s`; }

async function rpc(fn, args = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) { console.warn(`rpc ${fn}:`, error.message); return []; }
  return data || [];
}

export function AnalyticsPage() {
  const [range, setRange] = useState('week');
  const [bucket, setBucket] = useState('day');
  const [kpis, setKpis] = useState(null);
  const [countries, setCountries] = useState([]);
  const [pages, setPages] = useState([]);
  const [refs, setRefs] = useState([]);
  const [browsers, setBrowsers] = useState([]);
  const [oses, setOses] = useState([]);
  const [devices, setDevices] = useState([]);
  const [langs, setLangs] = useState([]);
  const [series, setSeries] = useState([]);
  const [members, setMembers] = useState([]);
  const [realtime, setRealtime] = useState({ active_users: 0, active_members: 0, top_paths: [] });

  const range_def = RANGES.find(r => r[0] === range) || RANGES[1];
  const days = range_def[2];
  const p_to = useMemo(() => new Date().toISOString(), [range]);
  const p_from = useMemo(() => new Date(Date.now() - days * 86400000).toISOString(), [range]);

  useEffect(() => {
    if (range === 'day') setBucket('hour');
    else if (range === 'year') setBucket('week');
    else if (range === 'all') setBucket('month');
    else setBucket('day');
  }, [range]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [kr, c, p, r, b, o, d, l, ts, mm] = await Promise.all([
        rpc('analytics_kpis', { p_from, p_to }),
        rpc('analytics_country_breakdown', { p_from, p_to, p_limit: 50 }),
        rpc('analytics_top_pages', { p_from, p_to, p_limit: 25 }),
        rpc('analytics_top_referrers', { p_from, p_to, p_limit: 25 }),
        rpc('analytics_breakdown', { p_field: 'browser', p_from, p_to, p_limit: 20 }),
        rpc('analytics_breakdown', { p_field: 'os',      p_from, p_to, p_limit: 20 }),
        rpc('analytics_breakdown', { p_field: 'device',  p_from, p_to, p_limit: 20 }),
        rpc('analytics_breakdown', { p_field: 'language',p_from, p_to, p_limit: 20 }),
        rpc('analytics_timeseries', { p_from, p_to, p_bucket: bucket }),
        rpc('analytics_top_members', { p_from, p_to, p_limit: 30 }),
      ]);
      if (cancel) return;
      setKpis(kr[0] || null);
      setCountries(c); setPages(p); setRefs(r); setBrowsers(b); setOses(o); setDevices(d); setLangs(l); setSeries(ts); setMembers(mm);
    })();
    return () => { cancel = true; };
  }, [p_from, p_to, bucket]);

  // Realtime poll every 10s
  useEffect(() => {
    let cancel = false;
    const poll = async () => {
      const r = await rpc('analytics_realtime', { p_seconds: 300 });
      if (!cancel) setRealtime(r[0] || { active_users: 0, active_members: 0, top_paths: [] });
    };
    poll();
    const t = setInterval(poll, 10000);
    return () => { cancel = true; clearInterval(t); };
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 24, marginTop: 0, marginBottom: 6 }}>Visitor analytics</h2>
      <p style={{ color: 'var(--parchment-dim)', fontSize: 13, marginBottom: 18 }}>
        Members, guests, country, browser, OS, device, language, top pages, referrers — across the selected period.
      </p>

      {/* Range filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {RANGES.map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)} style={{
            padding: '8px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600,
            background: range === k ? 'var(--amber)' : 'transparent',
            color: range === k ? 'var(--ink)' : 'var(--bone)',
            border: '1px solid ' + (range === k ? 'var(--amber)' : 'var(--line-strong)'),
            cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* Realtime banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14, marginBottom: 18, padding: 16, background: 'var(--forest-900)', border: '1px solid var(--moss)', borderRadius: 4 }}>
        <Stat label="Active now (5min)" value={fmt(realtime.active_users)} accent="var(--moss)"/>
        <Stat label="Members live"      value={fmt(realtime.active_members)} accent="var(--amber)"/>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 4 }}>HOTTEST PATHS RIGHT NOW</div>
          {(realtime.top_paths || []).map((t, i) => (
            <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>
              <span className="mono" style={{ color: 'var(--amber)', marginRight: 8 }}>{t.hits}×</span>
              <span style={{ color: 'var(--parchment)' }}>{t.path}</span>
            </div>
          ))}
          {!(realtime.top_paths || []).length && <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>No active visitors right now.</div>}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Stat label="Page views"      value={fmt(kpis?.pageviews)}/>
        <Stat label="Unique visitors" value={fmt(kpis?.unique_visitors)}/>
        <Stat label="Sessions"        value={fmt(kpis?.unique_sessions)}/>
        <Stat label="Members (signed in)" value={fmt(kpis?.members)} accent="var(--amber)"/>
        <Stat label="Guests"          value={fmt(kpis?.guests)}/>
        <Stat label="Countries"       value={fmt(kpis?.countries)}/>
        <Stat label="Bounce rate"     value={pct(kpis?.bounce_rate)}/>
        <Stat label="Avg session"     value={dur(kpis?.avg_session_seconds)}/>
      </div>

      {/* Time series chart (simple SVG bars) */}
      <Card title={`Pageviews by ${bucket}`}>
        <Bars data={series}/>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card title="Top countries"><Tab cols={['Country','Views','Uniques']} rows={countries.map(c => [c.country, fmt(c.pageviews), fmt(c.unique_visitors)])}/></Card>
        <Card title="Top pages"><Tab cols={['Path','Views','Uniques']} rows={pages.map(p => [p.path, fmt(p.pageviews), fmt(p.unique_visitors)])}/></Card>
        <Card title="Top referrers"><Tab cols={['Source','Views']} rows={refs.map(r => [r.referrer, fmt(r.pageviews)])}/></Card>
        <Card title="Browsers"><Tab cols={['Browser','Views']} rows={browsers.map(b => [b.label, fmt(b.pageviews)])}/></Card>
        <Card title="OS"><Tab cols={['OS','Views']} rows={oses.map(b => [b.label, fmt(b.pageviews)])}/></Card>
        <Card title="Device"><Tab cols={['Device','Views']} rows={devices.map(b => [b.label, fmt(b.pageviews)])}/></Card>
        <Card title="Language"><Tab cols={['Lang','Views']} rows={langs.map(b => [b.label, fmt(b.pageviews)])}/></Card>
        <Card title="Top members (signed-in users)">
          <Tab cols={['Email','Handle','Views','Sessions','Last seen']}
            rows={members.map(m => [m.user_email || '—', m.user_handle || '—', fmt(m.pageviews), fmt(m.sessions), m.last_seen ? new Date(m.last_seen).toLocaleString() : '—'])}/>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'var(--bone)' }) {
  return (
    <div style={{ padding: 14, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent }}>{value || 0}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, padding: 16, marginBottom: 18 }}>
      <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 10 }}>{title}</h3>
      {children}
    </div>
  );
}

function Tab({ cols, rows }) {
  if (!rows || rows.length === 0) return <div style={{ fontSize: 12, color: 'var(--parchment-dim)', padding: 14, textAlign: 'center' }}>No data yet.</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead><tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--parchment-dim)', textAlign: 'left' }}>
        {cols.map((c, i) => <th key={i} style={{ padding: '6px 8px', fontWeight: 600 }}>{c}</th>)}
      </tr></thead>
      <tbody>
        {rows.slice(0, 25).map((r, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
            {r.map((v, j) => <td key={j} style={{ padding: '6px 8px', color: j === 0 ? 'var(--bone)' : 'var(--parchment)' }}>{v ?? '—'}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Bars({ data }) {
  if (!data || !data.length) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--parchment-dim)', fontSize: 12 }}>No data yet.</div>;
  const max = Math.max(...data.map(d => Number(d.pageviews))) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, paddingTop: 14 }}>
      {data.map((d, i) => {
        const h = (Number(d.pageviews) / max) * 100;
        const date = new Date(d.bucket).toLocaleDateString();
        return (
          <div key={i} title={`${date}: ${d.pageviews} views, ${d.unique_visitors} uniques`}
               style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 4 }}>
            <div style={{ width: '100%', height: h + '%', background: 'var(--amber)', borderRadius: '2px 2px 0 0', minHeight: 1, transition: 'height .3s' }}/>
          </div>
        );
      })}
    </div>
  );
}
