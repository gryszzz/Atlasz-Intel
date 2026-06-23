/* Curated semiconductor supply-chain seed (curated-reference structure). */
import { company, country, tech, rel, type SeededRelationship } from './relationshipSeed.entities'

const TW = country('TW', 'Taiwan')
const KR = country('KR', 'South Korea')
const US = country('US', 'United States')
const NL = country('NL', 'Netherlands')

const NVIDIA = company('NVIDIA')
const AMD = company('AMD')
const BROADCOM = company('Broadcom')
const APPLE = company('Apple')
const QUALCOMM = company('Qualcomm')
const TSMC = company('TSMC')
const SAMSUNG = company('Samsung')
const INTEL = company('Intel')
const ASML = company('ASML')
const APPLIED = company('Applied Materials')
const LAM = company('Lam Research')
const KLA = company('KLA')

const EUV = tech('EUV lithography')
const AI_ACCEL = tech('AI accelerators')

export const SEMICONDUCTOR_SEED: SeededRelationship[] = [
  // Fabless designers depend on TSMC as advanced-node foundry.
  rel(NVIDIA, 'fabricated_by', TSMC, 0.95, 'NVIDIA is fabless; its advanced GPUs/AI accelerators are fabricated by TSMC (public, well-documented).'),
  rel(AMD, 'fabricated_by', TSMC, 0.95, 'AMD is fabless and relies on TSMC for advanced-node CPUs/GPUs.'),
  rel(BROADCOM, 'fabricated_by', TSMC, 0.9, 'Broadcom is fabless and uses TSMC for leading-edge silicon.'),
  rel(APPLE, 'fabricated_by', TSMC, 0.95, 'Apple silicon (A/M-series) is fabricated by TSMC on leading nodes.'),
  rel(QUALCOMM, 'fabricated_by', TSMC, 0.8, 'Qualcomm uses TSMC for much of its advanced-node production.'),
  rel(QUALCOMM, 'fabricated_by', SAMSUNG, 0.55, 'Qualcomm has historically dual-sourced some nodes from Samsung Foundry.'),
  rel(NVIDIA, 'designs', AI_ACCEL, 0.95, 'NVIDIA designs AI accelerators / GPUs (its core product line).'),

  // Foundries / IDMs and where they are located.
  rel(TSMC, 'located_in', TW, 0.99, 'TSMC concentrates leading-edge fabrication in Taiwan — a recognized geographic concentration risk.'),
  rel(SAMSUNG, 'located_in', KR, 0.99, 'Samsung Foundry is centered in South Korea.'),
  rel(INTEL, 'located_in', US, 0.9, 'Intel is an IDM with major US fabrication operations.'),

  // Equipment suppliers -> foundries, and where suppliers are located.
  rel(ASML, 'supplies_equipment', TSMC, 0.95, 'ASML is the sole EUV lithography supplier; TSMC depends on it for leading nodes.'),
  rel(ASML, 'supplies_equipment', SAMSUNG, 0.9, 'ASML supplies EUV lithography to Samsung Foundry.'),
  rel(ASML, 'supplies_equipment', INTEL, 0.9, 'ASML supplies EUV lithography to Intel.'),
  rel(ASML, 'designs', EUV, 0.97, 'ASML designs and produces EUV lithography systems (effective monopoly).'),
  rel(ASML, 'located_in', NL, 0.99, 'ASML is headquartered and manufactures in the Netherlands.'),
  rel(APPLIED, 'supplies_equipment', TSMC, 0.85, 'Applied Materials supplies deposition/etch and other fab equipment to TSMC.'),
  rel(APPLIED, 'located_in', US, 0.95, 'Applied Materials is a US-based semiconductor equipment maker.'),
  rel(LAM, 'supplies_equipment', TSMC, 0.85, 'Lam Research supplies etch/deposition equipment to leading foundries.'),
  rel(LAM, 'located_in', US, 0.95, 'Lam Research is US-based.'),
  rel(KLA, 'supplies_equipment', TSMC, 0.8, 'KLA supplies process control / inspection equipment to foundries.'),
  rel(KLA, 'located_in', US, 0.95, 'KLA is US-based.'),
]
