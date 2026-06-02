import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Activity, AlertCircle, ArrowUpRight, ArrowDownRight, ArrowRight,
  Bell, Calculator, Car, CheckCircle2, ChevronDown, ChevronLeft,
  Clock, DollarSign, Download, Eye, Gauge,
  Layers, MapPin, Play, Plus,
  Target, TrendingUp, TrendingDown, Home
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  bg:   '#0C0B10',
  s1:   '#121120',
  s2:   '#1A1928',
  s3:   '#232235',
  brd:  'rgba(255,255,255,0.07)',
  brdHi:'rgba(255,255,255,0.15)',
  amb:  '#E8001D',
  ambL: 'rgba(232,0,29,0.10)',
  ambG: 'rgba(232,0,29,0.28)',
  sky:  '#00CFFF',
  em:   '#00D166',
  rose: '#FF3040',
  vi:   '#8B5CF6',
  gold: '#F59E0B',
  tx:   '#EAE7F8',
  tx2:  '#706E90',
  tx3:  '#3E3C5A',
};

const COLORS = ['#E8001D','#00CFFF','#00D166','#8B5CF6','#F59E0B','#FF6B35','#FF00CC','#706E90'];

const card  = { background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 2, position: 'relative', overflow: 'hidden' };
const cardP = { ...card, padding: 24 };
const kpiS  = { background: C.s1, borderTop: `2px solid ${C.amb}`, borderRight: `1px solid ${C.brd}`, borderBottom: `1px solid ${C.brd}`, borderLeft: `1px solid ${C.brd}`, borderRadius: 2, padding: '20px 24px', position: 'relative', overflow: 'hidden' };
const inp   = { background: C.s3, border: `1px solid ${C.brd}`, borderRadius: 2, color: C.tx, fontSize: 13, padding: '9px 13px', width: '100%', outline: 'none', fontFamily: 'inherit' };
const btn   = { background: C.amb, color: '#fff', border: 'none', borderRadius: 2, padding: '10px 22px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit' };
const ghost = { background: 'transparent', border: `1px solid ${C.brdHi}`, borderRadius: 2, padding: '8px 16px', fontSize: 11, fontWeight: 600, color: C.tx2, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' };
const lbl   = { color: C.tx3, fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' };
const mono  = { fontFamily: '"Share Tech Mono", ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' };

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
const aData      = (tok,ds,lim) => aFetch(`${BASE}/datasets/${ds}/items?token=${tok}&limit=${lim}&clean=true`);
const aLatestRun = (tok,act)    => aFetch(`${BASE}/acts/${encodeURIComponent(act)}/runs?token=${tok}&status=SUCCEEDED&limit=1`);

const CFG = {
  token:    import.meta.env.VITE_APIFY_TOKEN     || '',
  actorId:  import.meta.env.VITE_APIFY_ACTOR_ID  || 'apify/mudah-search-scraper',
  searchUrl:import.meta.env.VITE_APIFY_SEARCH_URL|| 'https://www.mudah.my/malaysia/cars-for-sale',
  maxItems: Number(import.meta.env.VITE_APIFY_MAX_ITEMS) || 500,
  cron:     import.meta.env.VITE_APIFY_SCHEDULE_CRON || '0 */6 * * *',
};

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
      font-family: 'Chakra Petch', ui-sans-serif, system-ui, sans-serif;
      background: ${C.bg};
      color: ${C.tx};
      -webkit-font-smoothing: antialiased;
    }

    /* Tachometer fill — R=150, 270° fill to 72% = dashoffset 509 */
    @keyframes revUp { to { stroke-dashoffset: 0; } }
    .revup { stroke-dashoffset: 509; animation: revUp 1.8s 0.6s cubic-bezier(.4,0,.2,1) forwards; }

    /* Entry animations */
    @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
    .e0 { animation: slideUp .5s cubic-bezier(.2,0,0,1) both; }
    .e1 { animation: slideUp .5s .10s cubic-bezier(.2,0,0,1) both; }
    .e2 { animation: slideUp .5s .20s cubic-bezier(.2,0,0,1) both; }
    .e3 { animation: slideUp .5s .30s cubic-bezier(.2,0,0,1) both; }
    .e4 { animation: slideUp .5s .40s cubic-bezier(.2,0,0,1) both; }
    .si { animation: fadeIn .25s ease forwards; }

    @keyframes spin   { to { transform:rotate(360deg); } }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.15} }
    @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes prog   { from{background-position:0 0} to{background-position:40px 0} }
    .spin        { animation: spin 1s linear infinite; }
    .blink       { animation: blink 1.8s ease-in-out infinite; }
    .ticker-anim { animation: ticker 55s linear infinite; }
    .stripe      { background: repeating-linear-gradient(90deg,${C.amb} 0,${C.amb} 20px,rgba(232,0,29,.3) 20px,rgba(232,0,29,.3) 40px); background-size:40px 100%; animation:prog 1s linear infinite; }

    .lift { transition: border-color .18s ease; }
    .lift:hover { border-color: rgba(255,255,255,0.14) !important; }

    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }

    input::placeholder, textarea::placeholder { color: ${C.tx3}; }
    select option { background: ${C.s2}; color: ${C.tx}; }
    input[type=range] { accent-color: ${C.amb}; }

    .trow { transition: background .12s ease; }
    .trow:hover td { background: ${C.s2}; }

    .nav-item { transition: color .14s; }
    .nav-item:hover { color: ${C.tx} !important; }
  `}</style>
);

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const Label = ({ children, color = C.tx3 }) => (
  <div style={{ ...lbl, color }}>{children}</div>
);

const Badge = ({ children, bg = C.ambL, tc = C.amb, bc = C.ambG }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', background:bg, color:tc, border:`1px solid ${bc}`, fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
    {children}
  </span>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.s3, border:`1px solid ${C.brdHi}`, padding:'10px 14px', fontSize:11, boxShadow:`0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,0,29,0.1)` }}>
      {label && <div style={{ ...lbl, marginBottom:6, color:C.sky }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, color:C.tx, padding:'2px 0' }}>
          <span style={{ width:8, height:8, background:p.color||p.fill, flexShrink:0 }} />
          <span style={{ color:C.tx2 }}>{p.name}:</span>
          <span style={{ fontWeight:700, ...mono, color:C.tx }}>{typeof p.value==='number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const KPI = ({ label: lbl_, value, delta, icon: Icon }) => {
  const up = (delta ?? 0) >= 0;
  return (
    <div style={kpiS}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={lbl}>{lbl_}</div>
        <Icon style={{ color:C.tx3, width:12, height:12 }} />
      </div>
      <div style={{ fontSize:34, fontWeight:400, color:C.tx, letterSpacing:'-0.01em', lineHeight:1, ...mono }}>{value}</div>
      {delta !== undefined && (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:10, fontSize:10 }}>
          <span style={{ color: up ? C.em : C.rose, display:'flex', alignItems:'center', gap:2, fontWeight:600, ...mono }}>
            {up ? <ArrowUpRight style={{width:11,height:11}}/> : <ArrowDownRight style={{width:11,height:11}}/>}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span style={{ color:C.tx3, letterSpacing:'0.08em', fontSize:9, textTransform:'uppercase' }}>vs last month</span>
        </div>
      )}
    </div>
  );
};

const SectionHead = ({ eyebrow, title, style: s = {} }) => (
  <div style={{ ...s }}>
    {eyebrow && <div style={{ ...lbl, marginBottom:5 }}>{eyebrow}</div>}
    <div style={{ fontSize:13, fontWeight:600, color:C.tx }}>{title}</div>
  </div>
);

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

// ── TACHOMETER ────────────────────────────────────────────────────────────────
// R=150, circ≈942. 270° arc = 707px. Fill to 72% = 509px → dashoffset 509→0.
const Tachometer = () => {
  const R = 150, cx = 240, cy = 240;
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angle = (135 + (270/8)*i) * Math.PI / 180;
    const major = i === 0 || i === 4 || i === 8;
    return { angle, major };
  });
  const stats = [
    ['12,438', 'LISTINGS',  cx,    68],
    ['RM 68.5k','MEDIAN',   392,  148],
    ['94k km', 'MILEAGE',   392,  334],
    ['13',     'REGIONS',   cx,   414],
    ['847',    'DEALERS',   88,   334],
    ['4×',     'REFRESH',   88,   148],
  ];
  return (
    <svg viewBox="0 0 480 480" style={{ width:'100%', maxWidth:420, display:'block' }} aria-hidden>
      {/* Track arc 270° */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(232,0,29,0.09)" strokeWidth="6"
        strokeDasharray="707 235" transform={`rotate(135 ${cx} ${cy})`} />
      {/* Animated fill */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.amb} strokeWidth="2" strokeLinecap="round"
        strokeDasharray="509 433" transform={`rotate(135 ${cx} ${cy})`} className="revup" />
      {/* Ticks */}
      {ticks.map(({ angle, major }, i) => (
        <line key={i}
          x1={cx + (R-4)*Math.cos(angle)} y1={cy + (R-4)*Math.sin(angle)}
          x2={cx + (major ? R+13 : R+5)*Math.cos(angle)} y2={cy + (major ? R+13 : R+5)*Math.sin(angle)}
          stroke={`rgba(232,0,29,${major ? .6 : .2})`}
          strokeWidth={major ? 1.5 : .7}
        />
      ))}
      {/* Stats */}
      {stats.map(([val, lb, x, y], i) => (
        <g key={i}>
          <text x={x} y={y-4}  textAnchor="middle" fontSize={14} fontWeight="600" fill={C.tx}  fontFamily='"Share Tech Mono"'>{val}</text>
          <text x={x} y={y+11} textAnchor="middle" fontSize={7.5} fill={C.tx3} letterSpacing="2" fontFamily='"Chakra Petch"'>{lb}</text>
        </g>
      ))}
      {/* Center */}
      <circle cx={cx} cy={cy} r={34} fill="none" stroke="rgba(232,0,29,0.14)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={5}  fill={C.amb} />
      <text x={cx} y={cy-8}  textAnchor="middle" fontSize={8.5} fontWeight="700" fill={C.amb} letterSpacing="4" fontFamily='"Chakra Petch"'>APEX</text>
      <text x={cx} y={cy+15} textAnchor="middle" fontSize={7}   fill={C.tx3}    letterSpacing="2" fontFamily='"Chakra Petch"'>MY</text>
    </svg>
  );
};

// ── LANDING ───────────────────────────────────────────────────────────────────
const Landing = ({ onLaunch }) => {
  const features = [
    { n:'01', icon:Target,    title:'Dealer Pricing',   desc:'Benchmark your ask against live competitor listings for the exact make, model, year, and region — before the test drive.' },
    { n:'02', icon:TrendingUp,title:'Market Trends',    desc:'Track price, mileage, and volume by region over time. Spot demand shifts months before quarterly reports confirm them.' },
    { n:'03', icon:Calculator,title:'Valuation Engine', desc:"Feed normalised listing data into your price-estimation model — or use AutoPulse's built-in cohort valuator with confidence bands." },
    { n:'04', icon:Eye,       title:'Inventory Watch',  desc:'Monitor competitor dealer stock on a schedule. Get alerted on price drops, new arrivals, or sudden sell-downs.' },
  ];
  const tickers = ['12,438 Active Listings','RM 68.5k Median Price','94,200 km Avg Mileage','13 Regions Tracked','847 Dealers Monitored','4× Daily Refresh','420K+ Records Indexed','Apify-Powered Pipeline'];
  const pipeline = ['Mudah.my','Apify Actor','Normalise','Time Series','AutoPulse'];

  return (
    <div style={{ background:C.bg, color:C.tx, minHeight:'100vh' }}>

      {/* ── Nav ── */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', height:58, borderBottom:`1px solid ${C.brd}`, position:'sticky', top:0, zIndex:100, background:C.bg }}>
        <Row style={{ gap:12 }}>
          <div style={{ width:32, height:32, background:C.amb, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
            <Gauge style={{ width:17, height:17, color:'#fff' }} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.tx }}>AutoPulse</div>
            <div style={{ fontSize:8, color:C.amb, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase' }}>MY · APEX INTELLIGENCE</div>
          </div>
        </Row>

        <Row style={{ gap:32 }}>
          {['Features','Pipeline','Pricing'].map(l => (
            <span key={l} className="nav-item" style={{ fontSize:11, fontWeight:500, color:C.tx2, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase' }}>{l}</span>
          ))}
        </Row>

        <button style={{ ...btn, display:'flex', alignItems:'center', gap:8 }} onClick={onLaunch}>
          Enter Dashboard <ArrowRight style={{ width:12, height:12 }} />
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'80vh', alignItems:'center', padding:'0 48px', gap:64, maxWidth:1280, margin:'0 auto' }}>

        <div>
          <div className="e0" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:6, height:6, background:C.em, borderRadius:'50%' }} className="blink" />
            <Badge bg="rgba(0,209,102,0.08)" tc={C.em} bc="rgba(0,209,102,0.25)">Apify Mudah Scraper · Live</Badge>
          </div>

          <h1 className="e1" style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:700, lineHeight:1.0, letterSpacing:'0.02em', textTransform:'uppercase', marginBottom:16 }}>
            Zero to<br />
            <span style={{ color:C.amb }}>Insight.</span>
          </h1>
          <div className="e1" style={{ fontSize:'clamp(16px,2vw,22px)', fontWeight:300, color:C.tx2, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:28 }}>
            Malaysia's Used-Car Market Intelligence
          </div>

          <p className="e2" style={{ fontSize:14, color:C.tx2, lineHeight:1.85, maxWidth:480, marginBottom:36, fontWeight:400 }}>
            AutoPulse ingests Mudah.my listings via Apify, normalises raw classifieds into clean time-series data, and delivers pricing strategy and competitor intelligence at race speed.
          </p>

          <Row className="e3" style={{ gap:12, flexWrap:'wrap' }}>
            <button style={{ ...btn, display:'flex', alignItems:'center', gap:8 }} onClick={onLaunch}>
              Launch Dashboard <ArrowRight style={{ width:13, height:13 }} />
            </button>
            <button style={{ ...ghost, display:'flex', alignItems:'center', gap:8 }}>
              <Play style={{ width:11, height:11 }} /> 90-sec Tour
            </button>
          </Row>

          {/* Spec strip */}
          <div className="e4" style={{ display:'flex', gap:0, marginTop:44, borderTop:`1px solid ${C.brd}` }}>
            {[['420K+','Records'],['4×','Daily sync'],['13','Regions'],['847','Dealers']].map(([v,l],i) => (
              <div key={i} style={{ padding:'14px 24px 0', borderRight: i<3?`1px solid ${C.brd}`:'none' }}>
                <div style={{ fontSize:20, fontWeight:700, color:C.tx, ...mono }}>{v}</div>
                <div style={{ ...lbl, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
          <Tachometer />
        </div>
      </section>

      {/* ── Ticker ── */}
      <div style={{ borderTop:`1px solid ${C.brd}`, borderBottom:`1px solid ${C.brd}`, background:C.s1, padding:'11px 0', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:60, background:`linear-gradient(90deg,${C.s1},transparent)`, zIndex:2 }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:60, background:`linear-gradient(270deg,${C.s1},transparent)`, zIndex:2 }} />
        <div className="ticker-anim" style={{ display:'flex', whiteSpace:'nowrap', width:'max-content' }}>
          {[...tickers,...tickers].map((x,i) => (
            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'0 28px', fontSize:9, color:C.tx2, letterSpacing:'0.14em', textTransform:'uppercase', ...mono }}>
              <span style={{ width:4, height:4, background:C.amb, flexShrink:0 }} />
              {x}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ padding:'72px 48px', maxWidth:1280, margin:'0 auto' }}>
        <Row style={{ alignItems:'flex-end', justifyContent:'space-between', marginBottom:44 }}>
          <div>
            <div style={{ ...lbl, color:C.amb, marginBottom:8 }}>Instrument Suite</div>
            <h2 style={{ fontSize:28, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>4 Instruments.<br/>One Cockpit.</h2>
          </div>
          <div style={{ ...lbl, fontSize:8, color:C.tx3 }}>Intelligence Platform v3</div>
        </Row>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:C.brd }}>
          {features.map((f,i) => (
            <div key={i} className="lift" style={{ ...card, padding:'28px 24px', background:C.s1 }}>
              <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
                <div style={{ ...mono, fontSize:10, fontWeight:700, color:C.amb }}>{f.n}</div>
                <f.icon style={{ width:14, height:14, color:C.tx3 }} />
              </Row>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10, letterSpacing:'0.04em', textTransform:'uppercase' }}>{f.title}</div>
              <div style={{ fontSize:11, color:C.tx2, lineHeight:1.8, fontWeight:400 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section style={{ padding:'0 48px 72px', maxWidth:1280, margin:'0 auto' }}>
        <div style={{ ...card, padding:'36px 44px', background:C.s1 }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ ...lbl, color:C.sky, marginBottom:8 }}>Pipeline Architecture</div>
            <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>From classified ad to decision signal.</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center' }}>
            {pipeline.map((n,i,arr) => (
              <React.Fragment key={i}>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ ...lbl, fontSize:8, color:C.sky, marginBottom:5 }}>Step {String(i+1).padStart(2,'0')}</div>
                  <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>{n}</div>
                </div>
                {i < arr.length-1 && (
                  <div style={{ flex:1, height:1, background:C.brd, margin:'0 14px', position:'relative', top:2 }}>
                    <div style={{ position:'absolute', left:'44%', top:'50%', transform:'translateY(-50%)', width:5, height:5, background:C.amb }} className="blink" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'0 48px 80px', maxWidth:1280, margin:'0 auto' }}>
        <div style={{ background:C.amb, padding:'52px 56px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:28, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-60, top:-60, width:220, height:220, background:'rgba(0,0,0,0.12)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'relative' }}>
            <h2 style={{ fontSize:32, fontWeight:700, color:'#fff', letterSpacing:'0.06em', textTransform:'uppercase', lineHeight:1.1, marginBottom:10 }}>
              Ready to<br />Go Live?
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', maxWidth:400, lineHeight:1.8 }}>
              Paste your Apify token in the Pipeline tab and trigger a real Mudah scrape. 420 demo listings loaded until then.
            </p>
          </div>
          <button style={{ ...btn, background:'#000', fontSize:13, padding:'14px 32px', display:'flex', alignItems:'center', gap:10, position:'relative' }} onClick={onLaunch}>
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
];

const Sidebar = ({ tab, setTab, collapsed, setCollapsed, isLive, count, onHome }) => (
  <div style={{ width:collapsed?50:200, background:C.s1, borderRight:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', flexShrink:0, transition:'width .22s cubic-bezier(.2,0,0,1)', overflow:'hidden' }}>
    <div style={{ height:58, display:'flex', alignItems:'center', padding:collapsed?'0 14px':'0 14px', borderBottom:`1px solid ${C.brd}`, gap:10, justifyContent:collapsed?'center':'flex-start', flexShrink:0 }}>
      {!collapsed && (
        <>
          <div style={{ width:28, height:28, background:C.amb, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Gauge style={{ width:14, height:14, color:'#fff' }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>AutoPulse</div>
            <div style={{ fontSize:7.5, color:C.amb, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase' }}>APEX MY</div>
          </div>
        </>
      )}
      <button onClick={() => setCollapsed(c => !c)} style={{ background:'none', border:`1px solid ${C.brd}`, padding:4, cursor:'pointer', color:C.tx2, display:'flex', flexShrink:0, borderRadius:2 }}>
        <ChevronLeft style={{ width:11, height:11, transform:collapsed?'rotate(180deg)':'none', transition:'transform .22s' }} />
      </button>
    </div>

    <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
      {TABS.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} title={collapsed ? t.label : ''} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'11px 0':'11px 14px', justifyContent:collapsed?'center':'flex-start', background: active ? 'rgba(232,0,29,0.07)' : 'none', border:'none', borderLeft: active ? `2px solid ${C.amb}` : '2px solid transparent', cursor:'pointer', color: active ? C.tx : C.tx2, fontSize:11, fontWeight: active ? 700 : 500, letterSpacing:'0.06em', textTransform:'uppercase', transition:'color .15s, background .15s', fontFamily:'inherit' }}>
            <t.icon style={{ width:14, height:14, flexShrink:0, color: active ? C.amb : C.tx3, transition:'color .15s' }} />
            {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
        );
      })}
    </div>

    {!collapsed && (
      <div style={{ padding:'12px 14px', borderTop:`1px solid ${C.brd}`, flexShrink:0 }}>
        <div style={lbl}>Data mode</div>
        <div style={{ marginTop:8 }}>
          <Badge bg={isLive?'rgba(0,209,102,0.08)':C.ambL} tc={isLive?C.em:C.tx2} bc={isLive?'rgba(0,209,102,0.25)':C.brd}>
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

// ── SHARED CHART PROPS ────────────────────────────────────────────────────────
const gridProps  = { stroke:C.brd, strokeDasharray:'2 6' };
const axisProps  = { stroke:C.tx3, fontSize:10, tickLine:false };
const axisLine   = { axisLine:{ stroke:C.brd } };
const noAxisLine = { axisLine:false };

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
        <div style={cardP}>          <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <SectionHead eyebrow="12-month trajectory" title="Volume &amp; Median Price" />
            <Badge bg="rgba(0,209,102,0.08)" tc={C.em} bc="rgba(0,209,102,0.25)">
              <div style={{width:5,height:5,background:C.em,borderRadius:'50%'}} className="blink" /> Live
            </Badge>
          </Row>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthly}>
              <defs>
                <linearGradient id="og1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.amb} stopOpacity={.3} />
                  <stop offset="100%" stopColor={C.amb} stopOpacity={0}  />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="m" {...axisProps} {...axisLine} />
              <YAxis yAxisId="l" {...axisProps} {...noAxisLine} />
              <YAxis yAxisId="r" orientation="right" {...axisProps} {...noAxisLine} />
              <Tooltip content={<TT />} />
              <Bar yAxisId="l" dataKey="listings" fill="url(#og1)" stroke={C.amb} strokeWidth={.8} name="Listings" />
              <Line yAxisId="r" type="monotone" dataKey="price" stroke={C.sky} strokeWidth={2} dot={{ r:2.5, fill:C.sky, strokeWidth:0 }} name="Median (RM k)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={cardP}>          <SectionHead eyebrow="By listing count" title="Brand Distribution" style={{ marginBottom:14 }} />
          <ResponsiveContainer width="100%" height={145}>
            <PieChart>
              <Pie data={brandMap} dataKey="value" nameKey="name" innerRadius={36} outerRadius={62} paddingAngle={2} strokeWidth={0}>
                {brandMap.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ height:1, background:C.brd, margin:'10px 0' }} />
          {brandMap.slice(0,5).map((b,i) => (
            <Row key={b.name} style={{ justifyContent:'space-between', padding:'4px 0', fontSize:11 }}>
              <Row style={{ gap:7 }}>
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
                  <th key={h} style={{ ...lbl, padding:'6px 10px', textAlign:['Price','Mileage'].includes(h)?'right':'left', borderBottom:`1px solid ${C.brd}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.slice(0,10).map(l => (
                <tr key={l.id} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                  <td style={{ padding:'9px 10px', color:C.tx3, ...mono, fontSize:10 }}>{l.id}</td>
                  <td style={{ padding:'9px 10px', color:C.tx, fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.title}</td>
                  <td style={{ padding:'9px 10px', textAlign:'right', ...mono, fontWeight:700, color:C.amb }}>{fmtRM(l.price)}</td>
                  <td style={{ padding:'9px 10px', textAlign:'right', color:C.tx2, ...mono }}>{(l.mileage/1000).toFixed(0)}k</td>
                  <td style={{ padding:'9px 10px', color:C.tx2, fontSize:11 }}>{l.region}</td>
                  <td style={{ padding:'9px 10px' }}><Badge bg={l.seller==='Dealer'?C.ambL:'rgba(0,207,255,0.1)'} tc={l.seller==='Dealer'?C.amb:C.sky} bc="transparent">{l.seller}</Badge></td>
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
    { l:'MIN',    v:stats?.min,    c:'#FF6B35' },
    { l:'P25',    v:stats?.p25,    c:C.gold },
    { l:'MEDIAN', v:stats?.median, c:C.amb },
    { l:'P75',    v:stats?.p75,    c:C.sky },
    { l:'MAX',    v:stats?.max,    c:C.vi },
  ];

  return (
    <div className="si">
      <div style={{ ...cardP, marginBottom:8 }}>
        <Row style={{ gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div><Label>Brand</Label><Sel value={brand} onChange={setBrand} style={{ minWidth:160, marginTop:6 }}>{BRANDS.map(b => <option key={b.b}>{b.b}</option>)}</Sel></div>
          <div><Label>Model</Label><Sel value={model} onChange={setModel} style={{ minWidth:140, marginTop:6 }}>{models.map(m => <option key={m}>{m}</option>)}</Sel></div>
          <div style={{ flex:1 }} />
          <button style={{ ...ghost, display:'flex', alignItems:'center', gap:6 }}><Download style={{width:11,height:11}}/> Export CSV</button>
        </Row>
      </div>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:C.brd, marginBottom:8 }}>
          {bands.map(b => (
            <div key={b.l} style={{ background:C.s1, borderTop:`2px solid ${b.c}`, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
              <div style={{ ...lbl, color:b.c, marginBottom:8 }}>{b.l}</div>
              <div style={{ fontSize:17, fontWeight:600, color:C.tx, ...mono }}>{fmtRM(b.v||0)}</div>
            </div>
          ))}
        </div>
      )}

      <Grid cols="3fr 2fr" gap={8}>
        <div style={cardP}>          <SectionHead eyebrow={`${brand} ${model} · min / avg / max`} title="Price Spread by Year (RM k)" style={{ marginBottom:20 }} />
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={byYear}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="year" {...axisProps} {...axisLine} />
              <YAxis {...axisProps} {...noAxisLine} />
              <Tooltip content={<TT />} />
              <Bar dataKey="max" fill={C.ambL} stroke={C.amb} strokeWidth={.8} name="Max" />
              <Bar dataKey="min" fill="rgba(139,92,246,0.12)" stroke={C.vi} strokeWidth={.8} name="Min" />
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
            <thead><tr>{['Yr','Price','Mil km','Region'].map(h => <th key={h} style={{ ...lbl, fontSize:8, padding:'4px 6px', textAlign:'left', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.slice(0,40).map(l => (
                <tr key={l.id} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                  <td style={{ padding:'6px', ...mono, color:C.tx2 }}>{l.year}</td>
                  <td style={{ padding:'6px', ...mono, fontWeight:700, color:C.amb }}>{fmtRM(l.price)}</td>
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
        <Row style={{ gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginRight:4 }}>Metric</div>
          {[{id:'price',l:'Median Price'},{id:'mileage',l:'Avg Mileage'},{id:'volume',l:'Volume'}].map(t => (
            <button key={t.id} onClick={() => setMetric(t.id)} style={{ padding:'6px 16px', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase', border: metric===t.id ? `1px solid ${C.amb}` : `1px solid ${C.brd}`, background: metric===t.id ? C.ambL : 'transparent', color: metric===t.id ? C.amb : C.tx2, fontFamily:'inherit', borderRadius:2, transition:'all .15s' }}>
              {t.l}
            </button>
          ))}
        </Row>
      </div>
      <div style={{ ...cardP, marginBottom:8 }}>
        <SectionHead eyebrow="By region · 12 months" title={metric==='price'?'Median Price (RM k)':metric==='mileage'?'Avg Mileage (k km)':'Listing Volume'} style={{ marginBottom:20 }} />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="m" {...axisProps} {...axisLine} />
            <YAxis {...axisProps} {...noAxisLine} />
            <Tooltip content={<TT />} />
            {regions.map((reg,i) => <Line key={reg} type="monotone" dataKey={reg} stroke={COLORS[i]} strokeWidth={2} dot={{ r:2.5, fill:COLORS[i], strokeWidth:0 }} />)}
          </LineChart>
        </ResponsiveContainer>
        <Row style={{ gap:20, marginTop:12, flexWrap:'wrap' }}>
          {regions.map((reg,i) => <Row key={reg} style={{ gap:6, fontSize:11, color:C.tx2 }}><span style={{ width:16, height:2, background:COLORS[i], display:'inline-block' }} />{reg}</Row>)}
        </Row>
      </div>
      <Grid cols="1fr 1fr" gap={8}>
        <div style={cardP}>          <SectionHead eyebrow="30-day window" title="Price Movers" style={{ marginBottom:16 }} />
          {[{m:'Proton X50 1.5T',d:4.8,up:true},{m:'Honda City 1.5V',d:3.2,up:true},{m:'Toyota Vios 1.5G',d:1.7,up:true},{m:'BMW 320i Sport',d:2.1,up:false},{m:'Mercedes C200',d:3.4,up:false}].map((x,i) => (
            <Row key={i} style={{ justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.brd}` }}>
              <span style={{ fontSize:12 }}>{x.m}</span>
              <Row style={{ gap:4, fontSize:12, fontWeight:700, color:x.up?C.em:C.rose, ...mono }}>
                {x.up?<ArrowUpRight style={{width:12,height:12}}/>:<ArrowDownRight style={{width:12,height:12}}/>}{Math.abs(x.d).toFixed(1)}%
              </Row>
            </Row>
          ))}
        </div>
        <div style={cardP}>          <SectionHead eyebrow="KL normalised" title="Seasonal Volume" style={{ marginBottom:12 }} />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sa1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.vi} stopOpacity={.35} />
                  <stop offset="100%" stopColor={C.vi} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="m" {...axisProps} {...axisLine} />
              <YAxis {...axisProps} {...noAxisLine} />
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
        <div style={cardP}>          <SectionHead eyebrow="All regions" title="Listing Volume" style={{ marginBottom:20 }} />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regional} layout="vertical" margin={{ left:8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis type="number" {...axisProps} {...axisLine} />
              <YAxis type="category" dataKey="region" {...axisProps} width={90} {...noAxisLine} />
              <Tooltip content={<TT />} />
              <Bar dataKey="count" fill={C.amb} name="Listings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardP}>          <SectionHead eyebrow="Price vs mileage" title="Regional Comparison" style={{ marginBottom:20 }} />
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={regional}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="region" {...axisProps} angle={-25} textAnchor="end" height={65} {...axisLine} />
              <YAxis yAxisId="l" {...axisProps} {...noAxisLine} />
              <YAxis yAxisId="r" orientation="right" {...axisProps} {...noAxisLine} />
              <Tooltip content={<TT />} />
              <Bar yAxisId="l" dataKey="avgPrice" fill={C.vi} opacity={.75} name="Avg Price (RM k)" />
              <Line yAxisId="r" type="monotone" dataKey="avgMil" stroke={C.gold} strokeWidth={2.5} dot={{ r:3, fill:C.gold, strokeWidth:0 }} name="Avg Mileage (k km)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Grid>
      <div style={cardP}>
        <SectionHead eyebrow="Full breakdown" title="All 13 Regions" style={{ marginBottom:16 }} />
        <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
          <thead><tr>{['Region','Listings','Avg Price','Avg Mileage','Share'].map(h => <th key={h} style={{ ...lbl, padding:'6px 10px', textAlign:['Listings','Avg Price','Avg Mileage'].includes(h)?'right':'left', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {regional.map(r => (
              <tr key={r.region} className="trow" style={{ borderBottom:`1px solid ${C.brd}` }}>
                <td style={{ padding:'9px 10px', fontWeight:600 }}>{r.region}</td>
                <td style={{ padding:'9px 10px', textAlign:'right', ...mono }}>{r.count}</td>
                <td style={{ padding:'9px 10px', textAlign:'right', ...mono, color:C.amb }}>RM {r.avgPrice}k</td>
                <td style={{ padding:'9px 10px', textAlign:'right', ...mono, color:C.tx2 }}>{r.avgMil}k km</td>
                <td style={{ padding:'9px 10px 9px 16px', minWidth:130 }}>
                  <div style={{ height:3, background:C.s3 }}>
                    <div style={{ height:'100%', width:`${(r.count/max)*100}%`, background:`linear-gradient(90deg,${C.amb},rgba(232,0,29,.4))`, transition:'width .6s ease' }} />
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
        <div style={cardP}>          <SectionHead eyebrow="Estimate fair-market value" title="Vehicle Details" style={{ marginBottom:24 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[{k:'brand',l:'Make',opts:BRANDS.map(b=>b.b)},{k:'model',l:'Model',opts:models},{k:'year',l:'Year',opts:[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024]},{k:'region',l:'Region',opts:REGIONS}].map(f => (
              <div key={f.k}><Label>{f.l}</Label><Sel value={String(form[f.k])} onChange={v=>set(f.k,f.k==='year'?+v:v)} style={{marginTop:6}}>{f.opts.map(o=><option key={o}>{o}</option>)}</Sel></div>
            ))}
            <div>
              <Row style={{ justifyContent:'space-between', marginBottom:6 }}>
                <Label>Mileage</Label>
                <span style={{ color:C.amb, ...mono, fontSize:12, fontWeight:700 }}>{form.mileage.toLocaleString()} km</span>
              </Row>
              <input type="range" min={10000} max={250000} step={5000} value={form.mileage} onChange={e=>set('mileage',+e.target.value)} style={{ width:'100%' }} />
            </div>
            <button style={{ ...btn, display:'flex', alignItems:'center', justifyContent:'center', gap:8,  }} onClick={calc}>
              <Calculator style={{ width:13, height:13 }} /> Estimate Value
            </button>
          </div>
        </div>

        <div style={{ ...cardP, position:'relative', overflow:'hidden' }}>
          <SectionHead eyebrow="Based on comparable listings" title="Estimated Value" style={{ marginBottom:24 }} />
          {result?.none ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.tx2 }}>
              <AlertCircle style={{ width:32, height:32, color:C.rose, display:'block', margin:'0 auto 12px' }} />
              Not enough comparable listings for this configuration.
            </div>
          ) : result ? (
            <>
              <div style={{ fontSize:52, fontWeight:600, color:C.amb, letterSpacing:'-0.01em', lineHeight:1, ...mono }}>{fmtRM(result.est)}</div>
              <div style={{ marginTop:10 }}>
                <Badge bg="rgba(0,209,102,0.08)" tc={C.em} bc="rgba(0,209,102,0.25)"><CheckCircle2 style={{width:9,height:9}}/> {result.n} comparable listings</Badge>
              </div>
              <div style={{ height:1, background:C.brd, margin:'22px 0' }} />
              <Row style={{ justifyContent:'space-between', marginBottom:10, fontSize:11 }}>
                <span style={{ color:C.tx2 }}>Confidence band</span>
                <span style={{ fontWeight:700, ...mono, color:C.tx }}>{fmtRM(result.low)} – {fmtRM(result.high)}</span>
              </Row>
              <div style={{ height:4, background:C.s3, position:'relative' }}>
                <div style={{ position:'absolute', left:'15%', right:'15%', top:0, bottom:0, background:`rgba(232,0,29,0.2)`, borderLeft:`1px solid ${C.amb}`, borderRight:`1px solid ${C.amb}` }} />
                <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:8, height:8, background:C.amb, border:`2px solid ${C.s1}` }} />
              </div>
              <Grid cols="1fr 1fr" gap={8} style={{ marginTop:20 }}>
                {[{l:'Market avg mileage',v:`${(result.avgMil/1000).toFixed(0)}k km`},{l:'Your mileage',v:`${(form.mileage/1000).toFixed(0)}k km`}].map(x => (
                  <div key={x.l} style={{ ...card, padding:12 }}><Label>{x.l}</Label><div style={{ fontSize:16, fontWeight:600, marginTop:6, ...mono, color:C.sky }}>{x.v}</div></div>
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
    { name:'Cycle & Carriage',      region:'Kuala Lumpur', stock:142, chg:8,  focus:'Mercedes-Benz' },
    { name:'Auto Bavaria',          region:'Selangor',     stock:98,  chg:-4, focus:'BMW' },
    { name:'PJ Used Cars Hub',      region:'Selangor',     stock:67,  chg:12, focus:'Mixed' },
    { name:'Penang Premier Motors', region:'Penang',       stock:54,  chg:3,  focus:'Toyota / Honda' },
    { name:'JB Carmart',            region:'Johor',        stock:81,  chg:-2, focus:'Mixed' },
    { name:'Perak Auto Depot',      region:'Perak',        stock:43,  chg:6,  focus:'Perodua / Proton' },
  ];
  const alerts = [
    { ic:TrendingDown, c:C.rose, t:'Price drop',   d:'Auto Bavaria reduced 2021 BMW 320i by RM 4,000 (–2.8%)',  w:'2h ago' },
    { ic:Plus,         c:C.em,   t:'New listings', d:'PJ Used Cars Hub added 12 vehicles, mostly Honda City',   w:'5h ago' },
    { ic:AlertCircle,  c:C.gold, t:'Stock risk',   d:'Mercedes C200 (2020): only 3 active listings nationwide', w:'1d ago' },
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
        <div style={cardP}>          <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <SectionHead eyebrow="Monitored dealers" title="Watchlist" />
            <button style={{ ...ghost, display:'flex', alignItems:'center', gap:6, fontSize:10 }}><Plus style={{width:10,height:10}}/> Add</button>
          </Row>
          {dealers.map(d => (
            <Row key={d.name} style={{ justifyContent:'space-between', padding:'11px 12px', marginBottom:1, background:C.s2, border:`1px solid ${C.brd}`, borderLeft:`2px solid ${C.brd}` }}>
              <Row style={{ gap:10 }}>
                <div style={{ width:36, height:36, background:C.s3, border:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.amb, ...mono }}>
                  {d.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{d.name}</div>
                  <div style={{ fontSize:10, color:C.tx2, marginTop:2 }}>{d.region} · {d.focus}</div>
                </div>
              </Row>
              <Row style={{ gap:18 }}>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:600, ...mono }}>{d.stock}</div>
                  <div style={{ ...lbl, fontSize:8 }}>in stock</div>
                </div>
                <Row style={{ gap:3, fontSize:12, fontWeight:700, ...mono, color:d.chg>=0?C.em:C.rose, minWidth:36, justifyContent:'flex-end' }}>
                  {d.chg>=0?<ArrowUpRight style={{width:12,height:12}}/>:<ArrowDownRight style={{width:12,height:12}}/>}{d.chg>=0?'+':''}{d.chg}
                </Row>
              </Row>
            </Row>
          ))}
        </div>
        <div style={cardP}>          <Row style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <SectionHead eyebrow="48h window" title="Alerts" />
            <Badge bg="rgba(0,209,102,0.08)" tc={C.em} bc="rgba(0,209,102,0.25)"><div style={{width:5,height:5,background:C.em,borderRadius:'50%'}} className="blink"/> Live</Badge>
          </Row>
          {alerts.map((a,i) => (
            <div key={i} style={{ padding:'11px 12px', marginBottom:1, background:C.s2, border:`1px solid ${C.brd}`, borderLeft:`2px solid ${a.c}` }}>
              <Row style={{ justifyContent:'space-between', marginBottom:5 }}>
                <Row style={{ gap:6 }}><a.ic style={{width:11,height:11,color:a.c}}/><span style={{fontSize:11,fontWeight:700}}>{a.t}</span></Row>
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
// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const TITLES = {
  overview:'Overview', pricing:'Pricing Benchmarks', trends:'Market Trends',
  regional:'Regional Analysis', valuation:'Valuation Tool',
  inventory:'Inventory Monitor',
};
const DESCS = {
  overview:"Bird's-eye view of the Malaysian used-car market.",
  pricing:'Benchmark asking prices for any make/model combination.',
  trends:'Price, mileage, and volume trajectories over time.',
  regional:'Compare all 13 Malaysian states and territories.',
  valuation:'Estimate fair-market value with confidence bands.',
  inventory:'Watch competitor dealers and track inventory changes.',
};

const Dashboard = ({ onHome, liveListings, setLiveListings }) => {
  const [tab, setTab]             = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const listings = useMemo(() => liveListings || MOCK, [liveListings]);
  const isLive   = !!liveListings;

  // Auto-load latest dataset on mount when token is configured
  useEffect(() => {
    if (!CFG.token || liveListings) return;
    (async () => {
      try {
        const res  = await aLatestRun(CFG.token, CFG.actorId);
        const run  = res?.data?.items?.[0];
        if (run?.defaultDatasetId) {
          const items = await aData(CFG.token, run.defaultDatasetId, CFG.maxItems);
          if (Array.isArray(items)) {
            const norm = normalize(items);
            if (norm.length) setLiveListings(norm);
          }
        }
      } catch { /* falls back to demo data silently */ }
    })();
  }, []);

  const tabContent = {
    overview:  <Overview   listings={listings} />,
    pricing:   <Pricing    listings={listings} />,
    trends:    <Trends     listings={listings} />,
    regional:  <Regional   listings={listings} />,
    valuation: <Valuation  listings={listings} />,
    inventory: <Inventory  listings={listings} />,
  };

  return (
    <div style={{ background:C.bg, color:C.tx, minHeight:'100vh', display:'flex' }}>
      <Sidebar tab={tab} setTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed} isLive={isLive} count={listings.length} onHome={onHome} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ padding:'0 20px', borderBottom:`1px solid ${C.brd}`, background:C.s1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', flexShrink:0, height:58 }}>
          <Row style={{ gap:14, alignItems:'center' }}>
            <span style={{ display:'inline-block', width:14, height:2, background:C.amb, flexShrink:0 }} />
            <div style={{ fontSize:16, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>{TITLES[tab]}</div>
            <div style={{ fontSize:10, color:C.tx3, letterSpacing:'0.06em', textTransform:'uppercase' }}>{DESCS[tab]}</div>
          </Row>
          <Row style={{ gap:8, flexWrap:'wrap' }}>
            <Badge bg={isLive?'rgba(0,209,102,0.08)':C.ambL} tc={isLive?C.em:C.tx3} bc={isLive?'rgba(0,209,102,0.25)':C.brd}>
              {isLive?<><div style={{width:5,height:5,background:C.em,borderRadius:'50%'}} className="blink"/>Live · {listings.length}</>:<><AlertCircle style={{width:9,height:9}}/> Demo data</>}
            </Badge>
            <Badge bg={C.s3} tc={C.tx2} bc={C.brd}><Clock style={{width:9,height:9}}/> Updated 2h ago</Badge>
          </Row>
        </div>
        <div style={{ flex:1, padding:16, overflowY:'auto' }}>
          {tabContent[tab]}
        </div>
      </div>
    </div>
  );
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]         = useState('landing');
  const [liveListings, setLive] = useState(null);
  const [fade, setFade]         = useState(false);

  const go = v => { setFade(true); setTimeout(() => { setView(v); setFade(false); }, 340); };

  return (
    <div style={{ fontFamily:"'Chakra Petch', ui-sans-serif, system-ui, sans-serif", background:C.bg, minHeight:'100vh', opacity:fade?0:1, transition:'opacity .34s ease' }}>
      <Styles />
      {view === 'landing'   && <Landing   onLaunch={() => go('dashboard')} />}
      {view === 'dashboard' && <Dashboard onHome={() => go('landing')} liveListings={liveListings} setLiveListings={setLive} />}
    </div>
  );
}
