// src/pages/admin/ContentEditor.jsx
// Deep CMS content editor — every user-facing string on the site lives in
// site_content and can be edited here.
//
// Features:
//  • Category tree sidebar
//  • Full-text key + value search
//  • Type-aware inline editor (text / longtext / markdown / html / url / image / json)
//  • Create new key (with any category/type/value/description)
//  • Rename key, delete key
//  • Bulk edit mode
//  • Import/Export JSON (full content dump)
//  • Change tracking with un-saved diff indicator
//  • Audit-logs every save (via admin.js helpers)
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../../supabase';
import { logAction } from '../../db/admin';
import { useAllContent } from '../../content/ContentContext';

const TYPES = ['text','longtext','markdown','html','url','image','json'];

export function ContentEditor() {
  const { refresh: refreshGlobalContent } = useAllContent();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeCategory, setActiveCategory] = useState('__all__');
  const [edits, setEdits] = useState({});           // key -> {value, type, description, category}
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setToast({ type: 'error', msg: 'Could not load content: ' + e.message });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const categories = useMemo(() => {
    const map = new Map();
    for (const r of rows) map.set(r.category, (map.get(r.category) || 0) + 1);
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter(r => {
      if (activeCategory !== '__all__' && r.category !== activeCategory) return false;
      if (!qq) return true;
      return (
        r.key.toLowerCase().includes(qq) ||
        (r.value || '').toLowerCase().includes(qq) ||
        (r.description || '').toLowerCase().includes(qq)
      );
    });
  }, [rows, q, activeCategory]);

  const dirtyKeys = Object.keys(edits);
  const hasDirty = dirtyKeys.length > 0;

  const setDraft = (key, patch) => {
    setEdits(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };

  const cancelEdit = (key) => {
    setEdits(prev => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  const saveOne = async (row) => {
    const draft = edits[row.key];
    if (!draft) return;
    setBusy(true);
    try {
      const patch = {
        value: draft.value ?? row.value,
        type: draft.type ?? row.type,
        description: draft.description ?? row.description,
        category: draft.category ?? row.category,
      };
      const { error } = await supabase
        .from('site_content')
        .update(patch)
        .eq('key', row.key);
      if (error) throw error;
      await logAction('content.update', { key: row.key, patch });
      cancelEdit(row.key);
      setToast({ type: 'success', msg: `Saved ${row.key}` });
      await load();
      refreshGlobalContent();
    } catch (e) {
      setToast({ type: 'error', msg: 'Save failed: ' + e.message });
    } finally { setBusy(false); }
  };

  const saveAllDirty = async () => {
    setBusy(true);
    try {
      for (const key of dirtyKeys) {
        const row = rows.find(r => r.key === key);
        if (!row) continue;
        const draft = edits[key];
        const patch = {
          value: draft.value ?? row.value,
          type: draft.type ?? row.type,
          description: draft.description ?? row.description,
          category: draft.category ?? row.category,
        };
        const { error } = await supabase.from('site_content').update(patch).eq('key', key);
        if (error) throw error;
        await logAction('content.update', { key, patch });
      }
      setEdits({});
      setToast({ type: 'success', msg: `Saved ${dirtyKeys.length} keys` });
      await load();
      refreshGlobalContent();
    } catch (e) {
      setToast({ type: 'error', msg: 'Bulk save failed: ' + e.message });
    } finally { setBusy(false); }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} key(s)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const keys = Array.from(selected);
      const { error } = await supabase.from('site_content').delete().in('key', keys);
      if (error) throw error;
      await logAction('content.delete', { keys });
      setSelected(new Set());
      setToast({ type: 'success', msg: `Deleted ${keys.length} key(s)` });
      await load();
      refreshGlobalContent();
    } catch (e) {
      setToast({ type: 'error', msg: 'Delete failed: ' + e.message });
    } finally { setBusy(false); }
  };

  const renameKey = async (row) => {
    const next = window.prompt('New key name:', row.key);
    if (!next || next === row.key) return;
    setBusy(true);
    try {
      // Insert copy then delete old — PG doesn't allow UPDATE of PK via the SDK cleanly
      const copy = { ...row, key: next };
      delete copy.updated_at;
      delete copy.updated_by;
      const { error: e1 } = await supabase.from('site_content').insert(copy);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('site_content').delete().eq('key', row.key);
      if (e2) throw e2;
      await logAction('content.rename', { from: row.key, to: next });
      setToast({ type: 'success', msg: `Renamed to ${next}` });
      await load();
      refreshGlobalContent();
    } catch (e) {
      setToast({ type: 'error', msg: 'Rename failed: ' + e.message });
    } finally { setBusy(false); }
  };

  const createKey = async (form) => {
    if (!form.key) return setToast({ type: 'error', msg: 'Key required' });
    setBusy(true);
    try {
      const { error } = await supabase.from('site_content').insert({
        key: form.key,
        category: form.category || 'misc',
        type: form.type || 'text',
        value: form.value || '',
        description: form.description || null,
      });
      if (error) throw error;
      await logAction('content.create', { key: form.key });
      setShowNew(false);
      setToast({ type: 'success', msg: `Created ${form.key}` });
      await load();
      refreshGlobalContent();
    } catch (e) {
      setToast({ type: 'error', msg: 'Create failed: ' + e.message });
    } finally { setBusy(false); }
  };

  const exportJson = () => {
    const dump = rows.map(r => ({
      key: r.key, category: r.category, type: r.type,
      value: r.value, description: r.description,
    }));
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `droneicarus-content-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async () => {
    let parsed;
    try { parsed = JSON.parse(importText); }
    catch (e) { return setToast({ type: 'error', msg: 'Invalid JSON' }); }
    if (!Array.isArray(parsed)) return setToast({ type: 'error', msg: 'Expected an array' });
    setBusy(true);
    try {
      // Upsert each in turn
      for (const row of parsed) {
        if (!row.key) continue;
        const payload = {
          key: row.key,
          category: row.category || 'misc',
          type: row.type || 'text',
          value: row.value ?? '',
          description: row.description ?? null,
        };
        await supabase.from('site_content').upsert(payload, { onConflict: 'key' });
      }
      await logAction('content.import', { count: parsed.length });
      setShowImport(false);
      setImportText('');
      setToast({ type: 'success', msg: `Imported ${parsed.length} keys` });
      await load();
      refreshGlobalContent();
    } catch (e) {
      setToast({ type: 'error', msg: 'Import failed: ' + e.message });
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0, height: 'calc(100vh - 120px)', minHeight: 600 }}>
      {/* Sidebar: categories */}
      <aside style={{ borderRight: '1px solid var(--line)', padding: '16px 12px', overflowY: 'auto', background: 'var(--forest-950)' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--parchment-dim)', padding: '4px 8px 10px' }}>CATEGORIES</div>
        <CategoryBtn label={`All (${rows.length})`} active={activeCategory === '__all__'} onClick={() => setActiveCategory('__all__')} />
        {categories.map(([cat, n]) => (
          <CategoryBtn key={cat} label={`${cat} · ${n}`} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
        ))}
      </aside>

      {/* Main area */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: 14, borderBottom: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search key · value · description…"
            style={{ flex: 1, minWidth: 220, padding: '8px 12px', borderRadius: 4, border: '1px solid var(--line-strong)', background: 'var(--forest-900)', color: 'var(--bone)' }} />
          <button className="btn secondary" onClick={() => setShowNew(true)}>+ New key</button>
          <button className="btn secondary" onClick={exportJson}>Export JSON</button>
          <button className="btn secondary" onClick={() => setShowImport(true)}>Import JSON</button>
          {selected.size > 0 && (
            <button className="btn" style={{ background: '#c73e3e', color: '#fff' }} onClick={deleteSelected}>Delete ({selected.size})</button>
          )}
          {hasDirty && (
            <button className="btn primary" disabled={busy} onClick={saveAllDirty}>
              Save {dirtyKeys.length} change{dirtyKeys.length === 1 ? '' : 's'}
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, color: 'var(--parchment-dim)', textAlign: 'center' }}>Loading content…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, color: 'var(--parchment-dim)', textAlign: 'center' }}>No keys match.</div>
          ) : (
            filtered.map(row => (
              <ContentRow
                key={row.key}
                row={row}
                draft={edits[row.key]}
                selected={selected.has(row.key)}
                onSelect={(v) => {
                  setSelected(prev => {
                    const n = new Set(prev);
                    if (v) n.add(row.key); else n.delete(row.key);
                    return n;
                  });
                }}
                onChange={(patch) => setDraft(row.key, patch)}
                onCancel={() => cancelEdit(row.key)}
                onSave={() => saveOne(row)}
                onRename={() => renameKey(row)}
                busy={busy}
              />
            ))
          )}
        </div>
      </div>

      {/* New key modal */}
      {showNew && <NewKeyModal onClose={() => setShowNew(false)} onCreate={createKey} categories={categories.map(c => c[0])} />}
      {/* Import modal */}
      {showImport && (
        <Modal onClose={() => setShowImport(false)} title="Import content JSON">
          <p style={{ fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 10 }}>
            Paste a JSON array of <code>{'{ key, category, type, value, description }'}</code>. Existing keys are upserted.
          </p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={14}
            placeholder='[{"key":"header.logo","category":"header","type":"text","value":"DroneIcarus"}]'
            style={{ width: '100%', padding: 10, border: '1px solid var(--line-strong)', borderRadius: 4, background: 'var(--forest-900)', color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button className="btn secondary" onClick={() => setShowImport(false)}>Cancel</button>
            <button className="btn primary" disabled={busy || !importText.trim()} onClick={doImport}>Import</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          padding: '12px 18px', borderRadius: 4,
          background: toast.type === 'error' ? '#c73e3e' : 'var(--moss)',
          color: '#faf6ec', fontSize: 13, boxShadow: 'var(--shadow-lg)',
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

function CategoryBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '8px 10px', borderRadius: 4, fontSize: 13,
      background: active ? 'var(--forest-800)' : 'transparent',
      color: active ? 'var(--bone)' : 'var(--parchment)',
      marginBottom: 2,
    }}>{label}</button>
  );
}

function ContentRow({ row, draft, selected, onSelect, onChange, onCancel, onSave, onRename, busy }) {
  const cur = (f) => (draft && draft[f] !== undefined ? draft[f] : row[f]);
  const dirty = !!draft;
  const type = cur('type');
  return (
    <div style={{
      padding: 16, borderBottom: '1px solid var(--line)',
      background: dirty ? 'rgba(217,112,69,0.06)' : 'transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <input type="checkbox" checked={selected} onChange={e => onSelect(e.target.checked)} style={{ marginTop: 5 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <code style={{ fontSize: 12, color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.key}</code>
            <select value={type} onChange={e => onChange({ type: e.target.value })}
              style={{ fontSize: 11, padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 3, background: 'var(--forest-900)', color: 'var(--parchment-dim)' }}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={cur('category')} onChange={e => onChange({ category: e.target.value })}
              style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--line)', borderRadius: 3, background: 'var(--forest-900)', color: 'var(--parchment-dim)', width: 100 }} />
            <span style={{ flex: 1 }}/>
            <button onClick={onRename} style={{ fontSize: 11, color: 'var(--parchment-dim)', padding: '2px 6px' }}>rename</button>
            {dirty && <>
              <button onClick={onCancel} style={{ fontSize: 11, color: 'var(--parchment-dim)', padding: '2px 6px' }}>cancel</button>
              <button onClick={onSave} disabled={busy} className="btn primary" style={{ fontSize: 11, padding: '4px 10px' }}>Save</button>
            </>}
          </div>
          {row.description && (
            <div style={{ fontSize: 11, color: 'var(--parchment-dim)', marginBottom: 8, fontStyle: 'italic' }}>{row.description}</div>
          )}
          <ValueEditor type={type} value={cur('value') || ''} onChange={v => onChange({ value: v })} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <input value={cur('description') || ''} onChange={e => onChange({ description: e.target.value })}
              placeholder="Admin helper text…"
              style={{ flex: 1, fontSize: 11, padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 3, background: 'var(--forest-900)', color: 'var(--parchment-dim)' }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueEditor({ type, value, onChange }) {
  const base = {
    width: '100%', padding: '8px 12px', borderRadius: 4,
    border: '1px solid var(--line-strong)',
    background: 'var(--forest-900)', color: 'var(--bone)',
    fontFamily: type === 'json' || type === 'html' || type === 'markdown' ? 'var(--font-mono)' : 'inherit',
    fontSize: type === 'text' ? 14 : 12,
  };
  if (type === 'longtext' || type === 'markdown' || type === 'html' || type === 'json') {
    return <textarea value={value} onChange={e => onChange(e.target.value)} rows={type === 'json' ? 8 : 5} style={{ ...base, resize: 'vertical' }} />;
  }
  if (type === 'image') {
    return (
      <div>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://…/image.png" style={base}/>
        {value && <img src={value} alt="" style={{ marginTop: 8, maxWidth: 260, maxHeight: 120, border: '1px solid var(--line)', borderRadius: 4 }}/>}
      </div>
    );
  }
  return <input value={value} onChange={e => onChange(e.target.value)} style={base}/>;
}

function NewKeyModal({ onClose, onCreate, categories }) {
  const [form, setForm] = useState({ key: '', category: '', type: 'text', value: '', description: '' });
  return (
    <Modal onClose={onClose} title="Create new content key">
      <label style={lbl}>Key (dot.namespaced, e.g. header.btn.login)
        <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} style={inp}/>
      </label>
      <label style={lbl}>Category
        <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="cats" style={inp}/>
        <datalist id="cats">{categories.map(c => <option key={c} value={c}/>)}</datalist>
      </label>
      <label style={lbl}>Type
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label style={lbl}>Initial value
        <ValueEditor type={form.type} value={form.value} onChange={v => setForm({ ...form, value: v })}/>
      </label>
      <label style={lbl}>Admin description
        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inp}/>
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => onCreate(form)}>Create key</button>
      </div>
    </Modal>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 620, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto',
        background: 'var(--ink)', border: '1px solid var(--line-strong)',
        borderRadius: 8, padding: 22, color: 'var(--bone)',
      }}>
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 12, color: 'var(--parchment-dim)', marginBottom: 12 };
const inp = { display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', border: '1px solid var(--line-strong)', borderRadius: 4, background: 'var(--forest-900)', color: 'var(--bone)' };
