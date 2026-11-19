const test = require('node:test');
const assert = require('node:assert/strict');
const {sample, solve} = require('./planner');

test('demo shifts EV charging to the last two hours', () => {
  assert.equal(solve(sample, false).yuan, 10.128);
  const best = solve(sample);
  assert.equal(best.yuan, 5.508);
  assert.deepEqual(best.runs.at(-1), {id: 0, slot: 44, end: 48});
});

test('the more powerful load gets the only cheap hour', () => {
  const jobs = [1000, 3000].map(watts => ({watts, from: 42, until: 46, length: 2}));
  const best = solve(jobs);
  assert.equal(best.yuan, 1.98);
  assert.deepEqual(best.runs.map(run => [run.id, run.slot]), [[0, 42], [1, 44]]);
});

test('the earliest feasible plan can leave time free before a fixed job', () => {
  const jobs = [{watts: 1000, from: 0, until: 6, length: 3},
                {watts: 500, from: 1, until: 2, length: 1}];
  for (const cheapest of [false, true]) {
    assert.deepEqual(solve(jobs, cheapest).runs.map(run => run.slot), [1, 2]);
  }
});

test('overlapping fixed windows return no plan', () => {
  const fixed = {watts: 1000, from: 44, until: 48, length: 4};
  for (const cheapest of [false, true]) assert.equal(solve([fixed, fixed], cheapest), null);
});
