"""Run with the dev server on port 5173. Uses the real CDN Python runtime."""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    artifacts = Path('test-results')
    artifacts.mkdir(exist_ok=True)
    async with async_playwright() as p:
        options = {'headless': True, 'executable_path': '/usr/bin/chromium', 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
        if os.environ.get('HTTPS_PROXY'):
            options['proxy'] = {'server': os.environ['HTTPS_PROXY'], 'bypass': 'localhost,127.0.0.1'}
        browser = await p.chromium.launch(**options)
        page = await browser.new_page(viewport={'width': 1440, 'height': 1050}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        await page.goto('http://127.0.0.1:5173', wait_until='networkidle')
        await page.screenshot(path=str(artifacts / 'desktop.png'), full_page=True)
        assert await page.title() == 'Your first fieldnote | Fieldnotes'
        # A wrong answer must fail, then the right one passes.
        await page.locator('input[name="answer"][value="1"]').check()
        await page.get_by_role('button', name='Check answer').click()
        assert 'Not quite' in await page.locator('#exercise-feedback').inner_text()
        await page.locator('input[name="answer"][value="0"]').check()
        await page.get_by_role('button', name='Check answer').click()
        assert "That's right" in await page.locator('#exercise-feedback').inner_text()
        await page.locator('#complete-lesson').check()
        await page.locator('#code-editor').fill('print("Saved, Dennis")')
        await page.reload()
        assert await page.locator('#complete-lesson').is_checked()
        assert await page.locator('#code-editor').input_value() == 'print("Saved, Dennis")'
        # A real Python request through the visible editor.
        await page.locator('#run-code').click()
        await page.wait_for_function("document.querySelector('#run-status').textContent.startsWith('Done.')", timeout=180000)
        assert await page.locator('#output').inner_text() == 'Saved, Dennis'
        print('PASS: editor runs real Python, quiz feedback, progress, and draft persistence', flush=True)
        # Browser runtime validation of every lesson and every solution.
        await page.evaluate('''async () => {
          const {lessons: first} = await import('/src/lessons.js');
          const {laterLessons} = await import('/src/later-lessons.js');
          const {runPython} = await import('/src/runner.js');
          const {normalizeOutput} = await import('/src/state.js');
          window.curriculumResults = [];
          window.curriculumFinished = false;
          (async () => {
            for (const lesson of [...first, ...laterLessons]) {
              const example = await runPython(lesson.code);
              const solution = await runPython(lesson.answer);
              window.curriculumResults.push({id: lesson.id,
                exampleError: example.error, solutionError: solution.error,
                previewMatches: !lesson.output || normalizeOutput(example.output) === normalizeOutput(lesson.output),
                exampleOutput: example.output, output: solution.output, figures: solution.plots.length});
            }
            window.curriculumFinished = true;
          })().catch(e => { window.curriculumFailure = String(e); window.curriculumFinished = true; });
        }''')
        last_count = -1
        for _ in range(120):
            await page.wait_for_timeout(5000)
            count = await page.evaluate('window.curriculumResults.length')
            if count != last_count:
                print(f'Python browser checks: {count}/60 example + solution pairs', flush=True)
                last_count = count
            if await page.evaluate('window.curriculumFinished'):
                break
        assert await page.evaluate('window.curriculumFinished'), 'Runtime checks timed out'
        assert not await page.evaluate('window.curriculumFailure || null')
        results = await page.evaluate('window.curriculumResults')
        (artifacts / 'python-results.json').write_text(json.dumps(results, indent=2))
        failures = [r for r in results if r.get('exampleError') or r.get('solutionError') or not r['previewMatches']]
        assert not failures, json.dumps(failures, indent=2)
        assert len(results) == 60
        assert all(r['figures'] == 1 for r in results if r['id'].startswith('d9-'))
        expected = {
            'd2-mission': 'Maples: 5',
            'd3-mission': 'Biggest TREEID: 104\nDBH: 60',
            'd5-mission': 'Trees to review: 2',
            'd7-mission': 'Recheck TREEIDs: [202, 204]',
            'd8-mission': 'Maple TREEIDs: [101, 103, 105, 106]',
            'd12-mission': "Outside 800 m: ['B']\nNearby sites: 2",
            'd14-mission': 'Total active trees: 5',
            'd15-mission': 'Canopy cover (%): 31.6',
        }
        for result in results:
            if result['id'] in expected:
                assert expected[result['id']] in result['output'], result
        print('PASS: 120 Python runs, including Pandas, GeoPandas, CRS, spatial joins, buffers, canopy, and 8 figures', flush=True)
        # Mission checking must fail for the starter and pass for the solution.
        await page.locator('#sidebar [data-lesson="d1-mission"]').click()
        await page.locator('#check-mission').click()
        await page.wait_for_function("document.querySelector('#exercise-feedback').textContent.includes('Not quite')", timeout=30000)
        await page.locator('.solution summary').click()
        await page.locator('#use-solution').click()
        await page.locator('#check-mission').click()
        await page.wait_for_function("document.querySelector('#exercise-feedback').textContent.includes('Mission complete')", timeout=30000)
        # Interrupt an infinite loop; the worker must recover.
        await page.locator('#code-editor').fill('while True:\n    pass')
        await page.locator('#run-code').click()
        await page.wait_for_timeout(600)
        await page.locator('#stop-code').click()
        await page.wait_for_function("!document.querySelector('#run-code').disabled")
        await page.locator('#code-editor').fill('print("Recovered")')
        await page.locator('#run-code').click()
        await page.wait_for_function("document.querySelector('#output').textContent === 'Recovered'", timeout=180000)
        print('PASS: mission failure/success and interrupted-worker recovery', flush=True)
        await page.locator('summary').filter(has_text='Draw Me a Map').click()
        await page.locator('#sidebar [data-lesson="d9-mission"]').click()
        await page.locator('.solution summary').click()
        await page.locator('#use-solution').click()
        await page.locator('#check-mission').click()
        await page.wait_for_function("document.querySelector('#exercise-feedback').textContent.includes('Mission complete')", timeout=180000)
        assert await page.locator('#plots img').count() == 1
        await page.screenshot(path=str(artifacts / 'map-desktop.png'), full_page=True)
        print('PASS: map rendered in the page and map Mission passed', flush=True)
        # Interview questions start closed, then reveal their model answers.
        await page.locator('[data-course="interview"]').click()
        assert not await page.locator('.answer-reveal').first.get_attribute('open')
        await page.locator('.answer-reveal summary').first.click()
        assert 'Fleming College' in await page.locator('.model-answer').first.inner_text()
        await page.locator('[data-topic="practice"]').click()
        assert await page.get_by_role('button', name='Reveal answer', exact=True).is_visible()
        await page.get_by_role('button', name='Reveal answer', exact=True).click()
        assert await page.locator('.flashcard-answer').is_visible()
        await page.get_by_role('button', name='Practise again', exact=True).click()
        assert 'Card 2 of 38' in await page.locator('.flashcard-controls').inner_text()
        for _ in range(37):
            await page.get_by_role('button', name='Reveal answer', exact=True).click()
            await page.get_by_role('button', name='Got it', exact=False).click()
        assert 'You practised 37 questions.' in await page.locator('#main h1').inner_text()
        await page.locator('#sidebar [data-topic="intro"]').click()
        await page.locator('[data-topic="practice"]').click()
        assert 'You practised 37 questions.' in await page.locator('#main h1').inner_text()
        await page.locator('#another-round').click()
        assert 'Card 1 of 37' in await page.locator('.flashcard-controls').inner_text()
        print('PASS: interview reveal, mixed deck, and repeat queue', flush=True)
        # Phone navigation and overflow checks on both courses.
        await page.set_viewport_size({'width': 390, 'height': 844})
        await page.locator('[data-course="python"]').click()
        await page.locator('#menu-toggle').click()
        await page.locator('summary').filter(has_text='Shade, Measured').click()
        await page.locator('[data-lesson="d15-mission"]').click()
        assert await page.locator('h2').filter(has_text='Mission: shade').is_visible()
        assert await page.locator('#menu-toggle').get_attribute('aria-expanded') == 'false'
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await page.screenshot(path=str(artifacts / 'mobile.png'), full_page=True)
        await page.locator('[data-course="interview"]').click()
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await page.screenshot(path=str(artifacts / 'interview-mobile.png'), full_page=True)
        assert not errors, errors
        print('PASS: mobile navigation, no horizontal page overflow, no browser errors', flush=True)
        await browser.close()

asyncio.run(main())
