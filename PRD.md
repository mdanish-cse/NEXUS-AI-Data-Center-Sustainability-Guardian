# NEXUS — Product Requirements Document

## 1. Product Summary

NEXUS is an AI-powered data center sustainability decision-support platform focused on energy and water efficiency.

### Value proposition
> Help data center operators reduce energy and water waste while maintaining operational reliability.

## 2. Target User

Primary user:
- Data center operations / facilities operator
- Sustainability or infrastructure manager

The hackathon prototype is a decision-support tool, not an autonomous control system.

## 3. User Problem

Operators may have telemetry but lack a simple way to:
- detect abnormal resource consumption,
- understand why it is happening,
- quantify potential savings,
- test operational scenarios safely.

## 4. Product Flow

**Monitor → Detect → Explain → Simulate → Optimize**

## 5. MVP Requirements

### FR-01 — Dashboard
Display:
- current IT load
- IT power
- cooling power
- total energy
- water usage
- PUE
- WUE
- server temperature
- ambient temperature

Include time-series charts.

### FR-02 — Anomaly Detection
The system shall:
1. Establish or load an expected baseline.
2. Compare actual telemetry to the baseline.
3. Calculate deviation.
4. Classify severity.
5. Create an alert.
6. Provide possible causes.

Example:
- Actual cooling power: 1.82 MW
- Expected: 1.51 MW
- Deviation: +20.5%

### FR-03 — AI Explanation
The AI shall receive structured findings and explain:
- what happened,
- likely contributing factors,
- what should be investigated,
- possible optimization actions.

The AI must not be the source of truth for numerical calculations.

### FR-04 — What-if Simulator
Allow users to modify selected parameters, such as:
- cooling setpoint,
- IT workload,
- ambient temperature assumptions.

Show:
- estimated energy impact,
- estimated water impact,
- estimated cost impact,
- PUE/WUE change,
- thermal/reliability result.

### FR-05 — Safety Gate
If the simulated condition exceeds a configured temperature/reliability threshold:
- mark the scenario as unsafe,
- reject the optimization recommendation,
- explain why.

## 6. Non-Functional Requirements

### Simplicity
The MVP must be buildable by a two-person team in approximately 16 hours.

### Reliability
Demo-critical features should work with deterministic synthetic data.

### Transparency
Synthetic data and AI usage must be disclosed.

### Performance
Dashboard interactions should feel immediate during the demo.

### Security
API keys must never be exposed client-side. Use environment variables/server-side routes where appropriate.

## 7. Data Model

### data_centers
- id
- name
- location
- capacity_mw

### telemetry
- id
- data_center_id
- timestamp
- it_load
- it_power
- cooling_power
- ambient_temperature
- server_temperature
- water_usage

### alerts
- id
- timestamp
- type
- severity
- metric
- actual_value
- expected_value
- message

### simulations
- id
- created_at
- baseline_energy
- baseline_water
- simulated_energy
- simulated_water
- parameters
- safety_status

## 8. Synthetic Scenarios

### Normal
Normal IT workload, cooling, temperature, and water usage.

### Workload Spike
High IT load causes higher power and cooling demand.

### Cooling Inefficiency
IT workload is moderate but cooling consumption is abnormally high.

### Environmental Stress
Higher ambient temperature increases cooling demand.

### Unsafe Optimization
A simulated cooling reduction causes predicted server temperature to exceed the configured threshold.

## 9. Demo Success Criteria

The demo must show:

1. Normal data center state.
2. A detected inefficiency.
3. AI explanation.
4. User changes a parameter.
5. Simulation calculates impact.
6. Safety check passes or rejects the scenario.
7. Clear estimated energy/water impact.

## 10. Out of Scope

- Real IoT hardware
- Real data-center control
- Autonomous control
- Kubernetes
- Microservices
- Full digital twin
- Reinforcement learning
- Production-grade ML pipeline
- Mobile application
- Complex authentication/authorization

## 11. Success Metric

The project succeeds if a judge can understand within 3 minutes:
**Problem → Detection → Recommendation → Measurable Impact → Safety → Scalability**

## 12. Scalability Story

The architecture should be presented as adaptable to:
- multiple data centers,
- Batam,
- Singapore,
- other island cities in Southeast Asia.

All savings shown in the prototype must be presented as estimates/simulation results, not claims of real-world guaranteed savings.
