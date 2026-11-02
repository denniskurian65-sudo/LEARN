let worker;
let sequence = 0;
let pending;
export function stopPython() {
  worker?.terminate(); worker = null;
  if (pending) { clearTimeout(pending.timer); pending.reject(new Error('Stopped. Your code is still here. Try a smaller step, then run again.')); pending = null; }
}
export function runPython(code, onStatus = () => {}) {
  if (pending) return Promise.reject(new Error('Python is already running.'));
  if (!worker) worker = new Worker(new URL('./python-worker.js', import.meta.url));
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => stopPython(), 180000);
    pending = { reject, timer };
    worker.onmessage = ({ data }) => {
      if (data.type === 'status') { onStatus(data.text); return; }
      if (data.id !== id) return;
      clearTimeout(timer); pending = null; resolve(data);
    };
    worker.onerror = () => {
      clearTimeout(timer); pending = null; worker?.terminate(); worker = null;
      reject(new Error('Python could not load. Check your connection, then run again. Lessons and saved work are still available.'));
    };
    worker.postMessage({ id, code });
  });
}
