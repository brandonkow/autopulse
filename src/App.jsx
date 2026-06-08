import React, { useState, useEffect, useRef, useCallback } from "react";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const BG="#07090F", PANEL="#0C1224", PANEL_S="#111828", BORDER="#1E2D45";
const FG="#E8E4DC", FG_DIM="#8A7E70", FG_MUTE="#4A4438";
const GOLD="#C4922A", GOLD_B="#E0B030", GOLD_DIM="rgba(196,146,42,.12)";
const UP="#5BAD7A", DOWN="#C85858", AMBER="#D4A020";

// ── TIMING ────────────────────────────────────────────────────────────────────
const SCATTER_DUR=520, ASSEMBLE_DUR=620, SCROLL_DUR=720;

// ── DATA ──────────────────────────────────────────────────────────────────────
const BOOT_SEQ=[
  {t:"SYS", m:"Meridian RE Advisory Platform — MER.ADV.MY", c:GOLD},
  {t:"INIT",m:"Loading guardrail engine — MAS-GUARD-001 v1.0",c:FG_DIM},
  {t:"INIT",m:"Indexing report types — 7 MER families located",c:FG_DIM},
  {t:"INIT",m:"Validating domain matrix — 22 guardrails across 5 domains",c:FG_DIM},
  {t:"INIT",m:"Mounting standards ref — RICS Red Book 2025 · BOVEAP",c:FG_DIM},
  {t:"OK",  m:"Advisory engine online — regional scope: Malaysia (MY)",c:GOLD_B},
  {t:"OK",  m:"Jurisdiction flags active — Act 242 · NLC 1965 · JPPH",c:UP},
  {t:"SYS", m:"Platform ready — awaiting operator",c:GOLD},
];

const MER_TYPES=[
  {code:"MER-MKT",type:"Market Entry / Market Study",pages:"15–30",sections:[1,2,3,4,5,6,8],tag:"Most Used",
   desc:"End-to-end market entry study. Covers primary market area delineation, supply/demand analysis, competitive landscape, macro & regulatory environment, financial analysis, and implementation roadmap."},
  {code:"MER-HBU",type:"Highest & Best Use Advisory",pages:"10–20",sections:[1,2,3,4,5,7,8],tag:"Technical",
   desc:"Four-test HBU determination: legally permissible, physically possible, financially feasible, maximally productive. AI-assisted analysis in 7.1 and 7.2 requires licensed planner/legal review."},
  {code:"MER-DEV",type:"Development Feasibility Opinion",pages:"20–40",sections:[1,2,3,4,5,6,7,8],tag:"Comprehensive",
   desc:"Full eight-section development feasibility. Includes NPV/IRR modelling, HBU determination, risk register, and phased implementation roadmap. Highest scope of all MER types."},
  {code:"MER-INV",type:"Investment Advisory Memo",pages:"8–15",sections:[1,2,4,5,6,8],tag:"Executive",
   desc:"Executive-format investment memo. Financial analysis, returns (NPV/IRR), risk register, and implementation roadmap. Designed for investment committee or board-level presentation."},
  {code:"MER-POS",type:"Asset Repositioning Strategy",pages:"12–25",sections:[1,2,3,5,7,8],tag:"Strategic",
   desc:"Repositioning-focused advisory. Market context, HBU-based repositioning options, findings and strategic alternatives considered. Excludes financial modelling section."},
  {code:"MER-PORT",type:"Portfolio Advisory",pages:"20–50",sections:[1,2,4,5,6,8],tag:"Multi-Asset",
   desc:"Multi-asset portfolio advisory. Financial analysis and implementation roadmap across asset classes. Excludes site-specific HBU and individual market sections — aggregate analysis only."},
  {code:"MER-SITE",type:"Site Selection Assessment",pages:"10–20",sections:[1,2,3,4,5,8],tag:"Site-Level",
   desc:"Concise site assessment. Primary market area, supply/demand analysis, indicative financial assessment, and findings with site-selection recommendation. Focused, practical scope."},
];

const GUARDRAILS=[
  {code:"G-SCOPE-01",domain:"Scope",  sev:"Critical",title:"Consultancy vs. Certified Valuation"},
  {code:"G-SCOPE-02",domain:"Scope",  sev:"High",   title:"Engagement Scope Creep"},
  {code:"G-SCOPE-03",domain:"Scope",  sev:"High",   title:"Asset Class Competence"},
  {code:"G-EVID-01", domain:"Evidence",sev:"Critical",title:"Source Attribution"},
  {code:"G-EVID-02", domain:"Evidence",sev:"High",   title:"Transaction Comparables"},
  {code:"G-EVID-03", domain:"Evidence",sev:"Critical",title:"Forward-Looking Statements"},
  {code:"G-EVID-04", domain:"Evidence",sev:"High",   title:"Site Visit Requirement"},
  {code:"G-EVID-05", domain:"Evidence",sev:"Medium", title:"Data Currency"},
  {code:"G-AI-01",   domain:"AI Use",  sev:"Critical",title:"AI Disclosure (Non-Negotiable)"},
  {code:"G-AI-02",   domain:"AI Use",  sev:"Critical",title:"AI Limitation Zones"},
  {code:"G-AI-03",   domain:"AI Use",  sev:"High",   title:"No Black-Box Outputs"},
  {code:"G-AI-04",   domain:"AI Use",  sev:"Medium", title:"Historical Bias Alert"},
  {code:"G-AI-05",   domain:"AI Use",  sev:"Critical",title:"No AI Value Opinions"},
  {code:"G-DISC-01", domain:"Disclosure",sev:"Critical",title:"Conflict of Interest"},
  {code:"G-DISC-02", domain:"Disclosure",sev:"High",  title:"Reliance Limitation"},
  {code:"G-DISC-03", domain:"Disclosure",sev:"High",  title:"Regulatory Compliance (MY)"},
  {code:"G-DISC-04", domain:"Disclosure",sev:"Medium",title:"ESG and Climate Risk"},
  {code:"G-PROC-01", domain:"Process",  sev:"Critical",title:"Dual Sign-Off"},
  {code:"G-PROC-02", domain:"Process",  sev:"Medium", title:"Version Control"},
  {code:"G-PROC-03", domain:"Process",  sev:"High",   title:"Retention (7 years)"},
  {code:"G-PROC-04", domain:"Process",  sev:"Medium", title:"Client Instruction Changes"},
  {code:"G-PROC-05", domain:"Process",  sev:"High",   title:"Escalation Triggers"},
];

const DC={
  "Scope":    {bg:"rgba(28,53,83,.32)",  bd:"rgba(28,53,83,.7)",   tx:"#8AAABF"},
  "Evidence": {bg:GOLD_DIM,             bd:"rgba(196,146,42,.35)", tx:GOLD_B},
  "AI Use":   {bg:"rgba(91,173,122,.1)", bd:"rgba(91,173,122,.3)", tx:UP},
  "Disclosure":{bg:"rgba(200,88,88,.1)",bd:"rgba(200,88,88,.3)",  tx:"#E08080"},
  "Process":  {bg:"rgba(212,160,32,.1)", bd:"rgba(212,160,32,.3)", tx:AMBER},
};

const TICKER_DATA=[
  {label:"KLCC",val:"RM1,820 psf",chg:"+0.8%",up:true},
  {label:"MID VALLEY",val:"RM680 psf",chg:"+1.2%",up:true},
  {label:"SUBANG JAYA",val:"RM520 psf",chg:"-0.3%",up:false},
  {label:"MELAKA",val:"RM250K avg",chg:"+4.7% YoY",up:true},
  {label:"PENANG ISLAND",val:"RM680 psf",chg:"+2.1%",up:true},
  {label:"JOHOR BAHRU",val:"RM380 psf",chg:"+0.5%",up:true},
  {label:"KOTA KINABALU",val:"RM440 psf",chg:"+1.8%",up:true},
  {label:"IPOH",val:"RM220 psf",chg:"-0.6%",up:false},
  {label:"MONT KIARA",val:"RM780 psf",chg:"+1.5%",up:true},
  {label:"BUKIT JALIL",val:"RM620 psf",chg:"+2.3%",up:true},
];

