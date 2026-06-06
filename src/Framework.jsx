import React, { useState, useEffect, useRef } from 'react';

const CSS = `
  :root {
    --ink: #0D0D0D;
    --cream: #F7F3EC;
    --gold: #C4963A;
    --gold-light: #E8C97A;
    --rust: #8B3A2A;
    --slate: #2C3E50;
    --mist: #E8E2D9;
    --accent-green: #2D4A3E;
    --line: rgba(196,150,58,0.25);
  }

  .fw *, .fw *::before, .fw *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  .fw {
    background: var(--cream);
    color: var(--ink);
    font-family: 'Instrument Sans', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }

  /* CUSTOM CURSOR */
  .fw .cursor {
    width: 8px; height: 8px;
    background: var(--gold);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.15s ease;
  }
  .fw .cursor-ring {
    width: 32px; height: 32px;
    border: 1px solid var(--gold);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9998;
    transition: all 0.35s ease;
    opacity: 0.6;
  }

  /* SCROLLBAR */
  .fw ::-webkit-scrollbar { width: 3px; }
  .fw ::-webkit-scrollbar-track { background: var(--mist); }
  .fw ::-webkit-scrollbar-thumb { background: var(--gold); }

  /* NOISE TEXTURE OVERLAY */
  .fw::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9000;
    opacity: 0.3;
  }

  /* PROGRESS BAR */
  .fw #progress-bar {
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--gold-light));
    z-index: 8000;
    transition: width 0.1s;
    width: 0%;
  }

  /* SIDE NAV */
  .fw .side-nav {
    position: fixed;
    right: 32px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .fw .nav-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--gold);
    opacity: 0.3;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
  }
  .fw .nav-dot::after {
    content: attr(data-label);
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    color: var(--gold);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
    text-transform: uppercase;
  }
  .fw .nav-dot:hover { opacity: 1; transform: scale(1.5); }
  .fw .nav-dot:hover::after { opacity: 1; }
  .fw .nav-dot.active { opacity: 1; background: var(--gold); box-shadow: 0 0 8px var(--gold); }

  /* HERO */
  .fw .hero {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 80px;
    position: relative;
    background: var(--ink);
    overflow: hidden;
  }
  .fw .hero-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 30%, #1a2a1a 0%, #0D0D0D 60%);
  }
  .fw .hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(196,150,58,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(196,150,58,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .fw .hero-accent {
    position: absolute;
    top: 0; right: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(135deg, rgba(196,150,58,0.08) 0%, transparent 60%);
    clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);
  }
  .fw .hero-tag {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 32px;
    opacity: 0;
    animation: fwFadeUp 0.8s ease 0.3s forwards;
  }
  .fw .hero h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 7vw, 96px);
    font-weight: 300;
    color: var(--cream);
    line-height: 1.0;
    letter-spacing: -0.02em;
    opacity: 0;
    animation: fwFadeUp 0.9s ease 0.5s forwards;
  }
  .fw .hero h1 em {
    font-style: italic;
    color: var(--gold);
  }
  .fw .hero-sub {
    margin-top: 32px;
    max-width: 520px;
    font-size: 13px;
    line-height: 1.8;
    color: rgba(247,243,236,0.5);
    opacity: 0;
    animation: fwFadeUp 0.9s ease 0.7s forwards;
  }
  .fw .hero-line {
    position: absolute;
    bottom: 0; left: 80px;
    width: 1px;
    height: 80px;
    background: linear-gradient(to bottom, var(--gold), transparent);
    opacity: 0;
    animation: fwFadeIn 1s ease 1.2s forwards;
  }
  .fw .scroll-hint {
    position: absolute;
    bottom: 32px;
    left: 80px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(196,150,58,0.5);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    animation: fwFadeIn 1s ease 1.5s forwards;
  }
  .fw .scroll-hint::before {
    content: '';
    display: block;
    width: 24px;
    height: 1px;
    background: var(--gold);
    opacity: 0.5;
  }

  /* SECTIONS */
  .fw section {
    padding: 120px 80px;
    position: relative;
  }

  .fw .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 48px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .fw .section-label::before {
    content: '';
    display: block;
    width: 32px;
    height: 1px;
    background: var(--gold);
  }

  .fw h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 4.5vw, 60px);
    font-weight: 300;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .fw h3 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(24px, 2.5vw, 34px);
    font-weight: 400;
    letter-spacing: -0.01em;
  }

  /* PHILOSOPHY SECTION */
  .fw .philosophy {
    background: var(--cream);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
  }
  .fw .philosophy-left { position: relative; }
  .fw .philosophy-quote {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(20px, 2vw, 28px);
    font-style: italic;
    font-weight: 300;
    line-height: 1.5;
    color: var(--slate);
    border-left: 2px solid var(--gold);
    padding-left: 32px;
    margin: 40px 0;
  }
  .fw .compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    margin-top: 40px;
  }
  .fw .compare-card {
    padding: 32px;
    position: relative;
    overflow: hidden;
  }
  .fw .compare-card.compliance {
    background: var(--mist);
  }
  .fw .compare-card.needs {
    background: var(--ink);
    color: var(--cream);
  }
  .fw .compare-card .tag {
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  .fw .compare-card.needs .tag { color: var(--gold-light); opacity: 1; }
  .fw .compare-card h4 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    margin-bottom: 16px;
  }
  .fw .compare-card.needs h4 { color: var(--gold); }
  .fw .compare-list {
    list-style: none;
    font-size: 12px;
    line-height: 2;
    opacity: 0.7;
  }
  .fw .compare-list li::before {
    content: '— ';
    opacity: 0.4;
  }
  .fw .compare-card.needs .compare-list { color: var(--cream); opacity: 0.8; }
  .fw .compare-card.needs .compare-list li::before { color: var(--gold); opacity: 1; }

  /* REPORT STRUCTURE */
  .fw .structure-section {
    background: var(--ink);
    color: var(--cream);
  }
  .fw .structure-section .section-label { color: var(--gold); }
  .fw .structure-section h2 { color: var(--cream); }

  .fw .chapters {
    margin-top: 64px;
    display: grid;
    gap: 2px;
  }
  .fw .chapter {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    align-items: start;
    gap: 32px;
    padding: 32px 0;
    border-top: 1px solid rgba(196,150,58,0.15);
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
  }
  .fw .chapter::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 1px;
    background: var(--gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s ease;
  }
  .fw .chapter:hover::after { transform: scaleX(1); }
  .fw .chapter-num {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    color: var(--gold);
    padding-top: 4px;
  }
  .fw .chapter-content { flex: 1; }
  .fw .chapter-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(20px, 2vw, 28px);
    font-weight: 400;
    color: var(--cream);
    margin-bottom: 12px;
    transition: color 0.3s;
  }
  .fw .chapter:hover .chapter-title { color: var(--gold); }
  .fw .chapter-desc {
    font-size: 12px;
    line-height: 1.8;
    color: rgba(247,243,236,0.45);
    max-width: 600px;
  }
  .fw .chapter-sub {
    margin-top: 12px;
    display: none;
    flex-direction: column;
    gap: 6px;
  }
  .fw .chapter-sub.open { display: flex; }
  .fw .sub-item {
    font-size: 11px;
    color: rgba(196,150,58,0.7);
    padding-left: 16px;
    border-left: 1px solid rgba(196,150,58,0.2);
    line-height: 1.6;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.05em;
  }
  .fw .chapter-toggle {
    font-family: 'DM Mono', monospace;
    font-size: 18px;
    color: var(--gold);
    opacity: 0.4;
    transition: all 0.3s;
    padding-top: 2px;
    width: 24px;
    text-align: center;
  }
  .fw .chapter:hover .chapter-toggle { opacity: 1; }
  .fw .chapter.open .chapter-toggle { transform: rotate(45deg); opacity: 1; }

  /* INTERACTIVE FEATURES */
  .fw .features-section {
    background: var(--cream);
  }
  .fw .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    margin-top: 64px;
  }
  .fw .feature-card {
    background: var(--mist);
    padding: 48px 40px;
    position: relative;
    overflow: hidden;
    transition: all 0.4s;
    cursor: default;
  }
  .fw .feature-card::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 100%;
    height: 3px;
    background: var(--gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s ease;
  }
  .fw .feature-card:hover { background: var(--ink); }
  .fw .feature-card:hover::before { transform: scaleX(1); }
  .fw .feature-card:hover .feature-title { color: var(--gold); }
  .fw .feature-card:hover .feature-desc { color: rgba(247,243,236,0.6); }
  .fw .feature-card:hover .feature-icon { color: var(--gold); }
  .fw .feature-icon {
    font-size: 28px;
    margin-bottom: 24px;
    display: block;
    transition: color 0.4s;
  }
  .fw .feature-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    margin-bottom: 16px;
    transition: color 0.4s;
  }
  .fw .feature-desc {
    font-size: 12px;
    line-height: 1.9;
    color: var(--slate);
    transition: color 0.4s;
  }
  .fw .feature-tag {
    margin-top: 24px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--gold);
    text-transform: uppercase;
    opacity: 0.6;
  }

  /* DELIVERY FORMAT */
  .fw .delivery-section {
    background: var(--accent-green);
    color: var(--cream);
  }
  .fw .delivery-section .section-label { color: var(--gold-light); }
  .fw .delivery-section h2 { color: var(--cream); }
  .fw .delivery-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
    margin-top: 64px;
  }
  .fw .delivery-card {
    background: rgba(247,243,236,0.05);
    padding: 40px 32px;
    border-top: 1px solid rgba(196,150,58,0.2);
    transition: background 0.3s;
  }
  .fw .delivery-card:hover { background: rgba(247,243,236,0.1); }
  .fw .delivery-num {
    font-family: 'DM Mono', monospace;
    font-size: 48px;
    font-weight: 300;
    color: var(--gold);
    opacity: 0.3;
    line-height: 1;
    margin-bottom: 20px;
  }
  .fw .delivery-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    color: var(--cream);
    margin-bottom: 12px;
  }
  .fw .delivery-desc {
    font-size: 11px;
    line-height: 1.9;
    color: rgba(247,243,236,0.5);
  }

  /* PRICING STRATEGY */
  .fw .pricing-section {
    background: var(--cream);
  }
  .fw .pricing-cards {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1fr;
    gap: 2px;
    margin-top: 64px;
    align-items: start;
  }
  .fw .pricing-card {
    padding: 48px 40px;
    background: var(--mist);
    position: relative;
  }
  .fw .pricing-card.featured {
    background: var(--ink);
    color: var(--cream);
    padding: 64px 40px;
  }
  .fw .pricing-card.featured .pricing-tier { color: var(--gold); }
  .fw .pricing-card.featured .pricing-desc { color: rgba(247,243,236,0.5); }
  .fw .pricing-card.featured .pricing-list li { color: rgba(247,243,236,0.7); }
  .fw .pricing-tier {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.3em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .fw .pricing-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 300;
    margin-bottom: 8px;
  }
  .fw .pricing-desc {
    font-size: 12px;
    color: var(--slate);
    margin-bottom: 32px;
    line-height: 1.7;
  }
  .fw .pricing-list {
    list-style: none;
    font-size: 12px;
    line-height: 2.2;
  }
  .fw .pricing-list li { color: var(--slate); }
  .fw .pricing-list li::before { content: '✓ '; color: var(--gold); font-weight: 600; }
  .fw .featured-badge {
    position: absolute;
    top: -1px; left: 50%;
    transform: translateX(-50%);
    background: var(--gold);
    color: var(--ink);
    font-family: 'DM Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 6px 20px;
  }

  /* DIFFERENTIATORS */
  .fw .diff-section {
    background: var(--mist);
    padding: 120px 80px;
  }
  .fw .diff-table {
    width: 100%;
    margin-top: 64px;
    border-collapse: collapse;
  }
  .fw .diff-table th {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    padding: 16px 24px;
    text-align: left;
    border-bottom: 1px solid var(--gold);
    background: var(--ink);
  }
  .fw .diff-table th:first-child { color: rgba(196,150,58,0.5); }
  .fw .diff-table td {
    padding: 20px 24px;
    font-size: 12px;
    line-height: 1.6;
    border-bottom: 1px solid rgba(196,150,58,0.1);
    vertical-align: top;
  }
  .fw .diff-table tr:hover td { background: rgba(196,150,58,0.04); }
  .fw .diff-table td:first-child {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    font-weight: 400;
    color: var(--slate);
    width: 25%;
  }
  .fw .diff-ext { color: #8B0000; opacity: 0.7; }
  .fw .diff-you { color: var(--accent-green); font-weight: 500; }
  .fw .badge-ext, .fw .badge-you {
    display: inline-block;
    padding: 2px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    border-radius: 0;
  }
  .fw .badge-ext { background: rgba(139,0,0,0.08); color: #8B0000; }
  .fw .badge-you { background: rgba(45,74,62,0.12); color: var(--accent-green); }

  /* CTA */
  .fw .cta-section {
    background: var(--ink);
    color: var(--cream);
    text-align: center;
    padding: 160px 80px;
    position: relative;
    overflow: hidden;
  }
  .fw .cta-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(196,150,58,0.08) 0%, transparent 70%);
  }
  .fw .cta-section h2 {
    color: var(--cream);
    max-width: 800px;
    margin: 0 auto 32px;
  }
  .fw .cta-section h2 em { color: var(--gold); }
  .fw .cta-section p {
    max-width: 500px;
    margin: 0 auto 56px;
    font-size: 13px;
    line-height: 1.8;
    color: rgba(247,243,236,0.5);
  }
  .fw .btn-primary {
    display: inline-block;
    padding: 18px 48px;
    background: var(--gold);
    color: var(--ink);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    text-decoration: none;
    transition: all 0.3s;
    cursor: pointer;
    border: none;
  }
  .fw .btn-primary:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(196,150,58,0.3);
  }
  .fw .btn-outline {
    display: inline-block;
    padding: 18px 48px;
    border: 1px solid rgba(196,150,58,0.3);
    color: var(--gold);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    text-decoration: none;
    transition: all 0.3s;
    margin-left: 16px;
    cursor: pointer;
    background: none;
  }
  .fw .btn-outline:hover { border-color: var(--gold); background: rgba(196,150,58,0.05); }

  /* ANIMATIONS */
  @keyframes fwFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fwFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .fw .reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .fw .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .fw .reveal-delay-1 { transition-delay: 0.1s; }
  .fw .reveal-delay-2 { transition-delay: 0.2s; }
  .fw .reveal-delay-3 { transition-delay: 0.3s; }
  .fw .reveal-delay-4 { transition-delay: 0.4s; }
  .fw .reveal-delay-5 { transition-delay: 0.5s; }
  .fw .reveal-delay-6 { transition-delay: 0.6s; }

  /* REPORT METER */
  .fw .meter-section {
    padding: 80px;
    background: var(--cream);
    border-top: 1px solid var(--line);
  }
  .fw .meter-row {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 20px;
  }
  .fw .meter-label {
    width: 180px;
    font-size: 11px;
    color: var(--slate);
    flex-shrink: 0;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.05em;
  }
  .fw .meter-bar {
    flex: 1;
    height: 4px;
    background: var(--mist);
    position: relative;
    overflow: hidden;
  }
  .fw .meter-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-light));
    width: 0%;
    transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .fw .meter-val {
    width: 40px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--gold);
    text-align: right;
    flex-shrink: 0;
  }
  .fw .meter-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 32px;
  }
  .fw .meter-head h3 { font-family: 'Cormorant Garamond', serif; font-size: 24px; }
  .fw .meter-legend {
    display: flex;
    gap: 24px;
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    align-items: center;
  }
  .fw .legend-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
  }

  /* STICKY HEADER */
  .fw .sticky-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 500;
    padding: 20px 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.4s;
    pointer-events: none;
  }
  .fw .sticky-header.scrolled {
    background: rgba(13,13,13,0.9);
    backdrop-filter: blur(12px);
    pointer-events: all;
  }
  .fw .logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    color: var(--gold);
    letter-spacing: 0.1em;
    opacity: 0;
    transition: opacity 0.4s;
  }
  .fw .sticky-header.scrolled .logo-text { opacity: 1; }
  .fw .header-link {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--gold);
    opacity: 0;
    transition: opacity 0.4s;
    text-transform: uppercase;
    cursor: pointer;
    background: none;
    border: none;
  }

  @media (max-width: 900px) {
    .fw section { padding: 80px 32px; }
    .fw .hero { padding: 40px 32px; }
    .fw .philosophy { grid-template-columns: 1fr; }
    .fw .features-grid { grid-template-columns: 1fr; }
    .fw .delivery-grid { grid-template-columns: 1fr 1fr; }
    .fw .pricing-cards { grid-template-columns: 1fr; }
    .fw .side-nav { display: none; }
    .fw .sticky-header { padding: 16px 32px; }
    .fw .cursor, .fw .cursor-ring { display: none; }
    .fw { cursor: auto; }
  }
`;

