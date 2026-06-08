import React, { useState, useEffect, useRef, useCallback } from "react";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const BG="#FAF9F6", SURFACE="#FFFFFF", SURFACE_S="#F3F1EC";
const NAVY_SECTION="#1B3356";
const BORDER="#E2DDD6", BORDER_L="#EBE8E2";
const INK="#1A2130", INK_S="#485870", INK_M="#8B98A8", INK_F="#C4CAD4";
const NAVY="#1B3356", NAVY_L="#24406C", NAVY_DIM="rgba(27,51,86,.07)";
const GOLD="#A87928", GOLD_B="#C09520", GOLD_DIM="rgba(168,121,40,.08)";
const UP="#276749", DOWN="#B0392D", AMBER="#9A6B18";

// ── TIMING ────────────────────────────────────────────────────────────────────
const SCATTER_DUR=240, ASSEMBLE_DUR=360, SCROLL_DUR=580;

// ── DOMAIN COLOR MAP ──────────────────────────────────────────────────────────
const DC={
  "Scope":     {bg:"rgba(27,51,86,.06)",  bd:"rgba(27,51,86,.18)",  tx:NAVY},
  "Evidence":  {bg:GOLD_DIM,             bd:"rgba(168,121,40,.2)", tx:GOLD},
  "AI Use":    {bg:"rgba(39,103,73,.07)", bd:"rgba(39,103,73,.2)",  tx:UP},
  "Disclosure":{bg:"rgba(176,57,45,.06)", bd:"rgba(176,57,45,.2)",  tx:DOWN},
  "Process":   {bg:"rgba(154,107,24,.06)",bd:"rgba(154,107,24,.2)", tx:AMBER},
};

