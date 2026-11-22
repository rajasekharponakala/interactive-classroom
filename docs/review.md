# Classroom review and next work

Scope: home page and player, syllabus/candidate activity data, existing lab and quiz/attempt flows, static hosting, and the new spatial labs. A mapping means **at least one** relevant simulation, not full chapter or practical coverage.

## Comparison and design decisions

| Reference | Practice to borrow | Decision here |
| --- | --- | --- |
| [PhET](https://phet.colorado.edu/en/about) | Let students change one variable, see the result, and explain it. | Keep ray diagrams, circuits, fractions, and plane angles in 2D. Link dimensions, area, and volume in the 3D solids model. |
| [GeoGebra 3D Graphics](https://geogebra.github.io/docs/manual/en/3D_Graphics_View/) | Pair spatial objects with inspectable views and numerical measures. | Provide orthographic Front/Top views, perspective reset, hidden edges, a dashed perpendicular height, one foldable cube net, and adjustable horizontal slices through boxes. |
| [NASA Eyes](https://science.nasa.gov/eyes/) | Make viewpoint and time controllable, and distinguish authoritative data from illustrations. | Provide pause, time step, reset, inclination, and orbital-period readouts. The four circular inner orbits are a teaching model, not NASA ephemerides. |

## Findings and priorities

- The draft geometry pages called a missing helper and the draft solar view did not rotate in 3D. They now share a perspective renderer. The new Cell Explorer uses the same camera to compare the locations of structures in simplified leaf and animal cells. Each of the four labs has a short, retryable challenge with no time pressure. Pyramid also has a three-round volume-building game with directional feedback and replay. The 3D labs give seven previously unmapped chapters a model; linking the improved Habitat, Animal Food, and Life Cycles labs covers eight more.
- The 2D Circle Theorems Lab adds four partial chapter matches: Telangana Classes 9 and 10 and Andhra Pradesh Classes 9 and 10. It investigates central and inscribed angles, equal tangent lengths, perpendicular radii, and the tangent–secant relation for a secant through the centre.
- The 2D Compass and Straightedge Lab adds five partial chapter matches across Telangana (Classes 6, 7 and 9) and Andhra Pradesh (Classes 6 and 7). Students construct a perpendicular bisector or a triangle from three sides and see why touching or disjoint compass circles cannot complete either task. The map now has 103 of 299 chapters without a simulation.
- The earlier audit flagged quiz keys, blank startup progress, and a forced jump to quizzes. The current baseline (`b23957d`) already corrects those specific findings. The browser check verifies first-load progress and timeline and that a syllabus card launches its model.
- Habitat, Animal Food, Life Cycles, and Fractions now support completion without dragging, with feedback, undo, and reset. Chromium tests exercise incorrect choices, correction, completion, and replay. The narrow viewport uses emulated touches for buttons and automated native option selection; screen-reader behavior and physical phones are not yet verified.
- Thirty Class 6–7 science chapter entries in the checked-in catalog have topic-matched supplemental activities, including all 24 entries still lacking a simulation. The activities are keyed by chapter title and labelled by type, and remain available alongside a simulation where applicable. Other gaps display a fallback instead of old off-topic prompts. Current-edition verification against official textbooks and the remaining 79 unmapped chapters without supplemental activities are still open.
- Next candidates for 3D: other nets and angled cross-sections. Keep ecology sequencing and particle/counting tasks in 2D unless depth answers a specific learning question. External PhET apps are linked, not rewritten.

### External checks

- At a 390 px Chromium viewport the live PhET Pendulum Lab rendered inside the player in English and Telugu. This is a spot check, not a verification of every embed or a test on a physical phone.
- Andhra Pradesh’s [official textbook index](https://cse.ap.gov.in/textBooksDownloadingPagetitleWise) listed both semesters of Class 6–7 General Science. Its PDF links returned an HTML page during this check, and the Telangana SCERT site failed TLS verification in this environment. The checked-in chapter lists were not certified against either board’s current editions.

## Subagent work plan

| Role | Ownership | Acceptance evidence |
| --- | --- | --- |
| Curriculum reviewer | `js/syllabus.js`, activity sources and mapping audit | Record board, edition, chapter, target concept, and any partial match. Check all additions against source textbooks. |
| Interaction reviewer | Legacy lab input handling and quiz flows | Complete each activity using keyboard only and touch; test wrong answers, correction, and reset. |
| Spatial modeller | `labs/3d.js` and scene modules | Demonstrate why depth matters, supply a comparison view and numerical checks, and label model limits. |
| Integration tester | Player wiring and `tests/browser.cjs` | Assert catalog integrity and run Chromium tests at narrow and wide viewports; report any external-network checks separately. |
