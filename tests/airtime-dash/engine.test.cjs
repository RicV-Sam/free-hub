const test = require("node:test"), assert = require("node:assert/strict");
const E = require("../../functions/airtime-dash/engine.js");
test("original mazes are connected, deterministic and repeat without a final level", () => {
  for (let level = 1; level <= 12; level++) {
    const walls = E.maze(level), distances = E.distances(walls, { x: 1, y: 17 });
    assert.deepEqual(walls, E.maze(level + 3));
    for (let at = 0; at < walls.length; at++) if (!walls[at]) assert.ok(distances[at] >= 0);
    for (const [x, y] of [[15, 1], [15, 17], [1, 1], [9, 1]]) assert.equal(walls[E.index(x, y)], 0);
  }
});
test("clearing repeated levels preserves score and lives, with capped increasing difficulty", () => {
  const state = E.create(); state.lives = 2;
  for (let level = 1; level <= 12; level++) {
    const direction = [1, 2, 3, 4].find(d => E.available(state.walls, state.player, d));
    const [dx, dy] = E.DIRS[direction], at = E.index(state.player.x + dx, state.player.y + dy);
    state.items.fill(0); state.items[at] = 1; state.remaining = 1;
    while (state.level === level) E.step(state, direction);
    assert.equal(state.lives, 2); assert.equal(state.score, level * 10);
  }
  assert.ok(E.difficulty(3).enemyPeriod < E.difficulty(1).enemyPeriod);
  assert.deepEqual(E.difficulty(10000), E.difficulty(100000));
});
test("a surviving run lasts beyond 60 seconds without a countdown", () => {
  const state = E.create(); state.enemies = []; // Isolate the absence of a duration limit.
  for (let n = 0; n < E.CONFIG.hz * 120; n++) E.step(state);
  assert.equal(state.tick, 2400); assert.equal(state.gameOver, false); assert.equal(state.lives, 3);
});
test("a collision costs one life, repeated contact is protected and the third loss ends play", () => {
  const state = E.create(); state.protectedUntil = 0; state.enemies = [{ ...state.player, direction: 1 }];
  E.step(state); assert.equal(state.lives, 2);
  state.enemies = [{ ...state.player, direction: 1 }]; E.step(state); assert.equal(state.lives, 2);
  for (const remaining of [1, 0]) { state.protectedUntil = 0; state.enemies = [{ ...state.player, direction: 1 }]; E.step(state); assert.equal(state.lives, remaining); }
  assert.equal(state.gameOver, true); const tick = state.tick; E.step(state); assert.equal(state.tick, tick);
});
test("incremental replay matches continuous play and rejects malformed inputs", () => {
  const continuous = E.create(), replay = E.create(), directions = new Map([[1, 1], [81, 2], [161, 3]]);
  for (let tick = 1; tick <= 240; tick++) E.step(continuous, directions.get(tick) || 0);
  E.advance(replay, 80, [{ tick: 1, direction: 1 }]); E.advance(replay, 160, [{ tick: 81, direction: 2 }]); E.advance(replay, 240, [{ tick: 161, direction: 3 }]);
  assert.deepEqual(replay, continuous);
  assert.throws(() => E.advance(E.create(), 1000, []));
  assert.throws(() => E.advance(E.create(), 10, [{ tick: 1, direction: 100 }]));
  assert.throws(() => E.advance(E.create(), 10, [{ tick: 2, direction: 1 }, { tick: 1, direction: 2 }]));
});
