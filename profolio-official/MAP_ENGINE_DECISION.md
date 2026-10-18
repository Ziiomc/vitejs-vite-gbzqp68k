# Map engine review — 18 October 2026

Decision: retain Leaflet 1.9.4 for P0 and the P1 preview. A Google migration is conditional on an approved billing account, restricted key, provider budget and a measured mobile pilot. No Google key, billing commitment or unmeasured performance claims are introduced.

| Criterion | Current Leaflet + OSM | Google Maps JavaScript |
|---|---|---|
| Wilmington coverage | Existing interactive road basemap and 20 original areas preserved; local screenshot validation | Road, place and routing capabilities would need a local coverage pilot; no authenticated comparison was possible without configured access |
| Brand styling | Existing three tile presentation styles plus independent wine polygon overlays | Styled maps and data overlays possible; current overlays would need migration/testing |
| Boundaries | Independent verified Census snapshot: 16 city/CDP areas and 4 dashed block-group references | Changing renderer does not supply authoritative neighborhood borders; keep the same sourced geometry |
| Cost | Leaflet requires no API key. Public OSM tiles are capacity-limited, not a commercial SLA | Usage-based SKU billing and quotas; model map loads, Places and Routes separately before adoption |
| License | Preserve Leaflet and OpenStreetMap attribution. No tile bulk download or offline prefetch | Preserve Google attribution, satisfy Google terms, public terms/privacy requirements and restrictions on content use |
| Performance | Snapshot is about 116 KB before transfer compression, replacing multiple runtime geometry requests | Needs instrumented tests on actual target devices; no speed advantage assumed |
| Routing | Existing Open Tour is a straight-line planner, not road navigation | Requires routing services, permissions and implementation; renderer substitution alone is insufficient |

Source geometry: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer (places vintage January 1, 2026). Each saved feature retains GEOID and source attributes. Snapshot fetched October 18, 2026. Original reference anchors do not define legal neighborhoods; those exact boundaries remain unavailable.

Official references reviewed:
- https://leafletjs.com/reference.html
- https://operations.osmfoundation.org/policies/tiles/
- https://developers.google.com/maps/documentation/javascript/policies
- https://developers.google.com/maps/documentation/javascript/usage-and-billing

Launch gate: choose a production tile provider with approved terms/capacity, refresh source geometry when needed, validate disputed neighborhood outlines with the client, and run a Google pilot only after credentials and budget are supplied.
