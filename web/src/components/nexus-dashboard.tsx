'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, BarChart3, Bell, BrainCircuit, Check, ChevronDown, CircleHelp, Gauge, Hexagon, Menu, Play, RotateCcw, ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import { calculatePue, calculateWue } from '@/lib/nexus/calculations'
import { MAX_SAFE_SERVER_TEMPERATURE_C } from '@/lib/nexus/constants'
import { fetchFindings, postExplainFindings, postSimulate, type ExplainResponse, type FindingsResponse } from '@/lib/client/api'
import type { Finding, ScenarioId, Severity, SimulationResult, Telemetry } from '@/lib/nexus/types'

const scenarios: { id: ScenarioId; label: string; description: string }[] = [
  { id: 'normal', label: 'Normal', description: 'Stable operating baseline' },
  { id: 'cooling-inefficiency', label: 'Cooling Inefficiency', description: 'Cooling demand above expected baseline' },
  { id: 'workload-spike', label: 'Workload Spike', description: 'Higher compute demand' },
  { id: 'environmental-stress', label: 'Environmental Stress', description: 'Elevated ambient temperature' },
  { id: 'unsafe-optimization', label: 'Unsafe Optimization', description: 'High-load baseline for the safety-gate demo' },
  { id: 'critical-facility-stress', label: 'Critical Facility Stress', description: 'Synthetic chiller-delivery fault with thermal risk' },
]

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1, normal: 0 }
const METRIC_UNIT: Record<Finding['metric'], string> = { cooling_power: 'MW', water_usage: 'L', server_temperature: '°C' }
const METRIC_HEADLINE: Record<Finding['metric'], string> = {
  cooling_power: 'Cooling demand exceeds expected baseline',
  water_usage: 'Water usage exceeds expected baseline',
  server_temperature: 'Server temperature exceeds expected baseline',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }) + ' WIB'
}
type ActivityEvent = { id: string; timestamp: string; title: string; type: string; tone: 'coral' | 'cyan' | 'violet' | 'teal' }

/** Renders the small, predictable Markdown subset requested from the AI without injecting HTML. */
function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part.replaceAll('*', ''),
  )
}