const sideNav = [
  { label: 'Intro', target: 0 },
  { label: 'Philosophy', target: 1 },
  { label: 'Structure', target: 2 },
  { label: 'Features', target: 3 },
  { label: 'Delivery', target: 4 },
  { label: 'Positioning', target: 5 },
  { label: 'Metrics', target: 6 },
];

const complianceList = [
  'Required by regulation', 'Generic market overview', 'Backward-looking data',
  'Template-driven format', 'Low perceived value', 'Price-sensitive client',
  'Easily substituted', 'No strategic advice',
];
const needsList = [
  'Driven by client objective', 'Targeted market intelligence', 'Forward-looking scenarios',
  'Bespoke narrative structure', 'High perceived value', 'Outcome-sensitive client',
  'Irreplaceable expertise', 'Actionable recommendations',
];

const chapters = [
  { num: '01', title: 'Executive Intelligence Brief',
    desc: 'A one-page strategic synthesis designed for C-suite consumption. Not a summary — a verdict. The entire report distilled into three findings and one recommendation.',
    subs: ["Client's stated objective vs. our diagnosed real objective", 'Three critical findings that change everything', 'The single most important decision the client must make', 'Confidence rating and risk flag matrix'] },
  { num: '02', title: 'Client Objective & Problem Diagnosis',
    desc: 'A transparent documentation of what the client told us, what we discovered the real challenge is, and how we framed the research to address the root cause — not the symptom.',
    subs: ['Stated brief vs. diagnosed need (side-by-side)', 'Stakeholder map and decision-making chain', 'Scope definition with explicit exclusions', 'Research hypotheses and questions to be answered', 'Success criteria: what does a good outcome look like?'] },
  { num: '03', title: 'Macro & Structural Market Context',
    desc: 'Not a standard market overview. A curated macro narrative that contextualises only the forces directly bearing on the client’s decision horizon — local, national, and cross-border.',
    subs: ['Economic cycle positioning and real estate implications', 'Interest rate environment and capital flow analysis', 'Policy and regulatory trajectory (zoning, foreign ownership, tax)', 'Demographic and urbanisation megatrends', 'Technology disruption signals (proptech, remote work, logistics)', 'Cross-border investment appetite and sovereign wealth flows'] },
  { num: '04', title: 'Hyper-Local Supply & Demand Intelligence',
    desc: 'Granular, geospatially precise analysis of the target market. This is where external research houses stop. We go further by interpreting what the numbers mean for this client’s specific asset.',
    subs: ['Micro-market delineation with custom trade area mapping', 'Existing supply inventory with qualitative grading', 'Pipeline analysis: confirmed, likely, and speculative', 'Absorption rate modelling by product type and price band', 'Demand driver profiling: who is buying, for what purpose', 'Latent demand identification (unserved segments)', 'Price elasticity analysis and value-per-sqft benchmarking'] },
  { num: '05', title: 'Competitive Landscape & Positioning Matrix',
    desc: "A forensic dissection of every relevant competitor — their strategy, their vulnerabilities, and the white space they've left open for the client to occupy.",
    subs: ['Competitive set definition rationale', 'Multi-dimensional competitor scoring (product, price, brand, location, pipeline)', 'Sales velocity and pricing strategy reverse-engineering', 'Marketing channel and buyer profile profiling', 'Positioning gap analysis: what nobody is doing well', 'Direct competitive threat assessment'] },
  { num: '06', title: 'Product Strategy & Concept Optimisation',
    desc: 'The chapter competitors never write. A market-driven product brief that specifies what to build, at what price, for whom — derived from demand signals, not aspirations.',
    subs: ['Recommended unit mix and sizing based on absorption data', 'Price point and price-per-sqft recommendation with rationale', 'Specification and amenity level benchmarking', 'Target buyer persona development (with psychographic profiling)', 'Brand and positioning concept recommendation', 'Launch sequencing strategy (phasing, pricing escalation)'] },
  { num: '07', title: 'Financial Viability & Scenario Modelling',
    desc: 'Bridging market insight to financial reality. We model base, bull, and bear scenarios so the client understands the range of outcomes before committing capital.',
    subs: ['Revenue projection model (by phase, unit type, escalation)', 'Sales velocity assumptions and sensitivity analysis', 'Break-even analysis and minimum viable pricing floor', 'Base / optimistic / stress scenario modelling', 'Key risk variables and their impact magnitude', 'Yield and IRR implications for different holding strategies'] },
  { num: '08', title: 'Strategic Recommendations & Action Roadmap',
    desc: 'The chapter the client hired you to write. Clear, prioritised, ownership-assigned recommendations with a phased implementation roadmap and decision triggers.',
    subs: ['Primary strategic recommendation (with confidence level)', 'Alternative strategies if primary conditions change', '90-day / 6-month / 12-month action roadmap', 'Decision tree: if X happens, do Y', 'Critical success factors and monitoring KPIs', 'Red flags that should trigger a strategy review'] },
  { num: '09', title: 'Appendix: Evidence Architecture',
    desc: 'Every assertion in the report traceable to a source. Data tables, primary research transcripts, methodology notes, and a glossary — building credibility that withstands boardroom scrutiny.',
    subs: ['Primary research methodology and sample details', 'Full data tables referenced in the body', 'Comparable transaction register', 'Expert interview summary notes', 'Assumptions register and data vintage log', 'Glossary of terms and abbreviations'] },
];

