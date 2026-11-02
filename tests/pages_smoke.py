"""Check the built site under /LEARN/, as GitHub Pages will serve it."""
import asyncio
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import tempfile
from threading import Thread
from playwright.async_api import async_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

async def check(port):
    async with async_playwright() as p:
        options = dict(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
        if os.environ.get('HTTPS_PROXY'):
            options['proxy'] = {'server': os.environ['HTTPS_PROXY'], 'bypass': 'localhost,127.0.0.1'}
        browser = await p.chromium.launch(**options)
        page = await browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        failed = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: failed.append(r.url) if r.status >= 400 else None)
        await page.goto(f'http://127.0.0.1:{port}/LEARN/', wait_until='networkidle')
        assert 'Fieldnotes' in await page.title()
        assert await page.locator('.welcome-banner').evaluate("e => getComputedStyle(e).backgroundColor") == 'rgb(23, 62, 49)'
        await page.locator('#run-code').click()
        await page.wait_for_function("document.querySelector('#run-status').textContent.startsWith('Done.')", timeout=180000)
        assert 'Hello, Kitchener!' in await page.locator('#output').inner_text()
        # This also verifies the worker resolves its URL under /LEARN/src/.
        await page.locator('#code-editor').fill('import pandas as pd\nimport geopandas as gpd\nfrom shapely.geometry import Point\nimport matplotlib.pyplot as plt\ntrees = gpd.GeoDataFrame({"TREEID": [101, 102]}, geometry=[Point(540000, 4810000), Point(540100, 4810100)], crs="EPSG:26917")\nax = trees.plot()\nax.set_title("Pages map check")\nprint("Mapped trees:", len(trees))')
        await page.locator('#run-code').click()
        await page.wait_for_function("document.querySelector('#run-status').textContent.startsWith('Done.')", timeout=180000)
        assert await page.locator('#output').inner_text() == 'Mapped trees: 2'
        assert await page.locator('#plots img').count() == 1
        await page.locator('[data-course="interview"]').click()
        await page.locator('.answer-reveal summary').first.click()
        assert 'Fleming College' in await page.locator('.model-answer').first.inner_text()
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        assert not failed, failed
        print('PASS: /LEARN/ styles, modules, Python worker, Pandas, GeoPandas, maps, interview cards, and phone layout')
        await browser.close()

with tempfile.TemporaryDirectory(prefix='fieldnotes-pages-test-') as root:
    shutil.copytree('dist', Path(root) / 'LEARN')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=root))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        asyncio.run(check(server.server_port))
    finally:
        server.shutdown()
        server.server_close()
