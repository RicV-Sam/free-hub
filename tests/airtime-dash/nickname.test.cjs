const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const modulePromise = import(`data:text/javascript;base64,${fs.readFileSync(path.join(__dirname, "../../shared/airtime-dash-nickname.js")).toString("base64")}`);
const pending = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test("returning sign-in restores the saved name; late results cannot leak another account's name", async () => {
  const { createNicknameRestorer } = await modulePromise;
  const field = { value: "" }, alice = { uid: "alice" }, bob = { uid: "bob" };
  let response = pending();
  const client = { user: alice, call: () => response.promise };
  const restore = createNicknameRestorer(field, client);
  const first = restore(alice); response.resolve({ displayName: "Alice" }); await first;
  assert.equal(field.value, "Alice");
  client.user = null; await restore(null); assert.equal(field.value, "");
  client.user = alice; response = pending(); const lateAlice = restore(alice), aliceResponse = response;
  client.user = bob; response = pending(); const newBob = restore(bob);
  response.resolve({ displayName: "Bob" }); await newBob;
  aliceResponse.resolve({ displayName: "Alice" }); await lateAlice;
  assert.equal(field.value, "Bob");
});

test("loading a nickname preserves manual edits and leaves new or offline players able to choose one", async () => {
  const { createNicknameRestorer } = await modulePromise;
  const field = { value: "" }, user = { uid: "alice" }, response = pending();
  const client = { user, call: () => response.promise }, restore = createNicknameRestorer(field, client);
  const loading = restore(user); field.value = "My new name";
  response.resolve({ displayName: "Saved name" }); await loading; assert.equal(field.value, "My new name");
  client.user = { uid: "new" }; client.call = async () => ({ displayName: null });
  await restore(client.user); assert.equal(field.value, "");
  client.user = { uid: "offline" }; client.call = async () => { throw new Error("Unavailable"); };
  await restore(client.user); assert.equal(field.value, "");
});
