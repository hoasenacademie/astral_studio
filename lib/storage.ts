import { promises as fs } from "fs";
import { createRequire } from "module";
import path from "path";
import { ReportRecord } from "@/lib/types";
import { createId } from "@/lib/templates";

type PgRow = {
  payload: ReportRecord | string;
};

type PgClient = {
  query: <T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ) => Promise<{ rows: T[] }>;
};

const storageDir = path.join(process.cwd(), "data", "storage");
const storageFile = path.join(storageDir, "reports.json");
const requireFromHere = createRequire(import.meta.url);

let pgClientPromise: Promise<PgClient | null> | null = null;
let pgReady = false;

function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
}

function postgresConnectionString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    null
  );
}

function asIsoOrNow(value?: string | null) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function toReportRecord(payload: ReportRecord | string): ReportRecord {
  return typeof payload === "string" ? (JSON.parse(payload) as ReportRecord) : payload;
}

async function ensureStorage() {
  await fs.mkdir(storageDir, { recursive: true });
  try {
    await fs.access(storageFile);
  } catch {
    await fs.writeFile(storageFile, JSON.stringify({ reports: [] }, null, 2), "utf-8");
  }
}

function isReadonlyStorageError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code === "EROFS" || code === "EPERM" || code === "EACCES";
}

function allowVolatileFallback() {
  return Boolean(process.env.VERCEL) && !isPostgresEnabled();
}

async function readStorage(): Promise<{ reports: ReportRecord[] }> {
  try {
    await ensureStorage();
    const content = await fs.readFile(storageFile, "utf-8");
    return JSON.parse(content) as { reports: ReportRecord[] };
  } catch (error) {
    if (allowVolatileFallback() && isReadonlyStorageError(error)) {
      return { reports: [] };
    }
    throw error;
  }
}

async function writeStorage(payload: { reports: ReportRecord[] }) {
  try {
    await ensureStorage();
    await fs.writeFile(storageFile, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    if (allowVolatileFallback() && isReadonlyStorageError(error)) {
      return;
    }
    throw error;
  }
}

async function migrateLegacyFileToPostgres(client: PgClient) {
  let count = 0;
  const countResult = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM reports`
  );
  count = Number(countResult.rows[0]?.count ?? "0");
  if (count > 0) return;

  try {
    await fs.access(storageFile);
  } catch {
    return;
  }

  try {
    const raw = await fs.readFile(storageFile, "utf-8");
    const parsed = JSON.parse(raw) as { reports?: ReportRecord[] };
    const reports = Array.isArray(parsed.reports) ? parsed.reports : [];
    if (!reports.length) return;

    for (const report of reports) {
      const nextReport: ReportRecord = {
        ...report,
        createdAt: asIsoOrNow(report.createdAt),
        updatedAt: asIsoOrNow(report.updatedAt)
      };

      await client.query(
        `
          INSERT INTO reports (id, payload, created_at, updated_at, is_published, share_token)
          VALUES ($1, $2::jsonb, $3::timestamptz, $4::timestamptz, $5::boolean, $6::text)
          ON CONFLICT (id)
          DO UPDATE SET
            payload = EXCLUDED.payload,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            is_published = EXCLUDED.is_published,
            share_token = EXCLUDED.share_token
        `,
        [
          nextReport.id,
          JSON.stringify(nextReport),
          nextReport.createdAt,
          nextReport.updatedAt,
          Boolean(nextReport.share?.isPublished),
          nextReport.share?.shareToken ?? null
        ]
      );
    }
  } catch {
    // Migration best effort: a malformed local file must not block API startup.
  }
}

async function getPgClient(): Promise<PgClient | null> {
  if (!isPostgresEnabled()) return null;

  if (!pgClientPromise) {
    pgClientPromise = (async () => {
      const connectionString = postgresConnectionString();
      if (!connectionString) return null;

      let PoolCtor: new (opts: { connectionString: string }) => PgClient;
      try {
        const pg = requireFromHere("pg") as {
          Pool: new (opts: { connectionString: string }) => PgClient;
        };
        PoolCtor = pg.Pool;
      } catch (error) {
        throw new Error(
          "Postgres activé via DATABASE_URL/POSTGRES_URL mais module 'pg' introuvable. Exécutez: npm i pg"
        );
      }

      const pool = new PoolCtor({ connectionString });
      return pool;
    })();
  }

  const client = await pgClientPromise;
  if (!client) return null;

  if (!pgReady) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        share_token TEXT
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS reports_updated_at_idx ON reports(updated_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS reports_share_token_idx ON reports(share_token);`);
    await migrateLegacyFileToPostgres(client);
    pgReady = true;
  }

  return client;
}

