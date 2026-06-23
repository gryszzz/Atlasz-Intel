/* Curated energy infrastructure seed (curated-reference structure). */
import { company, country, commodity, sector, infra, institution, rel, type SeededRelationship } from './relationshipSeed.entities'

const US = country('US', 'United States')
const CA = country('CA', 'Canada')
const DE = country('DE', 'Germany')
const EU = country('EU', 'Europe')

// crude oil + LNG reuse the ports/trade nodes by id.
const CRUDE = commodity('Crude oil')
const LNG = commodity('LNG')
const NATGAS = commodity('Natural gas')
const GASOLINE = commodity('Gasoline')
const ELECTRICITY = commodity('Electricity')

const REFINERIES = infra('Refineries')
const PIPELINES = infra('Pipelines')
const LNG_TERMINALS = infra('LNG export terminals')
const POWER_GEN = infra('Power generation')
const GRID = infra('Grid')
const NUCLEAR = infra('Nuclear power')

const UTILITIES = sector('Utilities')
const AI_DATACENTERS = sector('AI data centers')
const TRANSPORTATION = sector('Transportation')
const SEMI_SECTOR = sector('Semiconductors')

const EXXON = company('ExxonMobil')
const CHEVRON = company('Chevron')
const KINDER = company('Kinder Morgan')
const ENBRIDGE = company('Enbridge')
const CHENIERE = company('Cheniere')
const NEXTERA = company('NextEra Energy')
const DUKE = company('Duke Energy')
const SOUTHERN = company('Southern Company')
const CONSTELLATION = company('Constellation Energy')
const GE_VERNOVA = company('GE Vernova')
const SIEMENS_ENERGY = company('Siemens Energy')

const FERC = institution('FERC')
const NRC = institution('NRC')

