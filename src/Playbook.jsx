import React, { useState, useEffect } from 'react';

const CSS = `
  :root {
    --paper: #FAFAF7;
    --pb-ink: #1A1A1A;
    --rule: #E2DDD6;
    --amber: #B8860B;
    --amber-light: #D4A843;
    --amber-pale: #FFF8E8;
    --forest: #1B3A2D;
    --forest-light: #2D5C45;
    --red: #7A1E1E;
    --blue-ink: #1C2D4A;
    --mid: #5C5C52;
    --light-mid: #8C8C80;
  }

  .pb *, .pb *::before, .pb *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  .pb {
    background: var(--paper);
    color: var(--pb-ink);
    font-family: 'Lato', sans-serif;
    font-weight: 300;
    line-height: 1.7;
  }

  /* PROGRESS */
  .pb #prog {
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    background: var(--amber);
    z-index: 9000;
    transition: width 0.1s;
    width: 0%;
  }

  /* SIDEBAR TOC */
  .pb .toc {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 260px;
    background: var(--forest);
    padding: 48px 0;
    overflow-y: auto;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }
  .pb .toc-logo {
    padding: 0 32px 40px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 32px;
  }
  .pb .toc-logo-main {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: var(--amber-light);
    letter-spacing: 0.03em;
    line-height: 1.3;
  }
  .pb .toc-logo-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-top: 6px;
  }
  .pb .toc-back {
    display: inline-block;
    margin-top: 18px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    color: var(--amber);
    text-transform: uppercase;
    cursor: pointer;
    background: none;
    border: none;
    transition: color 0.2s;
  }
  .pb .toc-back:hover { color: var(--amber-light); }
  .pb .toc-section-head {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7px;
    letter-spacing: 0.3em;
    color: rgba(255,255,255,0.2);
    text-transform: uppercase;
    padding: 0 32px;
    margin: 24px 0 8px;
  }
  .pb .toc-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 32px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }
  .pb .toc-item:hover { background: rgba(255,255,255,0.05); }
  .pb .toc-item.active { background: rgba(184,134,11,0.12); border-right: 2px solid var(--amber); }
  .pb .toc-num {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: var(--amber);
    opacity: 0.6;
    width: 20px;
    flex-shrink: 0;
  }
  .pb .toc-label {
    font-size: 12px;
    color: rgba(255,255,255,0.55);
    line-height: 1.3;
    transition: color 0.2s;
  }
  .pb .toc-item:hover .toc-label,
  .pb .toc-item.active .toc-label { color: rgba(255,255,255,0.9); }

  /* MAIN CONTENT */
  .pb .main {
    margin-left: 260px;
    min-height: 100vh;
  }

  /* PLAYBOOK HEADER */
  .pb .pb-header {
    background: var(--blue-ink);
    padding: 80px 80px 80px;
    position: relative;
    overflow: hidden;
  }
  .pb .pb-header::after {
    content: 'PLAYBOOK';
    position: absolute;
    right: -20px; bottom: -40px;
    font-family: 'Playfair Display', serif;
    font-size: 180px;
    font-weight: 900;
    color: rgba(255,255,255,0.03);
    letter-spacing: -0.05em;
    line-height: 1;
    pointer-events: none;
  }
  .pb .pb-header-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.3em;
    color: var(--amber);
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .pb .pb-header h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 4vw, 58px);
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
    letter-spacing: -0.02em;
    max-width: 700px;
  }
  .pb .pb-header h1 em {
    font-style: italic;
    color: var(--amber-light);
  }
  .pb .pb-header p {
    margin-top: 24px;
    max-width: 560px;
    font-size: 14px;
    color: rgba(255,255,255,0.45);
    line-height: 1.8;
  }
  .pb .pb-meta {
    display: flex;
    gap: 48px;
    margin-top: 48px;
    padding-top: 32px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .pb .pb-meta-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .pb .pb-meta-val {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    color: var(--amber-light);
  }

  /* CONTENT SECTIONS */
  .pb .pb-section {
    padding: 80px;
    border-bottom: 1px solid var(--rule);
  }
  .pb .pb-section:nth-child(even) { background: #F5F3EE; }

  .pb .section-header {
    display: flex;
    align-items: flex-start;
    gap: 32px;
    margin-bottom: 56px;
  }
  .pb .section-num-block {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    background: var(--amber);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: #fff;
    letter-spacing: 0.05em;
  }
  .pb .section-sup {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.3em;
    color: var(--amber);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .pb .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 700;
    line-height: 1.15;
    color: var(--pb-ink);
  }

  /* BODY TEXT */
  .pb .pb-body {
    font-size: 14px;
    line-height: 1.9;
    color: var(--mid);
    max-width: 760px;
  }
  .pb .pb-body p { margin-bottom: 20px; }
  .pb .pb-body strong { color: var(--pb-ink); font-weight: 700; }
  .pb .pb-body em { font-style: italic; color: var(--amber); }

  /* CALLOUT BOX */
  .pb .callout {
    border-left: 3px solid var(--amber);
    padding: 24px 32px;
    background: var(--amber-pale);
    margin: 32px 0;
    max-width: 720px;
  }
  .pb .callout-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 10px;
  }
  .pb .callout p {
    font-size: 13px;
    color: var(--blue-ink);
    line-height: 1.7;
    margin: 0;
    font-style: italic;
  }

  .pb .callout-dark {
    background: var(--forest);
    border-left: 3px solid var(--amber);
    padding: 24px 32px;
    margin: 32px 0;
    max-width: 720px;
  }
  .pb .callout-dark .callout-label { color: var(--amber-light); }
  .pb .callout-dark p { color: rgba(255,255,255,0.75); font-style: normal; font-size: 13px; }

  /* STEP CARDS */
  .pb .steps {
    display: grid;
    gap: 3px;
    margin: 40px 0;
    max-width: 760px;
  }
  .pb .step {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 24px;
    background: #fff;
    padding: 28px 32px;
    align-items: start;
    border-left: 2px solid transparent;
    transition: border-color 0.3s;
  }
  .pb .step:hover { border-left-color: var(--amber); }
  .pb .step-n {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 22px;
    font-weight: 300;
    color: var(--amber);
    line-height: 1;
    padding-top: 2px;
  }
  .pb .step-title {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--pb-ink);
    margin-bottom: 8px;
  }
  .pb .step-desc { font-size: 13px; color: var(--mid); line-height: 1.7; }
  .pb .step-note {
    margin-top: 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: var(--amber);
    letter-spacing: 0.05em;
  }

  /* CONVERSATION SCRIPT */
  .pb .script-block {
    max-width: 760px;
    margin: 32px 0;
    border: 1px solid var(--rule);
    overflow: hidden;
  }
  .pb .script-header {
    background: var(--blue-ink);
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .pb .script-header span {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
  }
  .pb .script-header .script-title {
    color: var(--amber-light);
    font-size: 10px;
  }
  .pb .script-line {
    padding: 16px 24px;
    border-bottom: 1px solid var(--rule);
    font-size: 13px;
    line-height: 1.7;
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 20px;
  }
  .pb .script-line:last-child { border-bottom: none; }
  .pb .script-line.consultant { background: #fff; }
  .pb .script-line.client { background: #F9F8F5; }
  .pb .script-speaker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding-top: 2px;
    flex-shrink: 0;
  }
  .pb .script-line.consultant .script-speaker { color: var(--forest); }
  .pb .script-line.client .script-speaker { color: var(--mid); }
  .pb .script-text { color: var(--pb-ink); }
  .pb .script-line.consultant .script-text { color: var(--forest); font-weight: 400; }
  .pb .annotation {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: var(--amber);
    display: block;
    margin-top: 6px;
    font-style: italic;
  }

  /* CHECKLIST */
  .pb .checklist {
    max-width: 720px;
    margin: 32px 0;
  }
  .pb .check-group {
    margin-bottom: 32px;
  }
  .pb .check-group-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.25em;
    color: var(--amber);
    text-transform: uppercase;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--rule);
    margin-bottom: 16px;
  }
  .pb .check-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(226,221,214,0.5);
    font-size: 13px;
    color: var(--mid);
  }
  .pb .check-box {
    width: 18px; height: 18px;
    border: 1.5px solid var(--rule);
    flex-shrink: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
    transition: all 0.2s;
  }
  .pb .check-box:hover { border-color: var(--amber); }
  .pb .check-box.checked { background: var(--amber); border-color: var(--amber); }
  .pb .check-box.checked::after { content: '✓'; color: #fff; font-size: 10px; font-weight: 700; }
  .pb .check-text { line-height: 1.5; }

  /* FORMULA / EQUATION STYLE */
  .pb .formula {
    max-width: 720px;
    margin: 32px 0;
    padding: 32px 40px;
    background: var(--blue-ink);
    position: relative;
    overflow: hidden;
  }
  .pb .formula::before {
    content: 'f(x)';
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'Playfair Display', serif;
    font-size: 80px;
    font-style: italic;
    color: rgba(255,255,255,0.04);
  }
  .pb .formula-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.3em;
    color: var(--amber);
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .pb .formula-eq {
    font-family: 'Playfair Display', serif;
    font-size: clamp(16px, 2vw, 22px);
    font-style: italic;
    color: #fff;
    line-height: 1.5;
  }
  .pb .formula-eq strong { color: var(--amber-light); font-style: normal; }
  .pb .formula-desc {
    margin-top: 16px;
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    font-family: 'IBM Plex Mono', monospace;
    line-height: 1.8;
  }

  /* TWO-COL */
  .pb .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    max-width: 960px;
    margin: 32px 0;
  }

  /* RISK TABLE */
  .pb .risk-table {
    width: 100%;
    max-width: 760px;
    border-collapse: collapse;
    margin: 32px 0;
    font-size: 13px;
  }
  .pb .risk-table th {
    background: var(--pb-ink);
    color: #fff;
    padding: 12px 20px;
    text-align: left;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 400;
  }
  .pb .risk-table td {
    padding: 14px 20px;
    border-bottom: 1px solid var(--rule);
    color: var(--mid);
    vertical-align: top;
    line-height: 1.6;
  }
  .pb .risk-table tr:hover td { background: var(--amber-pale); }
  .pb .risk-table td:first-child { color: var(--pb-ink); font-weight: 400; }
  .pb .pill {
    display: inline-block;
    padding: 2px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.05em;
    border-radius: 0;
  }
  .pb .pill-high { background: rgba(122,30,30,0.1); color: var(--red); }
  .pb .pill-med { background: rgba(184,134,11,0.1); color: var(--amber); }
  .pb .pill-low { background: rgba(27,58,45,0.1); color: var(--forest); }

  /* TIMELINE */
  .pb .timeline {
    max-width: 760px;
    margin: 40px 0;
    position: relative;
  }
  .pb .timeline::before {
    content: '';
    position: absolute;
    left: 32px; top: 0; bottom: 0;
    width: 1px;
    background: var(--rule);
  }
  .pb .tl-item {
    display: flex;
    gap: 32px;
    margin-bottom: 32px;
    position: relative;
  }
  .pb .tl-dot {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--amber);
    flex-shrink: 0;
    margin-top: 4px;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 0 4px var(--paper);
    margin-left: 24px;
  }
  .pb .tl-content { flex: 1; }
  .pb .tl-phase {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    color: var(--amber);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .pb .tl-title {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--pb-ink);
    margin-bottom: 8px;
  }
  .pb .tl-desc {
    font-size: 13px;
    color: var(--mid);
    line-height: 1.7;
  }
  .pb .tl-tasks {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pb .tl-task {
    background: #fff;
    border: 1px solid var(--rule);
    padding: 4px 12px;
    font-size: 11px;
    font-family: 'IBM Plex Mono', monospace;
    color: var(--mid);
  }

  /* KPI CARDS */
  .pb .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
    margin: 32px 0;
    max-width: 900px;
  }
  .pb .kpi-card {
    background: var(--forest);
    padding: 32px 24px;
    text-align: center;
  }
  .pb .kpi-card:nth-child(2) { background: var(--amber); }
  .pb .kpi-card:nth-child(2) .kpi-val { color: #fff; }
  .pb .kpi-card:nth-child(2) .kpi-label { color: rgba(255,255,255,0.7); }
  .pb .kpi-val {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 700;
    color: var(--amber-light);
    line-height: 1;
    margin-bottom: 8px;
  }
  .pb .kpi-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    line-height: 1.4;
  }

  /* FOOTER */
  .pb .pb-footer {
    background: var(--pb-ink);
    padding: 64px 80px;
    margin-left: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .pb .pb-footer-left {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-style: italic;
    color: rgba(255,255,255,0.3);
    max-width: 500px;
    line-height: 1.5;
  }
  .pb .pb-footer-right {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.15);
    text-align: right;
    line-height: 2;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .pb .toc { display: none; }
    .pb .main { margin-left: 0; }
    .pb .pb-header, .pb .pb-section { padding: 48px 32px; }
    .pb .two-col { grid-template-columns: 1fr; }
    .pb .kpi-row { grid-template-columns: 1fr 1fr; }
    .pb .pb-footer { flex-direction: column; gap: 32px; padding: 48px 32px; }
  }
`;

