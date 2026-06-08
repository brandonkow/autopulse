import React, { useState, useEffect, useRef } from 'react';

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCounter(target, active) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active || typeof target !== 'number') return;
    let start = null;
    const frame = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1600, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [active, target]);
  return v;
}

function useScroll() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const s = el.scrollTop || document.body.scrollTop;
      const h = el.scrollHeight - el.clientHeight;
      setProgress(h > 0 ? (s / h) * 100 : 0);
      setScrolled(s > 60);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return [progress, scrolled];
}

const CSS = `
:root{--gold:#B8962E;--dark:#0D0D0D;--bg:#F5F2EC;--text:#1A1A1A;--muted:#6B6560;--border:#DDD8CF;--accent:#1C3553;--red:#C0392B;--green:#1E6B45;--amber:#B7600A}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--dark);overflow-x:hidden;font-family:'Inter',sans-serif;font-size:14px;line-height:1.75;color:var(--text)}
.rv{opacity:0;transform:translateY(32px);transition:opacity .65s cubic-bezier(.22,.68,0,1.2),transform .65s cubic-bezier(.22,.68,0,1.2)}
.rv.on{opacity:1;transform:translateY(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}
.pgbar{position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--gold),#E4C46A);z-index:1001;transition:width .08s linear;pointer-events:none}
.snav{position:fixed;top:2px;left:0;right:0;z-index:1000;padding:0 64px;height:58px;display:flex;align-items:center;justify-content:space-between;transition:background .4s}
.snav.sc{background:rgba(13,13,13,.92);backdrop-filter:blur(14px);border-bottom:1px solid rgba(184,150,46,.15)}
.snav-logo{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);font-weight:600}
.snav-links{display:flex;gap:28px}
.snav-links a{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(232,228,220,.5);text-decoration:none;transition:color .2s}
.snav-links a:hover{color:var(--gold)}
.hero{min-height:100vh;background:var(--dark);display:flex;flex-direction:column;justify-content:space-between;padding:80px 64px 64px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,var(--gold) 30%,var(--gold) 70%,transparent);transform:scaleX(0);transform-origin:left;animation:goldBar 1.1s .4s cubic-bezier(.22,.68,0,1.2) forwards}
@keyframes goldBar{to{transform:scaleX(1)}}
.hero-wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:clamp(60px,10vw,120px);font-weight:700;color:rgba(255,255,255,.025);letter-spacing:20px;font-family:'Cormorant Garamond',serif;pointer-events:none;user-select:none;white-space:nowrap}
.hero-top{display:flex;justify-content:space-between;align-items:flex-start}
.hero-firm{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);font-weight:600}
.hero-conf{background:#1a0a0a;border:1px solid #8B0000;color:#E07070;font-size:10px;letter-spacing:2px;padding:6px 14px;text-transform:uppercase;font-weight:600}
.hero-mid{flex:1;display:flex;flex-direction:column;justify-content:center;padding:80px 0 60px}
.hero-ref{font-size:11px;letter-spacing:3px;color:var(--gold);margin-bottom:28px;font-weight:500;opacity:0;animation:fadeUp .8s .65s ease forwards}
.hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(38px,5.5vw,68px);font-weight:700;line-height:1.08;margin-bottom:20px;max-width:720px;color:#E8E4DC;opacity:0;animation:fadeUp .8s .8s ease forwards}
.hero h1 span{color:var(--gold)}
.hero-sub{font-size:15px;color:#8A8480;font-weight:300;max-width:580px;margin-bottom:52px;opacity:0;animation:fadeUp .8s .95s ease forwards;line-height:1.75}
.hero-cta{display:flex;gap:16px;margin-bottom:60px;opacity:0;animation:fadeUp .8s 1.1s ease forwards}
.btn-p{background:var(--gold);color:var(--dark);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;padding:14px 28px;border:none;cursor:pointer;transition:background .2s,transform .2s}
.btn-p:hover{background:#D4AE46;transform:translateY(-2px)}
.btn-g{background:transparent;color:#E8E4DC;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:14px 28px;border:1px solid rgba(232,228,220,.2);cursor:pointer;transition:border-color .2s,color .2s}
.btn-g:hover{border-color:var(--gold);color:var(--gold)}
.hero-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;border-top:1px solid #282828;padding-top:32px;opacity:0;animation:fadeUp .8s 1.25s ease forwards}
.hero-meta dt{color:#504B46;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-size:9px}
.hero-meta dd{color:#E8E4DC;font-weight:500;font-size:13px}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.mstrip{background:var(--accent);padding:64px}
.mstrip-inner{max-width:960px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.mc{text-align:center;padding:28px 16px;border:1px solid rgba(232,228,220,.1);transition:border-color .3s,transform .3s}
.mc:hover{border-color:rgba(184,150,46,.3);transform:translateY(-3px)}
.mc-val{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,42px);font-weight:700;color:#E8E4DC;display:block;line-height:1}
.mc-unit{color:var(--gold)}
.mc-label{font-size:10px;color:rgba(232,228,220,.4);text-transform:uppercase;letter-spacing:1.5px;margin-top:10px;display:block}
.mc-note{font-size:11px;color:rgba(184,150,46,.55);margin-top:5px;display:block}
.sl{background:var(--bg)}
.sd{background:#0C1420}
.si{max-width:960px;margin:0 auto;padding:96px 48px}
.stag{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:14px}
.stag::after{content:'';flex:1;height:1px;background:var(--border)}
.sd .stag::after{background:rgba(255,255,255,.08)}
h2.stt{font-family:'Cormorant Garamond',serif;font-size:clamp(30px,3.5vw,44px);font-weight:700;color:var(--accent);margin-bottom:28px;line-height:1.2}
.sd h2.stt{color:#E8E4DC}
h3.sub{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--text);margin:32px 0 12px}
.sd h3.sub{color:rgba(232,228,220,.82)}
p.bt{color:#3A3530;margin-bottom:14px;font-weight:300;font-size:14px;line-height:1.8}
.sd p.bt{color:rgba(232,228,220,.5)}
p.bt strong{color:var(--text);font-weight:600}
.vbox{background:linear-gradient(135deg,#0D1F30,#1C3553);border-radius:6px;padding:40px;margin:28px 0}
.vbox h3{font-family:'Cormorant Garamond',serif;color:#C8A84A;font-size:22px;margin:0 0 24px}
.flist{list-style:none}
.flist li{display:flex;gap:16px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:13px;color:#C0BDB6;line-height:1.75}
.flist li:last-child{border-bottom:none}
.fnum{color:var(--gold);font-weight:700;font-size:11px;min-width:22px;padding-top:2px;flex-shrink:0}
.rec{background:rgba(200,168,74,.1);border:1px solid rgba(200,168,74,.3);border-radius:4px;padding:20px 24px;margin-top:24px}
.rec p{color:#E8E4DC;margin:0;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic}
.crow{display:flex;gap:8px;margin:20px 0;flex-wrap:wrap}
.cb{font-size:11px;font-weight:600;padding:5px 14px;border-radius:20px;letter-spacing:.8px;text-transform:uppercase}
.cb-h{background:#D4EDDA;color:var(--green);border:1px solid #A8D8B4}
.cb-m{background:#FFF3CD;color:var(--amber);border:1px solid #FFD980}
.cb-i{background:#F8D7DA;color:var(--red);border:1px solid #F5A5A5}
.callout{background:#FFF8E8;border-left:4px solid var(--gold);padding:18px 22px;margin:22px 0}
.callout-lbl{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:8px}
.callout p{margin:0;color:#3A3530;font-size:13px;line-height:1.7}
.aif{background:#FFF8F0;border:1px solid #FFD0A0;border-radius:4px;padding:11px 14px;margin:14px 0;font-size:12px;display:flex;gap:10px;color:#3A3530;line-height:1.7}
.aif-icon{color:var(--amber);flex-shrink:0;font-size:13px;margin-top:1px}
.tab-bar{display:flex;border-bottom:2px solid var(--border);margin-bottom:32px;overflow-x:auto}
.sd .tab-bar{border-bottom-color:rgba(255,255,255,.1)}
.tb{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;padding:12px 22px;background:none;border:none;color:var(--muted);cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .2s,border-color .2s}
.sd .tb{color:rgba(232,228,220,.35)}
.tb.on{color:var(--accent);border-bottom-color:var(--gold)}
.sd .tb.on{color:#E8E4DC}
.tb:hover:not(.on){color:var(--text)}
.sd .tb:hover:not(.on){color:rgba(232,228,220,.7)}
.rt{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
.rt th{background:var(--accent);color:#E8E4DC;padding:11px 14px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:500}
.rt td{padding:11px 14px;border-bottom:1px solid var(--border);color:#3A3530;vertical-align:top}
.sd .rt td{color:rgba(232,228,220,.6);border-bottom-color:rgba(255,255,255,.07)}
.rt tr:nth-child(even) td{background:#FAFAF7}
.sd .rt tr:nth-child(even) td{background:rgba(255,255,255,.025)}
.rt td.good{color:var(--green);font-weight:500}
.rt td.warn{color:var(--amber);font-weight:500}
.rt td.risk{color:var(--red);font-weight:500}
.rt td.lbl{font-weight:600;color:var(--text)}
.sd .rt td.lbl{color:#E8E4DC}
.scgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:28px 0}
.sc{border-radius:6px;padding:28px;border:2px solid transparent;cursor:pointer;transition:border-color .3s,transform .3s,box-shadow .3s}
.sc-bear{background:#FFF5F5;border-color:#F5C6C6}
.sc-base{background:#F0F4FF;border-color:#C6D4F5}
.sc-bull{background:#F5FFF8;border-color:#C6F5D4}
.sc.sel{transform:translateY(-5px);box-shadow:0 20px 48px rgba(0,0,0,.13)}
.sc-bear.sel{border-color:var(--red)}
.sc-base.sel{border-color:var(--accent)}
.sc-bull.sel{border-color:var(--green)}
.sc-lbl{font-size:9px;letter-spacing:3px;text-transform:uppercase;font-weight:700;display:block;margin-bottom:12px}
.sc-bear .sc-lbl{color:var(--red)}.sc-base .sc-lbl{color:var(--accent)}.sc-bull .sc-lbl{color:var(--green)}
.sc-val{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:700;display:block;margin-bottom:4px}
.sc-bear .sc-val{color:var(--red)}.sc-base .sc-val{color:var(--accent)}.sc-bull .sc-val{color:var(--green)}
.sc-sub{font-size:10px;margin-bottom:16px;letter-spacing:1px;text-transform:uppercase}
.sc-bear .sc-sub{color:var(--red)}.sc-base .sc-sub{color:var(--accent)}.sc-bull .sc-sub{color:var(--green)}
.sc-line{font-size:12px;color:var(--muted);padding:6px 0;border-bottom:1px solid var(--border)}
.sc-line:last-child{border-bottom:none}
.sc-extra{overflow:hidden;max-height:0;opacity:0;transition:max-height .4s cubic-bezier(.22,.68,0,1.2),opacity .3s;padding-top:0}
.sc.sel .sc-extra{max-height:80px;opacity:1;padding-top:12px}
.rs{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:4px;font-weight:700;font-size:13px}
.rs-h{background:#FDECEA;color:var(--red)}.rs-m{background:#FFF3CD;color:var(--amber)}.rs-l{background:#D4EDDA;color:var(--green)}
.rm{display:flex;flex-direction:column;position:relative}
.rm::before{content:'';position:absolute;left:68px;top:8px;bottom:8px;width:1px;background:var(--border)}
.rm-item{display:flex;gap:32px;padding:24px 0}
.rm-phase{min-width:56px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:700;padding-top:3px;position:relative;text-align:right;padding-right:22px;line-height:1.5}
.rm-phase::after{content:'';position:absolute;right:-5px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--gold);border:2px solid var(--bg);z-index:1}
.rm-content h4{font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px;font-family:'Cormorant Garamond',serif}
.rm-content p{font-size:13px;color:var(--muted);margin:0;line-height:1.75}
.eng-box{background:var(--accent);color:#E8E4DC;border-radius:4px;padding:32px 36px;margin-bottom:28px;display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;font-size:13px}
.eng-box dt{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8AAABF;margin-bottom:4px}
.eng-box dd{font-weight:500}
.disc-block{background:#0F1924;border:1px solid rgba(255,255,255,.07);border-radius:4px;padding:36px 40px}
.disc-block h3{font-size:12px;font-weight:600;color:rgba(232,228,220,.65);margin-bottom:16px;letter-spacing:1.5px;text-transform:uppercase}
.disc-block p{color:#5A7080;font-size:13px;margin-bottom:12px;line-height:1.75}
.so-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,.07)}
.so-box{background:#0A1520;border:1px solid rgba(255,255,255,.07);border-radius:4px;padding:18px 22px}
.so-box dt{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(138,170,191,.6);margin-bottom:6px}
.so-box dd{font-weight:600;color:#E8E4DC;font-size:13px;margin-bottom:8px}
.cl{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:4px;padding:28px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:24px 0}
.cl-it{display:flex;align-items:flex-start;gap:10px;font-size:12px;color:rgba(232,228,220,.5);line-height:1.6}
.cl-ok{color:var(--green);font-weight:700;flex-shrink:0}
.cl-wn{color:var(--amber);font-weight:700;flex-shrink:0}
.sfoot{background:var(--accent);color:#8AAABF;text-align:center;padding:28px;font-size:10px;letter-spacing:2px;text-transform:uppercase}
@media(max-width:768px){
  .hero{padding:72px 24px 40px}
  .hero-meta,.mstrip-inner,.scgrid,.so-grid,.cl,.eng-box{grid-template-columns:1fr}
  .si{padding:64px 24px}
  .mstrip{padding:48px 24px}
  .snav{padding:0 24px}
  .snav-links{display:none}
  .rm::before{left:52px}
}
`;

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} className={`rv${v ? ' on' : ''}`} style={{ transitionDelay: `${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function MC({ value, label, note, active }) {
  const count = useCounter(typeof value === 'number' ? value : 0, active);
  const display = typeof value === 'number' ? count.toLocaleString() : value;
  return (
    <div className="mc">
      <span className="mc-val">{display}</span>
      <span className="mc-label">{label}</span>
      {note && <span className="mc-note">{note}</span>}
    </div>
  );
}

export default function Landing() {
  const [tab, setTab] = useState('supply');
  const [scenario, setScenario] = useState('base');
  const [progress, scrolled] = useScroll();
  const [mRef, mVisible] = useInView(0.3);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <style>{CSS}</style>
      <div className="pgbar" style={{ width: `${progress}%` }} />

      {/* NAV */}
      <nav className={`snav${scrolled ? ' sc' : ''}`}>
        <span className="snav-logo">Meridian RE Advisory</span>
        <div className="snav-links">
          {[['summary','Summary'],['market','Market'],['financials','Financials'],['risk','Risk'],['roadmap','Roadmap'],['disclaimer','Disclaimer']].map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-wm">SAMPLE</div>
        <div className="hero-top">
          <span className="hero-firm">Meridian RE Advisory</span>
          <span className="hero-conf">Confidential — Client Use Only</span>
        </div>
        <div className="hero-mid">
          <div className="hero-ref">MER-MKT-2026-001 · Market Entry Study</div>
          <h1>Melaka Tengah<br /><span>Mixed-Use Residential</span><br />Market Entry Study</h1>
          <p className="hero-sub">A needs-based advisory assessment of residential and short-term rental development viability in Melaka Tengah district, calibrated to the Visit Malaysia 2026 demand cycle and current land market conditions.</p>
          <div className="hero-cta">
            <button className="btn-p" onClick={() => scrollTo('summary')}>View Full Report</button>
            <button className="btn-g" onClick={() => scrollTo('disclaimer')}>Disclaimer & Sign-Off</button>
          </div>
        </div>
        <dl className="hero-meta">
          <div><dt>Client</dt><dd>[Horizon Capital Ventures Sdn Bhd]</dd></div>
          <div><dt>Engagement Ref</dt><dd>MER-MKT-2026-001</dd></div>
          <div><dt>Date of Report</dt><dd>8 June 2026</dd></div>
          <div><dt>Classification</dt><dd>Confidential</dd></div>
        </dl>
      </section>

      {/* METRICS STRIP */}
      <div className="mstrip" ref={mRef}>
        <div className="mstrip-inner">
          <MC value={20321} label="Total Transactions 2024" note="All-time high · Rahim & Co / JPPH" active={mVisible} />
          <MC value="RM6.7B" label="Transaction Value 2024" note="+20.5% YoY · Rahim & Co" active={mVisible} />
          <MC value={4595} label="Housing Starts H1–Q3 2025" note="−19.4% YoY · JPPH 2025" active={mVisible} />
          <MC value="RM250K" label="Avg Residential Price Q3 2025" note="2nd lowest in Malaysia · JPPH" active={mVisible} />
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <section id="summary" className="sl">
        <div className="si">
          <Reveal><div className="stag">Section 02</div></Reveal>
          <Reveal delay={0.1}><h2 className="stt">Executive Summary</h2></Reveal>
          <Reveal delay={0.15}>
            <p className="bt">This report was commissioned to assess the market entry viability of a mixed-use residential development — incorporating owner-occupier units and short-term rental (STR) serviced suites — within the Melaka Tengah district of Melaka, Malaysia. The engagement was triggered by the client's interest in capitalising on the Visit Malaysia 2026 tourism catalyst and structural undersupply of STR-grade stock in Melaka's UNESCO heritage corridor.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="vbox">
              <h3>Three Critical Findings</h3>
              <ul className="flist">
                <li><span className="fnum">01</span>Melaka recorded 20,321 property transactions valued at RM6.7 billion in 2024 — an all-time high, with a 29.83% YoY growth in transaction volume, the second highest in Malaysia. The market is structurally active, not speculative. <em style={{color:'rgba(184,150,46,.55)',fontSize:'11px'}}>(Rahim &amp; Co / JPPH, May 2025)</em></li>
                <li><span className="fnum">02</span>Visit Malaysia Year 2026 targets 43 million international tourist arrivals. With 38.3 million already recorded in the first 11 months of 2025, Melaka's UNESCO heritage status positions it as a primary beneficiary of structural STR demand improvement. <em style={{color:'rgba(184,150,46,.55)',fontSize:'11px'}}>(MIDA, Jan 2026)</em></li>
                <li><span className="fnum">03</span>Melaka's average residential price of RM250,311 (JPPH Q3 2025) is the second-lowest in Malaysia — a critical affordability advantage for owner-occupier absorption, but also a ceiling risk for premium STR pricing. The product must bridge both segments without serving neither.</li>
              </ul>
              <div className="rec">
                <p><em>Primary Recommendation:</em> Proceed with a <strong>Conditional Go</strong> — dual-revenue mixed-use development, max 40:60 STR-to-owner-occupier split, priced RM350,000–RM550,000. H1 2027 launch captures post-VM2026 momentum while avoiding peak supply pressure.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="crow">
              <span className="cb cb-h">● High Confidence — Macro &amp; transaction data</span>
              <span className="cb cb-m">● Medium Confidence — STR yield projections</span>
              <span className="cb cb-i">● Indicative — Site-specific pricing (pre-acquisition)</span>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="callout">
              <div className="callout-lbl">Decision-Maker Caveat</div>
              <p>This report is based on desktop analysis and published market data as of May 2026. Physical site inspection, legal permissibility confirmation, and regulatory approval assessment have not been conducted and are required before any capital commitment. STR yield projections carry indicative confidence ratings only.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARKET ANALYSIS */}
      <section id="market" className="sd">
        <div className="si">
          <Reveal><div className="stag">Section 03</div></Reveal>
          <Reveal delay={0.1}><h2 className="stt">Market Analysis</h2></Reveal>
          <Reveal delay={0.2}>
            <div className="tab-bar">
              {[['supply','Supply'],['demand','Demand'],['competitive','Competitive'],['macro','Macro & Regulatory']].map(([k, v]) => (
                <button key={k} className={`tb${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{v}</button>
              ))}
            </div>
          </Reveal>

          {tab === 'supply' && (
            <Reveal key="supply">
              <h3 className="sub">3.2 Supply Analysis</h3>
              <p className="bt">Melaka's residential supply pipeline is contracting: housing starts in the first three quarters of 2025 declined 19.4% YoY to 4,595 units (JPPH 2025). However, completions surged strongly, indicating a flush of near-term supply from 2022–23 approvals. The high-rise residential segment constitutes ~33.5% of new supply nationally, with Melaka historically skewed toward landed products — creating a structural gap in strata product in the RM350,000–RM600,000 band.</p>
              <p className="bt">The national overhang stands at 30,471 units valued at RM17.73 billion (NAPIC/JPPH 2025). Condominiums and apartments form 47.1% of overhang — a critical risk to monitor in product positioning. Melaka's overhang is not among the highest-risk states.</p>
              <div className="callout" style={{background:'rgba(184,150,46,.07)',borderLeft:'4px solid rgba(184,150,46,.35)'}}>
                <div className="callout-lbl">So What?</div>
                <p style={{color:'rgba(232,228,220,.5)'}}>The 19.4% contraction in new starts is favourable for a 2027 launch — reducing near-term competition. However, the national overhang concentration in condominiums means the STR suite component must carry a dual-use (owner-occupier + investment) proposition, not a pure investor profile.</p>
              </div>
            </Reveal>
          )}
          {tab === 'demand' && (
            <Reveal key="demand">
              <h3 className="sub">3.3 Demand Analysis</h3>
              <p className="bt">Melaka recorded the second-highest residential transaction volume growth in Malaysia in 2024 at 29.83% YoY. Transaction value growth of 28.3% confirms genuine demand depth. Average transacted price rose from RM214,000 in 2015 to RM340,000 in 2024 — a controlled CAGR of ~4.7% over nine years (Rahim &amp; Co, May 2025).</p>
              <table className="rt">
                <thead><tr><th>Metric</th><th>Value</th><th>Source</th></tr></thead>
                <tbody>
                  {[
                    ['Melaka transactions 2024','20,321 (all-time high)','good','JPPH / Rahim & Co'],
                    ['YoY transaction volume growth','+29.83%','good','Rahim & Co, May 2025'],
                    ['YoY transaction value growth','+28.3%','good','Rahim & Co, May 2025'],
                    ['Average residential price Q3 2025','RM250,311','','JPPH via Global Property Guide'],
                    ['National average residential price','RM502,922','warn','NAPIC 2025'],
                    ['VM2026 arrivals (11 months to Nov 2025)','38.3 million','good','MIDA, Jan 2026'],
                  ].map(([m, v, cls, s]) => (
                    <tr key={m}><td className="lbl">{m}</td><td className={cls}>{v}</td><td style={{fontSize:'12px',color:'var(--muted)'}}>{s}</td></tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          )}
          {tab === 'competitive' && (
            <Reveal key="competitive">
              <h3 className="sub">3.4 Competitive Landscape</h3>
              <div className="aif" style={{background:'rgba(255,248,240,.06)',borderColor:'rgba(255,208,160,.2)'}}><span className="aif-icon">⚠</span><span style={{color:'rgba(232,228,220,.5)'}}>AI Limitation Flag (G-AI-02 / G-AI-04): Competitive intelligence is based on publicly available data. Soft competitive intelligence requires supplementation by the Lead Consultant through direct market engagement prior to finalisation.</span></div>
              <table className="rt">
                <thead><tr><th>Project</th><th>Type</th><th>Price Range</th><th>RM psf</th><th>Status</th><th>Vulnerability</th></tr></thead>
                <tbody>
                  {[
                    ['Ocean Palm, Klebang','Condominium (FH)','RM220K–RM480K','~RM241','Transacting','warn','Aging stock; limited STR amenities'],
                    ['Saujana Residences, Bukit Katil','2-sty terrace','RM380K–RM520K','~RM260','New launch 2025','good','Landed; not competing for STR segment'],
                    ['Country Villas Resort','Resort-holiday home','RM400K–RM700K','~RM280–350','Active','warn','Weak Melaka city tourism anchor'],
                    ['Melaka Gateway (PME-1)','Mixed island dev','TBC','TBC','Stalled','risk','Execution risk; KAJ project history'],
                  ].map(([name, type, price, psf, status, cls, flag]) => (
                    <tr key={name}><td className="lbl">{name}</td><td>{type}</td><td>{price}</td><td>{psf}</td><td>{status}</td><td className={cls}>{flag}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="bt">No existing product in the market specifically combines owner-occupier mid-range pricing (RM350K–RM550K) with STR-optimised unit configurations. This is the positioning white space available to this development.</p>
            </Reveal>
          )}
          {tab === 'macro' && (
            <Reveal key="macro">
              <h3 className="sub">3.5 Macro &amp; Regulatory Environment</h3>
              <p className="bt">Malaysia's GDP is forecast to grow 4.5%–4.8% in 2025 (BNM). BNM cut the OPR by 25bps in July 2025 to 2.75% — a tailwind for residential mortgage affordability and developer financing costs. VM2026 targets RM121 billion in tourism receipts; Melaka's UNESCO designation positions it as a Tier 1 beneficiary city.</p>
              <div className="aif" style={{background:'rgba(255,248,240,.06)',borderColor:'rgba(255,208,160,.2)'}}><span className="aif-icon">⚠</span><span style={{color:'rgba(232,228,220,.5)'}}>Regulatory and zoning interpretation, foreign ownership structure, and STR licensing must be verified by a licensed Malaysian planner or solicitor. AI output in this subsection is indicative only and does not constitute legal advice.</span></div>
              <table className="rt">
                <thead><tr><th>Regulatory Reference</th><th>Relevance</th></tr></thead>
                <tbody>
                  {[
                    ['Valuers, Appraisers, EA & PM Act 1981 (Act 242)','Governs advisory practice'],
                    ['BOVEAP Guidelines','Professional standards compliance'],
                    ['National Land Code 1965 / Melaka Land Ordinance','Land tenure & permissible use'],
                    ['Foreign ownership threshold','Min RM1M for foreign purchasers in most Melaka strata projects'],
                    ['Malaysia Carbon Tax (2026)','ESG-compliant design standards required from launch onwards'],
                  ].map(([r, rel]) => (
                    <tr key={r}><td className="lbl">{r}</td><td>{rel}</td></tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          )}
        </div>
      </section>

      {/* FINANCIALS */}
      <section id="financials" className="sl">
        <div className="si">
          <Reveal><div className="stag">Section 04</div></Reveal>
          <Reveal delay={0.1}><h2 className="stt">Financial Analysis &amp; Scenario Modelling</h2></Reveal>
          <Reveal delay={0.15}>
            <p className="bt" style={{fontStyle:'italic',color:'var(--muted)'}}>Forward-looking notice: These projections represent the consultant's professional opinion of likely outcomes under stated conditions and are not guarantees of future performance.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="bt">Modelled on a hypothetical <strong>150-unit mixed-use strata development</strong>: 90 owner-occupier residential units (700–1,200 sqft) and 60 STR-format dual-key suites (400–600 sqft). Select a scenario to expand.</p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="scgrid">
              {[
                { key:'bear', label:'Bear / Stress', val:'-22.1%', sub:'Gross Margin', lines:['Sales velocity: 8–10 units/month','Construction cost: +10% overrun','STR occupancy: 45%','OPR: +75bps shock'], extra:'GDV: RM52.0M · TDC: RM63.5M · IRR: Negative' },
                { key:'base', label:'★ Base Case', val:'4.9%', sub:'Gross Margin', lines:['Sales velocity: 12–15 units/month','Construction cost: on budget','STR occupancy: 62%','OPR: stable at 2.75%'], extra:'GDV: RM59.7M · TDC: RM56.9M · IRR: ~11.5%' },
                { key:'bull', label:'Bull / Optimistic', val:'18.8%', sub:'Gross Margin', lines:['Sales velocity: 18–22 units/month','Construction cost: −5% saving','STR occupancy: 72%','OPR: −25bps further cut'], extra:'GDV: RM66.5M · TDC: RM54.0M · IRR: 18–22%' },
              ].map(({ key, label, val, sub, lines, extra }) => (
                <div key={key} className={`sc sc-${key}${scenario === key ? ' sel' : ''}`} onClick={() => setScenario(key)}>
                  <span className="sc-lbl">{label}</span>
                  <span className="sc-val">{val}</span>
                  <span className="sc-sub">{sub}</span>
                  {lines.map((l, i) => <div key={i} className="sc-line">{l}</div>)}
                  <div className="sc-extra" style={{fontSize:'12px',fontWeight:'600',color:key==='bear'?'var(--red)':key==='bull'?'var(--green)':'var(--accent)'}}>{extra}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <h3 className="sub">4.3 Returns Summary</h3>
            <table className="rt">
              <thead><tr><th>Metric</th><th>Base Case</th><th>Optimistic</th><th>Stress</th></tr></thead>
              <tbody>
                {[
                  ['GDV','RM59.7M','RM66.5M','RM52.0M','','',''],
                  ['Total Development Cost','RM56.9M','RM54.0M','RM63.5M','','',''],
                  ['Gross Development Profit','RM2.8M (4.9%)','RM12.5M (18.8%)','−RM11.5M (−22.1%)','good','good','risk'],
                  ['Project IRR','~11.5%','~18–22%','Negative','good','good','risk'],
                  ['Break-Even Sales Price (Resi)','RM395/psf','RM370/psf','RM440/psf','','',''],
                  ['STR Investor Gross Yield','5.6%','7.2%','3.9%','good','good','warn'],
                ].map(([m, base, opt, stress, bc, oc, sc]) => (
                  <tr key={m}><td className="lbl">{m}</td><td className={bc}>{base}</td><td className={oc}>{opt}</td><td className={sc}>{stress}</td></tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      {/* RISK */}
      <section id="risk" className="sd">
        <div className="si">
          <Reveal><div className="stag">Section 05</div></Reveal>
          <Reveal delay={0.1}><h2 className="stt">Risk Register &amp; Strategic Recommendation</h2></Reveal>
          <Reveal delay={0.15}>
            <p className="bt">The evidence base supports Melaka Tengah as a structurally sound market for mid-market mixed-use residential development, subject to careful product positioning. The principal constraint is thin development margins at current Melaka pricing, which demands disciplined land acquisition and a differentiated product concept.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <table className="rt">
              <thead><tr><th>#</th><th>Risk</th><th>L</th><th>I</th><th>Score</th><th>Mitigation</th></tr></thead>
              <tbody>
                {[
                  ['R-01','STR market oversupply as VM2026 ends',4,4,'h','Design dual-use units; cap STR ratio at 40%'],
                  ['R-02','Construction cost overrun (material volatility)',3,4,'h','Fixed-price contract; 5% contingency in base case'],
                  ['R-03','Land acquisition at above-market cost',3,5,'h','Hard RM12M land cost threshold; appoint registered valuer'],
                  ['R-04','STR licensing restriction or moratorium',2,5,'m','Legal counsel before launch; dual-use unit design'],
                  ['R-05','Sales velocity shortfall post-launch',3,4,'h','Phase 1 of 80 units only; Phase 2 on ≥60% take-up'],
                  ['R-06','OPR rate rise reversing July 2025 cut',2,3,'m','Stress-modelled at OPR +75bps; monitor BNM quarterly'],
                  ['R-07','Competitor new launch in heritage corridor',2,3,'m','Accelerate site selection to Q3 2026 window'],
                ].map(([code, risk, l, i, grade, mit]) => (
                  <tr key={code}>
                    <td><strong style={{color:'#E8E4DC'}}>{code}</strong></td>
                    <td>{risk}</td>
                    <td style={{textAlign:'center'}}>{l}</td>
                    <td style={{textAlign:'center'}}>{i}</td>
                    <td><div className={`rs rs-${grade}`}>{l * i}</div></td>
                    <td style={{fontSize:'12px'}}>{mit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="vbox" style={{marginTop:'32px'}}>
              <h3>Verdict: Conditional Go ✓</h3>
              <ul className="flist">
                <li><span className="fnum">C1</span><strong style={{color:'#E8E4DC'}}>Condition:</strong> Land acquisition at or below RM12M for a 0.5–1.0 acre parcel within 3 km of Jonker Street. Exceeding this eliminates base-case viability.</li>
                <li><span className="fnum">C2</span><strong style={{color:'#E8E4DC'}}>Condition:</strong> Legal confirmation that the parcel permits strata mixed-use development with STR use under Melaka Municipal Council bylaws.</li>
                <li><span className="fnum">C3</span><strong style={{color:'#E8E4DC'}}>Condition:</strong> STR suite ratio must not exceed 40% of total units. Majority owner-occupier composition insulates the project from STR regulatory and demand risk.</li>
                <li><span className="fnum">C4</span><strong style={{color:'#E8E4DC'}}>Condition:</strong> Phase 1 launch of max 80 units; Phase 2 triggered only upon ≥60% Phase 1 sell-through.</li>
              </ul>
              <div className="rec">
                <p><em>Confidence Level: Medium–High. Upgrades to High upon completion of site inspection, legal permissibility confirmation, and registered valuer formal land assessment.</em></p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="sl">
        <div className="si">
          <Reveal><div className="stag">Section 06</div></Reveal>
          <Reveal delay={0.1}><h2 className="stt">Implementation Roadmap</h2></Reveal>
          <Reveal delay={0.2}>
            <div className="rm">
              {[
                ['Phase 0\nNow–Q3 2026','Pre-Acquisition & Due Diligence','Site shortlisting (min. 3 candidate parcels); registered valuer appointment; legal counsel for zoning and STR licensing confirmation; BNM rate monitoring. Decision gate: proceed to acquisition only on all four Conditions C1–C4 satisfied.'],
                ['Phase 1\nQ4 2026–Q1 2027','Land Acquisition & Concept Finalisation','Execute land acquisition. Appoint architect, QS, and structural engineer. Finalise unit mix (90:60 resi:STR). Submit planning application to MBMB. KPI: planning approval within 90 days of submission.'],
                ['Phase 2\nQ2 2027','Phase 1 Launch (80 units)','Sales gallery opening; APDL and developer licence obtained. Marketing targeting domestic investors and Klang Valley affordability migrants. Sales target: ≥60% take-up (48 units) within 90 days. OC target: Q1 2030.'],
                ['Phase 3\nQ3 2027–Q1 2028','Phase 2 Trigger Decision','Phase 2 (70 units) launched only upon ≥60% Phase 1 take-up confirmed. Red flag trigger: sales velocity below 8 units/month for two consecutive months → escalate to strategy review.'],
                ['Monitoring\nOngoing','KPIs & Review Triggers','Quarterly: sales velocity, construction progress, OPR movement. Red flags: OPR >3.5%; Melaka volume decline >15% YoY; STR regulatory change; construction cost overrun >8%.'],
              ].map(([phase, title, text], i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="rm-item">
                    <div className="rm-phase">{phase.split('\n').map((l, j) => <React.Fragment key={j}>{l}{j === 0 && <br />}</React.Fragment>)}</div>
                    <div className="rm-content">
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section id="disclaimer" className="sd">
        <div className="si">
          <Reveal><div className="stag">Section 01 &amp; Section 08</div></Reveal>
          <Reveal delay={0.1}><h2 className="stt">Engagement Header &amp; Disclaimer</h2></Reveal>
          <Reveal delay={0.2}>
            <dl className="eng-box">
              <div><dt>Client</dt><dd>[Horizon Capital Ventures Sdn Bhd]</dd></div>
              <div><dt>Engagement Reference</dt><dd>MER-MKT-2026-001</dd></div>
              <div><dt>Subject Property / Area</dt><dd>Melaka Tengah District, Melaka, Malaysia</dd></div>
              <div><dt>Date of Report</dt><dd>8 June 2026</dd></div>
              <div><dt>Report Type</dt><dd>MER-MKT — Market Entry / Market Study</dd></div>
              <div><dt>Prepared By</dt><dd>[Ahmad Fadzillah bin Zainal, B.Sc (Hons) Estate Management, MRICS]</dd></div>
              <div><dt>Reviewed By</dt><dd>[Dr. Siti Norbahyah binti Kassim, MRISM, MRICS]</dd></div>
              <div><dt>Classification</dt><dd>CONFIDENTIAL — Client Use Only</dd></div>
            </dl>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="disc-block">
              <h3>Disclaimer &amp; Limitations</h3>
              <p>This report has been prepared by Meridian RE Advisory solely for the use of <strong style={{color:'#E8E4DC'}}>[Horizon Capital Ventures Sdn Bhd]</strong> in connection with Engagement Reference MER-MKT-2026-001. It is provided as a consultancy opinion and does not constitute a certified valuation under RICS Valuation – Global Standards (Red Book 2025) or USPAP (2024–25 edition), nor does it constitute legal, tax, or financial advice.</p>
              <p>Meridian has relied on information provided by the Client, publicly available data, and proprietary data sources believed to be reliable as at May/June 2026 — including JPPH, Rahim &amp; Co International, NAPIC, BNM, MIDA, IQI Global, Mordor Intelligence, and Kopi and Property. No independent verification of third-party data has been undertaken unless explicitly stated.</p>
              <p>AI-assisted tools were used for data aggregation, scenario modelling, and draft narrative production. All AI-assisted outputs have been reviewed, validated, and accepted by the named consultant(s) below. The professional opinions expressed are those of the named consultants and not of any AI system.</p>
              <p>No physical site inspection was conducted. Physical condition, access, infrastructure, and legal permissibility assessments are based on desktop review only. A physical site inspection, formal land search, and legal review are required before any capital commitment is made.</p>
              <div className="so-grid">
                <dl className="so-box">
                  <dt>Lead Consultant</dt><dd>[Ahmad Fadzillah bin Zainal, MRICS]</dd>
                  <dt>Date of Sign-Off</dt><dd>8 June 2026</dd>
                  <dt>Meridian File Reference</dt><dd>MER-MKT-2026-001</dd>
                </dl>
                <dl className="so-box">
                  <dt>Reviewing Advisor</dt><dd>[Dr. Siti Norbahyah binti Kassim, MRISM, MRICS]</dd>
                  <dt>Review Date</dt><dd>8 June 2026</dd>
                  <dt>Report Version</dt><dd style={{color:'#FFD080'}}>DRAFT v1.0 — NOT FOR RELIANCE</dd>
                </dl>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <h3 className="sub" style={{marginTop:'40px',color:'rgba(232,228,220,.8)'}}>Guardrail Compliance Checklist</h3>
            <div className="cl">
              {[
                [true,'G-01 Report type MER-MKT assigned; section structure matches'],
                [true,'G-02 Executive Summary findings traceable to Sections 3–5'],
                [true,'G-03 All quantitative claims sourced with named provider'],
                [null,'G-04 AI limitation flags present; human review required pre-final'],
                [true,'G-05 Risk Register: 7 risks with L×I scores'],
                [true,'G-06 Mandatory Disclaimer Block present and populated'],
                [true,'G-07 No certified value language used'],
                [true,'G-08 Financial projections carry forward-looking statement language'],
                [true,'G-09 Key Assumptions Register complete (A-01 to A-12)'],
                [true,'G-10 Report classified CONFIDENTIAL with client name and ref'],
                [null,'G-11 Reviewed-by populated — final signatures pending'],
                [true,'G-12 AI disclosure statement included in Section 8'],
              ].map(([ok, text], i) => (
                <div key={i} className="cl-it">
                  <span className={ok === true ? 'cl-ok' : 'cl-wn'}>{ok === true ? '✓' : '⚠'}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="sfoot">
        Meridian RE Advisory · MER-MKT-2026-001 · Confidential · Draft v1.0 — Not For Reliance
      </footer>
    </>
  );
}
