import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('src/lib/delete-owner-property.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function setup({ ownerId = 'owner', signedIn = true, events = 0, missingGuide = false } = {}) {
  const data = new Map([
    ['properties/home', { ownerId }],
    ['properties/other', { ownerId: 'someone-else' }],
    ['public_guides/stay', { propertyId: 'home', ownerId }],
    ['reservations/stay', { propertyId: 'home', ownerId }],
    ['guide_messages/message', { propertyId: 'home', ownerId }],
    ['public_guides/other', { propertyId: 'other', ownerId: 'someone-else' }],
  ]);
  if (!missingGuide) data.set('public_guides/home', { propertyId: 'home', ownerId });
  for (let i = 0; i < events; i++) data.set(`guide_events/${i}`, { propertyId: 'home', ownerId });
  const commits = [];
  const state = { failBatch: 0, failQuery: false };
  const snapshot = (ref) => ({ ref, exists: () => data.has(ref.path), data: () => data.get(ref.path) });
  const api = {
    doc: (_, name, id) => ({ path: `${name}/${id}` }),
    collection: (_, name) => name,
    where: (field, _, value) => ({ field, value }),
    query: (name, ...filters) => ({ name, filters }),
    getDoc: async (ref) => snapshot(ref),
    updateDoc: async (ref, changes) => data.set(ref.path, { ...data.get(ref.path), ...changes }),
    getDocs: async ({ name, filters }) => {
      assert.equal(data.get('properties/home').isDeleting, true, 'writes frozen before cleanup reads');
      if (state.failQuery) throw new Error('permission-denied');
      return { docs: [...data].filter(([path, value]) => path.startsWith(`${name}/`) && filters.every((f) => value[f.field] === f.value)).map(([path]) => snapshot({ path })) };
    },
    writeBatch: () => {
      const paths = [];
      return {
        delete: (ref) => paths.push(ref.path),
        commit: async () => {
          assert.ok(data.has('properties/home'), 'ownership retained for cleanup');
          assert.ok(paths.length <= 450);
          if (state.failBatch === commits.length + 1) throw new Error('unavailable');
          commits.push(paths);
          paths.forEach((path) => data.delete(path));
        },
      };
    },
    runTransaction: async (_, callback) => {
      const paths = [];
      await callback({ get: async (ref) => snapshot(ref), delete: (ref) => paths.push(ref.path) });
      commits.push(paths);
      paths.forEach((path) => data.delete(path));
    },
  };
  const exports = {};
  runInNewContext(source, { exports, require: (name) => {
    if (name === 'firebase/firestore') return api;
    if (name === '@/lib/firebase/client') return { firebaseAuth: { currentUser: signedIn ? { uid: 'owner' } : null }, firestore: {} };
    throw new Error(name);
  } });
  return { remove: () => exports.deleteOwnerProperty('home'), data, commits, state };
}

test('deletes property and its data, preserves unrelated properties', async () => {
  const { remove, data, commits } = setup();
  await remove();
  assert.deepEqual([...data.keys()], ['properties/other', 'public_guides/other']);
  assert.deepEqual(commits.at(-1), ['public_guides/home', 'properties/home']);
});
test('rejects an unsigned-in user without writes', async () => {
  const { remove, data, commits } = setup({ signedIn: false });
  await assert.rejects(remove, /session/);
  assert.equal(data.get('properties/home').isDeleting, undefined);
  assert.equal(commits.length, 0);
});
test('rejects another owner without writes', async () => {
  const { remove, data } = setup({ ownerId: 'someone-else' });
  await assert.rejects(remove, /appartient/);
  assert.equal(data.get('properties/home').isDeleting, undefined);
});
test('supports more than one Firestore batch', async () => {
  const { remove, data, commits } = setup({ events: 1000 });
  await remove();
  assert.equal(commits.length, 4);
  assert.equal(data.size, 2);
});
test('a partial failure retains ownership and can be retried', async () => {
  const { remove, data, state } = setup({ events: 1000 });
  state.failBatch = 2;
  await assert.rejects(remove, /unavailable/);
  assert.equal(data.get('properties/home').isDeleting, true);
  state.failBatch = 0;
  await remove();
  assert.equal(data.size, 2);
});
test('a query failure performs no deletes and can be retried', async () => {
  const { remove, state, commits, data } = setup();
  state.failQuery = true;
  await assert.rejects(remove, /permission-denied/);
  assert.equal(commits.length, 0);
  state.failQuery = false;
  await remove();
  assert.equal(data.size, 2);
});
test('handles a property without its canonical guide', async () => {
  const { remove, data, commits } = setup({ missingGuide: true });
  await remove();
  assert.equal(data.size, 2);
  assert.deepEqual(commits.at(-1), ['properties/home']);
});
