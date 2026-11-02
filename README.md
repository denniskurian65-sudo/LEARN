# Fieldnotes

A personal learning website for Dennis. Small GIS lessons, runnable Python, and honest interview practice.

## Start

You need Node.js 22 or newer. No API keys, .env files, database, or npm packages are required.

```sh
cd /workspace/LEARN
npm ci --ignore-scripts
npm run dev
```

The development server listens on port 5173. Set `PORT` to choose another port. The environment may require running the server outside the command sandbox.

## What is included

- Two course tabs, a phone menu, and Previous / Next navigation.
- Days 1-15, with three short lessons and one Mission each day. A day is designed for about 28 minutes, with room to repeat steps.
- Days 16-21 shown as a roadmap, without unfinished lesson screens.
- 37 interview questions across eight topics and a mixed flashcard mode. Answers start hidden. Cards marked for more practice return at the end of the session.
- A Python editor, output, errors, hints, solutions, and Mission checks. Python runs in a Web Worker. Stop interrupts long-running code without freezing the page.
- Progress, the last course and lesson, quiz checks, and edited code saved in this browser's localStorage. Clearing browser data clears that progress. It does not sync between devices.

Python is loaded from the pinned Pyodide 0.27.7 distribution at `cdn.jsdelivr.net`. Pandas, NumPy, GeoPandas, Shapely, PyProj, and Matplotlib load when code imports them. The first run needs an internet connection and can take longer. Plotting uses Matplotlib's Agg backend and displays PNGs inside the page. There is no Python backend to install.

Every example builds its data from lists, dictionaries, or small geometry objects. Inventory field names follow the requested structure. Rows, coordinates, ward boundaries, and crown radii are invented practice data. The site does not download City records or claim measured City canopy coverage. CRS examples use NAD83 / UTM Zone 17N (EPSG:26917) for local practice near Kitchener.

Interview answers use Dennis's supplied education, training, work permit, and student project facts. They do not claim paid GIS employment or measured project improvements.

## Checks

```sh
npm test
npm run build
```

The six Node checks validate the curriculum, lesson timing, content rules, and storage handling.

For browser validation, start the server first. In the prepared cloud environment, Python Playwright and `/usr/bin/chromium` are already installed:

```sh
python3 tests/browser_smoke.py
```

This runs all 60 examples and all 60 solutions in real browser Python. It also checks the editor, quiz feedback, Mission checks, stopping and restarting Python, saved progress, interview reveal, flashcards, and phone navigation. Screenshots and a runtime report go into ignored `test-results/`. Chromium uses the inherited cloud proxy and normal TLS validation. On another machine, install Playwright and adjust the executable path for your Chromium installation.

To test the production files, run `SERVE_DIST=1 PORT=5174 npm start` after building. The generated `dist/` directory can be hosted by a static HTTPS host.

## Publish with GitHub Pages

The site supports the `/LEARN/` path used by GitHub Pages. Styles, JavaScript, and the Python worker use relative URLs.

```sh
npm test
npm run build
python3 tests/pages_smoke.py
npm run deploy
```

`npm run deploy` builds the site and uploads only `dist/` to the `gh-pages` branch of `denniskurian65-sudo/LEARN`. It uses the existing Git connection. It does not change repository visibility or overwrite the source checkout. Later uploads preserve the deployment branch history and use a normal push.

GitHub Pages must also be enabled in the repository. Open the repository's Settings, choose Pages, choose Deploy from a branch, select `gh-pages` and `/ (root)`, and save. GitHub supplies the public URL after deployment. Uploading a branch alone does not confirm the website is live.

The Pages smoke check serves the built files under `/LEARN/` and verifies styles, Python, Pandas, GeoPandas, a plotted map, interview answers, and the phone layout. It uses the same prepared Playwright and Chromium tools as the full browser test.

## Adding more days

Lessons 1-5 are in `src/lessons.js`. Days 6-15 are in `src/later-lessons.js`. Interview cards are in `src/interview.js`.

Keep each day short and end it with a Mission. Keep all data creation inside each runnable example. When Dennis asks for more days, prepare enough material to keep at least five days ahead of the current day, up to the planned Day 21 endpoint. Use plain English and his supplied facts. Use the existing isolated checkout; do not create Git worktrees unless Dennis asks for one.
