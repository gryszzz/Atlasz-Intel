/* Curated corporate structure seed (curated-reference structure). */
import { company, country, sector, tech, indexFund, rel, type SeededRelationship } from './relationshipSeed.entities'

const TW = country('TW', 'Taiwan')

const NVIDIA = company('NVIDIA')
const AMD = company('AMD')
const BROADCOM = company('Broadcom')
const APPLE = company('Apple')
const QUALCOMM = company('Qualcomm')
const TSMC = company('TSMC')
const SAMSUNG = company('Samsung')
const INTEL = company('Intel')
const ASML = company('ASML')
const SK_HYNIX = company('SK hynix')
const MICRON = company('Micron')
const TESLA = company('Tesla')
const EXXON = company('ExxonMobil')
const CHEVRON = company('Chevron')
const NEXTERA = company('NextEra Energy')
const DUKE = company('Duke Energy')
const SOUTHERN = company('Southern Company')
const CONSTELLATION = company('Constellation Energy')
const MICROSOFT = company('Microsoft')
const AMAZON = company('Amazon')
const ALPHABET = company('Alphabet')
const META = company('Meta')
const GOOGLE = company('Google')
const INSTAGRAM = company('Instagram')

const SEMI_SECTOR = sector('Semiconductors')
const ENERGY = sector('Energy')
const UTILITIES = sector('Utilities')
const TECH_SECTOR = sector('Technology')
const AI_DATACENTERS = sector('AI data centers')

const AI_ACCEL = tech('AI accelerators') // technology node (id technology:ai-accelerators), shared across seeds

const SP500 = indexFund('S&P 500')
const NASDAQ100 = indexFund('Nasdaq-100')
const SOXX = indexFund('SOXX')
const SMH = indexFund('SMH')
const XLE = indexFund('XLE')
const XLU = indexFund('XLU')
const XLK = indexFund('XLK')

