import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Activity, AlertCircle, ArrowUpRight, ArrowDownRight, ArrowRight,
  BarChart3, Bell, Calculator, Car, CheckCircle2, ChevronDown, ChevronLeft,
  Clock, Database, DollarSign, Download, Eye, Gauge, Globe, Key,
  Layers, MapPin, Play, Plus, RefreshCw, ShieldCheck,
  Target, TrendingUp, TrendingDown, Workflow, Zap, Home, Cpu, X
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  bg:  '#EDEAE2',
  s1:  '#F5F3EE',
  s2:  '#FFFFFF',
  s3:  '#E4E1D9',
  brd: 'rgba(14,14,14,0.09)',
  brdHi: 'rgba(14,14,14,0.20)',
  amb: '#C41D2C',
  ambL: 'rgba(196,29,44,0.07)',
  ambG: 'rgba(196,29,44,0.20)',
  sky: '#1640C8',
  em:  '#155C38',
  rose:'#B51020',
  vi:  '#4E2080',
  tx:  '#0E0E0E',
  tx2: '#5A5A5A',
  tx3: '#ABABAB',
};

const COLORS = [C.amb, C.sky, C.em, C.vi, '#8A6200', '#0A6878', '#7A1A50', C.tx2];

const card  = { background: C.s2, border: `1px solid ${C.brd}`, borderRadius: 0 };
const cardP = { ...card, padding: 24 };
const kpiS  = { background: C.s2, borderTop: `2px solid ${C.tx}`, borderRight: `1px solid ${C.brd}`, borderBottom: `1px solid ${C.brd}`, borderLeft: `1px solid ${C.brd}`, borderRadius: 0, padding: '20px 24px' };
const inp   = { background: C.s3, border: `1px solid ${C.brd}`, borderRadius: 0, color: C.tx, fontSize: 13, padding: '9px 13px', width: '100%', outline: 'none', fontFamily: 'inherit' };
const btn   = { background: C.tx, color: C.s2, border: 'none', borderRadius: 0, padding: '10px 22px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' };
const ghost = { background: 'transparent', border: `1px solid ${C.brdHi}`, borderRadius: 0, padding: '8px 16px', fontSize: 11, fontWeight: 700, color: C.tx2, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' };
const lbl   = { color: C.tx3, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' };
const mono  = { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' };
const serif = { fontFamily: '"DM Serif Display", Georgia, serif' };

// ── DATA ──────────────────────────────────────────────────────────────────────
const BRANDS = [
  { b:'Perodua', models:['Myvi','Axia','Bezza','Aruz','Ativa','Alza'],       base:42000 },
  { b:'Proton',  models:['Saga','Persona','X50','X70','Iriz'],               base:52000 },
  { b:'Toyota',  models:['Vios','Hilux','Camry','Corolla','Yaris'],          base:82000 },
  { b:'Honda',   models:['City','Civic','CR-V','HR-V','Jazz'],               base:76000 },
  { b:'Mazda',   models:['CX-5','CX-3','Mazda3','Mazda6'],                  base:102000 },
  { b:'Nissan',  models:['Almera','Navara','X-Trail'],                       base:78000 },
  { b:'BMW',     models:['3 Series','5 Series','X1','X3'],                   base:195000 },
  { b:'Mercedes-Benz', models:['C-Class','E-Class','GLA','GLC'],             base:235000 },
];
const REGIONS = ['Kuala Lumpur','Selangor','Johor','Penang','Perak','Pahang','Kedah','Sabah','Sarawak','N. Sembilan','Melaka','Kelantan','Terengganu'];
const r = (s => { let x = s; return () => { x = (x*9301+49297)%233280; return x/233280; }; })(7);

const MOCK = Array.from({ length: 420 }, (_, i) => {
  const br = BRANDS[Math.floor(r()*BRANDS.length)];
  const m  = br.models[Math.floor(r()*br.models.length)];
  const yr = 2015 + Math.floor(r()*10);
  const af = Math.max(0.42, 1-(2025-yr)*0.075);
  return { id:`M${10000+i}`, title:`${yr} ${br.b} ${m}`, brand:br.b, model:m, year:yr,
    price:Math.round((br.base*af*(0.72+r()*0.6))/500)*500,
    mileage:Math.round((15000+r()*195000)/1000)*1000,
    region:REGIONS[Math.floor(r()*REGIONS.length)],
    seller:r()>0.52?'Dealer':'Direct Owner', days:Math.floor(r()*30), source:'demo' };
});

const fmtRM = n => 'RM '+Math.round(n).toLocaleString();

const BASE   = 'https://api.apify.com/v2';
const aFetch = async (url, opts={}) => {
  const res = await fetch(url, { ...opts, headers:{'Content-Type':'application/json',...(opts.headers||{})} });
  if (!res.ok) { const t=await res.text(); throw new Error(`${res.status}: ${t.slice(0,140)}`); }
  return res.json();
};
const aRun    = (tok,act,inp) => aFetch(`${BASE}/acts/${encodeURIComponent(act)}/runs?token=${tok}`,{method:'POST',body:JSON.stringify(inp)});
const aStatus = (tok,id)      => aFetch(`${BASE}/actor-runs/${id}?token=${tok}`);
const aData   = (tok,ds,lim)  => aFetch(`${BASE}/datasets/${ds}/items?token=${tok}&limit=${lim}&clean=true`);

const normalize = items => items.map((it,i) => {
  const title = it.title||it.name||it.heading||it.ad_title||'';
  const price  = parseInt(String(it.price||it.asking_price||it.listingPrice||0).replace(/[^0-9]/g,''))||0;
  const mil    = parseInt(String(it.mileage||it.kilometer||it.km||it.millage||0).replace(/[^0-9]/g,''))||0;
  const region = it.location||it.state||it.area||it.region||'Malaysia';
  const seller = it.sellerType||it.seller_type||(it.isDealer?'Dealer':it.seller)||'Unknown';
  const yrM    = title.match(/\b(20[1-2]\d)\b/);
  const year   = yrM ? +yrM[1] : (it.year||2020);
  const brand  = BRANDS.find(b=>title.toLowerCase().includes(b.b.toLowerCase()))?.b||'Other';
  const model  = it.model||title.replace(new RegExp(String(year),'g'),'').replace(new RegExp(brand,'gi'),'').trim().split(/\s+/).slice(0,3).join(' ');
  return { id:`A${10000+i}`, title, brand, model, year, price, mileage:mil, region, seller, days:0, source:'apify', url:it.url||'' };
}).filter(l => l.price>5000 && l.price<2000000);

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body {
      font-family: 'Syne', ui-sans-serif, system-ui, sans-serif;
      background: ${C.bg};
      color: ${C.tx};
      -webkit-font-smoothing: antialiased;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: radial-gradient(circle, rgba(14,14,14,0.022) 1px, transparent 1px);
      background-size: 22px 22px;
      pointer-events: none;
      z-index: 0;
    }
    @keyframes slideUp {
      from { opacity:0; transform:translateY(22px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes slideRight {
      from { opacity:0; transform:translateX(-14px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleX  { from { transform:scaleX(0); } to { transform:scaleX(1); } }
    @keyframes ticker  { from { transform:translateX(0); } to { transform:translateX(-50%); } }
    @keyframes spin    { to   { transform:rotate(360deg); } }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes prog    { from{background-position:0 0} to{background-position:40px 0} }
    .e0 { animation:slideUp  .55s cubic-bezier(.2,0,0,1) both; }
    .e1 { animation:slideUp  .55s .10s cubic-bezier(.2,0,0,1) both; }
    .e2 { animation:slideUp  .55s .20s cubic-bezier(.2,0,0,1) both; }
    .e3 { animation:slideUp  .55s .30s cubic-bezier(.2,0,0,1) both; }
    .e4 { animation:slideUp  .55s .40s cubic-bezier(.2,0,0,1) both; }
    .er { animation:slideRight .5s .15s cubic-bezier(.2,0,0,1) both; }
    .si { animation:fadeIn   .28s ease forwards; }
    .rule-expand { transform-origin:left; animation:scaleX .7s cubic-bezier(.2,0,0,1) both; }
    .lift { transition:transform .18s ease, box-shadow .18s ease; }
    .lift:hover { transform:translateY(-1px); box-shadow:0 4px 18px rgba(14,14,14,0.07); }
    .spin  { animation:spin 1s linear infinite; }
    .blink { animation:blink 1.6s ease-in-out infinite; }
    .ticker-anim { animation:ticker 55s linear infinite; }
    .stripe { background:repeating-linear-gradient(90deg,${C.amb} 0,${C.amb} 20px,rgba(196,29,44,.32) 20px,rgba(196,29,44,.32) 40px); background-size:40px 100%; animation:prog 1s linear infinite; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(14,14,14,0.14); }
    input::placeholder, textarea::placeholder { color:${C.tx3}; }
    select option { background:${C.s2}; color:${C.tx}; }
    .nav-item { transition:color .14s ease; }
    .nav-item:hover { color:${C.tx} !important; }
    .trow:hover td { background:${C.s1}; }
  `}</style>
);

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const Label = ({ children }) => <div style={lbl}>{children}</div>;

const Divider = ({ style: s = {} }) => (
  <div className="rule-expand" style={{ height: 1, background: C.brd, transformOrigin: 'left', ...s }} />
);

const RedBar = ({ height = 22, color = C.amb }) => (
  <div style={{ width: 2, height, background: color, flexShrink: 0 }} />
);

const SectionHead = ({ eyebrow, title, color = C.amb, style: s = {} }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, ...s }}>
    <RedBar height={eyebrow ? 32 : 22} color={color} />
    <div>
      {eyebrow && <div style={lbl}>{eyebrow}</div>}
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: eyebrow ? 3 : 0, letterSpacing: '-0.01em' }}>{title}</div>
    </div>
  </div>
);

const Badge = ({ children, bg = C.ambL, tc = C.amb, bc = C.ambG }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 8px', background:bg, color:tc, border:`1px solid ${bc}`, fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
    {children}
  </span>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.s2, border:`1px solid ${C.brdHi}`, padding:'10px 14px', fontSize:11, boxShadow:'0 2px 12px rgba(14,14,14,0.08)' }}>
      {label && <div style={{ color:C.tx2, marginBottom:6, fontWeight:600, ...lbl }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, color:C.tx, padding:'2px 0' }}>
          <span style={{ width:8, height:8, background:p.color||p.fill, flexShrink:0 }} />
          <span style={{ color:C.tx2 }}>{p.name}:</span>
          <span style={{ fontWeight:700, ...mono }}>{typeof p.value==='number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const KPI = ({ label: lbl_, value, delta, icon: Icon }) => {
  const up = (delta ?? 0) >= 0;
  return (
    <div style={{ ...kpiS, position:'relative', overflow:'hidden' }} className="lift">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={lbl}>{lbl_}</div>
        <Icon style={{ color:C.tx3, width:12, height:12 }} />
      </div>
      <div style={{ fontSize:34, fontWeight:700, color:C.tx, letterSpacing:'-0.025em', lineHeight:1, ...mono }}>{value}</div>
      {delta !== undefined && (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:10, fontSize:10 }}>
          <span style={{ color: up ? C.em : C.rose, display:'flex', alignItems:'center', gap:2, fontWeight:700, ...mono }}>
            {up ? <ArrowUpRight style={{width:11,height:11}}/> : <ArrowDownRight style={{width:11,height:11}}/>}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span style={{ color:C.tx3, letterSpacing:'0.06em', fontSize:9, textTransform:'uppercase' }}>vs last month</span>
        </div>
      )}
    </div>
  );
};

const Sel = ({ value, onChange, children, style: st = {} }) => (
  <div style={{ position:'relative' }}>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, paddingRight:32, appearance:'none', cursor:'pointer', ...st }}>
      {children}
    </select>
    <ChevronDown style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:C.tx2, width:12, height:12, pointerEvents:'none' }} />
  </div>
);

const Row  = ({ children, style: s = {} }) => <div style={{ display:'flex', alignItems:'center', ...s }}>{children}</div>;
const Grid = ({ children, cols = 'repeat(auto-fit,minmax(160px,1fr))', gap = 8, style: s = {} }) => (
  <div style={{ display:'grid', gridTemplateColumns:cols, gap, ...s }}>{children}</div>
);

// ── LANDING ───────────────────────────────────────────────────────────────────
const Landing = ({ onLaunch }) => {
  const heroStats = [['12,438','Active Listings'],['RM 68.5k','Median Price'],['94,200 km','Avg Mileage'],['13','Regions']];
  const tickers   = ['12,438 Active Listings','RM 68.5k Median Price','94,200 km Avg Mileage','13 Regions Tracked','847 Dealers Monitored','4× Daily Refresh','420K+ Records Indexed','Apify-Powered Pipeline'];
  const features  = [
    { n:'01', title:'Dealer Pricing',    desc:'Benchmark your ask against live competitor listings for the exact make, model, year, and region — before the test drive.' },
    { n:'02', title:'Market Trends',     desc:'Track price, mileage, and volume by region over time. Spot demand shifts months before quarterly reports confirm them.' },
    { n:'03', title:'Valuation Engine',  desc:"Feed normalised listing data into your price-estimation model — or use AutoPulse's built-in cohort valuator with bands." },
    { n:'04', title:'Inventory Watch',   desc:'Monitor competitor dealer stock on a schedule. Get alerted on price drops, new arrivals, or sudden sell-downs.' },
  ];
  const pipeline  = ['Mudah.my','Apify Actor','Normalise','Time Series','AutoPulse'];

  return (
    <div style={{ background:C.bg, color:C.tx, minHeight:'100vh', position:'relative' }}>

      {/* ── Masthead Nav ── */}
      <header style={{ position:'sticky', top:0, zIndex:100, background:C.bg }}>
        <div style={{ padding:'0 48px', display:'flex', alignItems:'stretch', height:54, borderBottom:`1px solid ${C.brd}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, paddingRight:32, marginRight:32, borderRight:`1px solid ${C.brd}` }}>
            <div style={{ width:28, height:28, background:C.tx, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Gauge style={{ width:14, height:14, color:C.s2 }} />
            </div>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase' }}>AutoPulse</div>
          </div>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:32 }}>
            {['Features','Pipeline','Pricing'].map(l => (
              <span key={l} className="nav-item" style={{ fontSize:11, fontWeight:600, color:C.tx2, cursor:'pointer', letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center' }}>
            <button style={{ ...btn, display:'flex', alignItems:'center', gap:8 }} onClick={onLaunch}>
              Open Dashboard <ArrowRight style={{ width:12, height:12 }} />
            </button>
          </div>
        </div>
        {/* Issue strip */}
        <div style={{ padding:'5px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C.brd}`, background:C.s1 }}>
          <div style={{ ...lbl, fontSize:8 }}>Malaysia's Used-Car Market Intelligence Platform</div>
          <Row style={{ gap:6 }}>
            <div style={{ width:5, height:5, background:C.em, borderRadius:'50%' }} className="blink" />
            <span style={{ ...lbl, fontSize:8, color:C.em }}>Live · Apify Connected</span>
          </Row>
          <div style={{ ...lbl, fontSize:8 }}>Vol.3 No.22 · June 2026</div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'72px 48px 64px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center' }}>
        {/* Left */}
        <div>
          <div className="e0" style={{ ...lbl, marginBottom:20, color:C.amb }}>Powered by Apify Mudah Scraper</div>
          <h1 className="e1" style={{ ...serif, fontSize:'clamp(44px,5vw,68px)', fontWeight:400, lineHeight:1.06, marginBottom:28 }}>
            Malaysia's<br />
            <em style={{ color:C.amb }}>used-car market</em><br />
            decoded in real time.
          </h1>
          <p className="e2" style={{ fontSize:14, color:C.tx2, lineHeight:1.85, maxWidth:440, marginBottom:36 }}>
            AutoPulse ingests Mudah.my listings via Apify, normalises them into clean time-series data, and turns raw classifieds into pricing strategy and competitor intelligence.
          </p>
          <Row className="e3" style={{ gap:10, flexWrap:'wrap' }}>
            <button style={{ ...btn, background:C.amb, display:'flex', alignItems:'center', gap:8 }} onClick={onLaunch}>
              Launch Dashboard <ArrowRight style={{ width:13, height:13 }} />
            </button>
            <button style={{ ...ghost, display:'flex', alignItems:'center', gap:8 }}>
              <Play style={{ width:11, height:11 }} /> 90-sec Tour
            </button>
          </Row>
        </div>

        {/* Right — editorial stat card */}
        <div className="er" style={{ ...card, padding:'40px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-14, bottom:-28, ...serif, fontSize:188, fontWeight:400, color:'rgba(14,14,14,0.035)', lineHeight:1, pointerEvents:'none', userSelect:'none' }}>420K</div>
          <div style={{ ...lbl, marginBottom:24 }}>Market Snapshot · June 2026</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', position:'relative' }}>
            {heroStats.map(([val, lb], i) => (
              <div key={i} style={{ padding:'24px 20px', borderRight: i%2===0 ? `1px solid ${C.brd}` : 'none', borderBottom: i<2 ? `1px solid ${C.brd}` : 'none' }}>
                <div style={{ fontSize:28, fontWeight:700, ...mono, letterSpacing:'-0.02em', color:C.tx, marginBottom:5 }}>{val}</div>
                <div style={lbl}>{lb}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ ...lbl }}>Data source</div>
            <Badge bg="rgba(21,92,56,0.07)" tc={C.em} bc="rgba(21,92,56,0.22)">
              <div style={{ width:5, height:5, background:C.em, borderRadius:'50%' }} className="blink" /> Mudah.my via Apify
            </Badge>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div style={{ borderTop:`1px solid ${C.brd}`, borderBottom:`1px solid ${C.brd}`, background:C.s1, padding:'11px 0', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:60, background:`linear-gradient(90deg,${C.s1},transparent)`, zIndex:2 }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:60, background:`linear-gradient(270deg,${C.s1},transparent)`, zIndex:2 }} />
        <div className="ticker-anim" style={{ display:'flex', whiteSpace:'nowrap', width:'max-content' }}>
          {[...tickers,...tickers].map((x,i) => (
            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'0 28px', fontSize:10, color:C.tx2, letterSpacing:'0.1em', textTransform:'uppercase' }}>
              <span style={{ width:3, height:3, background:C.amb, flexShrink:0 }} />
              {x}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'72px 48px' }}>
        <Row style={{ alignItems:'flex-end', justifyContent:'space-between', marginBottom:44 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            <RedBar height={44} />
            <div>
              <div style={lbl}>Built for the market</div>
              <h2 style={{ ...serif, fontSize:34, fontWeight:400, marginTop:6, letterSpacing:'-0.01em' }}>Four lenses on one dataset.</h2>
            </div>
          </div>
          <div style={{ ...lbl, fontSize:8, color:C.tx3 }}>Intelligence Platform v3</div>
        </Row>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:C.brd }}>
          {features.map((f,i) => (
            <div key={i} className="lift" style={{ background:C.s2, padding:'32px 28px' }}>
              <div style={{ ...mono, fontSize:11, fontWeight:600, color:C.amb, marginBottom:20, letterSpacing:'0.06em' }}>{f.n}</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10, letterSpacing:'-0.01em', lineHeight:1.3 }}>{f.title}</div>
              <div style={{ fontSize:12, color:C.tx2, lineHeight:1.8 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'0 48px 72px' }}>
        <div style={{ ...card, padding:'40px 44px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:36 }}>
            <RedBar height={36} color={C.sky} />
            <div>
              <div style={lbl}>Pipeline Architecture</div>
              <h2 style={{ ...serif, fontSize:24, fontWeight:400, marginTop:5 }}>From classified ad to decision-ready signal.</h2>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center' }}>
            {pipeline.map((n,i,arr) => (
              <React.Fragment key={i}>
                <div style={{ textAlign:'center', flexShrink:0, padding:'0 4px' }}>
                  <div style={{ ...lbl, fontSize:8, marginBottom:6 }}>Step {String(i+1).padStart(2,'0')}</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{n}</div>
                </div>
                {i < arr.length-1 && (
                  <div style={{ flex:1, height:1, background:C.brd, margin:'0 12px', position:'relative', top:4 }}>
                    <div style={{ position:'absolute', left:'44%', top:'50%', transform:'translateY(-50%)', width:5, height:5, background:C.amb, borderRadius:'50%' }} className="blink" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'0 48px 80px' }}>
        <div style={{ background:C.tx, padding:'52px 56px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:28 }}>
          <div>
            <h2 style={{ ...serif, fontSize:36, fontWeight:400, color:C.s2, lineHeight:1.15, marginBottom:10 }}>
              Ready to go <em style={{ color:C.amb }}>live?</em>
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', maxWidth:420, lineHeight:1.8 }}>
              Paste your Apify token in the Pipeline tab and trigger a real Mudah scrape in seconds. 420 demo listings loaded until then.
            </p>
          </div>
          <button style={{ ...btn, background:C.amb, fontSize:13, padding:'14px 32px', display:'flex', alignItems:'center', gap:10 }} onClick={onLaunch}>
            Enter AutoPulse <ArrowRight style={{ width:14, height:14 }} />
          </button>
        </div>
      </section>

      <footer style={{ borderTop:`1px solid ${C.brd}`, padding:'16px 48px', display:'flex', justifyContent:'space-between', ...lbl, fontSize:8, flexWrap:'wrap', gap:8 }}>
        <span>AutoPulse MY · Powered by Apify Mudah Scraper</span>
        <span>Docs · API · Status · Privacy</span>
      </footer>
    </div>
  );
};

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
const TABS = [
  { id:'overview',  icon:Activity,   label:'Overview' },
  { id:'pricing',   icon:Target,     label:'Pricing' },
  { id:'trends',    icon:TrendingUp, label:'Trends' },
  { id:'regional',  icon:MapPin,     label:'Regional' },
  { id:'valuation', icon:Calculator, label:'Valuation' },
  { id:'inventory', icon:Eye,        label:'Inventory' },
  { id:'pipeline',  icon:Workflow,   label:'Pipeline & API' },
];

const Sidebar = ({ tab, setTab, collapsed, setCollapsed, isLive, count, onHome }) => (
  <div style={{ width:collapsed?48:196, background:C.s1, borderRight:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', flexShrink:0, transition:'width .22s cubic-bezier(.2,0,0,1)', overflow:'hidden' }}>
    <div style={{ height:54, display:'flex', alignItems:'center', padding:collapsed?'0 12px':'0 14px', borderBottom:`1px solid ${C.brd}`, gap:10, justifyContent:collapsed?'center':'flex-start', flexShrink:0 }}>
      {!collapsed && (
        <>
          <div style={{ width:26, height:26, background:C.tx, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Gauge style={{ width:13, height:13, color:C.s2 }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase' }}>AutoPulse</div>
            <div style={{ fontSize:8, color:C.tx3, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' }}>MY · Intelligence</div>
          </div>
        </>
      )}
      <button onClick={() => setCollapsed(c => !c)} style={{ background:'none', border:`1px solid ${C.brd}`, padding:4, cursor:'pointer', color:C.tx2, display:'flex', flexShrink:0 }}>
        <ChevronLeft style={{ width:11, height:11, transform:collapsed?'rotate(180deg)':'none', transition:'transform .22s' }} />
      </button>
    </div>

    <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
      {TABS.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} title={collapsed ? t.label : ''} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'11px 0':'10px 14px', justifyContent:collapsed?'center':'flex-start', background:'none', border:'none', borderLeft:active?`2px solid ${C.amb}`:'2px solid transparent', cursor:'pointer', color:active?C.tx:C.tx2, fontSize:12, fontWeight:active?700:500, letterSpacing:'0.03em', transition:'color .15s, border-color .15s', fontFamily:'inherit' }}>
            <t.icon style={{ width:14, height:14, flexShrink:0, color:active?C.amb:C.tx3, transition:'color .15s' }} />
            {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
        );
      })}
    </div>

    {!collapsed && (
      <div style={{ padding:'12px 14px', borderTop:`1px solid ${C.brd}`, flexShrink:0 }}>
        <div style={lbl}>Data mode</div>
        <div style={{ marginTop:8 }}>
          <Badge bg={isLive?'rgba(21,92,56,0.08)':C.ambL} tc={isLive?C.em:C.tx2} bc={isLive?'rgba(21,92,56,0.25)':C.brd}>
            {isLive ? <><CheckCircle2 style={{width:9,height:9}}/> Live · {count}</> : <><AlertCircle style={{width:9,height:9}}/> Demo · {count}</>}
          </Badge>
        </div>
        <button onClick={onHome} style={{ ...ghost, width:'100%', marginTop:10, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Home style={{ width:10, height:10 }} /> Home
        </button>
      </div>
    )}
  </div>
);

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
const Overview = ({ listings }) => {
  const { total, median, avgMil } = useMemo(() => {
    const prices = [...listings.map(l => l.price)].sort((a,b) => a-b);
    return { total:listings.length, median:prices[Math.floor(prices.length/2)]||0, avgMil:Math.round(listings.reduce((a,b)=>a+b.mileage,0)/(listings.length||1)) };
  }, [listings]);

  const monthly = useMemo(() => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => ({
    m, listings:Math.round(2200+Math.sin(i*.65)*420+i*55), price:Math.round(62+Math.sin(i*.5)*4+i*.35)
  })), []);

  const brandMap = useMemo(() => {
    const mp = {};
    listings.forEach(l => { mp[l.brand] = (mp[l.brand]||0)+1; });
    return Object.entries(mp).map(([name,value]) => ({name,value})).sort((a,b) => b.value-a.value);
  }, [listings]);

  return (
    <div className="si">
      <Grid gap={1} style={{ marginBottom:16, background:C.brd }}>
        <KPI label="Total Listings" value={total.toLocaleString()} delta={4.2}  icon={Car} />
        <KPI label="Median Price"   value={fmtRM(median)}          delta={1.1}  icon={DollarSign} />
        <KPI label="Avg Mileage"    value={(avgMil/1000).toFixed(0)+'k km'} delta={-2.3} icon={Gauge} />
        <KPI label="Regions Active" value={new Set(listings.map(l=>l.region)).size} delta={0} icon={MapPin} />
      </Grid>

      <Grid cols="2fr 1fr" gap={8} style={{ marginBottom:8 }}>
        <div style={cardP}>
          <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <SectionHead eyebrow="12-month trajectory" title="Volume & Median Price" />
            <Badge bg="rgba(21,92,56,0.07)" tc={C.em} bc="rgba(21,92,56,0.22)">
              <div style={{ width:5,height:5,background:C.em,borderRadius:'50%' }} className="blink" /> Live
            </Badge>
          </Row>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthly}>
              <defs>
                <linearGradient id="og1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.amb} stopOpacity={.25} />
                  <stop offset="100%" stopColor={C.amb} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.brd} strokeDasharray="3 6" />
              <XAxis dataKey="m" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={{ stroke:C.brd }} />
              <YAxis yAxisId="l" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar yAxisId="l" dataKey="listings" fill="url(#og1)" stroke={C.amb} strokeWidth={.8} radius={[0,0,0,0]} name="Listings" />
              <Line yAxisId="r" type="monotone" dataKey="price" stroke={C.sky} strokeWidth={2} dot={{ r:2.5, fill:C.sky, strokeWidth:0 }} name="Median (RM k)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={cardP}>
          <SectionHead eyebrow="By listing count" title="Brand Distribution" style={{ marginBottom:16 }} />
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={brandMap} dataKey="value" nameKey="name" innerRadius={36} outerRadius={62} paddingAngle={2} strokeWidth={0}>
                {brandMap.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <Divider style={{ margin:'12px 0' }} />
          {brandMap.slice(0,5).map((b,i) => (
            <Row key={b.name} style={{ justifyContent:'space-between', padding:'4px 0', fontSize:11 }}>
              <Row style={{ gap:8 }}>
                <span style={{ width:8, height:8, background:COLORS[i%COLORS.length], flexShrink:0 }} />
                <span style={{ color:C.tx2 }}>{b.name}</span>
              </Row>
              <span style={{ color:C.tx, ...mono }}>{b.value}</span>
            </Row>
          ))}
        </div>
      </Grid>

      <div style={cardP}>
        <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <SectionHead eyebrow="Latest ingested from Mudah" title="Recent Listings" />
          <Badge bg={C.s3} tc={C.tx2} bc={C.brd}>{listings[0]?.source==='apify'?'Apify':'Demo'}</Badge>
        </Row>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['ID','Title','Price','Mileage','Region','Seller','Posted'].map(h => (
                  <th key={h} style={{ ...lbl, padding:'6px 10px', textAlign:['Price','Mileage'].includes(h)?'right':'left', borderBottom:`1px solid ${C.brd}`, fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.slice(0,10).map(l => (
                <tr key={l.id} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                  <td style={{ padding:'9px 10px', color:C.tx3, ...mono, fontSize:10 }}>{l.id}</td>
                  <td style={{ padding:'9px 10px', color:C.tx, fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.title}</td>
                  <td style={{ padding:'9px 10px', textAlign:'right', ...mono, fontWeight:700 }}>{fmtRM(l.price)}</td>
                  <td style={{ padding:'9px 10px', textAlign:'right', color:C.tx2, ...mono }}>{(l.mileage/1000).toFixed(0)}k</td>
                  <td style={{ padding:'9px 10px', color:C.tx2, fontSize:11 }}>{l.region}</td>
                  <td style={{ padding:'9px 10px' }}>
                    <Badge bg={l.seller==='Dealer'?C.ambL:'rgba(22,64,200,0.07)'} tc={l.seller==='Dealer'?C.amb:C.sky} bc="transparent">{l.seller}</Badge>
                  </td>
                  <td style={{ padding:'9px 10px', textAlign:'right', color:C.tx3, fontSize:10, ...mono }}>{l.days===0?'today':`${l.days}d`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── PRICING ───────────────────────────────────────────────────────────────────
const Pricing = ({ listings }) => {
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('City');
  const models = useMemo(() => BRANDS.find(b => b.b===brand)?.models||[], [brand]);
  useEffect(() => { if (!models.includes(model)) setModel(models[0]||''); }, [brand, models]);

  const filtered = useMemo(() => listings.filter(l => l.brand===brand && l.model===model), [listings, brand, model]);
  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const p = [...filtered.map(l => l.price)].sort((a,b) => a-b);
    return { n:filtered.length, min:p[0]||0, p25:p[Math.floor(p.length*.25)]||0, median:p[Math.floor(p.length*.5)]||0, p75:p[Math.floor(p.length*.75)]||0, max:p[p.length-1]||0 };
  }, [filtered]);

  const byYear = useMemo(() => {
    const mp = {};
    filtered.forEach(l => { if (!mp[l.year]) mp[l.year]={yr:l.year,sum:0,n:0,min:Infinity,max:0}; mp[l.year].sum+=l.price; mp[l.year].n++; mp[l.year].min=Math.min(mp[l.year].min,l.price); mp[l.year].max=Math.max(mp[l.year].max,l.price); });
    return Object.values(mp).map(x => ({year:x.yr,avg:Math.round(x.sum/x.n/1000),min:Math.round(x.min/1000),max:Math.round(x.max/1000)})).sort((a,b) => a.year-b.year);
  }, [filtered]);

  const bands = [
    { l:'Min',    v:stats?.min,    c:C.rose },
    { l:'P25',    v:stats?.p25,    c:'#A05C00' },
    { l:'Median', v:stats?.median, c:C.amb },
    { l:'P75',    v:stats?.p75,    c:C.sky },
    { l:'Max',    v:stats?.max,    c:C.vi },
  ];

  return (
    <div className="si">
      <div style={{ ...cardP, marginBottom:8 }}>
        <Row style={{ gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <Label>Brand</Label>
            <Sel value={brand} onChange={setBrand} style={{ minWidth:160, marginTop:6 }}>
              {BRANDS.map(b => <option key={b.b}>{b.b}</option>)}
            </Sel>
          </div>
          <div>
            <Label>Model</Label>
            <Sel value={model} onChange={setModel} style={{ minWidth:140, marginTop:6 }}>
              {models.map(m => <option key={m}>{m}</option>)}
            </Sel>
          </div>
          <div style={{ flex:1 }} />
          <button style={{ ...ghost, display:'flex', alignItems:'center', gap:6 }}>
            <Download style={{ width:11, height:11 }} /> Export CSV
          </button>
        </Row>
      </div>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:C.brd, marginBottom:8 }}>
          {bands.map(b => (
            <div key={b.l} style={{ background:C.s2, borderTop:`2px solid ${b.c}`, padding:'16px 18px' }}>
              <div style={{ ...lbl, color:b.c, marginBottom:8 }}>{b.l}</div>
              <div style={{ fontSize:17, fontWeight:700, color:C.tx, ...mono }}>{fmtRM(b.v||0)}</div>
            </div>
          ))}
        </div>
      )}

      <Grid cols="3fr 2fr" gap={8}>
        <div style={cardP}>
          <SectionHead eyebrow={`${brand} ${model} · min / avg / max`} title="Price Spread by Year (RM k)" style={{ marginBottom:20 }} />
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={byYear}>
              <CartesianGrid stroke={C.brd} strokeDasharray="3 6" />
              <XAxis dataKey="year" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={{ stroke:C.brd }} />
              <YAxis stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="max" fill={C.ambL} stroke={C.amb} strokeWidth={.8} name="Max" />
              <Bar dataKey="min" fill="rgba(181,16,32,0.07)" stroke={C.rose} strokeWidth={.8} name="Min" />
              <Line type="monotone" dataKey="avg" stroke={C.sky} strokeWidth={2.5} dot={{ r:3, fill:C.sky, strokeWidth:0 }} name="Average" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardP, overflowY:'auto', maxHeight:360 }}>
          <Row style={{ justifyContent:'space-between', marginBottom:12 }}>
            <Label>All Matches</Label>
            <Badge bg={C.s3} tc={C.tx2} bc={C.brd}>{filtered.length}</Badge>
          </Row>
          <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Yr','Price','Mil km','Region'].map(h => (
                  <th key={h} style={{ ...lbl, fontSize:8, padding:'4px 6px', textAlign:'left', borderBottom:`1px solid ${C.brd}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,40).map(l => (
                <tr key={l.id} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                  <td style={{ padding:'6px', ...mono, color:C.tx2, fontSize:11 }}>{l.year}</td>
                  <td style={{ padding:'6px', ...mono, fontWeight:700 }}>{fmtRM(l.price)}</td>
                  <td style={{ padding:'6px', ...mono, color:C.tx2 }}>{(l.mileage/1000).toFixed(0)}k</td>
                  <td style={{ padding:'6px', color:C.tx2, fontSize:10 }}>{l.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Grid>
    </div>
  );
};

// ── TRENDS ────────────────────────────────────────────────────────────────────
const Trends = ({ listings }) => {
  const [metric, setMetric] = useState('price');
  const regions = ['Kuala Lumpur','Selangor','Johor','Penang'];
  const data = useMemo(() => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => {
    const base = metric==='price'?65:metric==='mileage'?95:2300;
    const row = { m };
    regions.forEach((reg,j) => { const f=1+(j-1.5)*.08; row[reg]=Math.round((base+Math.sin((i+j)*.5)*(metric==='volume'?185:4.2)+i*(metric==='volume'?27:.26))*f); });
    return row;
  }), [metric]);

  return (
    <div className="si">
      <div style={{ ...cardP, marginBottom:8 }}>
        <Row style={{ gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:12, fontWeight:700, marginRight:4 }}>Metric</div>
          {[{id:'price',l:'Median Price'},{id:'mileage',l:'Avg Mileage'},{id:'volume',l:'Volume'}].map(t => (
            <button key={t.id} onClick={() => setMetric(t.id)} style={{ padding:'6px 16px', fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:'0.06em', textTransform:'uppercase', border:metric===t.id?`1px solid ${C.amb}`:`1px solid ${C.brd}`, background:metric===t.id?C.ambL:'transparent', color:metric===t.id?C.amb:C.tx2, fontFamily:'inherit' }}>
              {t.l}
            </button>
          ))}
        </Row>
      </div>

      <div style={{ ...cardP, marginBottom:8 }}>
        <SectionHead eyebrow="By region · 12 months" title={metric==='price'?'Median Price (RM k)':metric==='mileage'?'Avg Mileage (k km)':'Listing Volume'} style={{ marginBottom:20 }} />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid stroke={C.brd} strokeDasharray="3 6" />
            <XAxis dataKey="m" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={{ stroke:C.brd }} />
            <YAxis stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<TT />} />
            {regions.map((reg,i) => <Line key={reg} type="monotone" dataKey={reg} stroke={COLORS[i]} strokeWidth={2} dot={{ r:2.5, fill:COLORS[i], strokeWidth:0 }} />)}
          </LineChart>
        </ResponsiveContainer>
        <Row style={{ gap:20, marginTop:12, flexWrap:'wrap' }}>
          {regions.map((reg,i) => (
            <Row key={reg} style={{ gap:6, fontSize:11, color:C.tx2 }}>
              <span style={{ width:16, height:2, background:COLORS[i], display:'inline-block' }} />{reg}
            </Row>
          ))}
        </Row>
      </div>

      <Grid cols="1fr 1fr" gap={8}>
        <div style={cardP}>
          <SectionHead eyebrow="30-day window" title="Price Movers" style={{ marginBottom:16 }} />
          {[{m:'Proton X50 1.5T',d:4.8,up:true},{m:'Honda City 1.5V',d:3.2,up:true},{m:'Toyota Vios 1.5G',d:1.7,up:true},{m:'BMW 320i Sport',d:2.1,up:false},{m:'Mercedes C200',d:3.4,up:false}].map((x,i) => (
            <Row key={i} style={{ justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.brd}` }}>
              <span style={{ fontSize:12, color:C.tx }}>{x.m}</span>
              <Row style={{ gap:4, fontSize:12, fontWeight:700, color:x.up?C.em:C.rose, ...mono }}>
                {x.up?<ArrowUpRight style={{width:12,height:12}}/>:<ArrowDownRight style={{width:12,height:12}}/>}
                {Math.abs(x.d).toFixed(1)}%
              </Row>
            </Row>
          ))}
        </div>

        <div style={cardP}>
          <SectionHead eyebrow="KL normalised" title="Seasonal Volume" style={{ marginBottom:12 }} />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sa1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.vi} stopOpacity={.25} />
                  <stop offset="100%" stopColor={C.vi} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.brd} strokeDasharray="3 6" />
              <XAxis dataKey="m" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={{ stroke:C.brd }} />
              <YAxis stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="Kuala Lumpur" stroke={C.vi} strokeWidth={2} fill="url(#sa1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Grid>
    </div>
  );
};

// ── REGIONAL ──────────────────────────────────────────────────────────────────
const Regional = ({ listings }) => {
  const regional = useMemo(() => {
    const mp = {};
    listings.forEach(l => { if (!mp[l.region]) mp[l.region]={region:l.region,count:0,sp:0,sm:0}; mp[l.region].count++; mp[l.region].sp+=l.price; mp[l.region].sm+=l.mileage; });
    return Object.values(mp).map(x => ({ region:x.region, count:x.count, avgPrice:Math.round(x.sp/x.count/1000), avgMil:Math.round(x.sm/x.count/1000) })).sort((a,b) => b.count-a.count);
  }, [listings]);
  const max = Math.max(...regional.map(r => r.count), 1);

  return (
    <div className="si">
      <Grid cols="1fr 1fr" gap={8} style={{ marginBottom:8 }}>
        <div style={cardP}>
          <SectionHead eyebrow="All regions" title="Listing Volume" style={{ marginBottom:20 }} />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regional} layout="vertical" margin={{ left:8 }}>
              <CartesianGrid stroke={C.brd} strokeDasharray="3 6" />
              <XAxis type="number" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={{ stroke:C.brd }} />
              <YAxis type="category" dataKey="region" stroke={C.tx3} fontSize={10} width={90} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="count" fill={C.amb} radius={[0,0,0,0]} name="Listings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardP}>
          <SectionHead eyebrow="Price vs mileage" title="Regional Comparison" style={{ marginBottom:20 }} />
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={regional}>
              <CartesianGrid stroke={C.brd} strokeDasharray="3 6" />
              <XAxis dataKey="region" stroke={C.tx3} fontSize={9} angle={-25} textAnchor="end" height={65} tickLine={false} />
              <YAxis yAxisId="l" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right" stroke={C.tx3} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar yAxisId="l" dataKey="avgPrice" fill={C.vi} radius={[0,0,0,0]} name="Avg Price (RM k)" opacity={.75} />
              <Line yAxisId="r" type="monotone" dataKey="avgMil" stroke={C.amb} strokeWidth={2.5} dot={{ r:3, fill:C.amb, strokeWidth:0 }} name="Avg Mileage (k km)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Grid>

      <div style={cardP}>
        <SectionHead eyebrow="Full breakdown" title="All 13 Regions" style={{ marginBottom:16 }} />
        <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Region','Listings','Avg Price','Avg Mileage','Market Share'].map(h => (
                <th key={h} style={{ ...lbl, padding:'6px 10px', textAlign:['Listings','Avg Price','Avg Mileage'].includes(h)?'right':'left', borderBottom:`1px solid ${C.brd}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regional.map(r => (
              <tr key={r.region} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                <td style={{ padding:'9px 10px', fontWeight:600 }}>{r.region}</td>
                <td style={{ padding:'9px 10px', textAlign:'right', ...mono }}>{r.count}</td>
                <td style={{ padding:'9px 10px', textAlign:'right', ...mono }}>RM {r.avgPrice}k</td>
                <td style={{ padding:'9px 10px', textAlign:'right', ...mono, color:C.tx2 }}>{r.avgMil}k km</td>
                <td style={{ padding:'9px 10px 9px 18px', minWidth:140 }}>
                  <div style={{ height:3, background:C.s3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(r.count/max)*100}%`, background:C.amb, transition:'width .6s ease' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── VALUATION ─────────────────────────────────────────────────────────────────
const Valuation = ({ listings }) => {
  const [form, setForm] = useState({ brand:'Honda', model:'City', year:2020, mileage:60000, region:'Kuala Lumpur' });
  const [result, setResult] = useState(null);
  const models = useMemo(() => BRANDS.find(b => b.b===form.brand)?.models||[], [form.brand]);
  useEffect(() => { if (models.length && !models.includes(form.model)) setForm(f => ({...f, model:models[0]})); }, [form.brand, models]);

  const calc = useCallback(() => {
    const comps = listings.filter(l => l.brand===form.brand && l.model===form.model && Math.abs(l.year-form.year)<=2);
    if (!comps.length) { setResult({ none:true }); return; }
    const avg    = comps.reduce((a,b) => a+b.price,0)/comps.length;
    const avgMil = comps.reduce((a,b) => a+b.mileage,0)/comps.length;
    const est    = avg * (1+((avgMil-form.mileage)/Math.max(avgMil,1))*0.15);
    const std    = Math.sqrt(comps.reduce((a,b) => a+Math.pow(b.price-avg,2),0)/comps.length);
    setResult({ est:Math.round(est), low:Math.round(est-std*.7), high:Math.round(est+std*.7), n:comps.length, avgMil:Math.round(avgMil) });
  }, [listings, form]);

  useEffect(() => { calc(); }, []);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  return (
    <div className="si">
      <Grid cols="1fr 1fr" gap={8}>
        <div style={cardP}>
          <SectionHead eyebrow="Estimate fair-market value" title="Vehicle Details" style={{ marginBottom:24 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { k:'brand',  l:'Make',   opts:BRANDS.map(b => b.b) },
              { k:'model',  l:'Model',  opts:models },
              { k:'year',   l:'Year',   opts:[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024] },
              { k:'region', l:'Region', opts:REGIONS },
            ].map(f => (
              <div key={f.k}>
                <Label>{f.l}</Label>
                <Sel value={String(form[f.k])} onChange={v => set(f.k, f.k==='year'?+v:v)} style={{ marginTop:6 }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </Sel>
              </div>
            ))}
            <div>
              <Row style={{ justifyContent:'space-between', marginBottom:6 }}>
                <Label>Mileage</Label>
                <span style={{ color:C.amb, ...mono, fontSize:12, fontWeight:700 }}>{form.mileage.toLocaleString()} km</span>
              </Row>
              <input type="range" min={10000} max={250000} step={5000} value={form.mileage} onChange={e => set('mileage',+e.target.value)} style={{ width:'100%', accentColor:C.amb }} />
            </div>
            <button style={{ ...btn, background:C.amb, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }} onClick={calc}>
              <Calculator style={{ width:13, height:13 }} /> Estimate Value
            </button>
          </div>
        </div>

        <div style={{ ...cardP, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, right:0, width:2, height:'100%', background:C.amb, opacity:.12 }} />
          <SectionHead eyebrow="Based on comparable listings" title="Estimated Value" style={{ marginBottom:24 }} />

          {result?.none ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.tx2 }}>
              <AlertCircle style={{ width:32, height:32, color:C.rose, display:'block', margin:'0 auto 12px' }} />
              Not enough comparable listings for this configuration.
            </div>
          ) : result ? (
            <>
              <div style={{ fontSize:52, fontWeight:700, color:C.tx, letterSpacing:'-0.03em', lineHeight:1, ...mono }}>{fmtRM(result.est)}</div>
              <div style={{ marginTop:10 }}>
                <Badge bg="rgba(21,92,56,0.07)" tc={C.em} bc="rgba(21,92,56,0.22)">
                  <CheckCircle2 style={{width:9,height:9}}/> {result.n} comparable listings
                </Badge>
              </div>
              <Divider style={{ margin:'24px 0' }} />
              <div style={{ marginBottom:8 }}>
                <Row style={{ justifyContent:'space-between', marginBottom:10, fontSize:11 }}>
                  <span style={{ color:C.tx2 }}>Confidence band</span>
                  <span style={{ fontWeight:700, ...mono }}>{fmtRM(result.low)} – {fmtRM(result.high)}</span>
                </Row>
                <div style={{ height:4, background:C.s3, position:'relative' }}>
                  <div style={{ position:'absolute', left:'15%', right:'15%', top:0, bottom:0, background:C.ambL, borderLeft:`1px solid ${C.amb}`, borderRight:`1px solid ${C.amb}` }} />
                  <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:8, height:8, background:C.amb, border:`2px solid ${C.s2}` }} />
                </div>
              </div>
              <Grid cols="1fr 1fr" gap={8} style={{ marginTop:20 }}>
                {[{l:'Market avg mileage',v:`${(result.avgMil/1000).toFixed(0)}k km`},{l:'Your mileage',v:`${(form.mileage/1000).toFixed(0)}k km`}].map(x => (
                  <div key={x.l} style={{ ...card, padding:12 }}>
                    <Label>{x.l}</Label>
                    <div style={{ fontSize:16, fontWeight:700, marginTop:6, ...mono }}>{x.v}</div>
                  </div>
                ))}
              </Grid>
              <div style={{ marginTop:16, fontSize:10, color:C.tx3, lineHeight:1.7 }}>±0.7σ confidence · ±2yr window · Mileage-adjusted ±15%</div>
            </>
          ) : null}
        </div>
      </Grid>
    </div>
  );
};

// ── INVENTORY ─────────────────────────────────────────────────────────────────
const Inventory = ({ listings }) => {
  const dealers = [
    { name:'Cycle & Carriage',        region:'Kuala Lumpur', stock:142, chg:8,  focus:'Mercedes-Benz' },
    { name:'Auto Bavaria',            region:'Selangor',     stock:98,  chg:-4, focus:'BMW' },
    { name:'PJ Used Cars Hub',        region:'Selangor',     stock:67,  chg:12, focus:'Mixed' },
    { name:'Penang Premier Motors',   region:'Penang',       stock:54,  chg:3,  focus:'Toyota / Honda' },
    { name:'JB Carmart',              region:'Johor',        stock:81,  chg:-2, focus:'Mixed' },
    { name:'Perak Auto Depot',        region:'Perak',        stock:43,  chg:6,  focus:'Perodua / Proton' },
  ];
  const alerts = [
    { ic:TrendingDown, c:C.rose, t:'Price drop',   d:'Auto Bavaria reduced 2021 BMW 320i by RM 4,000 (–2.8%)',  w:'2h ago' },
    { ic:Plus,         c:C.em,   t:'New listings', d:'PJ Used Cars Hub added 12 vehicles, mostly Honda City',   w:'5h ago' },
    { ic:AlertCircle,  c:C.amb,  t:'Stock risk',   d:'Mercedes C200 (2020): only 3 active listings nationwide', w:'1d ago' },
    { ic:TrendingUp,   c:C.sky,  t:'Price rise',   d:'Penang Premier raised Proton X50 1.5T by RM 2,500',      w:'1d ago' },
  ];

  return (
    <div className="si">
      <Grid gap={1} style={{ marginBottom:8, background:C.brd }}>
        <KPI label="Dealers Watched" value={dealers.length}                                     delta={0}   icon={Eye} />
        <KPI label="Total Stock"     value={dealers.reduce((a,b)=>a+b.stock,0)}                 delta={3.4} icon={Layers} />
        <KPI label="Active Alerts"   value={alerts.length}                                      delta={25}  icon={Bell} />
        <KPI label="Avg Δ Stock"     value={`+${(dealers.reduce((a,b)=>a+b.chg,0)/dealers.length).toFixed(1)}`} delta={1.8} icon={Activity} />
      </Grid>

      <Grid cols="3fr 2fr" gap={8}>
        <div style={cardP}>
          <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            <SectionHead eyebrow="Monitored dealers" title="Watchlist" />
            <button style={{ ...ghost, display:'flex', alignItems:'center', gap:6, fontSize:10 }}>
              <Plus style={{ width:10, height:10 }} /> Add dealer
            </button>
          </Row>
          {dealers.map(d => (
            <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', marginBottom:1, background:C.s1, border:`1px solid ${C.brd}`, borderLeft:`2px solid ${C.brd}` }}>
              <Row style={{ gap:12 }}>
                <div style={{ width:36, height:36, background:C.s3, border:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:C.amb, ...mono }}>
                  {d.name.split(' ').map(s => s[0]).slice(0,2).join('')}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{d.name}</div>
                  <div style={{ fontSize:10, color:C.tx2, marginTop:2 }}>{d.region} · {d.focus}</div>
                </div>
              </Row>
              <Row style={{ gap:20 }}>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:700, ...mono }}>{d.stock}</div>
                  <div style={{ ...lbl, fontSize:8 }}>in stock</div>
                </div>
                <Row style={{ gap:3, fontSize:12, fontWeight:700, ...mono, color:d.chg>=0?C.em:C.rose, minWidth:36, justifyContent:'flex-end' }}>
                  {d.chg>=0?<ArrowUpRight style={{width:12,height:12}}/>:<ArrowDownRight style={{width:12,height:12}}/>}
                  {d.chg>=0?'+':''}{d.chg}
                </Row>
              </Row>
            </div>
          ))}
        </div>

        <div style={cardP}>
          <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            <SectionHead eyebrow="48h window" title="Alerts" />
            <Badge bg="rgba(21,92,56,0.07)" tc={C.em} bc="rgba(21,92,56,0.22)">
              <div style={{ width:5,height:5,background:C.em,borderRadius:'50%' }} className="blink" /> Live
            </Badge>
          </Row>
          {alerts.map((a,i) => (
            <div key={i} style={{ padding:'12px', marginBottom:1, background:C.s1, border:`1px solid ${C.brd}`, borderLeft:`2px solid ${a.c}` }}>
              <Row style={{ justifyContent:'space-between', marginBottom:5 }}>
                <Row style={{ gap:6 }}>
                  <a.ic style={{ width:11, height:11, color:a.c }} />
                  <span style={{ fontSize:11, fontWeight:700 }}>{a.t}</span>
                </Row>
                <span style={{ ...lbl, fontSize:8 }}>{a.w}</span>
              </Row>
              <div style={{ fontSize:11, color:C.tx2, lineHeight:1.65 }}>{a.d}</div>
            </div>
          ))}
        </div>
      </Grid>
    </div>
  );
};

// ── PIPELINE ──────────────────────────────────────────────────────────────────
const PipelineTab = ({ apify, setApify, onLiveData }) => {
  const [mode, setMode]   = useState('run');
  const [rs, setRs]       = useState({ status:'idle', runId:null, dsId:null, error:null, pct:0 });
  const [log, setLog]     = useState([]);
  const pollerRef         = useRef(null);
  const addLog = useCallback((msg, type='info') => setLog(l => [{ msg, type, ts:new Date().toLocaleTimeString() }, ...l.slice(0,28)]), []);

  const fetchDataset = useCallback(async (dsId) => {
    addLog(`Fetching dataset (limit ${apify.maxItems})…`);
    setRs(s => ({...s, pct:95}));
    try {
      const items = await aData(apify.token, dsId, apify.maxItems);
      if (!Array.isArray(items)) throw new Error('Response is not an array — check token & dataset ID.');
      const norm = normalize(items);
      addLog(`Normalised ${norm.length} valid listings from ${items.length} raw items`, 'success');
      setRs({ status:'succeeded', runId:null, dsId, error:null, pct:100 });
      onLiveData(norm);
    } catch(e) {
      addLog(`Fetch error: ${e.message}`, 'error');
      setRs(s => ({...s, status:'failed', error:e.message}));
    }
  }, [apify.token, apify.maxItems, addLog, onLiveData]);

  const pollRun = useCallback((runId) => {
    let attempts = 0;
    pollerRef.current = setInterval(async () => {
      attempts++;
      setRs(s => ({...s, pct:Math.min(90, 15+attempts*7)}));
      try {
        const res    = await aStatus(apify.token, runId);
        const status = res?.data?.status;
        const dsId   = res?.data?.defaultDatasetId;
        addLog(`Status: ${status} · ${res?.data?.stats?.itemsWritten||0} items`);
        if (status==='SUCCEEDED') {
          clearInterval(pollerRef.current);
          addLog(`Run complete · Dataset: ${dsId}`, 'success');
          setRs(s => ({...s, status:'fetching', pct:92, dsId}));
          fetchDataset(dsId);
        } else if (['FAILED','ABORTED','TIMED-OUT'].includes(status)) {
          clearInterval(pollerRef.current);
          addLog(`Run ${status.toLowerCase()}`, 'error');
          setRs(s => ({...s, status:'failed', error:`Actor ${status.toLowerCase()}`}));
        }
      } catch(e) { addLog(`Poll error: ${e.message}`, 'error'); }
    }, 6000);
  }, [apify.token, addLog, fetchDataset]);

  useEffect(() => () => clearInterval(pollerRef.current), []);

  const startRun = async () => {
    if (!apify.token) { setRs(s => ({...s, error:'No API token set.'})); return; }
    setRs({ status:'running', runId:null, dsId:null, error:null, pct:5 });
    setLog([]);
    addLog('Triggering Apify actor run…');
    try {
      let input;
      try { input = JSON.parse(apify.inputJson); } catch { input = { startUrls:[{url:apify.searchUrl}], maxItems:apify.maxItems }; }
      const res   = await aRun(apify.token, apify.actorId, input);
      const runId = res?.data?.id;
      if (!runId) throw new Error(res?.error?.message||'No run ID returned — verify actor ID and token.');
      addLog(`Run started · ID: ${runId}`, 'success');
      setRs(s => ({...s, runId, pct:15}));
      pollRun(runId);
    } catch(e) {
      addLog(`Error: ${e.message}`, 'error');
      setRs(s => ({...s, status:'failed', error:e.message}));
    }
  };

  const loadDataset = async () => {
    if (!apify.token || !apify.datasetId) { setRs(s => ({...s, error:'Token and Dataset ID required.'})); return; }
    setRs({ status:'running', runId:null, dsId:apify.datasetId, error:null, pct:40 });
    setLog([]);
    addLog(`Loading dataset ${apify.datasetId}…`);
    fetchDataset(apify.datasetId);
  };

  const busy = rs.status==='running' || rs.status==='fetching';
  const SC   = { idle:C.tx3, running:C.amb, fetching:C.sky, succeeded:C.em, failed:C.rose };

  return (
    <div className="si">
      <Grid cols="3fr 2fr" gap={8} style={{ alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

          {/* Config card */}
          <div style={cardP}>
            <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <SectionHead eyebrow="Mudah Search Scraper" title="Apify Configuration" />
              <Badge bg="rgba(21,92,56,0.07)" tc={C.em} bc="rgba(21,92,56,0.22)">
                <ShieldCheck style={{width:9,height:9}}/> API Ready
              </Badge>
            </Row>

            <div style={{ marginBottom:16 }}>
              <Label>API Token</Label>
              <div style={{ position:'relative', marginTop:6 }}>
                <Key style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:12, height:12, color:C.tx2 }} />
                <input type="password" value={apify.token} onChange={e => setApify(a => ({...a, token:e.target.value}))} placeholder="apify_api_•••••••••••••" style={{ ...inp, paddingLeft:30 }} />
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <Label>Mode</Label>
              <div style={{ display:'flex', marginTop:6, border:`1px solid ${C.brd}` }}>
                {[{id:'run',l:'Run Actor'},{id:'dataset',l:'Load Dataset'}].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{ flex:1, padding:'8px', fontSize:11, fontWeight:700, border:'none', cursor:'pointer', background:mode===m.id?C.tx:'transparent', color:mode===m.id?C.s2:C.tx2, transition:'all .18s', fontFamily:'inherit', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    {m.l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <Label>{mode==='run'?'Actor ID':'Dataset ID'}</Label>
              <input value={mode==='run'?apify.actorId:apify.datasetId} onChange={e => setApify(a => ({...a, [mode==='run'?'actorId':'datasetId']:e.target.value}))} placeholder={mode==='run'?'apify/mudah-search-scraper':'dataset_abc123'} style={{ ...inp, marginTop:6, ...mono, fontSize:12 }} />
            </div>

            {mode==='run' && (
              <>
                <div style={{ marginBottom:16 }}>
                  <Label>Search URL</Label>
                  <input value={apify.searchUrl} onChange={e => setApify(a => ({...a, searchUrl:e.target.value}))} style={{ ...inp, marginTop:6, fontSize:12 }} placeholder="https://www.mudah.my/malaysia/cars-for-sale" />
                </div>
                <Grid cols="1fr 1fr" gap={10} style={{ marginBottom:16 }}>
                  <div>
                    <Label>Max items</Label>
                    <input type="number" value={apify.maxItems} onChange={e => setApify(a => ({...a, maxItems:+e.target.value}))} style={{ ...inp, marginTop:6, ...mono }} />
                  </div>
                  <div>
                    <Label>Input JSON override</Label>
                    <input value={apify.inputJson} onChange={e => setApify(a => ({...a, inputJson:e.target.value}))} placeholder="{}" style={{ ...inp, marginTop:6, ...mono, fontSize:11 }} />
                  </div>
                </Grid>
              </>
            )}

            {rs.status !== 'idle' && (
              <div style={{ marginBottom:18 }}>
                <Row style={{ justifyContent:'space-between', marginBottom:6, fontSize:10 }}>
                  <span style={{ color:SC[rs.status], fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>{rs.status}</span>
                  <span style={{ color:C.tx2, ...mono }}>{rs.pct}%</span>
                </Row>
                <div style={{ height:3, background:C.s3 }}>
                  {busy
                    ? <div className="stripe" style={{ height:'100%', width:`${rs.pct}%`, transition:'width .5s ease' }} />
                    : <div style={{ height:'100%', width:`${rs.pct}%`, background:rs.status==='succeeded'?C.em:C.rose, transition:'width .5s ease' }} />}
                </div>
                {rs.error && <div style={{ fontSize:11, color:C.rose, marginTop:8, lineHeight:1.6 }}>{rs.error}</div>}
              </div>
            )}

            <Row style={{ gap:8 }}>
              <button style={{ ...btn, background:C.amb, flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:(!apify.token||busy)?.5:1, cursor:(!apify.token||busy)?'not-allowed':'pointer' }} onClick={mode==='run'?startRun:loadDataset} disabled={!apify.token||busy}>
                {busy ? <><RefreshCw style={{width:13,height:13}} className="spin"/>Running…</> : mode==='run' ? <><Play style={{width:13,height:13}}/>Run Now</> : <><Database style={{width:13,height:13}}/>Load Dataset</>}
              </button>
              {rs.status !== 'idle' && (
                <button style={{ ...ghost, display:'flex', alignItems:'center', gap:6 }} onClick={() => { clearInterval(pollerRef.current); setRs({status:'idle',runId:null,dsId:null,error:null,pct:0}); setLog([]); }}>
                  <X style={{ width:11, height:11 }} /> Reset
                </button>
              )}
            </Row>

            <div style={{ marginTop:16, padding:'12px 14px', background:C.s1, border:`1px solid ${C.brd}`, borderLeft:`2px solid ${C.amb}`, fontSize:11, color:C.tx2, lineHeight:1.75 }}>
              <span style={{ color:C.amb, fontWeight:700 }}>Tip: </span>
              Token at <span style={{ color:C.sky, cursor:'pointer', textDecoration:'underline' }} onClick={() => window.open('https://console.apify.com/account/integrations','_blank')}>console.apify.com/account/integrations</span>.
              Try actor ID <code style={{ background:C.s3, padding:'1px 6px', fontSize:10, ...mono }}>apify/mudah-search-scraper</code>.
            </div>
          </div>

          {/* Run history */}
          <div style={cardP}>
            <SectionHead eyebrow="Last 5 runs" title="Run History" style={{ marginBottom:16 }} />
            <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Run ID','Time','Status','Records','Duration'].map(h => (
                    <th key={h} style={{ ...lbl, fontSize:8, padding:'5px 8px', textAlign:['Records','Duration'].includes(h)?'right':'left', borderBottom:`1px solid ${C.brd}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {id:'run_0531_06',t:'2026-05-31 06:00',s:'succeeded',r:4203,d:'12m 14s'},
                  {id:'run_0531_00',t:'2026-05-31 00:00',s:'succeeded',r:3987,d:'11m 52s'},
                  {id:'run_0530_18',t:'2026-05-30 18:00',s:'succeeded',r:4118,d:'12m 03s'},
                  {id:'run_0530_12',t:'2026-05-30 12:00',s:'failed',   r:0,   d:'3m 21s'},
                  {id:'run_0530_06',t:'2026-05-30 06:00',s:'succeeded',r:4067,d:'12m 09s'},
                ].map(r => (
                  <tr key={r.id} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                    <td style={{ padding:'7px 8px', color:C.tx3, ...mono, fontSize:10 }}>{r.id}</td>
                    <td style={{ padding:'7px 8px', color:C.tx2, fontSize:11 }}>{r.t}</td>
                    <td style={{ padding:'7px 8px' }}>
                      <Badge bg={r.s==='succeeded'?'rgba(21,92,56,0.07)':'rgba(181,16,32,0.07)'} tc={r.s==='succeeded'?C.em:C.rose} bc="transparent">
                        {r.s==='succeeded'?<CheckCircle2 style={{width:8,height:8}}/>:<AlertCircle style={{width:8,height:8}}/>} {r.s}
                      </Badge>
                    </td>
                    <td style={{ padding:'7px 8px', textAlign:'right', ...mono }}>{r.r.toLocaleString()}</td>
                    <td style={{ padding:'7px 8px', textAlign:'right', color:C.tx2, ...mono }}>{r.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={cardP}>
            <SectionHead eyebrow="Live state" title="Data Flow" style={{ marginBottom:18 }} />
            {[
              { ic:Globe,    l:'Mudah.my',   s:'Source reachable' },
              { ic:Workflow, l:'Apify Actor', s:rs.status==='running'?'Running…':rs.status==='succeeded'?'Complete':rs.status==='failed'?'Failed':'Idle' },
              { ic:Cpu,      l:'Normalizer',  s:'Field mapper ready' },
              { ic:Database, l:'Dataset',     s:rs.dsId||'Awaiting run' },
              { ic:BarChart3,l:'Dashboard',   s:'Live' },
            ].map((n,i,arr) => (
              <div key={i} style={{ position:'relative' }}>
                <Row style={{ gap:12, padding:'10px 0' }}>
                  <div style={{ width:34, height:34, background:C.s1, border:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <n.ic style={{ width:15, height:15, color:C.amb }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700 }}>{n.l}</div>
                    <div style={{ fontSize:10, color:C.tx2, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', ...mono }}>{n.s}</div>
                  </div>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:C.em }} className="blink" />
                </Row>
                {i < arr.length-1 && <div style={{ position:'absolute', left:16, top:44, width:1, height:12, background:C.brd }} />}
              </div>
            ))}
          </div>

          <div style={{ ...cardP, maxHeight:300, display:'flex', flexDirection:'column' }}>
            <Row style={{ justifyContent:'space-between', marginBottom:12 }}>
              <Label>Run Log</Label>
              {log.length > 0 && <button style={{ ...ghost, fontSize:9, padding:'3px 8px' }} onClick={() => setLog([])}>Clear</button>}
            </Row>
            <div style={{ overflowY:'auto', flex:1, ...mono, fontSize:10 }}>
              {log.length === 0 && <div style={{ color:C.tx3, fontStyle:'italic' }}>Awaiting run…</div>}
              {log.map((l,i) => (
                <div key={i} style={{ display:'flex', gap:8, padding:'4px 0', borderBottom:`1px solid ${C.brd}`, alignItems:'flex-start' }}>
                  <span style={{ color:C.tx3, flexShrink:0 }}>{l.ts}</span>
                  <span style={{ color:l.type==='error'?C.rose:l.type==='success'?C.em:C.tx2, flex:1, lineHeight:1.5 }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Grid>
    </div>
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const TITLES = {
  overview:'Overview', pricing:'Pricing Benchmarks', trends:'Market Trends',
  regional:'Regional Analysis', valuation:'Valuation Tool',
  inventory:'Inventory Monitor', pipeline:'Pipeline & Apify API',
};
const DESCS = {
  overview:"Bird's-eye view of the Malaysian used-car market.",
  pricing:'Benchmark asking prices for any make/model combination.',
  trends:'Price, mileage, and volume trajectories over time.',
  regional:'Compare all 13 Malaysian states and territories.',
  valuation:'Estimate fair-market value with confidence bands.',
  inventory:'Watch competitor dealers and track inventory changes.',
  pipeline:'Configure Apify scraper and trigger live data ingestion.',
};

const Dashboard = ({ onHome, liveListings, setLiveListings }) => {
  const [tab, setTab]               = useState('overview');
  const [collapsed, setCollapsed]   = useState(false);
  const [apify, setApify]           = useState({ token:'', actorId:'apify/mudah-search-scraper', searchUrl:'https://www.mudah.my/malaysia/cars-for-sale', maxItems:300, datasetId:'', inputJson:'{}' });
  const listings = useMemo(() => liveListings || MOCK, [liveListings]);
  const isLive   = !!liveListings;

  const tabContent = {
    overview:  <Overview   listings={listings} />,
    pricing:   <Pricing    listings={listings} />,
    trends:    <Trends     listings={listings} />,
    regional:  <Regional   listings={listings} />,
    valuation: <Valuation  listings={listings} />,
    inventory: <Inventory  listings={listings} />,
    pipeline:  <PipelineTab apify={apify} setApify={setApify} onLiveData={setLiveListings} />,
  };

  return (
    <div style={{ background:C.bg, color:C.tx, minHeight:'100vh', display:'flex', fontFamily:'inherit' }}>
      <Sidebar tab={tab} setTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed} isLive={isLive} count={listings.length} onHome={onHome} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Header */}
        <div style={{ padding:'0 24px', borderBottom:`1px solid ${C.brd}`, background:C.s1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', flexShrink:0, height:54 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
            <RedBar height={20} />
            <div>
              <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.01em' }}>{TITLES[tab]}</div>
            </div>
            <div style={{ fontSize:11, color:C.tx3, marginLeft:4 }}>{DESCS[tab]}</div>
          </div>

          <Row style={{ gap:8, flexWrap:'wrap' }}>
            <Badge bg={isLive?'rgba(21,92,56,0.07)':C.ambL} tc={isLive?C.em:C.tx3} bc={isLive?'rgba(21,92,56,0.25)':C.brd}>
              {isLive ? <><div style={{width:5,height:5,background:C.em,borderRadius:'50%'}} className="blink"/>Live · {listings.length}</> : <><AlertCircle style={{width:9,height:9}}/> Demo data</>}
            </Badge>
            <Badge bg={C.s3} tc={C.tx2} bc={C.brd}><Clock style={{width:9,height:9}}/> Updated 2h ago</Badge>
            <button style={{ ...ghost, display:'flex', alignItems:'center', gap:6, fontSize:10 }} onClick={() => setTab('pipeline')}>
              <Zap style={{ width:10, height:10, color:C.amb }} /> Go live
            </button>
          </Row>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:16, overflowY:'auto' }}>
          {tabContent[tab]}
        </div>
      </div>
    </div>
  );
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]             = useState('landing');
  const [liveListings, setLive]     = useState(null);
  const [fade, setFade]             = useState(false);

  const go = v => { setFade(true); setTimeout(() => { setView(v); setFade(false); }, 340); };

  return (
    <div style={{ fontFamily:"'Syne', ui-sans-serif, system-ui, sans-serif", background:C.bg, minHeight:'100vh', opacity:fade?0:1, transition:'opacity .34s ease' }}>
      <Styles />
      {view === 'landing'   && <Landing   onLaunch={() => go('dashboard')} />}
      {view === 'dashboard' && <Dashboard onHome={() => go('landing')} liveListings={liveListings} setLiveListings={setLive} />}
    </div>
  );
}
