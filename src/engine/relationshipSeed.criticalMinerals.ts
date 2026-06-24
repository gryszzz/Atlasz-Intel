/*
 * Critical minerals crosswalk — curated-reference structural knowledge.
 *
 * Connects critical minerals/materials to the technologies, sectors, and
 * infrastructure they feed, so a (live, source-backed) USGS mineral site whose
 * commodity node id matches a seed commodity (e.g. commodity:copper) opens
 * structural exposure chains into batteries, semiconductors, grid, nuclear,
 * solar, EVs, defense, and AI infrastructure — and from there into the existing
 * company/ETF seeds.
 *
 * DISCIPLINE: curated-reference only (SEED_TRUST), never `verified`, never live
 * evidence. Structural input relationships only — NO production volumes, reserves,
 * prices, country-dominance claims, or investment signals. Every edge carries a
 * factual structural sourceNote + confidence. This layer never contaminates the
 * live USGS mineral evidence (which remains its own source-backed event records);
 * it only adds curated connectivity keyed by shared node ids.
 */
import { commodity, company, tech, sector, infra, rel, type SeededRelationship } from './relationshipSeed.entities'

// Commodities — labels match the USGS mineral adapter's commodity node ids.
const LITHIUM = commodity('Lithium')
const COPPER = commodity('Copper')
const NICKEL = commodity('Nickel')
const COBALT = commodity('Cobalt')
const REE = commodity('Rare earth elements')
const URANIUM = commodity('Uranium')
const GRAPHITE = commodity('Graphite')
const GALLIUM = commodity('Gallium')
const GERMANIUM = commodity('Germanium')
const SILICON = commodity('Silicon')
const SILVER = commodity('Silver')
const ALUMINUM = commodity('Aluminum')
const STEEL = commodity('Steel')
const IRON_ORE = commodity('Iron ore')
const POLYSILICON = commodity('Polysilicon')

// Technologies — reuse existing labels where they already exist (battery/grid
// storage/AI accelerators/power semiconductors/nuclear reactor technology).
const BATTERY_TECH = tech('Battery technology')
const GRID_STORAGE = tech('Grid storage')
const AI_ACCEL = tech('AI accelerators')
const POWER_SEMI = tech('Power semiconductors')
const NUCLEAR_TECH = tech('Nuclear reactor technology')
const MAGNETS = tech('Permanent magnets')
const EV_MOTORS = tech('EV motors')
const SOLAR_PV = tech('Solar PV')
const RF_OPTICAL = tech('RF and optical electronics')

// Sectors / infrastructure — reuse existing labels (Semiconductors, AI data
// centers, Grid, Nuclear power) so the crosswalk threads into other seeds.
const SEMI = sector('Semiconductors')
const AI_DC = sector('AI data centers')
const EV = sector('Electric vehicles')
const DEFENSE = sector('Defense electronics')
const CONSTRUCTION = sector('Construction')
const GRID = infra('Grid')
const NUCLEAR = infra('Nuclear power')
const WIND = infra('Wind power')
const SOLAR = infra('Solar power')

// Companies / indexes — existing seed labels (deterministic ids resolve across files).
const TESLA = company('Tesla')
const MP_MATERIALS = company('MP Materials')

