"use client";

import type { ReportRecord } from "@/lib/types";

const LOCAL_REPORT_CACHE_KEY = "astral:reports:cache:v1";

function hasWindow() {
  return typeof window !== "undefined";
}

function sortReportsDesc(reports: ReportRecord[]) {
  return [...reports].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

export function readLocalReportCache(): ReportRecord[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_REPORT_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return sortReportsDesc(parsed as ReportRecord[]);
  } catch {
    return [];
  }
}

export function writeLocalReportCache(reports: ReportRecord[]) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(LOCAL_REPORT_CACHE_KEY, JSON.stringify(sortReportsDesc(reports)));
  } catch {
    // Ignore quota and serialization errors.
  }
}

export function upsertLocalReport(report: ReportRecord) {
  const current = readLocalReportCache();
  const index = current.findIndex((item) => item.id === report.id);
  if (index >= 0) {
    current[index] = report;
  } else {
    current.push(report);
  }
  writeLocalReportCache(current);
}

export function removeLocalReport(reportId: string) {
  const current = readLocalReportCache();
  writeLocalReportCache(current.filter((report) => report.id !== reportId));
}

export function getLocalReport(reportId: string): ReportRecord | null {
  const current = readLocalReportCache();
  return current.find((report) => report.id === reportId) ?? null;
}
