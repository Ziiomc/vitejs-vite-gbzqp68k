# GPS and road reports — 27 October 2026

Amen Amen requested street navigation and anomaly reporting on 26 October at 16:35.

## Available in this release

- A real user-entered destination opens Google Maps directions/navigation in a separate app or tab. The app sends only the destination and travel mode after the user opens that link; Google Maps handles origin/location consent and routing. Devices without live navigation may show a route preview.
- The property demo remains separate and collapsed by default. Its approximate fictional pins never become real navigation destinations automatically.
- Road hazard, closure, traffic obstruction, incorrect map information and other reports can be saved and reloaded locally, or downloaded as JSON. Location is manual or requested explicitly for one report. No background tracking or automatic upload.
- The interface states that reports are local, unverified and not sent to ProFolio, other drivers or emergency services. This is not community reporting.

## Required to complete the requested shared GPS product

1. Connect a dedicated ProFolio backend. No project was found in the connected Supabase account; its two existing projects belong to other products and were not modified.
2. Define report visibility and who moderates/receives reports. Use authenticated ownership, server validation, abuse limits, expiry/resolution, and a moderation queue before publishing unverified reports on a shared map.
3. If navigation must stay inside ProFolio, select and connect a licensed routing/geocoding provider and its credentials/budget. Google Maps handoff currently provides navigation outside ProFolio.
4. Test on physical iOS/Android devices, including location denial, weak GPS, connectivity loss and safe route recalculation before claiming native live navigation.

No new paid service, shared reporting database or in-app routing service has been provisioned. No claim of a completed Waze-like product is warranted.

Reference: [Google Maps URLs documentation](https://developers.google.com/maps/documentation/urls/get-started). Maps URLs require no API key; turn-by-turn behavior depends on device, origin availability and supported destination.
