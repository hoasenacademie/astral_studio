"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportDetailActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    setBusy(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/duplicate`, { method: "POST" });
      if (!response.ok) throw new Error("duplicate_failed");
      const data = (await response.json()) as { report?: { id: string } };
      if (data.report?.id) router.push(`/reports/${data.report.id}/edit`);
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="button-row">
      <Link className="button-secondary" href={`/reports/${reportId}/edit`}>Editer ce rapport</Link>
      <button className="button-ghost" type="button" onClick={duplicate} disabled={busy}>
        {busy ? "Duplication..." : "Dupliquer"}
      </button>
    </div>
  );
}

