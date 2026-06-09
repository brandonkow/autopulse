import React, { useState, useEffect } from 'react';
import { CSS as PB_CSS } from './Playbook.jsx';

// Part III reuses the Playbook (.pb) design system as its fundamental structure,
// with a few additions for guardrail cards, the disclaimer/engagement doc blocks,
// bullet lists, and the AI-role matrix.
const EXTRA = `
  .pb .pb-header.std::after { content: 'STANDARD'; }

  .pb .b-list { list-style: none; max-width: 760px; margin: 14px 0; }
  .pb .b-list li { font-size: 13px; color: var(--mid); line-height: 1.85; padding-left: 22px; position: relative; }
  .pb .b-list li::before { content: '—'; position: absolute; left: 0; color: var(--amber); }
  .pb .b-list strong { color: var(--pb-ink); font-weight: 700; }
  .pb .b-list.num { counter-reset: hbu; }
  .pb .b-list.num li::before { content: counter(hbu); counter-increment: hbu; color: var(--amber); font-family: 'IBM Plex Mono', monospace; font-size: 11px; top: 3px; }

  .pb .doc-block {
    background: var(--blue-ink);
    color: rgba(255,255,255,0.82);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    line-height: 1.9;
    padding: 28px 32px;
    white-space: pre-wrap;
    max-width: 760px;
    margin: 24px 0;
    border-left: 3px solid var(--amber);
  }
  .pb .db-label {
    display: block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 14px;
  }

  .pb .struct-head { display: flex; gap: 16px; align-items: baseline; margin: 40px 0 10px; max-width: 760px; }
  .pb .struct-num { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--amber); letter-spacing: 0.1em; flex-shrink: 0; padding-top: 2px; }
  .pb .struct-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--pb-ink); line-height: 1.2; }
  .pb .struct-cond { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--light-mid); margin-left: 10px; }

  .pb .domain-head {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--forest);
    margin: 52px 0 4px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--rule);
    max-width: 760px;
  }
  .pb .domain-head:first-of-type { margin-top: 8px; }

  .pb .gr { max-width: 760px; margin: 20px 0; padding: 24px 28px; background: #fff; border: 1px solid var(--rule); border-left: 3px solid var(--amber); }
  .pb .pb-section:nth-child(even) .gr { background: var(--paper); }
  .pb .gr-head { display: flex; gap: 14px; align-items: baseline; margin-bottom: 14px; flex-wrap: wrap; }
  .pb .gr-code { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--amber); background: var(--amber-pale); padding: 3px 9px; flex-shrink: 0; }
  .pb .gr-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--pb-ink); }
  .pb .gr p { font-size: 13px; color: var(--mid); line-height: 1.8; margin-bottom: 10px; }
  .pb .gr p:last-child { margin-bottom: 0; }
  .pb .gr p strong { color: var(--pb-ink); }
  .pb .gr .b-list { margin: 8px 0; }

  .pb .yes { color: #2D5C45; font-weight: 700; }
  .pb .dash { color: rgba(0,0,0,0.18); }
  .pb .risk-table td.center, .pb .risk-table th.center { text-align: center; }
  .pb .risk-table.wide { max-width: 860px; }
`;