const toc = [
  { group: 'Foundation', items: [['01', 'The Core Value Formula', 's1'], ['02', 'Client Discovery Protocol', 's2']] },
  { group: 'Execution', items: [['03', 'Research Methodology', 's3'], ['04', 'Writing for Decision-Makers', 's4'], ['05', 'Conversation Scripts', 's5']] },
  { group: 'Growth', items: [['06', 'Fee Positioning', 's6'], ['07', '90-Day Rollout Plan', 's7'], ['08', 'KPIs & Success Metrics', 's8'], ['09', 'Risk & Pitfalls', 's9']] },
];

const SectionHeader = ({ num, sup, title }) => (
  <div className="section-header">
    <div className="section-num-block">{num}</div>
    <div className="section-title-block">
      <div className="section-sup">{sup}</div>
      <div className="section-title">{title}</div>
    </div>
  </div>
);

const Step = ({ n, title, desc, note }) => (
  <div className="step">
    <div className="step-n">{n}</div>
    <div className="step-body">
      <div className="step-title">{title}</div>
      <div className="step-desc">{desc}</div>
      {note && <div className="step-note">{note}</div>}
    </div>
  </div>
);

const Check = ({ children }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="check-item">
      <div className={'check-box' + (checked ? ' checked' : '')} onClick={() => setChecked((c) => !c)} />
      <div className="check-text">{children}</div>
    </div>
  );
};