export const CORPORATE_SEED: SeededRelationship[] = [
  // Supplier / customer pipes.
  rel(TSMC, 'supplier_to', NVIDIA, 0.9, 'TSMC fabricates NVIDIA’s advanced GPUs — a critical supplier relationship.'),
  rel(TSMC, 'supplier_to', AMD, 0.9, 'TSMC fabricates AMD’s advanced CPUs/GPUs.'),
  rel(TSMC, 'supplier_to', APPLE, 0.9, 'TSMC fabricates Apple silicon.'),
  rel(TSMC, 'supplier_to', QUALCOMM, 0.8, 'TSMC fabricates much of Qualcomm’s advanced silicon.'),
  rel(TSMC, 'supplier_to', BROADCOM, 0.8, 'TSMC fabricates Broadcom’s leading-edge silicon.'),
  rel(ASML, 'supplier_to', TSMC, 0.9, 'ASML supplies EUV/lithography systems to TSMC.'),
  rel(ASML, 'supplier_to', SAMSUNG, 0.8, 'ASML supplies lithography systems to Samsung Foundry.'),
  rel(ASML, 'supplier_to', INTEL, 0.8, 'ASML supplies lithography systems to Intel.'),
  rel(SK_HYNIX, 'supplier_to', NVIDIA, 0.85, 'SK hynix supplies HBM to NVIDIA.'),
  rel(SK_HYNIX, 'supplier_to', AMD, 0.8, 'SK hynix supplies HBM to AMD.'),
  rel(NVIDIA, 'customer_of', TSMC, 0.9, 'NVIDIA is a major foundry customer of TSMC.'),
  rel(NVIDIA, 'customer_of', SK_HYNIX, 0.8, 'NVIDIA is a major HBM customer of SK hynix.'),

  // Index / ETF membership (structural basket membership — never weights).
  rel(NVIDIA, 'member_of', SP500, 0.95, 'NVIDIA is a member of the S&P 500.'),
  rel(NVIDIA, 'member_of', NASDAQ100, 0.95, 'NVIDIA is a member of the Nasdaq-100.'),
  rel(NVIDIA, 'member_of', SOXX, 0.85, 'NVIDIA is held in semiconductor ETFs (SOXX).'),
  rel(NVIDIA, 'member_of', SMH, 0.85, 'NVIDIA is held in semiconductor ETFs (SMH).'),
  rel(AMD, 'member_of', SP500, 0.9, 'AMD is a member of the S&P 500.'),
  rel(AMD, 'member_of', SOXX, 0.85, 'AMD is held in semiconductor ETFs.'),
  rel(APPLE, 'member_of', SP500, 0.95, 'Apple is a member of the S&P 500.'),
  rel(APPLE, 'member_of', NASDAQ100, 0.95, 'Apple is a member of the Nasdaq-100.'),
  rel(APPLE, 'member_of', XLK, 0.85, 'Apple is held in technology-sector ETFs (XLK).'),
  rel(MICROSOFT, 'member_of', SP500, 0.95, 'Microsoft is a member of the S&P 500.'),
  rel(MICROSOFT, 'member_of', NASDAQ100, 0.95, 'Microsoft is a member of the Nasdaq-100.'),
  rel(MICROSOFT, 'member_of', XLK, 0.85, 'Microsoft is held in technology-sector ETFs (XLK).'),
  rel(AMAZON, 'member_of', SP500, 0.95, 'Amazon is a member of the S&P 500.'),
  rel(AMAZON, 'member_of', NASDAQ100, 0.95, 'Amazon is a member of the Nasdaq-100.'),
  rel(ALPHABET, 'member_of', SP500, 0.95, 'Alphabet is a member of the S&P 500.'),
  rel(ALPHABET, 'member_of', NASDAQ100, 0.95, 'Alphabet is a member of the Nasdaq-100.'),
  rel(META, 'member_of', SP500, 0.95, 'Meta is a member of the S&P 500.'),
  rel(META, 'member_of', NASDAQ100, 0.95, 'Meta is a member of the Nasdaq-100.'),
  rel(BROADCOM, 'member_of', SOXX, 0.85, 'Broadcom is held in semiconductor ETFs.'),
  rel(BROADCOM, 'member_of', SP500, 0.9, 'Broadcom is a member of the S&P 500.'),
  rel(QUALCOMM, 'member_of', SOXX, 0.85, 'Qualcomm is held in semiconductor ETFs.'),
  rel(INTEL, 'member_of', SOXX, 0.85, 'Intel is held in semiconductor ETFs.'),
  rel(INTEL, 'member_of', SP500, 0.9, 'Intel is a member of the S&P 500.'),
  rel(MICRON, 'member_of', SMH, 0.85, 'Micron is held in semiconductor ETFs.'),
  rel(MICRON, 'member_of', SOXX, 0.85, 'Micron is held in semiconductor ETFs.'),
  rel(TSMC, 'member_of', SOXX, 0.8, 'TSMC ADRs are held in semiconductor ETFs.'),
  rel(TSMC, 'member_of', SMH, 0.8, 'TSMC ADRs are held in semiconductor ETFs (SMH).'),
  rel(ASML, 'member_of', SMH, 0.8, 'ASML is held in semiconductor ETFs (SMH).'),
  rel(EXXON, 'member_of', XLE, 0.9, 'ExxonMobil is held in energy-sector ETFs (XLE).'),
  rel(EXXON, 'member_of', SP500, 0.9, 'ExxonMobil is a member of the S&P 500.'),
  rel(CHEVRON, 'member_of', XLE, 0.9, 'Chevron is held in energy-sector ETFs (XLE).'),
  rel(NEXTERA, 'member_of', XLU, 0.9, 'NextEra is held in utilities-sector ETFs (XLU).'),
  rel(DUKE, 'member_of', XLU, 0.9, 'Duke Energy is held in utilities-sector ETFs (XLU).'),
  rel(SOUTHERN, 'member_of', XLU, 0.9, 'Southern Company is held in utilities-sector ETFs (XLU).'),
  rel(CONSTELLATION, 'member_of', XLU, 0.85, 'Constellation is held in utilities-sector ETFs (XLU).'),
  rel(TESLA, 'member_of', SP500, 0.9, 'Tesla is a member of the S&P 500.'),
  rel(TESLA, 'member_of', NASDAQ100, 0.9, 'Tesla is a member of the Nasdaq-100.'),

  // ETF -> sector basket (structural), and semiconductor-ETF geographic exposure.
  rel(SOXX, 'tracks', SEMI_SECTOR, 0.85, 'SOXX is a semiconductor-sector ETF basket.'),
  rel(SMH, 'tracks', SEMI_SECTOR, 0.85, 'SMH is a semiconductor-sector ETF basket.'),
  rel(XLE, 'tracks', ENERGY, 0.85, 'XLE is an energy-sector ETF basket.'),
  rel(XLU, 'tracks', UTILITIES, 0.85, 'XLU is a utilities-sector ETF basket.'),
  rel(XLK, 'tracks', TECH_SECTOR, 0.85, 'XLK is a technology-sector ETF basket.'),
  rel(SOXX, 'holds_exposure_to', TW, 0.7, 'Semiconductor ETFs carry exposure to Taiwan-concentrated chip supply.'),
  rel(SMH, 'holds_exposure_to', TW, 0.7, 'Semiconductor ETFs carry exposure to Taiwan-concentrated chip supply.'),

  // Operating sectors.
  rel(NVIDIA, 'operates_in', SEMI_SECTOR, 0.8, 'NVIDIA operates in the semiconductor sector.'),
  rel(EXXON, 'operates_in', ENERGY, 0.9, 'ExxonMobil operates in the energy sector.'),
  rel(NEXTERA, 'operates_in', UTILITIES, 0.9, 'NextEra operates in the utilities sector.'),
  rel(MICROSOFT, 'operates_in', TECH_SECTOR, 0.9, 'Microsoft operates in the technology sector.'),

  // Parent / subsidiary.
  rel(ALPHABET, 'parent_of', GOOGLE, 0.95, 'Google is the principal operating subsidiary of Alphabet.'),
  rel(GOOGLE, 'subsidiary_of', ALPHABET, 0.95, 'Google is a subsidiary of Alphabet.'),
  rel(META, 'parent_of', INSTAGRAM, 0.9, 'Instagram is owned by Meta.'),

  // Big-tech demand on AI infrastructure (cross-seed into energy/patents).
  rel(MICROSOFT, 'depends_on', AI_DATACENTERS, 0.85, 'Microsoft’s AI/cloud (Azure) depends on data-center capacity.'),
  rel(MICROSOFT, 'depends_on', AI_ACCEL, 0.75, 'Microsoft AI services depend on AI accelerators (GPUs).'),
  rel(AMAZON, 'depends_on', AI_DATACENTERS, 0.85, 'Amazon AWS depends on data-center capacity.'),
  rel(ALPHABET, 'depends_on', AI_DATACENTERS, 0.8, 'Google Cloud depends on data-center capacity.'),
  rel(META, 'depends_on', AI_DATACENTERS, 0.8, 'Meta’s AI infrastructure depends on data-center capacity.'),
]
