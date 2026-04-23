// src/pages/admin/AdminShell.jsx — unified admin + CMS shell
import React, { useState, useEffect, useMemo } from 'react';
import { ContentEditor } from './ContentEditor';
import { AdminDocs } from './Docs';
import { LabEditor } from './LabEditor';
import { SidebarEditor, AdsEditor, StreamsEditor, SuperChatsViewer } from './SidebarEditor';
import { AnalyticsPage } from './Analytics';
import { useAuth } from '../../auth/AuthContext';
import { toast } from '../../toast';
import {
  getSetting, getAllSettings, setSetting, fetchAuditLog,
  adminDashboardStats, adminMonthlyRevenue, adminUserGrowth, adminTopCreators,
  adminListUsers, adminUpdateUser, adminBulkUpdateUsers, adminDeleteUser,
  adminListVideos, adminSetVideoStatus, adminBulkSetVideoStatus, adminDeleteVideo,
  adminListOrders, adminRefundOrder,
  adminListPayouts, adminMarkPayoutPaid,
  adminListLocations, adminUpsertLocation, adminDeleteLocation,
  rowsToCsv, downloadCsv,
} from '../../db/admin';


// ───────── Shared list helpers: pagination + client-side filter ─────────
const DEFAULT_PAGE_SIZE = 20;

function clientFilter(rows, q, keys) {
  const qq = (q || '').trim().toLowerCase();
  if (!qq) return rows;
  return (rows || []).filter(r => {
    for (const k of keys) {
      const v = typeof k === 'function' ? k(r) : (k.split('.').reduce((o, x) => o?.[x], r));
      if (v == null) continue;
      if (String(v).toLowerCase().includes(qq)) return true;
    }
    return false;
  });
}

function paginate(rows, page, size = DEFAULT_PAGE_SIZE) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, page), pages);
  const slice = rows.slice((p - 1) * size, p * size);
  return { slice, total, pages, page: p };
}

function Pagination({ page, pages, total, onPage, size = DEFAULT_PAGE_SIZE }) {
  if (pages <= 1) return (
    <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', padding: '10px 0' }}>
      {total} item{total === 1 ? '' : 's'}
    </div>
  );
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - Math.floor(windowSize / 2), pages - windowSize + 1));
  const nums = [];
  for (let i = 0; i < Math.min(windowSize, pages); i++) nums.push(start + i);
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  const btn = {
    padding: '5px 10px', fontSize: 14, borderRadius: 3,
    border: '1px solid var(--line)', background: 'var(--forest-900)',
    color: 'var(--parchment)', cursor: 'pointer',
  };
  const active = { ...btn, background: 'var(--amber)', color: '#1a2820', fontWeight: 700, borderColor: 'var(--amber)' };
  const dim = { ...btn, opacity: 0.4, cursor: 'not-allowed' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0', flexWrap: 'wrap' }}>
      <button style={page === 1 ? dim : btn} disabled={page === 1} onClick={() => onPage(1)} title="First">«</button>
      <button style={page === 1 ? dim : btn} disabled={page === 1} onClick={() => onPage(page - 1)} title="Previous">‹</button>
      {nums.map(n => (
        <button key={n} style={n === page ? active : btn} onClick={() => onPage(n)}>{n}</button>
      ))}
      <button style={page === pages ? dim : btn} disabled={page === pages} onClick={() => onPage(page + 1)} title="Next">›</button>
      <button style={page === pages ? dim : btn} disabled={page === pages} onClick={() => onPage(pages)} title="Last">»</button>
      <span style={{ flex: 1 }}/>
      <span className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>
        {from}–{to} / {total}
      </span>
    </div>
  );
}

function usePaged(rows, q, filterKeys, initial = 1) {
  const [page, setPage] = useState(initial);
  const filtered = useMemo(() => clientFilter(rows || [], q, filterKeys), [rows, q, filterKeys]);
  const out = useMemo(() => paginate(filtered, page), [filtered, page]);
  // if current page out of range, pull back
  useEffect(() => { if (page > out.pages) setPage(out.pages); }, [out.pages]);
  useEffect(() => { setPage(1); }, [q]);
  return { ...out, setPage };
}

// ───────── sidebar config ─────────
const SIDEBAR = [
  { group: '대시보드', items: [
    { id: 'dashboard', label: 'Overview', icon: '◐' },
    { id: 'reports',   label: 'Reports',  icon: '◇' },
    { id: 'audit',     label: 'Audit log', icon: '⟳' },
  ]},
  { group: '운영 (CRM)', items: [
    { id: 'users',   label: 'Users',   icon: '◉' },
    { id: 'videos',  label: 'Videos',  icon: '▶' },
    { id: 'orders',  label: 'Orders',  icon: '$' },
    { id: 'payouts', label: 'Payouts', icon: '↗' },
  ]},
  { group: '콘텐츠 (CMS)', items: [
    { id: 'content-strings',       label: 'All content strings', icon: 'T' },
    { id: 'content-locations',     label: 'Locations',     icon: '⊕' },
    { id: 'content-hero',          label: 'Hero copy',     icon: 'H' },
    { id: 'content-pricing',       label: 'Pricing copy',  icon: '%' },
    { id: 'content-pages',         label: 'Legal pages',   icon: '§' },
    { id: 'content-faq',           label: 'FAQ',           icon: '?' },
    { id: 'content-categories',    label: 'Categories',    icon: '#' },
    { id: 'content-shot-bundles',  label: 'Shot bundles',  icon: '▦' },
    { id: 'content-atlas',         label: 'Atlas bounties',icon: '★' },
    { id: 'content-featured',      label: 'Featured picks',icon: '♡' },
    { id: 'content-announcements', label: 'Announcements', icon: '!' },
  ]},
  { group: 'Lab 콘텐츠', items: [
    { id: 'lab-items', label: 'Lab items', icon: '§' },
  ]},
  { group: '홈 섹션', items: [
    { id: 'home-sidebar',  label: 'Home sidebar',  icon: '▤' },
    { id: 'ads',           label: 'Ads',           icon: '◎' },
    { id: 'live-streams',  label: 'Live streams',  icon: '●' },
    { id: 'super-chats',   label: 'Super Chats',   icon: '$' },
  ]},
  { group: '방문자 분석', items: [
    { id: 'analytics', label: '방문자 통계 (Visitors)', icon: '◉' },
  ]},
  { group: '운영 문서', items: [
    { id: 'docs', label: 'Operations & Legal docs', icon: '§' },
  ]},
  { group: '설정', items: [
    { id: 'settings', label: 'Platform settings', icon: '⚙' },
  ]},
];

