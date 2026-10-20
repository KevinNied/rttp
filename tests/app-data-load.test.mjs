import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { beforeEach, mock, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier.startsWith("@/")
        ? new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href
        : specifier,
      context,
    );
  },
});

const moduleUrl = (path) => new URL(`../src/${path}.ts`, import.meta.url).href;
const emptyData = () => ({
  users: [], routines: [], templates: [], workouts: [], activities: [],
});
const athlete = { id: 5, name: "Test", email: "athlete@test.com", role: "athlete" };
const session = new Map();
const persistent = new Map();
let remote;
let reads;
let migrations;
let writes;
let readError;
let writeError;

mock.module(moduleUrl("lib/rttp-data"), {
  exports: { initialUsers: [athlete], initialRoutines: [] },
});
mock.module(moduleUrl("lib/supabase"), {
  exports: { supabaseConfigured: true },
});
mock.module(moduleUrl("lib/rttp-supabase"), {
  exports: {
    loadSupabaseData: async () => {
      reads++;
      if (readError) throw readError;
      return structuredClone(remote);
    },
    migrateMissingData: async (data) => {
      migrations++;
      remote = structuredClone(data);
      return { 5: 50 };
    },
    remapSupabaseMutation: (mutation) => mutation,
    executeSupabaseMutation: async (mutation) => {
      if (writeError) throw writeError;
      writes++;
      remote.workouts.push(...mutation.data);
    },
  },
});
mock.module(moduleUrl("domain/user/user-normalization"), {
  exports: { normalizeUser: (user) => user },
});
mock.module(moduleUrl("infrastructure/storage/legacy-storage"), {
  exports: { clearDeprecatedLocalStorage: () => {} },
});
mock.module(moduleUrl("infrastructure/storage/web-storage"), {
  exports: {
    readSessionValue: (key) => session.get(key) ?? null,
    writeSessionValue: (key, value) => session.set(key, value),
    removeSessionValue: (key) => session.delete(key),
    readPersistentSessionValue: (key) => persistent.get(key) ?? null,
    writePersistentSessionValue: (key, value) => persistent.set(key, value),
  },
});

const { loadAppData } = await import(moduleUrl("application/data/load-app-data"));
const { executePendingMutations } = await import(
  moduleUrl("infrastructure/sync/outbox-repository")
);
const {
  sessionStorageKey,
  supabaseMigrationStorageKey,
  supabaseMigrationSourceStorageKey,
  supabaseOutboxStorageKey,
} = await import(moduleUrl("infrastructure/storage/storage-keys"));

beforeEach(() => {
  session.clear();
  persistent.clear();
  remote = { ...emptyData(), users: [athlete] };
  reads = migrations = writes = 0;
  readError = writeError = null;
});

const pendingWorkout = { id: "test-workout" };
function queueWorkout() {
  session.set(supabaseOutboxStorageKey, JSON.stringify([
    { id: "test-mutation", type: "save-workouts", data: [pendingWorkout] },
  ]));
}

test("reuses only the current non-mutating bootstrap snapshot", async () => {
  const first = await loadAppData();
  assert.equal(first.remoteDataApplied, true);
  assert.equal(first.syncError, null);
  assert.deepEqual(first.data, remote);
  assert.equal(reads, 1);
  assert.equal(migrations, 0);
  assert.equal(session.get(supabaseMigrationStorageKey), "true");
  assert.equal(await executePendingMutations(), false);

  remote.users[0] = { ...athlete, name: "Updated remotely" };
  const next = await loadAppData();
  assert.equal(reads, 2);
  assert.equal(next.data.users[0].name, "Updated remotely");
});

test("rereads after seeding an empty database and remaps the local selection", async () => {
  remote = emptyData();
  persistent.set(sessionStorageKey, "5");
  const result = await loadAppData();
  assert.equal(result.remoteDataApplied, true);
  assert.deepEqual(result.data.users, [athlete]);
  assert.equal(reads, 2);
  assert.equal(migrations, 1);
  assert.equal(persistent.get(sessionStorageKey), "50");
});

test("invalidates the bootstrap snapshot after replaying pending writes", async () => {
  queueWorkout();
  const result = await loadAppData();
  assert.equal(result.remoteDataApplied, true);
  assert.deepEqual(result.data.workouts, [pendingWorkout]);
  assert.equal(reads, 2);
  assert.equal(writes, 1);
  assert.equal(session.has(supabaseOutboxStorageKey), false);
});

test("an already migrated tab flushes before its single fresh read", async () => {
  session.set(supabaseMigrationStorageKey, "true");
  queueWorkout();
  const result = await loadAppData();
  assert.deepEqual(result.data.workouts, [pendingWorkout]);
  assert.equal(reads, 1);
  assert.equal(writes, 1);
});

test("a failed write remains queued and cannot return a successful stale snapshot", async () => {
  queueWorkout();
  writeError = new Error("Failed to fetch");
  const failed = await loadAppData();
  assert.equal(failed.remoteDataApplied, false);
  assert.equal(failed.syncError, "Revisá tu conexión y volvé a intentarlo.");
  assert.equal(session.has(supabaseOutboxStorageKey), true);
  writeError = null;
  const retried = await loadAppData();
  assert.equal(retried.remoteDataApplied, true);
  assert.deepEqual(retried.data.workouts, [pendingWorkout]);
  assert.equal(writes, 1);
});

test("a failed initial read retains migration recovery and retries remotely", async () => {
  readError = new Error("Failed to fetch");
  const failed = await loadAppData();
  assert.equal(failed.remoteDataApplied, false);
  assert.ok(failed.syncError);
  assert.equal(session.has(supabaseMigrationSourceStorageKey), true);
  readError = null;
  const retried = await loadAppData();
  assert.equal(retried.remoteDataApplied, true);
  assert.equal(reads, 2);
  assert.equal(session.has(supabaseMigrationSourceStorageKey), false);
});

test("resumed migrations with saved local data still invalidate the initial read", async () => {
  const saved = { ...emptyData(), users: [{ ...athlete, name: "Recovered" }] };
  session.set(supabaseMigrationSourceStorageKey, JSON.stringify({
    persistedData: saved,
    dataWithSeeds: emptyData(),
    useSeeds: false,
    mutations: [],
    userId: null,
    athleteId: null,
    remappingStarted: true,
  }));
  const result = await loadAppData();
  assert.equal(result.remoteDataApplied, true);
  assert.equal(result.data.users[0].name, "Recovered");
  assert.equal(reads, 2);
  assert.equal(migrations, 1);
});

test("a malformed migration backup cannot be treated as an empty successful migration", async () => {
  session.set(supabaseMigrationSourceStorageKey, JSON.stringify({
    persistedData: {},
    dataWithSeeds: emptyData(),
    useSeeds: false,
    mutations: [],
    userId: null,
    athleteId: null,
    remappingStarted: true,
  }));
  const result = await loadAppData();
  assert.equal(result.remoteDataApplied, false);
  assert.equal(result.syncError, "No se pudo validar el respaldo temporal de la migración.");
  assert.equal(session.has(supabaseMigrationSourceStorageKey), true);
  assert.notEqual(session.get(supabaseMigrationStorageKey), "true");
  assert.equal(migrations, 0);
});