const LP_SECTIONS=[
  {id:"lp-s0",num:"S00",label:"ACCESS"},
  {id:"lp-s1",num:"S01",label:"REPORT SUITE"},
  {id:"lp-s2",num:"S02",label:"GUARDRAILS"},
  {id:"lp-s3",num:"S03",label:"METHODOLOGY"},
  {id:"lp-s4",num:"S04",label:"DEPLOY"},
];

const REPORT_SECTIONS=[
  {n:1,title:"Engagement Header",     cond:false,desc:"Client, engagement ref, subject, date, prepared-by, reviewed-by, classification, conflict statement, reliance limitation"},
  {n:2,title:"Executive Summary",     cond:false,desc:"Purpose (2–3 sentences), key findings (3–5 bullets, ≤25 words each), primary recommendation, decision-maker caveats"},
  {n:3,title:"Market Analysis",       cond:true, desc:"§3.1 PMA definition · §3.2 Supply analysis · §3.3 Demand analysis · §3.4 Competitive landscape · §3.5 Macro & regulatory"},
  {n:4,title:"Financial Analysis",    cond:true, desc:"§4.1 Revenue projections · §4.2 Cost build-up · §4.3 Returns (NPV/IRR/EM) · §4.4 Scenario analysis · §4.5 Assumptions register"},
  {n:5,title:"Findings & Recommendation",cond:false,desc:"§5.1 Evidence summary · §5.2 Risk register (≥5 risks, L×I scored) · §5.3 Go/No-Go verdict · §5.4 Alternatives considered"},
  {n:6,title:"Implementation Roadmap",cond:true, desc:"Phasing plan with milestones · Key dependencies & critical path · Stakeholder map · KPIs and success metrics"},
  {n:7,title:"HBU Determination",     cond:true, desc:"Test 1: Legally permissible · Test 2: Physically possible · Test 3: Financially feasible · Test 4: Maximally productive"},
  {n:8,title:"Disclaimers & Sign-Off",cond:false,desc:"Mandatory disclaimer block · Guardrail compliance checklist · Dual sign-off (Lead Consultant + Reviewing Advisor)"},
];

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
@keyframes bootFadeOut{0%{opacity:1;visibility:visible}100%{opacity:0;visibility:hidden}}
@keyframes bootRingSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes bootRingSpinR{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes bootCoreThrob{0%,100%{transform:scale(1);box-shadow:0 0 24px rgba(196,146,42,.35)}50%{transform:scale(1.08);box-shadow:0 0 44px rgba(196,146,42,.6)}}
@keyframes bootLineIn{0%{opacity:0;transform:translateX(-6px)}100%{opacity:1;transform:translateX(0)}}
@keyframes bootScan{0%{transform:translateY(0)}100%{transform:translateY(100%)}}
@keyframes goldPulse{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes toastIn{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes caretBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes hintFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(3px)}}
@keyframes revealUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
body{margin:0;font-family:'Inter',sans-serif;color:${FG};background:${BG};-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#0A0C18}
::-webkit-scrollbar-thumb{background:${BORDER};border-radius:0}
::-webkit-scrollbar-thumb:hover{background:#2A3D5A}
.btn-o{transition:all .15s ease;cursor:pointer;font-family:'IBM Plex Mono',monospace}
.btn-o:hover{border-color:${GOLD}!important;color:${GOLD}!important}
.mer-card{transition:border-color .22s,box-shadow .25s,transform .25s}
.mer-card:hover{transform:translateY(-2px);border-color:rgba(196,146,42,.45)!important;box-shadow:0 0 0 1px rgba(196,146,42,.07),0 22px 44px rgba(0,0,0,.45)}
.lp-card{transition:border-color .22s,background .22s,transform .25s;cursor:default}
.lp-card:hover{border-color:${GOLD}!important;background:rgba(196,146,42,.04)!important;transform:translateY(-2px)}
.lp-card:hover .lp-num{color:${GOLD_B}!important}
.lp-stat{transition:background .2s;cursor:default}
.lp-stat:hover .lp-stat-n{color:${GOLD}!important}
.gr-row{transition:background .15s;cursor:pointer}
.gr-row:hover{background:rgba(196,146,42,.05)!important}
.lp-ticker-item{transition:opacity .15s,filter .15s}
.lp-ticker:hover .lp-ticker-item{opacity:.4}
.lp-ticker:hover .lp-ticker-item:hover{opacity:1;filter:brightness(1.3)}
.lp-ticker:hover .lp-ticker-track{animation-play-state:paused}
.hold-btn{transition:border-color .15s,box-shadow .2s}
.hold-btn:hover{border-color:${GOLD}!important;box-shadow:0 0 24px rgba(196,146,42,.15)!important}
input:focus{outline:none;border-color:${GOLD}!important}
input::placeholder{color:${FG_MUTE}}
.lp-fit{height:calc(100vh - 54px);max-height:calc(100vh - 54px);display:flex;flex-direction:column;overflow:hidden}
#lp-s0{height:calc(100vh - 94px);max-height:calc(100vh - 94px)}
.lp-fit>section{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;width:100%;box-sizing:border-box;padding-top:clamp(14px,2.2vh,30px)!important;padding-bottom:clamp(14px,2.2vh,30px)!important}
.lp-fit>section>*{flex:0 1 auto;min-height:0}
`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Grain({o=.025}){
  return(
    <div aria-hidden style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,opacity:o,
      backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize:"220px 220px"}}/>
  );
}
function Grid(){
  return(
    <div aria-hidden style={{position:"absolute",inset:0,zIndex:0,
      backgroundImage:`linear-gradient(${PANEL} 1px,transparent 1px),linear-gradient(90deg,${PANEL} 1px,transparent 1px)`,
      backgroundSize:"52px 52px",
      maskImage:"radial-gradient(ellipse 58% 65% at 50% 50%,#000 20%,transparent 80%)",
      WebkitMaskImage:"radial-gradient(ellipse 58% 65% at 50% 50%,#000 20%,transparent 80%)",
      opacity:.6,pointerEvents:"none"}}/>
  );
}
function GoldBar(){
  return(
    <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,zIndex:2,
      background:`linear-gradient(90deg,transparent,${GOLD} 30%,${GOLD} 70%,transparent)`,opacity:.7}}/>
  );
}
function Mono({children,style={}}){
  return <span style={{fontFamily:"'IBM Plex Mono',monospace",...style}}>{children}</span>;
}
function SecTag({num,label}){
  return(
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:FG_MUTE,
      letterSpacing:"2.5px",fontWeight:600,marginBottom:18,
      display:"flex",alignItems:"center",gap:10,textTransform:"uppercase"}}>
      <span style={{color:GOLD}}>[</span>
      <span style={{color:GOLD,fontWeight:700}}>{num}</span>
      <span style={{color:FG_MUTE}}>·</span>
      <span>{label}</span>
      <span style={{color:GOLD}}>]</span>
      <span style={{flex:1,height:1,background:BORDER}}/>
    </div>
  );
}
function SevPill({sev}){
  const c=sev==="Critical"?DOWN:sev==="High"?GOLD:AMBER;
  const bg=sev==="Critical"?"rgba(200,88,88,.12)":sev==="High"?GOLD_DIM:"rgba(212,160,32,.08)";
  const bd=sev==="Critical"?"rgba(200,88,88,.3)":sev==="High"?"rgba(196,146,42,.3)":"rgba(212,160,32,.2)";
  return(
    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:600,
      padding:"2px 8px",letterSpacing:"1px",background:bg,color:c,border:`1px solid ${bd}`}}>
      {sev}
    </span>
  );
}

// ── HOOKS ─────────────────────────────────────────────────────────────────────
function useInView(t=.05){
  const r=useRef(null),[v,sv]=useState(false);
  useEffect(()=>{
    if(!r.current)return;
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting)sv(true);},{threshold:t});
    o.observe(r.current);return()=>o.disconnect();
  },[]);
  return[r,v];
}
function useWide(bp=960){
  const[w,sw]=useState(()=>window.innerWidth>=bp);
  useEffect(()=>{
    const fn=()=>sw(window.innerWidth>=bp);
    window.addEventListener("resize",fn,{passive:true});
    return()=>window.removeEventListener("resize",fn);
  },[bp]);
  return w;
}

// morph helpers
function getMorphBlocks(s){return s?Array.from(s.querySelectorAll("[data-morph]")).slice(0,12):[]}
function clearMorph(el){el.style.transition=el.style.transform=el.style.opacity=el.style.filter=el.style.willChange="";}

// ── BOOT SCREEN ───────────────────────────────────────────────────────────────
function Boot({onDone}){
  const[rev,setRev]=useState(0),[pct,setPct]=useState(0),[leaving,setLeaving]=useState(false);
  const finRef=useRef(false),rafRef=useRef(0),tgtRef=useRef(0);
  const finish=useCallback(()=>{
    if(finRef.current)return;finRef.current=true;
    setRev(BOOT_SEQ.length);tgtRef.current=100;setLeaving(true);setTimeout(onDone,640);
  },[onDone]);
  useEffect(()=>{
    if(finRef.current)return;let i=0;
    const id=setInterval(()=>{
      if(finRef.current){clearInterval(id);return;}
      i++;setRev(i);tgtRef.current=(i/BOOT_SEQ.length)*100;
      if(i>=BOOT_SEQ.length){clearInterval(id);setTimeout(finish,480);}
    },280);
    return()=>clearInterval(id);
  },[finish]);
  useEffect(()=>{
    const tick=()=>{
      setPct(p=>{const t=tgtRef.current,np=p+(t-p)*.12;return Math.abs(t-np)<.4?t:np;});
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(rafRef.current);
  },[]);
  useEffect(()=>{
    const k=()=>finish();window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);
  },[finish]);
  return(
    <div onClick={finish} style={{position:"fixed",inset:0,zIndex:9000,background:BG,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      cursor:"pointer",overflow:"hidden",fontFamily:"'IBM Plex Mono',monospace",
      animation:leaving?"bootFadeOut .6s ease forwards":"none"}}>
      <Grid/><Grain o={.03}/>
      <div aria-hidden style={{position:"absolute",left:0,right:0,height:"38%",zIndex:0,
        background:`linear-gradient(180deg,transparent,rgba(196,146,42,.025),transparent)`,
        animation:"bootScan 3.5s linear infinite",pointerEvents:"none"}}/>
      {/* Emblem */}
      <div style={{position:"relative",width:132,height:132,marginBottom:40,zIndex:1,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`1px solid ${BORDER}`,
          borderTopColor:GOLD,borderRightColor:"rgba(196,146,42,.35)",animation:"bootRingSpin 2.4s linear infinite"}}/>
        <div style={{position:"absolute",inset:16,borderRadius:"50%",border:`1px solid ${BORDER}`,
          borderBottomColor:GOLD_B,borderLeftColor:"rgba(196,146,42,.3)",animation:"bootRingSpinR 3.1s linear infinite"}}/>
        <div style={{position:"absolute",inset:33,borderRadius:"50%",
          border:`1px dashed rgba(196,146,42,.22)`,animation:"bootRingSpin 5s linear infinite"}}/>
        <div style={{width:52,height:52,borderRadius:"50%",
          background:`radial-gradient(circle at 38% 34%,rgba(196,146,42,.2),${BG})`,
          border:`1px solid ${GOLD}`,display:"flex",alignItems:"center",justifyContent:"center",
          animation:"bootCoreThrob 1.9s ease-in-out infinite"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,
            color:GOLD,letterSpacing:"-1px",textShadow:`0 0 12px rgba(196,146,42,.7)`}}>M</span>
        </div>
      </div>
      <div style={{fontSize:10,letterSpacing:"4px",color:GOLD,fontWeight:700,
        textTransform:"uppercase",marginBottom:32,zIndex:1}}>MERIDIAN RE ADVISORY</div>
      {/* Log */}
      <div style={{width:"min(520px,90vw)",zIndex:1,marginBottom:32,
        border:`1px solid ${BORDER}`,background:PANEL,padding:"16px 20px"}}>
        {BOOT_SEQ.slice(0,rev).map((line,i)=>(
          <div key={i} style={{display:"flex",gap:12,fontSize:11,lineHeight:1.8,
            animation:"bootLineIn .22s ease forwards"}}>
            <span style={{color:GOLD,minWidth:40,fontWeight:700}}>[{line.t}]</span>
            <span style={{color:line.c===GOLD||line.c===GOLD_B?line.c:FG_DIM}}>{line.m}</span>
          </div>
        ))}
      </div>
      {/* Progress */}
      <div style={{width:"min(520px,90vw)",zIndex:1,background:PANEL,
        border:`1px solid ${BORDER}`,height:2,position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${pct}%`,
          background:GOLD,boxShadow:`0 0 8px ${GOLD}`}}/>
      </div>
      <div style={{marginTop:12,fontSize:9,color:FG_MUTE,letterSpacing:"2px",zIndex:1}}>
        {Math.floor(pct)}% · CLICK OR ANY KEY TO SKIP
      </div>
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav({page,onBack}){
  const path={landing:"/",dashboard:"/library",checker:"/tools/guardrail",risk:"/tools/risk"}[page]||"/";
  return(
    <nav style={{position:"fixed",top:2,left:0,right:0,zIndex:300,height:54,
      background:"rgba(7,9,15,.92)",backdropFilter:"blur(18px)",
      borderBottom:`1px solid ${BORDER}`,
      display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px"}}>
      <div style={{display:"flex",alignItems:"center",gap:22}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:7,height:7,background:GOLD,
            boxShadow:`0 0 8px ${GOLD}`,animation:"goldPulse 1.8s ease infinite"}}/>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,
            fontSize:12,letterSpacing:"2.5px",color:FG,textTransform:"uppercase"}}>
            MERIDIAN<span style={{color:GOLD,margin:"0 6px"}}>·</span>
            <span style={{color:FG_DIM,fontWeight:500}}>MER.ADV.MY</span>
          </div>
        </div>
        <div style={{display:"flex",gap:18,fontFamily:"'IBM Plex Mono',monospace",
          fontSize:9.5,color:FG_MUTE,letterSpacing:"1.8px",textTransform:"uppercase",fontWeight:500}}>
          <span style={{color:FG_DIM}}>SYS:OK</span>
          <span style={{color:GOLD,fontWeight:700}}>PATH:{path}</span>
          <span>MAS-GUARD:v1.0</span>
        </div>
      </div>
      {page!=="landing"&&(
        <button className="btn-o" onClick={onBack} style={{background:"transparent",color:FG,
          border:`1px solid ${BORDER}`,padding:"7px 16px",fontSize:10,
          cursor:"pointer",letterSpacing:"2.5px",textTransform:"uppercase",fontWeight:600}}>
          {page==="dashboard"?"← [Home]":"← [Library]"}
        </button>
      )}
    </nav>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({msg,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3600);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:PANEL_S,
      border:`1px solid ${GOLD}`,padding:"14px 18px",
      display:"flex",alignItems:"flex-start",gap:14,
      boxShadow:`0 0 24px rgba(196,146,42,.2),0 18px 40px rgba(0,0,0,.5)`,
      animation:"toastIn .4s cubic-bezier(.34,1.4,.64,1) forwards",maxWidth:340}}>
      <span style={{width:8,height:8,background:GOLD,marginTop:6,flexShrink:0,
        boxShadow:`0 0 8px ${GOLD}`,animation:"goldPulse 1.6s ease infinite"}}/>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:GOLD,
          letterSpacing:"2.5px",fontWeight:700,textTransform:"uppercase",marginBottom:5}}>
          ✓ TEMPLATE READY
        </div>
        <div style={{color:FG,fontSize:12.5,lineHeight:1.5,fontWeight:500}}>{msg}</div>
      </div>
      <div onClick={onClose} style={{color:FG_DIM,cursor:"pointer",fontSize:14,
        fontFamily:"'IBM Plex Mono',monospace",padding:"0 4px"}}>×</div>
    </div>
  );
}