export const CRITICAL_MINERALS_SEED: SeededRelationship[] = [
  // --- Batteries / EVs / grid storage: lithium, nickel, cobalt, graphite ---
  rel(LITHIUM, 'enables', BATTERY_TECH, 0.92, 'Lithium is a primary input to lithium-ion battery cells.'),
  rel(NICKEL, 'enables', BATTERY_TECH, 0.85, 'Nickel is used in high-energy-density NMC/NCA cathodes.'),
  rel(COBALT, 'enables', BATTERY_TECH, 0.8, 'Cobalt is used in many lithium-ion cathode chemistries.'),
  rel(GRAPHITE, 'enables', BATTERY_TECH, 0.85, 'Graphite is the standard lithium-ion anode material.'),
  rel(BATTERY_TECH, 'enables', GRID_STORAGE, 0.85, 'Battery technology enables grid-scale storage.'),
  rel(BATTERY_TECH, 'used_by', EV, 0.9, 'EV propulsion depends on lithium-ion battery packs.'),
  rel(EV, 'depends_on', BATTERY_TECH, 0.9, 'Electric vehicles depend on battery technology.'),
  rel(TESLA, 'operates_in', EV, 0.9, 'Tesla designs and sells electric vehicles and storage.'),

  // --- Copper / aluminum: grid, transmission, electrification, data centers ---
  rel(COPPER, 'used_by', GRID, 0.9, 'Copper is the primary conductor for electrical grids and wiring.'),
  rel(COPPER, 'enables', EV, 0.8, 'EVs use substantially more copper than combustion vehicles (wiring/motors).'),
  rel(COPPER, 'used_by', AI_DC, 0.75, 'Data centers use copper extensively for power distribution and interconnect.'),
  rel(ALUMINUM, 'used_by', GRID, 0.8, 'Aluminum is used in transmission lines and conductors.'),
  rel(ALUMINUM, 'used_by', EV, 0.7, 'Aluminum is used for vehicle lightweighting.'),
  rel(ALUMINUM, 'used_by', CONSTRUCTION, 0.7, 'Aluminum is used in building and infrastructure construction.'),

  // --- Rare earths: magnets -> EV motors, wind turbines, defense ---
  rel(REE, 'enables', MAGNETS, 0.9, 'Rare earth elements (e.g. Nd, Pr, Dy) are inputs to high-strength permanent magnets.'),
  rel(MAGNETS, 'enables', EV_MOTORS, 0.85, 'Permanent magnets are used in EV traction motors.'),
  rel(MAGNETS, 'used_by', WIND, 0.8, 'Direct-drive wind turbine generators use permanent magnets.'),
  rel(MAGNETS, 'used_by', DEFENSE, 0.75, 'Permanent magnets are used in defense electronics and actuators.'),
  rel(EV_MOTORS, 'used_by', EV, 0.85, 'EV motors are core to electric vehicle drivetrains.'),
  rel(MP_MATERIALS, 'operates_in', DEFENSE, 0.6, 'MP Materials produces rare earth materials relevant to magnet/defense supply chains.'),

  // --- Uranium -> nuclear power ---
  rel(URANIUM, 'powers', NUCLEAR, 0.9, 'Uranium fuel powers nuclear fission reactors.'),
  rel(URANIUM, 'enables', NUCLEAR_TECH, 0.7, 'Reactor technology is built around uranium-fueled fission.'),

  // --- Gallium / germanium -> power semiconductors, RF/optical ---
  rel(GALLIUM, 'enables', POWER_SEMI, 0.8, 'Gallium (GaN) is used in power and RF semiconductors.'),
  rel(GALLIUM, 'enables', RF_OPTICAL, 0.75, 'Gallium arsenide/nitride are used in RF and optoelectronic devices.'),
  rel(GERMANIUM, 'enables', RF_OPTICAL, 0.75, 'Germanium is used in fiber optics, infrared optics, and some semiconductors.'),
  rel(POWER_SEMI, 'used_by', GRID, 0.75, 'Power semiconductors enable grid power conversion and electrification.'),
  rel(RF_OPTICAL, 'enables', AI_DC, 0.6, 'RF/optical components support high-speed data-center networking.'),

  // --- Silicon / polysilicon -> semiconductors, solar, AI chips ---
  rel(SILICON, 'enables', SEMI, 0.9, 'Silicon is the base substrate for most semiconductors.'),
  rel(SILICON, 'enables', POLYSILICON, 0.8, 'Polysilicon is refined high-purity silicon.'),
  rel(POLYSILICON, 'enables', SOLAR_PV, 0.85, 'Polysilicon is the feedstock for crystalline-silicon solar cells.'),
  rel(SEMI, 'enables', AI_ACCEL, 0.8, 'AI accelerators are manufactured on advanced semiconductor processes.'),
  rel(SILICON, 'enables', SOLAR_PV, 0.7, 'Silicon is the active material in mainstream solar PV.'),

  // --- Silver -> solar, electronics ---
  rel(SILVER, 'enables', SOLAR_PV, 0.8, 'Silver paste forms the conductive contacts in most solar cells.'),
  rel(SILVER, 'enables', SEMI, 0.55, 'Silver is used in electronic contacts and packaging.'),
  rel(SOLAR_PV, 'enables', SOLAR, 0.85, 'Solar PV technology enables solar power generation.'),

  // --- Steel / iron ore -> infrastructure, energy, construction ---
  rel(IRON_ORE, 'enables', STEEL, 0.95, 'Iron ore is the primary input to steelmaking.'),
  rel(STEEL, 'used_by', CONSTRUCTION, 0.85, 'Steel is fundamental to construction and infrastructure.'),
  rel(STEEL, 'used_by', GRID, 0.65, 'Steel is used in transmission towers and energy infrastructure.'),
  rel(STEEL, 'used_by', WIND, 0.7, 'Wind turbine towers and foundations use large amounts of steel.'),
]