export default function Playbook({ onNavigate }) {
  useEffect(() => {
    const ids = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const bar = document.getElementById('prog');
      if (bar) bar.style.width = (scrollTop / docHeight) * 100 + '%';

      ids.forEach((id) => {
        const el = document.getElementById(id);
        const link = document.querySelector(`.pb .toc-item[data-target="${id}"]`);
        if (!el || !link) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          document.querySelectorAll('.pb .toc-item').forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pb">
      <style>{CSS}</style>
      <div id="prog" />

      {/* SIDEBAR TOC */}
      <nav className="toc">
        <div className="toc-logo">
          <div className="toc-logo-main">The Advisory<br />Playbook</div>
          <div className="toc-logo-sub">Internal · Confidential</div>
          <button className="toc-back" onClick={() => onNavigate('framework')}>← Part I — The Framework</button>
        </div>
        {toc.map((grp) => (
          <React.Fragment key={grp.group}>
            <div className="toc-section-head">{grp.group}</div>
            {grp.items.map(([num, label, id], i) => (
              <a
                key={id}
                className={'toc-item' + (grp.group === 'Foundation' && i === 0 ? ' active' : '')}
                data-target={id}
                onClick={(e) => { e.preventDefault(); goTo(id); }}
                href={'#' + id}
              >
                <span className="toc-num">{num}</span>
                <span className="toc-label">{label}</span>
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {/* MAIN */}
      <div className="main">

        {/* HEADER */}
        <div className="pb-header">
          <div className="pb-header-tag">Part II — Implementation Playbook</div>
          <h1>How to <em>build, sell, and deliver</em> the Needs-Based Advisory Report</h1>
          <p>The first document defined what the report should be. This playbook defines how to create it, how to sell it, how to price it, and how to measure whether it is transforming your practice. Every section is operational — not theoretical.</p>
          <div className="pb-meta">
            <div className="pb-meta-item">
              <div className="pb-meta-label">Document Type</div>
              <div className="pb-meta-val">Internal Playbook</div>
            </div>
            <div className="pb-meta-item">
              <div className="pb-meta-label">Audience</div>
              <div className="pb-meta-val">Senior Consultants</div>
            </div>
            <div className="pb-meta-item">
              <div className="pb-meta-label">Chapters</div>
              <div className="pb-meta-val">9 Sections</div>
            </div>
          </div>
        </div>

        {/* SECTION 1 */}
        <div className="pb-section" id="s1">
          <SectionHeader num="01" sup="Foundation" title="The Core Value Formula: Why Clients Pay More for Insight Than Data" />
          <div className="pb-body">
            <p>The chairman's observation contains a precise economic truth: <strong>compliance is a cost centre; advice is an investment.</strong> Clients who perceive a report as a cost will minimise that cost. Clients who perceive a report as an investment will maximise the return on that investment. Your entire commercial strategy hinges on shifting every client from the first mental model to the second.</p>
            <p>This is not about packaging or design. It is about the fundamental question the report is written to answer. A compliance report answers: <em>"What does the market look like?"</em> An advisory report answers: <em>"Given what the market looks like, what should this client do, and why?"</em> The second question is worth orders of magnitude more.</p>
            <div className="formula">
              <div className="formula-label">The Advisory Value Equation</div>
              <div className="formula-eq"><strong>Report Value</strong> = (Decision Quality Improvement × Stake of Decision) × Consultant Credibility</div>
              <div className="formula-desc">
                — Decision Quality Improvement: how much better a decision is made with vs. without the report<br />
                — Stake of Decision: the capital, risk, or opportunity at stake in the client's decision<br />
                — Consultant Credibility: the client's confidence in the advisor's experience and judgment
              </div>
            </div>
            <p>When a developer is deciding whether to deploy RM 200 million into a mixed-use development, a report that genuinely improves the quality of that decision by even 5% is worth RM 10 million in avoided mistakes or captured upside. Against that, a fee of RM 150,000 is not expensive — it is cheap. Your fee conversation must always be anchored to the stake of the decision, never to the effort of producing the report.</p>
          </div>
          <div className="callout">
            <div className="callout-label">Practitioner Principle</div>
            <p>"Never price your reports against the cost of producing them. Price them against the value of the decision they enable. If you cannot articulate what a good decision is worth to this client, you are not yet ready to write the report."</p>
          </div>
          <div className="pb-body">
            <p><strong>The three levers of perceived value:</strong> Your report commands a premium when it is demonstrably <em>specific</em> (written for this client's exact situation, not adapted from a template), <em>authoritative</em> (backed by primary research, named sources, and consultant opinion with clear rationale), and <em>actionable</em> (concludes with recommendations the client can execute, not observations they must interpret). All three must be present. Two out of three is not enough to justify a premium.</p>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="pb-section" id="s2">
          <SectionHeader num="02" sup="Foundation" title="Client Discovery Protocol: Diagnosing the Real Problem Before Writing a Word" />
          <div className="pb-body">
            <p>The needs-based report begins before the research does. It begins with a structured discovery session whose sole purpose is to understand what the client <strong>actually</strong> needs — which is almost never identical to what they initially ask for. A client who says "I need a market study for my land in Subang" may actually need help deciding between three development concepts, or convincing a joint-venture partner, or understanding whether now is the right time to launch at all.</p>
            <p>The discovery session is not optional. It is the diagnostic that determines whether you write a generic report or a relevant one. It is also where you establish your authority as an advisor rather than a vendor.</p>
          </div>
          <div className="steps">
            <Step n="1" title="The Briefing Request" desc={'Before accepting any instruction, request a 45-minute discovery call. Frame it as: "We work differently from most firms — before we scope the work, we need to understand the decision you\'re trying to make, not just the report you think you need." This framing immediately signals that you are a different kind of firm.'} note="→ Tool: Discovery call agenda template (see Section 5 Scripts)" />
            <Step n="2" title="The Objective Peel" desc={'Ask "What is this report for?" then ask "And if the report tells you that — then what?" three times. Each layer reveals the real objective beneath the stated one. A client who wants "market pricing data" may actually be building a case to their board for a higher price point. The board case is the real deliverable.'} note="→ Apply the 5-Whys framework from manufacturing diagnostics" />
            <Step n="3" title="The Decision Mapping" desc="Map every decision the client will make using this report: What is the go/no-go decision? Who makes it? What would change their mind? What is the timing? This map becomes the structure of your report — every chapter answers one of these decision questions directly." />
            <Step n="4" title="The Assumption Audit" desc="Ask the client what they already believe about the market and their project. Document these assumptions explicitly. Your report should either validate, challenge, or refine each one. A report that only confirms what the client already thinks is low value. A report that professionally challenges a wrong assumption is transformative — and memorable." />
            <Step n="5" title="The Scope Confirmation Letter" desc="After the discovery call, send a one-page confirmation letter restating: (a) the real objective you diagnosed, (b) the three key questions the report will answer, (c) what is explicitly out of scope. This letter is the contract of intent. It prevents scope creep and forces the client to confirm you understood correctly — or correct you before work begins." note="→ This letter is a differentiator. External research houses never send one." />
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="pb-section" id="s3">
          <SectionHeader num="03" sup="Execution" title="Research Methodology: Building an Evidence Architecture That Withstands Scrutiny" />
          <div className="pb-body">
            <p>The quality of your conclusions is only as strong as the evidence beneath them. Sophisticated clients — developers, institutional investors, family offices — will interrogate your findings. Your methodology must be explicit, transparent, and defensible. This is not bureaucratic box-ticking; it is how you demonstrate that your recommendations are grounded in rigorous analysis rather than intuition alone.</p>
          </div>
          <div className="two-col">
            <div>
              <div className="callout-dark">
                <div className="callout-label">Primary Research (Non-Negotiable)</div>
                <p>Primary research is what separates you from every research house that reads the same secondary sources. It is your proprietary data advantage — and it justifies your premium.</p>
              </div>
              <div className="steps" style={{ marginTop: 0 }}>
                <Step n="▸" title="Developer & Agent Interviews" desc="Minimum 8–12 structured interviews with active developers and agents in the micro-market. Extract: actual achieved prices (not asking prices), real absorption timelines, buyer profiles, and negotiation dynamics. This data does not exist in any published source." />
                <Step n="▸" title="Mystery Shopping" desc="Physical visits to all competing showrooms with structured scoring of product quality, sales team capability, pricing presentation, and buyer demographics present. Photographs, floor plan collection, and pricing sheets as evidence." />
                <Step n="▸" title="End-User Focus Groups" desc="For major projects: 2 structured focus groups with target buyer profiles (8–10 participants each). Tests price sensitivity, product preferences, and brand perceptions. Qualitative data that contextualises the quantitative." />
              </div>
            </div>
            <div>
              <div className="callout-dark">
                <div className="callout-label">Secondary Research (The Foundation)</div>
                <p>Efficiently assembled secondary data provides the structural scaffolding on which primary insights are hung. Never skip, but never rely on it alone.</p>
              </div>
              <div className="steps" style={{ marginTop: 0 }}>
                <Step n="▸" title="Transaction Registers" desc="NAPIC, JPPH, and private data providers. Analyse at sub-district level, not state level. Three-year trend minimum. Flag data vintage explicitly — transaction data is 6–12 months lagged." />
                <Step n="▸" title="Pipeline Research" desc="Local authority planning applications, developer announcements, press monitoring, and agent network intelligence. Distinguish confirmed, under-construction, and speculative pipeline — treat each differently in your analysis." />
                <Step n="▸" title="Macro Data Sources" desc="BNM Economic Bulletin, DOSM population and income data, EPU national development plans, and relevant state structure plans. Always interpret, never just report." />
              </div>
            </div>
          </div>
          <div className="callout">
            <div className="callout-label">The Confidence Rating System — Applied</div>
            <p>Every data point in the report carries a transparent confidence rating: <strong>High</strong> (primary research + corroborated by secondary), <strong>Medium</strong> (secondary data only, recently published), or <strong>Indicative</strong> (inference from limited data, expert opinion, or extrapolation). This honesty builds trust far more than false certainty. Clients who see you flag uncertainty respect your certainty far more when you express it.</p>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="pb-section" id="s4">
          <SectionHeader num="04" sup="Execution" title="Writing for Decision-Makers: The Language and Structure of Authority" />
          <div className="pb-body">
            <p>Most consultancy reports are written to demonstrate effort. Needs-based advisory reports are written to drive decisions. This requires a complete change in writing philosophy — from comprehensive to curated, from descriptive to prescriptive, from passive to owned.</p>
            <p><strong>The three writing rules for advisory reports:</strong></p>
          </div>
          <div className="steps">
            <Step n="I" title="Lead with the Conclusion, Build the Case After" desc="Every section opens with the finding or recommendation. The supporting data follows. Decision-makers read the opening line of every section and skim the rest. If your conclusion is buried on page 47, it will not be read. Write every section as if the client only has 30 seconds for it — because sometimes, they do." note={'→ Wrong: "The following section analyses supply and demand…" → Right: "Supply is tightening. Here is why that matters for your launch timing."'} />
            <Step n="II" title="Own Your Opinions — Mark Them Clearly" desc={'Use a distinct typographic treatment (a coloured left-bar or "Advisory Opinion" heading) for passages that represent the consultant\'s professional judgment as distinct from reported data. Clients pay for your opinion. If they cannot find it in the report, the report has failed. Never hide behind passive voice or hedged language when you have a clear view.'} note={'→ Wrong: "It could be argued that…" → Right: "[Advisory Opinion] Our view is that pricing above RM 850 psf in this micro-market is premature until the MRT opens in Q3 2026."'} />
            <Step n="III" title={'The "So What?" Test — Applied to Every Paragraph'} desc={'After writing every paragraph, ask: "So what does this mean for the client\'s decision?" If you cannot answer that question in one sentence, rewrite or cut the paragraph. Data that does not connect to a decision is filler. Filler destroys credibility because it signals that you do not know what matters.'} />
          </div>
          <div className="callout-dark" style={{ maxWidth: 720 }}>
            <div className="callout-label">Language Standard for Advisory Reports</div>
            <p style={{ marginBottom: 12 }}><strong style={{ color: 'var(--amber-light)' }}>Avoid:</strong> "It is noted that…" / "The market has shown signs of…" / "Consideration should be given to…" / "It is possible that…"</p>
            <p><strong style={{ color: 'var(--amber-light)' }}>Use:</strong> "The market is…" / "We recommend…" / "This project should…" / "Our analysis confirms that…" / "The critical risk is…"</p>
          </div>
        </div>

        {/* SECTION 5 */}
        <div className="pb-section" id="s5">
          <SectionHeader num="05" sup="Execution" title="Conversation Scripts: Selling the Advisory Report in the Room" />
          <div className="pb-body">
            <p>The premium report sells itself on the page. But first you have to get the client to commission it. These scripts are for the most common and most difficult conversations you will have — how to move a client from compliance mindset to investment mindset, how to handle fee objections, and how to present findings so they land with impact.</p>
          </div>

          <div className="script-block">
            <div className="script-header">
              <span className="script-title">Script 01 — The Discovery Call Opener</span>
              <span>When: First contact or briefing call</span>
            </div>
            <div className="script-line client">
              <span className="script-speaker">Client</span>
              <span className="script-text">"We need a market study for our site in [location]. Can you give us a proposal?"</span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Absolutely, we can do that. Before I put a scope together, I want to make sure we write the right report for you — not just any market study. Can I ask: what decision will this report help you make? Because that changes everything about what we research and how we structure the findings."
                <span className="annotation">↳ This single question reframes the entire engagement from "order-taking" to "diagnostic"</span>
              </span>
            </div>
            <div className="script-line client">
              <span className="script-speaker">Client</span>
              <span className="script-text">"We're trying to decide whether to develop residential or do a commercial component as well. And we need to know what to price at."</span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Good — so you actually have two decisions: the product mix, and the pricing strategy. Those are quite different research questions. What's your current thinking on the mix? I want to understand your working hypothesis before we start, because our job is to either validate it with evidence or challenge it with better information."
                <span className="annotation">↳ Establishing authority: you are the diagnostician, not the order-taker</span>
              </span>
            </div>
          </div>

          <div className="script-block">
            <div className="script-header">
              <span className="script-title">Script 02 — The Fee Objection</span>
              <span>When: Client pushes back on price</span>
            </div>
            <div className="script-line client">
              <span className="script-speaker">Client</span>
              <span className="script-text">"Your fee is much higher than other firms we've spoken to. Another firm quoted us RM 20,000 for the same thing."</span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"I understand, and I want to be direct with you. What they will deliver is a market overview — data on what the market looks like today. What we deliver is a recommendation on what you should do and why, backed by primary research we conduct specifically for your project. These are genuinely different products."
                <span className="annotation">↳ Never apologise for or negotiate away the premium. Explain the difference.</span>
              </span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Let me ask you this: what is the value of the decision you're trying to make? If your development is worth RM 150 million and our report helps you position the product correctly from the start — avoiding a mispriced launch — what is that worth to you? Our fee needs to be evaluated against that, not against a cheaper report that won't answer the question you actually have."
                <span className="annotation">↳ Anchor the fee to the decision value, never to the report production cost</span>
              </span>
            </div>
          </div>

          <div className="script-block">
            <div className="script-header">
              <span className="script-title">Script 03 — The Findings Presentation Opening</span>
              <span>When: Delivering the report in a boardroom session</span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Before we go through the full report, I want to start with the three things that matter most — because everything else in the report either explains, qualifies, or supports these three points. The first one will probably surprise you."
                <span className="annotation">↳ Open with intrigue. Never open with "Our methodology was…" or "We researched…"</span>
              </span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Finding One: the market can absorb your product — but only if you reposition the product specification. Here's what we found when we mystery-shopped your direct competitors last month..."
                <span className="annotation">↳ Specific, dated, primary research. Immediately establishes you have information they don't.</span>
              </span>
            </div>
          </div>

          <div className="script-block">
            <div className="script-header">
              <span className="script-title">Script 04 — Upselling to the Retainer</span>
              <span>When: Post-delivery relationship conversation</span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Now that the report is delivered and you're moving into the execution phase, I want to flag something. The market conditions we documented will shift over the next 12 months — particularly around the new pipeline and the interest rate cycle. The decisions you'll make at your launch will need to be recalibrated against what the market looks like then, not what it looks like now."</span>
            </div>
            <div className="script-line consultant">
              <span className="script-speaker">Consultant</span>
              <span className="script-text">"Our Market Intelligence Partner retainer gives you ongoing access to us as your market intelligence function — quarterly updates, ad hoc briefs when you need to move fast, and a dedicated analyst who knows your project. Think of it as having your own market research team, without the overhead."
                <span className="annotation">↳ Position the retainer as a team, not a subscription. It's a capability, not a product.</span>
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 6 */}
        <div className="pb-section" id="s6">
          <SectionHeader num="06" sup="Growth" title="Fee Positioning: Moving from Cost to Investment in the Client's Mind" />
          <div className="pb-body">
            <p>Fee strategy is not just about what you charge — it is about how the client thinks about what they are buying. Three principles govern premium fee positioning in advisory work:</p>
          </div>
          <div className="steps">
            <Step n="A" title="Anchor to Decision Stake, Not to Hours" desc="Never present your fee as a time-and-materials calculation. Fees should be presented as a fixed engagement price tied to the scope and the complexity of the decision being made — not the hours your team will spend. A RM 200M development decision warrants a materially higher fee than a RM 20M one, even if the research effort is similar. Charge accordingly." />
            <Step n="B" title="Price in Tiers, Not as a Single Number" desc="Always present three options: Foundation, Flagship, and Partner. The Flagship is your recommended product — and presenting it alongside a lesser option makes the premium feel proportionate rather than arbitrary. Clients who see only one price will negotiate it. Clients who see three options will choose between them." />
            <Step n="C" title="Name the Cost of a Bad Decision" desc={'In your proposal, include a single line: "The cost of a mispriced launch in this market typically represents 8–15% of gross development value in unsold inventory, extended sales periods, and price reductions. Our fee represents a small fraction of that risk." This is not hyperbole — it is a factual statement that reframes your fee as insurance, not an expense.'} />
          </div>
          <div className="checklist">
            <div className="check-group">
              <div className="check-group-title">Pre-Proposal Checklist — Before You Submit Any Fee</div>
              <Check>Have I identified the real decision this report must serve?</Check>
              <Check>Do I know who the ultimate decision-maker is, and what will convince them?</Check>
              <Check>Have I estimated the stake of the decision (GDV, land cost, investment size)?</Check>
              <Check>Is my fee less than 0.2% of the decision stake? (If so, it is defensibly priced.)</Check>
              <Check>Have I presented three tiers, not a single fee?</Check>
              <Check>Does my proposal include primary research (interviews, mystery shopping, focus groups)?</Check>
              <Check>Is the scope confirmation letter drafted and ready to send post-discovery?</Check>
            </div>
          </div>
        </div>

        {/* SECTION 7 */}
        <div className="pb-section" id="s7">
          <SectionHeader num="07" sup="Growth" title="90-Day Rollout Plan: From Framework to Practice" />
          <div className="pb-body">
            <p>Transforming your practice from compliance-driven to needs-based advisory is not a rebrand. It is an operational change that requires new processes, new proposal formats, new internal review standards, and a cultural shift in how your team approaches every client engagement. This is the 90-day plan to make it real.</p>
          </div>
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-dot" />
              <div className="tl-content">
                <div className="tl-phase">Days 1–14 · Foundation</div>
                <div className="tl-title">Build the Operational Infrastructure</div>
                <div className="tl-desc">Create the internal tools, templates, and standards that make needs-based delivery consistent and replicable across your team — not dependent on one senior consultant's personal approach.</div>
                <div className="tl-tasks">
                  {['Discovery call agenda template', 'Scope confirmation letter format', '9-chapter report master template (InDesign)', 'Primary research protocols', 'Confidence rating guidelines', 'Fee tier proposal template'].map((t) => <div className="tl-task" key={t}>{t}</div>)}
                </div>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-dot" />
              <div className="tl-content">
                <div className="tl-phase">Days 15–30 · Capability</div>
                <div className="tl-title">Train the Team on Advisory Delivery</div>
                <div className="tl-desc">Run internal workshops on the discovery protocol, the writing standards, and the fee conversation scripts. Conduct mock discovery calls with role-play. Every senior consultant must be able to conduct a diagnostic session without notes before client-facing work begins.</div>
                <div className="tl-tasks">
                  {['Discovery session workshop', 'Writing for decision-makers training', 'Fee conversation role-play', 'Report design standard briefing'].map((t) => <div className="tl-task" key={t}>{t}</div>)}
                </div>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-dot" />
              <div className="tl-content">
                <div className="tl-phase">Days 31–60 · Proof of Concept</div>
                <div className="tl-title">Deliver One Flagship Report as the Benchmark</div>
                <div className="tl-desc">Select one existing or incoming client for the full Flagship Report treatment. Pull your best team. Spare no effort on the primary research and the design. This report becomes your credentials piece — the proof that the new methodology delivers. Use it in every new business meeting.</div>
                <div className="tl-tasks">
                  {['Select benchmark client', 'Conduct full primary research', 'Apply 9-chapter structure', 'Premium design production', 'Deliver with strategy session'].map((t) => <div className="tl-task" key={t}>{t}</div>)}
                </div>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-dot" />
              <div className="tl-content">
                <div className="tl-phase">Days 61–90 · Market Positioning</div>
                <div className="tl-title">Tell the Market You've Changed</div>
                <div className="tl-desc">Brief your existing client base on the new approach. Host a private client event presenting market insights (demonstrating the new depth). Update credentials. Brief your referral network. Begin systematically upgrading all incoming proposals from compliance-report quotes to advisory-engagement proposals.</div>
                <div className="tl-tasks">
                  {['Client briefing letters', 'Credentials deck refresh', 'Private insights breakfast event', 'LinkedIn positioning content', 'Referral network briefings'].map((t) => <div className="tl-task" key={t}>{t}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8 */}
        <div className="pb-section" id="s8">
          <SectionHeader num="08" sup="Growth" title="KPIs & Success Metrics: How You Know the Transformation Is Working" />
          <div className="pb-body">
            <p>What you do not measure, you cannot improve. These are the metrics that will tell you, within 12 months, whether the shift to needs-based advisory is generating the commercial and market-share results your chairman envisions.</p>
          </div>
          <div className="kpi-row">
            {[['3×', 'Target fee premium vs. compliance report baseline'], ['60%', 'Target repeat engagement rate from advisory clients'], ['40%', 'Target proportion of revenue from retainer relationships'], ['8+', 'NPS target score from Flagship Report clients']].map(([v, l]) => (
              <div className="kpi-card" key={l}>
                <div className="kpi-val">{v}</div>
                <div className="kpi-label">{l}</div>
              </div>
            ))}
          </div>
          <div className="pb-body">
            <p><strong>Leading indicators</strong> (measure monthly): discovery call conversion rate, average proposal value, proportion of proposals featuring primary research commitment, number of scope confirmation letters sent.</p>
            <p><strong>Lagging indicators</strong> (measure quarterly): average revenue per client, repeat engagement rate, referral rate, fee realisation vs. proposal value, number of retainer relationships active.</p>
          </div>
          <div className="callout">
            <div className="callout-label">The Most Important Metric of All</div>
            <p>Track how many of your clients use your report in a boardroom presentation or strategic decision within 90 days of delivery. A report that is used is a report that worked. A report that is filed is a compliance document. Aim for 80% usage rate on Flagship Reports — and ask clients directly: "How did you use the report?"</p>
          </div>
        </div>

        {/* SECTION 9 */}
        <div className="pb-section" id="s9">
          <SectionHeader num="09" sup="Risk Management" title="Risks & Pitfalls: What Will Go Wrong and How to Handle It" />
          <div className="pb-body">
            <p>Every practice transformation carries risk. These are the most common failure modes in the shift from compliance to advisory, and the mitigation for each.</p>
          </div>
          <table className="risk-table">
            <thead>
              <tr><th>Risk</th><th>Severity</th><th>What Goes Wrong</th><th>Mitigation</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Advisory overreach</td>
                <td><span className="pill pill-high">High</span></td>
                <td>Making a confident recommendation that proves wrong. Client suffers a financial loss they attribute to your advice.</td>
                <td>Always express confidence levels explicitly. Recommend decisions, not execute them. Include the advisory disclaimer clearly in scope letters.</td>
              </tr>
              <tr>
                <td>Internal resistance</td>
                <td><span className="pill pill-med">Medium</span></td>
                <td>Senior consultants who built careers on the old model resist the new approach, especially the primary research requirements and writing standards.</td>
                <td>Mandate the new standards from leadership. Make the benchmark report success visible. Tie performance reviews to advisory output quality metrics.</td>
              </tr>
              <tr>
                <td>Discovery scope creep</td>
                <td><span className="pill pill-med">Medium</span></td>
                <td>Client discovery reveals a far larger problem than originally briefed, expanding scope beyond what the agreed fee supports.</td>
                <td>The scope confirmation letter is non-negotiable. Any scope expansion triggers a revised fee. Sell this to clients as a feature: "Our diagnostic process protects you from paying for research you don't need."</td>
              </tr>
              <tr>
                <td>Premium price resistance</td>
                <td><span className="pill pill-med">Medium</span></td>
                <td>Clients accustomed to RM 15,000–25,000 reports baulk at Flagship pricing and revert to cheaper competitors.</td>
                <td>Segment your client base. Not every client is ready for advisory. Let compliance clients go to competitors. Focus premium positioning on developers with projects above RM 50M GDV.</td>
              </tr>
              <tr>
                <td>Recommendation rejection</td>
                <td><span className="pill pill-low">Low</span></td>
                <td>Client receives a recommendation that challenges their existing plan and rejects the entire report rather than updating their thinking.</td>
                <td>Frame all recommendations as scenario-dependent in the briefing session. Never ambush a client with a contrary finding — signal it early ("Our research has surfaced something important you'll want to discuss").</td>
              </tr>
              <tr>
                <td>Data lag misrepresentation</td>
                <td><span className="pill pill-high">High</span></td>
                <td>Secondary data used in the report is older than the client realises, leading to decisions based on a market that no longer exists.</td>
                <td>The Assumptions Register in the Appendix must include the data vintage for every key dataset. Primary research is dated to the week of fieldwork. Never present lagged data as current without a clear flag.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="pb-footer">
          <div className="pb-footer-left">"The market already has firms that can tell clients what is happening. Build the firm that tells them what to do about it."</div>
          <div className="pb-footer-right">
            Internal Strategic Document<br />
            The Advisory Playbook · Part II<br />
            Not For Client Distribution<br />
            © Your Consultancy · All Rights Reserved
          </div>
        </div>

      </div>
    </div>
  );
}
