# Conditional product backlog — 18 October 2026

P0 is a browser demo; P1 is gps.html, an explicitly labeled prototype. None of the capabilities below is represented as operational in production.

| ID / priority | Outcome | Required evidence before implementation / launch |
|---|---|---|
| GPS-02 / P2 | Real turn-by-turn navigation, voice search and rerouting | Choose a routing/Places provider; documented Wilmington coverage; approved billing and cost ceiling; restricted credentials; microphone/location permission UX; privacy and retention policy; denial/offline handling; instrumented mobile field tests. No real GPS until these pass. |
| GPS-03 / P2 | Community closures, incidents and events | Named authoritative feeds and permitted reuse; timestamps, TTL and expiry; moderation queue, abuse reporting and escalation; verified/uncertain labels; cancellation updates; no unverified safety claims. |
| GPS-04 / P2 | Restaurants, offers and local activity | Business-authorized data/photos/offers; ownership verification; update cadence, geographic coverage, offer expiry and attribution rules. |
| GPS-05 / P2 | Nearby real homes, alerts and visits | Licensed inventory/MLS/IDX or owner/agent contracts, update cadence, location-consent controls, alert opt-in, verified appointments, listing takedown process and data quality monitoring. |
| ECO-01 / P2 | Owner/agent marketplace | Server accounts, authenticated roles, ownership checks, secure photo uploads with rights, listing review, anti-fraud and duplicate checks, audit history and secure persistent storage. Local drafts remain private until this exists. |
| ECO-05 / P2 | First verified transactional listing and payments | Determine lawful fees/permissions with relevant specialists, payment provider account and approved terms, test environment, exact pricing/refunds/cancellation disclosures, idempotent webhooks, receipts and reconciliation. Prove purchase/refund/failure flows in staging before enabling real charges. No payment keys requested or fabricated. |
| ECO-02 / P3 | Rentals and short stays | Licensed inventory, lease/booking conditions, availability source, cancellation policy and applicable local rules. Separate long-term rentals from reservations. |
| ECO-03 / P3 | Local advertising | Verified business self-service, honest impression/click measurement, placement labels, offer approval and billing controls. |
| ECO-04 / P3 | Check-ins and attribution | Explicit consent and deletion controls; distinguish click, claimed visit and validated visit; no inferred physical attendance. |
| ECO-06 / P3 | Partners and geographic expansion | Named pilot partners with agreements, Wilmington pilot quality/cost results, service support plan; city-by-city data and license gates. No claim of national coverage. |
| UX-03 / optional P3 | Seasonal presentation | Small wine/gold-compatible variants, contrast and reduced-motion tests; no new promises or simulated night photography. |

## Decisions still needed from project owners

- Approve final English brand wording/credits and supply authorized founder photos if desired. The demo intentionally uses no founder photos.
- Supply a client-approved source for the four exact neighborhood borders (Downtown, Mayfaire/Landfall, Greenville Loop/Sound, Figure Eight Island). Current dashed outlines are honest Census references, not those legal borders.
- Select mapping, inventory, event and payment providers and approve their actual contracts, budget and permissions. See MAP_ENGINE_DECISION.md.
- Nominate moderation, customer support and data-refresh owners before a live pilot.

Acceptance gate for P2: signed-off providers/data/permissions/costs, end-to-end staging evidence, privacy/security review appropriate to the actual services, and a limited Wilmington pilot with measured outcomes. Build only the approved slice, then evaluate expansion.
