// src/pages/admin/LabEditor.jsx — CRUD UI for Lab items
import React, { useState, useEffect, useMemo } from 'react';
import { adminListLabItems, adminUpsertLabItem, adminDeleteLabItem, adminSetLabStatus } from '../../db/lab';
import { toast } from '../../toast';
import { Ic } from '../../components';

const SUBSECTIONS = ['research', 'projects', 'hardware', 'learn', 'pulse'];
const TYPES      = ['paper', 'patent', 'project', 'hardware', 'tutorial', 'news', 'event'];
const STATUSES   = ['approved', 'pending', 'rejected'];

export function LabEditor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // item being edited in modal, null = closed
  const [filterSub, setFilterSub] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminListLabItems({
      subsection: filterSub !== 'all' ? filterSub : undefined,
      status:     filterStatus !== 'all' ? filterStatus : undefined,
      limit: 200,
    }).then(r => { setRows(r || []); setLoading(false); });
  };
  useEffect(load, [filterSub, filterStatus]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.institution || '').toLowerCase().includes(q) ||
      (r.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const handleSave = async (item) => {
    setSaving(true);
    try {
      const saved = await adminUpsertLabItem(item);
      toast?.('Saved', saved?.title || '', 'info');
      setEditing(null);
      load();
    } catch (e) {
      toast?.('Save failed', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await adminDeleteLabItem(id);
      toast?.('Deleted', title, 'info');
      load();
    } catch (e) {
      toast?.('Delete failed', e.message, 'error');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await adminSetLabStatus(id, status);
      load();
    } catch (e) {
      toast?.('Update failed', e.message, 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: 0 }}>Lab Content</h1>
          <div style={{ fontSize: 14, color: 'var(--parchment-dim)', marginTop: 4 }}>
            {rows.length} items · {filtered.length} shown
          </div>
        </div>
        <button onClick={() => setEditing({ subsection: 'research', type: 'paper', status: 'approved', tags: [] })}
                className="btn"
                style={{ padding: '10px 18px', fontSize: 14 }}>
          + New item
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterSub} onChange={e => setFilterSub(e.target.value)} style={selStyle}>
          <option value="all">All subsections</option>
          {SUBSECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title / institution / tag…"
               style={{ ...selStyle, flex: 1, minWidth: 240 }} />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--parchment-dim)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--parchment-dim)', border: '1px dashed var(--line)', borderRadius: 6 }}>
          No items yet. Click "+ New item" to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              padding: '12px 14px', display: 'grid',
              gridTemplateColumns: '80px 100px 1fr 100px auto',
              gap: 12, alignItems: 'center',
              border: '1px solid var(--line)', borderRadius: 6,
              background: 'var(--forest-900)',
            }}>
              <span className="mono" style={{ fontSize: 12, letterSpacing: '0.1em', color: 'var(--parchment-dim)', textTransform: 'uppercase' }}>{item.subsection}</span>
              <span className="mono" style={{ fontSize: 12, letterSpacing: '0.1em', color: 'var(--amber)', textTransform: 'uppercase' }}>{item.type}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--parchment-dim)', marginTop: 2 }}>{item.institution || '—'}</div>
              </div>
              <select value={item.status} onChange={e => handleStatus(item.id, e.target.value)}
                      style={{ ...selStyle, padding: '4px 8px', fontSize: 12 }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditing(item)} className="btn secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Edit</button>
                <button onClick={() => handleDelete(item.id, item.title)} style={{
                  padding: '6px 12px', fontSize: 12, background: 'transparent',
                  color: 'var(--sunset)', border: '1px solid var(--sunset)',
                  borderRadius: 3, cursor: 'pointer',
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <LabItemForm
          item={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

const selStyle = {
  padding: '8px 12px', fontSize: 14,
  background: 'var(--forest-900)', border: '1px solid var(--line-strong)',
  color: 'var(--bone)', borderRadius: 4, outline: 'none',
};

// ──────────────────────────────────────────────────────────────────────
// Edit / Create form (modal)
// ──────────────────────────────────────────────────────────────────────
function LabItemForm({ item, onCancel, onSave, saving }) {
  const [form, setForm] = useState({
    id: item.id,
    type: item.type || 'paper',
    subsection: item.subsection || 'research',
    title: item.title || '',
    slug: item.slug || '',
    summary: item.summary || '',
    body_markdown: item.body_markdown || '',
    cover_image_url: item.cover_image_url || '',
    external_url: item.external_url || '',
    authors: (item.authors || []).join(', '),
    institution: item.institution || '',
    published_at: item.published_at ? String(item.published_at).slice(0, 10) : '',
    tags: (item.tags || []).join(', '),
    level: item.level || '',
    price_min_usd: item.price_min_usd ?? '',
    price_max_usd: item.price_max_usd ?? '',
    brand: item.brand || '',
    spec: item.spec ? JSON.stringify(item.spec, null, 2) : '',
    document_url: item.document_url || '',
    document_type: item.document_type || '',
    status: item.status || 'approved',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    const out = {
      ...(form.id ? { id: form.id } : {}),
      type: form.type,
      subsection: form.subsection,
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      summary: form.summary || null,
      body_markdown: form.body_markdown || null,
      cover_image_url: form.cover_image_url || null,
      external_url: form.external_url || null,
      authors: form.authors ? form.authors.split(',').map(s => s.trim()).filter(Boolean) : [],
      institution: form.institution || null,
      published_at: form.published_at || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      level: form.level || null,
      price_min_usd: form.price_min_usd === '' ? null : Number(form.price_min_usd),
      price_max_usd: form.price_max_usd === '' ? null : Number(form.price_max_usd),
      brand: form.brand || null,
      document_url: form.document_url || null,
      document_type: form.document_type || null,
      status: form.status,
    };
    if (form.spec) {
      try { out.spec = JSON.parse(form.spec); } catch { /* ignore bad JSON, let DB reject */ }
    } else {
      out.spec = null;
    }
    if (!out.title || out.title.length < 3) { toast?.('Title required', '3+ chars', 'error'); return; }
    onSave(out);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: 'var(--forest-950)', border: '1px solid var(--line-strong)',
        borderRadius: 8, padding: 24, maxWidth: 780, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, margin: '0 0 18px' }}>{form.id ? 'Edit item' : 'New item'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Fld label="Subsection">
            <select value={form.subsection} onChange={e => set('subsection', e.target.value)} style={selStyle}>
              {SUBSECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Fld>
          <Fld label="Type">
            <select value={form.type} onChange={e => set('type', e.target.value)} style={selStyle}>
              {TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Fld>
          <Fld label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} style={selStyle}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Fld>
          <Fld label="Slug (unique, optional)">
            <input value={form.slug} onChange={e => set('slug', e.target.value)} style={selStyle} placeholder="my-paper-2024"/>
          </Fld>
        </div>

        <Fld label="Title *">
          <input value={form.title} onChange={e => set('title', e.target.value)} style={selStyle}/>
        </Fld>
        <Fld label="Summary (2-3 sentences)">
          <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={3} style={{ ...selStyle, resize: 'vertical', fontFamily: 'inherit' }}/>
        </Fld>
        <Fld label="Body (optional, plain text or markdown)">
          <textarea value={form.body_markdown} onChange={e => set('body_markdown', e.target.value)} rows={6} style={{ ...selStyle, resize: 'vertical', fontFamily: 'inherit' }}/>
        </Fld>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Fld label="Authors (comma-separated)">
            <input value={form.authors} onChange={e => set('authors', e.target.value)} style={selStyle} placeholder="Alice Kim, Bob Lee"/>
          </Fld>
          <Fld label="Institution / publisher">
            <input value={form.institution} onChange={e => set('institution', e.target.value)} style={selStyle}/>
          </Fld>
          <Fld label="Published date (YYYY-MM-DD)">
            <input value={form.published_at} onChange={e => set('published_at', e.target.value)} style={selStyle}/>
          </Fld>
          <Fld label="Level (beginner/intermediate/advanced/certification)">
            <input value={form.level} onChange={e => set('level', e.target.value)} style={selStyle}/>
          </Fld>
        </div>

        <Fld label="Tags (comma-separated slugs)">
          <input value={form.tags} onChange={e => set('tags', e.target.value)} style={selStyle} placeholder="computer-vision, swarm, navigation"/>
        </Fld>
        <Fld label="External URL (original source)">
          <input value={form.external_url} onChange={e => set('external_url', e.target.value)} style={selStyle} placeholder="https://arxiv.org/abs/..."/>
        </Fld>
        <Fld label="Cover image URL (optional)">
          <input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} style={selStyle}/>
        </Fld>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 12 }}>
          <Fld label="Document URL (PDF / DOCX / YouTube / Vimeo — embeddable)">
            <input value={form.document_url} onChange={e => set('document_url', e.target.value)} style={selStyle}
                   placeholder="https://your-storage.com/paper.pdf or https://youtube.com/watch?v=..."/>
          </Fld>
          <Fld label="Type">
            <select value={form.document_type} onChange={e => set('document_type', e.target.value)} style={selStyle}>
              <option value="">auto-detect</option>
              <option value="pdf">pdf</option>
              <option value="docx">docx</option>
              <option value="youtube">youtube</option>
              <option value="vimeo">vimeo</option>
              <option value="html">html</option>
            </select>
          </Fld>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Fld label="Price min USD (hardware)">
            <input type="number" value={form.price_min_usd} onChange={e => set('price_min_usd', e.target.value)} style={selStyle}/>
          </Fld>
          <Fld label="Price max USD (hardware)">
            <input type="number" value={form.price_max_usd} onChange={e => set('price_max_usd', e.target.value)} style={selStyle}/>
          </Fld>
          <Fld label="Brand (hardware)">
            <input value={form.brand} onChange={e => set('brand', e.target.value)} style={selStyle}/>
          </Fld>
        </div>

        <Fld label="Specs (JSON object, hardware only)">
          <textarea value={form.spec} onChange={e => set('spec', e.target.value)} rows={4}
                    style={{ ...selStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 14 }}
                    placeholder='{"MCU":"STM32F7","Weight":"8g"}'/>
        </Fld>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onCancel} className="btn secondary" style={{ padding: '10px 18px', fontSize: 14 }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="btn"
                  style={{ padding: '10px 22px', fontSize: 14, opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving…' : (form.id ? 'Save' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Fld({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="mono" style={{ display: 'block', fontSize: 12, letterSpacing: '0.14em', color: 'var(--parchment-dim)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
