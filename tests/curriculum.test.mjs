import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons as first, roadmap } from '../src/lessons.js';
import { laterLessons } from '../src/later-lessons.js';
import { interviewTopics, allCards } from '../src/interview.js';
import { readState, writeState, normalizeOutput, STORAGE_KEY } from '../src/state.js';
const lessons = [...first, ...laterLessons];

test('Days 1-15 each have three lessons and a final Mission under one hour', () => {
  assert.equal(lessons.length, 60);
  assert.equal(new Set(lessons.map(l => l.id)).size, 60);
  for (let day = 1; day <= 15; day++) {
    const items = lessons.filter(l => l.day === day);
    assert.equal(items.length, 4);
    assert.equal(items.filter(l => l.mission).length, 1);
    assert.equal(items.at(-1).mission, true);
    assert.ok(items.reduce((sum, l) => sum + l.minutes, 0) < 60);
    for (const l of items) {
      for (const field of ['story', 'task', 'hint', 'code', 'answer']) assert.ok(l[field], `${l.id}: ${field}`);
      assert.ok(l.paragraphs.length <= 4);
      if (!l.mission) { assert.ok(l.question); assert.ok(l.options[l.correct]); }
      assert.doesNotMatch(l.code, /read_csv|read_file|https?:\/\/|input\(/);
    }
  }
  assert.equal(roadmap.length, 21);
});

test('Interview cards cover all requested areas without invented employment', () => {
  assert.equal(interviewTopics.length, 8);
  assert.equal(allCards.length, 37);
  for (const c of allCards) { assert.ok(c.question); assert.ok(c.answer); assert.ok(c.cue); }
  const text = allCards.map(c => c.answer).join(' ');
  assert.match(text, /student capstone/);
  assert.match(text, /March 4, 2029/);
  assert.match(text, /I haven.t had a paid GIS role yet/);
  assert.doesNotMatch(text, /MicroStation|Civil 3D|Power BI|utility locating/);
});

test('Learning text uses the requested punctuation and avoids the banned phrases', () => {
  const text = JSON.stringify([lessons, interviewTopics, roadmap]);
  assert.doesNotMatch(text, /[\u2013\u2014]/);
  assert.doesNotMatch(text, /I am excited to|passionate about|leverage|delve|seamless|robust|furthermore|moreover|in today.s fast-paced world|a testament to/i);
});

test('Progress, answers, and edited code survive storage round trips', () => {
  const memory = new Map();
  const storage = { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) };
  const state = readState(storage);
  state.completed.push('d1-hello'); state.drafts['d1-hello'] = 'print("Dennis")'; state.answers['d1-hello'] = true;
  assert.ok(writeState(state, storage));
  assert.deepEqual(readState(storage), state);
  memory.set(STORAGE_KEY, '{bad json');
  assert.equal(readState(storage).lesson, 'd1-hello');
});

test('Disabled storage has a usable fallback', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(readState(blocked).completed, []);
  assert.equal(writeState(readState(blocked), blocked), false);
});

test('Mission comparison ignores table spacing but retains rows and values', () => {
  assert.equal(normalizeOutput(' A   B\n 101   52 \n'), normalizeOutput('A B\n101 52'));
  assert.notEqual(normalizeOutput('101 52'), normalizeOutput('101 53'));
});
