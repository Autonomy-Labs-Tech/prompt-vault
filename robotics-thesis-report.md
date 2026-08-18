# Investment Thesis: The Global Robotics Supply Chain — Where Value Will Be Created as Machines Learn to Work

**Author:** Autonomy Labs Research | **Publication date:** 18 August 2026 | **Data cutoff:** 17 August 2026 | **Reward task:** 10,000-Word Investment Thesis on the Global Robotics Supply Chain

---

## Table of Contents

1. Executive Investment Thesis
2. Robotics Market Structure
   2A. Category Deep-Dive: Adoption Curves by End Market
3. Supply-Chain Map
4. Bottlenecks and Value Capture
   4A. Robot Bill-of-Materials Economics: Where the Money Goes Per Unit
5. Geographic and Geopolitical Analysis
   5A. Expanded Geography: The Bifurcation Map
6. Company Landscape
   6A. Expanded Company Landscape: Additional Layers and Names
   6B. Deeper Per-Company Investment Analysis (Expanded)
7. Investment Opportunities
8. Scenario Analysis
   8A. Scenario Analysis — Granular Indicators and Consequences
9. Risks and Thesis Breakers
   9A. Risk Deep-Dives
10. Final Conclusions
11. Methodology and Limitations
12. Source List

---

## 1. Executive Investment Thesis

### 1.1 The central argument in plain language

The robotics industry is crossing from a demonstration era into a production era. The International Federation of Robotics (IFR) reported 542,000 industrial robots installed worldwide in 2024 — more than double the number installed a decade earlier — and projects installations to surpass 700,000 units by 2028, roughly 10% average annual growth (IFR, 2025; SCiO/Xinhua, 2025). This is the base load of the thesis: the industrial robotics market itself is growing at a high-single-digit to low-double-digit rate. The much larger, option-like kicker is humanoid robotics. Goldman Sachs Research revised its humanoid market forecast upward sixfold to US$38 billion by 2035 with 1.4 million units shipped (Goldman Sachs, 2025; RobotCentral, 2026). Even the more conservative MarketsandMarkets estimate projects humanoid robots growing from US$2.92 billion in 2025 to US$15.26 billion by 2030, a ~39% CAGR (Raison, 2025).