export const ENERGY_SEED: SeededRelationship[] = [
  // Crude -> refineries -> gasoline -> transportation.
  rel(PIPELINES, 'transports', CRUDE, 0.85, 'Pipelines move crude oil from production basins to refineries and terminals.'),
  rel(PIPELINES, 'transports', NATGAS, 0.85, 'Pipelines move natural gas to power plants, distributors, and export terminals.'),
  rel(REFINERIES, 'refines', CRUDE, 0.9, 'Refineries convert crude oil into refined products.'),
  rel(REFINERIES, 'supplies', GASOLINE, 0.9, 'Refineries are the source of gasoline and distillate fuels.'),
  rel(TRANSPORTATION, 'depends_on', GASOLINE, 0.85, 'Road transportation depends on gasoline and diesel.'),

  // Gas / power generation / grid / utilities.
  rel(POWER_GEN, 'generates', ELECTRICITY, 0.95, 'Power generation converts fuels/renewables into electricity.'),
  rel(POWER_GEN, 'depends_on', NATGAS, 0.8, 'Gas-fired generation is a major source of US electricity.'),
  rel(NUCLEAR, 'generates', ELECTRICITY, 0.9, 'Nuclear plants generate electricity as baseload.'),
  rel(NUCLEAR, 'supplies', GRID, 0.85, 'Nuclear provides steady baseload power to the grid.'),
  rel(GRID, 'depends_on', POWER_GEN, 0.85, 'The grid depends on available power generation capacity.'),
  rel(UTILITIES, 'depends_on', GRID, 0.8, 'Utilities depend on grid transmission and distribution.'),

  // Electricity -> AI data centers -> semiconductors (cross-seed).
  rel(ELECTRICITY, 'powers', AI_DATACENTERS, 0.85, 'Data centers and AI compute run on grid electricity.'),
  rel(AI_DATACENTERS, 'depends_on', ELECTRICITY, 0.9, 'AI/data-center expansion is increasingly constrained by electricity availability.'),
  rel(AI_DATACENTERS, 'depends_on', SEMI_SECTOR, 0.85, 'AI data centers depend on advanced semiconductors (GPUs/accelerators).'),

  // LNG export.
  rel(LNG_TERMINALS, 'supplies', LNG, 0.85, 'LNG export terminals liquefy and export natural gas.'),
  rel(LNG_TERMINALS, 'gateway_for', US, 0.7, 'US LNG export terminals are the gateway for US gas to global markets.'),
  rel(CHENIERE, 'supplies', LNG, 0.9, 'Cheniere is the largest US LNG exporter.'),
  rel(CHENIERE, 'located_in', US, 0.95, 'Cheniere operates US Gulf Coast LNG export facilities.'),
  rel(EU, 'depends_on', LNG, 0.75, 'Europe increased dependence on US LNG imports after 2022.'),

  // Oil majors and pipeline operators.
  rel(EXXON, 'refines', CRUDE, 0.85, 'ExxonMobil operates major global refining capacity.'),
  rel(EXXON, 'supplies', GASOLINE, 0.75, 'ExxonMobil supplies refined fuels.'),
  rel(EXXON, 'located_in', US, 0.9, 'ExxonMobil is a US-headquartered integrated oil major.'),
  rel(CHEVRON, 'refines', CRUDE, 0.8, 'Chevron operates significant refining capacity.'),
  rel(CHEVRON, 'located_in', US, 0.9, 'Chevron is a US-headquartered integrated oil major.'),
  rel(KINDER, 'transports', NATGAS, 0.85, 'Kinder Morgan operates the largest US natural gas pipeline network.'),
  rel(KINDER, 'located_in', US, 0.9, 'Kinder Morgan is a US midstream/pipeline operator.'),
  rel(ENBRIDGE, 'transports', CRUDE, 0.85, 'Enbridge operates a major crude oil pipeline system between Canada and the US.'),
  rel(ENBRIDGE, 'located_in', CA, 0.9, 'Enbridge is headquartered in Canada.'),

  // Power generators / utilities.
  rel(NEXTERA, 'generates', ELECTRICITY, 0.85, 'NextEra is a leading US power generator, including renewables.'),
  rel(NEXTERA, 'supplies', UTILITIES, 0.7, 'NextEra is a major US utility/power producer.'),
  rel(NEXTERA, 'located_in', US, 0.9, 'NextEra Energy is US-based.'),
  rel(DUKE, 'generates', ELECTRICITY, 0.8, 'Duke Energy is a large US electric utility/generator.'),
  rel(DUKE, 'supplies', UTILITIES, 0.7, 'Duke Energy is a major US utility.'),
  rel(SOUTHERN, 'generates', ELECTRICITY, 0.8, 'Southern Company is a large US electric utility/generator.'),
  rel(CONSTELLATION, 'depends_on', NUCLEAR, 0.85, 'Constellation is the largest US nuclear plant operator.'),
  rel(CONSTELLATION, 'generates', ELECTRICITY, 0.8, 'Constellation generates electricity, largely from nuclear baseload.'),
  rel(CONSTELLATION, 'supplies', UTILITIES, 0.7, 'Constellation is a major US power producer.'),

  // Power-equipment OEMs.
  rel(GE_VERNOVA, 'supplies', POWER_GEN, 0.8, 'GE Vernova supplies gas turbines and grid equipment to generators.'),
  rel(GE_VERNOVA, 'located_in', US, 0.9, 'GE Vernova is US-based.'),
  rel(SIEMENS_ENERGY, 'supplies', POWER_GEN, 0.8, 'Siemens Energy supplies power generation technology.'),
  rel(SIEMENS_ENERGY, 'supplies', GRID, 0.7, 'Siemens Energy supplies grid/transmission technology.'),
  rel(SIEMENS_ENERGY, 'located_in', DE, 0.9, 'Siemens Energy is headquartered in Germany.'),

  // Regulators.
  rel(NUCLEAR, 'regulated_by', NRC, 0.9, 'US nuclear power is regulated by the Nuclear Regulatory Commission.'),
  rel(GRID, 'regulated_by', FERC, 0.85, 'US interstate electricity transmission is regulated by FERC.'),
  rel(PIPELINES, 'regulated_by', FERC, 0.8, 'US interstate gas pipelines are regulated by FERC.'),
  rel(NRC, 'located_in', US, 0.95, 'The NRC is a US federal regulator.'),
  rel(FERC, 'located_in', US, 0.95, 'FERC is a US federal regulator.'),
]
