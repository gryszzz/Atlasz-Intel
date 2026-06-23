export type DesktopUiDomainId =
  | 'desktop-app-shell'
  | 'ui-design-system'
  | 'dashboard-template'
  | 'data-table-app-structure'
  | 'charts-data-visualization'
  | 'intelligence-graphs'
  | 'maps-geospatial-dashboards'
  | 'dashboard-systems'
  | 'motion-premium-feel'
  | 'icons-visual-language'
  | 'command-palette-power-ux'
  | 'layout-panels-resizable-ui'

export type DesktopUiAdoptionPosture =
  | 'current-stack'
  | 'candidate-library'
  | 'migration-reference'
  | 'study-reference'
  | 'avoid-unless-needed'

export type DesktopUiCorpusEntry = {
  id: string
  label: string
  upstreamUrl: string
  domainId: DesktopUiDomainId
  adoptionPosture: DesktopUiAdoptionPosture
  capabilities: string[]
  atlaszLesson: string
  avoid: string[]
}

export const DESKTOP_UI_CORPUS: DesktopUiCorpusEntry[] = [
  uiEntry('tauri', 'Tauri', 'https://github.com/tauri-apps/tauri', 'desktop-app-shell', 'migration-reference', ['desktop shell', 'Rust-backed native app boundary', 'small bundle architecture'], 'Study as a future shell option; Atlasz is currently Electron and should not migrate casually.', ['framework churn', 'rewriting stable IPC without a measured reason']),
  uiEntry('electron', 'Electron', 'https://github.com/electron/electron', 'desktop-app-shell', 'current-stack', ['desktop shell', 'IPC bridge', 'local Node services'], 'Atlasz already uses Electron; keep the main process thin and source-heavy work off the UI thread.', ['raw feed handling in the renderer', 'unsafe preload surfaces']),
  uiEntry('wails', 'Wails', 'https://github.com/wailsapp/wails', 'desktop-app-shell', 'study-reference', ['Go-backed desktop apps', 'native bridge patterns'], 'Useful for studying lighter desktop shell tradeoffs.', ['switching shell stacks before Electron bottlenecks are proven']),
  uiEntry('flutter', 'Flutter', 'https://github.com/flutter/flutter', 'desktop-app-shell', 'study-reference', ['cross-platform UI toolkit', 'custom rendering'], 'Study interaction polish and dense cross-platform UI patterns.', ['rewriting React UI without a clear product constraint']),
  uiEntry('react-native-windows', 'React Native Windows', 'https://github.com/microsoft/react-native-windows', 'desktop-app-shell', 'study-reference', ['native Windows UI', 'React native bridge'], 'Useful for Windows-native tradeoff awareness.', ['splitting the app into multiple UI stacks prematurely']),

  uiEntry('shadcn-site', 'shadcn/ui site', 'https://ui.shadcn.com/', 'ui-design-system', 'candidate-library', ['component composition', 'copy-owned primitives', 'Tailwind patterns'], 'Strong candidate for composable Atlasz primitives if adopted selectively.', ['generic SaaS dashboard look', 'bulk component imports']),
  uiEntry('shadcn-ui', 'shadcn/ui', 'https://github.com/shadcn-ui/ui', 'ui-design-system', 'candidate-library', ['component recipes', 'Radix-based controls', 'Tailwind tokens'], 'Good model for owned components and accessible primitives.', ['copying theme defaults blindly']),
  uiEntry('radix-primitives', 'Radix UI Primitives', 'https://github.com/radix-ui/primitives', 'ui-design-system', 'candidate-library', ['accessible primitives', 'dialogs', 'menus', 'popover logic'], 'Best used for interaction correctness while Atlasz keeps its own visual system.', ['custom inaccessible controls']),
  uiEntry('tailwindcss', 'Tailwind CSS', 'https://github.com/tailwindlabs/tailwindcss', 'ui-design-system', 'current-stack', ['utility styling', 'design token expression'], 'Atlasz already uses Tailwind-adjacent styling; keep tokens explicit and dense.', ['one-off color drift', 'unbounded utility sprawl']),
  uiEntry('material-ui', 'MUI', 'https://github.com/mui/material-ui', 'ui-design-system', 'study-reference', ['enterprise component library', 'data-heavy form patterns'], 'Study mature component states, not its default visual identity.', ['material-looking Atlasz screens']),
  uiEntry('fluent-ui', 'Fluent UI', 'https://github.com/microsoft/fluentui', 'ui-design-system', 'study-reference', ['desktop productivity UI', 'accessibility patterns'], 'Useful for desktop command-surface and enterprise density lessons.', ['copying Office-like styling']),
  uiEntry('carbon', 'Carbon Design System', 'https://github.com/carbon-design-system/carbon', 'ui-design-system', 'study-reference', ['enterprise dashboards', 'data tables', 'structured forms'], 'Study serious data-product hierarchy and empty/error states.', ['generic enterprise sameness']),
  uiEntry('chakra-ui', 'Chakra UI', 'https://github.com/chakra-ui/chakra-ui', 'ui-design-system', 'study-reference', ['component API ergonomics', 'theme constraints'], 'Useful for API ergonomics and accessibility comparison.', ['adding a second styling system']),
  uiEntry('ant-design', 'Ant Design', 'https://github.com/ant-design/ant-design', 'ui-design-system', 'study-reference', ['dense enterprise components', 'tables', 'forms'], 'Study high-density enterprise controls and validation states.', ['turning Atlasz into a generic admin panel']),

  uiEntry('tanstack-shadcn-dashboard', 'TanStack shadcn dashboard', 'https://github.com/dianprata/tanstack-shadcn-dashboard', 'dashboard-template', 'study-reference', ['dashboard composition', 'TanStack patterns'], 'Use as a pattern reference for structure, never as Atlasz surface replacement.', ['template cloning']),
  uiEntry('tanstack-start-dashboard', 'TanStack Start dashboard', 'https://github.com/Kiranism/tanstack-start-dashboard', 'dashboard-template', 'study-reference', ['dashboard routing', 'data layout'], 'Study navigation and data-loading patterns for dense modules.', ['adopting starter architecture wholesale']),
  uiEntry('shadboard', 'Shadboard', 'https://github.com/Qualiora/shadboard', 'dashboard-template', 'study-reference', ['admin dashboard shell', 'responsive panels'], 'Reference for shell ergonomics and component grouping.', ['generic analytics dashboard aesthetics']),
  uiEntry('next-shadcn-admin-dashboard', 'Next shadcn admin dashboard', 'https://github.com/arhamkhnz/next-shadcn-admin-dashboard', 'dashboard-template', 'study-reference', ['admin dashboard structure', 'table/form states'], 'Study mature empty/loading/error handling.', ['Next-specific assumptions in a Vite/Electron app']),
  uiEntry('awesome-shadcn-ui-biro', 'Awesome shadcn/ui', 'https://github.com/birobirobiro/awesome-shadcn-ui', 'dashboard-template', 'study-reference', ['component discovery', 'UI pattern landscape'], 'A discovery map for component ideas that still need Atlasz design review.', ['unvetted component sprawl']),
  uiEntry('awesome-shadcn-ui-bytefer', 'Awesome shadcn/ui by bytefer', 'https://github.com/bytefer/awesome-shadcn-ui', 'dashboard-template', 'study-reference', ['component discovery', 'dashboard examples'], 'Reference-only source for pattern discovery.', ['copying visual kits without fit checks']),

  uiEntry('tanstack-table', 'TanStack Table', 'https://github.com/TanStack/table', 'data-table-app-structure', 'candidate-library', ['data grids', 'sorting/filtering', 'column models'], 'Strong candidate when Atlasz needs serious source/event tables.', ['building fragile custom table logic']),
  uiEntry('tanstack-query', 'TanStack Query', 'https://github.com/TanStack/query', 'data-table-app-structure', 'candidate-library', ['async cache', 'server-state patterns', 'stale data states'], 'Candidate for explicit stale/fresh/error state management around desktop bridges.', ['hiding source freshness behind generic loading states']),
  uiEntry('tanstack-router', 'TanStack Router', 'https://github.com/TanStack/router', 'data-table-app-structure', 'candidate-library', ['typed routing', 'route state'], 'Candidate if Atlasz module routing grows beyond local state.', ['router migration before navigation pain exists']),
  uiEntry('tanstack-virtual', 'TanStack Virtual', 'https://github.com/TanStack/virtual', 'data-table-app-structure', 'candidate-library', ['virtualized lists', 'large rows', 'scroll performance'], 'Strong candidate for large event/headline/tick tables.', ['rendering thousands of rows directly']),
  uiEntry('zustand', 'Zustand', 'https://github.com/pmndrs/zustand', 'data-table-app-structure', 'study-reference', ['small state stores', 'selector patterns'], 'Study for local UI state, but avoid replacing working stores without pressure.', ['duplicated global state']),
  uiEntry('redux-toolkit', 'Redux Toolkit', 'https://github.com/reduxjs/redux-toolkit', 'data-table-app-structure', 'study-reference', ['structured state management', 'devtools patterns'], 'Useful reference for predictable state boundaries.', ['introducing ceremony for small local flows']),

  uiEntry('recharts', 'Recharts', 'https://github.com/recharts/recharts', 'charts-data-visualization', 'current-stack', ['React charts', 'time series panels'], 'Atlasz already uses Recharts; keep it for practical lightweight chart panels.', ['over-customizing beyond library strengths']),
  uiEntry('echarts', 'Apache ECharts', 'https://github.com/apache/echarts', 'charts-data-visualization', 'candidate-library', ['dense dashboards', 'financial charts', 'large data interaction'], 'Strong candidate for high-density market/world visualizations.', ['chart-library churn without performance need']),
  uiEntry('visx', 'visx', 'https://github.com/airbnb/visx', 'charts-data-visualization', 'study-reference', ['low-level chart primitives', 'custom visual systems'], 'Study when Atlasz needs bespoke visual grammar.', ['reinventing basic chart interactions']),
  uiEntry('d3', 'D3', 'https://github.com/d3/d3', 'charts-data-visualization', 'study-reference', ['data transforms', 'custom visualization'], 'D3 is the reference for visualization thinking, even when not used directly.', ['imperative chart code fighting React']),
  uiEntry('plotly-js', 'Plotly.js', 'https://github.com/plotly/plotly.js', 'charts-data-visualization', 'study-reference', ['scientific charts', 'interactive exploration'], 'Study rich exploratory interactions and trace models.', ['heavy bundles for simple panels']),
  uiEntry('chart-js', 'Chart.js', 'https://github.com/chartjs/Chart.js', 'charts-data-visualization', 'study-reference', ['simple charts', 'canvas rendering'], 'Reference for common chart ergonomics.', ['using simple charting where dense interaction is required']),
  uiEntry('vega', 'Vega', 'https://github.com/vega/vega', 'charts-data-visualization', 'study-reference', ['declarative visualization grammar'], 'Study declarative visualization specs and reproducible chart definitions.', ['letting specs obscure product intent']),
  uiEntry('vega-lite', 'Vega-Lite', 'https://github.com/vega/vega-lite', 'charts-data-visualization', 'study-reference', ['compact chart specs', 'exploratory data views'], 'Good reference for concise chart semantics and transforms.', ['auto-generated charts without analyst purpose']),

  uiEntry('xyflow', 'Xyflow', 'https://github.com/xyflow/xyflow', 'intelligence-graphs', 'current-stack', ['node graphs', 'interactive relationship maps'], 'Atlasz already uses Xyflow-style graph UI; keep traversal evidence visible.', ['decorative graphs with no source trail']),
  uiEntry('cytoscape-js', 'Cytoscape.js', 'https://github.com/cytoscape/cytoscape.js', 'intelligence-graphs', 'candidate-library', ['graph analysis UI', 'large network layouts'], 'Strong candidate for heavier entity graph exploration.', ['opaque force maps that hide evidence']),
  uiEntry('sigma-js', 'sigma.js', 'https://github.com/jacomyal/sigma.js', 'intelligence-graphs', 'study-reference', ['large graph rendering', 'WebGL graph interaction'], 'Study scale and interaction for dense graphs.', ['showing hairballs without filters']),
  uiEntry('react-force-graph', 'react-force-graph', 'https://github.com/vasturiano/react-force-graph', 'intelligence-graphs', 'study-reference', ['force graphs', '3D graph options'], 'Useful for graph interaction experiments, not default serious analysis.', ['3D spectacle replacing clarity']),
  uiEntry('vis-network', 'vis-network', 'https://github.com/visjs/vis-network', 'intelligence-graphs', 'study-reference', ['network visualization', 'graph controls'], 'Reference for mature network control surfaces.', ['unbounded graph physics in core panels']),
  uiEntry('neo4j-ui-reference', 'Neo4j', 'https://github.com/neo4j/neo4j', 'intelligence-graphs', 'study-reference', ['graph database thinking', 'relationship traversal'], 'Study graph interaction and query mental models; Atlasz remains local-first by default.', ['treating inferred edges as verified']),

  uiEntry('deck-gl', 'deck.gl', 'https://github.com/visgl/deck.gl', 'maps-geospatial-dashboards', 'candidate-library', ['GPU geospatial layers', 'map overlays'], 'Strong candidate for future map-heavy event and supply-chain views.', ['map spectacle without source precision controls']),
  uiEntry('kepler-gl', 'kepler.gl', 'https://github.com/keplergl/kepler.gl', 'maps-geospatial-dashboards', 'study-reference', ['geospatial dashboard UX', 'layer controls'], 'Study analyst-friendly layer controls and spatial filtering.', ['shipping raw sensitive locations']),
  uiEntry('mapbox-gl-js', 'Mapbox GL JS', 'https://github.com/mapbox/mapbox-gl-js', 'maps-geospatial-dashboards', 'candidate-library', ['interactive maps', 'vector tiles'], 'Candidate when Atlasz needs polished map surfaces with licensing reviewed.', ['ignoring token/licensing boundaries']),
  uiEntry('leaflet', 'Leaflet', 'https://github.com/Leaflet/Leaflet', 'maps-geospatial-dashboards', 'candidate-library', ['lightweight maps', 'markers', 'layers'], 'Candidate for simpler local-first geospatial panels.', ['overbuilding simple region context']),
  uiEntry('h3-ui', 'H3', 'https://github.com/uber/h3', 'maps-geospatial-dashboards', 'candidate-library', ['hex indexing', 'spatial aggregation'], 'Useful for privacy-preserving spatial aggregation and heat maps.', ['over-precise coordinates when aggregation is safer']),
  uiEntry('geopandas-ui-reference', 'GeoPandas', 'https://github.com/geopandas/geopandas', 'maps-geospatial-dashboards', 'study-reference', ['geospatial analysis', 'spatial joins'], 'Reference for preprocessing geospatial intelligence before UI rendering.', ['doing heavy spatial transforms in React']),

  uiEntry('grafana', 'Grafana', 'https://github.com/grafana/grafana', 'dashboard-systems', 'study-reference', ['observability dashboards', 'panel composition', 'alert surfaces'], 'Study density, panel hierarchy, source health, and operator workflows.', ['turning Atlasz into generic monitoring UI']),
  uiEntry('superset', 'Apache Superset', 'https://github.com/apache/superset', 'dashboard-systems', 'study-reference', ['BI dashboards', 'exploration workflows'], 'Study data exploration, filtering, and saved views.', ['BI chrome overwhelming intelligence flow']),
  uiEntry('metabase', 'Metabase', 'https://github.com/metabase/metabase', 'dashboard-systems', 'study-reference', ['self-service analytics', 'query-to-chart UX'], 'Study approachable data exploration and question-first layouts.', ['simplifying away source uncertainty']),
  uiEntry('streamlit', 'Streamlit', 'https://github.com/streamlit/streamlit', 'dashboard-systems', 'study-reference', ['rapid data apps', 'analysis notebooks'], 'Study quick analytical iteration, not final desktop UI structure.', ['notebook-like production screens']),
  uiEntry('redash', 'Redash', 'https://github.com/getredash/redash', 'dashboard-systems', 'study-reference', ['SQL dashboards', 'query results', 'alerts'], 'Study query/result transparency and dashboard saved states.', ['query-centric UX for non-query workflows']),
  uiEntry('netdata', 'Netdata', 'https://github.com/netdata/netdata', 'dashboard-systems', 'study-reference', ['real-time metrics', 'dense monitoring', 'alerts'], 'Study live system-state readability and high-density charts.', ['alarm fatigue']),

  uiEntry('framer-motion', 'Motion', 'https://github.com/framer/motion', 'motion-premium-feel', 'candidate-library', ['React motion', 'layout transitions'], 'Use motion sparingly for state change and continuity, not decoration.', ['animations that delay analysis']),
  uiEntry('react-spring', 'React Spring', 'https://github.com/pmndrs/react-spring', 'motion-premium-feel', 'study-reference', ['physics animation', 'interactive transitions'], 'Study subtle transition design for complex panels.', ['springy novelty in serious workflows']),
  uiEntry('magic-ui', 'Magic UI', 'https://github.com/magicuidesign/magicui', 'motion-premium-feel', 'study-reference', ['premium UI effects', 'motion examples'], 'Reference for restraint: borrow polish ideas, not decorative excess.', ['marketing-page effects in command surfaces']),
  uiEntry('motion-primitives', 'Motion Primitives', 'https://github.com/ibelick/motion-primitives', 'motion-premium-feel', 'study-reference', ['small motion primitives', 'interaction examples'], 'Study small composable motion patterns.', ['motion without analytical purpose']),

  uiEntry('lucide', 'Lucide', 'https://github.com/lucide-icons/lucide', 'icons-visual-language', 'current-stack', ['icon language', 'consistent line icons'], 'Atlasz already uses Lucide; keep icon semantics consistent and tooltipped.', ['unlabeled icon-only controls']),
  uiEntry('tabler-icons', 'Tabler Icons', 'https://github.com/tabler/tabler-icons', 'icons-visual-language', 'study-reference', ['large icon set', 'stroke icons'], 'Reference for icon coverage comparison.', ['mixing icon families casually']),
  uiEntry('octicons', 'Octicons', 'https://github.com/primer/octicons', 'icons-visual-language', 'study-reference', ['developer/product icons', 'GitHub visual language'], 'Useful for GitHub/source-control flavored actions.', ['visual mismatch with Atlasz HUD language']),
  uiEntry('phosphor-icons', 'Phosphor Icons', 'https://github.com/Phosphor-Icons/core', 'icons-visual-language', 'study-reference', ['multi-weight icons', 'broad icon set'], 'Reference for semantic icon coverage.', ['inconsistent stroke weights']),

  uiEntry('cmdk', 'cmdk', 'https://github.com/pacocoursey/cmdk', 'command-palette-power-ux', 'candidate-library', ['command palette', 'keyboard navigation'], 'Strong reference for Atlasz Ctrl/Cmd+K power UX.', ['commands that point to missing state']),
  uiEntry('raycast-extensions', 'Raycast extensions', 'https://github.com/raycast/extensions', 'command-palette-power-ux', 'study-reference', ['power-user workflows', 'action patterns'], 'Study command verbs, search affordances, and fast contextual actions.', ['command sprawl without hierarchy']),
  uiEntry('raycast-extensions-faradey', 'Raycast extensions by faradey23', 'https://github.com/faradey23/raycast-extensions', 'command-palette-power-ux', 'study-reference', ['command examples', 'extension workflow patterns'], 'Reference for command palette action shape and discoverability.', ['copying unrelated extension behavior']),

  uiEntry('react-resizable-panels', 'React Resizable Panels', 'https://github.com/bvaughn/react-resizable-panels', 'layout-panels-resizable-ui', 'candidate-library', ['resizable panes', 'split layouts'], 'Strong candidate for analyst-controlled workspace layouts.', ['letting panels create unreadable tiny states']),
  uiEntry('react-mosaic', 'React Mosaic', 'https://github.com/nomcopter/react-mosaic', 'layout-panels-resizable-ui', 'study-reference', ['tiled workspaces', 'window management'], 'Study flexible analyst workspaces without sacrificing first-screen clarity.', ['workspace complexity before saved layouts exist']),
  uiEntry('dockview', 'Dockview', 'https://github.com/mathuo/dockview', 'layout-panels-resizable-ui', 'candidate-library', ['dockable panels', 'IDE-like layouts'], 'Candidate for future power-user workspaces and multi-panel investigations.', ['turning Atlasz into an IDE clone']),
]