const features = [
  { icon: '⬡', title: 'Live Data Dashboard Cover', tag: 'Format Innovation',
    desc: 'Replace the static cover page with a single-page dashboard showing the three most critical market metrics — updated at delivery. Clients see intelligence before they open the report. First impression: this is different.' },
  { icon: '◈', title: 'Interactive Digital Version', tag: 'Digital Delivery',
    desc: 'Deliver both PDF and a web-hosted HTML version with clickable charts, expandable footnotes, hover-activated data points, and embedded video commentaries from the lead consultant. The digital version is the premium product.' },
  { icon: '△', title: 'Scenario Simulator', tag: 'Decision Tool',
    desc: 'An embedded interactive model where clients can adjust key assumptions (interest rate, launch price, absorption pace) and see how the financial projections change in real time. Turns a report into a decision tool they use weekly.' },
  { icon: '◯', title: 'Confidence Rating System', tag: 'Credibility Layer',
    desc: 'Every data point and recommendation is tagged with a transparent confidence level (High / Medium / Indicative) based on data quality, sample size, and market volatility. Builds trust by showing intellectual honesty.' },
  { icon: '▣', title: 'Visual Competitor Cards', tag: 'Visual Intelligence',
    desc: 'Each competitor presented as a designed profile card — photography, key metrics, a one-line verdict, and a vulnerability flag. More memorable than tables. Boardroom-ready as standalone slides.' },
  { icon: '≋', title: 'The "So What?" Sidebar', tag: 'Insight Translation',
    desc: "Every major data section includes a highlighted sidebar with a direct “So What?” implication for the client's specific project — converting market information into project-relevant insight. Forces the consultant to think, not just present." },
  { icon: '◉', title: 'Micro-Heat Map Overlays', tag: 'Geospatial Layer',
    desc: 'Geospatial maps showing demand density, competitor concentration, infrastructure quality, and catchment affluence — all layered and togglable. Spatial intelligence that no spreadsheet can replace.' },
  { icon: '⊕', title: 'Buyer Persona Profiles', tag: 'Human Intelligence',
    desc: "Full illustrated persona cards for each target buyer segment — demographics, motivations, channel preferences, decision triggers, and price sensitivity. Turns abstract segments into people the client's sales team can visualise and target." },
  { icon: '◆', title: "Consultant's Voice Notation", tag: 'Authority Marker',
    desc: 'Distinct typographic treatment for passages that represent the consultant’s professional opinion versus reported data. Clients understand exactly when they are reading institutional experience — and they pay for that distinction.' },
];

