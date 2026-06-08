import React, { useState, useEffect } from 'react';
import Framework from './Framework.jsx';
import Playbook from './Playbook.jsx';
import Standards from './Standards.jsx';

export default function App() {
  const [view, setView] = useState('framework');
  const [fade, setFade] = useState(false);

  const go = (v) => {
    if (v === view) return;
    setFade(true);
    setTimeout(() => {
      setView(v);
      window.scrollTo(0, 0);
      setFade(false);
    }, 280);
  };

  // keep the document background in sync so overscroll never flashes white
  useEffect(() => {
    document.body.style.background = view === 'framework' ? '#F7F3EC' : '#FAFAF7';
  }, [view]);

  return (
    <div style={{ opacity: fade ? 0 : 1, transition: 'opacity .28s ease' }}>
      {view === 'framework' && <Framework onNavigate={go} />}
      {view === 'playbook' && <Playbook onNavigate={go} />}
      {view === 'standards' && <Standards onNavigate={go} />}
    </div>
  );
}
