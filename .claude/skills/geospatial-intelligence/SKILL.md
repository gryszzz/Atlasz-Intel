---
name: geospatial-intelligence
description: >-
  Analyze public geospatial + satellite data — vector/raster, projections,
  spatial joins, H3, and public imagery (Sentinel/Landsat, OSM). Use for mapping,
  spatial correlation, and earth-observation. Triggers: "geospatial", "satellite
  imagery", "map this", "spatial join", "H3", "GeoJSON/raster".
---

# Geospatial intelligence (public data)

Spatial reasoning over public maps, vectors, and imagery.

## Data + tools

- **Vector** — GeoJSON/shapefiles; GeoPandas for joins/filters; OSM (Nominatim/
  Overpass within usage policy) for features.
- **Raster** — GDAL/rasterio for satellite/elevation; mind bands + resolution.
- **Imagery** — public Sentinel (ESA) / Landsat (USGS) / NASA Earthdata (key).
- **Indexing** — H3/geohash for fast spatial bucketing + aggregation.

## Core operations

CRS/projection awareness (WGS84 vs projected — distances/areas are wrong in the
wrong CRS), spatial joins (point-in-polygon, nearest), buffering, and tiling.
For change detection, compare co-registered scenes over time; report cloud cover
+ acquisition date.

## Intelligence use

Tie events to place: ports/shipping lanes, energy infra, seismic zones, launch
sites, supply-chain geography. Join Atlasz events (lat/lon) to regions for
**spatial correlation** with macro/markets. Timestamp + cite every layer.

## Honesty + boundaries

Public imagery/data only; respect provider licenses + usage limits. Imagery
interpretation is probabilistic — state confidence; no fabricated detections.
Pairs with [[entity-resolution-graphs]].