export const ATLASZ_UI_REFERENCE_STACK = [
  'tauri',
  'shadcn-ui',
  'tanstack-table',
  'tanstack-query',
  'echarts',
  'xyflow',
  'cytoscape-js',
  'deck-gl',
  'grafana',
  'superset',
] as const

export const DESKTOP_INTELLIGENCE_UI_FOCUS_AREAS = [
  'information hierarchy',
  'dashboard clarity',
  'dense data without confusion',
  'command palettes',
  'graph exploration',
  'timeline views',
  'source lineage views',
  'market panels',
  'alert panels',
  'entity profiles',
  'maps',
  'tables',
  'evidence trails',
  'layouts that make complex intelligence understandable',
] as const

export const DESKTOP_INTELLIGENCE_SCREEN_QUESTIONS = [
  'What is happening?',
  'Why does it matter?',
  'What changed?',
  'What evidence supports it?',
  'What should the user inspect next?',
] as const

const uiCorpusById = new Map(DESKTOP_UI_CORPUS.map((entryItem) => [entryItem.id, entryItem]))

export function lookupDesktopUiEntry(id: string): DesktopUiCorpusEntry | undefined {
  return uiCorpusById.get(id)
}

export function entriesForDesktopUiDomain(domainId: DesktopUiDomainId): DesktopUiCorpusEntry[] {
  return DESKTOP_UI_CORPUS.filter((entryItem) => entryItem.domainId === domainId)
}