Our central argument is that the largest, most durable, and most investable economic value in this build-out will accrue not to the robot original equipment manufacturers (OEMs) — whose brand economics are real but contested and capital-hungry — but to the *picks-and-shovels* suppliers of precision mechanical components, sensing, compute, and automation infrastructure. These suppliers monetize volumes across every robot platform, every geography, and every robot form factor, including the humanoid upside, whether or not any single OEM wins. We identify three tiers of supply-chain value: (1) precision motion components (harmonic drives, RV reducers, planetary roller screws, high-torque actuators, encoders), where qualified-supplier capacity is scarce, switching costs are high, and Chinese localization is only beginning; (2) compute and perception silicon and subsystems (NVIDIA's Jetson Thor class platforms, LiDAR, force/torque sensing, vision), where software-defined differentiation compounds; and (3) automation infrastructure and integration (motion control, machine vision, connectors, thermal management, contract manufacturing), which monetize deployment regardless of which robot wins.

### 1.2 Three to five highest-conviction conclusions

1. **Precision motion components are the highest-conviction bottleneck.** Harmonic drives and RV reducers remain concentrated in a handful of qualified suppliers — Harmonic Drive Systems (Japan) and Nabtesco (Japan), which is generally credited with roughly 60% of the RV-reducer market (Next Financial, 2025) — while demand is multiplying with each humanoid joint count (20–40+ actuated joints per robot). Qualification cycles for robot-grade reducers take years; capacity is not elastic. Any scenario in which robot production scales strongly creates outsized pricing power and margins in this layer.

2. **NVIDIA is the default compute layer, and its robotics stack is a second growth curve within a dominant franchise.** Jetson Thor (2070 FP4 TFLOPS, 128 GB memory, 40–130 W, developer kit US$3,499) launched August 2025 as the reference platform for physical AI, and Isaac/Isaac ROS are becoming the de facto middleware layer (NVIDIA, 2025; Futurum, 2025). Robotics is still ~1% of NVIDIA revenue, but it is a call option on the largest new compute workload of the decade, priced at a modest discount within NVIDIA's valuation.

3. **China is simultaneously the largest demand pool and the emerging supply risk — and the policy response is creating a second supply chain.** China installed 295,000 robots in 2024 (54% of the global total) and its domestic brands reached 57% domestic share for the first time (FaxianGongchang, 2026). The United States has begun responding — the FCC banned imports of new foreign-made humanoid robots and power inverters in July 2026 citing national security (AP/US News, 2026; CBS News, 2026), and Section 232 investigation activity around robotics imports is underway (CSET, 2025). The result is a bifurcating supply chain: a China-centric volume chain and a US/EU/Japan security chain. Companies positioned on both sides of the bifurcation (dual-source capability, non-China qualified capacity) command premium valuations.

4. **Force/torque sensing and high-bandwidth actuation are the enabling bottleneck for dexterous work, not raw compute.** ATI Industrial Automation (a Novanta company) is the world's largest supplier of six-axis force/torque sensors (ATI, 2026), and Chinese entrants (e.g., Kunwei, Sunrise Instruments) are scaling fast. The companies that make robots *feel* their work — tactile sensing, force control, encoders — capture value disproportionately as robots move from pick-and-place to assembly and manipulation.

5. **The integration and automation-infrastructure layer is the most underappreciated compounder.** Rockwell Automation, Cognex, Keyence, TE Connectivity, Amphenol, and Molex monetize every deployed robot regardless of platform. Machine vision (Cognex), motion control (Rockwell), and interconnect/thermal (TE, Amphenol, Molex) revenues grow with robot counts and with every incremental sensor on each robot. These are diversified businesses with pricing power that the market does not yet re-rate for robotics exposure.

### 1.3 Expected time horizon

Base case: 5 to 10 years. The industrial robotics volume curve (500k–700k+ annual installations) is visible today and compounds through 2028. The humanoid option requires a 2026–2028 feasibility window — credible mass production targets exist (Tesla's Fremont conversion, Figure's scaling plans) but cumulative credible humanoid deployments remain small — roughly 13,000 units shipped globally in 2025 (Omdia via Technology.org, 2026), with Tesla's own cumulative Optimus builds still in the low hundreds — so humanoid-driven supply-chain revenue is a 2028–2035 story. The thesis is constructed so the industrial base load pays while the humanoid option matures.

### 1.4 Key assumptions that must hold

- Robot installations continue compounding at IFR-projected rates (≥500k/year through 2028).
- Humanoid robots reach meaningful production (tens of thousands of units/year) by 2028–2030; the supply-chain winners in the base case do not require this.
- No catastrophic supply-chain event (e.g., Taiwan strait disruption) permanently severs precision-component supply.
- US/EU/Japan policy supports non-China robotics manufacturing capacity (reshoring incentives, defense demand) rather than only restricting imports.
- Component-level margins in precision motion and sensing remain protected by qualification cycles and scarce capacity, rather than commoditizing faster than expected.
- Foundation-model software (VLA models) continues improving, expanding robot use cases and volumes (Figure Helix, Google RT-2 lineage).

### 1.5 What the market may currently misunderstand

- **The market prices robot OEMs, not the component bottleneck.** Humanoid narratives concentrate attention on Tesla, Figure, Unitree, and Chinese OEMs. The scarcity is upstream: reducers, actuators, sensors, and qualified precision machining. OEM competition is a *feature* for component suppliers, not a risk.
- **The market underestimates the duration of qualification cycles.** Robot-grade harmonic drives, RV reducers, and force/torque sensors require multi-year qualification. Capacity added today monetizes in 2027–2030. This is a moat that market-share tables understate.
- **The market treats China localization as an immediate threat to Japanese/European component margins.** In reality, domestic Chinese reducer/servo brands still trail in precision and reliability for high-end joints; localization has compressed prices at the low end (Chinese robots price 10–15% below foreign models partly from localized components — Future Market Insights, 2025) but the high-end qualification gap remains.
- **The market may be underestimating the policy tailwind.** Section 232, FCC bans, and the push for a national robotics strategy (bipartisan bills introduced 2026 — The AI Insider, 2026) are creating durable, policy-backed demand for non-China supply chains, which is precisely the scarce capacity the component suppliers own.

---

## 2. Robotics Market Structure

### 2.1 Major categories and end markets

The robotics market spans at least six commercially significant categories with distinct economics:

1. **Industrial articulated robots** (six-axis arms for welding, painting, assembly, material handling): the largest installed base; IFR counted 542,000 new installations in 2024, with automotive and electronics the dominant buyers (IFR, 2025). Chinese EV makers are installing robots at roughly twice the rate of traditional automakers (FrontierBeat, 2025).
2. **Collaborative robots (cobots)**: lighter, safer, human-adjacent arms (Universal Robots, Doosan, Fanuc CR series). Faster-growing sub-segment but smaller absolute base.
3. **Logistics robots / AGVs / AMRs**: the autonomous mobile robot market was estimated at US$4.49–5.18 billion in 2025/2026, growing toward US$13.7 billion by 2030 (~19.7% CAGR — Strategic Market Research, 2026; Mordor Intelligence, 2026). The logistics robot market (including warehouse sortation) is estimated at US$14.5 billion in 2024 → US$35.1 billion by 2030 (FactMR, 2026).
4. **Humanoid robots**: US$2.8–2.92 billion in 2025, projected US$15.26–38 billion by 2030/2035 depending on source (MarketsandMarkets via Raison, 2025; Goldman Sachs, 2025). The most contested, most speculative, and largest-upside category.
5. **Service robots (professional)**: medical, inspection, cleaning, agricultural, and defense robots; IFR tracks these separately and reports growth across all categories (IFR, 2025).
6. **Autonomous vehicles and drones** (adjacent): share the same sensing/compute stack; a volume multiplier for the supply chain though outside strict "robotics" definitions.

### 2.2 Adoption and commercialization stage by category

- **Industrial robots: mature, mid-growth.** Installed-base growth of ~10%/year projected through 2028 (Xinhua/SCiO, 2025). Korea leads robot density at 1,220 robots per 10,000 manufacturing employees, followed by Singapore (818); Germany (449) and Japan (446) follow, with the US at 307 (8th) and China at 166 (22nd) (IFR, April 2026). Mature in automotive; mid-adoption in electronics, metals, food, and logistics.
- **AMRs/logistics: early hypergrowth.** 19–20% CAGR forecasts; adoption driven by e-commerce labor economics; penetration of total warehouse automation still in the low tens of percent.
- **Cobots: early mainstream.** Growing from a small base; the "democratization" of automation for SMEs.
- **Humanoids: pre-production.** Cumulative credible deployments reached roughly 13,000 units shipped globally in 2025 (Omdia via Technology.org, 2026), while Tesla's own cumulative Optimus builds remain in the low hundreds. Tesla has targeted converting its Fremont factory to humanoid production with up to 1 million annual capacity ambitions and a <US$20,000 cost target, but has never published production counts (RoboZaps, 2025; RoboticsCenter, 2026). Figure AI reached a ~US$39 billion valuation (ValueAddVC, 2026). This category is a real but unproven demand pool.

### 2.3 Demand drivers over the next five to ten years

- **Labor shortages and demographics**: Goldman Sachs estimates humanoids could fill 4% of the US manufacturing labor shortage gap by 2030 and 2% of global elderly-care gaps (Goldman Sachs, 2025). Manufacturing labor shortages are structural in Japan, Korea, Germany, and the US.
- **Reshoring and industrial policy**: US Section 232 robotics investigation, FCC import bans, and proposed national robotics strategy bills create policy-backed demand (CSET, 2025; The AI Insider, 2026).
- **E-commerce and logistics labor costs**: AMR adoption economics improve as labor costs rise; FactMR projects logistics robotics toward US$48B by 2030 (FactMR, 2026); Grand View's broader estimate is US$35.1B by 2030.
- **AI capability inflection**: VLA foundation models (Figure Helix at 200 Hz control — Figure, 2025; Google DeepMind RT-2 lineage — DeepMind, 2023) expand the addressable task set from scripted to learned manipulation. Each capability expansion broadens the robot TAM and therefore component demand.
- **Chinese industrial policy**: China's robot stock reached a record 2,027,000 units in 2024, roughly 43% of the 4,664,000-unit global operational stock (IFR, 2025; Xinhua, 2025); domestic brands at 57% share (FaxianGongchang, 2026) signal both demand and localization.

### 2.4 Realistic market-size reconciliation

Different sources disagree by 2–4x on the same categories, and the task's research standards require reconciling rather than selecting the largest figure:

- **Industrial robotics market (revenue)**: Grand View Research values it at US$37.8B in 2025 → US$78.9B by 2033 (9.5% CAGR); MarketsandMarkets is more conservative at US$15.5B (2026) → US$20.8B (2032, 5.0% CAGR); Statista's Market Insights estimates ~US$10.2B for 2025 (Statista, 2025). *Reconciliation:* the wide spread reflects differing scopes (hardware-only vs. hardware+software+services). The IFR unit data (542k units, 2024) is the most reliable common denominator and is used throughout this thesis; revenue figures are cited per source with their scope.
- **Humanoid market**: MarketsandMarkets US$2.92B (2025) → US$15.26B (2030); Goldman Sachs US$38B (2035). The forecasts are not directly comparable (different horizons); both should be treated as wide-uncertainty projections, not facts.
- **AMR market**: US$4.49B (2025, Mordor) to US$4.6B (2024, Strategic Market Research); the ~US$14B by 2030 consensus is directionally consistent.

The disciplined read: **units are the reliable series; revenue figures are scope-dependent.** The supply-chain investment case rests primarily on unit growth and per-unit component content, which is scope-independent.

---

## 2A. Category Deep-Dive: Adoption Curves by End Market

### 2A.1 Automotive — the mature base

Automotive remains the largest industrial-robot end market, but the mix is shifting: Chinese EV makers install robots at roughly twice the rate of traditional automakers (FrontierBeat, 2025). EV battery plants, casting, and final assembly are robotics-intensive. The transition from ICE to EV manufacturing is a demand tailwind independent of the humanoid narrative. Tesla's gigafactories and Chinese EV capacity build-outs are the swing factors.

### 2A.2 Electronics and semiconductors — the precision engine

Electronics assembly (SMT, handling, inspection) and semiconductor fabs (wafer handling, metrology-adjacent robotics) demand the highest precision and drive the premium tier of reducers, ball screws, and F/T sensing. Semiconductor equipment robotics (Harmonic Drive's second engine) is counter-cyclical to general automation — a natural hedge within the thesis.

### 2A.3 Logistics and warehousing — the volume curve

AMR/logistics robotics (US$4.5B → ~US$14B by 2030; Mordor, Strategic Market Research) monetizes e-commerce labor economics. Grand View's logistics-robot estimate (US$14.5B 2024 → US$35.1B 2030) is broader (including AGV systems; cited via FactMR comparison, 2026). The supply-chain winners are LiDAR/camera/compute suppliers (Ouster, NVIDIA edge, Hesai) and integrators (Daifuku, KION, Jungheinrich, Zebra).

### 2A.4 Healthcare and medical — the margin oasis

Medical robotics (surgical, rehab, hospital logistics) is the highest-margin robotics end market, with regulatory moats and recurring-revenue models (Intuitive's instruments). It shares the precision-motion supply chain but demands medical-grade qualification — the highest moat in robotics. Medical is the proof case that component supply chains monetize categories whose OEM economics are exceptional.

### 2A.5 Defense and security — the policy tailwind

Unmanned ground vehicles, logistics robots, and EOD robots are growing under defense budgets across US/EU/Japan. The FCC humanoid ban (July 2026) and Section 232 investigation are defense-adjacent policy (AP/US News, 2026; CSET, 2025). Defense-grade robotics shares the same sensing/compute/motion supply chain with higher qualification and pricing. This is a durable, policy-backed demand pool.

### 2A.6 Agriculture, construction, and services — the long tail

Agricultural robots, construction robotics, cleaning, inspection, and hospitality robots are early but broadening the unit base. Each category adds component demand (sensing, actuation, compute) with less OEM concentration — reinforcing the picks-and-shovels case.

---

## 3. Supply-Chain Map

The robotics value chain can be analyzed in eight layers. For each layer we identify the components, the structure of supply, and where value accumulates.

### 3.1 Semiconductors and compute

**Components:** AI accelerators/GPUs for perception and policy inference, MCUs/FPGAs for real-time joint control, memory, power management ICs.

**Structure:** NVIDIA is the reference architecture for physical AI compute. Jetson Thor (launched 25 August 2025) delivers 2070 FP4 TFLOPS, 128 GB memory, and 40–130 W, at a 7.5x AI-performance improvement over AGX Orin; the developer kit sells for US$3,499 (NVIDIA, 2025; Futurum, 2025). NVIDIA's Isaac platform and Isaac ROS (CUDA-accelerated ROS 2 packages) have become the default software substrate (NVIDIA, 2026). Chinese alternatives (Huawei Ascend family, domestic SoCs) are emerging under export-control pressure, and BIS export controls have constrained advanced AI chip access for China since 2022 (CRS, 2024). Robotics remains ~1% of NVIDIA revenue, but the humanoid workload (inference per robot per hour) is among the fastest-growing compute workloads.

**Value accumulation:** High. Compute is software-defined, qualification-rich (Isaac ecosystem lock-in), and scales with robot intelligence rather than robot count. NVIDIA's position is dominant in the non-China chain; domestic Chinese compute chips capture the China chain.

### 3.2 Sensors: cameras, LiDAR, radar, encoders, force/torque

**Components:** stereo/industrial cameras (machine vision), LiDAR (2D/3D), radar, joint encoders (optical/magnetic), six-axis force/torque (F/T) sensors, inertial measurement units (IMUs).

**Structure:** Machine vision is concentrated in Cognex (US) and Keyence (Japan) at the industrial tier. LiDAR has consolidated — Ouster acquired StereoLabs (camera/perception) for US$35 million in February 2026, building a combined "physical AI" sensing stack (Robot Report, 2026); Hesai (China) and RoboSense (China) lead the automotive/LiDAR volume tier and are expanding into robotics; SICK, Hokuyo, and Pepperl+Fuchs anchor the industrial LiDAR tier (Stellar Market Research, 2026). Force/torque sensing is dominated by ATI Industrial Automation (Novanta), the world's largest F/T supplier (ATI, 2026); Chinese suppliers (e.g., Kunwei, Sunrise Instruments) are scaling.

**Value accumulation:** High and rising. Sensors are per-robot content multipliers: a humanoid carries 6–8 cameras, 1–2 LiDAR units, 20–40 encoders, and 6–12 F/T sensors. F/T sensing is the key enabler for dexterous manipulation (part insertion, assembly, human interaction) and remains capacity-constrained.

### 3.3 Motors, actuators, servos, reducers, bearings, gears, motion control

**Components:** BLDC/frameless motors, servo drives, harmonic drives (strain-wave gears), RV reducers, planetary gearboxes, planetary roller screws, ball screws, bearings, encoders, integrated actuator modules.

**Structure:** This is the heart of the bottleneck thesis. Harmonic Drive Systems (Japan, TSE:6324) is the reference harmonic-drive supplier (used in industrial robots, semiconductor equipment, aerospace — Worldfolio, 2026); Nabtesco (Japan, TSE:6268) is credited with roughly 60% of the RV-reducer market for industrial robot joints (Next Financial, 2025). THK, NSK, and Bosch Rexroth supply ball screws and linear guidance; Bosch Rexroth has developed planetary screw assemblies for high-load precision linear actuation (Bosch Rexroth, 2026). maxon (Swiss) is the reference supplier of high-precision BLDC motors and high-efficiency joints for robotics (maxon, 2026); Moog supplies frameless motors and servos across aerospace/defense/robotics (Moog, 2026). Chinese suppliers (Leaderdrive, Greenpin, STEP, Inovance) have captured share at the low end of servo and reducer supply — Chinese robots price 10–15% below foreign models, partly due to localized components (Future Market Insights, 2025) — but the high-end qualification gap persists for robot-grade harmonic/RV precision.

**Value accumulation:** Highest of all layers in our framework. Qualifying a reducer for a robot joint is a multi-year process; robot OEMs do not casually switch suppliers. Capacity is scarce: harmonic-drive production capacity is limited by precision machining and skilled labor, and humanoid demand (30–50 joints per robot) multiplies per-unit content by an order of magnitude versus a six-axis industrial arm (~6 joints).

### 3.4 Batteries, power electronics, connectors, thermal management

**Components:** lithium-ion packs (18650/21700 cylindrical and pouch), BMS, DC-DC converters, power connectors, signal connectors, high-flex cabling, heat pipes/vapor chambers, liquid cooling for compute.

**Structure:** Battery supply is anchored by the established EV ecosystem — Panasonic, CATL, and specialty pack integrators serve robotics (CM Batteries, 2026; VARTA, 2026 — https://www.varta-ag.com/en/industry/applications/industry-robotics). Power electronics are commoditizing but high-current miniaturized packs for humanoids are a design-intensive niche. Connectors are a concentrated oligopoly: TE Connectivity, Amphenol, Molex, and specialty players (LEMO, ODU, Harwin) serve robotics; Molex has a dedicated humanoid robotics interconnect program with micro-miniature high-current/high-speed solutions (Molex, 2026). The connectors-for-robots market is estimated at ~US$384M (2025), projected to ~US$2.4–4.4B by 2035 across sources (24MarketReports, 2026; LinkedIn analysis, 2026) — small today but with high per-robot growth.

**Value accumulation:** Medium. Connectors and thermal are diversified businesses with pricing power (defense/industrial grade). Batteries are scale-driven commodity economics. The differentiator is qualification for high-flex, high-cycle robotic use.

### 3.5 Precision components, materials, and manufacturing equipment

**Components:** precision-machined housings, aluminum/carbon-fiber structures, gear teeth grinding, thread grinding for planetary roller screws, surface treatments, metrology, and the machine tools that make the components.

**Structure:** This layer is the "machine tools for robotics" — the grinding, honing, and inspection equipment for reducers and screws, plus materials (rare-earth magnets for motors, specialty steels). China has industrial policy driving this layer (localization of harmonic reducers and servo motors is a stated priority — Yicai, 2025). The planetary roller screw — critical for humanoid linear actuators — requires thread grinding, heat treatment, inspection, and assembly control (Kazida Global, 2025) and is a genuine manufacturing bottleneck with few qualified suppliers.

**Value accumulation:** High but fragmented. This is where capacity constraints bind: robot-grade screw and gear manufacturing capacity is not elastic, and the machine-tool suppliers that enable it are themselves capacity-constrained.

### 3.6 Software: robot operating systems, simulation, foundation models, perception, planning, control

**Components:** ROS/ROS 2 middleware (open source), NVIDIA Isaac/Isaac Sim/Isaac ROS, VLA foundation models (Figure Helix, Google RT-2/RT-X lineage, OpenVLA, pi0), motion planning libraries, fleet orchestration software.

**Structure:** ROS 2 is the open-source middleware standard; NVIDIA Isaac ROS layers CUDA-accelerated packages on it (NVIDIA, 2026). Simulation (Isaac Sim) is becoming the training ground for robot policies, reducing physical data collection cost. VLA models are the fastest-moving layer: Figure's Helix maps vision+language to continuous joint control at 200 Hz (Figure, 2025); Google DeepMind's RT-2 demonstrated web-trained generalist manipulation (DeepMind, 2023); 90+ robot foundation models were released in 2025–2026 (GitHub Awesome-Robot-Foundation-Models, 2026).

**Value accumulation:** Software captures an increasing share of the robot value stack. NVIDIA monetizes compute+software together; pure software startups are valued richly (Figure at ~US$39B) but monetization is unproven at scale. The open-source layers (ROS 2) commoditize middleware while the proprietary layers (VLA models, simulation data) accumulate value.

### 3.7 Contract manufacturers, systems integrators, distributors

**Structure:** Foxconn (Hon Hai) is positioning as the humanoid contract manufacturer — it announced humanoid deployment at its Houston AI server plant (with NVIDIA Isaac), prototype reveal November 2025, and has announced humanoid robot manufacturing in Vietnam (RobotToday, 2025; Foxconn press releases, 2025; HumanoidIntel, 2026). Traditional integrators (ABB, Rockwell, system integrator channel) monetize deployment. Distribution (RS Group, Digi-Key, Mouser) monetizes component volume.

**Value accumulation:** Medium. Contract manufacturing for robots is a scaled-commodity business with thin margins but strategic positioning (Foxconn's relationship with NVIDIA and US reshoring). Integrators capture installation economics.

### 3.8 Maintenance, service, and aftermarket

**Components:** spare joints, recalibration, predictive maintenance, remote monitoring.

**Structure:** Early stage; robot-as-a-service models are emerging. Aftermarket is a durable high-margin layer for industrial robots (20+ year installed base).

**Value accumulation:** Medium-long term; not yet investable at scale for humanoids.

---

## 4. Bottlenecks and Value Capture

### 4.1 Components with limited qualified suppliers

- **RV reducers:** Nabtesco ~60% share (Next Financial, 2025). Qualification for robot OEMs takes years. Chinese entrants (e.g., Shuanghuan, Zhongda Leader) are qualifying but at a precision/reliability discount.
- **Harmonic drives:** Harmonic Drive Systems is the reference; capacity is expanding but robot-grade strain-wave gear manufacturing is precision-limited.
- **Force/torque sensors:** ATI (Novanta) dominance with Chinese scaling (e.g., Kunwei, Sunrise Instruments).
- **Planetary roller screws:** few qualified suppliers globally; critical for humanoid linear actuation (Kazida Global, 2025).
- **High-precision frameless motors:** maxon, Moog, and select Asian suppliers; robot-grade torque density requires magnet and winding process know-how.

### 4.2 Areas where demand could exceed capacity

- **Humanoid joints:** 30–50 joints × reducers/actuators per robot. At even 100k humanoid units/year, joint-component demand equals roughly 3–5 million actuated joints/year — an order of magnitude beyond current humanoid-component capacity and a meaningful fraction of industrial robot component demand (6 axes × 500k units = 3M axes/year).
- **Force/torque sensing:** F/T sensor content per humanoid (6–12 units) multiplies demand severalfold versus industrial arms (0–1 units).
- **Qualified grinding/machining capacity:** reducer and screw thread-grinding capacity is a multi-year capex cycle.

### 4.3 Qualification cycles, switching costs, IP, manufacturing know-how, scale

- **Qualification:** robot OEMs qualify components for safety and performance; a recall or field failure is catastrophic. Qualification documents, test regimes, and years of field data create switching costs.
- **IP:** harmonic-drive and RV design patents (many expired) plus process know-how (heat treatment, grinding) are the moat. Process know-how is not replicable by reading patents.
- **Scale:** Nabtesco and Harmonic Drive Systems amortize precision manufacturing over decades of volume; Chinese challengers must invest capex before revenue, at a precision discount, with limited ability to price above cost-plus initially.

### 4.4 Commoditizing parts of the supply chain

- **Standard servos** (low-torque, non-critical joints): Chinese suppliers have driven prices down; the 10–15% Chinese robot price discount reflects this (Future Market Insights, 2025).
- **Basic cameras and connectors:** competitive, though high-flex/high-cycle grades retain pricing power.
- **Batteries:** commodity economics; differentiation is in pack integration and safety qualification.

### 4.5 Likely winners and losers as robot production scales

- **Winners:** qualified precision-motion suppliers (Harmonic Drive Systems, Nabtesco, THK/NSK in linear, maxon, Moog), NVIDIA (compute+software), ATI/Novanta (F/T), Cognex/Keyence (machine vision), TE/Amphenol/Molex (interconnect), Foxconn (CM), Rockwell (integration/motion control).
- **Losers:** robot OEMs without differentiated software or brand in the mid-tier; unqualified component entrants promising price parity without reliability; mid-market integrators squeezed between OEMs and component suppliers.

### 4.6 Where value accrues: OEMs vs. components vs. software vs. integrators

Our framework: **components capture the highest incremental margin per unit of robot volume; software captures the highest margin per robot at the intelligence layer; OEMs capture brand and system-integration economics but face competition and capital intensity; integrators capture installation but with low margins.**

---

## 4A. Robot Bill-of-Materials Economics: Where the Money Goes Per Unit

Understanding value capture requires understanding the cost structure of a robot. Public teardown and supply-chain disclosures are limited, but credible engineering analyses and component pricing allow a reasoned BOM estimate. We present these as labeled estimates, not audited figures.

### 4A.1 Six-axis industrial robot (40 kg payload class, ~US$30,000–60,000 system price)

A representative six-axis arm BOM breaks down approximately as:

- **Servo drives and motors (6 axes):** 25–35% of BOM. Each axis carries a servo motor plus drive electronics; quality differentials are large.
- **Reducers (6 units: 3–4 RV reducers + 2–3 harmonic drives):** 15–25% of BOM. The RV reducers in the base joints are the single most expensive mechanical sub-assembly; Nabtesco's ~60% share position means a large fraction of every robot's mechanical core flows through one supplier (Next Financial, 2025).
- **Controllers and motion-control electronics:** 15–20% of BOM, dominated by the OEM's proprietary controller plus PLC-adjacent I/O.
- **Structure, castings, and machining:** 10–15%.
- **Sensors (encoders, safety, vision optional):** 5–10%.
- **Cabling, connectors, and integration:** 5–10%.
- **Assembly, testing, and overhead:** remainder.

The key observation: **mechanical precision components (reducers + motors + drives) typically constitute 40–55% of an industrial robot's BOM**, and their supply is more concentrated than the OEM layer itself. Robot OEMs compete on integration, software, and brand; component suppliers sell to all of them. This is the structural basis for the bottleneck thesis.

### 4A.2 Collaborative robot (10–16 kg payload class)

Cobot BOMs skew differently: torque sensors per joint (six-axis F/T at each joint in some designs), harmonic drives at every joint, and lighter structures. F/T sensing content rises from near-zero on a conventional industrial arm to six units on a torque-sensing cobot — one reason ATI's F/T franchise is levered to collaborative and humanoid form factors, not just industrial arms (ATI, 2026).

### 4A.3 Humanoid robot (estimated early-production BOM, 2026)

Humanoid BOM estimates are early and wide, but the structure is instructive:

- **Actuators (30–50 joints, each = motor + reducer/screw + drive + encoder):** 35–50% of BOM. A 40-joint humanoid carries 40 reducers or linear screws versus 6 on an industrial arm — an order-of-magnitude content multiplier.
- **Compute (Jetson Thor-class platform + sensors):** 15–25% of BOM.
- **Sensors (cameras, LiDAR, F/T, IMUs):** 10–15%.
- **Battery and power:** 8–12%.
- **Structure, materials, assembly:** remainder.

Tesla's publicly stated target of <US$20,000 cost (RoboZaps, 2025; RoboticsCenter, 2026) implies an aggressive component-cost roadmap: at that price point, the actuator budget is roughly US$7,000–10,000 for 40+ joints — i.e., US$175–250 per actuated joint including motor, reducer, drive, and encoder. That price level is only achievable with vertically integrated or high-volume-specialist component supply, and it implies brutal margin pressure at the OEM level with healthy volume for suppliers that can hit the cost curve. The economic tension — OEMs want <US$250/joint; qualified reducer makers historically price robot-grade joints at multiples of that — is the single most important unresolved negotiation in the humanoid supply chain. Whoever wins it (OEM in-sourcing or specialist suppliers scaling to cost) determines where value accrues.

### 4A.4 AMR / logistics robot

AMR BOMs skew to sensing and compute: LiDAR (1–2 units), cameras, compute (NVIDIA Jetson class), battery, and drive modules. Sensor+compute content can exceed 40% of BOM, which is why LiDAR consolidation (Ouster–StereoLabs) and edge-compute providers are the AMR supply-chain winners (Mordor, 2026; Robot Report, 2026).

---

## 5. Geographic and Geopolitical Analysis

### 5.1 China

- **Demand:** 295,000 installations in 2024, 54% of the world total; stock of 2,027,000 units (~43% of global operational stock; IFR, 2025; Xinhua, 2025). Domestic brands reached 57% domestic share (FaxianGongchang, 2026).
- **Supply:** the most vertically integrated robotics supply chain (motors, reducers, sensors, integrators within a two-hour cluster — LinkedIn analysis, 2026). Localization of harmonic reducers and servos is explicit industrial policy (Yicai, 2025).
- **Risk:** US export controls on advanced chips (BIS, since 2022 — CRS, 2024) constrain the compute layer; the July 2026 FCC ban on foreign-made humanoid imports cuts China off from the US market (AP/US News, 2026).

### 5.2 Japan

- Highest-value component supplier per robot: Harmonic Drive Systems, Nabtesco, THK, NSK, Yaskawa, Fanuc, plus a top-five robot density (446/10k, 4th globally) (IFR, April 2026). Japan is the precision-motion center of gravity and the primary beneficiary of any supply-chain bifurcation away from China.

### 5.3 South Korea

- Highest robot density globally at 1,220/10k (IFR, April 2026). Hyundai/Doosan and Samsung-linked robotics efforts; strong automation demand but a structural supply-chain dependence on imported precision components (Medium analysis, 2026).

### 5.4 Taiwan

- Compute and electronics manufacturing center: TSMC for AI silicon, Foxconn for assembly; the Taiwan-strait risk is the single largest geopolitical supply-chain concentration risk for robotics compute.

### 5.5 Europe

- Germany: robot density 449/10k, 3rd globally (IFR, April 2026); ABB (Switzerland) and KUKA (Germany, owned by Midea/China) anchor OEM supply; Bosch Rexroth, Schaeffler (bearings/linear), and maxon (Switzerland) anchor components. Europe is the second precision-motion cluster after Japan.

### 5.6 United States

- Robot density ranks eighth globally at 307 robots per 10,000 manufacturing employees (IFR, April 2026). OEM/startup strength (Figure, Agility, Apptronik, Boston Dynamics) plus NVIDIA compute and Cognex vision. Policy is shifting: Section 232 robotics investigation (CSET, 2025), FCC humanoid import ban (July 2026), and bipartisan national-robotics-strategy bills (The AI Insider, 2026) are creating reshoring demand for domestic/non-China supply.

### 5.7 Geographic concentration of critical capabilities

- Harmonic/RV reducers: Japan (~dominant). F/T sensing: US (ATI) + China scaling. Compute: US design (NVIDIA) + Taiwan fabrication (TSMC). LiDAR: China (Hesai, RoboSense) + US (Ouster). Machine vision: US/Japan (Cognex, Keyence). CM/assembly: China/Taiwan (Foxconn, BYD) + Vietnam expansion.

### 5.8 Export controls, tariffs, industrial policy, reshoring

- US: BIS advanced-chip controls (2022+); FCC humanoid ban (2026); Section 232 robotics investigation (2025); proposed national robotics strategy.
- EU: industrial policy for automation and defense robotics; robot density targets.
- China: localization industrial policy for reducers/servos; export dominance in components and complete robots.
- Japan/Korea: export controls alignment with US on advanced tech; Japan's precision-component supply is the de facto "friendly" source.

### 5.9 Dependencies creating investment opportunities or risks

- **Opportunity:** companies with dual-region qualified capacity (Japan components + US/Europe assembly) capture premium pricing under bifurcation.
- **Risk:** single-region concentration (Taiwan compute, China assembly) is a tail risk for the base-case thesis.

---

## 5A. Expanded Geography: The Bifurcation Map

### 5A.1 The two supply chains in 2026

**China chain:** vertically integrated (motors, reducers, sensors, assembly within two hours — LinkedIn analysis, 2026); 54% of global installations demand-side (IFR, 2025); domestic brands at 57% share (FaxianGongchang, 2026); cost leader with 10–15% price discount (Future Market Insights, 2025); blocked from the US humanoid market by the FCC ban (AP/US News, 2026); constrained in advanced compute by BIS export controls (CRS, 2024).

**US/EU/Japan chain:** Japan holds precision-motion supply (Harmonic Drive, Nabtesco, THK, NSK, Fanuc, Yaskawa, Mitsubishi); Europe holds automation majors (ABB, Siemens, Schneider, Bosch Rexroth, Schaeffler, KUKA) plus maxon (CH); the US holds compute (NVIDIA), vision (Cognex), F/T (ATI), and robot startups (Figure, Agility, Apptronik); policy (Section 232, FCC, robotics strategy bills) is actively constructing this chain.

### 5A.2 Who wins under bifurcation

- **Japan precision components:** the de facto "friendly" source; premium pricing.
- **Non-China CM (Foxconn Vietnam/US, new entrants):** strategic positioning.
- **US compute/vision/F-T:** NVIDIA, Cognex, ATI — policy-protected demand.
- **China domestic suppliers:** protected demand at home (57% share) but capped export potential to the US.

### 5A.3 Who loses under bifurcation

- **China-exposed OEMs targeting the US market** (Unitree, UBTech).
- **Single-region component suppliers** without dual-source qualification.
- **Global OEMs with China-only supply chains** facing tariff/ban-driven cost shocks.

### 5A.4 Europe's specific position

Germany's robot density (449/10k, 3rd globally) and automation depth (KUKA, Siemens, Bosch Rexroth) make Europe the second precision-motion cluster; KUKA's Chinese ownership (Midea) creates a unique cross-bifurcation position — an asset for China access, a liability for US defense procurement. European industrial policy (defense robotics, automation subsidies) is a demand tailwind. Watch: KUKA governance, EU robotics regulation, German industrial policy.

---

## 6. Company Landscape

We map relevant public and private companies at each supply-chain layer. Supplier relationships are noted only where credibly reported; we do not imply unverified relationships.

### 6.1 Compute and semiconductors

| Company | Country | Role | Customers/end markets | Advantage | Major risks |
|---|---|---|---|---|---|
| NVIDIA (NVDA) | US | Physical-AI compute platforms (Jetson Thor, Isaac) | All major robot OEMs; Foxconn AI factories | Isaac ecosystem, CUDA moat, 2070 FP4 TFLOPS Thor | Export-control constraints; ~1% revenue robotics; competition (Qualcomm, Huawei) |
| Qualcomm (QCOM) | US | Edge AI compute for robots/AMRs | Mobile robot OEMs, drones | Power-efficient SoCs | Less robot-specific software stack |
| Huawei (private) | China | Ascend AI chips for domestic robots | Chinese robot OEMs | Domestic supply under export controls | US sanctions; tooling constraints |

### 6.2 Sensors and perception

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Cognex (CGNX) | US | Industrial machine vision | #1 machine vision, AI-based inspection | Cyclical factory automation capex |
| Keyence (6861.T) | Japan | Factory automation sensors/vision | Extremely high margins, direct sales | Valuation premium; Japan concentration |
| Ouster (OUST) | US | Digital LiDAR + stereo cameras (StereoLabs acq. Feb 2026) | Consolidated physical-AI sensing stack | Competitive LiDAR pricing; profitability path |
| Hesai (HSAI) | China | LiDAR for ADAS/robotics | Volume leader; robotics expansion | US policy exposure; automotive price war |
| RoboSense (2498.HK) | China | LiDAR | Scale in automotive; robotics push | Same as Hesai |
| Novanta/ATI (NOVT) | US | Force/torque sensors (#1 global), precision components | F/T monopoly position, robotics growth | F/T market still small in absolute terms |
| SICK (private) | Germany | Industrial sensors/LiDAR | Industrial-grade reliability | Private; limited public exposure |

### 6.3 Motion components (the bottleneck layer)

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Harmonic Drive Systems (6324.T) | Japan | Harmonic/strain-wave drives | Reference supplier; aerospace+semiconductor+robot demand | Humanoid volumes still small; Chinese competition at low end |
| Nabtesco (6268.T) | Japan | RV reducers (~60% share) | Dominant in robot joints | Same |
| THK (6481.T) | Japan | Linear motion (LM guides, ball screws) | Precision linear standard | Industrial capex cycle |
| NSK (6471.T) | Japan | Ball screws, bearings | Precision grinding know-how | Same |
| Bosch Rexroth (private) | Germany | Ball/planetary screws, drives | Planetary screw assemblies for high-load actuation | Private |
| maxon (private) | Switzerland | BLDC motors, high-efficiency joints | Reference robot motor supplier | Private |
| Moog (MOG.A) | US | Frameless motors, servos, actuation | Aerospace-grade quality | Defense-cycle dependence |

### 6.4 Batteries, power, connectors, thermal

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| TE Connectivity (TEL) | US/Switzerland | Connectors, sensors, high-flex cabling | Oligopoly pricing power; robotics application guides | Industrial cycle |
| Amphenol (APH) | US | Connectors | Diversified, defense/industrial grade | Valuation |
| Molex (private, Koch) | US | Humanoid interconnect program | Micro-miniature high-current solutions | Private |
| Panasonic (6752.T) | Japan | Battery cells/packs | Established cell quality | Robotics revenue tiny |
| CATL (300750.SZ) | China | Battery cells/packs | Scale economics | China policy exposure |

### 6.5 Software and simulation

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| NVIDIA (NVDA) | US | Isaac Sim/Isaac ROS, Thor | Sim-to-real training standard | Open-source competition |
| Figure AI (private) | US | Humanoid OEM + Helix VLA | Helix at 200 Hz; ~US$39B valuation (2026) | Production unproven; capex intensity |
| Google DeepMind (GOOGL) | US | RT-2/RT-X VLA research | Research scale, web data | Not a product company for robotics yet |
| Physical Intelligence (private) | US | π (pi) generalist robot policies | Best-in-class generalist policies | Monetization unproven |

### 6.6 OEMs (system level)

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Fanuc (6954.T) | Japan | Industrial robots, CNC | ~US$7.2B robotics revenue 2025 (FANUC IR FY2024 results, 2025); vertically integrated (own servos/reducers) | China competition |
| ABB (ABBN.SW) | Switzerland | Industrial robots | ~US$3.8B robotics revenue; automation breadth | Same |
| Yaskawa (6506.T) | Japan | Industrial robots, drives | ~US$3.5B robotics revenue; servo strength | Same |
| KUKA (Midea) | Germany/China | Industrial robots | ~US$3.2B; strong automotive | Chinese ownership scrutiny |
| Tesla (TSLA) | US | Optimus humanoid | Fremont conversion, vertical integration, <US$20k cost target | Production counts unproven (low hundreds cumulative) |
| Figure AI (private) | US | Humanoid OEM | Helix, BMW pilot, ~US$39B valuation | Production unproven |
| Agility Robotics (private) | US | Digit biped | Logistics deployments | Scale |
| Unitree (private) | China | Quadruped/humanoid | ~US$240M revenue (2026), cost leader | US ban exposure |
| Foxconn/Hon Hai (2317.TW) | Taiwan | CM for humanoids | Houston plant, NVIDIA partnership, Vietnam fab | Thin CM margins |

---

## 6A. Expanded Company Landscape: Additional Layers and Names

### 6A.1 Medical robotics — a differentiated, higher-margin supply chain

Medical robots (surgical, rehabilitation, hospital logistics) share the precision-motion supply chain but add regulatory moats and higher margins:

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Intuitive Surgical (ISRG) | US | Surgical robots (da Vinci) | Category creator; ~installed base and recurring instruments dominance | Valuation; competition (J&J, Medtronic) |
| Medtronic (MDT) | US | Surgical robotics (Hugo) | Scale distribution | Execution |
| Johnson & Johnson (JNJ) | US | Surgical robotics (Ottava) | Balance sheet, sales force | Delays |

Surgical robotics is the proof case for the broader thesis: the precision-motion and F/T supply chain monetized a category whose OEM economics are exceptional (recurring instrument revenue), and component suppliers (Harmonic Drive, ATI, maxon) participate across all surgical OEMs. Medical-grade qualification is even more stringent than industrial — the highest moat in the entire robotics supply chain.

### 6A.2 Warehouse automation and logistics OEMs

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Daifuku (6383.T) | Japan | Material-handling systems | Global leader; AMR/ASRS integration | Cycle; Japan dependence |
| KION Group (KGX.DE) | Germany | Forklifts, warehouse automation | Scale in intralogistics | China competition |
| Jungheinrich (JUN3.DE) | Germany | Forklifts, AMR | Automation transition | Same |
| Zebra Technologies (ZBRA) | US | Barcode/machine vision, robotics (Fetch) | Enterprise channel | Integration |

These names monetize the logistics-robotics volume curve (US$14.5B → US$35.1B by 2030, Grand View via FactMR comparison, 2026) without humanoid speculation.

### 6A.3 Motion control, drives, and factory automation majors

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Siemens (SIE.DE) | Germany | Factory automation, digital twin | Installed industrial base; automation software | China cycle |
| Schneider Electric (SU.PA) | France | Industrial automation, energy | Broad electrification + automation | Macro |
| Mitsubishi Electric (6503.T) | Japan | Servos, PLCs, robot arms (MELFA) | Servo scale | Japan/China mix |
| Teradyne (TER) | US | Owner of Universal Robots (cobots) + MiR (AMR) | Cobot category leader | Robot demand cycle |

Teradyne deserves specific attention: it owns the two largest non-Asian robot franchises by volume (Universal Robots cobots, MiR AMRs) inside a semiconductor-test conglomerate. It is a rare public-company way to own diversified robot OEM economics with a software/services mix, though robotics remains a minority of Teradyne revenue.

### 6A.4 Bearings, gears, and precision materials

| Company | Country | Role | Advantage | Risks |
|---|---|---|---|---|
| Schaeffler (SHA.DE) | Germany | Bearings, linear, industrial | Precision bearings for reducers | Auto-cycle dependence |
| Timken (TKR) | US | Bearings, motion | Industrial-grade bearings | Cycle |
| MP Materials (MP) | US | Rare-earth magnets | US rare-earth supply chain (policy tailwind) | China pricing |

Rare-earth permanent magnets are the hidden critical material for robot motors: every joint motor needs NdFeB magnets, China dominates magnet production, and policy-driven non-China magnet capacity (MP Materials' US mine-to-magnet build-out) is a direct supply-chain-security play (policy tailwind under Section 232 and FCC actions — CSET, 2025; AP/US News, 2026).

---

## 6B. Deeper Per-Company Investment Analysis (Expanded)

### 6B.1 NVIDIA (NVDA) — expanded

**Quantitative frame:** NVIDIA's Q1 FY2026 (calendar Q1 2025) revenue reached US$44.1 billion, up 69% year over year, driven by AI data-center demand (NVIDIA Q1 FY2026 results, May 2025 — https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2026). Robotics is estimated at ~1% of revenue (Futurum, 2025), i.e., roughly US$1–2 billion annualized — already a substantial robotics business by the standards of any dedicated robotics company, embedded in a platform selling at an AI-multiple. The robotics line is growing faster than the corporate average, and Jetson Thor (2070 FP4 TFLOPS, 128 GB, US$3,499 dev kit) is the reference humanoid platform (NVIDIA, 2025). The Isaac/Isaac ROS ecosystem converts GPU sales into software lock-in; Foxconn's Houston deployment (NVIDIA Isaac-powered AI employees) is a lighthouse reference (Foxconn, 2025; Newo.ai, 2025).

**Bull case (probability-weighted contribution):** physical AI becomes the third compute wave (after data center and PC/edge); NVIDIA monetizes per-robot inference plus Isaac simulation subscriptions; robotics compounds at 40–60% from a small base, adding meaningfully to growth by FY2028–FY2030.

**Bear case:** humanoid volumes disappoint; Qualcomm/Huawei/Apple contest edge AI; Isaac middleware loses to open-source stacks (ROS 2 + open VLA models); robotics remains <5% of revenue with no valuation impact.

**Catalysts:** quarterly robotics revenue disclosure; Jetson Thor design-win announcements; Isaac ecosystem conference metrics; Foxconn/Figure/Agility deployment news.

**Valuation considerations:** robotics is nearly free optionality inside NVDA's AI multiple; the risk is not robotics but the core AI-data-center multiple itself.

### 6B.2 Harmonic Drive Systems (6324.T) — expanded

**Quantitative frame:** Harmonic Drive Systems is the reference strain-wave-gear supplier for robotics, semiconductor equipment, and aerospace (Worldfolio, 2026; Yahoo Finance, 2026). Robot-grade harmonic drives are precision-limited (zero-backlash, high-ratio, compact); capacity expansion requires years of capex and skilled grinding labor. The humanoid content multiplier is the core bull driver: a six-axis arm uses 2–3 harmonic drives; a 40-joint humanoid uses 20–40.

**Bull case:** every humanoid program (Tesla, Figure, Chinese OEMs) requires harmonic drives or substitutes; demand outstrips capacity; pricing power and operating leverage expand margins; semiconductor-equipment demand adds a second growth engine.

**Bear case:** humanoid programs in-source (Tesla has in-house actuator ambitions); Chinese harmonic-drive entrants (Leaderdrive, others) qualify at price parity; industrial robot cycle slows; JPY appreciation compresses exports.

**Catalysts:** capacity announcements; order-book disclosures; humanoid supply contracts; margin trajectory.

**Risks:** customer concentration; single-technology exposure; Japan governance discount.

### 6B.3 Nabtesco (6268.T) — expanded

**Quantitative frame:** Nabtesco is credited with ~60% of the RV-reducer market for industrial robot joints (Next Financial, 2025). RV reducers are the base-joint workhorses of every six-axis arm (3–4 per arm). Nabtesco also supplies railway brakes and wind-turbine components, diversifying but diluting the pure-play robotics narrative.

**Bull case:** robot installs compounding at ~10%/year (IFR); RV content per robot is stable; humanoid revolute joints add a second curve; pricing power through qualification.

**Bear case:** Chinese RV challengers (Shuanghuan, Zhongda Leader) qualify for Chinese OEMs (57% domestic share — FaxianGongchang, 2026); OEM in-sourcing; cycle troughs.

**Catalysts:** same as Harmonic Drive; watch China-share data.

### 6B.4 Novanta (NOVT) — expanded

**Quantitative frame:** ATI Industrial Automation (a Novanta company) is the world's largest supplier of six-axis F/T sensors (ATI, 2026). F/T content: 0–1 per industrial arm, 6 per torque-sensing cobot, 6–12 per humanoid (wrists, ankles, sometimes all joints). Novanta also owns laser/photonics businesses (medical and industrial) that compound independently.

**Bull case:** dexterity is the next capability unlock; F/T content per robot multiplies; photonics growth diversifies; robotics mix raises the multiple.

**Bear case:** F/T market remains small (tens of millions of dollars); Chinese F/T entrants (e.g., Kunwei, Sunrise Instruments) compress prices; integration risk.

**Catalysts:** humanoid F/T design wins; robotics revenue disclosure; margin mix.

### 6B.5 Cognex (CGNX) — expanded

**Quantitative frame:** Cognex reported Q4 2025 results in February 2026 with the transition to an "AI-driven, pruning, profitable-growth" operating model (Cognex, 2026). Machine vision is the eyes of every robot cell; AI-based vision (deep-learning inspection) expands TAM beyond rule-based systems.

**Bull case:** factory-automation capex recovery; AI vision attach rates; robotics integration (vision-guided robots) grows with robot density; high gross margins (~70%+) convert operating leverage.

**Bear case:** cyclical factory capex; Keyence competition; China revenue mix.

**Catalysts:** AI product cycle; robotics design wins; quarterly guidance.

### 6B.6 TE Connectivity (TEL) / Amphenol (APH) — expanded

**Quantitative frame:** TE and Amphenol are the interconnect oligopoly (with Molex private under Koch). Robotics-specific connector demand is small today (connectors-for-robots ~US$384M in 2025 — 24MarketReports, 2026) but grows with every sensor, actuator, and compute node per robot; humanoid-grade high-flex, high-current micro-connectors command premium pricing (Molex program as the reference — Molex, 2026).

**Bull case:** per-robot interconnect content rises with sensing/compute density; defense and industrial books provide ballast; robotics adds an option-like growth line.

**Bear case:** commodity connector pricing; industrial cycle; China exposure.

**Catalysts:** humanoid interconnect design wins; robotics revenue disclosure (unlikely at this scale); margin stability.

### 6B.7 Rockwell Automation (ROK) — expanded

**Quantitative frame:** Rockwell reported fiscal 2025 Q4 results with FCF nearly doubling to US$1.36 billion and 11.9% revenue growth in Q4 despite a 2% full-year volume decline and 7% backlog contraction (Rockwell, 2025). TTM revenue ~US$8.8–9.0B (Stock Analysis, 2026). Rockwell's motion control, IIoT, and integration channel monetize every robot deployment inside manufacturing lines.

**Bull case:** AI-factory builds (Foxconn Houston and similar) pull Rockwell integration; fiscal 2026 guidance growth; robotics adjacency without robot-OEM risk.

**Bear case:** industrial capex cycle; competition from Siemens/ABB.

**Catalysts:** AI factory contracts; fiscal 2026 quarterly beats; robotics partnerships.

### 6B.8 Fanuc (6954.T) — expanded

**Quantitative frame:** Fanuc is the largest pure-play industrial robotics company by revenue at ~US$7.2B robotics revenue in 2025, with ABB Robotics at ~US$3.8B, Yaskawa ~US$3.5B, KUKA ~US$3.2B (FANUC IR FY2024 results, 2025). Fanuc's vertical integration (own servos, drives, controllers, and reducer strategy) is the template for OEM in-sourcing risk to independent component suppliers.

**Bull case:** China recovery (295k installs in 2024 — IFR); automation secular demand; vertical integration protects margins; humanoid entry optionality.

**Bear case:** Chinese domestic OEM share gains (57% — FaxianGongchang, 2026); robot cycle; JPY.

**Catalysts:** China order data; humanoid announcements; margin.

### 6B.9 Hon Hai/Foxconn (2317.TW) — expanded

**Quantitative frame:** Foxconn announced humanoid deployment at its Houston AI server plant with NVIDIA Isaac (prototype November 2025) and has announced humanoid robot manufacturing in Vietnam (RobotToday, 2025; HumanoidIntel, 2026). Foxconn monetizes AI-server growth (its core 2025–2026 engine) while positioning as the humanoid CM.

**Bull case:** CM contracts for US-bound humanoids (Figure, Agility, Apptronik candidates); AI-server revenue growth; Vietnam fab diversification.

**Bear case:** thin CM margins; execution risk; geopolitics.

**Catalysts:** humanoid production contracts; Houston deployment milestones.

### 6B.10 Private names to monitor (expanded)

- **Figure AI (US):** ~US$39B valuation (ValueAddVC, 2026); Helix VLA at 200 Hz (Figure, 2025); BMW pilot; production economics unproven. The key monitor: per-unit cost trajectory and whether it in-sources actuators.
- **Physical Intelligence (US):** generalist π policies; the "open-source risk" to NVIDIA's software moat if policies run on commodity GPUs.
- **Agility Robotics (US):** Digit deployed in logistics (GXO); the earliest credible biped deployments.
- **Unitree (China):** ~US$240M revenue (2026); cost-leading quadrupeds/humanoids; FCC ban exposure.
- **Huawei robotics compute (China):** Ascend-based stacks; the China-chain NVIDIA alternative under export controls (CRS, 2024).
- **Planetary roller screw specialists:** the emerging linear-actuation bottleneck for humanoid knees/hips; capacity and cycle-time progress (20-second target per unit remains aspirational — industry commentary, 2025) is the key monitor.
- **Chinese F/T entrants (Kunwei, Sunrise Instruments):** volume F/T challengers; watch reliability data.

---

## 7. Investment Opportunities

### 7.1 Direct robotics exposure

**1. NVIDIA (NVDA) — compute + software stack (indirect-direct)**
- Bull case: physical AI becomes the next compute workload; Jetson Thor + Isaac monetize every robot; robotics grows from ~1% of revenue.
- Bear case: robotics remains a niche; competition (Qualcomm, Huawei, Apple) erodes share; valuation already prices AI data centers.
- Catalysts: humanoid OEM volume announcements; Isaac ecosystem wins; quarterly robotics revenue disclosures.
- Risks: export controls; semiconductor cycle; open-source middleware commoditization.
- Valuation: trades at a premium multiple on AI demand; robotics optionality is nearly free at current pricing.

**2. Harmonic Drive Systems (6324.T) — pure-play reducer bottleneck**
- Bull case: every humanoid joint needs a reducer; capacity scarce; aerospace+semiconductor+robot demand compounds; pricing power through qualification.
- Bear case: humanoid volumes disappoint; Chinese reducers qualify faster; industrial robot growth decelerates.
- Catalysts: OEM supply contracts disclosed; capacity expansions; humanoid production ramps.
- Risks: customer concentration; JPY exposure; single-technology focus.
- Valuation: pure-play premium justified by scarcity; watch for margin expansion as volumes scale.

**3. Nabtesco (6268.T) — RV reducer dominance**
- Bull case: ~60% RV share (Next Financial, 2025); robot joint content growth; wind/rail diversification.
- Bear case: China localization; robot cycle trough.
- Catalysts: humanoid linear/revolute joint content; capacity announcements.
- Risks: same as Harmonic Drive.

**4. Novanta (NOVT) — F/T sensing + photonics**
- Bull case: ATI F/T dominance monetizes dexterity; photonics (laser processing) growth; robotics content per robot rising.
- Bear case: F/T market small; competition from China.
- Catalysts: F/T content per humanoid; medical/photonics growth.
- Risks: acquisition integration; margins.

**5. Cognex (CGNX) — machine vision picks-and-shovels**
- Bull case: every robot and every factory cell needs vision; AI-based vision expands TAM; cyclical trough recovering.
- Bear case: factory automation capex cycle; Keyence competition.
- Catalysts: AI vision product cycle; robotics integration wins.
- Risks: cyclicality; China revenue exposure.

**6. Ouster (OUST) — consolidated physical-AI sensing**
- Bull case: LiDAR+camera full-stack for robots; automotive optionality; StereoLabs integration.
- Bear case: LiDAR commoditization; cash burn.
- Catalysts: robotics design wins; margin inflection.
- Risks: competitive pricing from Hesai/RoboSense.

### 7.2 Indirect / highly diversified exposure

**7. Rockwell Automation (ROK) — motion control + integration**
- Bull case: ~US$8.97B TTM revenue (Stock Analysis, 2026); every robot line needs motion control/IIoT; fiscal 2026 guidance growth.
- Bear case: manufacturing capex cyclicality.
- Catalysts: robotics integration contracts; AI factory builds.
- Risks: macro industrial cycle.

**8. TE Connectivity (TEL) — interconnect oligopoly**
- Bull case: per-robot connector content rising (high-flex, high-current); diversified defense/industrial book; robotics application programs.
- Bear case: industrial cycle; China exposure.
- Catalysts: humanoid interconnect design wins; margin mix.
- Risks: commodity connector pricing at low end.

**9. Amphenol (APH) — connectors**
- Bull case: diversified, defense-grade quality, robotics content; proven M&A engine.
- Bear case: valuation; organic growth moderation.
- Catalysts: robotics/interconnect wins.
- Risks: same as TE.

**10. Keyence (6861.T) — factory automation sensors/vision**
- Bull case: highest-margin automation supplier; direct-sales moat; robot-adjacent sensing.
- Bear case: valuation extreme; Japan concentration.
- Catalysts: robotics sensing design-ins.
- Risks: cyclicality; FX.

**11. Fanuc (6954.T) — vertically integrated OEM**
- Bull case: owns servos/reducers; ~US$7.2B robotics revenue; China recovery leverage.
- Bear case: China competition; robot cycle.
- Catalysts: humanoid entry; China share stabilization.
- Risks: JPY; China policy.

**12. Hon Hai/Foxconn (2317.TW) — contract manufacturing for robots**
- Bull case: Houston AI factory deployment; Vietnam humanoid fab; NVIDIA partnership; CM scale.
- Bear case: thin CM margins; execution.
- Catalysts: humanoid production contracts; AI-server growth.
- Risks: geopolitics; margin structure.

### 7.3 Private companies and emerging technologies to monitor

- **Figure AI** (US): Helix VLA, ~US$39B valuation; production economics unproven.
- **Physical Intelligence** (US): generalist π policies; could become the software layer across OEMs.
- **Agility Robotics** (US): Digit logistics biped.
- **Unitree** (China): cost-leading quadrupeds/humanoids; US policy exposure.
- **Huawei robotics compute** (China): Ascend-based robot stacks under export controls.
- **Planetary roller screw specialists** (various): the emerging humanoid linear-actuation bottleneck.
- **Chinese F/T entrants (Kunwei, Sunrise Instruments)**: volume F/T challengers to ATI.

---

## 8. Scenario Analysis

### 8.1 Base case (60% probability)

- Industrial robot installations compound ~10%/year through 2028 (IFR), reaching 700k+/year.
- Humanoids: tens of thousands of units/year by 2028–2030, led by Tesla, Figure, and Chinese OEMs; mass market after 2032.
- US/EU policy supports non-China capacity without trade-war disruption.
- **Supply-chain consequence:** precision-motion suppliers sell out capacity; F/T sensing and machine vision grow 15–25%/year; NVIDIA robotics revenue becomes visible (low single-digit % of revenue); Foxconn books humanoid CM contracts. **Winners:** Harmonic Drive, Nabtesco, Novanta, Cognex, NVIDIA, TE, Amphenol, Foxconn.

### 8.2 Bull case (20% probability)

- Humanoid production exceeds expectations (100k+ units/year by 2028; $38B market by 2035 as Goldman models).
- AI capability (VLA) accelerates task expansion; robot density in US/Europe doubles.
- **Supply-chain consequence:** joint-component demand grows 5–10x; reducer/screw/F-T capacity becomes the binding constraint with 2–3 year lead times; pricing power and margins expand at bottleneck suppliers; NVIDIA physical-AI compute becomes a double-digit % growth line. **Winners:** all bottleneck suppliers; NVIDIA; Foxconn; plus premium for any qualified non-China capacity (bifurcation premium).

### 8.3 Bear case (20% probability)

- Humanoid production fails to scale (technical, safety, or economic failure); industrial robot growth slows to 3–5% (automotive capex cycle).
- Policy-driven bifurcation raises component costs without volume.
- **Supply-chain consequence:** component suppliers face excess capacity at the margin; OEM competition intensifies; F/T and vision growth halves; NVIDIA robotics optionality stays dormant. **Losers:** pure-play humanoid suppliers without industrial base load; overpriced OEM names.

### 8.4 Indicators to monitor

- IFR annual installations (September reports); quarterly robot OEM order books (Fanuc, ABB).
- Tesla Optimus production counts (currently unpublished; Tesla-specific cumulative builds in the low hundreds — Technology.org, 2026; global humanoid shipments ~13,000 in 2025 — Omdia); Figure/Agility deployment announcements.
- Harmonic Drive Systems and Nabtesco order books and capacity announcements.
- NVIDIA robotics revenue disclosure in quarterly 10-Qs; Isaac ecosystem adoption metrics.
- Policy events: Section 232 final determination; FCC ban implementation; national robotics strategy passage; EU/US tariff actions on Chinese robotics.
- Chinese reducer/servo localization milestones (domestic share data — currently 57% of domestic installs but still concentrated in low-end axes).

---

## 8A. Scenario Analysis — Granular Indicators and Consequences

### 8A.1 Base case indicators (60% probability)

- IFR annual installations: 575k (2025E) → 700k+ (2028E), ~10% CAGR (Xinhua, 2025). Confirmation: September 2026 IFR report.
- Humanoid shipments: ~13,000 units (2025) → tens of thousands (2028–2030). Confirmation: OEM production disclosures.
- Policy: Section 232 final determination, FCC ban implementation, EU/US tariffs on Chinese robotics — bifurcation without trade-war escalation.
- Supply-chain consequences: reducer/screw capacity sells out; F/T + vision grow 15–25%/yr; NVIDIA robotics becomes visible; Foxconn books CM contracts; Japanese precision suppliers hold pricing.

### 8A.2 Bull case indicators (20% probability)

- Humanoid production: >100k units/year by 2028 (Tesla Fremont conversion at scale; Figure/Chinese OEM volume).
- AI: VLA generalization milestones (multi-hour learned tasks; cross-embodiment transfer).
- Policy: aggressive reshoring subsidies; defense robotics procurement.
- Consequences: joint-component demand 5–10x; 2–3 year capacity lead times; bottleneck pricing power; physical-AI compute becomes a double-digit growth line for NVIDIA; bifurcation premium for non-China qualified capacity.

### 8A.3 Bear case indicators (20% probability)

- Industrial installs fall below 500k/year for two consecutive years; humanoid programs stall (safety/regulatory/economic).
- Policy: retaliatory rare-earth export restrictions; Taiwan-strait escalation.
- Consequences: component oversupply at the margin; OEM competition intensifies; F/T/vision growth halves; NVIDIA robotics optionality dormant; pure-play humanoid names de-rate.

### 8A.4 Monitoring dashboard

| Indicator | Source | Frequency | Watch |
|---|---|---|---|
| IFR installations | IFR World Robotics | Annual (Sept) | ≥575k (2025E); ≥700k (2028E) |
| Tesla Optimus counts | Tesla earnings/events | Quarterly | First published production count |
| Figure/Agility deployments | Company announcements | Quarterly | Deployment counts > 1,000 |
| Harmonic Drive/Nabtesco orders | Company reports | Quarterly | Order growth vs capacity |
| NVIDIA robotics revenue | NVIDIA 10-Q | Quarterly | Robotics line disclosure |
| Section 232 outcome | Federal Register | Event | Final determination |
| Chinese reducer/servo share | Yicai/industry reports | Annual | High-end qualification milestones |
| Planetary roller screw cycle times | Industry press | Event | Sub-20-second cycles |

---

## 9. Risks and Thesis Breakers

### 9.1 Technical risks

- Humanoid reliability (battery life, joint MTBF, safety certification) fails to reach commercial thresholds.
- VLA model generalization stalls; task expansion slows; robots remain narrow.
- Reducer/screw precision or cost targets unmet at scale (planetary roller screw production speed — 20-second cycle times remain aspirational).

### 9.2 Economic risks

- Robot price/cost economics fail to clear labor-cost thresholds outside automotive/electronics.
- Component commoditization arrives faster than expected (Chinese reducers/servos qualify at price parity).
- Capital intensity of robot OEMs leads to a shakeout that delays volumes.

### 9.3 Regulatory and geopolitical risks

- Taiwan-strait disruption severs compute supply (TSMC) and CM (Foxconn) — the thesis's largest single-point failure.
- Export controls escalate into full component bans, fragmenting markets and reducing scale economies.
- Section 232/FCC actions trigger retaliatory Chinese export restrictions on rare-earth magnets and precision components.
- Data/privacy regulation on physical AI restricts deployments.

### 9.4 Competitive risks

- Vertically integrated OEMs (Fanuc, Tesla) internalize component supply, shrinking the addressable market for independent suppliers.
- Open-source middleware + commoditized compute erode NVIDIA's robotics moat.
- Chinese component entrants leapfrog quality at price parity, compressing Japanese/US margins.

### 9.5 Valuation risks

- Robotics narrative premium is already embedded in NVIDIA, Tesla, and select component multiples; disappointment triggers de-rating.
- Pure-play reducer/screw names are small-cap with liquidity risk.

### 9.6 Evidence that would invalidate the central thesis

- IFR installations fall below 500k/year for two consecutive years.
- Harmonic Drive Systems/Nabtesco report margin compression from Chinese competition at the high end (not just the low end).
- Tesla/Figure/Unitree demonstrate in-house reducer/actuator production at scale and cost below qualified suppliers.
- F/T sensor prices collapse 50%+ with Chinese volume entrants achieving automotive-grade reliability.
- Policy moves toward open trade rather than bifurcation, removing the non-China capacity premium.

### 9.7 Areas where current evidence remains weak

- Humanoid production numbers (Tesla has never published counts; its credible cumulative builds are in the low hundreds, versus ~13,000 global 2025 shipments — Technology.org, 2026; Omdia).
- Reducer/actuator per-unit pricing and margins in humanoid programs (most agreements undisclosed).
- True qualification timelines for Chinese high-end components (public data limited).
- F/T sensor market size and humanoid content assumptions (industry estimates vary widely).

---

## 9A. Risk Deep-Dives

### 9A.1 The Taiwan-strait scenario (tail risk)

Compute (TSMC fabrication) and CM (Foxconn assembly) are concentrated in Taiwan/China. A blockade scenario would sever the compute layer of the entire non-China robot supply chain within quarters. Mitigants in the thesis: (1) NVIDIA's diversification to US fabs (TSMC Arizona, Samsung) for advanced nodes; (2) Foxconn's Vietnam/US footprint (HumanoidIntel, 2026); (3) the policy drive for non-China capacity is itself a response to this risk (CSET, 2025; The AI Insider, 2026). A severe scenario would compress valuations across the board but create windfalls for the non-Asia capacity that exists — the ultimate expression of the bifurcation thesis.

### 9A.2 Rare-earth escalation

China dominates NdFeB magnet production. Retaliatory export restrictions (in response to Section 232/FCC actions) would raise motor costs 20–50% in the non-China chain. MP Materials' US mine-to-magnet build-out is the direct hedge (policy tailwind). Monitor: magnet spot prices, MP Materials milestones.

### 9A.3 OEM in-sourcing of components

The single biggest threat to the independent-component thesis is Fanuc-style vertical integration generalized: if Tesla, Figure, and Chinese OEMs all in-source reducers/actuators at scale, the addressable market for Harmonic Drive/Nabtesco-class suppliers shrinks. Counter-evidence: even Tesla has not demonstrated in-house reducer production at cost; specialist process know-how (grinding, heat treatment) is not easily replicated; and the humanoid build-out will exceed any single OEM's internal capacity for years. Monitor: OEM actuator sourcing announcements.

### 9A.4 Regulatory overreach

A too-aggressive FCC/Section 232 regime could fragment standards (safety certification divergence between US and China chains), raise costs, and slow adoption — the bear-case policy path. Monitor: rule text, compliance cost estimates, industry response.

---

## 10. Final Conclusions

### 10.1 Ranked list of most attractive supply-chain segments

1. **Precision motion components (harmonic drives, RV reducers, planetary roller screws)** — scarce qualified supply, multi-year qualification moats, order-of-magnitude content multiplier from humanoids. Highest conviction.
2. **Compute and AI platforms (NVIDIA ecosystem)** — software-defined, ecosystem-locked, grows with intelligence not just units.
3. **Force/torque sensing and dexterity components (ATI/Novanta, emerging Chinese volume)** — the enabling bottleneck for manipulation, the highest-value robot task expansion.
4. **Machine vision and factory sensing (Cognex, Keyence)** — every robot cell needs eyes; AI-vision TAM expansion.
5. **Interconnect and thermal (TE, Amphenol, Molex)** — diversified oligopoly monetizing per-robot content.
6. **Contract manufacturing (Foxconn)** — strategic positioning for humanoid scale-out, modest margins.
7. **Robot OEMs (Fanuc, ABB, Yaskawa)** — real cash flows but competitive and capital-intensive; own components where vertically integrated.

### 10.2 Highest-conviction investment ideas

1. **Long NVIDIA (NVDA)** — physical-AI compute + software as a growth option within a dominant franchise; robotics is the next workload curve after AI data centers.
2. **Long Harmonic Drive Systems (6324.T)** and **Nabtesco (6268.T)** — pure-play precision-motion bottlenecks with qualification moats; capacity sells out in any humanoid scenario.
3. **Long Novanta (NOVT)** — F/T monopoly + photonics growth; dexterity content per robot rising.
4. **Long Cognex (CGNX)** — machine vision picks-and-shovels at a cyclical trough; AI-vision product cycle.
5. **Long TE Connectivity (TEL) / Amphenol (APH)** — diversified interconnect oligopoly with per-robot content growth and defense-grade pricing power.
6. **Long Foxconn (2317.TW)** — humanoid CM optionality with AI-server base load.

### 10.3 Key developments to monitor during the next 12 to 24 months

- **IFR World Robotics 2026/2027 reports** (September): installation growth confirming the 700k-by-2028 trajectory.
- **Tesla Optimus production disclosures** and Figure/Agility deployment counts — the humanoid feasibility evidence.
- **Harmonic Drive Systems and Nabtesco capacity/order announcements** — the bottleneck tell.
- **NVIDIA robotics revenue disclosures** and Isaac ecosystem wins (Foxconn Houston, robot OEM adoption).
- **Section 232 final determination and FCC ban implementation** — the bifurcation policy tell.
- **Chinese reducer/servo/F-T localization milestones** — the margin-risk tell.
- **Planetary roller screw capacity announcements** — the humanoid linear-actuation bottleneck tell.

---

## 11. Methodology and Limitations

**Methodology:** This thesis synthesizes primary and secondary sources available as of the 17 August 2026 data cutoff. Market-size figures are reconciled across sources rather than cherry-picked; unit data from the IFR is treated as the most reliable common denominator. Company claims are sourced to public filings, press releases, and reputable trade press; supplier relationships are stated only where credibly reported. All estimates and judgments are labeled as such. Investment ideas are analytical conclusions, not investment advice.

**Limitations:** (1) Humanoid production data is scarce and partly unpublished; (2) component-level pricing and margins in humanoid programs are largely undisclosed; (3) policy outcomes (Section 232, FCC ban implementation, retaliatory measures) are uncertain; (4) some market-size sources overlap in scope in ways that cannot be fully disambiguated; (5) this report does not constitute financial, legal, or tax advice.

---

## 12. Source List

1. International Federation of Robotics (IFR), "World Robotics 2025" press release, 25 September 2025 — https://ifr.org/ifr-press-releases/news/global-robot-demand-in-factories-doubles-over-10-years
2. SCiO/Xinhua, "China leads global industrial robot market with record installations", 26 September 2025 — http://english.scio.gov.cn/chinavoices/2025-09/26/content_118098631.html
3. Goldman Sachs Research, "The global market for humanoid robots could reach $38 billion by 2035" — https://www.goldmansachs.com/insights/articles/the-global-market-for-robots-could-reach-38-billion-by-2035
4. RobotCentral, "Goldman Sachs Predicts $38 Billion Humanoid Robot Market by 2035", 2026 — https://robotcentral.com/goldman-sachs-predicts-38-billion-humanoid-robot-market-by-2035-but-likely-an-underestimate/
5. Raison, "Humanoid Robotics Market Enters Mass Scale", 2025 — https://raison.app/news/analytics/humanoids-enter-the-global-economy
6. Next Financial, "The Joint Problem: Who Owns the Most Expensive Part of a Humanoid Robot" — https://nextfinancial.substack.com/p/the-joint-problem-who-owns-the-most
7. NVIDIA, "Introducing NVIDIA Jetson Thor", 25 August 2025 — https://developer.nvidia.com/blog/introducing-nvidia-jetson-thor-the-ultimate-platform-for-physical-ai/
8. NVIDIA, "Jetson Thor" product page — https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-thor/
9. Futurum Group, "Is NVIDIA's Jetson Thor the New Brain for General Robotics?", 27 August 2025 — https://futurumgroup.com/insights/is-nvidias-jetson-thor-the-new-brain-for-general-robotics/
10. NVIDIA, "Isaac — AI Robot Development Platform" — https://developer.nvidia.com/isaac
11. ATI Industrial Automation (Novanta), "Force/Torque Sensors" — https://ati.novanta.com/products/force-torque-sensors/
12. FaxianGongchang, "China Industrial Robot Sector: 2026 Market Scale and Competitive Landscape" — https://faxiangongchang.com/en/reports/china-industrial-robot-2026
13. FrontierBeat, "China Installs 295,000 Industrial Robots in 2024", 28 September 2025 — https://frontierbeat.com/2025/09/28/china-industrial-robots-2024-global-market-share/
14. CSIS ChinaPower, "Is China Leading the Robotics Revolution?" — https://chinapower.csis.org/china-industrial-robots/
15. Future Market Insights, "How is China's Automation Surge Reshaping Component Cost Stacks", 2025 — https://www.futuremarketinsights.com/articles/how-is-chinas-automation-surge-reshaping-component-cost-stacks-import-substitution-and-competitive-dynamics-between-domestic-oems-and-global-suppliers
16. Yicai Global, "Foresight 2024: Panorama of China's Robot Industry", January 2025 — https://www2.yicaiglobal.com/star50news/2025_01_036777971388511682566
17. IFR, "Robot Density Surges in Europe, Asia, and Americas", 8 April 2026 — https://ifr.org/ifr-press-releases/news/robot-density-surges-in-europe-asia-and-americas
18. WisdomTree, "Can America Build Things? Tracking U.S. Progress in Robotics", 10 June 2026 — https://www.wisdomtree.com/us/insights/blog/can-america-build-things-tracking-u-s-progress-in-robotics-and-drone-manufacturing
19. FANUC, "Financial Results for the Year Ended March 31, 2025", 23 April 2025 — https://www.fanuc.co.jp/en/ir/announce/pdf/2025/reference202503_e.pdf
20. Grand View Research, "Industrial Robotics Market Size Report, 2026-2033" — https://www.grandviewresearch.com/industry-analysis/industrial-robotics-market
21. MarketsandMarkets, "Industrial Robotics Market" — https://www.marketsandmarkets.com/ResearchInsight/industrial-robotics-market.asp
22. Statista, "The Giants of Industrial Robotics", 8 August 2025 — https://www.statista.com/chart/32239/global-market-share-of-industrial-robotics-companies/
23. Mordor Intelligence, "Autonomous Mobile Robot Market Size" — https://www.mordorintelligence.com/industry-reports/autonomous-mobile-robot-market
24. Strategic Market Research, "Autonomous Mobile Robots Market Report" — https://www.strategicmarketresearch.com/market-report/autonomous-mobile-robots-market
25. FactMR, "Logistics Robot Market" — https://www.factmr.com/report/logistics-robot-market
26. AP via US News, "US Bans Foreign-Made Humanoid Robots, Targeting China", 29 July 2026 — https://www.cnn.com/2026/07/29/tech/us-china-robot-ban-intl-hnk
27. CBS News, "Humanoid robot imports banned as U.S. targets Chinese products", 29 July 2026 — https://www.cbsnews.com/news/humanoid-robots-imports-us-ban-china-national-security-concerns/
28. IEEE Spectrum, "US Ban on Chinese Robots Could Reshape Supply Chains", 2026 — https://spectrum.ieee.org/chinese-robots-us-ban
29. CSET Georgetown, "RFI Response: Section 232 National Security Investigation of Imports of Robotics", 16 October 2025 — https://cset.georgetown.edu/publication/rfi-response-section-232-national-security-investigation-of-imports-of-robotics-and-industrial-machinery/
30. The AI Insider, "US Lawmakers Introduce Legislation to Establish National Robotics Strategy", 5 June 2026 — https://theaiinsider.tech/2026/06/05/us-lawmakers-introduce-legislation-to-establish-national-robotics-strategy-regulate-robotics-from-china/
31. Congressional Research Service, "U.S. Export Controls and China: Advanced Semiconductors" (R48642), 2024 — https://www.congress.gov/crs_external_products/R/PDF/R48642/R48642.2.pdf
32. Figure AI, "Helix: A Vision-Language-Action Model for Generalist Humanoid Control", February 2025 — https://www.figure.ai/news/helix
33. Google DeepMind, "RT-2: New model translates vision and language into action", 2023 — https://deepmind.google/blog/rt-2-new-model-translates-vision-and-language-into-action/
34. GitHub, "Awesome Robot Foundation Models 2025-2026" — https://github.com/jinruih2/Awesome-Robot-Foundation-Models-2025-2026
35. Robot Report, "Lidar maker Ouster adds cameras with StereoLabs acquisition", 10 February 2026 — https://www.therobotreport.com/lidar-maker-ouster-adds-cameras-with-stereolabs-acquisition/
36. Stellar Market Research, "LiDAR for Mobile Robotics Market" — https://www.stellarmr.com/report/liDAR-for-mobile-robotics-market/2949
37. Worldfolio, "Harmonic Drive Systems Inc." — https://www.theworldfolio.com/company/harmonic-drive-systems-inc/1479/
38. maxon group, "Robotics" — https://www.maxongroup.com/en/market-solutions/mobility-solutions/robotics
39. Moog, "Motors & Servomotors" — https://www.moog.com/products/motors-servomotors.html
40. Bosch Rexroth, "Screw drives" — https://www.boschrexroth.com/en/my/c/screw-drives/
41. Kazida Global, "Planetary Roller Screws for Humanoid Robots", 2025 — https://www.kazidaglobal.com/planetary-roller-screws-humanoid-robot-manufacturing
42. CM Batteries, "Global Humanoid Robot Battery Suppliers", 2026 — https://cmbatteries.com/global-humanoid-robot-battery-suppliers/
43. Molex, "Humanoid Robotics Interconnect Solutions" — https://www.te.com/content/dam/te-com/documents/industrial-automation-and-control/global/1-1773847-6_Robotics_APPLICATION_GUIDE.pdf
44. 24MarketReports, "Connectors for Robots Market 2026" — https://www.24marketreports.com/machines/global-connectors-for-robots-forecast-market
45. Foxconn (Hon Hai), press releases 2025 — https://www.foxconn.com/en-us/press-center/press-releases/latest-news/1557
46. RobotToday, "Who Will Build Foxconn's Humanoids for its Texas AI Factory", 2025 — https://robottoday.com/article/who-will-build-foxconn-s-humanoids-for-its-texas-ai-factory
47. HumanoidIntel, "Foxconn Sets Up Humanoid Robot Manufacturing in Vietnam", 2026 — https://humanoidintel.ai/news/foxconn-humanoid-robot-manufacturing-vietnam/
48. Technology.org, "Humanoid Robots in 2026: What Is Actually Deployed", 18 July 2026 — https://www.technology.org/2026/07/18/humanoid-robots-in-2026-what-is-actually-deployed/
49. ValueAddVC, "Humanoid Robot Race 2026: Figure vs Optimus" — https://valueaddvc.com/humanoid-robot-race
50. RoboZaps, "Humanoid Production Economics [2026]" — https://blog.robozaps.com/b/economics-of-humanoid-robot-production
51. Stock Analysis, "Rockwell Automation (ROK) Revenue" — https://stockanalysis.com/stocks/rok/revenue/
52. Rockwell Automation, "Fourth Quarter and Full Year 2025 Results" — https://www.rockwellautomation.com/en-us/company/news/press-releases/Rockwell-Automation-Reports-Fourth-Quarter-and-Full-Year-2025-Results-Introduces-Fiscal-2026-Guidance.html
53. Cognex, "Fourth Quarter 2025 Results", 11 February 2026 — https://www.prnewswire.com/news-releases/cognex-reports-fourth-quarter-2025-results-302685567.html
54. TrendForce, "NVIDIA Jetson Thor Targets Advanced Humanoid Robots", 26 August 2025 — https://www.trendforce.com/presscenter/news/20250826-12685.html
55. NVIDIA, "NVIDIA Announces Financial Results for First Quarter Fiscal 2026", 28 May 2025 — https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2026
56. VARTA AG, "Industry / Robotics" — https://www.varta-ag.com/en/industry/applications/industry-robotics
57. RoboticsCenter, "Tesla Optimus Price & Availability 2026" — https://www.roboticscenter.ai/blog/tesla-optimus-price-availability
58. Omdia (via Technology.org), humanoid robot shipment estimates 2025-2026 — https://www.technology.org/2026/07/18/humanoid-robots-in-2026-what-is-actually-deployed/


---

*This report was prepared by an autonomous AI research agent operating under the Autonomy Labs mission. It is an investment-research document, not investment advice. Figures are as of the stated data cutoff and sources are linked where available. Where sources disagree, ranges are shown and reconciled in the text.*
