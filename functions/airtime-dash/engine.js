/* Original FreeHub maze simulation. Shared by the browser and trusted verifier. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FreeHubDashEngine = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const VERSION = Object.freeze({ game: "dash-1", map: "mazes-1", scoring: "points-1", difficulty: "curve-1" });
  const CONFIG = Object.freeze({ width: 17, height: 19, hz: 20, playerPeriod: 4, protectionTicks: 40,
    practiceTicks: 500, checkpointTicks: 80, maxChunkTicks: 240, maxInputs: 240,
    inactivityMs: 20000, clockSlackTicks: 20, seeds: [77191, 18013, 41839], points: [0, 10, 25, 50, 75, 100] });
  const DIRS = [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]];
  const index = (x, y) => y * CONFIG.width + x;
  function random(seed) {
    let value = seed >>> 0;
    return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
  }
  function maze(level) {
    const rand = random(CONFIG.seeds[(level - 1) % CONFIG.seeds.length]);
    const walls = Array(CONFIG.width * CONFIG.height).fill(1), stack = [[1, 1]];
    walls[index(1, 1)] = 0;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const choices = DIRS.slice(1).filter(([dx, dy]) => {
        const nx = x + dx * 2, ny = y + dy * 2;
        return nx > 0 && nx < CONFIG.width - 1 && ny > 0 && ny < CONFIG.height - 1 && walls[index(nx, ny)];
      });
      if (!choices.length) { stack.pop(); continue; }
      const [dx, dy] = choices[Math.floor(rand() * choices.length)];
      walls[index(x + dx, y + dy)] = walls[index(x + dx * 2, y + dy * 2)] = 0;
      stack.push([x + dx * 2, y + dy * 2]);
    }
    // Add loops to the original generated maze, so pursuit has escape routes.
    for (let y = 1; y < CONFIG.height - 1; y++) for (let x = 1; x < CONFIG.width - 1; x++) {
      if (walls[index(x, y)] && ((x % 2 === 0) !== (y % 2 === 0)) && rand() < .22) walls[index(x, y)] = 0;
    }
    return walls;
  }
  function difficulty(level) {
    return { enemyPeriod: Math.max(5, 10 - Math.floor((level + 1) / 2)), enemyCount: level < 3 ? 2 : level < 5 ? 3 : 4,
      pursuit: Math.min(4, level) };
  }
  function loadLevel(state, level) {
    state.level = level; state.walls = maze(level); state.levelStartedTick = state.tick;
    state.player = { x: 1, y: CONFIG.height - 2, direction: 0, queued: 0 };
    const spawns = [[15, 1], [15, 17], [1, 1], [9, 1]];
    state.enemies = spawns.slice(0, difficulty(level).enemyCount).map(([x, y], i) => ({ x, y, direction: i + 1 }));
    state.items = state.walls.map((wall, i) => wall ? 0 : i % 53 === 0 ? 5 : i % 37 === 0 ? 4 : i % 23 === 0 ? 3 : i % 13 === 0 ? 2 : 1);
    state.items[index(state.player.x, state.player.y)] = 0;
    for (const e of state.enemies) state.items[index(e.x, e.y)] = 0;
    state.remaining = state.items.filter(Boolean).length;
    state.protectedUntil = state.tick + CONFIG.protectionTicks;
  }
  function create() {
    const state = { tick: 0, score: 0, lives: 3, collisions: 0, level: 1, gameOver: false, counts: [0, 0, 0, 0, 0, 0] };
    loadLevel(state, 1); return state;
  }
  function available(walls, actor, direction) {
    const [dx, dy] = DIRS[direction];
    const x = actor.x + dx, y = actor.y + dy;
    return direction > 0 && x >= 0 && y >= 0 && x < CONFIG.width && y < CONFIG.height && walls[index(x, y)] === 0;
  }
  function move(actor, direction) { actor.x += DIRS[direction][0]; actor.y += DIRS[direction][1]; actor.direction = direction; }
  function distances(walls, player) {
    const result = Array(walls.length).fill(-1), queue = [index(player.x, player.y)];
    result[queue[0]] = 0;
    for (let p = 0; p < queue.length; p++) {
      const at = queue[p], actor = { x: at % CONFIG.width, y: Math.floor(at / CONFIG.width) };
      for (let d = 1; d <= 4; d++) if (available(walls, actor, d)) {
        const next = index(actor.x + DIRS[d][0], actor.y + DIRS[d][1]);
        if (result[next] === -1) { result[next] = result[at] + 1; queue.push(next); }
      }
    }
    return result;
  }
  function step(state, direction = 0) {
    if (state.gameOver) return state;
    if (!Number.isInteger(direction) || direction < 0 || direction > 4) throw new Error("Invalid direction");
    state.tick++;
    if (direction) state.player.queued = direction;
    const previousPlayer = { ...state.player }, previousEnemies = state.enemies.map(e => ({ ...e }));
    if (state.tick % CONFIG.playerPeriod === 0) {
      if (available(state.walls, state.player, state.player.queued)) state.player.direction = state.player.queued;
      if (available(state.walls, state.player, state.player.direction)) move(state.player, state.player.direction);
      const at = index(state.player.x, state.player.y), item = state.items[at];
      if (item) { state.score += CONFIG.points[item]; state.counts[item]++; state.items[at] = 0; state.remaining--; }
    }
    const curve = difficulty(state.level);
    if (state.tick - state.levelStartedTick >= CONFIG.protectionTicks && state.tick % curve.enemyPeriod === 0) {
      const distance = distances(state.walls, state.player);
      state.enemies.forEach((enemy, i) => {
        let choices = [1, 2, 3, 4].filter(d => available(state.walls, enemy, d));
        const reverse = ((enemy.direction + 1) % 4) + 1;
        if (choices.length > 1) choices = choices.filter(d => d !== reverse);
        if ((Math.floor(state.tick / curve.enemyPeriod) + i) % 5 < curve.pursuit) {
          choices.sort((a, b) => distance[index(enemy.x + DIRS[a][0], enemy.y + DIRS[a][1])] - distance[index(enemy.x + DIRS[b][0], enemy.y + DIRS[b][1])]);
        } else choices.sort((a, b) => ((a + i + Math.floor(state.tick / curve.enemyPeriod)) % 4) - ((b + i + Math.floor(state.tick / curve.enemyPeriod)) % 4));
        if (choices.length) move(enemy, choices[0]);
      });
    }
    const hit = state.enemies.some((e, i) => (e.x === state.player.x && e.y === state.player.y) ||
      (e.x === previousPlayer.x && e.y === previousPlayer.y && previousEnemies[i].x === state.player.x && previousEnemies[i].y === state.player.y));
    if (hit && state.tick >= state.protectedUntil) {
      state.lives--; state.collisions++; state.protectedUntil = state.tick + CONFIG.protectionTicks;
      if (!state.lives) state.gameOver = true;
      else {
        state.player = { x: 1, y: CONFIG.height - 2, direction: 0, queued: 0 };
        // Reset enemies away from the recovery tile; neither score nor lives refill.
        state.enemies.forEach((e, i) => { e.x = [15, 15, 1, 9][i]; e.y = [1, 17, 1, 1][i]; e.direction = i + 1; });
      }
    }
    if (!state.gameOver && state.remaining === 0) loadLevel(state, state.level + 1);
    return state;
  }
  function advance(state, toTick, inputs) {
    if (!Number.isSafeInteger(toTick) || toTick < state.tick || toTick - state.tick > CONFIG.maxChunkTicks) throw new Error("Invalid simulation interval");
    if (!Array.isArray(inputs) || inputs.length > CONFIG.maxInputs) throw new Error("Too many inputs");
    let last = state.tick;
    for (const input of inputs) {
      if (!input || !Number.isSafeInteger(input.tick) || input.tick <= last || input.tick > toTick || !Number.isInteger(input.direction) || input.direction < 1 || input.direction > 4) throw new Error("Invalid input sequence");
      last = input.tick;
    }
    let cursor = 0;
    while (state.tick < toTick && !state.gameOver) {
      const input = inputs[cursor]?.tick === state.tick + 1 ? inputs[cursor++].direction : 0;
      step(state, input);
    }
    return state;
  }
  return { VERSION, CONFIG, DIRS, create, step, advance, maze, difficulty, available, distances, index };
});
