# NOAA / NWS Weather Alerts

Atlasz wires the National Weather Service active alerts endpoint as an official
public weather disruption source.

Source:

- `https://api.weather.gov/alerts/active`
- provenance: `official-api`
- authentication: none
- required header: descriptive `User-Agent`

Contract:

- real active alerts only
- no model forecasts
- no fake weather events
- no AI severity inflation
- malformed alerts are dropped, not repaired
- HTTP/rate-limit/schema failures fail closed as unavailable
- alert severity, urgency, certainty, area, timing, and sender come from NWS
- unresolved regional exposure is allowed and must remain visible

Rendered records must carry:

- alert id
- event type
- severity, urgency, certainty
- affected area
- effective/onset/expires timing when present
- retrieval timestamp
- source identity
- individual NWS alert URL
- official API URL
- raw payload hash / raw payload JSON
- confidence and freshness labels

Exposure rule:

NOAA alerts do not invent tickers, commodities, ports, or energy exposure. A
weather alert may connect to a curated exposure path later only when Atlasz has
an explicit region/port/energy seed mapping. Until then, the event remains an
official weather disruption with unresolved downstream exposure.
