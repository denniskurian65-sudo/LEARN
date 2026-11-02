/* Python runs off the main thread, so a long loop does not freeze the website. */
const CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let runtime;
let output = [];
let errors = [];
function status(text) { postMessage({ type: 'status', text }); }
async function getRuntime() {
  if (!runtime) {
    status('Loading Python for the first time. This can take a minute.');
    importScripts(CDN + 'pyodide.js');
    runtime = await loadPyodide({ indexURL: CDN });
    // A worker has no document. Render charts to PNG instead of a DOM canvas.
    await runtime.runPythonAsync('import os\nos.environ["MPLBACKEND"] = "Agg"');
    runtime.setStdout({ batched: text => output.push(text) });
    runtime.setStderr({ batched: text => errors.push(text) });
    // This course uses print(), not interactive input().
    runtime.setStdin({ stdin: () => undefined });
  }
  return runtime;
}
self.onmessage = async ({ data }) => {
  const { id, code } = data;
  let scope;
  try {
    const py = await getRuntime();
    status('Preparing the libraries used in this lesson...');
    await py.loadPackagesFromImports(code);
    await py.runPythonAsync(`import sys\nif 'matplotlib.pyplot' in sys.modules:\n    sys.modules['matplotlib.pyplot'].close('all')`);
    output = []; errors = [];
    scope = py.globals.get('dict')();
    scope.set('__name__', '__main__');
    status('Running your code...');
    await py.runPythonAsync(code, { globals: scope });
    const figureJSON = await py.runPythonAsync(`
import sys, json, io, base64
_plots = []
if 'matplotlib.pyplot' in sys.modules:
    _plt = sys.modules['matplotlib.pyplot']
    for _number in _plt.get_fignums()[:4]:
        _fig = _plt.figure(_number)
        _buf = io.BytesIO()
        _fig.savefig(_buf, format='png', dpi=110, bbox_inches='tight')
        _plots.append({'image': base64.b64encode(_buf.getvalue()).decode(),
            'axes': [{'title': a.get_title(), 'legend': a.get_legend() is not None,
                'points': [len(c.get_offsets()) for c in a.collections]} for a in _fig.axes]})
json.dumps(_plots)
`);
    postMessage({ type: 'result', id, output: output.join('\n'), warnings: errors.join('\n'), plots: JSON.parse(figureJSON) });
  } catch (error) {
    postMessage({ type: 'result', id, output: output.join('\n'), error: String(error), plots: [] });
  } finally { scope?.destroy(); }
};
