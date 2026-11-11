# Interactive Classroom

Every science and maths chapter of the Telangana and Andhra Pradesh state board syllabus (classes 6–10), matched to free [PhET](https://phet.colorado.edu/) interactive simulations, with a coverage assessment showing where simulations help and where none exist.

It is a static site: open `index.html`, or serve the folder with any web server. The workflow in `.github/workflows/pages.yml` publishes it to GitHub Pages.

## Editing the syllabus map

- `js/syllabus.js` holds the chapter lists. Each chapter is `[title, "sim-slug sim-slug"]`; an empty string marks a chapter with no suitable simulation. It also holds the one-line classroom prompt for each simulation.
- `js/sims.js` is the list of PhET HTML5 simulations with English and Telugu titles, generated from PhET's metadata service.

Chapter lists follow the SCERT Telangana textbooks, the SCERT Andhra Pradesh textbooks for classes 6–7, and the NCERT textbooks Andhra Pradesh uses for classes 8–10. Check them against the current edition.

## Credits

Simulations by PhET Interactive Simulations, University of Colorado Boulder, loaded from phet.colorado.edu. See [PhET licensing](https://phet.colorado.edu/en/licensing) before any commercial use. This project is not affiliated with PhET, SCERT or either state board.
