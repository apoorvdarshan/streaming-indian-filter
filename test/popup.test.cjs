const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const read = name => readFileSync(new URL('../' + name, 'file://' + __filename), 'utf8');

function setup(t, failure) {
  const dom = new JSDOM(read('popup.html'), { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const runtime = {};
  let saved;
  dom.window.chrome = { runtime, storage: { sync: {
    get: (_, callback) => { if (failure === 'load') runtime.lastError = { message: 'Unavailable' }; callback({ enabled: true, extraTerms: [] }); delete runtime.lastError; },
    set: (cfg, callback) => { saved = cfg; if (failure === 'save') runtime.lastError = { message: 'Quota exceeded' }; callback(); delete runtime.lastError; }
  } } };
  dom.window.eval(read('catalog.js') + '\n' + read('popup.js'));
  return { document: dom.window.document, saved: () => saved };
}

test('popup saves deduplicated terms and enabled setting', t => {
  const app = setup(t);
  app.document.getElementById('terms').value = ' First\nFirst\n\nSecond ';
  app.document.getElementById('enabled').checked = false;
  app.document.getElementById('save').click();
  assert.deepEqual([...app.saved().extraTerms], ['First', 'Second']);
  assert.equal(app.saved().enabled, false);
  assert.match(app.document.getElementById('saved').textContent, /Saved/);
  assert.match(app.document.getElementById('catalog-info').textContent, /movies & shows/);
});

test('popup never claims success when storage rejects a write', t => {
  const app = setup(t, 'save');
  app.document.getElementById('save').click();
  assert.match(app.document.getElementById('saved').textContent, /Could not save/);
  assert.equal(app.document.getElementById('save').disabled, false);
});

test('failed settings load cannot overwrite existing preferences', t => {
  const app = setup(t, 'load');
  assert.ok(app.document.getElementById('save').disabled);
  assert.match(app.document.getElementById('saved').textContent, /Could not load/);
});
