'use client'

import Link from 'next/link'
import { ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, Droplets, Gauge, Moon, ShieldCheck, Sun, Waves } from 'lucide-react'
import { useState } from 'react'

const capabilities = [
  { icon: Gauge, label: 'Monitor', title: 'See the whole facility', text: 'Bring power, cooling, water, and thermal signals into one operational view.' },
  { icon: BrainCircuit, label: 'Explain', title: 'Turn anomalies into clarity', text: 'Use Gemini-assisted analysis to explain structured findings without inventing metrics.' },
  { icon: Waves, label: 'Simulate', title: 'Test before you change', text: 'Evaluate energy, water, and reliability impact before an operator takes action.' },
]

export function NexusLanding() {
  const [lightMode, setLightMode] = useState(false)
  const toggleTheme = () => {
    const next = !lightMode
    setLightMode(next)
    document.documentElement.classList.toggle('light', next)
    document.documentElement.style.colorScheme = next ? 'light' : 'dark'
  }

  return <main className="landing-page">
    <nav className="landing-nav" aria-label="Primary navigation">
      <Link href="/" className="landing-brand"><span className="brand-mark">N</span><span>NEXUS</span></Link>
      <div className="landing-nav-links"><a href="#capabilities">Capabilities</a><a href="#operating-model">Operating model</a><button className="landing-theme" onClick={toggleTheme} aria-label={lightMode ? 'Use dark mode' : 'Use light mode'}>{lightMode ? <Moon /> : <Sun />}</button><Link className="landing-nav-cta" href="/dashboard">Enter dashboard <ArrowRight /></Link></div>
    </nav>

    <section className="landing-hero landing-reveal">
      <div className="landing-hero-copy landing-stagger">
        <div className="landing-kicker"><span className="landing-status-dot" />SUSTAINABILITY GUARDIAN · SYNTHETIC DEMO</div>
        <h1>Make every infrastructure decision <em>defensible.</em></h1>
        <p className="landing-lede">NEXUS is a decision-support command center for data-center teams balancing reliability, energy efficiency, and water stewardship.</p>
        <div className="landing-actions"><Link href="/dashboard" className="landing-primary">Open Command Center <ArrowRight /></Link><a href="#capabilities" className="landing-secondary">Explore the system <ChevronRight /></a></div>
        <div className="landing-proof"><span><CheckCircle2 /> Deterministic metrics</span><span><ShieldCheck /> Reliability-gated actions</span></div>
      </div>
      <div className="landing-hero-art landing-signal-enter" aria-label="NEXUS operational signal preview">
        <div className="signal-header"><span>OPERATIONAL SIGNAL</span><span className="signal-live"><i /> LIVE DEMO</span></div>
        <div className="signal-value">1.64 <small>PUE</small></div>
        <div className="signal-caption">Current facility posture</div>
        <div className="signal-bars"><span style={{ height: '42%' }} /><span style={{ height: '57%' }} /><span style={{ height: '48%' }} /><span style={{ height: '74%' }} /><span style={{ height: '63%' }} /><span style={{ height: '82%' }} /><span style={{ height: '68%' }} /><span style={{ height: '91%' }} /></div>
        <div className="signal-footer"><span><b className="signal-good">●</b> Reliability stable</span><span>Last 24 hours</span></div>
      </div>
    </section>

    <section className="landing-intro" id="capabilities"><div><p className="landing-eyebrow">FROM SIGNAL TO DECISION</p><h2>One quiet layer between telemetry and action.</h2></div><p>Built for operators who need to understand what changed, why it matters, and whether a response is safe before optimizing the facility.</p></section>
    <section className="landing-capabilities landing-scroll-group">{capabilities.map(({ icon: Icon, label, title, text }) => <article className="landing-capability" key={label}><div className="landing-capability-icon"><Icon /></div><p className="landing-eyebrow">{label}</p><h3>{title}</h3><p>{text}</p></article>)}</section>

    <section className="landing-model landing-scroll-group" id="operating-model"><div className="landing-model-copy"><p className="landing-eyebrow">THE NEXUS OPERATING MODEL</p><h2>Monitor. Detect. Explain. Simulate. Optimize.</h2><p>Every recommendation is grounded in structured telemetry and checked against a configurable thermal and reliability threshold.</p><Link href="/dashboard" className="landing-text-link">See the command center <ArrowRight /></Link></div><div className="landing-model-list"><div><span>01</span><strong>Monitor the baseline</strong><small>Power, cooling, water, and thermal posture</small></div><div><span>02</span><strong>Detect the deviation</strong><small>Surface the signal that needs attention</small></div><div><span>03</span><strong>Simulate the response</strong><small>Reject unsafe optimization scenarios</small></div></div></section>

    <section className="landing-footer-cta"><div><p className="landing-eyebrow">READY FOR THE NEXT DECISION?</p><h2>Start with a clearer view of the facility.</h2></div><Link href="/dashboard" className="landing-primary">Enter NEXUS <ArrowRight /></Link></section>
    <footer className="landing-footer"><span>© 2026 NEXUS Sustainability Guardian</span><span><Droplets /> Synthetic telemetry · Decision support, not direct control</span></footer>
  </main>
}
