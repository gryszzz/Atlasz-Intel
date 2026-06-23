/* Curated ports / trade / chokepoints seed (curated-reference structure). */
import { company, country, port, chokepoint, route, commodity, sector, rel, type SeededRelationship } from './relationshipSeed.entities'

const TW = country('TW', 'Taiwan')
const US = country('US', 'United States')
const NL = country('NL', 'Netherlands')
const CN = country('CN', 'China')
const SG = country('SG', 'Singapore')
const EG = country('EG', 'Egypt')
const PA = country('PA', 'Panama')
const DK = country('DK', 'Denmark')

const LA = port('Port of Los Angeles')
const LB = port('Port of Long Beach')
const SHANGHAI = port('Port of Shanghai')
const NINGBO = port('Port of Ningbo-Zhoushan')
const SG_PORT = port('Port of Singapore')
const ROTTERDAM = port('Port of Rotterdam')

const MALACCA = chokepoint('Strait of Malacca')
const SUEZ = chokepoint('Suez Canal')
const PANAMA = chokepoint('Panama Canal')
const ROUTE_ASIA_EUROPE = route('Asia–Europe (via Suez)')
const ROUTE_ASIA_USEAST = route('Asia–US East Coast')

const CONTAINER = commodity('Containerized goods')
const CRUDE = commodity('Crude oil')
const LNG = commodity('LNG')
const RETAIL = sector('Retail')
const ENERGY = sector('Energy')
const SEMI_SECTOR = sector('Semiconductors')
const CONTAINER_SHIPPING = sector('Container shipping')

const MAERSK = company('Maersk')
const MSC = company('MSC')
const COSCO = company('COSCO')
const WALMART = company('Walmart')
const TARGET = company('Target')
const HOME_DEPOT = company('Home Depot')

export const PORTS_TRADE_SEED: SeededRelationship[] = [
  // Ports -> country (location) and the trade they gateway.
  rel(LA, 'located_in', US, 0.99, 'The Port of Los Angeles is in San Pedro Bay, California, USA.'),
  rel(LB, 'located_in', US, 0.99, 'The Port of Long Beach adjoins the Port of LA in California, USA.'),
  rel(SHANGHAI, 'located_in', CN, 0.99, 'The Port of Shanghai is in China.'),
  rel(NINGBO, 'located_in', CN, 0.99, 'The Port of Ningbo-Zhoushan is in China.'),
  rel(SG_PORT, 'located_in', SG, 0.99, 'The Port of Singapore is in Singapore.'),
  rel(ROTTERDAM, 'located_in', NL, 0.99, 'The Port of Rotterdam is in the Netherlands.'),
  rel(LA, 'gateway_for', US, 0.9, 'The LA/Long Beach complex is the largest containerized-import gateway into the United States.'),
  rel(LB, 'gateway_for', US, 0.9, 'Long Beach is part of the largest US container-import gateway complex.'),
  rel(SHANGHAI, 'gateway_for', CN, 0.9, 'Shanghai is the world’s busiest container port and a primary China export gateway.'),
  rel(ROTTERDAM, 'gateway_for', NL, 0.85, 'Rotterdam is Europe’s largest seaport and a primary EU import gateway.'),
  rel(SG_PORT, 'gateway_for', SG, 0.85, 'Singapore is a leading global transshipment hub.'),

  // Ports transport commodities.
  rel(LA, 'transports', CONTAINER, 0.9, 'LA/Long Beach handles a large share of US containerized imports.'),
  rel(SHANGHAI, 'transports', CONTAINER, 0.9, 'Shanghai moves a large share of China’s containerized exports.'),

  // Trade routes route through chokepoints.
  rel(ROUTE_ASIA_EUROPE, 'routes_through', SUEZ, 0.95, 'Asia–Europe container and energy trade transits the Suez Canal / Red Sea corridor.'),
  rel(ROUTE_ASIA_USEAST, 'routes_through', PANAMA, 0.85, 'Asia–US East Coast container services commonly transit the Panama Canal.'),
  rel(SUEZ, 'located_in', EG, 0.95, 'The Suez Canal is in Egypt.'),
  rel(PANAMA, 'located_in', PA, 0.95, 'The Panama Canal is in Panama.'),

  // Dependencies on chokepoints/ports (exposure structure).
  rel(CN, 'depends_on', MALACCA, 0.85, 'A large share of China’s seaborne crude oil and trade transits the Strait of Malacca.'),
  rel(ENERGY, 'depends_on', MALACCA, 0.8, 'A major share of seaborne crude/LNG to East Asia transits the Strait of Malacca.'),
  rel(ROUTE_ASIA_EUROPE, 'depends_on', SUEZ, 0.9, 'The Asia–Europe route depends on Suez transit; disruption forces longer routings around Africa.'),
  rel(RETAIL, 'depends_on', LA, 0.75, 'US retail import flows depend heavily on West Coast (LA/Long Beach) port throughput.'),

  // Commodities transit chokepoints.
  rel(MALACCA, 'transports', CRUDE, 0.85, 'The Strait of Malacca is a primary route for seaborne crude into East Asia.'),
  rel(MALACCA, 'transports', LNG, 0.8, 'Significant LNG volumes to East Asia transit the Strait of Malacca.'),
  rel(SUEZ, 'transports', CRUDE, 0.8, 'Crude and refined products transit the Suez Canal / SUMED corridor.'),

  // Companies exposed to ports/chokepoints.
  rel(MAERSK, 'exposed_to', SUEZ, 0.8, 'Container lines such as Maersk reroute around Africa when Suez/Red Sea transit is disrupted.'),
  rel(MSC, 'exposed_to', SUEZ, 0.8, 'MSC, the largest container line, is exposed to Suez/Red Sea disruption.'),
  rel(COSCO, 'exposed_to', MALACCA, 0.75, 'COSCO’s Asia–Europe services are exposed to Strait of Malacca disruption.'),
  rel(WALMART, 'exposed_to', LA, 0.7, 'Large US retailers’ import supply chains are exposed to West Coast port disruption.'),
  rel(TARGET, 'exposed_to', LA, 0.7, 'Target’s import flows are exposed to West Coast port disruption.'),
  rel(HOME_DEPOT, 'exposed_to', LA, 0.65, 'Home Depot’s import flows are exposed to West Coast port throughput.'),

  // Carriers supply container shipping; where they are based.
  rel(MAERSK, 'supplies', CONTAINER_SHIPPING, 0.85, 'Maersk is a top global container shipping line.'),
  rel(MSC, 'supplies', CONTAINER_SHIPPING, 0.85, 'MSC is the largest global container shipping line by capacity.'),
  rel(COSCO, 'supplies', CONTAINER_SHIPPING, 0.8, 'COSCO is a major global container shipping line.'),
  rel(MAERSK, 'located_in', DK, 0.9, 'Maersk is headquartered in Denmark.'),
  rel(COSCO, 'located_in', CN, 0.9, 'COSCO is a Chinese state-owned shipping group.'),
  rel(WALMART, 'located_in', US, 0.95, 'Walmart is a US-based retailer.'),

  // Taiwan chip-export exposure links the trade layer to the semiconductor seed.
  rel(SEMI_SECTOR, 'depends_on', TW, 0.9, 'Global advanced-chip supply is concentrated in Taiwan (TSMC leading-edge fabrication).'),
]