// ── TICKER ────────────────────────────────────────────────────────────────────
function Ticker(){
  const items=[...TICKER_DATA,...TICKER_DATA];
  return(
    <div className="lp-ticker" style={{background:PANEL,borderBottom:`1px solid ${BORDER}`,
      height:40,overflow:"hidden",position:"relative"}}>
      <div className="lp-ticker-track" style={{display:"flex",alignItems:"center",height:"100%",
        animation:"tickerScroll 36s linear infinite",whiteSpace:"nowrap",width:"max-content"}}>
        {items.map((item,i)=>(
          <div key={i} className="lp-ticker-item" style={{display:"flex",alignItems:"center",
            gap:10,padding:"0 24px",borderRight:`1px solid ${BORDER}`,height:"100%"}}>
            <Mono style={{fontSize:10,color:GOLD,letterSpacing:"1.5px",fontWeight:700}}>{item.label}</Mono>
            <Mono style={{fontSize:11,color:FG,fontWeight:500}}>{item.val}</Mono>
            <Mono style={{fontSize:10,color:item.up?UP:DOWN,fontWeight:700}}>{item.chg}</Mono>
          </div>
        ))}
      </div>
      <div aria-hidden style={{position:"absolute",left:0,top:0,bottom:0,width:40,
        background:`linear-gradient(90deg,${PANEL},transparent)`,pointerEvents:"none",zIndex:1}}/>
      <div aria-hidden style={{position:"absolute",right:0,top:0,bottom:0,width:40,
        background:`linear-gradient(-90deg,${PANEL},transparent)`,pointerEvents:"none",zIndex:1}}/>
    </div>
  );
}