// ── DATA ──────────────────────────────────────────────────────────────────────
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
const G_HUMAN=[3,10];

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
@keyframes bootFadeOut{0%{opacity:1;visibility:visible}100%{opacity:0;visibility:hidden}}
@keyframes bootReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes dotPulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes hintFloat{0%,100%{transform:translateX(-50%) translateY(0px)}50%{transform:translateX(-50%) translateY(5px)}}
body{margin:0;font-family:'Inter',sans-serif;color:${INK};background:${BG};-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:${SURFACE_S}}
::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:${INK_F}}
.card,.mer-card{transition:box-shadow .25s,transform .25s}
.card:hover,.mer-card:hover{box-shadow:0 8px 30px rgba(26,33,48,.1);transform:translateY(-2px)}
.lp-card{transition:box-shadow .25s,border-color .25s,transform .25s;cursor:default}
.lp-card:hover{box-shadow:0 8px 30px rgba(26,33,48,.1);border-color:${GOLD}!important;transform:translateY(-2px)}
.lp-card:hover .lp-num{color:${GOLD_B}!important}
.gr-row{transition:background .15s;cursor:pointer}
.gr-row:hover{background:${GOLD_DIM}!important}
.btn-primary{transition:background .15s;cursor:pointer}
.btn-primary:hover{background:${NAVY_L}!important}
.btn-outline{transition:border-color .15s,color .15s;cursor:pointer}
.btn-outline:hover{border-color:${GOLD}!important;color:${GOLD}!important}
input:focus{outline:none;border-color:${NAVY}!important;box-shadow:0 0 0 3px ${NAVY_DIM}!important}
input::placeholder{color:${INK_F}}
.lp-fit{height:calc(100vh - 60px);max-height:calc(100vh - 60px);display:flex;flex-direction:column;overflow:hidden}
#lp-s0{height:calc(100vh - 60px);max-height:calc(100vh - 60px)}
.lp-fit>section{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;width:100%;box-sizing:border-box;padding:clamp(24px,3.5vh,52px) 0!important}
`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
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

function getMorphBlocks(s){return s?Array.from(s.querySelectorAll("[data-morph]")).slice(0,12):[]}
function clearMorph(el){el.style.transition=el.style.transform=el.style.opacity=el.style.willChange="";}

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
function SectionLabel({num,label}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:GOLD,fontWeight:700,letterSpacing:"1.5px"}}>{num}</span>
      <span style={{width:20,height:1,background:GOLD,opacity:.6,display:"inline-block"}}/>
      <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,fontWeight:600,letterSpacing:"2.5px",textTransform:"uppercase"}}>{label}</span>
    </div>
  );
}

// ── SEV PILL ──────────────────────────────────────────────────────────────────
function SevPill({sev}){
  const map={
    "Critical":{bg:"rgba(176,57,45,.07)",bd:"rgba(176,57,45,.2)",tx:DOWN},
    "High":    {bg:GOLD_DIM,            bd:"rgba(168,121,40,.2)",tx:GOLD},
    "Medium":  {bg:"rgba(154,107,24,.06)",bd:"rgba(154,107,24,.18)",tx:AMBER},
  };
  const s=map[sev]||map["Medium"];
  return(
    <span style={{fontSize:10.5,fontWeight:600,padding:"3px 10px",borderRadius:2,
      border:`1px solid ${s.bd}`,background:s.bg,color:s.tx,whiteSpace:"nowrap"}}>
      {sev}
    </span>
  );
}

// ── BOOT SCREEN ───────────────────────────────────────────────────────────────
function Boot({onDone}){
  const[leaving,setLeaving]=useState(false),[pct,setPct]=useState(0);
  const finRef=useRef(false),rafRef=useRef(0),tgtRef=useRef(0);
  const finish=useCallback(()=>{
    if(finRef.current)return;finRef.current=true;
    tgtRef.current=100;setLeaving(true);setTimeout(onDone,620);
  },[onDone]);
  useEffect(()=>{
    const start=Date.now();
    const tick=()=>{
      const elapsed=Date.now()-start;
      if(!finRef.current){
        const natural=Math.min(elapsed/2200,1)*92;
        tgtRef.current=natural;
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);
  useEffect(()=>{
    const lerp=()=>{
      setPct(p=>{const t=tgtRef.current,np=p+(t-p)*.1;return Math.abs(t-np)<.3?t:np;});
      rafRef.current=requestAnimationFrame(lerp);
    };
    const id=requestAnimationFrame(lerp);return()=>cancelAnimationFrame(id);
  },[]);
  useEffect(()=>{
    const t=setTimeout(finish,2500);
    return()=>clearTimeout(t);
  },[finish]);
  useEffect(()=>{
    const k=()=>finish();
    window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);
  },[finish]);
  const delay=(n)=>({animation:`bootReveal .5s ease ${n*0.1}s both`});
  return(
    <div onClick={finish} style={{position:"fixed",inset:0,zIndex:9000,background:SURFACE,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      cursor:"pointer",gap:0,
      animation:leaving?"bootFadeOut .6s ease forwards":"none"}}>
      <div style={{...delay(0),display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:NAVY,
          boxShadow:"0 8px 32px rgba(27,51,86,.2)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:"#fff",fontWeight:700,lineHeight:1}}>M</span>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"4px",color:INK,textTransform:"uppercase",marginBottom:6}}>MERIDIAN RE ADVISORY</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M}}>Consultancy Platform · MAS-GUARD-001 v1.0</div>
        </div>
        <div style={{width:"100%",maxWidth:280,height:2,background:BORDER_L,borderRadius:1,overflow:"hidden",marginTop:4}}>
          <div style={{height:"100%",background:GOLD,width:`${pct}%`,transition:"width .12s ease",borderRadius:1}}/>
        </div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:INK_F,letterSpacing:"0.5px"}}>Click or press any key to continue</div>
      </div>
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav({page,onBack}){
  const pathLabel=page==="dashboard"?"/ report-library":page==="checker"?"/ guardrail-checker":page==="risk"?"/ risk-scorer":"";
  return(
    <nav style={{position:"fixed",top:0,left:0,right:0,height:60,zIndex:300,
      background:"rgba(250,249,246,.96)",backdropFilter:"blur(12px)",
      WebkitBackdropFilter:"blur(12px)",borderBottom:`1px solid ${BORDER}`,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 28px",boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:NAVY,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#fff",fontWeight:700,lineHeight:1}}>M</span>
        </div>
        <div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK,lineHeight:1.2}}>
            <span style={{fontWeight:700}}>MERIDIAN</span>
            <span style={{color:INK_M,fontWeight:400}}> RE ADVISORY</span>
          </div>
          {pathLabel&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:INK_M,lineHeight:1,marginTop:2}}>{pathLabel}</div>}
        </div>
      </div>
      {page!=="landing"&&(
        <button onClick={onBack} className="btn-outline"
          style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
            border:`1px solid ${BORDER}`,background:"transparent",
            padding:"7px 14px",borderRadius:2,cursor:"pointer",letterSpacing:".3px"}}>
          {page==="dashboard"?"← Home":"← Library"}
        </button>
      )}
    </nav>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({msg,onClose}){
  return(
    <div style={{position:"fixed",bottom:28,right:28,zIndex:9999,
      background:SURFACE,border:`1px solid ${BORDER}`,padding:"16px 20px",
      boxShadow:"0 8px 40px rgba(26,33,48,.15)",borderRadius:3,
      animation:"toastIn .3s ease both",minWidth:260}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:UP,marginTop:4,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:INK,letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Template Ready</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S}}>{msg}</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:INK_M,cursor:"pointer",fontSize:16,lineHeight:1,padding:0,marginTop:-2}}>×</button>
      </div>
    </div>
  );
}

// ── HOLD BAR ──────────────────────────────────────────────────────────────────
function HoldBar({onComplete,label="Access the report library",width=520,inverted=false}){
  const[pct,setPct]=useState(0),[holding,setHolding]=useState(false);
  const rafRef=useRef(0),startRef=useRef(0),holdDur=2000;
  const startHold=useCallback(()=>{
    setHolding(true);startRef.current=Date.now();
    const tick=()=>{
      const elapsed=Date.now()-startRef.current;
      const p=Math.min(elapsed/holdDur*100,100);
      setPct(p);
      if(p<100)rafRef.current=requestAnimationFrame(tick);
      else onComplete();
    };
    rafRef.current=requestAnimationFrame(tick);
  },[onComplete]);
  const stopHold=useCallback(()=>{
    setHolding(false);cancelAnimationFrame(rafRef.current);setPct(0);
  },[]);
  useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);

  const borderColor=inverted?"rgba(255,255,255,.35)":NAVY;
  const fillColor=inverted?SURFACE:NAVY;
  const textColor=inverted?SURFACE:INK;
  const textColorFill=inverted?NAVY:SURFACE;

  return(
    <div onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
      onTouchStart={startHold} onTouchEnd={stopHold}
      style={{position:"relative",width:"100%",maxWidth:width,height:48,
        background:inverted?"rgba(255,255,255,.08)":SURFACE,
        border:`1.5px solid ${borderColor}`,borderRadius:2,cursor:"pointer",
        overflow:"hidden",userSelect:"none",
        boxShadow:holding?"0 4px 20px rgba(27,51,86,.15)":"none",
        transition:"box-shadow .2s"}}>
      <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${pct}%`,
        background:fillColor,transition:holding?"none":"width .15s ease",zIndex:1}}/>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"space-between",padding:"0 18px",zIndex:2}}>
        <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
          letterSpacing:"2px",textTransform:"uppercase",color:textColor}}>{label}</span>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:textColor,opacity:.6}}>
          {pct>1?`${Math.round(pct)}%`:"PRESS & HOLD →"}
        </span>
      </div>
      {pct>0&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
          justifyContent:"space-between",padding:"0 18px",zIndex:3,
          clipPath:`inset(0 ${100-pct}% 0 0)`}}>
          <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
            letterSpacing:"2px",textTransform:"uppercase",color:textColorFill}}>{label}</span>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:textColorFill}}>
            {pct>1?`${Math.round(pct)}%`:"PRESS & HOLD →"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── HERO SECTION (S00) ────────────────────────────────────────────────────────
function HeroSection({onEnter}){
  const wide=useWide(900);
  const heroGuardrails=GUARDRAILS.slice(0,7);
  return(
    <section id="lp-s0" style={{background:BG,borderBottom:`1px solid ${BORDER}`,
      display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <div style={{maxWidth:1400,width:"100%",margin:"0 auto",
        padding:`0 clamp(24px,4vw,52px)`,
        display:"grid",gridTemplateColumns:wide?"1fr 1fr":"1fr",gap:wide?60:40,
        alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          <div data-morph style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:UP,animation:"dotPulse 2s ease-in-out infinite"}}/>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:GOLD,fontWeight:600,letterSpacing:"0.5px"}}>MER.ADV.MY · MAS-GUARD-001</span>
          </div>
          <h1 data-morph style={{fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(44px,5.2vw,72px)",fontWeight:700,lineHeight:.96,
            color:INK,margin:"0 0 24px",letterSpacing:"-1px"}}>
            Real Estate<br/>Advisory,<br/><span style={{color:NAVY}}>institutionalised</span>
            <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",
              background:GOLD,marginLeft:6,verticalAlign:"middle",transform:"translateY(-2px)"}}/>
          </h1>
          <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:INK_S,
            lineHeight:1.7,maxWidth:480,margin:"0 0 32px"}}>
            A structured consultancy framework for Malaysian real estate advisory. Seven report families, 22 guardrails, five compliance domains — built for institutional-grade outputs.
          </p>
          <div data-morph style={{marginBottom:10}}>
            <HoldBar onComplete={onEnter} label="Access the platform" width={460}/>
          </div>
          <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,margin:"8px 0 32px"}}>Press and hold to enter the platform</p>
          <div data-morph style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,
            borderTop:`1px solid ${BORDER}`,paddingTop:24}}>
            {[["07","Report Families"],["22","Guardrails"],["05","Domains"],["MY","Region"]].map(([v,l],i)=>(
              <div key={i} style={{padding:"0 16px 0 0",borderRight:i<3?`1px solid ${BORDER}`:"none",
                paddingRight:i<3?16:0,paddingLeft:i>0?16:0}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:INK,lineHeight:1}}>{v}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,textTransform:"uppercase",letterSpacing:"1.5px",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {wide&&(
          <div data-morph>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M}}>Guardrail Matrix — Excerpt</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:GOLD}}>MAS-GUARD-001</span>
            </div>
            <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
              boxShadow:"0 4px 20px rgba(26,33,48,.06)",overflow:"hidden"}}>
              {heroGuardrails.map((g,i)=>(
                <div key={g.code} style={{display:"flex",alignItems:"center",gap:12,
                  padding:"10px 16px",
                  background:i%2===0?"transparent":SURFACE_S,
                  borderBottom:i<heroGuardrails.length-1?`1px solid ${BORDER_L}`:"none"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:NAVY,minWidth:96,flexShrink:0}}>{g.code}</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:INK_S,flex:1}}>{g.title}</span>
                  <SevPill sev={g.sev}/>
                </div>
              ))}
              <div style={{padding:"12px 16px",borderTop:`1px solid ${BORDER_L}`,textAlign:"center"}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:GOLD,fontWeight:600}}>+ 15 more guardrails · Press SPACE to continue</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── REPORT SUITE SECTION (S01) ────────────────────────────────────────────────