const deliveries = [
  { num: '01', title: 'The Briefing Deck', desc: 'A 12–16 slide executive presentation built to be presented in person. Designed for boardrooms. No dense paragraphs. Every slide communicates one idea with one visual. Delivered 48 hours before the full report.' },
  { num: '02', title: 'The Full Report', desc: 'The complete 9-chapter document. Print-ready PDF with premium layout, custom cartography, and branded data visualisations. The artifact of record. Archival quality that reflects the fee paid.' },
  { num: '03', title: 'The Digital Intelligence Hub', desc: 'A password-protected microsite with the interactive version: live charts, scenario simulator, clickable maps, and downloadable data tables. Accessible on any device. Positions you as a data partner, not a document provider.' },
  { num: '04', title: 'The Strategy Session', desc: 'A mandatory 90-minute facilitated session — not a presentation, a working session — to translate findings into decisions with the client’s team. This is where your fee is justified in the room. Included in premium tier.' },
];

const diffRows = [
  { dim: 'Starting Point', extBadge: 'Generic', ext: 'What does the market look like?', youBadge: 'Targeted', you: 'What does the client need to decide?' },
  { dim: 'Data Orientation', ext: 'Historical and descriptive — what happened', you: 'Predictive and prescriptive — what to do next' },
  { dim: 'Scope', ext: 'Broad market coverage to justify publication fees', you: "Surgically focused on the client's specific decision" },
  { dim: 'Authorship', ext: 'Junior analysts with template-driven methodology', you: 'Senior consultants with transactional experience in the market' },
  { dim: 'Recommendation', ext: 'Generic outlook with hedged language', you: 'Explicit, owned strategic recommendation with confidence rating' },
  { dim: 'Financial Modelling', ext: 'Rarely included; treated as separate engagement', you: 'Integrated scenario model as standard chapter' },
  { dim: 'Format', ext: 'Standard PDF template, minimal design investment', you: 'Premium print + interactive digital + briefing deck' },
  { dim: 'Client Interaction', ext: 'Report delivered; relationship ends', you: 'Strategy session + ongoing market monitoring partnership' },
  { dim: 'Fee Model', ext: 'Cost-driven; client treats as compliance overhead', you: 'Value-driven; client treats as investment in decision quality' },
  { dim: 'Substitutability', ext: 'High — easily replaced by another research house', you: 'Low — specific expertise, local access, and context are irreplaceable' },
];

