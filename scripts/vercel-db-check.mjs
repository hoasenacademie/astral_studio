import { readFile } from "node:fs/promises";

const BASE_URL = process.env.BASE_URL || "https://astral-studio-hsa.vercel.app";
const LOCAL_FILE = "data/storage/reports.json";

async function request(path, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    },
    ...init
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, json };
}

async function loadLocalReports() {
  try {
    const raw = await readFile(LOCAL_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.reports)) return [];
    return parsed.reports;
  } catch {
    return [];
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function migrateMissingReports() {
  const localReports = await loadLocalReports();
  const dbList = await request("/api/reports", { method: "GET" });
  if (!dbList.ok || !dbList.json?.reports) {
    throw new Error(`GET /api/reports failed (status ${dbList.status})`);
  }

  const dbIds = new Set(dbList.json.reports.map((r) => r.id));
  const missing = localReports.filter((r) => r?.id && !dbIds.has(r.id));

  for (const report of missing) {
    const save = await request("/api/reports", {
      method: "POST",
      body: JSON.stringify(report)
    });
    if (!save.ok || !save.json?.report?.id) {
      throw new Error(`Migration POST failed for id ${report.id} (status ${save.status})`);
    }
  }

  const after = await request("/api/reports", { method: "GET" });
  if (!after.ok || !after.json?.reports) {
    throw new Error(`GET /api/reports after migration failed (status ${after.status})`);
  }

  return {
    localCount: localReports.length,
    dbCountBefore: dbList.json.reports.length,
    missingCount: missing.length,
    dbCountAfter: after.json.reports.length
  };
}

async function runCrudSmokeCheck() {
  const before = await request("/api/reports", { method: "GET" });
  if (!before.ok || !before.json?.reports) {
    throw new Error(`GET /api/reports failed (status ${before.status})`);
  }
  if (before.json.reports.length === 0) {
    throw new Error("No report available to derive a valid smoke payload.");
  }

  const testId = `smoke_${Date.now()}`;
  const payload = clone(before.json.reports[0]);
  payload.id = testId;
  payload.mode = "solo";
  payload.status = "draft";
  payload.meta = payload.meta || {};
  payload.meta.title = "SMOKE TEST DB";
  payload.meta.subtitle = "save-list-get-delete";
  payload.share = { isPublished: false, shareToken: null, publishedAt: null };
  payload.rawInputB = "";
  payload.parsedB = undefined;
  payload.subjects = { solo: payload.subjects?.solo || {} };
  payload.createdAt = new Date().toISOString();
  payload.updatedAt = new Date().toISOString();

  const save = await request("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!save.ok || !save.json?.report?.id) {
    throw new Error(`SAVE failed (status ${save.status})`);
  }
  if (save.json.report.id !== testId) {
    throw new Error(`SAVE failed: expected id ${testId}, got ${save.json.report.id}`);
  }

  const list = await request("/api/reports", { method: "GET" });
  if (!list.ok || !list.json?.reports) {
    throw new Error(`LIST failed (status ${list.status})`);
  }
  if (!list.json.reports.some((r) => r.id === testId)) {
    throw new Error("LIST failed: test report not present.");
  }

  const get = await request(`/api/reports/${testId}`, { method: "GET" });
  if (!get.ok || !get.json?.report) {
    throw new Error(`GET failed (status ${get.status})`);
  }
  if (get.json.report.id !== testId) {
    throw new Error(`GET failed: expected ${testId}, got ${get.json.report.id}`);
  }

  const del = await request(`/api/reports/${testId}`, { method: "DELETE" });
  if (!del.ok || !del.json?.ok) {
    throw new Error(`DELETE failed (status ${del.status})`);
  }

  const verifyDeleted = await request(`/api/reports/${testId}`, { method: "GET" });
  if (verifyDeleted.status !== 404) {
    throw new Error(`VERIFY DELETE failed: expected 404, got ${verifyDeleted.status}`);
  }

  const after = await request("/api/reports", { method: "GET" });
  if (!after.ok || !after.json?.reports) {
    throw new Error(`Final LIST failed (status ${after.status})`);
  }

  return {
    testId,
    countBefore: before.json.reports.length,
    countAfter: after.json.reports.length
  };
}

async function main() {
  console.log(`BASE_URL=${BASE_URL}`);
  const migration = await migrateMissingReports();
  console.log(`MIGRATION local=${migration.localCount} db_before=${migration.dbCountBefore} missing=${migration.missingCount} db_after=${migration.dbCountAfter}`);

  const smoke = await runCrudSmokeCheck();
  console.log(`SMOKE save-list-get-delete OK id=${smoke.testId} count_before=${smoke.countBefore} count_after=${smoke.countAfter}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