function ReportSuiteSection(){
  return(
    <section style={{background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <SectionLabel num="S01" label="The Seven Report Families"/>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          The Seven Report Families
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:INK_S,margin:"0 0 28px",maxWidth:620,lineHeight:1.6}}>
          Every engagement is classified into one of seven MER report types. Each type carries a defined section structure, scope boundary, and guardrail checklist.
        </p>
        <div data-morph style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {MER_TYPES.map((t)=>(
            <div key={t.code} className="lp-card"
              style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,padding:"18px 22px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10.5,color:NAVY,
                  background:NAVY_DIM,border:"1px solid rgba(27,51,86,.15)",
                  padding:"3px 8px",borderRadius:2}}>{t.code}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,
                  border:`1px solid ${BORDER}`,padding:"3px 8px",borderRadius:2}}>{t.tag}</span>
              </div>
              <div className="lp-num" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,
                fontWeight:700,color:INK,margin:"8px 0 4px",transition:"color .2s"}}>{t.type}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:INK_M,marginBottom:10}}>{t.pages} pages</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8].map(n=>{
                  const inc=t.sections.includes(n);
                  return(
                    <div key={n} style={{width:24,height:24,display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:9.5,fontWeight:600,borderRadius:2,
                      border:`1px solid ${inc?"rgba(168,121,40,.3)":BORDER_L}`,
                      background:inc?GOLD_DIM:"transparent",
                      color:inc?GOLD_B:INK_F}}>§{n}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GUARDRAIL SECTION (S02) ───────────────────────────────────────────────────
function GuardrailSection(){
  const domainCounts={};
  GUARDRAILS.forEach(g=>{domainCounts[g.domain]=(domainCounts[g.domain]||0)+1;});
  return(
    <section style={{background:BG,borderBottom:`1px solid ${BORDER}`,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <SectionLabel num="S02" label="Guardrail Matrix"/>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          22 Guardrails Across 5 Domains
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:INK_S,margin:"0 0 20px",maxWidth:620,lineHeight:1.6}}>
          Each advisory engagement is assessed against a structured compliance matrix. Guardrails are categorised by domain and severity to ensure consistent, defensible outputs.
        </p>
        <div data-morph style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
          {Object.entries(DC).map(([domain,c])=>(
            <span key={domain} style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,
              padding:"5px 12px",borderRadius:2,background:c.bg,border:`1px solid ${c.bd}`,color:c.tx}}>
              {domain} ({domainCounts[domain]||0})
            </span>
          ))}
        </div>
        <div data-morph style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          boxShadow:"0 2px 16px rgba(26,33,48,.05)",overflow:"hidden"}}>
          {GUARDRAILS.map((g,i)=>{
            const dc=DC[g.domain]||{};
            return(
              <div key={g.code} className="gr-row"
                style={{display:"flex",alignItems:"center",gap:14,padding:"11px 18px",
                  background:i%2===0?"transparent":SURFACE_S,
                  borderBottom:i<GUARDRAILS.length-1?`1px solid ${BORDER_L}`:"none"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:NAVY,minWidth:100,flexShrink:0}}>{g.code}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,
                  padding:"3px 9px",borderRadius:2,background:dc.bg,border:`1px solid ${dc.bd}`,color:dc.tx,
                  whiteSpace:"nowrap",minWidth:80,textAlign:"center"}}>{g.domain}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S,flex:1}}>{g.title}</span>
                <SevPill sev={g.sev}/>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── METHODOLOGY SECTION (S03) ─────────────────────────────────────────────────
function MethodologySection(){
  const aiTable=[
    {task:"Market Data Aggregation",     ai:true, hr:true,  hl:false},
    {task:"Comparable Transaction Search",ai:true,hr:true,  hl:false},
    {task:"Financial Model Construction", ai:false,hr:true,  hl:true},
    {task:"HBU Test Conclusions",         ai:false,hr:false, hl:true},
    {task:"Risk Register Scoring",        ai:false,hr:true,  hl:true},
    {task:"Executive Summary Drafting",   ai:true, hr:true,  hl:false},
    {task:"Regulatory Compliance Review", ai:false,hr:false, hl:true},
    {task:"Final Sign-Off",              ai:false,hr:false, hl:true},
  ];
  return(
    <section style={{background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <SectionLabel num="S03" label="Report Structure"/>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Eight-Section Report Framework
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:INK_S,margin:"0 0 28px",maxWidth:620,lineHeight:1.6}}>
          All MER advisory reports follow a standardised eight-section structure. Conditional sections are included based on report type classification.
        </p>
        <div data-morph style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12,marginBottom:32}}>
          {REPORT_SECTIONS.map(s=>(
            <div key={s.n} style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
              padding:"16px 20px",boxShadow:"0 2px 12px rgba(26,33,48,.05)",
              display:"flex",gap:14,alignItems:"flex-start"}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:GOLD,
                opacity:.35,fontWeight:700,lineHeight:1,flexShrink:0,marginTop:2}}>§{s.n}</span>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,color:INK}}>{s.title}</span>
                  {s.cond&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:600,
                    color:AMBER,background:"rgba(154,107,24,.06)",border:`1px solid rgba(154,107,24,.2)`,
                    padding:"2px 6px",borderRadius:2,letterSpacing:"0.5px"}}>COND</span>}
                </div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_M,margin:0,lineHeight:1.6}}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div data-morph>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,textTransform:"uppercase",
            letterSpacing:"2px",marginBottom:12}}>AI Role Boundaries</div>
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
            boxShadow:"0 2px 12px rgba(26,33,48,.05)",overflow:"hidden"}}>
            {aiTable.map((row,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr repeat(3,90px)",
                padding:"10px 18px",borderBottom:i<aiTable.length-1?`1px solid ${BORDER_L}`:"none",
                background:i%2===0?"transparent":SURFACE_S,alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:INK_S}}>{row.task}</span>
                <span style={{textAlign:"center",fontSize:13}}>{row.ai?"✓":"—"}</span>
                <span style={{textAlign:"center",fontSize:13}}>{row.hr?"✓":"—"}</span>
                <span style={{textAlign:"center",fontSize:13}}>{row.hl?"✓":"—"}</span>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr repeat(3,90px)",
              padding:"8px 18px",borderTop:`1px solid ${BORDER}`,background:SURFACE_S,gap:10}}>
              <span/>
              {["AI may lead","Human review","Human leads"].map(l=>(
                <span key={l} style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:INK_M,
                  textTransform:"uppercase",letterSpacing:"0.5px",textAlign:"center"}}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── DEPLOY SECTION (S04) ──────────────────────────────────────────────────────
function DeploySection({onEnter}){
  const stats=[
    {v:"07",l:"Report Families"},
    {v:"22",l:"Guardrails"},
    {v:"05",l:"Domains"},
    {v:"12",l:"Compliance Checks"},
    {v:"MY",l:"Jurisdiction"},
  ];
  return(
    <section style={{background:NAVY_SECTION,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:GOLD,fontWeight:700,letterSpacing:"1.5px"}}>S04</span>
          <span style={{width:20,height:1,background:GOLD,opacity:.6,display:"inline-block"}}/>
          <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.55)",fontWeight:600,letterSpacing:"2.5px",textTransform:"uppercase"}}>DEPLOY</span>
        </div>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",
          fontSize:"clamp(40px,5vw,68px)",fontWeight:700,color:"#fff",
          margin:"0 0 20px",lineHeight:1.05,letterSpacing:"-1px"}}>
          The advisory library<br/>is ready.
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:15,
          color:"rgba(255,255,255,.7)",margin:"0 0 36px",maxWidth:520,lineHeight:1.7}}>
          Access the complete report template library, guardrail compliance tools, and risk scoring engine. Structured for institutional-grade consultancy engagements.
        </p>
        <div data-morph style={{marginBottom:8}}>
          <HoldBar onComplete={onEnter} label="Enter the library" width={460} inverted/>
        </div>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.4)",margin:"8px 0 40px"}}>Press and hold to access the platform</p>
        <div data-morph style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {stats.map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",
              borderRadius:3,padding:"18px 24px",minWidth:100}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,
                color:GOLD_B,lineHeight:1,marginBottom:6}}>{s.v}</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,.55)",
                textTransform:"uppercase",letterSpacing:"1.5px"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
