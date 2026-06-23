/* Curated patents / assignees / technology seed (curated-reference structure). */
import { company, country, tech, sector, infra, rel, type SeededRelationship } from './relationshipSeed.entities'

const KR = country('KR', 'South Korea')
const US = country('US', 'United States')
const CN = country('CN', 'China')
const JP = country('JP', 'Japan')

const NVIDIA = company('NVIDIA')
const AMD = company('AMD')
const BROADCOM = company('Broadcom')
const TSMC = company('TSMC')
const SAMSUNG = company('Samsung')
const INTEL = company('Intel')
const ASML = company('ASML')
const SK_HYNIX = company('SK hynix')
const MICRON = company('Micron')
const TESLA = company('Tesla')
const CATL = company('CATL')
const PANASONIC = company('Panasonic')
const GE_VERNOVA = company('GE Vernova')
const CONSTELLATION = company('Constellation Energy')
const CHENIERE = company('Cheniere')

const EUV = tech('EUV lithography')
const AI_ACCEL = tech('AI accelerators')
const ADV_PACKAGING = tech('Advanced packaging')
const HBM = tech('HBM memory')
const SILICON_PHOTONICS = tech('Silicon photonics')
const BATTERY_TECH = tech('Battery technology')
const GRID_STORAGE = tech('Grid storage')
const NUCLEAR_TECH = tech('Nuclear reactor technology')
const LNG_TECH = tech('LNG liquefaction technology')
const POWER_SEMI = tech('Power semiconductors')

const SEMI_SECTOR = sector('Semiconductors')
const AI_DATACENTERS = sector('AI data centers')

const GRID = infra('Grid')
const NUCLEAR = infra('Nuclear power')
const LNG_TERMINALS = infra('LNG export terminals')

