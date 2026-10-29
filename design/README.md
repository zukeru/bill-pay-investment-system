# Billionaire Pay design and client implementation

The current reference is `concept-modern-desktop-mobile.png`. The earlier forest/ivory concept is preserved as design history; the user subsequently requested a modern, simple responsive website plus React Native app with different colors.

## Shared design system

- White sidebar and surfaces (`#FFFFFF`), pale cool canvas (`#F5F7FB`), charcoal text (`#111827`), gray secondary text (`#6B7280`), cobalt actions (`#315BEE`).
- Bundled DM Sans in regular, medium and semibold. No network font requests.
- A 218 px desktop sidebar, a shallow account header, a spacious discovery heading, Bills/Projects controls, search/category/location filters, one large photo/story request, a narrow actual-account impact rail, and a lower row of additional requests.
- At widths below 900 px, the sidebar becomes a compact brand header and bottom navigation. Request photo/story panels stack vertically. Forms and activity rows reflow to the available width. The impact rail appears only where sufficient space exists.
- Native Ionicons are consistent across the website and mobile application. Primary controls use cobalt, secondary controls use quiet borders. Loading, errors, empty states, selected states and explicit success receipts are implemented.

## Architecture and behavior

`apps/mobile` is the shared Expo / React Native / TypeScript application. Expo exports the responsive browser website. The web shell uses semantic HTML5 `header`, `aside`, `nav` and `main` landmarks; native clients use native views for the same layout. Controls have accessible labels and roles. Runtime metadata sets the page title and description.

The client includes real session login, consent-based registration, email confirmation and password reset; backer discovery, search/filter, pass/swipe, saved requests, explicit amount/terms support confirmation, optional Stripe test checkout, nonbinding project interest and activity receipts; applicant request submission, public preview, private PDF/JPEG/PNG evidence uploads, review status and dashboard; private readiness profiles; administrator review including private applicant profiles/evidence and approval/rejection; draft US/Colorado legal and help content.

Web authentication uses the API’s HTTP-only session cookie. Native authentication stores the bearer token in Expo SecureStore. Native evidence access downloads with authorization to a temporary local file and opens the native share/view interface, then removes the temporary file. Evidence is never exposed in discovery. Retry keys remain stable across ambiguous contribution/checkout retries for the same intent.

The bundled main portrait is generated fictional imagery in `apps/mobile/assets/amara-family.png`. Supporting contextual photos are bundled local Unsplash assets. Their names and amounts are always taken from the actual API sample data rather than invented by the UI.

## Copy and concept fidelity

The following deviations are intentional and preserve truthful product behavior:

- “Find a need. See the person. Choose your impact.” replaces the concept’s claim about “real people” because the local seed requests are fictional samples.
- Request titles, stories, locations and amounts use the API, which can differ from the visual concept’s illustrative text and figures.
- “Your impact” is account-scoped persisted activity, not a claim that every session starts at zero.
- Added location filtering beside keyword/category filtering, as required by the product scope.
- Platform review and profile readiness never imply completed identity verification. “Verified backers” and any unearned verification wording are excluded.
- All support and activity labels preserve the simulated/nonbinding/test-mode boundary. No bill is described as paid or investment as settled.

Concept comparison checks cover the white sidebar geometry, cool canvas/cobalt palette, sans typography hierarchy, photo/story split, primary/secondary controls, narrow impact rail, lower request row, mobile navigation and applicant form/dashboard continuation. The final browser screenshots and interactive QA are recorded by the main task after the Docker rebuild; bundle/type checks alone are not visual acceptance.

## Validation and limits

- `npx tsc --noEmit`: passed after aligning TypeScript and React types with Expo SDK 58.
- `npx expo-doctor`: 20/20 checks passed.
- `npx expo export --platform all`: web, iOS Hermes and Android Hermes bundles exported successfully. Three required font weights and one icon family are imported directly to reduce export size.
- Native compiled binaries/device execution require Xcode or Android tooling. Bundle export does not establish runtime device acceptance.
- Email links open the website and can complete confirmation/reset there. Physical native clients must point `EXPO_PUBLIC_API_URL` to a reachable host; a phone’s `localhost` is the phone itself.
- Financial live launch remains gated; legal pages are draft US/Colorado planning text requiring operator-specific review.

## Dependency advisory boundary

The current Expo 58 dependency tree reports 8 npm audit entries (5 low, 3 high) inherited through Expo CLI/config build tooling. The underlying advisories concern `zod@3.25.76` constrained collection memory exhaustion (GHSA-mrhx-c7xc-m3w5; fixed on the incompatible Zod 4 line) and `deepmerge@4.3.1` prototype poisoning (GHSA-gcqx-w48m-w2h4; npm’s latest published deepmerge remains 4.3.1). The audit’s suggested Expo 51 downgrade is not a safe SDK-compatible patch. No forced dependency major override was applied. These tools are excluded from the static nginx browser deployment and native application bundle; development/build tool exposure must be reviewed when SDK-compatible upstream fixes appear. This is an explicitly recorded build-tool advisory, not a claim of a clean full dependency audit.