export function AdminShell({ section = 'dashboard', onNav }) {
  const { profile, signOut } = useAuth();

  return (
    <div style={{
      minHeight: 'calc(100vh - 62px)',
      display: 'grid', gridTemplateColumns: '260px 1fr',
      background: 'var(--ink)',
    }}>
      {/* Sidebar */}
      <aside style={{
        background: 'var(--forest-950)', borderRight: '1px solid var(--line)',
        padding: '18px 12px', position: 'sticky', top: 62, alignSelf: 'start',
        maxHeight: 'calc(100vh - 62px)', overflowY: 'auto',
      }}>
        <div style={{ padding: '6px 10px 14px' }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--amber)' }}>ADMIN · CMS</div>
          <div style={{ fontSize: 16, color: 'var(--bone)', marginTop: 4 }}>{profile?.display_name || profile?.handle || 'Operator'}</div>
          <div style={{ fontSize: 13, color: 'var(--parchment-dim)' }}>{profile?.email}</div>
        </div>
        {SIDEBAR.map(group => (
          <div key={group.group} style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--amber)', padding: '12px 12px 6px' }}>{group.group.toUpperCase()}</div>
            {group.items.map(it => {
              const active = section === it.id;
              return (
                <button key={it.id}
                        onClick={() => onNav('admin', it.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '10px 14px', borderRadius: 4, fontSize: 15,
                          background: active ? 'var(--forest-800)' : 'transparent',
                          color: active ? 'var(--amber)' : 'var(--parchment)',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                        }}>
                  <span className="mono" style={{ width: 18, textAlign: 'center', opacity: 0.7 }}>{it.icon}</span>
                  <span>{it.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 14 }}>
          <button onClick={() => onNav('home')} style={{
            display: 'block', width: '100%', padding: '10px 14px', borderRadius: 4, fontSize: 15, color: 'var(--parchment-dim)', textAlign: 'left',
          }}>← Back to site</button>
          <button onClick={async () => { await signOut(); onNav('home'); }} style={{
            display: 'block', width: '100%', padding: '10px 14px', borderRadius: 4, fontSize: 15, color: 'var(--sunset)', textAlign: 'left',
          }}>Sign out</button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-scope" style={{ padding: '32px 40px', minWidth: 0 }}>
        <SectionRouter section={section} onNav={onNav} />
      </main>
    </div>
  );
}

function SectionRouter({ section, onNav }) {
  switch (section) {
    case 'dashboard':  return <Dashboard/>;
    case 'reports':    return <Reports/>;
    case 'audit':      return <AuditLog/>;
    case 'users':      return <Users onNav={onNav}/>;
    case 'videos':     return <Videos onNav={onNav}/>;
    case 'orders':     return <Orders/>;
    case 'payouts':    return <Payouts/>;
    case 'content-strings':       return <ContentEditor/>;
    case 'content-locations':     return <LocationsEditor/>;
    case 'content-hero':          return <SettingsEditor k="hero" title="Homepage hero" fields={[
      ['eyebrow','Eyebrow'], ['title','Title'], ['title_accent','Title accent'], ['sub','Sub-copy', true],
    ]}/>;
    case 'content-pricing':       return <SettingsEditor k="pricing" title="Pricing page" fields={[
      ['eyebrow','Eyebrow'], ['hero','Hero headline'], ['sub','Sub-copy', true],
    ]}/>;
    case 'content-pages':         return <LegalEditor/>;
    case 'content-faq':           return <ArrayEditor k="faq" title="FAQ" fields={[['q','Question'],['a','Answer', true]]}/>;
    case 'content-categories':    return <ArrayEditor k="categories" title="Categories" fields={[['id','Slug'],['label','Label'],['active','Active?']]} />;
    case 'content-shot-bundles':  return <ArrayEditor k="shot_bundles" title="Shot bundles" fields={[['section','Section'],['name','Name'],['desc','Description', true],['count','Clip count'],['fromPrice','From price USD']]}/>;
    case 'content-atlas':         return <ArrayEditor k="atlas_bounties" title="Atlas bounties" fields={[['country','Country'],['difficulty','Difficulty'],['title','Title'],['desc','Description', true],['purse','Purse (USD)'],['deadline','Deadline (ISO)']]}/>;
    case 'content-featured':      return <FeaturedEditor/>;
    case 'content-announcements': return <ArrayEditor k="announcements" title="Announcements" fields={[['kind','Kind (info/warn/promo)'],['text','Text', true],['href','Link URL'],['active','Active?']]}/>;
    case 'lab-items':             return <LabEditor/>;
    case 'home-sidebar':          return <SidebarEditor/>;
    case 'ads':                   return <AdsEditor/>;
    case 'live-streams':          return <StreamsEditor/>;
    case 'super-chats':           return <SuperChatsViewer/>;
    case 'analytics':             return <AnalyticsPage/>;
    case 'docs':                  return <AdminDocs/>;
    case 'settings':              return <SettingsEditor k="site" title="Platform settings" fields={[
      ['name','Site name'], ['tagline','Tagline', true],
      ['commission_rate','Commission rate (0-1)'],
      ['tax_rate','Tax rate (0-1)'],
      ['payout_threshold_usd','Payout threshold (USD)'],
      ['payout_currency','Payout currency'],
      ['support_email','Support email'],
    ]}/>;
    default: return <div>Unknown section.</div>;
  }
}

// ───────── Dashboard ─────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [top, setTop] = useState([]);
  useEffect(() => {
    adminDashboardStats().then(setStats);
    fetchAuditLog({ limit: 8 }).then(setRecent);
    adminMonthlyRevenue(6).then(setMonthly);
    adminUserGrowth(6).then(setGrowth);
    adminTopCreators(8).then(setTop);
  }, []);
  if (!stats) return <Loading/>;
  const cards = [
    ['총 사용자',       stats.usersTotal.toLocaleString(),              'var(--moss)'],
    ['총 업로드 영상',   stats.videosTotal.toLocaleString(),             'var(--lichen)'],
    ['총 주문',         stats.ordersTotal.toLocaleString(),             'var(--bone)'],
    ['총 매출',         '$' + stats.revenueTotal.toLocaleString(undefined, {maximumFractionDigits: 2}), 'var(--amber)'],
    ['플랫폼 수수료 30%', '$' + stats.platformFeeTotal.toLocaleString(undefined, {maximumFractionDigits: 2}), 'var(--sunset)'],
    ['지급 대기',        stats.payoutsScheduled.toLocaleString(),        'var(--parchment-dim)'],
  ];
  const maxRev = Math.max(1, ...monthly.map(m => m.total));
  const maxGrow = Math.max(1, ...growth.map(m => m.count));
  return (
    <div>
      <Header title="Dashboard" sub="실시간 운영 지표 — 데이터베이스에서 바로 집계됩니다." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {cards.map(([label, value, color]) => (
          <div key={label} style={{
            padding: 22, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 6,
          }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 40, fontFamily: 'var(--font-display)', fontWeight: 700, color, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
        <ChartCard title="6-month revenue" values={monthly.map(m => ({ label: m.label, value: m.total, display: '$' + m.total.toFixed(0) }))} max={maxRev} accent="var(--amber)" />
        <ChartCard title="6-month new users" values={growth.map(m => ({ label: m.label, value: m.count, display: String(m.count) }))} max={maxGrow} accent="var(--moss)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 14 }}>
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Top creators</h3>
          <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
            {top.length === 0 && <Empty>등록된 파일럿이 없습니다.</Empty>}
            {top.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--line)' }}>
                <span className="mono" style={{ width: 24, color: 'var(--parchment-dim)', fontSize: 12 }}>#{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.display_name || c.handle}</div>
                  <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{c.handle}</div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--amber)' }}>{(c.followers_count || 0).toLocaleString()} followers</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>최근 관리자 활동</h3>
          <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
            {recent.length === 0 && <Empty>활동 기록이 없습니다.</Empty>}
            {recent.map(r => (
              <div key={r.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 14, display: 'grid', gridTemplateColumns: '160px 1fr 140px', gap: 8 }}>
                <span className="mono" style={{ color: 'var(--parchment-dim)' }}>{new Date(r.created_at).toLocaleString()}</span>
                <span style={{ color: 'var(--bone)' }}>{r.action} <span style={{ color: 'var(--parchment-dim)' }}>→ {r.target_type}</span></span>
                <span style={{ color: 'var(--parchment-dim)' }}>{r.admin?.display_name || r.admin?.handle || ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, values, max, accent }) {
  const W = 560, H = 240, P = { l: 50, r: 16, t: 16, b: 46 };
  const cw = W - P.l - P.r, ch = H - P.t - P.b;
  const niceMax = Math.max(1, Math.ceil((max || 1) / 10) * 10);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(niceMax * t));
  const barW = values.length ? Math.max(8, cw / values.length - 12) : 8;
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {values.length === 0 ? <Empty>데이터가 아직 없습니다.</Empty> : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
          {ticks.map((tv, i) => {
            const y = P.t + ch - (tv / niceMax) * ch;
            return (
              <g key={i}>
                <line x1={P.l} x2={W - P.r} y1={y} y2={y} stroke="var(--line)" strokeDasharray="2 4"/>
                <text x={P.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--parchment-dim)" className="chart-axis">{tv.toLocaleString()}</text>
              </g>
            );
          })}
          {values.map((v, i) => {
            const x = P.l + i * (cw / values.length) + (cw / values.length - barW) / 2;
            const h = (v.value / niceMax) * ch;
            const y = P.t + ch - h;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={Math.max(1, h)} fill={accent} opacity="0.85" rx="3">
                  <title>{`${v.label}: ${v.display}`}</title>
                </rect>
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="var(--bone)" fontWeight="600">{v.display}</text>
                <text x={x + barW / 2} y={H - 14} textAnchor="middle" fontSize="12" fill="var(--parchment-dim)" className="chart-axis">{v.label.slice(5)}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ───────── Reports ─────────
function Reports() {
  const [byMonth, setByMonth] = useState([]);
  useEffect(() => {
    adminMonthlyRevenue(12).then(r => setByMonth(r.map(x => ({ m: x.label, v: x.total }))));
  }, []);
  return (
    <div>
      <Header title="Reports" sub="월별 매출 집계 (status = complete|processing 기준)" />
      <div style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 20 }}>
        {byMonth.length === 0 && <Empty>아직 완료된 주문이 없습니다.</Empty>}
        {byMonth.map(r => (
          <div key={r.m} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
            <span className="mono" style={{ color: 'var(--parchment-dim)' }}>{r.m}</span>
            <div style={{ flex: 1, height: 8, background: 'var(--forest-900)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, r.v/50)}%`, height: '100%', background: 'var(--amber)' }}/>
            </div>
            <span style={{ textAlign: 'right', color: 'var(--bone)', fontWeight: 600 }}>${r.v.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLog() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { fetchAuditLog({ limit: 500 }).then(setRows); }, []);
  const auditPage = usePaged(rows, q, ['action', 'target_type', 'target_id', 'admin.display_name', 'admin.handle', r => r.diff ? JSON.stringify(r.diff) : '']);
  return (
    <div>
      <Header title="Audit log" sub={`어드민 작업 이력 · ${auditPage.total}건`}
        right={<input placeholder="Search action / target / admin" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>} />
      <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
        {auditPage.total === 0 && <Empty>기록이 없습니다.</Empty>}
        {auditPage.slice.map(r => (
          <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 14, display: 'grid', gridTemplateColumns: '180px 140px 180px 1fr 180px', gap: 10 }}>
            <span className="mono" style={{ color: 'var(--parchment-dim)' }}>{new Date(r.created_at).toLocaleString()}</span>
            <span style={{ color: 'var(--amber)' }}>{r.action}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{r.target_type}:{(r.target_id || '').slice(0,14)}</span>
            <span style={{ color: 'var(--parchment)' }}>{r.diff ? JSON.stringify(r.diff).slice(0,80) : ''}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{r.admin?.display_name || r.admin?.handle || ''}</span>
          </div>
        ))}
      </div>
      <Pagination page={auditPage.page} pages={auditPage.pages} total={auditPage.total} onPage={auditPage.setPage}/>
    </div>
  );
}

// ───────── Users CRM ─────────
function Users({ onNav }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [verified, setVerified] = useState('');
  const [since, setSince] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [total, setTotal] = useState(0);
  const load = async () => {
    const { rows, total } = await adminListUsers({ q, role, verified, since, limit: 100 });
    setRows(rows); setTotal(total);
  };
  useEffect(() => { load(); }, [q, role, verified, since]);

  const update = async (id, patch, label) => {
    setBusy(true);
    try { await adminUpdateUser(id, patch); await load(); toast('Saved', label || '', 'success'); }
    catch (e) { toast('Save failed', e.message, 'error'); }
    finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!confirm('정말 이 사용자를 삭제할까요? 되돌릴 수 없습니다.')) return;
    try { await adminDeleteUser(id); await load(); toast('Deleted', '', 'success'); }
    catch (e) { toast('Delete failed', e.message, 'error'); }
  };
  const toggleSel = (id, v) => setSelected(prev => {
    const n = new Set(prev);
    if (v) n.add(id); else n.delete(id);
    return n;
  });
  const toggleSelAll = (v) => setSelected(v ? new Set(rows.map(r => r.id)) : new Set());
  const bulkRole = async (e) => {
    const v = e.target.value; e.target.value = '';
    if (!v || selected.size === 0) return;
    if (!confirm(`${selected.size}명의 role을 "${v}"로 변경할까요?`)) return;
    try { await adminBulkUpdateUsers([...selected], { role: v }); setSelected(new Set()); await load(); toast('Bulk role update', `${selected.size} users`, 'success'); }
    catch (e) { toast('Failed', e.message, 'error'); }
  };
  const bulkVerify = async (on) => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size}명의 verified를 ${on ? '✓' : '—'}로 변경할까요?`)) return;
    try { await adminBulkUpdateUsers([...selected], { pilot_verified: on }); setSelected(new Set()); await load(); toast('Bulk verify', '', 'success'); }
    catch (e) { toast('Failed', e.message, 'error'); }
  };
  const userPage = usePaged(rows, q, ['handle', 'display_name', 'email']);
  const exportCsv = () => {
    const target = selected.size > 0 ? rows.filter(r => selected.has(r.id)) : rows;
    const csv = rowsToCsv(target, [
      { key: 'id', label: 'id' },
      { key: 'handle' },
      { key: 'display_name' },
      { key: 'email' },
      { key: 'role' },
      { key: 'pilot_verified' },
      { key: 'followers_count' },
      { key: 'created_at' },
    ]);
    downloadCsv(`droneicarus-users-${new Date().toISOString().slice(0,10)}.csv`, csv);
  };
  return (
    <div>
      <Header title="Users" sub={`${total}명 (표시 ${rows.length})`} right={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Search handle / email" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>
          <select value={role} onChange={e=>setRole(e.target.value)} style={selectStyle}>
            <option value="">All roles</option>
            {['viewer','pilot','studio','admin'].map(o=><option key={o}>{o}</option>)}
          </select>
          <select value={verified} onChange={e=>setVerified(e.target.value)} style={selectStyle}>
            <option value="">Verified?</option>
            <option value="true">✓ Verified</option>
            <option value="false">— Unverified</option>
          </select>
          <input type="date" value={since} onChange={e=>setSince(e.target.value)} style={inputStyle} title="Joined on/after"/>
          <button onClick={exportCsv} className="btn secondary">Export CSV</button>
        </div>
      }/>
      {selected.size > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--forest-900)', border: '1px solid var(--amber)', borderRadius: 4, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <strong style={{ fontSize: 14, color: 'var(--amber)' }}>{selected.size}명 선택됨</strong>
          <select onChange={bulkRole} style={{ ...selectStyle, width: 160 }} defaultValue="">
            <option value="">Bulk role →</option>
            {['viewer','pilot','studio','admin'].map(o=><option key={o}>{o}</option>)}
          </select>
          <button className="btn secondary" onClick={()=>bulkVerify(true)}>✓ Verify</button>
          <button className="btn secondary" onClick={()=>bulkVerify(false)}>— Unverify</button>
          <button className="btn secondary" onClick={()=>setSelected(new Set())}>Clear</button>
        </div>
      )}
      <table style={tableStyle}>
        <thead><tr>
          <Th><input type="checkbox" checked={selected.size > 0 && selected.size === rows.length} onChange={e=>toggleSelAll(e.target.checked)}/></Th>
          <Th>Handle / Name</Th><Th>Email</Th><Th>Role</Th><Th>Verified</Th><Th>Joined</Th><Th>Actions</Th>
        </tr></thead>
        <tbody>
        {userPage.slice.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle}><input type="checkbox" checked={selected.has(r.id)} onChange={e=>toggleSel(r.id, e.target.checked)}/></td>
            <td style={tdStyle}>
              <div style={{ fontWeight: 600 }}>{r.display_name || r.handle}</div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{r.handle}</div>
            </td>
            <td style={tdStyle}>{r.email}</td>
            <td style={tdStyle}>
              <select value={r.role} disabled={busy} onChange={e=>update(r.id, { role: e.target.value }, 'Role changed')} style={selectStyle}>
                {['viewer','pilot','studio','admin'].map(o=><option key={o}>{o}</option>)}
              </select>
            </td>
            <td style={tdStyle}>
              <button onClick={()=>update(r.id, { pilot_verified: !r.pilot_verified }, 'Verified toggled')} className="btn secondary" style={{ fontSize: 12 }}>
                {r.pilot_verified ? '✓ Verified' : '—'}
              </button>
            </td>
            <td style={tdStyle}>{new Date(r.created_at).toISOString().slice(0,10)}</td>
            <td style={tdStyle}>
              <button onClick={()=>onNav('profile', r.handle.replace(/^@/,''))} className="btn secondary" style={{ fontSize: 12, marginRight: 6 }}>View</button>
              <button onClick={()=>remove(r.id)} style={{ fontSize: 12, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {userPage.total === 0 && <Empty>검색 결과 없음</Empty>}
      <Pagination page={userPage.page} pages={userPage.pages} total={userPage.total} onPage={userPage.setPage}/>
    </div>
  );
}

// ───────── Videos moderation ─────────
function Videos({ onNav }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(new Set());
  const load = async () => setRows((await adminListVideos({ status: status || undefined, q, limit: 100 })).rows);
  useEffect(() => { load(); }, [status, q]);

  const setS = async (id, s) => { try { await adminSetVideoStatus(id, s); await load(); toast('Status updated', s); } catch (e) { toast('Failed', e.message, 'error'); } };
  const del  = async (id) => { if (!confirm('Delete?')) return; try { await adminDeleteVideo(id); await load(); toast('Deleted'); } catch(e){ toast('Failed', e.message, 'error'); } };
  const toggleSel = (id, v) => setSelected(prev => { const n = new Set(prev); if (v) n.add(id); else n.delete(id); return n; });
  const toggleAll = (v) => setSelected(v ? new Set(rows.map(r => r.id)) : new Set());
  const bulkSet = async (s) => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size}개 영상 상태를 "${s}"로 변경할까요?`)) return;
    try { await adminBulkSetVideoStatus([...selected], s); setSelected(new Set()); await load(); toast('Bulk status', s, 'success'); }
    catch (e) { toast('Failed', e.message, 'error'); }
  };
  const videoPage = usePaged(rows, q, ['title', 'category', 'owner.handle', 'owner.display_name']);
  const thumbUrl = (path) => {
    if (!path) return null;
    const base = import.meta.env.VITE_SUPABASE_URL;
    return `${base}/storage/v1/object/public/thumbs/${path}`;
  };

  return (
    <div>
      <Header title="Videos" sub={`${rows.length}개`} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search title / category" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            {['draft','processing','published','rejected','removed'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      }/>
      {selected.size > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--forest-900)', border: '1px solid var(--amber)', borderRadius: 4, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <strong style={{ fontSize: 14, color: 'var(--amber)' }}>{selected.size}개 선택됨</strong>
          <button className="btn" onClick={()=>bulkSet('published')}>Approve all</button>
          <button className="btn secondary" onClick={()=>bulkSet('rejected')}>Reject all</button>
          <button className="btn secondary" onClick={()=>bulkSet('removed')}>Remove</button>
          <button className="btn secondary" onClick={()=>setSelected(new Set())}>Clear</button>
        </div>
      )}
      <table style={tableStyle}>
        <thead><tr>
          <Th><input type="checkbox" checked={selected.size > 0 && selected.size === rows.length} onChange={e=>toggleAll(e.target.checked)}/></Th>
          <Th>Preview</Th><Th>Title</Th><Th>Owner</Th><Th>Category</Th><Th>Status</Th><Th>Price</Th><Th>Views</Th><Th>Actions</Th>
        </tr></thead>
        <tbody>
        {videoPage.slice.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle}><input type="checkbox" checked={selected.has(r.id)} onChange={e=>toggleSel(r.id, e.target.checked)}/></td>
            <td style={tdStyle}>
              {thumbUrl(r.thumb_path) ? (
                <img src={thumbUrl(r.thumb_path)} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--line)' }}/>
              ) : (
                <div style={{ width: 64, height: 40, background: 'var(--forest-900)', border: '1px dashed var(--line)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--parchment-dim)' }}>no thumb</div>
              )}
            </td>
            <td style={tdStyle}>
              <div style={{ fontWeight: 600, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{r.id?.slice(0,12)}…</div>
            </td>
            <td style={tdStyle}>{r.owner?.handle}</td>
            <td style={tdStyle}>{r.category}</td>
            <td style={tdStyle}><span className="mono" style={{ fontSize: 12, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 2, color: statusColor(r.status) }}>{r.status}</span></td>
            <td style={tdStyle}>${r.price_usd}</td>
            <td style={tdStyle}>{(r.views||0).toLocaleString()}</td>
            <td style={tdStyle}>
              {r.status !== 'published' && <button onClick={()=>setS(r.id,'published')} className="btn" style={{ fontSize: 12, marginRight: 4 }}>Approve</button>}
              {r.status !== 'rejected' && <button onClick={()=>setS(r.id,'rejected')} className="btn secondary" style={{ fontSize: 12, marginRight: 4 }}>Reject</button>}
              <button onClick={()=>onNav('watch', r.id)} style={{ fontSize: 12, marginRight: 4 }}>View</button>
              <button onClick={()=>del(r.id)} style={{ fontSize: 12, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {videoPage.total === 0 && <Empty>없음</Empty>}
      <Pagination page={videoPage.page} pages={videoPage.pages} total={videoPage.total} onPage={videoPage.setPage}/>
    </div>
  );
}

function statusColor(s) {
  return {
    draft: 'var(--parchment-dim)', processing: 'var(--amber)',
    published: 'var(--moss)', rejected: 'var(--sunset)', removed: 'var(--sunset)'
  }[s] || 'var(--bone)';
}

// ───────── Orders ─────────
function Orders() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const load = async () => setRows((await adminListOrders({ status: status || undefined, q, from, to, limit: 200 })).rows);
  useEffect(() => { load(); }, [status, q, from, to]);
  const refund = async (id) => { if (!confirm('Issue refund?')) return; try { await adminRefundOrder(id); await load(); toast('Refunded'); } catch(e){ toast('Failed', e.message, 'error'); } };
  const exportCsv = () => {
    const csv = rowsToCsv(rows, [
      { key: 'id' },
      { label: 'buyer_handle', get: r => r.buyer?.handle },
      { label: 'buyer_email',  get: r => r.buyer?.email },
      { label: 'clip_title',   get: r => r.video?.title },
      { key: 'license' },
      { key: 'subtotal' },
      { key: 'tax' },
      { key: 'total' },
      { key: 'status' },
      { key: 'payment_brand' },
      { key: 'created_at' },
    ]);
    downloadCsv(`droneicarus-orders-${new Date().toISOString().slice(0,10)}.csv`, csv);
  };
  const totalRev = rows.filter(r => r.status === 'complete' || r.status === 'processing')
                       .reduce((s, r) => s + Number(r.total || 0), 0);
  const orderPage = usePaged(rows, q, ['id', 'buyer.handle', 'buyer.email', 'video.title', 'license']);
  return (
    <div>
      <Header title="Orders" sub={`${rows.length}건 · 매출합 $${totalRev.toFixed(2)}`} right={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Search buyer / clip / id" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputStyle} title="From"/>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputStyle} title="To"/>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={selectStyle}>
            <option value="">All</option>
            {['pending','processing','complete','refunded','failed'].map(s=><option key={s}>{s}</option>)}
          </select>
          <button onClick={exportCsv} className="btn secondary">Export CSV</button>
        </div>
      }/>
      <table style={tableStyle}>
        <thead><tr><Th>Order</Th><Th>Buyer</Th><Th>Clip</Th><Th>License</Th><Th>Total</Th><Th>Status</Th><Th>When</Th><Th></Th></tr></thead>
        <tbody>
        {orderPage.slice.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle} className="mono">{r.id}</td>
            <td style={tdStyle}>{r.buyer?.handle}</td>
            <td style={tdStyle}>{r.video?.title}</td>
            <td style={tdStyle}>{r.license}</td>
            <td style={tdStyle}>${r.total}</td>
            <td style={tdStyle}><span className="mono" style={{ color: statusColor(r.status) }}>{r.status}</span></td>
            <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
            <td style={tdStyle}>{r.status !== 'refunded' && <button onClick={()=>refund(r.id)} className="btn secondary" style={{ fontSize: 12 }}>Refund</button>}</td>
          </tr>
        ))}
        </tbody>
      </table>
      {orderPage.total === 0 && <Empty>없음</Empty>}
      <Pagination page={orderPage.page} pages={orderPage.pages} total={orderPage.total} onPage={orderPage.setPage}/>
    </div>
  );
}

// ───────── Payouts ─────────
function Payouts() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const load = async () => setRows((await adminListPayouts({ status: status || undefined })).rows);
  useEffect(() => { load(); }, [status]);
  const pay = async (id) => { try { await adminMarkPayoutPaid(id); await load(); toast('Marked paid'); } catch(e){ toast('Failed', e.message, 'error'); } };
  const payPage = usePaged(rows, q, ['id', 'pilot.handle', 'pilot.email', 'period']);
  return (
    <div>
      <Header title="Payouts" sub={`파일럿 정산 큐 · ${payPage.total}건`} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search pilot / email" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={selectStyle}>
            <option value="">All</option>
            {['scheduled','paid','failed'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      }/>
      <table style={tableStyle}>
        <thead><tr><Th>ID</Th><Th>Pilot</Th><Th>Period</Th><Th>Gross</Th><Th>Net</Th><Th>Status</Th><Th>ETA</Th><Th></Th></tr></thead>
        <tbody>
        {payPage.slice.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle} className="mono">{r.id}</td>
            <td style={tdStyle}>{r.pilot?.handle}<br/><span style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{r.pilot?.email}</span></td>
            <td style={tdStyle}>{r.period}</td>
            <td style={tdStyle}>${r.gross}</td>
            <td style={tdStyle}>${r.net}</td>
            <td style={tdStyle}><span className="mono" style={{ color: statusColor(r.status) }}>{r.status}</span></td>
            <td style={tdStyle}>{r.eta}</td>
            <td style={tdStyle}>{r.status === 'scheduled' && <button onClick={()=>pay(r.id)} className="btn" style={{ fontSize: 12 }}>Mark paid</button>}</td>
          </tr>
        ))}
        </tbody>
      </table>
      {payPage.total === 0 && <Empty>없음</Empty>}
      <Pagination page={payPage.page} pages={payPage.pages} total={payPage.total} onPage={payPage.setPage}/>
    </div>
  );
}

// ───────── Locations CRUD ─────────
function LocationsEditor() {
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const load = async () => setRows(await adminListLocations());
  useEffect(() => { load(); }, []);
  const save = async () => {
    try { await adminUpsertLocation(edit); setEdit(null); await load(); toast('Saved'); }
    catch(e){ toast('Save failed', e.message, 'error'); }
  };
  const remove = async (id) => { if (!confirm('Delete?')) return; try { await adminDeleteLocation(id); await load(); toast('Deleted'); } catch(e){ toast('Failed', e.message, 'error'); } };
  const locPage = usePaged(rows, q, ['id', 'name', 'country', 'category']);
  return (
    <div>
      <Header title="Locations" sub={`${locPage.total}개`} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search id / name / country" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>
          <button onClick={()=>setEdit({id:'', name:'', country:'', category:'landscape', lat:0, lon:0, featured:false})} className="btn">+ New</button>
        </div>
      }/>
      {edit && <RowEditor row={edit} onChange={setEdit} onSave={save} onCancel={()=>setEdit(null)}
        fields={[['id','Slug'],['name','Name'],['country','Country'],['category','Category'],['lat','Lat'],['lon','Lon'],['featured','Featured?']]} />}
      <table style={tableStyle}>
        <thead><tr><Th>ID</Th><Th>Name</Th><Th>Country</Th><Th>Category</Th><Th>★</Th><Th></Th></tr></thead>
        <tbody>
        {locPage.slice.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle} className="mono">{r.id}</td>
            <td style={tdStyle}>{r.name}</td>
            <td style={tdStyle}>{r.country}</td>
            <td style={tdStyle}>{r.category}</td>
            <td style={tdStyle}>{r.featured ? '★' : ''}</td>
            <td style={tdStyle}>
              <button onClick={()=>setEdit({...r})} className="btn secondary" style={{ fontSize: 12, marginRight: 4 }}>Edit</button>
              <button onClick={()=>remove(r.id)} style={{ fontSize: 12, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {locPage.total === 0 && <Empty>없음</Empty>}
      <Pagination page={locPage.page} pages={locPage.pages} total={locPage.total} onPage={locPage.setPage}/>
    </div>
  );
}

// ───────── Generic JSONB object editor ─────────
function SettingsEditor({ k, title, fields }) {
  const [val, setVal] = useState(null);
  useEffect(() => { (async () => {
    const v = await getSetting(k, {});
    setVal(v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  })(); }, [k]);
  if (val === null) return <Loading/>;
  const save = async () => { try { await setSetting(k, val); toast('Saved', `site_settings.${k}`); } catch(e){ toast('Save failed', e.message, 'error'); } };
  return (
    <div>
      <Header title={title} sub={`site_settings.${k}`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
        {fields.map(([key, label, multiline]) => (
          <label key={key}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>{label.toUpperCase()}</div>
            {multiline
              ? <textarea value={val[key] ?? ''} onChange={e=>setVal({...val, [key]: e.target.value})} style={{...inputStyle, minHeight: 80}}/>
              : typeof val[key] === 'boolean'
                ? <Toggle on={val[key]} onChange={v=>setVal({...val, [key]: v})}/>
                : <input value={val[key] ?? ''} onChange={e=>setVal({...val, [key]: isFinite(val[key]) && typeof val[key] === 'number' ? Number(e.target.value) : e.target.value})} style={inputStyle}/>}
          </label>
        ))}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} className="btn">Save</button>
          <div style={{ flex: 1 }}/>
          <details><summary style={{ fontSize: 12, color: 'var(--parchment-dim)', cursor: 'pointer' }}>Raw JSON</summary>
            <pre style={{ fontSize: 12, background: 'var(--forest-900)', padding: 10, borderRadius: 4, overflow: 'auto', maxHeight: 300 }}>{JSON.stringify(val, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}

// ───────── Generic array-of-objects editor ─────────
function ArrayEditor({ k, title, fields }) {
  // All hooks must run unconditionally on every render (React Rules of Hooks).
  // We keep val's null state just to decide whether to render <Loading/>, but
  // every hook is computed against val || [] so the hook order is stable.
  const [val, setVal] = useState(null);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { (async () => {
    const v = await getSetting(k, []);
    setVal(Array.isArray(v) ? v : []);
  })(); }, [k]);
  const fieldKeys = useMemo(() => fields.map(f => f[0]), [fields]);
  const withIndex = useMemo(() => (val || []).map((r, i) => ({ ...r, __originalIndex: i })), [val]);
  const filtered = useMemo(() => clientFilter(withIndex, q, fieldKeys), [withIndex, q, fieldKeys]);
  const paged = useMemo(() => paginate(filtered, page), [filtered, page]);
  useEffect(() => { if (page > paged.pages) setPage(paged.pages); }, [paged.pages, page]);
  useEffect(() => { setPage(1); }, [q]);

  if (val === null) return <Loading/>;

  const save = async (next) => { setVal(next); try { await setSetting(k, next); toast('Saved'); } catch(e){ toast('Save failed', e.message, 'error'); } };
  const add = () => setEdit({ __index: -1 }); // -1 = new
  const commit = async () => {
    const row = { ...edit }; delete row.__index;
    const idx = edit.__index;
    const next = idx < 0 ? [...val, row] : val.map((r,i) => i === idx ? row : r);
    await save(next);
    setEdit(null);
  };
  const del = async (i) => { if (!confirm('Delete?')) return; await save(val.filter((_,j)=>j!==i)); };

  return (
    <div>
      <Header title={title} sub={`${paged.total} / ${val.length} items · site_settings.${k}`} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search…" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} style={inputStyle}/>
          <button onClick={add} className="btn">+ New</button>
        </div>
      }/>
      {edit && <RowEditor row={edit} onChange={setEdit} onSave={commit} onCancel={()=>setEdit(null)} fields={fields}/>}
      <table style={tableStyle}>
        <thead><tr>{fields.slice(0,3).map(([,l])=><Th key={l}>{l}</Th>)}<Th></Th></tr></thead>
        <tbody>
        {paged.slice.map((r) => (
          <tr key={r.__originalIndex} style={trStyle}>
            {fields.slice(0,3).map(([fk]) => <td key={fk} style={tdStyle}>{String(r[fk] ?? '').slice(0, 80)}</td>)}
            <td style={tdStyle}>
              <button onClick={()=>setEdit({...r, __index: r.__originalIndex})} className="btn secondary" style={{ fontSize: 12, marginRight: 4 }}>Edit</button>
              <button onClick={()=>del(r.__originalIndex)} style={{ fontSize: 12, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {paged.total === 0 && <Empty>{q ? '검색 결과 없음' : '없음 — "+ New"로 추가'}</Empty>}
      <Pagination page={paged.page} pages={paged.pages} total={paged.total} onPage={setPage}/>
    </div>
  );
}

// ───────── Legal pages editor ─────────
function LegalEditor() {
  return <SettingsEditor k="pages_legal" title="Legal pages" fields={[
    ['title','Title'], ['updated_at','Last updated (YYYY-MM-DD)'],
  ]} />;
}

// ───────── Featured picks editor ─────────
function FeaturedEditor() {
  const [val, setVal] = useState(null);
  useEffect(() => { (async () => {
    const v = await getSetting('featured_picks', { locations: [], videos: [] });
    setVal(v && typeof v === 'object' ? v : { locations: [], videos: [] });
  })(); }, []);
  if (val === null) return <Loading/>;
  const save = async () => { try { await setSetting('featured_picks', val); toast('Saved'); } catch(e){ toast('Save failed', e.message, 'error'); } };
  return (
    <div>
      <Header title="Featured picks" sub="Editor's Picks · Top 3 / 위치 슬러그 / 비디오 UUID"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 6 }}>LOCATIONS (쉼표 구분 slug)</div>
          <textarea value={(val.locations || []).join(', ')} onChange={e=>setVal({...val, locations: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} style={{...inputStyle, minHeight: 120}}/>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 6 }}>VIDEOS (쉼표 구분 UUID)</div>
          <textarea value={(val.videos || []).join(', ')} onChange={e=>setVal({...val, videos: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} style={{...inputStyle, minHeight: 120}}/>
        </div>
      </div>
      <button onClick={save} className="btn" style={{ marginTop: 14 }}>Save</button>
    </div>
  );
}

// ───────── Tiny form row editor for objects ─────────
function RowEditor({ row, onChange, onSave, onCancel, fields }) {
  return (
    <div style={{ border: '1px solid var(--amber)', background: 'var(--forest-900)', padding: 18, borderRadius: 6, marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {fields.map(([fk, label, multiline]) => (
          <label key={fk} style={{ gridColumn: multiline ? 'span 2' : undefined }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 4 }}>{label.toUpperCase()}</div>
            {typeof row[fk] === 'boolean' || /\?$/.test(label)
              ? <Toggle on={!!row[fk]} onChange={v=>onChange({...row, [fk]: v})}/>
              : multiline
                ? <textarea value={row[fk] ?? ''} onChange={e=>onChange({...row, [fk]: e.target.value})} style={{...inputStyle, minHeight: 70}}/>
                : <input value={row[fk] ?? ''} onChange={e=>onChange({...row, [fk]: coerce(e.target.value, row[fk])})} style={inputStyle}/>}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={onSave} className="btn">Save</button>
        <button onClick={onCancel} className="btn secondary">Cancel</button>
      </div>
    </div>
  );
}

function coerce(val, prev) {
  if (typeof prev === 'number' && val !== '' && !isNaN(Number(val))) return Number(val);
  return val;
}

// ───────── tiny UI atoms ─────────
function Header({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
      <div>
        <h1 style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4 }}>{title}</h1>
        {sub && <div style={{ fontSize: 14, color: 'var(--parchment-dim)' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
function Th({ children }) { return <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--line-strong)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{children}</th>; }
function Toggle({ on, onChange }) {
  return <button onClick={() => onChange(!on)} style={{
    width: 40, height: 22, borderRadius: 11, padding: 2, background: on ? 'var(--amber)' : 'var(--forest-700)',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start', cursor: 'pointer',
  }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: '#faf6ec' }}/></button>;
}
function Empty({ children }) { return <div style={{ padding: 40, textAlign: 'center', color: 'var(--parchment-dim)', fontSize: 14 }}>{children}</div>; }
function Loading() { return <div style={{ padding: 40, color: 'var(--parchment-dim)' }}>Loading…</div>; }

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const trStyle = { background: 'var(--forest-900)' };
const tdStyle = { padding: '10px 12px', borderBottom: '1px solid var(--line)', color: 'var(--bone)' };
const inputStyle = { width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit', outline: 'none' };
const selectStyle = { ...inputStyle, width: 'auto' };