export function desktopUiEntryIsAdoptable(entryItem: DesktopUiCorpusEntry): boolean {
  return entryItem.adoptionPosture === 'current-stack' || entryItem.adoptionPosture === 'candidate-library'
}

export function summarizeDesktopUiCorpus() {
  const byDomain = new Map<DesktopUiDomainId, number>()
  const byPosture = new Map<DesktopUiAdoptionPosture, number>()
  for (const entryItem of DESKTOP_UI_CORPUS) {
    byDomain.set(entryItem.domainId, (byDomain.get(entryItem.domainId) ?? 0) + 1)
    byPosture.set(entryItem.adoptionPosture, (byPosture.get(entryItem.adoptionPosture) ?? 0) + 1)
  }
  return {
    entryCount: DESKTOP_UI_CORPUS.length,
    adoptableCount: DESKTOP_UI_CORPUS.filter(desktopUiEntryIsAdoptable).length,
    byDomain: Object.fromEntries(byDomain),
    byPosture: Object.fromEntries(byPosture),
  }
}

function uiEntry(
  id: string,
  label: string,
  upstreamUrl: string,
  domainId: DesktopUiDomainId,
  adoptionPosture: DesktopUiAdoptionPosture,
  capabilities: string[],
  atlaszLesson: string,
  avoid: string[],
): DesktopUiCorpusEntry {
  return {
    id,
    label,
    upstreamUrl,
    domainId,
    adoptionPosture,
    capabilities,
    atlaszLesson,
    avoid,
  }
}
