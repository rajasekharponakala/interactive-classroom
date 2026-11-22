# Interactive Classroom

Science and maths simulations for the Telangana and Andhra Pradesh state board syllabus, classes 6–10. Every chapter is matched to a simulation where one exists: our own labs first, then [PhET](https://phet.colorado.edu/) simulations, with a coverage assessment for teachers.

It is a static site with no build step: open `index.html`, or serve the folder with any web server. The workflow in `.github/workflows/pages.yml` publishes it to GitHub Pages.

## Layout

- `index.html`, `css/site.css`, `js/app.js` — the home page: hero, own labs, class and chapter browser, coverage heatmaps, simulation player, "Your progress" badges and the science timeline.
- `css/base.css` — colour tokens, fonts and shared controls used by the site and the labs.
- `labs/` — eleven 2D labs with quizzes and local attempt timers, including Circle Theorems and Compass and Straightedge, plus four 3D labs (Solids, Pyramid, Inner Solar System, Cell Explorer) with quick challenges. The 3D labs use `3d.js` and `scene.css` and do not require WebGL. Add `?theme=dark` to force a theme.
- `js/syllabus.js` — chapter lists and the chapter-to-simulation map. Each chapter is `[title, "sims"]`: a plain slug is a PhET simulation, `@id` is one of our labs, and an empty string marks a chapter with no simulation. Own labs are registered in `window.LABS` at the bottom of the file; `window.TIMELINE` lists history-of-science milestones.
- `js/classroom-activities.js` — supplemental activities matched to 30 Class 6–7 science chapter entries across both boards, including all 24 currently without a simulation. Unreviewed legacy suggestions in `js/experiments.js` are not displayed. These are not official textbook practicals.
- `js/sims.js` — PhET HTML5 simulations with English and Telugu titles, generated from PhET's metadata service.

## Adding a lab

1. Copy an existing page in `labs/` and build the simulation.
2. Register it in `window.LABS` in `js/syllabus.js` and add a small drawing for it to `ART` in `js/app.js`.
3. Reference it as `@id` in the chapters it belongs to.

## Verification

Run `npm install --no-save playwright`, then `npx playwright install chromium`, then `node tests/browser.cjs`. The test checks catalog references and classroom activities, exercises the 3D labs at 320 px and 1200 px, and completes four older labs without dragging. The narrow test taps action buttons and uses Playwright to select native options; the desktop test uses key presses. Third-party network requests are blocked. See [review and subagent work plan](docs/review.md).

## Syllabus sources

Chapter lists follow the SCERT Telangana textbooks, the SCERT Andhra Pradesh textbooks for classes 6–7, and the NCERT textbooks Andhra Pradesh uses for classes 8–10. Check them against the current edition.

## Credits

Labs under “Our own labs” are original to this project. Cards marked PhET load simulations from PhET Interactive Simulations, University of Colorado Boulder. See [PhET licensing](https://phet.colorado.edu/en/licensing) before any commercial use. This project is not affiliated with PhET, SCERT or either state board.
