const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const read = path => readFileSync(new URL('../' + path, 'file://' + __filename), 'utf8');
const catalogSource = read('catalog.js');
const matcherSource = read('matcher.js');
const contentSource = read('content.js');
const fixture = read('test/fixtures/prime.html');
const context = vm.createContext({});
vm.runInContext(catalogSource + '\n' + matcherSource + '\nthis.matcher = RegionalMatcher.create(); this.catalog = INDIAN_CATALOG; this.normalize = RegionalMatcher.normalize;', context);
const { matcher, catalog } = context;

function setup(t, html = fixture, site = 'www.primevideo.com', initial = {}) {
  const dom = new JSDOM(html, { url: `https://${site}/`, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  let settings = { enabled: true, extraTerms: [], ...initial };
  let listener;
  dom.window.chrome = {
    runtime: {},
    storage: {
      sync: { get: (_, callback) => callback(settings) },
      onChanged: { addListener: fn => listener = fn }
    }
  };
  dom.window.eval(catalogSource + '\n' + matcherSource + '\n' + contentSource);
  return {
    window: dom.window,
    document: dom.window.document,
    hidden: id => dom.window.document.getElementById(id).style.display === 'none',
    update: next => { settings = { ...settings, ...next }; listener(Object.fromEntries(Object.keys(next).map(key => [key, {}])), 'sync'); },
    settle: () => new Promise(resolve => setTimeout(resolve, 180))
  };
}

test('catalog has verified-origin films and series, with collision safeguards', () => {
  assert.ok(catalog.works > 10000);
  assert.ok(Object.keys(catalog.titles).length > 10000);
  assert.ok(catalog.ambiguous.length > 50);
  for (const title of ['Mirzapur', 'Panchayat', 'Sacred Games', 'Manorama Six Feet Under', 'Drishyam 2', 'Jailer', 'Kantara', 'Delhi Crime', 'Jamtara', 'Breathe: Into the Shadows', 'Taj Mahal 1989']) {
    assert.ok(matcher.isBlockedTitle(title), title);
  }
});

test('matches UI prefixes, seasons, punctuation, years, language editions and movie suffixes', () => {
  for (const title of ['Play Sacred Games', 'Mirzapur: The Movie', 'Mirzapur – Season 3', 'Watch Panchayat Season 2', 'Jailer (Hindi)', 'Drishyam 2 (Hindi)', 'Sacred Games | Netflix']) {
    assert.ok(matcher.isBlockedTitle(title), title);
  }
});

test('foreign productions, dubbing, plot mentions and shared-name remakes stay visible', () => {
  for (const title of ['Blade Runner 2049', 'Casino Royale', 'The Mongoose', 'Drive (2011)', 'Animal Farm', 'Master and Commander', 'An adventure through India', 'A story mentioning Mirzapur in its synopsis']) {
    assert.equal(matcher.isBlockedTitle(title), false, title);
  }
  assert.equal(matcher.isBlockedTitle('Casino Royale (Hindi)'), false);
  assert.equal(matcher.isBlockedTitle('अनजान'), false, 'script alone is not origin');
  assert.equal(matcher.isBlockedTitle('Drive'), true);
  assert.equal(matcher.isBlockedTitle('Jailer', { country: 'United States' }), false);
  assert.equal(matcher.isBlockedTitle('Uncataloged New Release', { country: 'IN' }), true);
});

test('shared names can be preserved with the safer matching option', () => {
  const cautious = vm.runInContext('RegionalMatcher.create([], { hideAmbiguous: false })', context);
  assert.equal(cautious.isBlockedTitle('Drive'), false);
  assert.equal(cautious.isBlockedTitle('The Family Man'), false);
  assert.equal(cautious.isBlockedTitle('The Family Man', { country: 'India' }), true);
});

test('Prime poster, button and hero labels are recognized without hiding mixed rows', t => {
  const app = setup(t);
  for (const id of ['mirzapur', 'jailer', 'regional']) assert.ok(app.hidden(id), id);
  for (const id of ['foreign', 'collision', 'recommendations', 'mixed']) assert.equal(app.hidden(id), false, id);
  assert.equal(app.document.querySelector('#hero article').style.display, 'none');
});

test('Netflix fallback text and image alts work even when the first label is a control', t => {
  const app = setup(t, `
    <div class="lolomoRow" id="row"><h2 class="row-header-title">Recommended for you</h2>
      <div class="slider-item" id="card"><div class="title-card"><button aria-label="Add to my list"></button><img alt="Sacred Games"></div></div>
      <div class="slider-item" id="keep"><div class="title-card"><span class="fallback-text">Blade Runner 2049</span></div></div>
    </div><div class="billboard-row" id="billboard"><img class="title-logo" alt="Panchayat"></div>`, 'www.netflix.com');
  assert.ok(app.hidden('card'));
  assert.ok(app.hidden('billboard'));
  assert.equal(app.hidden('keep'), false);
  assert.equal(app.hidden('row'), false);
});

test('Amazon /dp cards work', t => {
  const app = setup(t, '<article id="card"><a href="/gp/video/detail/EXAMPLE"><img alt="Panchayat"></a></article><a id="dp" href="/dp/EXAMPLE"><img alt="Sacred Games"></a>', 'www.amazon.in');
  assert.ok(app.hidden('card'));
  assert.ok(app.hidden('dp'));
});

test('Prime cards with only a labelled button are filtered', t => {
  const app = setup(t, '<article id="card"><button aria-label="Mirzapur: The Movie"></button></article><article id="keep"><button aria-label="Blade Runner 2049"></button></article>');
  assert.ok(app.hidden('card'));
  assert.equal(app.hidden('keep'), false);
});

test('shared-name preference changes immediately restore matching cards', t => {
  const app = setup(t, '<article id="card"><img alt="The Family Man"></article>');
  assert.ok(app.hidden('card'));
  app.update({ hideAmbiguous: false });
  assert.equal(app.hidden('card'), false);
});

test('lazy-loaded posters and recycled cards are re-evaluated', async t => {
  const app = setup(t);
  const image = app.document.querySelector('#mirzapur img');
  image.alt = 'Blade Runner 2049';
  app.document.querySelector('#mirzapur h3').textContent = 'Blade Runner 2049';
  await app.settle();
  assert.equal(app.hidden('mirzapur'), false);
  assert.equal(app.document.getElementById('mirzapur').style.getPropertyValue('display'), 'grid');
  assert.equal(app.document.getElementById('mirzapur').style.getPropertyPriority('display'), 'important');
  const li = app.document.createElement('li');
  li.id = 'lazy';
  li.innerHTML = '<article><a href="/detail/NEW"><img alt="Sacred Games"></a></article>';
  app.document.querySelector('#recommendations ul').append(li);
  await app.settle();
  assert.ok(app.hidden('lazy'));
  app.document.querySelector('#lazy img').alt = 'Casino Royale';
  await app.settle();
  assert.equal(app.hidden('lazy'), false);
});

test('disabling restores original display and terms apply/remove without refresh', t => {
  const app = setup(t);
  app.update({ enabled: false });
  assert.equal(app.hidden('mirzapur'), false);
  assert.equal(app.document.getElementById('mirzapur').style.getPropertyValue('display'), 'grid');
  assert.equal(app.document.getElementById('mirzapur').style.getPropertyPriority('display'), 'important');
  app.update({ enabled: true, extraTerms: ['Custom Example'] });
  assert.ok(app.hidden('custom'));
  app.update({ extraTerms: [] });
  assert.equal(app.hidden('custom'), false);
  assert.ok(app.hidden('mirzapur'));
});

test('custom words use Unicode-safe boundaries and escaped punctuation', () => {
  const custom = vm.runInContext('RegionalMatcher.create(["नमस्ते", "A+B", "cat"])', context);
  assert.ok(custom.isBlockedTitle('नमस्ते दुनिया'));
  assert.ok(custom.isBlockedTitle('A+B'));
  assert.equal(custom.isBlockedTitle('Cathedral Tales'), false);
});

test('all content scripts are bundled in dependency order', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.deepEqual(manifest.content_scripts[0].js, ['catalog.js', 'matcher.js', 'content.js']);
  assert.deepEqual(manifest.permissions, ['storage']);
});
