// pages/admin/SidebarEditor.jsx — Manage home_sidebar_picks + ads + live_streams
import React, { useEffect, useState } from 'react';
import {
  adminListPicks, adminUpsertPick, adminDeletePick,
  adminListAds, adminUpsertAd, adminDeleteAd,
  adminListStreams, adminUpsertStream, adminDeleteStream,
  adminListSuperChats,
} from '../../db/admin';

const KIND_LABEL = { hot: 'Hot pick', live: 'Live ref', ad: 'Ad ref' };

export function SidebarEditor() {
  const [picks, setPicks] = useState([]);
  const [draft, setDraft] = useState(null);
  const reload = () => adminListPicks().then(setPicks);
  useEffect(() => { reload(); }, []);
  const save = async () => {
    if (!draft.kind) return alert('Choose kind');
    await adminUpsertPick({ ...draft, sort_order: Number(draft.sort_order) || 100, active: !!draft.active });
    setDraft(null); reload();
  };
  const del = async (id) => {
    if (!confirm('Delete this pick?')) return;
    await adminDeletePick(id); reload();
  };
  return (
    <div>
      <h2 style={{ fontSize: 22, marginTop: 0 }}>Home right sidebar — curated picks</h2>
      <p style={{ color: 'var(--parchment-dim)', fontSize: 13, marginBottom: 16 }}>
        Curate which videos / ads / live streams appear in the home right rail.
        Empty list → site auto-fills with top-viewed videos.
      </p>
      <button onClick={() => setDraft({ kind: 'hot', sort_order: 100, active: true, payload: {} })}
        style={{ marginBottom: 16, padding: '8px 14px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>+ New pick</button>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--parchment-dim)', textAlign: 'left' }}>
          <th style={{ padding: '8px 6px' }}>Kind</th>
          <th>Ref ID / Payload</th>
          <th style={{ width: 80 }}>Order</th>
          <th style={{ width: 70 }}>Active</th>
          <th style={{ width: 120 }}></th>
        </tr></thead>
        <tbody>
          {picks.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '8px 6px' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)' }}>{KIND_LABEL[p.kind] || p.kind}</span></td>
              <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 11, color: 'var(--parchment)' }}>
                {p.ref_id || (p.payload?.title ? `[ad] ${p.payload.title}` : '—')}
              </td>
              <td style={{ padding: '8px 6px' }}>{p.sort_order}</td>
              <td style={{ padding: '8px 6px' }}>{p.active ? '✓' : '—'}</td>
              <td style={{ padding: '8px 6px' }}>
                <button onClick={() => setDraft(p)} style={{ marginRight: 6, padding: '4px 8px', background: 'transparent', border: '1px solid var(--line)', color: 'inherit', cursor: 'pointer', borderRadius: 3 }}>Edit</button>
                <button onClick={() => del(p.id)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--sunset)', color: 'var(--sunset)', cursor: 'pointer', borderRadius: 3 }}>Del</button>
              </td>
            </tr>
          ))}
          {picks.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--parchment-dim)' }}>No picks yet — sidebar will auto-fill with top-viewed videos.</td></tr>}
        </tbody>
      </table>

      {draft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setDraft(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink)', padding: 24, borderRadius: 6, maxWidth: 560, width: '90%', border: '1px solid var(--line-strong)' }}>
            <h3 style={{ marginTop: 0 }}>{draft.id ? 'Edit pick' : 'New pick'}</h3>
            <Field label="Kind">
              <select value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value })} style={S.input}>
                <option value="hot">hot — show video as hot pick</option>
                <option value="live">live — point to a live_streams row</option>
                <option value="ad">ad — inline ad payload</option>
              </select>
            </Field>
            {(draft.kind === 'hot' || draft.kind === 'live') && (
              <Field label={draft.kind === 'hot' ? 'Video UUID (videos.id)' : 'Live stream UUID (live_streams.id)'}>
                <input value={draft.ref_id || ''} onChange={e => setDraft({ ...draft, ref_id: e.target.value })} style={S.input} placeholder="copy from videos / live_streams table"/>
              </Field>
            )}
            {draft.kind === 'ad' && (
              <>
                <Field label="Ad title"><input value={draft.payload?.title || ''} onChange={e => setDraft({ ...draft, payload: { ...(draft.payload||{}), title: e.target.value } })} style={S.input}/></Field>
                <Field label="Ad brand"><input value={draft.payload?.brand || ''} onChange={e => setDraft({ ...draft, payload: { ...(draft.payload||{}), brand: e.target.value } })} style={S.input}/></Field>
                <Field label="Image URL"><input value={draft.payload?.image_url || ''} onChange={e => setDraft({ ...draft, payload: { ...(draft.payload||{}), image_url: e.target.value } })} style={S.input}/></Field>
                <Field label="Click URL"><input value={draft.payload?.click_url || ''} onChange={e => setDraft({ ...draft, payload: { ...(draft.payload||{}), click_url: e.target.value } })} style={S.input}/></Field>
                <Field label="CTA label"><input value={draft.payload?.cta_label || 'Learn more'} onChange={e => setDraft({ ...draft, payload: { ...(draft.payload||{}), cta_label: e.target.value } })} style={S.input}/></Field>
              </>
            )}
            <Field label="Sort order"><input type="number" value={draft.sort_order ?? 100} onChange={e => setDraft({ ...draft, sort_order: e.target.value })} style={S.input}/></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
              <input type="checkbox" checked={!!draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })}/> Active
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDraft(null)} style={S.btn}>Cancel</button>
              <button onClick={save} style={{ ...S.btn, background: 'var(--amber)', color: 'var(--ink)', border: 'none' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdsEditor() {
  return <CrudTable
    title="Ads — sponsored placements"
    listFn={adminListAds} upsertFn={adminUpsertAd} deleteFn={adminDeleteAd}
    columns={[ ['title','Title'], ['brand','Brand'], ['active','Active', true] ]}
    fields={[
      ['title','Title'],
      ['brand','Brand'],
      ['image_url','Image URL'],
      ['click_url','Click URL'],
      ['cta_label','CTA label'],
      ['active','Active', 'bool'],
    ]}
  />;
}

export function StreamsEditor() {
  return <CrudTable
    title="Live streams — pilots' broadcasts (independent or YT-mirrored)"
    listFn={adminListStreams} upsertFn={adminUpsertStream} deleteFn={adminDeleteStream}
    columns={[ ['title','Title'], ['status','Status'], ['embed_provider','Provider'], ['viewers_peak','Peak'] ]}
    fields={[
      ['title','Title'],
      ['description','Description', 'textarea'],
      ['thumb_url','Thumb URL'],
      ['status','Status (scheduled/live/ended)'],
      ['embed_provider','Embed provider (site/youtube)'],
      ['yt_video_id','YouTube video ID (if mirrored)'],
      ['yt_channel_id','YouTube channel ID'],
      ['scheduled_at','Scheduled at (ISO)'],
    ]}
  />;
}

export function SuperChatsViewer() {
  const [rows, setRows] = useState([]);
  useEffect(() => { adminListSuperChats().then(setRows); }, []);
  const total = rows.reduce((s, r) => s + Number(r.amount_usd || 0), 0);
  const pilot = rows.reduce((s, r) => s + Number(r.pilot_share_usd || 0), 0);
  const platform = rows.reduce((s, r) => s + Number(r.platform_fee_usd || 0), 0);
  return (
    <div>
      <h2 style={{ fontSize: 22, marginTop: 0 }}>Super Chats — ledger</h2>
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13 }}>
        <div>Total: <strong>${total.toFixed(2)}</strong></div>
        <div style={{ color: 'var(--moss)' }}>Pilots 70%: <strong>${pilot.toFixed(2)}</strong></div>
        <div style={{ color: 'var(--amber)' }}>Platform 30%: <strong>${platform.toFixed(2)}</strong></div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ borderBottom: '1px solid var(--line-strong)', textAlign: 'left' }}>
          <th style={{ padding: '8px 6px' }}>When</th><th>Stream</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Pilot</th><th style={{ textAlign: 'right' }}>Platform</th><th>Status</th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '6px' }}>{(r.created_at || '').slice(0,16).replace('T',' ')}</td>
              <td style={{ padding: '6px', fontFamily: 'monospace', fontSize: 10 }}>{(r.stream_id || '').slice(0,8)}</td>
              <td style={{ padding: '6px', textAlign: 'right' }}>${Number(r.amount_usd).toFixed(2)}</td>
              <td style={{ padding: '6px', textAlign: 'right', color: 'var(--moss)' }}>${Number(r.pilot_share_usd).toFixed(2)}</td>
              <td style={{ padding: '6px', textAlign: 'right', color: 'var(--amber)' }}>${Number(r.platform_fee_usd).toFixed(2)}</td>
              <td style={{ padding: '6px' }}>{r.status}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--parchment-dim)' }}>No super chats yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// Generic CRUD table