const needsMeters = [
  ['Strategic Insight', 95], ['Decision Utility', 90], ['Financial Modelling', 85],
  ['Market Intelligence', 92], ['Design Quality', 95], ['Competitor Analysis', 88],
];
const complianceMeters = [
  ['Strategic Insight', 15], ['Decision Utility', 20], ['Financial Modelling', 10],
  ['Market Intelligence', 55], ['Design Quality', 30], ['Competitor Analysis', 40],
];

const pricing = [
  { tier: 'Foundation', name: 'Market Pulse', featured: false,
    desc: 'For clients who need market context before making a smaller decision. Efficient, focused, fast.',
    list: ['Executive Brief (2 pages)', 'Supply & demand snapshot', 'Competitor price benchmarking', '3 key findings + recommendation', 'PDF delivery only', '2-week turnaround'] },
  { tier: 'Flagship', name: 'Strategic Advisory Report', featured: true,
    desc: 'The full 9-chapter framework. The product that separates you from every research house in the market.',
    list: ['All 9 chapters, full depth', 'Interactive digital version', 'Scenario financial model', 'Competitor intelligence cards', 'Buyer persona profiles', 'Boardroom briefing deck', '90-minute strategy session', 'Geospatial heat maps', '4–6 week turnaround'] },
  { tier: 'Retainer', name: 'Market Intelligence Partner', featured: false,
    desc: 'For developers and funds who want continuous market intelligence — not a point-in-time snapshot.',
    list: ['Quarterly market updates', 'Priority access: ad hoc briefs', 'Competitor monitoring alerts', 'Annual strategic review', 'Dedicated analyst', 'On-call advisory hours'] },
];