function AIExplanation({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  // Gemini can occasionally collapse Markdown into one line. Recover the
  // expected numbered sections and bold-label bullets before rendering.
  const normalized = text
    .replace(/\s+(?=\d+\.\s+\*\*)/g, '\n\n')
    .replace(/\s+(?=\*\*[^*]+\*\*:\s)/g, '\n')
    .replace(/\s+(?=\*\([^)]{1,180}\)\s*$)/gm, '\n')
  const lines = normalized.split('\n')
  let bullets: string[] = []
  const flushBullets = () => {
    if (bullets.length > 0) {
      blocks.push(<ul key={`list-${blocks.length}`}>{bullets.map((bullet, index) => <li key={index}>{renderInlineMarkdown(bullet)}</li>)}</ul>)
      bullets = []
    }
  }

  lines.forEach((line) => {
    const value = line.trim()
    if (!value) { flushBullets(); return }
    const heading = value.match(/^(?:#{1,3}\s+|\d+\.\s+)(.+)$/)
    if (heading) { flushBullets(); blocks.push(<h3 key={`heading-${blocks.length}`}>{renderInlineMarkdown(heading[1])}</h3>); return }
    const bullet = value.match(/^[-*]\s+(.+)$/)
    if (bullet) { bullets.push(bullet[1]); return }
    flushBullets()
    blocks.push(<p key={`paragraph-${blocks.length}`}>{renderInlineMarkdown(value)}</p>)
  })
  flushBullets()
  return <div className="ai-content">{blocks}</div>
}

/** Normalizes a series of raw values into an 80x24 sparkline point string — display-only, no business math. */
function sparkPoints(values: number[]): string {
  if (values.length < 2) return '0,20 80,20'
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = 80 / (values.length - 1)
  return values.map((v, i) => `${(i * step).toFixed(1)},${(24 - ((v - min) / span) * 20 - 2).toFixed(1)}`).join(' ')
}

function Panel({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) { return <section id={id} className={`panel ${className}`}>{children}</section> }

function MetricCard({ label, value, unit, trend, tone, help, values }: { label: string; value: string; unit: string; trend: string; tone: 'good' | 'warn' | 'neutral'; help?: string; values: number[] }) {
  return (
    <motion.div className="metric-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
      <div className="metric-head"><span>{label}</span>{help && <CircleHelp size={13} aria-label={help} />}</div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <div className={`metric-foot ${tone}`}>
        <span>{trend}</span>
        <svg viewBox="0 0 80 24" aria-hidden="true"><polyline points={sparkPoints(values)} /></svg>
      </div>
    </motion.div>
  )
}

function ChartTip({ active, payload, label }: any) { if (!active || !payload?.length) return null; return <div className="chart-tip"><strong>{label} WIB</strong>{payload.map((p: any) => <div key={p.dataKey}><i style={{ background: p.color }} />{p.name}: {p.value} MW</div>)}</div> }

function Sidebar({ mobileOpen, setMobileOpen, activeNav, onNavigate, findingsCount }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void; activeNav: string; onNavigate: (id: string) => void; findingsCount: number }) {
  const navItems = [['Command Center', Gauge, 'command-center'], ['Telemetry', Activity, 'telemetry'], ['Anomalies', AlertTriangle, 'anomalies'], ['Simulator', SlidersHorizontal, 'simulator'], ['Reports', BarChart3, 'reports']] as const
  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand"><Hexagon size={26} strokeWidth={1.6} /><span>NEXUS</span><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <p className="eyebrow">SUSTAINABILITY GUARDIAN</p>
      <nav aria-label="Primary navigation">
        {navItems.map(([label, Icon, id]) => (
          <button key={label} className={`nav-item ${activeNav === id ? 'active' : ''}`} onClick={() => onNavigate(id)}>
            <Icon size={17} /><span>{label}</span>
            {id === 'anomalies' && findingsCount > 0 && <b>{findingsCount}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="demo-badge"><span className="dot teal" />Synthetic demo data</span>
        <div className="operator"><div className="avatar">AS</div><div><strong>Amir S.</strong><small>Operations lead</small></div><ChevronDown size={15} /></div>
      </div>
    </aside>
  )
}

function Header({ setMobileOpen, onRun, current, scenarioLabel, title }: { setMobileOpen: (v: boolean) => void; onRun: () => void; current: Telemetry | null; scenarioLabel: string | null; title: string }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
      <div><p className="eyebrow">NEXUS / OPERATIONS</p><h1>{title}</h1></div>
      <div className="top-actions">
        <div className="site-select"><span className="dot teal" />Batam Edge Campus <b>· DC-01</b><ChevronDown size={14} /></div>
        <div className="updated">Last updated <strong>{current ? formatDateTime(current.timestamp) : '—'}</strong></div>
        <span className="stream"><span className="dot teal pulse" />{scenarioLabel ?? 'Telemetry stream active'}</span>
        <button className="button primary" onClick={onRun}><Play size={15} fill="currentColor" />Run simulation</button>
        <div className="notification-wrap">
          <button className="icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} /><span className="notification-dot" /></button>
          {notificationsOpen && (
            <div className="notification-popover" role="dialog" aria-label="Notifications">
              <div className="notification-header"><strong>Notifications</strong><span>Demo feed</span></div>
              <button className="notification-item" onClick={() => setNotificationsOpen(false)}><span className="notification-icon"><AlertTriangle size={15} /></span><span><strong>{scenarioLabel ?? 'Telemetry anomaly detected'}</strong><small>Review the current synthetic telemetry findings.</small></span></button>
              <button className="notification-item" onClick={() => setNotificationsOpen(false)}><span className="notification-icon teal-icon"><Activity size={15} /></span><span><strong>Telemetry stream active</strong><small>Latest synthetic reading received.</small></span></button>
              <button className="notification-clear" onClick={() => setNotificationsOpen(false)}>Dismiss notifications</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function StatusStrip({ metrics, current, findingsCount, isCritical }: { metrics: { pue: number; wue: number; expectedCoolingPowerMw: number } | null; current: Telemetry | null; findingsCount: number; isCritical: boolean }) {
  const stable = findingsCount === 0
  const clampScore = (value: number) => Math.max(0, Math.min(100, value))
  const reliabilityScore = current ? clampScore(100 - Math.max(0, current.serverTemperatureC - MAX_SAFE_SERVER_TEMPERATURE_C) * 10) : null
  const energyScore = metrics && current ? clampScore((metrics.expectedCoolingPowerMw / current.coolingPowerMw) * 100) : null
  // 0.9 L/kWh is the demo's efficient-water reference; score derives from WUE.
  const waterScore = metrics ? clampScore((0.9 / metrics.wue) * 100) : null
  const scoreTone = (score: number) => score <= 70 ? 'critical' : score >= 85 ? 'good' : 'warn'
  return (
    <Panel className={`status-strip ${isCritical ? 'critical' : ''}`}>
      <div>
        <p className="eyebrow">OPERATIONAL POSTURE</p>
        <div className="status-title">
          <span className="status-pill"><span className={`dot ${isCritical ? 'coral' : 'teal'}`} />{stable ? 'Stable' : isCritical ? 'Critical' : 'Attention'}</span>
          <strong>{stable ? 'All monitored metrics are tracking their expected baselines.' : isCritical ? 'Critical reliability and sustainability findings require immediate operator review.' : `${findingsCount} active finding${findingsCount === 1 ? '' : 's'} require review.`}</strong>
        </div>
      </div>
      <div className="status-right">
        <span className="demo-label">Demo telemetry</span>
        {metrics && current && (
          <>
            <div className="status-stat"><span className={`ring ${scoreTone(reliabilityScore!)}`} /><div><small>Reliability</small><strong>{reliabilityScore!.toFixed(1)}%</strong></div></div>
            <div className="status-stat"><span className={`ring ${scoreTone(energyScore!)}`} /><div><small>Energy</small><strong>{energyScore!.toFixed(1)}%</strong></div></div>
            <div className="status-stat"><span className={`ring ${scoreTone(waterScore!)}`} /><div><small>Water</small><strong>{waterScore!.toFixed(1)}%</strong></div></div>
          </>
        )}
      </div>
    </Panel>
  )
}

function TelemetryCharts({ history, primaryFinding }: { history: Telemetry[]; primaryFinding: Finding | null }) {
  const [range, setRange] = useState('24H')
  const energyData = history.map((t) => ({ time: formatTime(t.timestamp), it: t.itPowerMw, cooling: t.coolingPowerMw, total: t.itPowerMw + t.coolingPowerMw }))
  const thermalData = history.map((t) => ({ time: formatTime(t.timestamp), ambient: t.ambientTemperatureC, server: t.serverTemperatureC, threshold: MAX_SAFE_SERVER_TEMPERATURE_C }))
  const latest = history[history.length - 1]
  const withinThreshold = latest.serverTemperatureC <= MAX_SAFE_SERVER_TEMPERATURE_C
  return (
    <div id="telemetry" className="chart-grid">
      <Panel className="chart-panel">
        <div className="panel-heading"><div><p className="eyebrow">LIVE TELEMETRY</p><h2>Energy & Cooling Demand</h2></div><div className="segmented" role="group" aria-label="Chart range">{['6H', '24H', '7D'].map((r) => <button key={r} className={range === r ? 'selected' : ''} onClick={() => setRange(r)}>{r}</button>)}</div></div>
        <div className="legend"><span><i className="cyan" />IT power</span><span><i className="amber" />Cooling power</span><span><i className="slate" />Total energy</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={energyData}><defs><linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#35c7e6" stopOpacity={.2} /><stop offset="100%" stopColor="#35c7e6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#223146" vertical={false} /><XAxis dataKey="time" stroke="#718198" tickLine={false} axisLine={false} /><YAxis stroke="#718198" tickLine={false} axisLine={false} domain={[0, 'dataMax + 1']} /><Tooltip content={<ChartTip />} /><Area type="monotone" dataKey="it" name="IT power" stroke="#35c7e6" fill="url(#cyanFill)" strokeWidth={2} /><Line type="monotone" dataKey="cooling" name="Cooling power" stroke="#f5b74d" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="total" name="Total energy" stroke="#7890a9" strokeWidth={1.5} strokeDasharray="4 4" dot={false} /></AreaChart></ResponsiveContainer></div>
        {primaryFinding && <div className="chart-note"><span className="dot amber" />{primaryFinding.message}</div>}
      </Panel>
      <Panel className="chart-panel thermal">
        <div className="panel-heading"><div><p className="eyebrow">THERMAL ENVELOPE</p><h2>Temperature conditions</h2></div><div className="thermal-current"><strong>{latest.serverTemperatureC.toFixed(1)}°C</strong><span><span className={`dot ${withinThreshold ? 'teal' : 'amber'}`} />{withinThreshold ? 'Within threshold' : 'Above threshold'}</span></div></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={thermalData}><CartesianGrid strokeDasharray="3 3" stroke="#223146" vertical={false} /><XAxis dataKey="time" stroke="#718198" tickLine={false} axisLine={false} /><YAxis domain={[15, 40]} stroke="#718198" tickLine={false} axisLine={false} /><Tooltip content={<ChartTip />} /><Line type="monotone" dataKey="ambient" name="Ambient" stroke="#9a78e8" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="server" name="Server" stroke="#35c7e6" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="threshold" name="Safe threshold" stroke="#f06b62" strokeDasharray="5 5" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></div>
        <div className="thermal-legend"><span><i className="violet" />Ambient</span><span><i className="cyan" />Server</span><span><i className="coral" />{MAX_SAFE_SERVER_TEMPERATURE_C}°C threshold</span></div>
      </Panel>
    </div>
  )
}

function Anomaly({ finding, scenario, setScenario, onSimulate }: { finding: Finding | null; scenario: ScenarioId; setScenario: (s: ScenarioId) => void; onSimulate: () => void }) {
  const active = finding !== null
  return (
    <Panel className={`anomaly ${active ? 'critical' : ''}`}>
      <span id="anomalies" className="anchor-target" aria-hidden="true" />
      <div className="anomaly-main">
        <div className="alert-icon"><AlertTriangle size={20} /></div>
        <div>
          <div className="anomaly-meta"><span className="severity">{active ? finding!.severity.toUpperCase() : 'MONITORING'}</span><span>{active ? `Detected ${formatTime(finding!.timestamp)} WIB` : 'No active deviation'}</span></div>
          <h2>{active ? METRIC_HEADLINE[finding!.metric] : 'Telemetry tracking expected baseline'}</h2>
          <p>{active ? finding!.message : 'No active deviation requiring operator action.'}</p>
          <div className="causes">{(active ? finding!.possibleCauses : ['Baseline variation within normal range']).map((c) => <span key={c}><Check size={13} />{c}</span>)}</div>
        </div>
      </div>
      <div className="anomaly-stats">
        <div><small>Actual</small><strong>{active ? finding!.actualValue.toFixed(2) : '—'} <em>{active ? METRIC_UNIT[finding!.metric] : ''}</em></strong></div>
        <div><small>Expected</small><strong>{active ? finding!.expectedValue.toFixed(2) : '—'} <em>{active ? METRIC_UNIT[finding!.metric] : ''}</em></strong></div>
        <div><small>Deviation</small><strong className={active ? 'coral-text' : 'teal-text'}>{active ? `+${finding!.deviationPercent.toFixed(1)}%` : '—'}</strong></div>
        <div className="anomaly-actions"><button className="button secondary">View analysis</button><button className="button primary" onClick={onSimulate}>Simulate response</button></div>
      </div>
      <label className="scenario-select">
        <span>Scenario</span>
        <select value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioId)}>{scenarios.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
      </label>
    </Panel>
  )
}

function AIInsight({ findings, onActivity }: { findings: Finding[]; onActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExplainResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const explanation = await postExplainFindings(findings)
      setResult(explanation)
      onActivity({ title: `AI explanation generated (${explanation.provider})`, type: 'Analysis', tone: 'violet' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate explanation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel className="ai-panel">
      <div className="ai-heading">
        <div className="ai-icon"><BrainCircuit size={18} /></div>
        <div><p className="eyebrow">NEXUS AI ANALYSIS</p><h2>Explain the finding</h2></div>
        {result && <span className="confidence">Provider · {result.provider}</span>}
      </div>
      <div className="ai-label">AI-assisted qualitative explanation</div>
      {loading ? (
        <div className="skeleton"><span /><span /><span /></div>
      ) : error ? (
        <div className="ai-empty">{error}</div>
      ) : result ? (
        <AIExplanation text={result.explanation} />
      ) : (
        <div className="ai-empty">Run analysis to generate a qualitative explanation from the structured finding{findings.length === 1 ? '' : 's'}.</div>
      )}
      <div className="ai-footer">
        <span>Deterministic telemetry analysis</span>
        <button className="button violet-button" onClick={analyze} disabled={loading}><BrainCircuit size={15} />{loading ? 'Analyzing…' : 'Analyze findings'}</button>
      </div>
    </Panel>
  )
}

function Simulator({ scenario, current, onActivity }: { scenario: ScenarioId; current: Telemetry | null; onActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void }) {
  const baselineLoad = current?.itLoadPercent ?? 60
  const baselineAmbient = current?.ambientTemperatureC ?? 26
  const [setpoint, setSetpoint] = useState(22)
  const [workload, setWorkload] = useState(baselineLoad)
  const [ambient, setAmbient] = useState(baselineAmbient)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simulate = async (unsafe = false) => {
    setLoading(true); setError(null)
    try {
      const next = await postSimulate({
        coolingSetpointDeltaC: unsafe ? 4 : setpoint - 22,
        itWorkloadDeltaPercent: workload - baselineLoad,
        ambientTemperatureDeltaC: ambient - baselineAmbient,
      }, scenario)
      setResult(next)
      onActivity({ title: next.safety.status === 'safe' ? 'Simulation completed for review' : 'Simulation rejected by safety gate', type: next.safety.status === 'safe' ? 'Operator' : 'Safety', tone: next.safety.status === 'safe' ? 'teal' : 'coral' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed.')
    } finally {
      setLoading(false)
    }
  }
  const reset = () => { setSetpoint(22); setWorkload(baselineLoad); setAmbient(baselineAmbient); setResult(null); setError(null) }

  const workloadMin = Math.max(5, Math.round(baselineLoad - 30))
  const workloadMax = Math.min(100, Math.round(baselineLoad + 30))
  const ambientMin = Math.max(15, Math.round(baselineAmbient - 8))
  const ambientMax = Math.round(baselineAmbient + 8)

  return (
    <Panel className="simulator" id="simulator">
      <div className="panel-heading">
        <div><p className="eyebrow">DECISION SUPPORT</p><h2>What-if Optimization Simulator</h2><p className="subcopy">Test changes safely before recommending operational action.</p></div>
        <button className="button ghost" onClick={reset}><RotateCcw size={15} />Reset</button>
      </div>
      <div className="sim-body">
        <div className="controls">
          {([
            ['Cooling setpoint', setpoint, 18, 26, '°C', setSetpoint],
            ['IT workload assumption', workload, workloadMin, workloadMax, '%', setWorkload],
            ['Ambient temperature', ambient, ambientMin, ambientMax, '°C', setAmbient],
          ] as const).map(([label, value, min, max, unit, setter]) => (
            <label className="slider-field" key={label}>
              <span><b>{label}</b><strong>{value}{unit}</strong></span>
              <input type="range" min={min} max={max} value={value} onChange={(e) => setter(Number(e.target.value))} />
              <small>Range {min}{unit} — {max}{unit}</small>
            </label>
          ))}
          <div className="sim-actions">
            <button className="button secondary" onClick={() => simulate(true)} disabled={loading}>Unsafe scenario</button>
            <button className="button primary" onClick={() => simulate(false)} disabled={loading}><Play size={15} fill="currentColor" />{loading ? 'Running…' : 'Run safe simulation'}</button>
          </div>
          {error && <p className="ai-empty">{error}</p>}
        </div>
        <div className="sim-result">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key={result.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`result-card ${result.safety.status}`}>
                <div className="result-status">
                  {result.safety.status === 'safe' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                  <div><strong>{result.safety.status === 'safe' ? 'Recommended for review' : 'Rejected — safety threshold exceeded'}</strong><small>{result.safety.status === 'safe' ? 'Estimated output is within the thermal reliability gate.' : result.safety.reason}</small></div>
                </div>
                <div className="result-grid">
                  <div><small>Estimated energy change</small><strong>{result.energyDeltaMwh.toFixed(2)} MWh/hr</strong></div>
                  <div><small>Estimated water change</small><strong>{result.waterDeltaLiters.toFixed(0)} L/hr</strong></div>
                  <div><small>Cost change</small><strong>US${result.estimatedCostDeltaUsd.toFixed(2)}/hr</strong></div>
                  <div><small>Predicted temperature</small><strong>{result.safety.predictedServerTemperatureC.toFixed(1)}°C</strong></div>
                  <div><small>PUE</small><strong>{result.pueAfter.toFixed(2)}</strong></div>
                  <div><small>WUE</small><strong>{result.wueAfter.toFixed(2)} L/kWh</strong></div>
                </div>
                <div className="bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Energy', before: result.baselineEnergyMwh, after: result.simulatedEnergyMwh }, { name: 'PUE', before: result.pueBefore, after: result.pueAfter }]}><XAxis dataKey="name" stroke="#718198" tickLine={false} axisLine={false} /><YAxis hide /><Tooltip /><Bar dataKey="before" fill="#52667d" radius={[3, 3, 0, 0]} /><Bar dataKey="after" fill={result.safety.status === 'safe' ? '#35c7e6' : '#f06b62'} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
                <span className="estimate-note">Estimated simulation output · no control action executed</span>
              </motion.div>
            ) : (
              <div className="sim-placeholder"><SlidersHorizontal size={25} /><p>Adjust the controls and run a simulation to see deterministic estimates.</p></div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Panel>
  )
}

function EventFeed({ findings, activity }: { findings: Finding[]; activity: ActivityEvent[] }) {
  const items = findings.length > 0
    ? [...findings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((f) => ({
        time: formatTime(f.timestamp), title: METRIC_HEADLINE[f.metric], type: f.severity.toUpperCase(),
        tone: f.severity === 'high' || f.severity === 'medium' ? 'coral' as const : 'cyan' as const,
      }))
    : [{ time: '—', title: 'No anomalies in current window', type: 'System', tone: 'teal' as const }]
  const reportItems = [
    ...activity.map((event) => ({ time: formatTime(event.timestamp), title: event.title, type: event.type, tone: event.tone })),
    ...items,
  ].slice(0, 6)
  return (
    <Panel className="events">
      <span id="reports" className="anchor-target" aria-hidden="true" />
      <div className="panel-heading"><div><p className="eyebrow">ACTIVITY</p><h2>Recent operational events</h2></div><button className="text-button">View all activity <ChevronDown size={14} /></button></div>
      <div className="timeline">{reportItems.map((item, i) => <div className="timeline-item" key={`${item.title}-${i}`}><span className={`timeline-dot ${item.tone}`} /><time>{item.time}</time><div><strong>{item.title}</strong><small>{item.type}</small></div></div>)}</div>
    </Panel>
  )
}

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scenario, setScenario] = useState<ScenarioId>('cooling-inefficiency')
  const [data, setData] = useState<FindingsResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = window.sessionStorage.getItem('nexus-activity')
      return saved ? JSON.parse(saved) as ActivityEvent[] : []
    } catch { return [] }
  })

  const addActivity = (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const next = { ...event, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
    setActivity((previous) => {
      const updated = [next, ...previous].slice(0, 12)
      window.sessionStorage.setItem('nexus-activity', JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    let cancelled = false
    fetchFindings(scenario)
      .then((res) => { if (!cancelled) { setData(res); setFetchError(null) } })
      .catch((e) => { if (!cancelled) setFetchError(e instanceof Error ? e.message : 'Failed to load telemetry.') })
    return () => { cancelled = true }
  }, [scenario])

  const activeNav = pathname === '/dashboard' ? 'command-center' : pathname.slice(1) || 'command-center'
  const navigateTo = (id: string) => { setMobileOpen(false); router.push(`/${id === 'command-center' ? 'dashboard' : id}`) }
  const scrollSim = () => navigateTo('simulator')
  const page = activeNav as 'command-center' | 'telemetry' | 'anomalies' | 'simulator' | 'reports'
  const pageCopy = {
    'command-center': { title: 'Command Center', eyebrow: 'FACILITY SNAPSHOT', heading: 'Efficiency overview', description: 'Monitor current energy, water, and thermal performance.' },
    telemetry: { title: 'Telemetry', eyebrow: 'LIVE TELEMETRY', heading: 'Facility telemetry', description: 'Review live synthetic energy, cooling, and thermal conditions.' },
    anomalies: { title: 'Anomaly Detection', eyebrow: 'DETECTION & EXPLANATION', heading: 'Anomaly detection', description: 'Review deterministic findings and ask NEXUS AI for a qualitative explanation.' },
    simulator: { title: 'What-if Simulator', eyebrow: 'DECISION SUPPORT', heading: 'What-if optimization', description: 'Test operational changes safely before recommending action.' },
    reports: { title: 'Reports', eyebrow: 'ACTIVITY & REPORTING', heading: 'Operational reports', description: 'Review recent findings and operational events.' },
  }[page] ?? { title: 'Command Center', eyebrow: 'FACILITY SNAPSHOT', heading: 'Efficiency overview', description: 'Monitor current energy, water, and thermal performance.' }

  const current = data?.current ?? null
  const metrics = data?.metrics ?? null
  const findings = useMemo(() => data?.findings ?? [], [data])
  const history = useMemo(() => data?.history ?? [], [data])
  const primaryFinding = useMemo(
    () => findings.length > 0 ? [...findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0] : null,
    [findings],
  )

  const metricCards = useMemo(() => {
    if (!current || !metrics || history.length === 0) return []
    const findingFor = (m: Finding['metric']) => findings.find((f) => f.metric === m) ?? null
    const prev = history.length > 1 ? history[history.length - 2] : null
    const pctTrend = (curr: number, prevVal: number | null | undefined) => {
      if (prevVal === null || prevVal === undefined || prevVal === 0) return 'vs previous sample: n/a'
      const pct = ((curr - prevVal) / prevVal) * 100
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs previous sample`
    }
    const findingTrend = (f: Finding | null, fallback: string) => f ? `+${f.deviationPercent.toFixed(1)}% deviation` : fallback
    const findingTone = (f: Finding | null): 'good' | 'warn' | 'neutral' => !f ? 'good' : f.severity === 'low' ? 'neutral' : 'warn'
    const coolingFinding = findingFor('cooling_power')
    const waterFinding = findingFor('water_usage')
    const tempFinding = findingFor('server_temperature')

    return [
      { id: 'itLoad', label: 'IT Load', value: current.itLoadPercent.toFixed(1), unit: '%', trend: pctTrend(current.itLoadPercent, prev?.itLoadPercent), tone: 'neutral' as const, values: history.map((t) => t.itLoadPercent) },
      { id: 'itPower', label: 'IT Power', value: current.itPowerMw.toFixed(2), unit: 'MW', trend: pctTrend(current.itPowerMw, prev?.itPowerMw), tone: 'neutral' as const, values: history.map((t) => t.itPowerMw) },
      { id: 'coolingPower', label: 'Cooling Power', value: current.coolingPowerMw.toFixed(2), unit: 'MW', trend: findingTrend(coolingFinding, 'On expected baseline'), tone: findingTone(coolingFinding), values: history.map((t) => t.coolingPowerMw), help: 'Actual vs expected cooling power for current load & ambient' },
      { id: 'totalPower', label: 'Total Power', value: metrics.totalPowerMw.toFixed(2), unit: 'MW', trend: pctTrend(metrics.totalPowerMw, prev ? prev.itPowerMw + prev.coolingPowerMw : null), tone: 'neutral' as const, values: history.map((t) => t.itPowerMw + t.coolingPowerMw) },
      { id: 'water', label: 'Water Usage', value: current.waterUsageLiters.toFixed(0), unit: 'L / 5 min', trend: findingTrend(waterFinding, 'On expected baseline'), tone: findingTone(waterFinding), values: history.map((t) => t.waterUsageLiters) },
      { id: 'pue', label: 'PUE', value: metrics.pue.toFixed(2), unit: '', trend: 'Power Usage Effectiveness', tone: (metrics.pue <= 1.5 ? 'good' : 'warn') as 'good' | 'warn', values: history.map((t) => calculatePue(t.itPowerMw, t.coolingPowerMw)), help: 'Power Usage Effectiveness — total facility power / IT power' },
      { id: 'wue', label: 'WUE', value: metrics.wue.toFixed(2), unit: 'L/kWh', trend: 'Water Usage Effectiveness', tone: 'neutral' as const, values: history.map((t) => calculateWue(t.waterUsageLiters, t.itPowerMw)), help: 'Water Usage Effectiveness — liters per kWh of IT energy' },
      { id: 'serverTemp', label: 'Server Temp', value: current.serverTemperatureC.toFixed(1), unit: '°C', trend: findingTrend(tempFinding, 'On baseline'), tone: findingTone(tempFinding), values: history.map((t) => t.serverTemperatureC) },
    ]
  }, [current, metrics, findings, history])

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} activeNav={activeNav} onNavigate={navigateTo} findingsCount={findings.length} />
      {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <main className="main-content">
        <Header setMobileOpen={setMobileOpen} onRun={scrollSim} current={current} scenarioLabel={data?.scenario.label ?? null} title={pageCopy.title} />
        <div className="dashboard">
          {fetchError ? (
            <Panel className="sim-placeholder"><p>{fetchError}</p></Panel>
          ) : !data ? (
            <Panel className="sim-placeholder"><p>Loading telemetry…</p></Panel>
          ) : (
            <>
              {page !== 'command-center' && <div className="page-intro"><p className="eyebrow">{pageCopy.eyebrow}</p><h2>{pageCopy.heading}</h2><p>{pageCopy.description}</p></div>}
              {page === 'command-center' && <StatusStrip metrics={metrics} current={current} findingsCount={findings.length} isCritical={findings.some((finding) => finding.severity === 'high')} />}
              {(page === 'command-center' || page === 'telemetry') && <><div className="section-head"><div><p className="eyebrow">FACILITY SNAPSHOT</p><h2>Efficiency overview</h2></div><span className="data-note"><span className="dot cyan" />Synthetic demo telemetry</span></div><div className="metrics-grid">{metricCards.map(({ id, ...card }) => <MetricCard key={id} {...card} />)}</div><TelemetryCharts history={history} primaryFinding={primaryFinding} /></>}
              {(page === 'command-center' || page === 'anomalies') && <Anomaly finding={primaryFinding} scenario={scenario} setScenario={setScenario} onSimulate={scrollSim} />}
              {page === 'command-center' && <div className="insight-grid">
                <AIInsight findings={findings} onActivity={addActivity} />
                <Panel className="method-panel">
                  <div className="method-icon"><ShieldCheck size={18} /></div>
                  <p className="eyebrow">NEXUS METHOD</p>
                  <h2>Monitor → Detect → Explain → Simulate → Optimize</h2>
                  <p>Recommendations are gated by a configurable thermal reliability threshold. NEXUS supports decisions; it does not control infrastructure.</p>
                  <div className="method-steps">{['Monitor', 'Detect', 'Explain', 'Simulate', 'Optimize'].map((s, i) => <span key={s} className={i < 3 ? 'done' : ''}>{i < 3 ? <Check size={12} /> : i + 1} {s}</span>)}</div>
                </Panel>
              </div>}
              {page === 'anomalies' && <AIInsight findings={findings} onActivity={addActivity} />}
              {/* key={scenario} remounts (rather than effect-resets) the simulator's sliders/result when the scenario changes */}
              {(page === 'command-center' || page === 'simulator') && <div id="simulator"><Simulator key={scenario} scenario={scenario} current={current} onActivity={addActivity} /></div>}
              {(page === 'command-center' || page === 'reports') && <EventFeed findings={findings} activity={activity} />}
              <footer>All telemetry shown is synthetic demo data for hackathon evaluation. Simulation outputs are estimates, not guarantees of real-world savings or operational performance.</footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
