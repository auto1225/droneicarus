// src/pages/admin/AdminShell.jsx — unified admin + CMS shell
import React, { useState, useEffect, useMemo } from 'react';
import { ContentEditor } from './ContentEditor';
import { useAuth } from '../../auth/AuthContext';
import { toast } from '../../toast';
import { supabase } from '../../supabase';
import {
  getAllSettings, setSetting, fetchAuditLog,
  adminDashboardStats,
  adminListUsers, adminUpdateUser, adminDeleteUser,
  adminListVideos, adminSetVideoStatus, adminDeleteVideo,
  adminListOrders, adminRefundOrder,
  adminListPayouts, adminMarkPayoutPaid,
  adminListLocations, adminUpsertLocation, adminDeleteLocation,
} from '../../db/admin';

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
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--amber)' }}>ADMIN · CMS</div>
          <div style={{ fontSize: 13, color: 'var(--bone)', marginTop: 4 }}>{profile?.display_name || profile?.handle || 'Operator'}</div>
          <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{profile?.email}</div>
        </div>
        {SIDEBAR.map(group => (
          <div key={group.group} style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--parchment-dim)', padding: '8px 12px' }}>{group.group.toUpperCase()}</div>
            {group.items.map(it => {
              const active = section === it.id;
              return (
                <button key={it.id}
                        onClick={() => onNav('admin', it.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '8px 12px', borderRadius: 4, fontSize: 13,
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
            display: 'block', width: '100%', padding: '8px 12px', borderRadius: 4, fontSize: 12, color: 'var(--parchment-dim)', textAlign: 'left',
          }}>← Back to site</button>
          <button onClick={async () => { await signOut(); onNav('home'); }} style={{
            display: 'block', width: '100%', padding: '8px 12px', borderRadius: 4, fontSize: 12, color: 'var(--sunset)', textAlign: 'left',
          }}>Sign out</button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ padding: '32px 40px', minWidth: 0 }}>
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
  useEffect(() => {
    adminDashboardStats().then(setStats);
    fetchAuditLog({ limit: 8 }).then(setRecent);
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
  return (
    <div>
      <Header title="Dashboard" sub="실시간 운영 지표 — 데이터베이스에서 바로 집계됩니다." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {cards.map(([label, value, color]) => (
          <div key={label} style={{
            padding: 22, background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 6,
          }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)' }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 600, color, marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>최근 관리자 활동</h3>
      <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
        {recent.length === 0 && <Empty>활동 기록이 없습니다.</Empty>}
        {recent.map(r => (
          <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 12, display: 'grid', gridTemplateColumns: '200px 1fr 150px 180px', gap: 10 }}>
            <span className="mono" style={{ color: 'var(--parchment-dim)' }}>{new Date(r.created_at).toLocaleString()}</span>
            <span style={{ color: 'var(--bone)' }}>{r.action}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{r.target_type}:{(r.target_id || '').slice(0,12)}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{r.admin?.display_name || r.admin?.handle || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── Reports ─────────
function Reports() {
  const [byMonth, setByMonth] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('total, created_at, status');
      const map = new Map();
      for (const r of data || []) {
        if (r.status !== 'complete' && r.status !== 'processing') continue;
        const m = String(r.created_at).slice(0, 7);
        map.set(m, (map.get(m) || 0) + Number(r.total || 0));
      }
      const rows = [...map.entries()].sort().map(([m, v]) => ({ m, v }));
      setByMonth(rows);
    })();
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
  useEffect(() => { fetchAuditLog({ limit: 200 }).then(setRows); }, []);
  return (
    <div>
      <Header title="Audit log" sub="어드민 작업 이력" />
      <div style={{ border: '1px solid var(--line)', borderRadius: 4 }}>
        {rows.length === 0 && <Empty>기록이 없습니다.</Empty>}
        {rows.map(r => (
          <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 12, display: 'grid', gridTemplateColumns: '180px 140px 180px 1fr 180px', gap: 10 }}>
            <span className="mono" style={{ color: 'var(--parchment-dim)' }}>{new Date(r.created_at).toLocaleString()}</span>
            <span style={{ color: 'var(--amber)' }}>{r.action}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{r.target_type}:{(r.target_id || '').slice(0,14)}</span>
            <span style={{ color: 'var(--parchment)' }}>{r.diff ? JSON.stringify(r.diff).slice(0,80) : ''}</span>
            <span style={{ color: 'var(--parchment-dim)' }}>{r.admin?.display_name || r.admin?.handle || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── Users CRM ─────────
function Users({ onNav }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => setRows((await adminListUsers({ q })).rows);
  useEffect(() => { load(); }, [q]);

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
  return (
    <div>
      <Header title="Users" sub={`${rows.length}명`} right={<input placeholder="Search handle / email" value={q} onChange={e=>setQ(e.target.value)} style={inputStyle}/>} />
      <table style={tableStyle}>
        <thead><tr>
          <Th>Handle / Name</Th><Th>Email</Th><Th>Role</Th><Th>Verified</Th><Th>Joined</Th><Th>Actions</Th>
        </tr></thead>
        <tbody>
        {rows.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle}>
              <div style={{ fontWeight: 600 }}>{r.display_name || r.handle}</div>
              <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{r.handle}</div>
            </td>
            <td style={tdStyle}>{r.email}</td>
            <td style={tdStyle}>
              <select value={r.role} disabled={busy} onChange={e=>update(r.id, { role: e.target.value }, 'Role changed')} style={selectStyle}>
                {['viewer','pilot','studio','admin'].map(o=><option key={o}>{o}</option>)}
              </select>
            </td>
            <td style={tdStyle}>
              <button onClick={()=>update(r.id, { pilot_verified: !r.pilot_verified }, 'Verified toggled')} className="btn secondary" style={{ fontSize: 11 }}>
                {r.pilot_verified ? '✓ Verified' : '—'}
              </button>
            </td>
            <td style={tdStyle}>{new Date(r.created_at).toISOString().slice(0,10)}</td>
            <td style={tdStyle}>
              <button onClick={()=>onNav('profile', r.handle.replace(/^@/,''))} className="btn secondary" style={{ fontSize: 11, marginRight: 6 }}>View</button>
              <button onClick={()=>remove(r.id)} style={{ fontSize: 11, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {rows.length === 0 && <Empty>검색 결과 없음</Empty>}
    </div>
  );
}

// ───────── Videos moderation ─────────
function Videos({ onNav }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const load = async () => setRows((await adminListVideos({ status: status || undefined })).rows);
  useEffect(() => { load(); }, [status]);

  const setS = async (id, s) => { try { await adminSetVideoStatus(id, s); await load(); toast('Status updated', s); } catch (e) { toast('Failed', e.message, 'error'); } };
  const del  = async (id) => { if (!confirm('Delete?')) return; try { await adminDeleteVideo(id); await load(); toast('Deleted'); } catch(e){ toast('Failed', e.message, 'error'); } };

  return (
    <div>
      <Header title="Videos" sub={`${rows.length}개`} right={
        <select value={status} onChange={e=>setStatus(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          {['draft','processing','published','rejected','removed'].map(s=><option key={s}>{s}</option>)}
        </select>
      }/>
      <table style={tableStyle}>
        <thead><tr><Th>Title</Th><Th>Owner</Th><Th>Category</Th><Th>Status</Th><Th>Price</Th><Th>Views</Th><Th>Actions</Th></tr></thead>
        <tbody>
        {rows.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle}>
              <div style={{ fontWeight: 600, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'var(--parchment-dim)' }}>{r.id?.slice(0,12)}…</div>
            </td>
            <td style={tdStyle}>{r.owner?.handle}</td>
            <td style={tdStyle}>{r.category}</td>
            <td style={tdStyle}><span className="mono" style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 2, color: statusColor(r.status) }}>{r.status}</span></td>
            <td style={tdStyle}>${r.price_usd}</td>
            <td style={tdStyle}>{(r.views||0).toLocaleString()}</td>
            <td style={tdStyle}>
              {r.status !== 'published' && <button onClick={()=>setS(r.id,'published')} className="btn" style={{ fontSize: 11, marginRight: 4 }}>Approve</button>}
              {r.status !== 'rejected' && <button onClick={()=>setS(r.id,'rejected')} className="btn secondary" style={{ fontSize: 11, marginRight: 4 }}>Reject</button>}
              <button onClick={()=>onNav('watch', r.id)} style={{ fontSize: 11, marginRight: 4 }}>View</button>
              <button onClick={()=>del(r.id)} style={{ fontSize: 11, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {rows.length === 0 && <Empty>없음</Empty>}
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
  const load = async () => setRows((await adminListOrders({ status: status || undefined })).rows);
  useEffect(() => { load(); }, [status]);
  const refund = async (id) => { if (!confirm('Issue refund?')) return; try { await adminRefundOrder(id); await load(); toast('Refunded'); } catch(e){ toast('Failed', e.message, 'error'); } };
  return (
    <div>
      <Header title="Orders" sub={`${rows.length}건`} right={
        <select value={status} onChange={e=>setStatus(e.target.value)} style={selectStyle}>
          <option value="">All</option>
          {['pending','processing','complete','refunded','failed'].map(s=><option key={s}>{s}</option>)}
        </select>
      }/>
      <table style={tableStyle}>
        <thead><tr><Th>Order</Th><Th>Buyer</Th><Th>Clip</Th><Th>License</Th><Th>Total</Th><Th>Status</Th><Th>When</Th><Th></Th></tr></thead>
        <tbody>
        {rows.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle} className="mono">{r.id}</td>
            <td style={tdStyle}>{r.buyer?.handle}</td>
            <td style={tdStyle}>{r.video?.title}</td>
            <td style={tdStyle}>{r.license}</td>
            <td style={tdStyle}>${r.total}</td>
            <td style={tdStyle}><span className="mono" style={{ color: statusColor(r.status) }}>{r.status}</span></td>
            <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
            <td style={tdStyle}>{r.status !== 'refunded' && <button onClick={()=>refund(r.id)} className="btn secondary" style={{ fontSize: 11 }}>Refund</button>}</td>
          </tr>
        ))}
        </tbody>
      </table>
      {rows.length === 0 && <Empty>없음</Empty>}
    </div>
  );
}

// ───────── Payouts ─────────
function Payouts() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const load = async () => setRows((await adminListPayouts({ status: status || undefined })).rows);
  useEffect(() => { load(); }, [status]);
  const pay = async (id) => { try { await adminMarkPayoutPaid(id); await load(); toast('Marked paid'); } catch(e){ toast('Failed', e.message, 'error'); } };
  return (
    <div>
      <Header title="Payouts" sub="파일럿 정산 큐" right={
        <select value={status} onChange={e=>setStatus(e.target.value)} style={selectStyle}>
          <option value="">All</option>
          {['scheduled','paid','failed'].map(s=><option key={s}>{s}</option>)}
        </select>
      }/>
      <table style={tableStyle}>
        <thead><tr><Th>ID</Th><Th>Pilot</Th><Th>Period</Th><Th>Gross</Th><Th>Net</Th><Th>Status</Th><Th>ETA</Th><Th></Th></tr></thead>
        <tbody>
        {rows.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle} className="mono">{r.id}</td>
            <td style={tdStyle}>{r.pilot?.handle}<br/><span style={{ fontSize: 10, color: 'var(--parchment-dim)' }}>{r.pilot?.email}</span></td>
            <td style={tdStyle}>{r.period}</td>
            <td style={tdStyle}>${r.gross}</td>
            <td style={tdStyle}>${r.net}</td>
            <td style={tdStyle}><span className="mono" style={{ color: statusColor(r.status) }}>{r.status}</span></td>
            <td style={tdStyle}>{r.eta}</td>
            <td style={tdStyle}>{r.status === 'scheduled' && <button onClick={()=>pay(r.id)} className="btn" style={{ fontSize: 11 }}>Mark paid</button>}</td>
          </tr>
        ))}
        </tbody>
      </table>
      {rows.length === 0 && <Empty>없음</Empty>}
    </div>
  );
}

// ───────── Locations CRUD ─────────
function LocationsEditor() {
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const load = async () => setRows(await adminListLocations());
  useEffect(() => { load(); }, []);
  const save = async () => {
    try { await adminUpsertLocation(edit); setEdit(null); await load(); toast('Saved'); }
    catch(e){ toast('Save failed', e.message, 'error'); }
  };
  const remove = async (id) => { if (!confirm('Delete?')) return; try { await adminDeleteLocation(id); await load(); toast('Deleted'); } catch(e){ toast('Failed', e.message, 'error'); } };
  return (
    <div>
      <Header title="Locations" sub={`${rows.length}개`} right={<button onClick={()=>setEdit({id:'', name:'', country:'', category:'landscape', lat:0, lon:0, featured:false})} className="btn">+ New</button>}/>
      {edit && <RowEditor row={edit} onChange={setEdit} onSave={save} onCancel={()=>setEdit(null)}
        fields={[['id','Slug'],['name','Name'],['country','Country'],['category','Category'],['lat','Lat'],['lon','Lon'],['featured','Featured?']]} />}
      <table style={tableStyle}>
        <thead><tr><Th>ID</Th><Th>Name</Th><Th>Country</Th><Th>Category</Th><Th>★</Th><Th></Th></tr></thead>
        <tbody>
        {rows.map(r => (
          <tr key={r.id} style={trStyle}>
            <td style={tdStyle} className="mono">{r.id}</td>
            <td style={tdStyle}>{r.name}</td>
            <td style={tdStyle}>{r.country}</td>
            <td style={tdStyle}>{r.category}</td>
            <td style={tdStyle}>{r.featured ? '★' : ''}</td>
            <td style={tdStyle}>
              <button onClick={()=>setEdit({...r})} className="btn secondary" style={{ fontSize: 11, marginRight: 4 }}>Edit</button>
              <button onClick={()=>remove(r.id)} style={{ fontSize: 11, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────── Generic JSONB object editor ─────────
function SettingsEditor({ k, title, fields }) {
  const [val, setVal] = useState(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', k).maybeSingle();
    setVal(data?.value || {});
  })(); }, [k]);
  if (val === null) return <Loading/>;
  const save = async () => { try { await setSetting(k, val); toast('Saved', `site_settings.${k}`); } catch(e){ toast('Save failed', e.message, 'error'); } };
  return (
    <div>
      <Header title={title} sub={`site_settings.${k}`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
        {fields.map(([key, label, multiline]) => (
          <label key={key}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--parchment-dim)', marginBottom: 4 }}>{label.toUpperCase()}</div>
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
          <details><summary style={{ fontSize: 11, color: 'var(--parchment-dim)', cursor: 'pointer' }}>Raw JSON</summary>
            <pre style={{ fontSize: 11, background: 'var(--forest-900)', padding: 10, borderRadius: 4, overflow: 'auto', maxHeight: 300 }}>{JSON.stringify(val, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}

// ───────── Generic array-of-objects editor ─────────
function ArrayEditor({ k, title, fields }) {
  const [val, setVal] = useState(null);
  const [edit, setEdit] = useState(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', k).maybeSingle();
    setVal(Array.isArray(data?.value) ? data.value : []);
  })(); }, [k]);
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
      <Header title={title} sub={`${val.length} items · site_settings.${k}`} right={<button onClick={add} className="btn">+ New</button>}/>
      {edit && <RowEditor row={edit} onChange={setEdit} onSave={commit} onCancel={()=>setEdit(null)} fields={fields}/>}
      <table style={tableStyle}>
        <thead><tr>{fields.slice(0,3).map(([,l])=><Th key={l}>{l}</Th>)}<Th></Th></tr></thead>
        <tbody>
        {val.map((r, i) => (
          <tr key={i} style={trStyle}>
            {fields.slice(0,3).map(([fk]) => <td key={fk} style={tdStyle}>{String(r[fk] ?? '').slice(0, 80)}</td>)}
            <td style={tdStyle}>
              <button onClick={()=>setEdit({...r, __index: i})} className="btn secondary" style={{ fontSize: 11, marginRight: 4 }}>Edit</button>
              <button onClick={()=>del(i)} style={{ fontSize: 11, color: 'var(--sunset)' }}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {val.length === 0 && <Empty>없음 — "+ New"로 추가</Empty>}
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
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'featured_picks').maybeSingle();
    setVal(data?.value || { locations: [], videos: [] });
  })(); }, []);
  if (val === null) return <Loading/>;
  const save = async () => { try { await setSetting('featured_picks', val); toast('Saved'); } catch(e){ toast('Save failed', e.message, 'error'); } };
  return (
    <div>
      <Header title="Featured picks" sub="Editor's Picks · Top 3 / 위치 슬러그 / 비디오 UUID"/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', marginBottom: 6 }}>LOCATIONS (쉼표 구분 slug)</div>
          <textarea value={(val.locations || []).join(', ')} onChange={e=>setVal({...val, locations: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} style={{...inputStyle, minHeight: 120}}/>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', marginBottom: 6 }}>VIDEOS (쉼표 구분 UUID)</div>
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
            <div className="mono" style={{ fontSize: 10, color: 'var(--parchment-dim)', marginBottom: 4 }}>{label.toUpperCase()}</div>
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
        {sub && <div style={{ fontSize: 12, color: 'var(--parchment-dim)' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
function Th({ children }) { return <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--line-strong)', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--parchment-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{children}</th>; }
function Toggle({ on, onChange }) {
  return <button onClick={() => onChange(!on)} style={{
    width: 40, height: 22, borderRadius: 11, padding: 2, background: on ? 'var(--amber)' : 'var(--forest-700)',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start', cursor: 'pointer',
  }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: '#faf6ec' }}/></button>;
}
function Empty({ children }) { return <div style={{ padding: 40, textAlign: 'center', color: 'var(--parchment-dim)', fontSize: 13 }}>{children}</div>; }
function Loading() { return <div style={{ padding: 40, color: 'var(--parchment-dim)' }}>Loading…</div>; }

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const trStyle = { background: 'var(--forest-900)' };
const tdStyle = { padding: '10px 12px', borderBottom: '1px solid var(--line)', color: 'var(--bone)' };
const inputStyle = { width: '100%', padding: '10px 12px', fontSize: 13, background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit', outline: 'none' };
const selectStyle = { ...inputStyle, width: 'auto' };