export default function Framework({ onNavigate }) {
  const [open, setOpen] = useState(null);
  const cursorRef = useRef(null);
  const ringRef = useRef(null);

  // CUSTOM CURSOR
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, raf;

    const onMove = (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.left = mouseX - 4 + 'px';
      cursor.style.top = mouseY - 4 + 'px';
    };
    const loop = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX - 16 + 'px';
      ring.style.top = ringY - 16 + 'px';
      raf = requestAnimationFrame(loop);
    };
    document.addEventListener('mousemove', onMove);
    loop();

    const enter = () => { cursor.style.transform = 'scale(2.5)'; ring.style.transform = 'scale(1.5)'; ring.style.opacity = '1'; };
    const leave = () => { cursor.style.transform = 'scale(1)'; ring.style.transform = 'scale(1)'; ring.style.opacity = '0.6'; };
    const els = document.querySelectorAll('.fw a, .fw button, .fw .chapter, .fw .feature-card, .fw .nav-dot, .fw .delivery-card');
    els.forEach((el) => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave); });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      els.forEach((el) => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); });
    };
  }, []);

  // SCROLL: progress bar, sticky header, nav dots
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = (scrollTop / docHeight) * 100 + '%';

      const header = document.getElementById('stickyHeader');
      const headerRight = document.getElementById('headerRight');
      if (header) {
        if (scrollTop > 80) { header.classList.add('scrolled'); if (headerRight) headerRight.style.opacity = '1'; }
        else { header.classList.remove('scrolled'); if (headerRight) headerRight.style.opacity = '0'; }
      }

      const sections = document.querySelectorAll('.fw [id^="sec-"]');
      const dots = document.querySelectorAll('.fw .nav-dot');
      sections.forEach((sec, i) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          dots.forEach((d) => d.classList.remove('active'));
          if (dots[i]) dots[i].classList.add('active');
        }
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // REVEAL ON SCROLL + METERS
  useEffect(() => {
    const reveals = document.querySelectorAll('.fw .reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.querySelectorAll('.meter-fill').forEach((fill) => {
            const t = fill.getAttribute('data-target');
            if (t) fill.style.width = t + '%';
          });
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach((r) => observer.observe(r));

    const fallback = setTimeout(() => {
      document.querySelectorAll('.fw .meter-fill').forEach((fill) => {
        const t = fill.getAttribute('data-target');
        if (t) fill.style.width = t + '%';
      });
    }, 600);

    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);

  const scrollToSection = (i) => {
    const el = document.getElementById('sec-' + i);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  const toggleChapter = (i) => setOpen((cur) => (cur === i ? null : i));

  return (
    <div className="fw">
      <style>{CSS}</style>

      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />
      <div id="progress-bar" />

      {/* STICKY HEADER */}
      <div className="sticky-header" id="stickyHeader">
        <div className="logo-text">Needs-Based Consultancy Framework</div>
        <button className="header-link" id="headerRight" onClick={() => onNavigate('playbook')}>
          Part II — The Playbook →
        </button>
      </div>

      {/* SIDE NAV */}
      <nav className="side-nav">
        {sideNav.map((d, i) => (
          <div key={d.label} className={'nav-dot' + (i === 0 ? ' active' : '')} data-label={d.label} onClick={() => scrollToSection(d.target)} />
        ))}
      </nav>

      {/* HERO */}
      <section className="hero" id="sec-0">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-accent" />
        <div className="hero-tag">Proprietary Framework · Needs-Based Advisory</div>
        <h1>From<br />Compliance<br />to <em>Conviction.</em></h1>
        <p className="hero-sub">A complete report structure and engagement model for real estate consultancies who refuse to be commoditised — transforming market studies into strategic weapons for clients who demand answers, not just data.</p>
        <div className="hero-line" />
        <div className="scroll-hint">Scroll to explore the framework</div>
      </section>

      {/* PHILOSOPHY */}
      <section className="philosophy" id="sec-1">
        <div className="philosophy-left reveal">
          <div className="section-label">01 — The Shift</div>
          <h2>The difference that<br />commands a <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>premium.</em></h2>
          <div className="philosophy-quote reveal reveal-delay-2">
            "By understanding their objective and real problem, the solution-driven report is worth a lot to them using our experience — thus we can charge higher fee for the expertise."
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--slate)', maxWidth: 480 }} className="reveal reveal-delay-3">
            External research houses produce volumes. You produce verdicts. The distinction is not in the data — it is in the interpretation, the foresight, and the institutional experience that turns information into decisions. This framework operationalises that difference.
          </p>
        </div>
        <div className="philosophy-right reveal reveal-delay-2">
          <div className="compare-grid">
            <div className="compare-card compliance">
              <div className="tag">Compliance-Driven</div>
              <h4>The Tick-Box Report</h4>
              <ul className="compare-list">{complianceList.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="compare-card needs">
              <div className="tag">Needs-Based Advisory</div>
              <h4>The Strategic Instrument</h4>
              <ul className="compare-list">{needsList.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* REPORT STRUCTURE */}
      <section className="structure-section" id="sec-2">
        <div className="section-label reveal">02 — Report Architecture</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <h2 className="reveal" style={{ color: 'var(--cream)' }}>The 9-Chapter<br /><em style={{ color: 'var(--gold)' }}>Conviction</em><br />Framework</h2>
          <p className="reveal reveal-delay-2" style={{ fontSize: 13, lineHeight: 1.9, color: 'rgba(247,243,236,0.5)', paddingTop: 8 }}>
            Every chapter is constructed to serve the client's decision — not to demonstrate effort. Each section builds from situation to insight to recommendation, closing with a call to act. Click any chapter to expand its contents.
          </p>
        </div>

        <div className="chapters reveal reveal-delay-2">
          {chapters.map((ch, i) => (
            <div key={ch.num} className={'chapter' + (open === i ? ' open' : '')} onClick={() => toggleChapter(i)}>
              <div className="chapter-num">{ch.num}</div>
              <div className="chapter-content">
                <div className="chapter-title">{ch.title}</div>
                <div className="chapter-desc">{ch.desc}</div>
                <div className={'chapter-sub' + (open === i ? ' open' : '')}>
                  {ch.subs.map((s) => <div key={s} className="sub-item">{s}</div>)}
                </div>
              </div>
              <div className="chapter-toggle">+</div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE FEATURES */}
      <section className="features-section" id="sec-3">
        <div className="section-label reveal">03 — Engagement Design</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'end' }}>
          <h2 className="reveal">Making the report<br />impossible to <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>put down.</em></h2>
          <p className="reveal reveal-delay-2" style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--slate)' }}>
            The format is the message. These interactive and presentational features transform your report from a document the client reads once to an intelligence asset they return to continuously — and reference in every strategic conversation.
          </p>
        </div>

        <div className="features-grid reveal reveal-delay-2">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
              <div className="feature-tag">{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DELIVERY FORMAT */}
      <section className="delivery-section" id="sec-4">
        <div className="section-label reveal">04 — Delivery Architecture</div>
        <h2 className="reveal">Four layers.<br />One <em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>ecosystem.</em></h2>
        <div className="delivery-grid reveal reveal-delay-2">
          {deliveries.map((d) => (
            <div key={d.num} className="delivery-card">
              <div className="delivery-num">{d.num}</div>
              <div className="delivery-title">{d.title}</div>
              <div className="delivery-desc">{d.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPETITIVE POSITIONING */}
      <section className="diff-section" id="sec-5">
        <div className="section-label reveal">05 — Competitive Positioning</div>
        <h2 className="reveal">How you win against<br />the <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>research houses.</em></h2>
        <p className="reveal reveal-delay-2" style={{ maxWidth: 600, fontSize: 13, lineHeight: 1.9, color: 'var(--slate)', marginTop: 24 }}>
          External research houses have scale. You have depth, access, and the ability to translate data into decisions. This table makes that difference legible — for your own positioning and for client conversations.
        </p>
        <div className="reveal reveal-delay-3" style={{ overflowX: 'auto', marginTop: 48 }}>
          <table className="diff-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>External Research House</th>
                <th>Your Needs-Based Report</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((r) => (
                <tr key={r.dim}>
                  <td>{r.dim}</td>
                  <td className="diff-ext">{r.extBadge && <><span className="badge-ext">{r.extBadge}</span><br /></>}{r.ext}</td>
                  <td className="diff-you">{r.youBadge && <><span className="badge-you">{r.youBadge}</span><br /></>}{r.you}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CAPABILITY METER */}
      <section className="meter-section" id="sec-6">
        <div className="meter-head reveal">
          <h3>Report Value Composition</h3>
          <div className="meter-legend">
            <span><span className="legend-dot" style={{ background: 'var(--gold)' }} />Your Needs-Based Report</span>
            <span style={{ color: 'rgba(139,0,0,0.5)' }}><span className="legend-dot" style={{ background: 'rgba(139,0,0,0.3)' }} />Typical Compliance Report</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }} className="reveal reveal-delay-2">
          <div>
            <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 24, textTransform: 'uppercase' }}>Needs-Based Report</p>
            {needsMeters.map(([label, val]) => (
              <div className="meter-row" key={label}>
                <div className="meter-label">{label}</div>
                <div className="meter-bar"><div className="meter-fill" data-target={val} /></div>
                <div className="meter-val">{val}%</div>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', color: 'rgba(139,0,0,0.5)', marginBottom: 24, textTransform: 'uppercase' }}>Compliance Report</p>
            {complianceMeters.map(([label, val]) => (
              <div className="meter-row" key={label}>
                <div className="meter-label">{label}</div>
                <div className="meter-bar"><div className="meter-fill" data-target={val} style={{ background: 'rgba(139,0,0,0.3)' }} /></div>
                <div className="meter-val" style={{ color: 'rgba(139,0,0,0.5)' }}>{val}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="pricing-section">
        <div className="section-label reveal">06 — Service Architecture</div>
        <h2 className="reveal">Three engagement tiers.<br />One <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>clear signal</em> to the market.</h2>
        <div className="pricing-cards reveal reveal-delay-2">
          {pricing.map((p) => (
            <div key={p.name} className={'pricing-card' + (p.featured ? ' featured' : '')}>
              {p.featured && <div className="featured-badge">Recommended</div>}
              <div className="pricing-tier">{p.tier}</div>
              <div className="pricing-name">{p.name}</div>
              <div className="pricing-desc">{p.desc}</div>
              <ul className="pricing-list">{p.list.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="section-label reveal" style={{ justifyContent: 'center' }}>07 — The Imperative</div>
        <h2 className="reveal">Stop selling reports.<br />Start selling <em>conviction.</em></h2>
        <p className="reveal reveal-delay-2">The market is full of research houses selling data. There is only one firm that can sell your experience, your network, and your ability to tell a client what to do — not just what is happening.</p>
        <div className="reveal reveal-delay-3">
          <button className="btn-primary" onClick={() => onNavigate('playbook')}>Open the Implementation Playbook</button>
          <button className="btn-outline" onClick={() => window.print()}>Download Framework PDF</button>
        </div>
        <div style={{ marginTop: 80, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(247,243,236,0.2)', textTransform: 'uppercase' }} className="reveal reveal-delay-4">
          Proprietary Framework · For Internal Strategic Use · Not For Distribution
        </div>
      </section>
    </div>
  );
}
