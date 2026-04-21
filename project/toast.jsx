// toast.jsx — global toast notification system

const { useState: tUseState, useEffect: tUseEffect } = React;

function ToastStack() {
  const [toasts, setToasts] = tUseState([]);

  tUseEffect(() => {
    window.toast = (title, desc, kind = 'success') => {
      const id = Date.now() + Math.random();
      setToasts(ts => [...ts, { id, title, desc, kind, leaving: false }]);
      setTimeout(() => {
        setToasts(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 220);
      }, 4200);
    };
  }, []);

  const close = (id) => {
    setToasts(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 220);
  };

  const iconFor = (k) => {
    if (k === 'success') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l6 6L20 6"/></svg>;
    if (k === 'error') return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18"/></svg>;
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 8v5M12 17v0.01"/></svg>;
  };

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={'toast ' + t.kind + (t.leaving ? ' leaving' : '')}>
          <span className="toast-icon">{iconFor(t.kind)}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.desc && <div className="toast-desc">{t.desc}</div>}
          </div>
          <button className="toast-close" onClick={() => close(t.id)}><Ic.close/></button>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ToastStack });
