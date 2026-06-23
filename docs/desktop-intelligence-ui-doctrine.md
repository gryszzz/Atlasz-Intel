# Desktop Intelligence UI Doctrine

Atlasz is a desktop intelligence terminal, not a generic web dashboard. These
references are study material for stronger interface judgment and selective
future adoption. They do not trigger framework rewrites by themselves.

The executable catalog lives in `src/desktopUiCorpus.ts`.

## Screen Questions

Every primary screen should answer:

- What is happening?
- Why does it matter?
- What changed?
- What evidence supports it?
- What should the user inspect next?

## Design Priorities

- clarity before spectacle
- density without confusion
- source lineage always visible
- fast command-palette navigation
- deliberate empty, failed, stale, and unavailable states
- graph exploration that exposes evidence instead of decorative networks
- tables and timelines that can handle real event volume
- maps with precision, licensing, and sensitivity controls
- motion that explains state change, not motion for its own sake

## Adoption Posture

| Posture | Meaning |
| --- | --- |
| `current-stack` | Already part of the Atlasz app direction. Improve it before replacing it. |
| `candidate-library` | Worth considering when a concrete UI bottleneck appears. |
| `migration-reference` | Study for architecture tradeoffs, but do not migrate casually. |
| `study-reference` | Learn from it; do not adopt by default. |
| `avoid-unless-needed` | Keep out unless a specific constraint demands it. |

## Full Source List

### Desktop App Shell

- https://github.com/tauri-apps/tauri
- https://github.com/electron/electron
- https://github.com/wailsapp/wails
- https://github.com/flutter/flutter
- https://github.com/microsoft/react-native-windows

### UI Design Systems

- https://ui.shadcn.com/
- https://github.com/shadcn-ui/ui
- https://github.com/radix-ui/primitives
- https://github.com/tailwindlabs/tailwindcss
- https://github.com/mui/material-ui
- https://github.com/microsoft/fluentui
- https://github.com/carbon-design-system/carbon
- https://github.com/chakra-ui/chakra-ui
- https://github.com/ant-design/ant-design

### Dashboard Templates

- https://github.com/dianprata/tanstack-shadcn-dashboard
- https://github.com/Kiranism/tanstack-start-dashboard
- https://github.com/Qualiora/shadboard
- https://github.com/arhamkhnz/next-shadcn-admin-dashboard
- https://github.com/birobirobiro/awesome-shadcn-ui
- https://github.com/bytefer/awesome-shadcn-ui

### Data Tables And App Structure

- https://github.com/TanStack/table
- https://github.com/TanStack/query
- https://github.com/TanStack/router
- https://github.com/TanStack/virtual
- https://github.com/pmndrs/zustand
- https://github.com/reduxjs/redux-toolkit

### Charts And Data Visualization

- https://github.com/recharts/recharts
- https://github.com/apache/echarts
- https://github.com/airbnb/visx
- https://github.com/d3/d3
- https://github.com/plotly/plotly.js
- https://github.com/chartjs/Chart.js
- https://github.com/vega/vega
- https://github.com/vega/vega-lite

### Intelligence Graphs

- https://github.com/xyflow/xyflow
- https://github.com/cytoscape/cytoscape.js
- https://github.com/jacomyal/sigma.js
- https://github.com/vasturiano/react-force-graph
- https://github.com/visjs/vis-network
- https://github.com/neo4j/neo4j

### Maps And Geospatial Dashboards

- https://github.com/visgl/deck.gl
- https://github.com/keplergl/kepler.gl
- https://github.com/mapbox/mapbox-gl-js
- https://github.com/Leaflet/Leaflet
- https://github.com/uber/h3
- https://github.com/geopandas/geopandas

### Existing Dashboard Systems To Study

- https://github.com/grafana/grafana
- https://github.com/apache/superset
- https://github.com/metabase/metabase
- https://github.com/streamlit/streamlit
- https://github.com/getredash/redash
- https://github.com/netdata/netdata

### Motion And Premium Feel

- https://github.com/framer/motion
- https://github.com/pmndrs/react-spring
- https://github.com/magicuidesign/magicui
- https://github.com/ibelick/motion-primitives

### Icons And Visual Language

- https://github.com/lucide-icons/lucide
- https://github.com/tabler/tabler-icons
- https://github.com/primer/octicons
- https://github.com/Phosphor-Icons/core

### Command Palette And Power User UX

- https://github.com/pacocoursey/cmdk
- https://github.com/raycast/extensions
- https://github.com/faradey23/raycast-extensions

### Layout, Panels, And Resizable UI

- https://github.com/bvaughn/react-resizable-panels
- https://github.com/nomcopter/react-mosaic
- https://github.com/mathuo/dockview

## Strong Atlasz Reference Combo

- https://github.com/tauri-apps/tauri
- https://github.com/shadcn-ui/ui
- https://github.com/TanStack/table
- https://github.com/TanStack/query
- https://github.com/apache/echarts
- https://github.com/xyflow/xyflow
- https://github.com/cytoscape/cytoscape.js
- https://github.com/visgl/deck.gl
- https://github.com/grafana/grafana
- https://github.com/apache/superset