// ── HOLD-TO-EXEC BAR ──────────────────────────────────────────────────────────
function HoldBar({onComplete,command="initiate --platform --region=MY",width=560}){
  const[p,setP]=useState(0),[holding,setHolding]=useState(false);
  const rafRef=useRef(0),startRef=useRef(0),doneRef=useRef(false);
  const dur=900;
  useEffect(()=>()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);},[]);
  const tick=t=>{
    if(!startRef.current)startRef.current=t;
    const np=Math.min(1,(t-startRef.current)/dur);
    setP(np);
    if(np>=1){doneRef.current=true;setHolding(false);rafRef.current=0;onComplete();return;}
    rafRef.current=requestAnimationFrame(tick);
  };
  const start=e=>{
    e.preventDefault();e.stopPropagation();if(doneRef.current)return;
    setHolding(true);startRef.current=0;rafRef.current=requestAnimationFrame(tick);
  };
  const stop=e=>{
    if(e)e.stopPropagation();
    if(rafRef.current){cancelAnimationFrame(rafRef.current);rafRef.current=0;}
    setHolding(false);if(!doneRef.current)setP(0);
  };
  const pct=p*100;
  const trans=holding?"none":"width .35s cubic-bezier(.4,0,.2,1)";
  const inner=inv=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"18px 22px",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Mono style={{color:inv?BG:GOLD,fontWeight:700,fontSize:14}}>$</Mono>
        <Mono style={{color:inv?BG:FG,fontWeight:inv?600:400,fontSize:13}}>{command}</Mono>
        {!holding&&!inv&&(
          <span aria-hidden style={{display:"inline-block",width:8,height:14,
            background:FG,verticalAlign:"middle",marginLeft:1,
            animation:"caretBlink 1.05s steps(2) infinite"}}/>
        )}
      </div>
      <Mono style={{fontSize:10,letterSpacing:"2.5px",color:inv?BG:FG_DIM,
        fontWeight:inv?700:600,textTransform:"uppercase"}}>
        {holding?`${Math.floor(pct).toString().padStart(2,"0")}%`:"HOLD ↓ TO EXEC"}
      </Mono>
    </div>
  );
  return(
    <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onClick={e=>e.stopPropagation()} onContextMenu={e=>e.preventDefault()}
      className="hold-btn"
      style={{position:"relative",display:"block",width:"100%",maxWidth:width,
        background:PANEL_S,border:`1px solid ${BORDER}`,padding:0,cursor:"pointer",
        overflow:"hidden",touchAction:"none",userSelect:"none"}}>
      <div aria-hidden style={{position:"absolute",left:0,top:0,bottom:0,width:`${pct}%`,
        background:`linear-gradient(90deg,${GOLD_DIM} 0%,${GOLD} 100%)`,transition:trans,willChange:"width"}}/>
      <div aria-hidden style={{position:"absolute",left:0,top:0,bottom:0,right:0,overflow:"hidden",
        clipPath:`inset(0 ${100-pct}% 0 0)`,WebkitClipPath:`inset(0 ${100-pct}% 0 0)`,transition:trans}}>
        {inner(true)}
      </div>
      {inner(false)}
    </button>
  );
}

