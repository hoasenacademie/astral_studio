import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";

const cache = new Map<string, string | null>();
const pdfWebpCache = new Map<string, string>();
let pdfWebpPrepared = false;
let pdfWebpPreparePromise: Promise<void> | null = null;

const pdfCacheRoot = process.env.VERCEL
  ? path.join("/tmp", "astral-pdf-cache")
  : path.join(process.cwd(), "data", "pdf-cache");

const SIGN_KEYS = [
  "belier",
  "taureau",
  "gemeaux",
  "cancer",
  "lion",
  "vierge",
  "balance",
  "scorpion",
  "sagittaire",
  "capricorne",
  "verseau",
  "poissons"
] as const;

function mimeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export function imageSourceFromAbsolute(filePath?: string | null): string | null {
  if (!filePath) return null;
  if (cache.has(filePath)) return cache.get(filePath) ?? null;

  try {
    if (!fs.existsSync(filePath)) {
      cache.set(filePath, null);
      return null;
    }
    const buffer = fs.readFileSync(filePath);
    const source = `data:${mimeFromPath(filePath)};base64,${buffer.toString("base64")}`;
    cache.set(filePath, source);
    return source;
  } catch {
    cache.set(filePath, null);
    return null;
  }
}

export function imageSourceFromPublicPath(publicPath?: string): string | null {
  if (!publicPath) return null;
  const clean = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  const absolute = path.join(process.cwd(), "public", clean);
  return imageSourceFromAbsolute(absolute);
}

function normalizePublicPath(publicPath?: string) {
  if (!publicPath) return "";
  const trimmed = publicPath.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function signKeyFromPublicPath(publicPath?: string) {
  const normalized = normalizePublicPath(publicPath);
  const match = normalized.match(/^\/(signs|signs-mobile)\/([^/.]+)\.(png|jpe?g|webp)$/i);
  return match?.[2]?.toLowerCase() ?? null;
}

function signCandidatesForPdf(publicPath?: string) {
  const normalized = normalizePublicPath(publicPath);
  if (!normalized) return [] as string[];

  const key = signKeyFromPublicPath(normalized);
  if (!key) return [normalized];

  return [
    `/signs/${key}.webp`,
    `/signs-mobile/${key}.webp`,
    `/signs/${key}.png`,
    `/signs-mobile/${key}.png`
  ];
}

function cachePathForWebp(publicPath: string) {
  const key = signKeyFromPublicPath(publicPath);
  if (!key) return null;
  return path.join(pdfCacheRoot, "signs", `${key}.png`);
}

async function convertWebpToPdfPng(publicPath: string) {
  const normalized = normalizePublicPath(publicPath);
  if (!normalized.endsWith(".webp")) return;

  const absoluteInput = path.join(process.cwd(), "public", normalized.slice(1));
  if (!fs.existsSync(absoluteInput)) return;

  const absoluteOutput = cachePathForWebp(normalized);
  if (!absoluteOutput) return;

  let sharpFactory: ((input?: Buffer | string) => { png: () => { toFile: (filePath: string) => Promise<unknown> } }) | null = null;
  try {
    const sharpModule = await import("sharp");
    const sharp = (sharpModule as { default?: unknown }).default ?? (sharpModule as unknown);
    sharpFactory = sharp as (input?: Buffer | string) => { png: () => { toFile: (filePath: string) => Promise<unknown> } };
  } catch {
    return;
  }

  await fsp.mkdir(path.dirname(absoluteOutput), { recursive: true });

  const outputExists = fs.existsSync(absoluteOutput);
  if (outputExists) {
    const [inputStat, outputStat] = await Promise.all([
      fsp.stat(absoluteInput),
      fsp.stat(absoluteOutput)
    ]);
    if (outputStat.mtimeMs >= inputStat.mtimeMs) {
      pdfWebpCache.set(normalized, absoluteOutput);
      return;
    }
  }

  await sharpFactory(absoluteInput).png().toFile(absoluteOutput);
  pdfWebpCache.set(normalized, absoluteOutput);

  const match = normalized.match(/^\/(signs|signs-mobile)\/([^/.]+)\.webp$/i);
  if (match) {
    const dir = match[1].toLowerCase();
    const key = match[2].toLowerCase();
    pdfWebpCache.set(`/${dir}/${key}.webp`, absoluteOutput);
  }
}

async function discoverWebpPublicPaths(relativeDir: "signs" | "signs-mobile") {
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  try {
    const entries = await fsp.readdir(absoluteDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"))
      .map((entry) => `/${relativeDir}/${entry.name}`);
  } catch {
    return [] as string[];
  }
}

export async function ensurePdfWebpCompatibilityCache() {
  if (pdfWebpPrepared) return;
  if (pdfWebpPreparePromise) {
    await pdfWebpPreparePromise;
    return;
  }

  pdfWebpPreparePromise = (async () => {
    const [signWebpPaths, mobileWebpPaths] = await Promise.all([
      discoverWebpPublicPaths("signs"),
      discoverWebpPublicPaths("signs-mobile")
    ]);

    for (const publicPath of [...signWebpPaths, ...mobileWebpPaths]) {
      await convertWebpToPdfPng(publicPath);
    }

    for (const key of SIGN_KEYS) {
      await convertWebpToPdfPng(`/signs/${key}.webp`);
      await convertWebpToPdfPng(`/signs-mobile/${key}.webp`);
    }

    pdfWebpPrepared = true;
  })();

  try {
    await pdfWebpPreparePromise;
  } finally {
    pdfWebpPreparePromise = null;
  }
}

export function imageSourceFromPdfSignPath(publicPath?: string): string | null {
  const candidates = signCandidatesForPdf(publicPath);

  for (const candidate of candidates) {
    const normalized = normalizePublicPath(candidate);
    if (!normalized) continue;

    if (normalized.endsWith(".webp")) {
      // @react-pdf/renderer does not reliably decode WEBP directly.
      // Use the converted PNG cache generated by ensurePdfWebpCompatibilityCache().
      const convertedPath = pdfWebpCache.get(normalized);
      if (!convertedPath) continue;
      const source = imageSourceFromAbsolute(convertedPath);
      if (source) return source;
      continue;
    }

    const source = imageSourceFromPublicPath(normalized);
    if (source) return source;
  }

  return null;
}
