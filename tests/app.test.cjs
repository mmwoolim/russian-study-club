const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const wordData = html.match(/id="word-data"[^>]*>(.*?)<\/script>/s)[1];

async function room(saved = new Map()) {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      textContent: selector === '#word-data' ? wordData : selector === '#embedded-progress' ? 'null' : '',
      innerHTML: '', style: {}, value: '', dataset: {}, open: false,
      querySelectorAll: () => [], setAttribute() {},
    });
    return elements.get(selector);
  };
  const context = vm.createContext({
    document: {querySelector: element, querySelectorAll: () => [], addEventListener() {}},
    window: {createProgressStorage: () => ({start: async () => {}, changed() {}}), addEventListener() {}},
    localStorage: {getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value)},
    setTimeout: () => 1, clearTimeout() {},
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  await new Promise(setImmediate);
  return {run: code => vm.runInContext(code, context), element, saved};
}

test('learning decisions persist across reloads and track forgotten words', async () => {
  const a = await room();
  a.run('mark(words[0], true); mark(words[0], false); mark(words[0], false); stats()');
  assert.equal(a.run('progress(words[0]).forgotten'), 1);
  assert.equal(a.run('progress(words[0]).again'), 2);
  assert.equal(a.element('#importantTotal').textContent, 1);
  assert.equal(a.element('#todayTotal').textContent, 1);
  const b = await room(a.saved);
  assert.equal(b.run('progress(words[0]).again'), 2);
  assert.equal(b.run('progress(words[0]).learned'), false);
});

test('quiz choices accept one decision per question and produce results', async () => {
  const a = await room();
  a.run("quiz={items:[words[0], words[1]],at:0,results:[],direction:'ru',answered:false,finished:false};renderQuestion();answer(quiz.choices.findIndex(w=>w.id===words[0].id));answer(0)");
  assert.equal(a.run('quiz.results.length'), 1);
  assert.equal(a.run('quiz.results[0].correct'), true);
  a.element('#continueQuiz').onclick();
  a.run('answer(quiz.choices.findIndex(w=>w.id!==words[1].id))');
  a.element('#continueQuiz').onclick();
  assert.equal(a.run('quiz.finished'), true);
  assert.equal(a.run('quiz.results.filter(r=>!r.correct).length'), 1);
  assert.match(a.element('#content').innerHTML, /Retry missed words/);
  a.element('#retryQuiz').onclick();
  assert.equal(a.run('quiz.items.length'), 1);
  assert.equal(a.run('quiz.items[0].id===words[1].id'), true);
});

test('backup validation rejects unrelated files and drops unknown words', async () => {
  const a = await room();
  assert.throws(() => a.run("restore({app:'another-app',version:2,state:{practice:{}}})"));
  a.run("const backup=snapshot();backup.state.practice.unknown={known:99};backup.state.practice[words[0].id]={known:-5,again:2,learned:true};restore(backup)");
  assert.equal(a.run('Object.keys(state.practice).length'), 1);
  assert.equal(a.run('progress(words[0]).known'), 0);
  assert.equal(a.run('progress(words[0]).again'), 2);
});

test('search ignores stress and yo variants, and filters separate levels', async () => {
  const a = await room();
  assert.equal(a.run("clean('ЗЕЛЁНЫЙ')===clean('зелены́й')"), true);
  a.run("category='A1'");
  assert.equal(a.run("pool().every(w=>w.level==='A1')"), true);
  a.run("category='A2'");
  assert.equal(a.run("pool().every(w=>w.level==='A2')"), true);
  assert.ok(a.run('pool().length') > 0);
});