const toc = [
  { group: 'The Standard', items: [['01', 'Scope & Distinction', 'g1'], ['02', 'Report Types', 'g2'], ['03', 'Report Structure', 'g3']] },
  { group: 'Standards & Sign-Off', items: [['04', 'Writing Standards', 'g4'], ['05', 'Disclaimer Block', 'g5'], ['06', 'Guardrail Checklist', 'g6']] },
  { group: 'Governance', items: [['07', 'AI Role Boundaries', 'g7'], ['08', 'The Guardrails', 'g8'], ['09', 'Severity Matrix', 'g9']] },
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

const Struct = ({ num, title, cond, children }) => (
  <>
    <div className="struct-head">
      <span className="struct-num">{num}</span>
      <span className="struct-title">{title}{cond && <span className="struct-cond">Conditional</span>}</span>
    </div>
    {children}
  </>
);

const GR = ({ code, title, children }) => (
  <div className="gr">
    <div className="gr-head"><span className="gr-code">{code}</span><span className="gr-title">{title}</span></div>
    {children}
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

const Y = () => <span className="yes">✓</span>;
const D = () => <span className="dash">—</span>;

const reportTypes = [
  ['MER-MKT', 'Market Entry / Market Study', '15–30 pp', '1, 2, 3, 4, 5, 6, 8'],
  ['MER-HBU', 'Highest & Best Use Advisory', '10–20 pp', '1, 2, 3, 4, 5, 7, 8'],
  ['MER-DEV', 'Development Feasibility Opinion', '20–40 pp', '1, 2, 3, 4, 5, 6, 7, 8'],
  ['MER-INV', 'Investment Advisory Memo', '8–15 pp', '1, 2, 4, 5, 6, 8'],
  ['MER-POS', 'Asset Repositioning Strategy', '12–25 pp', '1, 2, 3, 5, 7, 8'],
  ['MER-PORT', 'Portfolio Advisory', '20–50 pp', '1, 2, 4, 5, 6, 8'],
  ['MER-SITE', 'Site Selection Assessment', '10–20 pp', '1, 2, 3, 4, 5, 8'],
];

const scopeRows = [
  ['Output', 'Certified opinion of value', 'Advisory opinion / recommendation'],
  ['Standards body', 'RICS Red Book / Appraisal Foundation', 'Internal Meridian Advisory Standards (MAS)'],
  ['Signatory liability', 'Licensed appraiser (MRICS/MAI)', 'Lead consultant (named, credentialed)'],
  ['Audience', 'Lenders, courts, regulators', 'Investors, developers, C-suite, boards'],
  ['Permitted caveats', 'Limited (USPAP SR 2-1)', 'Broader — must still be explicit'],
  ['AI role', 'Decision-support only', 'Decision-support only'],
];

const aiRoles = [
  ['Market data aggregation', true, true, false],
  ['Comparable transaction search', true, true, false],
  ['Financial model population', true, true, false],
  ['Sensitivity analysis', true, true, false],
  ['Draft narrative production', true, true, false],
  ['Regulatory & zoning interpretation', false, false, true],
  ['Site visit & physical condition', false, false, true],
  ['Stakeholder interview', false, false, true],
  ['Competitive intelligence (soft)', false, true, false],
  ['HBU legal permissibility', false, false, true],
  ['Risk Register weighting', false, true, false],
  ['Final sign-off', false, false, true],
];

const matrix = [
  ['G-SCOPE-01', 'Scope', 'Critical', 'No'],
  ['G-SCOPE-02', 'Scope', 'High', 'With MD approval'],
  ['G-SCOPE-03', 'Scope', 'High', 'No'],
  ['G-EVID-01', 'Evidence', 'Critical', 'No'],
  ['G-EVID-02', 'Evidence', 'High', 'With LC approval'],
  ['G-EVID-03', 'Evidence', 'Critical', 'No'],
  ['G-EVID-04', 'Evidence', 'High', 'No'],
  ['G-EVID-05', 'Evidence', 'Medium', 'With disclosure'],
  ['G-AI-01', 'AI Use', 'Critical', 'No'],
  ['G-AI-02', 'AI Use', 'Critical', 'No'],
  ['G-AI-03', 'AI Use', 'High', 'No'],
  ['G-AI-04', 'AI Use', 'Medium', 'With disclosure'],
  ['G-AI-05', 'AI Use', 'Critical', 'No'],
  ['G-DISC-01', 'Disclosure', 'Critical', 'No'],
  ['G-DISC-02', 'Disclosure', 'High', 'With LC approval'],
  ['G-DISC-03', 'Disclosure', 'High', 'No (Malaysia)'],
  ['G-DISC-04', 'Disclosure', 'Medium', 'No (from 2025)'],
  ['G-PROC-01', 'Process', 'Critical', 'No'],
  ['G-PROC-02', 'Process', 'Medium', 'No'],
  ['G-PROC-03', 'Process', 'High', 'No'],
  ['G-PROC-04', 'Process', 'Medium', 'With LC approval'],
  ['G-PROC-05', 'Process', 'High', 'No'],
];
const sevPill = { Critical: 'pill-high', High: 'pill-med', Medium: 'pill-low' };

const ENGAGEMENT_HEADER = `Client:             [Name]
Engagement Ref:     MER-[TYPE]-[YEAR]-[SEQ]
Property / Subject: [Address / Asset Description]
Date of Report:     [DD Month YYYY]
Prepared by:        [Lead Consultant Name, Credentials]
Reviewed by:        [Senior Advisor Name, Credentials]
Classification:     CONFIDENTIAL — Client Use Only`;

const DISCLAIMER = `This report has been prepared by Meridian RE Advisory ("Meridian") solely for the use of [Client Name] ("the Client") in connection with [Engagement Reference]. It is provided as a consultancy opinion and does not constitute a certified valuation under RICS Valuation – Global Standards (Red Book) or USPAP, nor does it constitute legal, tax, or financial advice.

Meridian has relied on information provided by the Client, publicly available data, and proprietary data sources believed to be reliable. No independent verification of third-party data has been undertaken unless explicitly stated. Meridian accepts no responsibility for losses arising from reliance on unverified information.

AI-assisted tools were used in the preparation of this report for data aggregation, scenario modelling, and draft narrative production. All AI-assisted outputs have been reviewed, validated, and accepted by the named consultant(s) below. The professional opinions expressed are those of the named consultants and not of any AI system.

Forward-looking statements, projections, and scenarios are inherently uncertain. Actual outcomes may differ materially from those presented. This report should not be reproduced, distributed, or used for any purpose other than that stated above without Meridian's prior written consent.

Lead Consultant:        [Name], [Credentials]
Date of Sign-Off:       [DD Month YYYY]
Meridian File Reference: [MER-TYPE-YEAR-SEQ]`;

export default function Standards({ onNavigate }) {
  useEffect(() => {
    const ids = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9'];
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
      <style>{PB_CSS}</style>
      <style>{EXTRA}</style>
      <div id="prog" />

      {/* SIDEBAR TOC */}
      <nav className="toc">
        <div className="toc-logo">
          <div className="toc-logo-main">Meridian RE<br />Advisory Standard</div>
          <div className="toc-logo-sub">MAS-GUARD-001 · v1.0</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 18 }}>
            <button className="toc-back" style={{ marginTop: 0 }} onClick={() => onNavigate('framework')}>← Part I — The Framework</button>
            <button className="toc-back" style={{ marginTop: 0 }} onClick={() => onNavigate('playbook')}>← Part II — The Playbook</button>
          </div>
        </div>
        {toc.map((grp) => (
          <React.Fragment key={grp.group}>
            <div className="toc-section-head">{grp.group}</div>
            {grp.items.map(([num, label, id], i) => (
              <a
                key={id}
                className={'toc-item' + (grp.group === 'The Standard' && i === 0 ? ' active' : '')}
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
        <div className="pb-header std">
          <div className="pb-header-tag">Part III — Operating Standard · Report Generation Skill</div>
          <h1>The Meridian RE <em>Consultancy Report</em> Standard</h1>
          <p>This standard governs production of professional real estate consultancy reports on the Meridian RE Advisory Platform. It ensures every output is analytically rigorous, evidence-based, compliant with the embedded guardrails, clearly scoped as a consultancy opinion — not a certified valuation — and appropriately caveated and signed off.</p>
          <div className="pb-meta">
            <div className="pb-meta-item">
              <div className="pb-meta-label">Document</div>
              <div className="pb-meta-val">MAS-GUARD-001</div>
            </div>
            <div className="pb-meta-item">
              <div className="pb-meta-label">Version</div>
              <div className="pb-meta-val">1.0</div>
            </div>
            <div className="pb-meta-item">
              <div className="pb-meta-label">Effective</div>
              <div className="pb-meta-val">June 2026</div>
            </div>
          </div>
        </div>

        {/* SECTION 1 — SCOPE & DISTINCTION */}
        <div className="pb-section" id="g1">
          <SectionHeader num="01" sup="The Standard" title="Scope & Distinction from Valuation Reports" />
          <div className="pb-body">
            <p>This skill produces a <strong>consultancy opinion</strong>, not a certified value opinion. It must still meet professional advisory standards and comply with the embedded guardrails. The table below sets out the distinction that governs every engagement.</p>
          </div>
          <table className="risk-table">
            <thead>
              <tr><th>Dimension</th><th>Valuation Report (RICS/USPAP)</th><th>Consultancy Report (this skill)</th></tr>
            </thead>
            <tbody>
              {scopeRows.map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="callout">
            <div className="callout-label">Critical Rule — G-SCOPE-01</div>
            <p>Never allow the report to be misread as a certified valuation. Always include the mandatory disclaimer block (Section 05), and never use "Market Value", "Open Market Value", "Assessed Value", or "Appraised Value" as a conclusion.</p>
          </div>
        </div>

        {/* SECTION 2 — REPORT TYPES */}
        <div className="pb-section" id="g2">
          <SectionHeader num="02" sup="The Standard" title="Report Types Supported" />
          <div className="pb-body">
            <p>Seven report types are supported. Each maps to a defined section set; sections marked conditional in Section 03 are included only where the report type requires them.</p>
          </div>
          <table className="risk-table wide">
            <thead>
              <tr><th>Code</th><th>Report Type</th><th>Typical Length</th><th>Sections</th></tr>
            </thead>
            <tbody>
              {reportTypes.map((r) => (
                <tr key={r[0]}>
                  <td><span className="gr-code">{r[0]}</span></td>
                  <td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 3 — REPORT STRUCTURE */}
        <div className="pb-section" id="g3">
          <SectionHeader num="03" sup="The Standard" title="Mandatory Report Structure" />
          <div className="pb-body">
            <p>Every consultancy report must contain these sections in order. Conditional sections are required only for the applicable report types listed in Section 02.</p>
          </div>

          <Struct num="S1" title="Engagement Header">
            <div className="doc-block"><span className="db-label">Section 1 — Engagement Header</span>{ENGAGEMENT_HEADER}</div>
          </Struct>

          <Struct num="S2" title="Executive Summary">
            <ul className="b-list">
              <li>Purpose of engagement (2–3 sentences)</li>
              <li>Key findings (3–5 bullet points, each ≤ 25 words)</li>
              <li>Primary recommendation (1 clear sentence)</li>
              <li>Decision-maker caveats (1–2 sentences)</li>
            </ul>
            <div className="callout">
              <div className="callout-label">Guardrail</div>
              <p>The Executive Summary must not pre-empt the body; findings must be supportable by evidence in Sections 3–7.</p>
            </div>
          </Struct>

          <Struct num="S3" title="Market Analysis" cond>
            <ul className="b-list">
              <li><strong>3.1</strong> Primary Market Area Definition (geographic, demographic, economic delineation)</li>
              <li><strong>3.2</strong> Supply Analysis (existing stock, pipeline, competitive inventory)</li>
              <li><strong>3.3</strong> Demand Analysis (absorption, occupancy trends, demographic drivers)</li>
              <li><strong>3.4</strong> Competitive Landscape (direct comparables, market positioning)</li>
              <li><strong>3.5</strong> Macro & Regulatory Environment (interest rates, planning policy, ESG mandates)</li>
            </ul>
            <div className="callout-dark">
              <div className="callout-label">AI Limitation Flag</div>
              <p>AI can populate 3.1–3.3 from structured data feeds. Subsections 3.4 (competitive intelligence) and 3.5 (regulatory environment) must be reviewed and supplemented by a human consultant with local market knowledge.</p>
            </div>
          </Struct>

          <Struct num="S4" title="Financial Analysis" cond>
            <ul className="b-list">
              <li><strong>4.1</strong> Revenue / Income Projections</li>
              <li><strong>4.2</strong> Cost Build-Up (hard costs, soft costs, financing)</li>
              <li><strong>4.3</strong> Returns Analysis (NPV, IRR, equity multiple, payback)</li>
              <li><strong>4.4</strong> Sensitivity / Scenario Analysis (bear / base / bull)</li>
              <li><strong>4.5</strong> Key Assumptions Register (numbered, each assumption explicitly stated)</li>
            </ul>
            <div className="callout">
              <div className="callout-label">Guardrail</div>
              <p>All financial projections must carry forward-looking statement language. Cap rate, discount rate, and growth rate assumptions must be explicitly disclosed and sourced.</p>
            </div>
          </Struct>

          <Struct num="S5" title="Findings & Recommendation">
            <ul className="b-list">
              <li><strong>5.1</strong> Summary of Evidence</li>
              <li><strong>5.2</strong> Risk Register (minimum 5 risks; each scored Likelihood × Impact on a 1–5 scale)</li>
              <li><strong>5.3</strong> Strategic Recommendation (Go / No-Go / Conditional Go with conditions listed)</li>
              <li><strong>5.4</strong> Alternative Scenarios Considered</li>
            </ul>
          </Struct>

          <Struct num="S6" title="Implementation Roadmap" cond>
            <ul className="b-list">
              <li>Phasing plan with milestones</li>
              <li>Key dependencies and critical path</li>
              <li>Stakeholder map</li>
              <li>KPIs and success metrics</li>
            </ul>
          </Struct>

          <Struct num="S7" title="Highest & Best Use Determination" cond>
            <div className="pb-body"><p>Must address all four HBU tests:</p></div>
            <ul className="b-list num">
              <li>Legally permissible (zoning, permits, restrictions)</li>
              <li>Physically possible (site constraints, access, utilities)</li>
              <li>Financially feasible (returns threshold)</li>
              <li>Maximally productive (optimal use among feasible options)</li>
            </ul>
            <div className="callout-dark">
              <div className="callout-label">AI Limitation Flag</div>
              <p>Legal permissibility and physical possibility assessments require review by a licensed planner/solicitor and a qualified surveyor respectively. AI output is indicative only.</p>
            </div>
          </Struct>

          <Struct num="S8" title="Disclaimers, Limitations & Sign-Off">
            <div className="pb-body"><p>Uses the mandatory disclaimer block set out in Section 05 of this standard.</p></div>
          </Struct>
        </div>

        {/* SECTION 4 — WRITING STANDARDS */}
        <div className="pb-section" id="g4">
          <SectionHeader num="04" sup="Standards & Sign-Off" title="Writing Standards" />

          <div className="struct-head"><span className="struct-num">A</span><span className="struct-title">Tone & Register</span></div>
          <ul className="b-list">
            <li>Professional advisory register: confident, direct, client-oriented</li>
            <li>Avoid hedging language that undermines the advice (e.g., "it could potentially be possible")</li>
            <li>Use active voice for recommendations; passive for descriptions of market conditions</li>
            <li>No marketing language or superlatives ("premier", "exceptional", "best-in-class")</li>
          </ul>

          <div className="struct-head"><span className="struct-num">B</span><span className="struct-title">Evidence Standards</span></div>
          <ul className="b-list">
            <li>Every quantitative claim must cite a source (database, survey, transaction record)</li>
            <li>Every forward-looking projection must be labelled as such</li>
            <li>All comparable transactions must include: address (or reference), date, size, price/rate, and source</li>
            <li>Expert interviews and site visits must be logged with date and counterparty (anonymised if agreed)</li>
          </ul>

          <div className="struct-head"><span className="struct-num">C</span><span className="struct-title">Tables & Data</span></div>
          <ul className="b-list">
            <li>All financial tables must show units, currency, and base date</li>
            <li>Sensitivity tables must use a consistent shock size (±50–100bps for rates; ±5–10% for rents/costs)</li>
            <li>Maps and site plans must include north arrow, scale, and legend</li>
          </ul>

          <div className="callout-dark">
            <div className="callout-label">Prohibited Language</div>
            <p>Never state or imply a certified market value (use "opinion of value" or "indicative value range" only, if at all). Never represent AI-generated content as independent market research without human validation. Never omit material risks or present a one-sided case. Never include client-sensitive financial data in the Executive Summary without authorisation.</p>
          </div>
        </div>

        {/* SECTION 5 — DISCLAIMER BLOCK */}
        <div className="pb-section" id="g5">
          <SectionHeader num="05" sup="Standards & Sign-Off" title="Mandatory Disclaimer Block" />
          <div className="pb-body">
            <p>This block is the Section 8 template for every report. It is non-negotiable and must be present and fully populated before release.</p>
          </div>
          <div className="doc-block"><span className="db-label">Section 8 — Disclaimer & Limitations</span>{DISCLAIMER}</div>
        </div>

        {/* SECTION 6 — GUARDRAIL CHECKLIST */}
        <div className="pb-section" id="g6">
          <SectionHeader num="06" sup="Standards & Sign-Off" title="Guardrail Enforcement Checklist" />
          <div className="pb-body">
            <p>Before finalising any report output, verify all of the following.</p>
          </div>
          <div className="checklist">
            <div className="check-group">
              <div className="check-group-title">Pre-Release Verification</div>
              <Check><strong>G-01</strong> &nbsp;Report type code assigned and section structure matches the table in Section 02</Check>
              <Check><strong>G-02</strong> &nbsp;Executive Summary findings are each traceable to a body section</Check>
              <Check><strong>G-03</strong> &nbsp;All quantitative claims are sourced</Check>
              <Check><strong>G-04</strong> &nbsp;AI limitation flags reviewed by human consultant for Sections 3.4, 3.5, 7.1, 7.2</Check>
              <Check><strong>G-05</strong> &nbsp;Risk Register contains ≥ 5 risks with Likelihood × Impact scores</Check>
              <Check><strong>G-06</strong> &nbsp;Mandatory Disclaimer Block (Section 8) present and populated</Check>
              <Check><strong>G-07</strong> &nbsp;No certified value language used</Check>
              <Check><strong>G-08</strong> &nbsp;Financial projections carry forward-looking statement language</Check>
              <Check><strong>G-09</strong> &nbsp;Key Assumptions Register numbered and complete</Check>
              <Check><strong>G-10</strong> &nbsp;Report classified CONFIDENTIAL with correct client name and engagement ref</Check>
              <Check><strong>G-11</strong> &nbsp;Reviewed-by field populated (cannot be the same person as Lead Consultant)</Check>
              <Check><strong>G-12</strong> &nbsp;AI disclosure statement included in Section 8</Check>
            </div>
          </div>
        </div>

        {/* SECTION 7 — AI ROLE BOUNDARIES */}
        <div className="pb-section" id="g7">
          <SectionHeader num="07" sup="Governance" title="AI Role Boundaries" />
          <div className="pb-body">
            <p>AI is decision-support only. The matrix below defines where AI may lead, where human review is mandatory, and where a human must lead the work outright.</p>
          </div>
          <table className="risk-table wide">
            <thead>
              <tr><th>Task</th><th className="center">AI may lead</th><th className="center">Human must review</th><th className="center">Human must lead</th></tr>
            </thead>
            <tbody>
              {aiRoles.map(([task, a, b, c]) => (
                <tr key={task}>
                  <td>{task}</td>
                  <td className="center">{a ? <Y /> : <D />}</td>
                  <td className="center">{b ? <Y /> : <D />}</td>
                  <td className="center">{c ? <Y /> : <D />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 8 — THE GUARDRAILS */}
        <div className="pb-section" id="g8">
          <SectionHeader num="08" sup="Governance" title="The Guardrails (MAS-GUARD-001)" />
          <div className="pb-body">
            <p>These guardrails govern every report. They exist because real estate consulting reports directly influence multi-million-dollar capital allocation decisions — errors in structure, evidence, or professional scope can cause client financial harm, reputational damage, and legal liability. They are grouped into five domains.</p>
          </div>

          <div className="domain-head">Domain 1 — Scope</div>
          <GR code="G-SCOPE-01" title="Consultancy vs. Certified Valuation">
            <p><strong>Rule:</strong> A consultancy report must never be presented as, or reasonably mistaken for, a certified valuation under RICS Red Book Global Standards (effective 31 January 2025), USPAP (2024–25 edition), or any equivalent national standard.</p>
            <p><strong>Why it matters:</strong> RICS Red Book PS 1 and Appraisal Foundation Advisory Opinion 41 (April 2026) both require certified valuations to be signed by a licensed/registered valuer who takes personal professional liability. Conflating the two exposes the client to reliance risk and Meridian to misrepresentation claims.</p>
            <p><strong>Enforcement:</strong></p>
            <ul className="b-list">
              <li>Never use "Market Value", "Open Market Value", "Assessed Value", or "Appraised Value" as the conclusion of a consultancy report</li>
              <li>Permitted: "indicative value range", "opinion of likely value", "estimated market-facing price", "benchmark comparison"</li>
              <li>Any report citing a specific value must carry: "This figure is an indicative estimate for advisory purposes and is not a certified opinion of market value."</li>
            </ul>
          </GR>
          <GR code="G-SCOPE-02" title="Engagement Scope Creep">
            <p><strong>Rule:</strong> The report must not address questions materially outside the agreed engagement scope without documented client authorisation.</p>
            <p><strong>Enforcement:</strong> The Engagement Header (Section 1) must match the signed Terms of Engagement. If the client request has expanded during production, flag to the Lead Consultant before including additional analysis.</p>
          </GR>
          <GR code="G-SCOPE-03" title="Asset Class Competence">
            <p><strong>Rule:</strong> Flag when the subject asset class requires specialist knowledge not embedded in the standard workflow — data centres, hospitals and healthcare facilities, hotels and serviced residences, student accommodation, maritime assets, agricultural land, mining-affected land, and heritage/listed buildings.</p>
            <p><strong>Enforcement:</strong> For specialist assets, Section 3 must include: "Note: this report has been prepared with input from [specialist name / firm] who has provided [specific expertise]. The general consultant has not independently verified specialist assessments."</p>
          </GR>

          <div className="domain-head">Domain 2 — Evidence</div>
          <GR code="G-EVID-01" title="Source Attribution">
            <p><strong>Rule:</strong> Every quantitative claim — market size, vacancy rate, absorption, transaction price, yield, cap rate, construction cost — must be attributed to a named source with date.</p>
            <p><strong>Tier 1 sources:</strong> CoStar, MSCI/IPD, Knight Frank, CBRE, JLL, Cushman & Wakefield, Savills Research, official government statistics (JPPH, HM Land Registry, ABS, Statistics Canada, US Census Bureau, BLS, BEA), RICS market surveys, Altus Group, Green Street Advisors.</p>
            <p><strong>Tier 2 (cross-check with Tier 1):</strong> Broker opinions, developer pipeline databases, newspaper reports, industry association surveys, secondary research aggregators.</p>
            <p><strong>Not acceptable:</strong> AI-generated market summaries without an underlying cited source, unattributed "market consensus", verbal representations not logged as expert interviews.</p>
          </GR>
          <GR code="G-EVID-02" title="Transaction Comparables">
            <p><strong>Rule:</strong> All comparable transactions must be presented in a standardised table with property reference, transaction date (MM/YYYY), area (state NLA/GFA), transacted price or rent, calculated metric (psf/psm, yield, cap rate), source and date accessed, and a comparability rating (High / Medium / Low) with a brief note.</p>
            <p><strong>Minimum comparable sets:</strong></p>
            <ul className="b-list">
              <li>Residential: 5 comparables within 12 months, same or adjacent suburb</li>
              <li>Commercial office/retail: 4 comparables within 24 months, same grade</li>
              <li>Industrial/logistics: 4 comparables within 18 months, same corridor</li>
              <li>Land/development: 3 comparables within 36 months with land-use alignment</li>
            </ul>
          </GR>
          <GR code="G-EVID-03" title="Forward-Looking Statements">
            <p><strong>Rule:</strong> All projections, forecasts, and scenario outputs must be clearly labelled forward-looking and include the base date, time horizon, key assumptions (by reference to the Assumptions Register), and a statement that actual outcomes may differ materially.</p>
            <p><strong>Standard language:</strong> "The following projections are forward-looking statements based on assumptions set out in the Key Assumptions Register (Section 4.5). They represent the consultant's professional opinion of likely outcomes under stated conditions and are not guarantees of future performance."</p>
          </GR>
          <GR code="G-EVID-04" title="Site Visit Requirement">
            <p><strong>Rule:</strong> Any report with a Section 7 (HBU) or Section 6 (Implementation Roadmap) referencing physical site characteristics must document whether a site visit was conducted.</p>
            <p><strong>If conducted:</strong> Log date, attendees, and observations in an appendix. <strong>If not conducted:</strong> Include the caveat — "No physical inspection of the subject site was undertaken. Physical condition, access, and infrastructure assessments are based on desktop review only and may not reflect actual site conditions. A physical inspection is recommended before any capital commitment."</p>
          </GR>
          <GR code="G-EVID-05" title="Data Currency">
            <p><strong>Rule:</strong> Market data used in analysis must not be more than 6 months old for vacancy/rental/transaction data, 12 months old for supply pipeline data, or 24 months old for demographic and macro-economic data.</p>
            <p><strong>Exceptions:</strong> Where more recent data is unavailable, clearly flag the data vintage and its potential impact on conclusions.</p>
          </GR>

          <div className="domain-head">Domain 3 — AI Use</div>
          <GR code="G-AI-01" title="AI Disclosure (Non-Negotiable)">
            <p><strong>Rule:</strong> Every report produced with AI assistance must include the AI disclosure statement in Section 8. This cannot be waived by the client or any senior staff.</p>
            <p><strong>Rationale:</strong> RICS Red Book 2025 requires AI-assisted valuations to be "subject to the additional application of professional judgment by a valuer." Appraisal Foundation AO-41 (April 2026) likewise requires appraisers who use AI to "understand that the output is credible" and not simply rely on it. Meridian adopts this standard by policy for all reports.</p>
          </GR>
          <GR code="G-AI-02" title="AI Limitation Zones">
            <p><strong>Rule:</strong> The following must never be presented as AI-generated output without explicit human review and override authority:</p>
            <ul className="b-list">
              <li>Regulatory and zoning interpretation — licensed planner or solicitor review</li>
              <li>Environmental risk assessment — Phase I/II ESA specialist review</li>
              <li>Physical site condition — qualified surveyor or engineer sign-off</li>
              <li>Stakeholder / political risk — local market specialist confirmation</li>
              <li>HBU legal permissibility — planning/legal counsel review</li>
              <li>Competition intelligence (soft data) — market specialist confirmation</li>
              <li>Risk Register final scores — Lead Consultant review and override</li>
            </ul>
            <p><strong>Enforcement:</strong> The Guardrail Checklist items G-04 and G-07 must be completed before release.</p>
          </GR>
          <GR code="G-AI-03" title="No Black-Box Outputs">
            <p><strong>Rule:</strong> Where AI tools generate financial projections or market estimates, the consultant must be able to explain the key drivers and assumptions. A consultant may not include an AI-generated number they cannot explain.</p>
            <p><strong>Rationale:</strong> The CFPB has stated there is "no black box exemption" from fair lending and consumer protection laws. Meridian extends this: no black-box exemption from professional advisory responsibility.</p>
          </GR>
          <GR code="G-AI-04" title="Historical Bias Alert">
            <p><strong>Rule:</strong> When AI models are used for forecasting or comparable selection, consultants must consider whether training data reflects pre-pandemic conditions that may not hold, geographically biased datasets (most commercial AI is US/UK-centric), or asset-class gaps (data centres, life science, emerging-market assets have thin AI training data).</p>
            <p><strong>Required disclosure when risk identified:</strong> "AI-assisted analysis for this section was calibrated against [data period/geography]. The consultant has reviewed outputs for potential historical bias and adjusted where material deviations from current market conditions were identified."</p>
          </GR>
          <GR code="G-AI-05" title="No AI Value Opinions">
            <p><strong>Rule:</strong> AI tools must not be used to generate a standalone value opinion (even indicative) without human consultant review. The consultant must document their review and sign off.</p>
          </GR>

          <div className="domain-head">Domain 4 — Disclosure</div>
          <GR code="G-DISC-01" title="Conflict of Interest">
            <p><strong>Rule:</strong> The report must disclose any material conflict of interest, including Meridian or any named consultant holding an interest in the subject property, Meridian acting for another party in the same transaction, or fee arrangements contingent on the outcome of the consultancy.</p>
            <p><strong>If none:</strong> State explicitly — "Meridian confirms it has no material conflict of interest in relation to this engagement."</p>
          </GR>
          <GR code="G-DISC-02" title="Reliance Limitation">
            <p><strong>Rule:</strong> The report must state who may rely on it: "This report has been prepared for the sole use of [Client Name]. No third party may rely on its contents without Meridian's express written consent. Meridian accepts no duty of care to any third party."</p>
            <p><strong>Exception:</strong> Where the client has indicated the report will be shared with lenders or co-investors, extend reliance to named parties with appropriate caveats.</p>
          </GR>
          <GR code="G-DISC-03" title="Regulatory Compliance (Malaysia-Specific)">
            <p><strong>Rule:</strong> Reports on Malaysian real estate must note compliance with the Valuers, Appraisers, Estate Agents and Property Managers Act 1981 (Act 242); BOVEAP guidelines; relevant state land laws (e.g., Melaka Land Ordinance, NLC 1965); and JPPH data usage terms.</p>
            <p><strong>Note:</strong> Consultancy reports in Malaysia do not require a registered valuer's signature unless used for statutory purposes (compulsory acquisition, tax, court proceedings). Flag to the client if the intended use may trigger this requirement.</p>
          </GR>
          <GR code="G-DISC-04" title="ESG and Climate Risk">
            <p><strong>Rule:</strong> From 2025, all development feasibility and investment advisory reports must include a brief ESG and Climate Risk section noting:</p>
            <ul className="b-list">
              <li>Flood / climate hazard exposure (source: JUPEM / national hazard maps)</li>
              <li>Energy efficiency profile / Green Building Index (GBI) or LEED status where applicable</li>
              <li>Applicable green financing or incentive eligibility</li>
            </ul>
          </GR>

          <div className="domain-head">Domain 5 — Process</div>
          <GR code="G-PROC-01" title="Dual Sign-Off">
            <p><strong>Rule:</strong> No report may be released without a Lead Consultant and a separate Reviewing Advisor (not the same person). The Reviewing Advisor must document that they have independently checked: Section 2 findings trace to body sections; the Section 4 financial model is internally consistent; the Section 5 Risk Register is complete; and the Section 8 Disclaimer is present and correctly populated.</p>
          </GR>
          <GR code="G-PROC-02" title="Version Control">
            <p><strong>Rule:</strong> All reports must carry a version number. Draft versions must be watermarked "DRAFT — NOT FOR RELIANCE." Final versions must be clearly marked "FINAL" with date.</p>
          </GR>
          <GR code="G-PROC-03" title="Retention">
            <p><strong>Rule:</strong> Completed reports and all underlying workings (data files, model inputs, AI prompts and outputs used) must be retained for a minimum of 7 years in the Meridian document management system.</p>
          </GR>
          <GR code="G-PROC-04" title="Client Instruction Changes">
            <p><strong>Rule:</strong> If client instructions change materially after production has commenced, a Change Order must be documented before scope is expanded. AI-generated analysis produced under superseded instructions must be clearly marked and not carried forward.</p>
          </GR>
          <GR code="G-PROC-05" title="Escalation Triggers">
            <p><strong>Rule:</strong> The Lead Consultant must escalate to the Managing Director before release if:</p>
            <ul className="b-list">
              <li>The subject property is involved in active litigation</li>
              <li>The client is a politically exposed person (PEP)</li>
              <li>The engagement involves compulsory acquisition or government land</li>
              <li>Any party to the transaction raises sanctions screening concerns</li>
              <li>The report's conclusions are materially adverse to the client's stated interest (risk of pressure to alter professional opinion)</li>
            </ul>
          </GR>
        </div>

        {/* SECTION 9 — SEVERITY MATRIX */}
        <div className="pb-section" id="g9">
          <SectionHeader num="09" sup="Governance" title="Guardrail Summary Matrix" />
          <div className="pb-body">
            <p>Severity and waiver authority for every guardrail. <strong>LC</strong> = Lead Consultant; <strong>MD</strong> = Managing Director.</p>
          </div>
          <table className="risk-table wide">
            <thead>
              <tr><th>Code</th><th>Domain</th><th>Severity</th><th>Waivable?</th></tr>
            </thead>
            <tbody>
              {matrix.map((r) => (
                <tr key={r[0]}>
                  <td><span className="gr-code">{r[0]}</span></td>
                  <td>{r[1]}</td>
                  <td><span className={'pill ' + sevPill[r[2]]}>{r[2]}</span></td>
                  <td>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="pb-footer">
          <div className="pb-footer-left">"A consultancy opinion, not a certified valuation — rigorous, evidenced, and accountable to a named consultant."</div>
          <div className="pb-footer-right">
            Meridian RE Advisory · Standards & Quality Committee<br />
            MAS-GUARD-001 · Version 1.0 · Effective June 2026<br />
            Next review: June 2027 or upon material regulatory change<br />
            Internal Operating Standard · Not For Client Distribution
          </div>
        </div>

      </div>
    </div>
  );
}
