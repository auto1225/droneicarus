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
      <p style={{ color: 'var(--parchment-dim)', fontSize: 14, marginBottom: 18 }}>
        Members, guests, country, browser, OS, device, language, top pages, referrers — across the selected period.
      </p>

      {/* Range filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {RANGES.map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)} style={{
            padding: '8px 14px', borderRadius: 4, fontSize: 14, fontWeight: 600,
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
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 4 }}>HOTTEST PATHS RIGHT NOW</div>
          {(realtime.top_paths || []).map((t, i) => (
            <div key={i} style={{ fontSize: 14, marginBottom: 2 }}>
              <span className="mono" style={{ color: 'var(--amber)', marginRight: 8 }}>{t.hits}×</span>
              <span style={{ color: 'var(--parchment)' }}>{t.path}</span>
            </div>
          ))}
          {!(realtime.top_paths || []).length && <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>No active visitors right now.</div>}
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
        <Card title="Browsers"><Donut slices={browsers.map(b => ({ label: b.label, value: Number(b.pageviews) }))}/></Card>
        <Card title="OS"><Donut slices={oses.map(b => ({ label: b.label, value: Number(b.pageviews) }))}/></Card>
        <Card title="Device"><Donut slices={devices.map(b => ({ label: b.label, value: Number(b.pageviews) }))}/></Card>
        <Card title="Language"><Donut slices={langs.map(b => ({ label: b.label, value: Number(b.pageviews) }))}/></Card>
        <DeviceCardK devices={devices}/><RecentVisitsCardK from={p_from} to={p_to}/><Card title="Top members (signed-in users)">
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
      <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim)', marginBottom: 4 }}>{label.toUpperCase()}</div>
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
  if (!rows || rows.length === 0) return <div style={{ fontSize: 14, color: 'var(--parchment-dim)', padding: 14, textAlign: 'center' }}>No data yet.</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
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
  if (!data || !data.length) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--parchment-dim)', fontSize: 14 }}>No data yet.</div>;
  const W = 760, H = 220, P = { l: 50, r: 14, t: 14, b: 30 };
  const max = Math.max(...data.map(d => Number(d.pageviews)), ...data.map(d => Number(d.unique_visitors))) || 1;
  const niceMax = Math.ceil(max / 10) * 10 || 1;
  const cw = W - P.l - P.r, ch = H - P.t - P.b;
  const barW = Math.max(4, cw / data.length - 6);
  // y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(niceMax * t));
  // line points for unique visitors
  const pts = data.map((d, i) => {
    const x = P.l + (i + 0.5) * (cw / data.length);
    const y = P.t + ch - (Number(d.unique_visitors) / niceMax) * ch;
    return [x, y, d];
  });
  const linePath = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
      {/* horizontal grid + y labels */}
      {ticks.map((tv, i) => {
        const y = P.t + ch - (tv / niceMax) * ch;
        return (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={y} y2={y} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={P.l - 8} y={y + 4} className="chart-axis" textAnchor="end" fill="var(--parchment-dim)" fontSize="11">{tv.toLocaleString()}</text>
          </g>
        );
      })}
      {/* bars: pageviews */}
      {data.map((d, i) => {
        const x = P.l + i * (cw / data.length) + (cw / data.length - barW) / 2;
        const h = (Number(d.pageviews) / niceMax) * ch;
        const y = P.t + ch - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(1, h)} fill="var(--amber)" opacity="0.78" rx="2">
              <title>{`${new Date(d.bucket).toLocaleDateString()} — pageviews: ${d.pageviews}, uniques: ${d.unique_visitors}`}</title>
            </rect>
          </g>
        );
      })}
      {/* line: unique visitors */}
      <path d={linePath} fill="none" stroke="var(--moss)" strokeWidth="2.4" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="var(--moss)" />)}
      {/* x-axis labels — every Nth */}
      {data.map((d, i) => {
        const step = Math.max(1, Math.ceil(data.length / 8));
        if (i % step !== 0 && i !== data.length - 1) return null;
        const x = P.l + (i + 0.5) * (cw / data.length);
        const lab = new Date(d.bucket).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return <text key={i} x={x} y={H - 10} fontSize="11" fill="var(--parchment-dim)" textAnchor="middle" className="chart-axis">{lab}</text>;
      })}
      {/* legend */}
      <g transform={`translate(${P.l}, ${P.t - 4})`}>
        <rect x="0" y="-2" width="10" height="10" fill="var(--amber)" opacity="0.78" rx="1"/>
        <text x="14" y="6" fontSize="12" fill="var(--parchment)">Pageviews</text>
        <line x1="92" y1="3" x2="108" y2="3" stroke="var(--moss)" strokeWidth="2.4"/>
        <circle cx="100" cy="3" r="3" fill="var(--moss)"/>
        <text x="114" y="6" fontSize="12" fill="var(--parchment)">Unique visitors</text>
      </g>
    </svg>
  );
}