// ── LANDING SECTIONS ──────────────────────────────────────────────────────────
function HeroSection({onEnter}){
  const wide=useWide(960);
  return(
    <section style={{position:"relative",background:BG,borderBottom:`1px solid ${BORDER}`,overflow:"hidden"}}>
      <Grain/><Grid/><GoldBar/>
      <div style={{maxWidth:1400,margin:"0 auto",width:"100%",
        padding:wide?"clamp(14px,2.2vh,30px) 36px":"28px 24px",
        boxSizing:"border-box",position:"relative",zIndex:1,
        display:"grid",gridTemplateColumns:wide?"minmax(0,1fr) minmax(0,1fr)":"1fr",
        gap:wide?48:28,alignItems:"center"}}>

        {/* LEFT */}
        <div>
          <div data-morph style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
            color:FG_DIM,letterSpacing:"2.2px",fontWeight:500,marginBottom:20,
            display:"flex",alignItems:"center",gap:10,textTransform:"uppercase"}}>
            <span style={{color:GOLD}}>[</span>
            <span style={{color:GOLD,fontWeight:700}}>MER/07</span>
            <span style={{color:FG_MUTE}}>·</span>
            <span>Advisory Platform</span>
            <span style={{color:GOLD}}>]</span>
            <span style={{flex:1,height:1,background:BORDER}}/>
            <span style={{color:FG_MUTE}}>MAS-GUARD v1.0</span>
          </div>

          <h1 data-morph style={{fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(44px,5.8vw,76px)",fontWeight:700,lineHeight:.95,
            letterSpacing:"-.02em",color:FG,margin:"0 0 18px"}}>
            Real Estate<br/>Advisory,<br/>
            <span style={{color:GOLD}}>institutionalised</span>
            <span aria-hidden style={{display:"inline-block",width:12,height:12,
              background:GOLD,marginLeft:10,marginBottom:8,verticalAlign:"middle",
              boxShadow:`0 0 14px ${GOLD}`}}/>
          </h1>

          <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:15,lineHeight:1.65,
            color:FG_DIM,maxWidth:500,margin:"0 0 26px",fontWeight:400}}>
            Professional-grade consultancy infrastructure for the Malaysian real estate market. Built on the Meridian Advisory Standard — 22 guardrails, 7 report families, one platform.
          </p>

          <div data-morph>
            <HoldBar onComplete={onEnter}/>
            <div style={{marginTop:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,
              color:FG_MUTE,letterSpacing:"1.8px",textTransform:"uppercase"}}>
              ↳ press &amp; hold to enter the library
            </div>
          </div>

          <div data-morph style={{marginTop:24,paddingTop:18,borderTop:`1px solid ${BORDER}`,
            display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0}}>
            {[["Report Families","07"],["Guardrails","22"],["Domains","05"],["Region","MY"]].map(([k,v],i,a)=>(
              <div key={k} className="lp-stat" style={{
                borderRight:i<a.length-1?`1px solid ${BORDER}`:"none",
                padding:i===0?"6px 14px 6px 0":"6px 14px",margin:"-6px 0"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:FG_MUTE,
                  letterSpacing:"1.8px",textTransform:"uppercase",fontWeight:500,marginBottom:6}}>{k}</div>
                <div className="lp-stat-n" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:22,
                  color:FG,fontWeight:700,letterSpacing:"-.5px",
                  transition:"color .2s ease"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — guardrail preview */}
        <div data-morph style={{position:"relative"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:FG_MUTE,
            letterSpacing:"2px",fontWeight:500,marginBottom:12,
            display:"flex",alignItems:"center",justifyContent:"space-between",textTransform:"uppercase"}}>
            <span>—— guardrail matrix · excerpt</span>
            <span>MAS-GUARD-001 · v1.0</span>
          </div>
          <div style={{background:PANEL,border:`1px solid ${BORDER}`,overflow:"hidden"}}>
            {GUARDRAILS.slice(0,7).map((g,i)=>(
              <div key={g.code} style={{display:"flex",alignItems:"center",gap:12,
                padding:"9px 14px",
                borderBottom:i<6?`1px solid rgba(255,255,255,.04)`:"none",
                background:i%2===0?"transparent":"rgba(255,255,255,.012)"}}>
                <Mono style={{fontSize:9.5,color:GOLD,fontWeight:700,letterSpacing:"1px",minWidth:92}}>{g.code}</Mono>
                <span style={{flex:1,fontFamily:"'Inter',sans-serif",fontSize:12,color:FG_DIM}}>{g.title}</span>
                <SevPill sev={g.sev}/>
              </div>
            ))}
            <div style={{padding:"9px 14px",fontFamily:"'IBM Plex Mono',monospace",
              fontSize:9.5,color:GOLD,letterSpacing:"1.5px",fontWeight:700,
              borderTop:`1px solid ${BORDER}`}}>
              + 15 MORE → [SPACE] TO CONTINUE
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportSuiteSection(){
  const wide=useWide(700);
  return(
    <section style={{position:"relative",background:BG,borderBottom:`1px solid ${BORDER}`,overflow:"hidden"}}>
      <Grain/>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"0 36px",boxSizing:"border-box",position:"relative",zIndex:1}}>
        <SecTag num="S01" label="The Seven Report Families"/>
        <div data-morph>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
            fontWeight:700,color:FG,margin:"0 0 8px"}}>MER Report Suite</h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:FG_DIM,
            margin:"0 0 24px",maxWidth:600,lineHeight:1.6}}>
            Seven purpose-built consultancy report families. Each defines mandatory sections, typical scope, and guardrail requirements. All outputs carry the Meridian Advisory Standard.
          </p>
        </div>
        <div data-morph style={{display:"grid",
          gridTemplateColumns:wide?"repeat(auto-fill,minmax(300px,1fr))":"1fr",gap:10}}>
          {MER_TYPES.map((t,i)=>(
            <div key={t.code} className="lp-card" style={{background:PANEL_S,
              border:`1px solid ${BORDER}`,padding:"16px 20px",position:"relative"}}>
              <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:10}}>
                <Mono style={{fontSize:10.5,color:GOLD,fontWeight:700,letterSpacing:"1.5px"}}>{t.code}</Mono>
                <Mono style={{fontSize:9,color:FG_MUTE,padding:"2px 8px",
                  border:`1px solid ${BORDER}`,letterSpacing:"1px"}}>{t.tag}</Mono>
              </div>
              <div className="lp-num" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,
                fontWeight:700,color:FG,marginBottom:8,lineHeight:1.2,
                transition:"color .2s ease"}}>{t.type}</div>
              <Mono style={{fontSize:9.5,color:FG_MUTE,letterSpacing:"1px",
                display:"block",marginBottom:10}}>Pages: {t.pages}</Mono>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {[1,2,3,4,5,6,7,8].map(n=>(
                  <span key={n} style={{width:22,height:22,display:"flex",alignItems:"center",
                    justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:9.5,fontWeight:700,
                    background:t.sections.includes(n)?GOLD_DIM:"transparent",
                    color:t.sections.includes(n)?GOLD_B:FG_MUTE,
                    border:`1px solid ${t.sections.includes(n)?"rgba(196,146,42,.3)":BORDER}`}}>§{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuardrailSection(){
  const domains=["Scope","Evidence","AI Use","Disclosure","Process"];
  return(
    <section style={{position:"relative",background:PANEL,borderBottom:`1px solid ${BORDER}`,overflow:"hidden"}}>
      <Grain o={.02}/>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"0 36px",boxSizing:"border-box",position:"relative",zIndex:1}}>
        <SecTag num="S02" label="The Guardrail Matrix"/>
        <div data-morph>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
            fontWeight:700,color:FG,margin:"0 0 8px"}}>22 Guardrails · 5 Domains</h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:FG_DIM,
            margin:"0 0 20px",maxWidth:600,lineHeight:1.6}}>
            Document MAS-GUARD-001 v1.0. Governs every consultancy report produced on the Meridian platform across scope, evidence, AI use, disclosure, and process.
          </p>
        </div>
        <div data-morph style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {domains.map(d=>{
            const dc=DC[d],count=GUARDRAILS.filter(g=>g.domain===d).length;
            return(
              <div key={d} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
                color:dc.tx,fontWeight:700,letterSpacing:"1px",padding:"4px 12px",
                background:dc.bg,border:`1px solid ${dc.bd}`}}>
                {d} ({count})
              </div>
            );
          })}
        </div>
        <div data-morph style={{background:BG,border:`1px solid ${BORDER}`,overflow:"hidden"}}>
          {GUARDRAILS.map((g,i)=>{
            const dc=DC[g.domain];
            return(
              <div key={g.code} className="gr-row" style={{display:"flex",alignItems:"center",
                gap:14,padding:"8px 14px",
                borderBottom:i<GUARDRAILS.length-1?`1px solid rgba(255,255,255,.04)`:"none",
                background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
                <Mono style={{fontSize:9.5,color:GOLD,fontWeight:700,letterSpacing:"1px",minWidth:100}}>{g.code}</Mono>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 8px",
                  background:dc.bg,color:dc.tx,border:`1px solid ${dc.bd}`,
                  minWidth:78,letterSpacing:"1px",fontWeight:700,textAlign:"center"}}>{g.domain}</div>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:FG_DIM,flex:1}}>{g.title}</span>
                <SevPill sev={g.sev}/>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MethodologySection(){
  const wide=useWide(700);
  return(
    <section style={{position:"relative",background:BG,borderBottom:`1px solid ${BORDER}`,overflow:"hidden"}}>
      <Grain/>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"0 36px",boxSizing:"border-box",position:"relative",zIndex:1}}>
        <SecTag num="S03" label="Mandatory Report Structure"/>
        <div data-morph>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
            fontWeight:700,color:FG,margin:"0 0 8px"}}>Eight-Section Standard</h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:FG_DIM,
            margin:"0 0 22px",maxWidth:600,lineHeight:1.6}}>
            Every Meridian consultancy report follows this structure in order. Sections marked COND are required only for applicable report types per the MER suite table.
          </p>
        </div>
        <div data-morph style={{display:"grid",
          gridTemplateColumns:wide?"repeat(auto-fill,minmax(340px,1fr))":"1fr",gap:10,marginBottom:24}}>
          {REPORT_SECTIONS.map(s=>(
            <div key={s.n} style={{background:PANEL_S,border:`1px solid ${BORDER}`,
              padding:"14px 18px",display:"flex",gap:14}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:20,fontWeight:700,
                color:GOLD,minWidth:28,opacity:.3,lineHeight:1,paddingTop:2}}>§{s.n}</div>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,
                  color:FG,marginBottom:5,display:"flex",alignItems:"center",gap:8}}>
                  {s.title}
                  {s.cond&&(
                    <Mono style={{fontSize:8,color:AMBER,border:`1px solid rgba(212,160,32,.3)`,
                      padding:"1px 6px",letterSpacing:"1px",fontWeight:700}}>COND</Mono>
                  )}
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:FG_DIM,lineHeight:1.6}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div data-morph>
          <Mono style={{fontSize:9.5,color:GOLD,letterSpacing:"2px",fontWeight:700,
            display:"block",marginBottom:12}}>—— AI ROLE BOUNDARIES</Mono>
          <div style={{background:PANEL_S,border:`1px solid ${BORDER}`,overflow:"hidden"}}>
            {[
              {task:"Market data aggregation",    lead:true, rev:true,  human:false},
              {task:"Comparable transaction search",lead:true,rev:true, human:false},
              {task:"Financial model population", lead:true, rev:true,  human:false},
              {task:"Sensitivity / scenario analysis",lead:true,rev:true,human:false},
              {task:"Draft narrative production", lead:true, rev:true,  human:false},
              {task:"Regulatory & zoning interpretation",lead:false,rev:false,human:true},
              {task:"Physical site visit",        lead:false,rev:false, human:true},
              {task:"Risk Register final scores", lead:false,rev:true,  human:false},
              {task:"Final sign-off",             lead:false,rev:false, human:true},
            ].map((row,i,a)=>(
              <div key={row.task} style={{display:"grid",
                gridTemplateColumns:"1fr 110px 110px 110px",
                alignItems:"center",padding:"8px 16px",
                borderBottom:i<a.length-1?`1px solid rgba(255,255,255,.04)`:"none",
                background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:FG_DIM}}>{row.task}</span>
                {[row.lead,row.rev,row.human].map((v,j)=>(
                  <Mono key={j} style={{fontSize:11,color:v?UP:FG_MUTE,fontWeight:v?700:400,textAlign:"center"}}>{v?"✓":"—"}</Mono>
                ))}
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 110px",
              padding:"8px 16px",borderTop:`1px solid ${BORDER}`}}>
              <span/>
              {["AI may lead","Human review","Human leads"].map(h=>(
                <Mono key={h} style={{fontSize:8.5,color:GOLD,letterSpacing:"1px",fontWeight:700,
                  textAlign:"center",textTransform:"uppercase"}}>{h}</Mono>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeploySection({onEnter}){
  return(
    <section style={{position:"relative",background:PANEL,borderBottom:`1px solid ${BORDER}`,overflow:"hidden"}}>
      <Grain o={.02}/><Grid/>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"0 36px",boxSizing:"border-box",
        position:"relative",zIndex:1,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        <SecTag num="S04" label="Enter the Platform"/>
        <div data-morph>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(40px,5.5vw,72px)",
            fontWeight:700,color:FG,margin:"0 0 16px",lineHeight:1.0}}>
            The advisory library<br/><span style={{color:GOLD}}>is ready.</span>
          </h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:FG_DIM,
            maxWidth:540,margin:"0 auto 32px",lineHeight:1.65}}>
            Access all seven MER report families, the complete guardrail enforcement framework, and interactive analysis tools — built to Meridian Advisory Standards.
          </p>
        </div>
        <div data-morph style={{marginBottom:36}}>
          <HoldBar onComplete={onEnter} command="access --library --env=production --region=MY" width={580}/>
          <div style={{marginTop:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,
            color:FG_MUTE,letterSpacing:"1.8px",textTransform:"uppercase"}}>
            ↳ press &amp; hold to enter the report library
          </div>
        </div>
        <div data-morph style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          {[["7","Report families"],["22","Guardrail rules"],["5","Domains"],["12","Checklist items"],["MY","Jurisdiction"]].map(([v,l])=>(
            <div key={l} style={{background:BG,border:`1px solid ${BORDER}`,padding:"16px 24px",textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,color:GOLD,lineHeight:1}}>{v}</div>
              <Mono style={{fontSize:9.5,color:FG_MUTE,letterSpacing:"1.5px",textTransform:"uppercase",
                display:"block",marginTop:6}}>{l}</Mono>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── LANDING PAGE (morph orchestrator) ─────────────────────────────────────────
function LandingPage({onEnter,scrollRef,active}){
  const[hint,setHint]=useState(true);
  const busyRef=useRef(false),trackedRef=useRef([]);

  const jump=useCallback(dir=>{
    if(busyRef.current)return;
    const cont=scrollRef?.current;if(!cont)return;
    const cTop=cont.getBoundingClientRect().top;
    let cur=0,bestD=Infinity;
    LP_SECTIONS.forEach((s,i)=>{
      const el=document.getElementById(s.id);if(!el)return;
      const d=Math.abs(el.getBoundingClientRect().top-cTop);
      if(d<bestD){bestD=d;cur=i;}
    });
    const next=(cur+dir+LP_SECTIONS.length)%LP_SECTIONS.length;
    const srcWrap=document.getElementById(LP_SECTIONS[cur].id);
    const dstWrap=document.getElementById(LP_SECTIONS[next].id);
    if(!dstWrap)return;
    const dest=next===0?0:(dstWrap.getBoundingClientRect().top-cTop+cont.scrollTop-54);
    busyRef.current=true;setHint(false);

    const src=getMorphBlocks(srcWrap),dst=getMorphBlocks(dstWrap);
    const vh=cont.clientHeight,vc=cTop+vh/2,sign=dir>0?1:-1;

    src.forEach((el,i)=>{
      const r=el.getBoundingClientRect(),dy=(r.top+r.height/2)-vc;
      const flyY=(dy<0?-1:1)*140-sign*40,flyX=((i%2)?1:-1)*(60+i*4),delay=Math.min(120,i*22);
      el.style.willChange="transform,opacity,filter";
      el.style.transition=`transform ${SCATTER_DUR}ms cubic-bezier(.55,0,.4,1) ${delay}ms,opacity ${SCATTER_DUR-80}ms ease ${delay}ms,filter ${SCATTER_DUR-100}ms ease ${delay}ms`;
      el.style.transform=`translate(${flyX}px,${flyY}px) scale(.92)`;
      el.style.opacity="0";el.style.filter="blur(8px)";
    });
    dst.forEach(el=>{el.style.willChange="transform,opacity,filter";el.style.transition="none";el.style.opacity="0";});
    trackedRef.current=[...src,...dst];

    const t0=performance.now(),start=cont.scrollTop,delta=dest-start;
    const easeIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
    const tweenScroll=now=>{
      const p=Math.min(1,(now-t0)/SCROLL_DUR);cont.scrollTop=start+delta*easeIO(p);
      if(p<1)requestAnimationFrame(tweenScroll);
    };
    requestAnimationFrame(tweenScroll);

    const assembleAt=Math.max(SCATTER_DUR-120,SCROLL_DUR-200);
    setTimeout(()=>{
      dst.forEach((el,i)=>{
        const r=el.getBoundingClientRect(),dy=(r.top+r.height/2)-(cTop+vh/2);
        const flyY=(dy<0?-1:1)*110+sign*30,flyX=((i%2)?-1:1)*(50+i*4);
        el.style.transition="none";
        el.style.transform=`translate(${flyX}px,${flyY}px) scale(.93)`;
        el.style.opacity="0";el.style.filter="blur(8px)";
        void el.offsetHeight;
        const delay=Math.min(180,i*40);
        el.style.transition=`transform ${ASSEMBLE_DUR}ms cubic-bezier(.18,1.05,.32,1) ${delay}ms,opacity ${ASSEMBLE_DUR-80}ms ease ${delay}ms,filter ${ASSEMBLE_DUR-120}ms ease ${delay}ms`;
        el.style.transform="";el.style.opacity="";el.style.filter="";
      });
    },assembleAt);

    setTimeout(()=>{trackedRef.current.forEach(clearMorph);trackedRef.current=[];busyRef.current=false;},
      assembleAt+ASSEMBLE_DUR+220);
  },[scrollRef]);

  useEffect(()=>()=>{trackedRef.current.forEach(clearMorph);},[]);
  useEffect(()=>{
    if(!active)return;
    const onKey=e=>{
      if(e.code!=="Space"&&e.key!==" ")return;
      const tag=e.target?.tagName||"";
      if(tag==="INPUT"||tag==="TEXTAREA"||e.target?.isContentEditable)return;
      e.preventDefault();jump(e.shiftKey?-1:1);
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[active,jump]);

  return(
    <div style={{background:BG}}>
      <div aria-hidden style={{height:56,background:BG}}/>
      <Ticker/>
      <div id="lp-s0" className="lp-fit"><HeroSection onEnter={onEnter}/></div>
      <div id="lp-s1" className="lp-fit"><ReportSuiteSection/></div>
      <div id="lp-s2" className="lp-fit"><GuardrailSection/></div>
      <div id="lp-s3" className="lp-fit"><MethodologySection/></div>
      <div id="lp-s4" className="lp-fit"><DeploySection onEnter={onEnter}/></div>
      {active&&hint&&(
        <div style={{position:"fixed",bottom:22,left:"50%",
          transform:"translateX(-50%)",zIndex:280,pointerEvents:"none",
          display:"flex",alignItems:"center",gap:12,
          background:"rgba(7,9,15,.85)",backdropFilter:"blur(10px)",
          border:`1px solid ${BORDER}`,padding:"8px 16px",
          fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,
          letterSpacing:"1.8px",textTransform:"uppercase",fontWeight:500,
          color:FG_DIM,animation:"hintFloat 2.4s ease infinite"}}>
          <span style={{width:6,height:6,background:GOLD,
            boxShadow:`0 0 6px ${GOLD}`,animation:"goldPulse 1.6s ease infinite"}}/>
          <span style={{color:FG,fontWeight:700,border:`1px solid ${BORDER}`,padding:"2px 7px"}}>SPACE</span>
          <span>morph section</span>
          <span style={{color:FG_MUTE}}>·</span>
          <span style={{color:FG,fontWeight:700,border:`1px solid ${BORDER}`,padding:"2px 7px"}}>⇧ SPACE</span>
          <span>back</span>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function ReportCard({t,onDL,downloading,idx}){
  const[ref,v]=useInView(.04);
  const busy=downloading===t.code;
  return(
    <div ref={ref} className="mer-card" style={{background:PANEL_S,border:`1px solid ${BORDER}`,
      overflow:"hidden",position:"relative",
      opacity:v?1:0,transform:v?"translateY(0)":"translateY(20px)",
      transition:`opacity .55s ease ${idx*60}ms,transform .55s cubic-bezier(.22,1,.36,1) ${idx*60}ms`,
      display:"flex",flexDirection:"column"}}>
      <Grain o={.02}/>
      <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${GOLD} 40%,${GOLD} 60%,transparent)`,
        opacity:.45,zIndex:1}}/>
      {/* Header */}
      <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${BORDER}`,
        background:GOLD_DIM,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",
          marginBottom:10}}>
          <Mono style={{fontSize:10.5,color:GOLD,fontWeight:700,letterSpacing:"2px"}}>{t.code}</Mono>
          <Mono style={{fontSize:9.5,color:FG_MUTE,letterSpacing:"1.5px"}}>{t.pages} pp</Mono>
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,
          color:FG,lineHeight:1.1,marginBottom:4}}>{t.type}</div>
        <Mono style={{fontSize:9.5,color:FG_MUTE,letterSpacing:"1.2px",textTransform:"uppercase"}}>{t.tag}</Mono>
      </div>
      {/* Body */}
      <div style={{padding:"14px 22px",flex:1,position:"relative",zIndex:1}}>
        <Mono style={{fontSize:9,color:FG_MUTE,letterSpacing:"1.5px",textTransform:"uppercase",
          fontWeight:700,display:"block",marginBottom:8}}>—— REQUIRED SECTIONS</Mono>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
          {[1,2,3,4,5,6,7,8].map(n=>(
            <div key={n} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,
              padding:"4px 10px",letterSpacing:"1px",
              background:t.sections.includes(n)?GOLD_DIM:"transparent",
              color:t.sections.includes(n)?GOLD_B:FG_MUTE,
              border:`1px solid ${t.sections.includes(n)?"rgba(196,146,42,.35)":BORDER}`}}>§{n}</div>
          ))}
        </div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:FG_DIM,lineHeight:1.65}}>{t.desc}</div>
      </div>
      {/* Download */}
      <div style={{padding:"14px 22px",borderTop:`1px solid ${BORDER}`,position:"relative",zIndex:1}}>
        <button onClick={()=>onDL(t.code)} disabled={busy} style={{width:"100%",
          background:busy?PANEL:GOLD_DIM,
          border:`1px solid ${busy?BORDER:"rgba(196,146,42,.4)"}`,
          color:busy?FG_MUTE:GOLD_B,fontFamily:"'IBM Plex Mono',monospace",
          fontSize:10,letterSpacing:"2px",fontWeight:700,textTransform:"uppercase",
          padding:"11px 0",cursor:busy?"wait":"pointer",transition:"all .15s ease"}}>
          {busy?"PREPARING...":(`↓ DOWNLOAD ${t.code} TEMPLATE`)}
        </button>
      </div>
    </div>
  );
}

function Dashboard({onTool}){
  const[downloading,setDL]=useState(null),[toast,setToast]=useState(null);
  const handleDL=code=>{
    setDL(code);
    setTimeout(()=>{setDL(null);setToast(`${code} report template prepared — all mandatory sections per MAS-GUARD-001 included.`);},1200);
  };
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:56}}/>
      <div style={{background:PANEL,borderBottom:`1px solid ${BORDER}`,padding:"20px 28px"}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <Mono style={{fontSize:9.5,color:GOLD,letterSpacing:"2.5px",fontWeight:700,
            textTransform:"uppercase",display:"block",marginBottom:8}}>MERIDIAN · REPORT LIBRARY</Mono>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,3.5vw,44px)",
            fontWeight:700,color:FG,margin:"0 0 6px"}}>MER Report Templates</h1>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:FG_DIM,margin:"0 0 16px",lineHeight:1.6}}>
            Seven report family templates built to Meridian Advisory Standards. All structures comply with MAS-GUARD-001.
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {[["Guardrail Checker","checker"],["Risk Scorer","risk"]].map(([label,pg])=>(
              <button key={pg} className="btn-o" onClick={()=>onTool(pg)} style={{
                background:"transparent",color:FG_DIM,border:`1px solid ${BORDER}`,
                padding:"7px 16px",fontSize:10,cursor:"pointer",
                letterSpacing:"2px",textTransform:"uppercase",fontWeight:600}}>→ {label}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"32px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
          {MER_TYPES.map((t,i)=>(
            <ReportCard key={t.code} t={t} onDL={handleDL} downloading={downloading} idx={i}/>
          ))}
        </div>
      </div>
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ── GUARDRAIL CHECKER ─────────────────────────────────────────────────────────
const G_CHECKS=[
  "G-01 Report type code assigned; section structure matches MER suite table",
  "G-02 Executive Summary findings each traceable to a body section",
  "G-03 All quantitative claims attributed to a named Tier 1 or Tier 2 source",
  "G-04 AI limitation flags reviewed by human consultant for §3.4, §3.5, §7.1, §7.2",
  "G-05 Risk Register contains ≥ 5 risks, each scored Likelihood × Impact (1–5)",
  "G-06 Mandatory Disclaimer Block (§8) present and fully populated",
  "G-07 No certified value language used anywhere in the report",
  "G-08 Financial projections carry forward-looking statement language",
  "G-09 Key Assumptions Register numbered and complete",
  "G-10 Report classified CONFIDENTIAL with correct client name and engagement ref",
  "G-11 Reviewed-by field populated — different person from Lead Consultant",
  "G-12 AI disclosure statement included in Section 8",
];
const G_HUMAN=[3,10]; // 0-indexed items requiring explicit human sign-off

function GuardrailChecker(){
  const[checked,setChecked]=useState({}),[ref_code,setRef]=useState("");
  const toggle=i=>setChecked(c=>({...c,[i]:!c[i]}));
  const done=Object.values(checked).filter(Boolean).length;
  const allDone=done===G_CHECKS.length;
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:56}}/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 28px"}}>
        <Mono style={{fontSize:9.5,color:GOLD,letterSpacing:"2.5px",fontWeight:700,
          textTransform:"uppercase",display:"block",marginBottom:10}}>MERIDIAN · GUARDRAIL CHECKER</Mono>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,48px)",
          fontWeight:700,color:FG,margin:"0 0 8px"}}>Pre-Release Compliance</h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:FG_DIM,margin:"0 0 28px",lineHeight:1.6}}>
          Complete all 12 items before releasing any Meridian report. Items flagged HUMAN REQ. require explicit human review — AI pre-population alone is insufficient.
        </p>
        {/* Ref input */}
        <div style={{marginBottom:24}}>
          <Mono style={{fontSize:9.5,color:FG_DIM,letterSpacing:"2px",textTransform:"uppercase",
            fontWeight:600,display:"block",marginBottom:8}}>—— ENGAGEMENT REFERENCE</Mono>
          <input value={ref_code} onChange={e=>setRef(e.target.value)}
            placeholder="MER-MKT-2026-001"
            style={{background:PANEL,border:`1px solid ${BORDER}`,color:FG,
              fontFamily:"'IBM Plex Mono',monospace",fontSize:13,
              padding:"11px 14px",width:280,letterSpacing:".5px"}}/>
        </div>
        {/* Progress */}
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <Mono style={{fontSize:10,color:GOLD,letterSpacing:"1.5px"}}>COMPLIANCE SCORE</Mono>
            <Mono style={{fontSize:12,color:allDone?UP:GOLD,fontWeight:700}}>
              {done}/{G_CHECKS.length} — {Math.round(done/G_CHECKS.length*100)}%
            </Mono>
          </div>
          <div style={{background:PANEL,border:`1px solid ${BORDER}`,height:4,position:"relative"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,
              width:`${(done/G_CHECKS.length)*100}%`,
              background:allDone?UP:GOLD,boxShadow:`0 0 8px ${allDone?UP:GOLD}`,
              transition:"width .35s cubic-bezier(.22,1,.36,1),background .3s"}}/>
          </div>
        </div>
        {/* List */}
        <div style={{background:PANEL,border:`1px solid ${BORDER}`,marginBottom:20}}>
          {G_CHECKS.map((text,i)=>{
            const on=!!checked[i],needHuman=G_HUMAN.includes(i);
            return(
              <div key={i} onClick={()=>toggle(i)} style={{display:"flex",alignItems:"flex-start",
                gap:14,padding:"14px 18px",
                borderBottom:i<G_CHECKS.length-1?`1px solid rgba(255,255,255,.04)`:"none",
                cursor:"pointer",userSelect:"none",
                background:on?"rgba(91,173,122,.04)":"transparent",transition:"background .15s"}}>
                <div style={{width:18,height:18,border:`1px solid ${on?UP:BORDER}`,
                  background:on?UP:"transparent",flexShrink:0,marginTop:2,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all .15s"}}>
                  {on&&<span style={{color:BG,fontSize:11,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,
                  color:on?FG_DIM:FG,lineHeight:1.55,flex:1}}>{text}</span>
                {needHuman&&!on&&(
                  <Mono style={{fontSize:8.5,color:AMBER,border:`1px solid rgba(212,160,32,.3)`,
                    padding:"2px 7px",letterSpacing:"1px",fontWeight:700,flexShrink:0,marginTop:2}}>HUMAN REQ.</Mono>
                )}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
          {allDone&&(
            <div style={{flex:1,background:"rgba(91,173,122,.1)",
              border:`1px solid rgba(91,173,122,.4)`,padding:"14px 20px",
              fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:UP,
              letterSpacing:"1.5px",fontWeight:700,textTransform:"uppercase"}}>
              ✓ GUARDRAIL CHECK COMPLETE — CLEARED FOR RELEASE{ref_code&&` · ${ref_code}`}
            </div>
          )}
          <button onClick={()=>setChecked({})} style={{background:"transparent",
            border:`1px solid ${BORDER}`,color:FG_DIM,
            fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"2px",
            textTransform:"uppercase",fontWeight:600,padding:"10px 20px",cursor:"pointer"}}>RESET</button>
        </div>
      </div>
    </div>
  );
}

// ── RISK SCORER ───────────────────────────────────────────────────────────────
function RiskScorer(){
  const[risks,setRisks]=useState([
    {id:1,name:"STR market oversupply post-VM2026",l:4,i:4},
    {id:2,name:"Construction cost overrun",l:3,i:4},
    {id:3,name:"Land acquisition above RM12M threshold",l:3,i:5},
  ]);
  const[next,setNext]=useState(4),[newName,setNewName]=useState("");
  const add=()=>{
    if(!newName.trim())return;
    setRisks(r=>[...r,{id:next,name:newName.trim(),l:3,i:3}]);
    setNext(n=>n+1);setNewName("");
  };
  const upd=(id,k,v)=>setRisks(r=>r.map(x=>x.id===id?{...x,[k]:v}:x));
  const rm=id=>setRisks(r=>r.filter(x=>x.id!==id));
  const sColor=s=>s>=15?DOWN:s>=8?AMBER:UP;
  const sLabel=s=>s>=15?"Critical":s>=8?"High":"Medium";
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:56}}/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 28px"}}>
        <Mono style={{fontSize:9.5,color:GOLD,letterSpacing:"2.5px",fontWeight:700,
          textTransform:"uppercase",display:"block",marginBottom:10}}>MERIDIAN · RISK SCORER</Mono>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,48px)",
          fontWeight:700,color:FG,margin:"0 0 8px"}}>Risk Register Builder</h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:FG_DIM,margin:"0 0 28px",lineHeight:1.6}}>
          Add risks and score Likelihood × Impact (1–5 each). Minimum 5 risks required per guardrail G-05. Scores 15–25 Critical · 8–14 High · &lt;8 Medium.
        </p>
        {/* Add row */}
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&add()}
            placeholder="Add a risk description..."
            style={{flex:1,background:PANEL,border:`1px solid ${BORDER}`,color:FG,
              fontFamily:"'Inter',sans-serif",fontSize:13.5,padding:"11px 14px"}}/>
          <button onClick={add} style={{background:GOLD_DIM,border:`1px solid rgba(196,146,42,.4)`,
            color:GOLD_B,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
            letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,
            padding:"0 20px",cursor:"pointer"}}>+ ADD</button>
        </div>
        {/* Table */}
        <div style={{background:PANEL,border:`1px solid ${BORDER}`,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 64px 90px 28px",
            gap:8,padding:"10px 16px",borderBottom:`1px solid ${BORDER}`}}>
            {["Risk","Likelihood","Impact","Score","Severity",""].map((h,i)=>(
              <Mono key={i} style={{fontSize:9.5,color:GOLD,letterSpacing:"1.5px",fontWeight:700,
                textTransform:"uppercase",textAlign:i>0?"center":"left"}}>{h}</Mono>
            ))}
          </div>
          {risks.map((r,i)=>{
            const score=r.l*r.i;
            return(
              <div key={r.id} style={{display:"grid",
                gridTemplateColumns:"1fr 80px 80px 64px 90px 28px",
                gap:8,padding:"12px 16px",alignItems:"center",
                borderBottom:i<risks.length-1?`1px solid rgba(255,255,255,.04)`:"none",
                background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:FG}}>{r.name}</span>
                {[["l",r.l],["i",r.i]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                    <button onClick={()=>upd(r.id,k,Math.max(1,v-1))} style={{
                      width:20,height:20,background:"transparent",border:`1px solid ${BORDER}`,
                      color:FG_DIM,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>−</button>
                    <Mono style={{fontSize:14,fontWeight:700,color:GOLD,minWidth:16,textAlign:"center"}}>{v}</Mono>
                    <button onClick={()=>upd(r.id,k,Math.min(5,v+1))} style={{
                      width:20,height:20,background:"transparent",border:`1px solid ${BORDER}`,
                      color:FG_DIM,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>+</button>
                  </div>
                ))}
                <Mono style={{fontSize:22,fontWeight:700,color:sColor(score),textAlign:"center"}}>{score}</Mono>
                <Mono style={{fontSize:9.5,fontWeight:700,letterSpacing:"1px",
                  textAlign:"center",color:sColor(score)}}>{sLabel(score)}</Mono>
                <button onClick={()=>rm(r.id)} style={{background:"transparent",border:"none",
                  color:FG_MUTE,cursor:"pointer",fontSize:14,fontFamily:"'IBM Plex Mono',monospace"}}>×</button>
              </div>
            );
          })}
        </div>
        {/* G-05 indicator */}
        <div style={{display:"flex",alignItems:"center",gap:12,background:PANEL,
          border:`1px solid ${risks.length>=5?"rgba(91,173,122,.3)":BORDER}`,padding:"12px 16px"}}>
          <Mono style={{fontSize:10.5,color:risks.length>=5?UP:AMBER,fontWeight:700}}>
            {risks.length>=5?"✓":"⚠"}
          </Mono>
          <Mono style={{fontSize:10,color:FG_DIM,letterSpacing:"1px"}}>
            G-05: {risks.length}/5 minimum — {risks.length>=5?"COMPLIANT":`${5-risks.length} MORE REQUIRED`}
          </Mono>
        </div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App(){
  const[booting,setBooting]=useState(true);
  const[page,setPage]=useState("landing");
  const scrollRef=useRef(null);
  const go=p=>setPage(p);
  const back=()=>setPage(page==="dashboard"?"landing":"dashboard");
  return(
    <>
      <style>{CSS}</style>
      {booting&&<Boot onDone={()=>setBooting(false)}/>}
      <Nav page={page} onBack={back}/>
      <div ref={scrollRef} style={{position:"fixed",inset:0,overflowY:"auto",
        overflowX:"hidden",scrollbarWidth:"thin"}}>
        {page==="landing"&&<LandingPage onEnter={()=>go("dashboard")} scrollRef={scrollRef} active={!booting}/>}
        {page==="dashboard"&&<Dashboard onTool={go}/>}
        {page==="checker"&&<GuardrailChecker/>}
        {page==="risk"&&<RiskScorer/>}
      </div>
    </>
  );
}