export const PATENTS_TECH_SEED: SeededRelationship[] = [
  // EUV lithography: ASML owns/develops it; it enables leading-edge chips.
  rel(EUV, 'assigned_to', ASML, 0.95, 'ASML holds the dominant EUV lithography patent portfolio and is the sole EUV system maker.'),
  rel(ASML, 'develops', EUV, 0.97, 'ASML develops EUV lithography systems.'),
  rel(EUV, 'enables', SEMI_SECTOR, 0.9, 'EUV lithography enables leading-edge (sub-7nm) chip manufacturing.'),
  rel(EUV, 'used_by', TSMC, 0.9, 'TSMC uses EUV for leading-node fabrication.'),
  rel(EUV, 'used_by', SAMSUNG, 0.8, 'Samsung Foundry uses EUV for advanced nodes.'),
  rel(EUV, 'used_by', INTEL, 0.8, 'Intel uses EUV for advanced nodes.'),

  // Advanced packaging: critical to AI accelerators.
  rel(TSMC, 'develops', ADV_PACKAGING, 0.85, 'TSMC develops advanced packaging (e.g. CoWoS) critical to AI chips.'),
  rel(INTEL, 'develops', ADV_PACKAGING, 0.8, 'Intel develops advanced packaging (Foveros/EMIB).'),
  rel(SAMSUNG, 'develops', ADV_PACKAGING, 0.75, 'Samsung develops advanced packaging capabilities.'),
  rel(ADV_PACKAGING, 'enables', AI_ACCEL, 0.85, 'Advanced packaging is critical to high-performance AI accelerators.'),
  rel(AI_ACCEL, 'depends_on', ADV_PACKAGING, 0.8, 'AI accelerators depend on advanced packaging for chiplet integration and HBM.'),

  // HBM memory: essential to AI accelerator bandwidth.
  rel(SK_HYNIX, 'develops', HBM, 0.9, 'SK hynix is the leading HBM (high-bandwidth memory) supplier.'),
  rel(SAMSUNG, 'develops', HBM, 0.85, 'Samsung develops HBM.'),
  rel(MICRON, 'develops', HBM, 0.8, 'Micron develops HBM.'),
  rel(HBM, 'assigned_to', SK_HYNIX, 0.7, 'SK hynix holds leading HBM IP and market share.'),
  rel(HBM, 'enables', AI_ACCEL, 0.9, 'HBM is essential to AI accelerator memory bandwidth.'),
  rel(AI_ACCEL, 'depends_on', HBM, 0.85, 'AI accelerators depend on HBM for memory bandwidth.'),
  rel(HBM, 'used_by', NVIDIA, 0.85, 'NVIDIA AI GPUs use HBM.'),
  rel(HBM, 'used_by', AMD, 0.8, 'AMD AI accelerators use HBM.'),
  rel(SK_HYNIX, 'located_in', KR, 0.9, 'SK hynix is based in South Korea.'),
  rel(MICRON, 'located_in', US, 0.9, 'Micron is US-based.'),

  // GPUs / AI accelerators -> AI data centers.
  rel(AMD, 'develops', AI_ACCEL, 0.85, 'AMD develops AI accelerators / GPUs.'),
  rel(AI_DATACENTERS, 'depends_on', AI_ACCEL, 0.9, 'AI data centers depend on AI accelerators for compute.'),

  // Silicon photonics -> AI networking / data centers.
  rel(BROADCOM, 'develops', SILICON_PHOTONICS, 0.8, 'Broadcom develops silicon photonics for high-speed networking.'),
  rel(INTEL, 'develops', SILICON_PHOTONICS, 0.75, 'Intel develops silicon photonics.'),
  rel(SILICON_PHOTONICS, 'enables', AI_DATACENTERS, 0.8, 'Silicon photonics enables high-bandwidth AI/data-center networking.'),

  // Battery technology -> grid storage / EVs.
  rel(CATL, 'develops', BATTERY_TECH, 0.9, 'CATL is the largest EV/grid battery maker.'),
  rel(PANASONIC, 'develops', BATTERY_TECH, 0.85, 'Panasonic develops EV battery cells.'),
  rel(TESLA, 'develops', BATTERY_TECH, 0.8, 'Tesla develops battery/cell technology.'),
  rel(BATTERY_TECH, 'enables', GRID_STORAGE, 0.85, 'Battery technology enables grid-scale storage.'),
  rel(GRID_STORAGE, 'enables', GRID, 0.7, 'Grid storage supports grid reliability and load balancing.'),
  rel(BATTERY_TECH, 'used_by', TESLA, 0.8, 'Tesla uses advanced battery technology in EVs and storage.'),
  rel(CATL, 'located_in', CN, 0.9, 'CATL is based in China.'),
  rel(PANASONIC, 'located_in', JP, 0.9, 'Panasonic is based in Japan.'),
  rel(TESLA, 'located_in', US, 0.9, 'Tesla is US-based.'),

  // Nuclear reactor + LNG liquefaction technology -> energy infrastructure (cross-seed).
  rel(GE_VERNOVA, 'develops', NUCLEAR_TECH, 0.8, 'GE Vernova develops nuclear reactor technology (e.g. BWRX-300 SMR).'),
  rel(NUCLEAR_TECH, 'enables', NUCLEAR, 0.85, 'Reactor technology enables nuclear power generation.'),
  rel(NUCLEAR_TECH, 'used_by', CONSTELLATION, 0.7, 'Constellation operates a nuclear fleet built on reactor technology.'),
  rel(LNG_TECH, 'enables', LNG_TERMINALS, 0.85, 'Liquefaction technology enables LNG export terminals.'),
  rel(CHENIERE, 'depends_on', LNG_TECH, 0.7, 'Cheniere export terminals depend on liquefaction technology.'),

  // Power semiconductors -> grid/electrification (cross-seed).
  rel(POWER_SEMI, 'enables', GRID, 0.75, 'Power semiconductors enable grid electrification and power conversion.'),
  rel(POWER_SEMI, 'used_by', TESLA, 0.7, 'EV powertrains use power semiconductors.'),
  rel(POWER_SEMI, 'used_by', GE_VERNOVA, 0.7, 'Grid/power equipment uses power semiconductors.'),
  rel(POWER_SEMI, 'depends_on', SEMI_SECTOR, 0.7, 'Power semiconductors are part of the broader semiconductor industry.'),
]