function Donut({ slices, size = 200 }) {
  if (!slices || !slices.length) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--parchment-dim)', fontSize: 14 }}>No data yet.</div>;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const cx = size / 2, cy = size / 2, R = size / 2 - 6, r = size / 2 - 32;
  const palette = ['var(--amber)', 'var(--moss)', 'var(--lichen)', 'var(--sunset)', 'var(--forest-300)', 'var(--bone)'];
  let acc = 0;
  const arcs = slices.slice(0, 6).map((s, i) => {
    const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
    acc += s.value;
    const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
    const x3 = cx + r * Math.cos(end),   y3 = cy + r * Math.sin(end);
    const x4 = cx + r * Math.cos(start), y4 = cy + r * Math.sin(start);
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
    return { d, color: palette[i % palette.length], label: s.label, value: s.value, pct: ((s.value / total) * 100).toFixed(1) };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color}><title>{`${a.label}: ${a.value} (${a.pct}%)`}</title></path>)}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fill="var(--bone)" fontWeight="700">{total.toLocaleString()}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--parchment-dim)" letterSpacing="0.18em">TOTAL</text>
      </svg>
      <div style={{ flex: 1, display: 'grid', gap: 6 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 1fr 60px 50px', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 12, height: 12, background: a.color, borderRadius: 2 }}/>
            <span style={{ color: 'var(--parchment)' }}>{a.label}</span>
            <span style={{ color: 'var(--bone)', textAlign: 'right' }}>{a.value.toLocaleString()}</span>
            <span style={{ color: 'var(--parchment-dim)', textAlign: 'right' }}>{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function DeviceCardK({ devices }) {
    const total = (devices || []).reduce((s, d) => s + Number(d.pageviews || 0), 0) || 1;
    const get = (k) => (devices || []).find(d => (d.label || '').toLowerCase() === k);
    const desk = get('desktop'), mob = get('mobile'), tab = get('tablet');
    const cell = (label, count, icon) => (
          React.createElement('div', { style: { background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 } },
                                    React.createElement('div', { style: { fontSize: 22, color: 'var(--amber)', minWidth: 32, textAlign: 'center' } }, icon),
                                    React.createElement('div', null,
                                                                React.createElement('div', { style: { fontSize: 22, fontWeight: 700, color: 'var(--bone)' } }, fmt(count)),
                                                                React.createElement('div', { style: { fontSize: 12, color: 'var(--parchment-dim)' } }, label + ' (' + Math.round((Number(count)||0)/total*100) + '%)')
                                                              )
                                  )
        );
    return React.createElement('div', { style: { background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, padding: 16, marginBottom: 18, gridColumn: '1 / -1' } },
                                   React.createElement('h3', { style: { fontSize: 14, marginTop: 0, marginBottom: 10 } }, '디바이스별 접속 (Devices)'),
                                   React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 } },
                                                             cell('데스크탑', desk?.pageviews || 0, '□'),
                                                             cell('모바일', mob?.pageviews || 0, '▯'),
                                                             cell('태블릿', tab?.pageviews || 0, '▢')
                                                           )
                                 );
}

function RecentVisitsCardK({ from, to }) {
    const [rows, setRows] = useState([]);
    useEffect(() => {
          let cancel = false;
          (async () => {
                  const { data } = await supabase.from('page_views')
                    .select('created_at,path,is_member,user_email,user_handle,country,ip,device')
                    .gte('created_at', from).lte('created_at', to)
                    .order('created_at', { ascending: false }).limit(20);
                  if (!cancel) setRows(data || []);
          })();
          return () => { cancel = true; };
    }, [from, to]);
    return React.createElement('div', { style: { background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4, padding: 16, marginBottom: 18, gridColumn: '1 / -1' } },
                                   React.createElement('h3', { style: { fontSize: 14, marginTop: 0, marginBottom: 10 } }, '최근 방문 기록 (Recent visits)'),
                                   rows.length === 0
                                     ? React.createElement('div', { style: { fontSize: 14, color: 'var(--parchment-dim)', padding: 14, textAlign: 'center' } }, '데이터 없음')
                                     : React.createElement('div', { style: { overflow: 'auto' } },
                                                                     React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 } },
                                                                                                     React.createElement('thead', null,
                                                                                                                                       React.createElement('tr', { style: { borderBottom: '1px solid var(--line-strong)', color: 'var(--parchment-dim)', textAlign: 'left' } },
                                                                                                                                                                           ['시간','페이지','유형','국가','IP','디바이스'].map((c, i) => React.createElement('th', { key: i, style: { padding: '6px 8px', fontWeight: 600 } }, c))
                                                                                                                                                                         )
                                                                                                                                     ),
                                                                                                     React.createElement('tbody', null,
                                                                                                                                       rows.map((r, i) => React.createElement('tr', { key: i, style: { borderBottom: '1px solid var(--line)' } },
                                                                                                                                                                                              React.createElement('td', { style: { padding: '6px 8px' } }, new Date(r.created_at).toLocaleString('ko-KR')),
                                                                                                                                                                                              React.createElement('td', { style: { padding: '6px 8px', fontFamily: 'monospace' } }, r.path || '/'),
                                                                                                                                                                                              React.createElement('td', { style: { padding: '6px 8px' } },
                                                                                                                                                                                                                                    React.createElement('span', { style: { fontSize: 11, padding: '2px 8px', borderRadius: 12, background: r.is_member ? 'rgba(184,154,86,0.18)' : 'rgba(140,140,140,0.15)', color: r.is_member ? 'var(--amber)' : 'var(--parchment-dim)' } }, r.is_member ? '회원' : '비회원')
                                                                                                                                                                                                                                  ),
                                                                                                                                                                                              React.createElement('td', { style: { padding: '6px 8px' } }, r.country || '—'),
                                                                                                                                                                                              React.createElement('td', { style: { padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, color: 'var(--parchment-dim)' } }, r.ip || '—'),
                                                                                                                                                                                              React.createElement('td', { style: { padding: '6px 8px', textTransform: 'capitalize' } }, r.device || '—')
                                                                                                                                                                                            ))
                                                                                                                                     )
                                                                                                   )
                                                                   )
                                 );
}