async function listReportsFs(): Promise<ReportRecord[]> {
  const parsed = await readStorage();
  return [...parsed.reports].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function listReportsPg(client: PgClient): Promise<ReportRecord[]> {
  const result = await client.query<PgRow>(
    `SELECT payload FROM reports ORDER BY updated_at DESC`
  );
  return result.rows.map((row) => toReportRecord(row.payload));
}

async function getReportPg(client: PgClient, id: string): Promise<ReportRecord | null> {
  const result = await client.query<PgRow>(
    `SELECT payload FROM reports WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (!result.rows[0]) return null;
  return toReportRecord(result.rows[0].payload);
}

async function saveReportPg(client: PgClient, report: ReportRecord): Promise<ReportRecord> {
  const nextReport: ReportRecord = {
    ...report,
    createdAt: asIsoOrNow(report.createdAt),
    updatedAt: new Date().toISOString()
  };

  await client.query(
    `
      INSERT INTO reports (id, payload, created_at, updated_at, is_published, share_token)
      VALUES ($1, $2::jsonb, $3::timestamptz, $4::timestamptz, $5::boolean, $6::text)
      ON CONFLICT (id)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at,
        is_published = EXCLUDED.is_published,
        share_token = EXCLUDED.share_token
    `,
    [
      nextReport.id,
      JSON.stringify(nextReport),
      asIsoOrNow(nextReport.createdAt),
      asIsoOrNow(nextReport.updatedAt),
      Boolean(nextReport.share?.isPublished),
      nextReport.share?.shareToken ?? null
    ]
  );

  return nextReport;
}

async function deleteReportPg(client: PgClient, id: string) {
  await client.query(`DELETE FROM reports WHERE id = $1`, [id]);
}

function createShareToken() {
  return `shr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function listReports(): Promise<ReportRecord[]> {
  const client = await getPgClient();
  if (client) return listReportsPg(client);
  return listReportsFs();
}

export async function getReport(id: string): Promise<ReportRecord | null> {
  const client = await getPgClient();
  if (client) return getReportPg(client, id);

  const reports = await listReportsFs();
  return reports.find((report) => report.id === id) ?? null;
}

export async function getReportByShareToken(token: string): Promise<ReportRecord | null> {
  const client = await getPgClient();
  if (client) {
    const result = await client.query<PgRow>(
      `SELECT payload FROM reports WHERE is_published = TRUE AND share_token = $1 LIMIT 1`,
      [token]
    );
    if (!result.rows[0]) return null;
    return toReportRecord(result.rows[0].payload);
  }

  const reports = await listReportsFs();
  return reports.find((report) => report.share?.isPublished && report.share?.shareToken === token) ?? null;
}

export async function saveReport(report: ReportRecord): Promise<ReportRecord> {
  const client = await getPgClient();
  if (client) return saveReportPg(client, report);

  const reports = await listReportsFs();
  const index = reports.findIndex((item) => item.id === report.id);
  const nextReport = { ...report, updatedAt: new Date().toISOString() };
  if (index >= 0) reports[index] = nextReport;
  else reports.push(nextReport);
  await writeStorage({ reports });
  return nextReport;
}

export async function deleteReport(id: string) {
  const client = await getPgClient();
  if (client) {
    await deleteReportPg(client, id);
    return;
  }

  const reports = await listReportsFs();
  const next = reports.filter((report) => report.id !== id);
  await writeStorage({ reports: next });
}

export async function publishReport(id: string): Promise<ReportRecord | null> {
  const current = await getReport(id);
  if (!current) return null;

  const next: ReportRecord = {
    ...current,
    share: {
      isPublished: true,
      shareToken: current.share?.shareToken ?? createShareToken(),
      publishedAt: current.share?.publishedAt ?? new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
  await saveReport(next);
  return next;
}

export async function unpublishReport(id: string): Promise<ReportRecord | null> {
  const current = await getReport(id);
  if (!current) return null;

  const next: ReportRecord = {
    ...current,
    share: {
      isPublished: false,
      shareToken: current.share?.shareToken ?? null,
      publishedAt: current.share?.publishedAt ?? null
    },
    updatedAt: new Date().toISOString()
  };
  await saveReport(next);
  return next;
}

function duplicatedTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return "Rapport copie";
  return /\(copie\)$/i.test(trimmed) ? trimmed : `${trimmed} (copie)`;
}

export async function duplicateReport(id: string): Promise<ReportRecord | null> {
  const source = await getReport(id);
  if (!source) return null;

  const now = new Date().toISOString();
  const duplicate: ReportRecord = {
    ...source,
    id: createId(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    meta: {
      ...source.meta,
      title: duplicatedTitle(source.meta.title)
    },
    share: {
      isPublished: false,
      shareToken: null,
      publishedAt: null
    }
  };

  await saveReport(duplicate);
  return duplicate;
}