function CrudTable({ title, listFn, upsertFn, deleteFn, columns, fields }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(null);
  const reload = () => listFn().then(setRows);
  useEffect(() => { reload(); }, []);
  const save = async () => { await upsertFn(draft); setDraft(null); reload(); };
  const del = async (id) => { if (confirm('Delete this row?')) { await deleteFn(id); reload(); } };
  return (
    <div>
      <h2 style={{ fontSize: 22, marginTop: 0 }}>{title}</h2>
      <button onClick={() => setDraft({ active: true })} style={{ marginBottom: 16, padding: '8px 14px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>+ New</button>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ borderBottom: '1px solid var(--line-strong)', textAlign: 'left' }}>
          {columns.map(c => <th key={c[0]} style={{ padding: '8px 6px' }}>{c[1]}</th>)}
          <th></th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--line)' }}>
              {columns.map(c => <td key={c[0]} style={{ padding: '8px 6px' }}>{c[2] ? (r[c[0]] ? '✓' : '—') : (r[c[0]] != null ? String(r[c[0]]).slice(0,80) : '—')}</td>)}
              <td style={{ padding: '8px 6px', whiteSpace: 'nowrap' }}>
                <button onClick={() => setDraft(r)} style={{ marginRight: 6, padding: '4px 8px', background: 'transparent', border: '1px solid var(--line)', color: 'inherit', cursor: 'pointer', borderRadius: 3 }}>Edit</button>
                <button onClick={() => del(r.id)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--sunset)', color: 'var(--sunset)', cursor: 'pointer', borderRadius: 3 }}>Del</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length + 1} style={{ padding: 20, textAlign: 'center', color: 'var(--parchment-dim)' }}>No rows.</td></tr>}
        </tbody>
      </table>
      {draft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setDraft(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink)', padding: 24, borderRadius: 6, maxWidth: 560, width: '90%', border: '1px solid var(--line-strong)', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{draft.id ? 'Edit' : 'New'}</h3>
            {fields.map(f => (
              <Field key={f[0]} label={f[1]}>
                {f[2] === 'bool'
                  ? <input type="checkbox" checked={!!draft[f[0]]} onChange={e => setDraft({ ...draft, [f[0]]: e.target.checked })}/>
                  : f[2] === 'textarea'
                  ? <textarea value={draft[f[0]] || ''} onChange={e => setDraft({ ...draft, [f[0]]: e.target.value })} rows={3} style={S.input}/>
                  : <input value={draft[f[0]] || ''} onChange={e => setDraft({ ...draft, [f[0]]: e.target.value })} style={S.input}/>
                }
              </Field>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setDraft(null)} style={S.btn}>Cancel</button>
              <button onClick={save} style={{ ...S.btn, background: 'var(--amber)', color: 'var(--ink)', border: 'none' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 10 }}>
    <label style={{ display: 'block', fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 4 }}>{label}</label>
    {children}
  </div>;
}
const S = {
  input: { width: '100%', padding: '8px 10px', background: 'var(--forest-900)', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, fontFamily: 'inherit', fontSize: 13 },
  btn:   { padding: '8px 14px', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--bone)', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' },
};