function LandingPage({onEnter,scrollRef,active}){
  const[sIdx,setSIdx]=useState(0);
  const morphing=useRef(false);
  const totalSections=LP_SECTIONS.length;

  const morphTo=useCallback((newIdx)=>{
    if(morphing.current||!scrollRef.current)return;
    const container=scrollRef.current;
    const allSections=Array.from(container.querySelectorAll(".lp-fit > section"));
    if(!allSections[newIdx])return;
    const oldSection=allSections[sIdx];
    const newSection=allSections[newIdx];
    const dir=newIdx>sIdx?1:-1;
    const oldBlocks=getMorphBlocks(oldSection);
    const newBlocks=getMorphBlocks(newSection);
    morphing.current=true;
    // Scatter out current
    oldBlocks.forEach((el,i)=>{
      el.style.willChange="transform,opacity";
      el.style.transition=`transform ${SCATTER_DUR}ms ease,opacity ${SCATTER_DUR}ms ease`;
      el.style.transitionDelay=`${i*18}ms`;
      el.style.opacity="0";
      el.style.transform=`translateY(${dir>0?-10:10}px)`;
    });
    setTimeout(()=>{
      if(newSection.scrollIntoView)newSection.scrollIntoView({behavior:"smooth",block:"start"});
      setSIdx(newIdx);
      oldBlocks.forEach(el=>clearMorph(el));
      newBlocks.forEach(el=>{
        el.style.opacity="0";
        el.style.transform=`translateY(${dir<0?-10:10}px)`;
        el.style.willChange="transform,opacity";
      });
      setTimeout(()=>{
        newBlocks.forEach((el,i)=>{
          el.style.transition=`transform ${ASSEMBLE_DUR}ms ease,opacity ${ASSEMBLE_DUR}ms ease`;
          el.style.transitionDelay=`${i*28}ms`;
          el.style.opacity="1";
          el.style.transform="";
        });
        setTimeout(()=>{
          newBlocks.forEach(el=>clearMorph(el));
          morphing.current=false;
        },ASSEMBLE_DUR+newBlocks.length*28+100);
      },SCROLL_DUR);
    },SCATTER_DUR+oldBlocks.length*18+40);
  },[sIdx,scrollRef]);

  useEffect(()=>{
    if(!active)return;
    const handler=(e)=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      if(e.code==="Space"){
        e.preventDefault();
        if(e.shiftKey)morphTo(Math.max(0,sIdx-1));
        else morphTo(Math.min(totalSections-1,sIdx+1));
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[active,sIdx,morphTo,totalSections]);

  return(
    <div className="lp-fit" ref={scrollRef}
      style={{position:"relative",overflowY:"scroll",scrollSnapType:"y mandatory"}}>
      <HeroSection onEnter={onEnter}/>
      <ReportSuiteSection/>
      <GuardrailSection/>
      <MethodologySection/>
      <DeploySection onEnter={onEnter}/>
      {active&&(
        <div style={{position:"fixed",bottom:24,left:"50%",zIndex:200,
          animation:"hintFloat 2.8s ease-in-out infinite",pointerEvents:"none"}}>
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,
            padding:"8px 16px",borderRadius:20,
            boxShadow:"0 4px 16px rgba(26,33,48,.09)"}}>
            <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_S,letterSpacing:"0.2px"}}>
              SPACE — next section · ⇧ SPACE — previous
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── REPORT CARD ───────────────────────────────────────────────────────────────
function ReportCard({t,onDL,downloading,idx}){
  const[ref,vis]=useInView(.08);
  return(
    <div ref={ref} className="mer-card"
      style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:4,
        overflow:"hidden",opacity:vis?1:0,
        transform:vis?"translateY(0)":"translateY(18px)",
        transition:`opacity .5s ease ${idx*60}ms, transform .5s ease ${idx*60}ms, box-shadow .25s, transform .25s`}}>
      <div style={{height:2,background:GOLD}}/>
      <div style={{background:NAVY_DIM,padding:"18px 24px 14px",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10.5,color:NAVY,
            background:NAVY_DIM,border:"1px solid rgba(27,51,86,.15)",padding:"3px 8px",borderRadius:2}}>{t.code}</span>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:INK_M}}>{t.pages} pp.</span>
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,
          color:INK,lineHeight:1.15,marginBottom:5}}>{t.type}</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M}}>{t.tag}</div>
      </div>
      <div style={{padding:"16px 24px"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
          {[1,2,3,4,5,6,7,8].map(n=>{
            const inc=t.sections.includes(n);
            return(
              <div key={n} style={{width:24,height:24,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:9.5,fontWeight:600,borderRadius:2,
                border:`1px solid ${inc?"rgba(168,121,40,.3)":BORDER_L}`,
                background:inc?GOLD_DIM:"transparent",
                color:inc?GOLD_B:INK_F}}>§{n}</div>
            );
          })}
        </div>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S,
          lineHeight:1.6,margin:"0 0 16px"}}>{t.desc}</p>
        <button onClick={()=>onDL(t)} className="btn-primary"
          style={{width:"100%",background:NAVY,color:"#fff",border:"none",
            padding:"11px 0",borderRadius:2,fontFamily:"'Inter',sans-serif",
            fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",
            cursor:"pointer"}}>
          {downloading===t.code?"Preparing...":"Download Template"}
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({onTool}){
  const[toast,setToast]=useState(null),[dlg,setDlg]=useState(null);
  const dl=(t)=>{
    setDlg(t.code);
    setTimeout(()=>{setDlg(null);setToast(`${t.code} template ready for download`);},1200);
  };
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{background:SURFACE,borderBottom:`1px solid ${BORDER}`,padding:"22px 32px",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:GOLD,
            textTransform:"uppercase",letterSpacing:"2px",marginBottom:6}}>MERIDIAN · REPORT LIBRARY</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,
            color:INK,margin:"0 0 4px",lineHeight:1.1}}>Report Template Library</h1>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S,margin:0}}>
            Seven MER advisory report families — MAS-GUARD-001 compliant
          </p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onTool("checker")} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"9px 16px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
            Guardrail Checker
          </button>
          <button onClick={()=>onTool("risk")} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"9px 16px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
            Risk Scorer
          </button>
        </div>
      </div>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"36px 32px",
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:18}}>
        {MER_TYPES.map((t,i)=>(
          <ReportCard key={t.code} t={t} onDL={dl} downloading={dlg} idx={i}/>
        ))}
      </div>
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ── GUARDRAIL CHECKER ─────────────────────────────────────────────────────────
function GuardrailChecker(){
  const[checked,setChecked]=useState({}),[ref_code,setRef]=useState("");
  const toggle=i=>setChecked(c=>({...c,[i]:!c[i]}));
  const done=Object.values(checked).filter(Boolean).length;
  const allDone=done===G_CHECKS.length;
  const pct=Math.round(done/G_CHECKS.length*100);
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"48px 32px"}}>
        <SectionLabel num="TOOL" label="Guardrail Compliance Checker"/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Compliance Verification
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:INK_S,margin:"0 0 28px",lineHeight:1.6,maxWidth:560}}>
          Work through the 12-point compliance checklist before finalising any MER advisory report. Items marked HUMAN REQ. require explicit advisor sign-off.
        </p>
        <div style={{marginBottom:24}}>
          <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,
            color:INK_M,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>
            Engagement Reference
          </label>
          <input value={ref_code} onChange={e=>setRef(e.target.value)}
            placeholder="e.g. MER-2025-001"
            style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,
              background:SURFACE,border:`1px solid ${BORDER}`,color:INK,
              borderRadius:2,padding:"11px 14px",width:"100%",maxWidth:340,
              boxSizing:"border-box",transition:"border-color .15s"}}/>
        </div>
        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          padding:"16px 20px",marginBottom:24,display:"flex",
          alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,
              textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>Compliance Score</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:allDone?UP:INK}}>
              {done}/{G_CHECKS.length} — {pct}%
            </div>
          </div>
          <div style={{flex:1,minWidth:200,maxWidth:320}}>
            <div style={{height:4,background:BORDER_L,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,
                background:allDone?UP:NAVY,borderRadius:2,
                transition:"width .3s ease"}}/>
            </div>
          </div>
        </div>
        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,overflow:"hidden",marginBottom:24}}>
          {G_CHECKS.map((text,i)=>{
            const isChecked=!!checked[i];
            const needsHuman=G_HUMAN.includes(i);
            return(
              <div key={i} onClick={()=>toggle(i)}
                style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 18px",
                  borderBottom:i<G_CHECKS.length-1?`1px solid ${BORDER_L}`:"none",
                  background:isChecked?"rgba(39,103,73,.03)":"transparent",
                  cursor:"pointer",transition:"background .15s"}}
                onMouseEnter={e=>{if(!isChecked)e.currentTarget.style.background=GOLD_DIM;}}
                onMouseLeave={e=>{e.currentTarget.style.background=isChecked?"rgba(39,103,73,.03)":"transparent";}}>
                <div style={{width:18,height:18,border:`1.5px solid ${isChecked?NAVY:BORDER}`,
                  borderRadius:3,background:isChecked?NAVY:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,marginTop:2,transition:"all .15s"}}>
                  {isChecked&&<span style={{color:"#fff",fontSize:11,lineHeight:1,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,
                    color:isChecked?INK_M:INK,
                    textDecoration:isChecked?"line-through":"none",
                    lineHeight:1.5}}>{text}</span>
                  {needsHuman&&(
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:600,
                      color:AMBER,background:"rgba(154,107,24,.06)",
                      border:`1px solid rgba(154,107,24,.2)`,
                      padding:"2px 6px",borderRadius:2,marginLeft:10,
                      letterSpacing:"0.5px"}}>HUMAN REQ.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {allDone&&(
          <div style={{border:`1px solid rgba(39,103,73,.3)`,background:"rgba(39,103,73,.05)",
            borderRadius:3,padding:"16px 20px",marginBottom:20,
            fontFamily:"'Inter',sans-serif",fontSize:13.5,color:UP,lineHeight:1.5}}>
            All {G_CHECKS.length} compliance checks verified. This report meets MAS-GUARD-001 requirements.
            {ref_code&&<span style={{fontFamily:"'IBM Plex Mono',monospace",marginLeft:8,fontSize:12}}>Ref: {ref_code}</span>}
          </div>
        )}
        <button onClick={()=>{setChecked({});setRef("");}} className="btn-outline"
          style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
            border:`1px solid ${BORDER}`,background:"transparent",
            padding:"10px 20px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
          Reset Checklist
        </button>
      </div>
    </div>
  );
}

// ── RISK SCORER ───────────────────────────────────────────────────────────────
function RiskScorer(){
  const[risks,setRisks]=useState([
    {id:1,name:"Planning approval delay",l:3,i:4},
    {id:2,name:"Market absorption slower than forecast",l:4,i:3},
    {id:3,name:"Construction cost overrun",l:3,i:5},
    {id:4,name:"Interest rate increase",l:2,i:4},
    {id:5,name:"Regulatory change (Act 242)",l:2,i:5},
  ]);
  const[input,setInput]=useState(""),nextId=useRef(10);
  const addRisk=()=>{
    if(!input.trim())return;
    setRisks(r=>[...r,{id:nextId.current++,name:input.trim(),l:3,i:3}]);
    setInput("");
  };
  const updateRisk=(id,field,delta)=>{
    setRisks(r=>r.map(x=>x.id===id?{...x,[field]:Math.max(1,Math.min(5,x[field]+delta))}:x));
  };
  const delRisk=(id)=>setRisks(r=>r.filter(x=>x.id!==id));
  const getSev=(score)=>score>=15?"Critical":score>=9?"High":score>=4?"Medium":"Low";
  const getSevColor=(score)=>score>=15?DOWN:score>=9?GOLD:score>=4?AMBER:UP;
  const g05ok=risks.length>=5;
  const Stepper=({val,onMinus,onPlus})=>(
    <div style={{display:"flex",alignItems:"center",gap:0,border:`1px solid ${BORDER}`,borderRadius:2,overflow:"hidden"}}>
      <button onClick={onMinus} style={{width:28,height:32,background:"transparent",
        border:"none",cursor:"pointer",color:INK_S,fontSize:14,fontWeight:600,
        borderRight:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,
        color:NAVY,width:24,textAlign:"center"}}>{val}</span>
      <button onClick={onPlus} style={{width:28,height:32,background:"transparent",
        border:"none",cursor:"pointer",color:INK_S,fontSize:14,fontWeight:600,
        borderLeft:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"48px 32px"}}>
        <SectionLabel num="TOOL" label="Risk Register Builder"/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Risk Register
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:INK_S,margin:"0 0 28px",lineHeight:1.6,maxWidth:560}}>
          Build and score your engagement risk register. G-05 requires a minimum of 5 risks, each scored Likelihood × Impact (1–5 scale).
        </p>
        <div style={{display:"flex",gap:10,marginBottom:28,maxWidth:560}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")addRisk();}}
            placeholder="Describe a new risk factor..."
            style={{flex:1,fontFamily:"'Inter',sans-serif",fontSize:13,
              background:SURFACE,border:`1px solid ${BORDER}`,color:INK,
              borderRadius:2,padding:"11px 14px",boxSizing:"border-box",
              transition:"border-color .15s"}}/>
          <button onClick={addRisk} className="btn-primary"
            style={{background:NAVY,color:"#fff",border:"none",
              padding:"11px 20px",borderRadius:2,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
              letterSpacing:"1px",textTransform:"uppercase",whiteSpace:"nowrap"}}>
            + Add
          </button>
        </div>
        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          overflow:"hidden",marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 80px 80px 32px",
            padding:"10px 18px",background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,gap:10}}>
            {["Risk Factor","Likelihood (1–5)","Impact (1–5)","Score","Severity",""].map((h,i)=>(
              <span key={i} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,
                color:INK_M,textTransform:"uppercase",letterSpacing:"0.5px",
                textAlign:i>0?"center":"left"}}>{h}</span>
            ))}
          </div>
          {risks.length===0&&(
            <div style={{padding:"32px 18px",textAlign:"center",
              fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_F}}>
              No risks added yet. Add at least 5 to meet G-05.
            </div>
          )}
          {risks.map((r,i)=>{
            const score=r.l*r.i;
            const sev=getSev(score);
            const col=getSevColor(score);
            return(
              <div key={r.id}
                style={{display:"grid",gridTemplateColumns:"1fr 110px 110px 80px 80px 32px",
                  padding:"12px 18px",
                  borderBottom:i<risks.length-1?`1px solid ${BORDER_L}`:"none",
                  background:i%2===0?"transparent":SURFACE_S,
                  alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK}}>{r.name}</span>
                <div style={{display:"flex",justifyContent:"center"}}>
                  <Stepper val={r.l} onMinus={()=>updateRisk(r.id,"l",-1)} onPlus={()=>updateRisk(r.id,"l",1)}/>
                </div>
                <div style={{display:"flex",justifyContent:"center"}}>
                  <Stepper val={r.i} onMinus={()=>updateRisk(r.id,"i",-1)} onPlus={()=>updateRisk(r.id,"i",1)}/>
                </div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:col}}>{score}</span>
                </div>
                <div style={{textAlign:"center"}}>
                  <SevPill sev={sev}/>
                </div>
                <button onClick={()=>delRisk(r.id)}
                  style={{background:"none",border:"none",color:INK_F,cursor:"pointer",
                    fontSize:16,lineHeight:1,padding:0,
                    display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            );
          })}
        </div>
        <div style={{border:`1px solid ${g05ok?"rgba(39,103,73,.3)":"rgba(154,107,24,.2)"}`,
          background:g05ok?"rgba(39,103,73,.05)":"rgba(154,107,24,.05)",
          borderRadius:3,padding:"14px 18px",marginBottom:20,
          display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:6,height:6,borderRadius:"50%",
            background:g05ok?UP:AMBER,flexShrink:0}}/>
          <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:g05ok?UP:AMBER}}>
            G-05 Compliance: {risks.length}/{5} risks registered
            {g05ok?" — requirement met":" — minimum 5 required"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App(){
  const[booted,setBooted]=useState(false);
  const[page,setPage]=useState("landing");
  const scrollRef=useRef(null);

  const enterApp=useCallback(()=>{
    setPage("dashboard");
  },[]);

  const goHome=useCallback(()=>{
    setPage("landing");
  },[]);

  const goTool=useCallback((tool)=>{
    setPage(tool);
  },[]);

  const onBack=useCallback(()=>{
    if(page==="dashboard")goHome();
    else setPage("dashboard");
  },[page,goHome]);

  return(
    <>
      <style>{CSS}</style>
      {!booted&&<Boot onDone={()=>setBooted(true)}/>}
      {booted&&(
        <>
          <Nav page={page} onBack={onBack}/>
          {page==="landing"&&(
            <div style={{paddingTop:60,height:"100vh",overflow:"hidden",boxSizing:"border-box"}}>
              <LandingPage onEnter={enterApp} scrollRef={scrollRef} active={page==="landing"}/>
            </div>
          )}
          {page==="dashboard"&&<Dashboard onTool={goTool}/>}
          {page==="checker"&&<GuardrailChecker/>}
          {page==="risk"&&<RiskScorer/>}
        </>
      )}
    </>
  );
}
