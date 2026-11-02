export const STORAGE_KEY = 'dennis-fieldnotes-v1';
export function readState(storage) {
  try {
    storage ??= globalThis.localStorage;
    const data = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return {
      course: data.course === 'interview' ? 'interview' : 'python',
      lesson: typeof data.lesson === 'string' ? data.lesson : 'd1-hello',
      topic: typeof data.topic === 'string' ? data.topic : 'intro',
      completed: Array.isArray(data.completed) ? data.completed.filter(x => typeof x === 'string') : [],
      drafts: data.drafts && typeof data.drafts === 'object' && !Array.isArray(data.drafts) ? data.drafts : {},
      answers: data.answers && typeof data.answers === 'object' ? data.answers : {}
    };
  } catch { return { course: 'python', lesson: 'd1-hello', topic: 'intro', completed: [], drafts: {}, answers: {} }; }
}
export function writeState(state, storage) {
  try { (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function normalizeOutput(value) { return value.trim().split('\n').map(line => line.trim().replace(/\s+/g, ' ')).join('\n'); }
