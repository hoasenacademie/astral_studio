"use client";
import { SIGNS } from "@/lib/signs";
export function SignPicker({ value, onChange, label }: { value: string; onChange: (next: string) => void; label: string; }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Non renseigné</option>
        {SIGNS.map((sign) => <option key={sign.key} value={sign.key}>{sign.label}</option>)}
      </select>
    </div>
  );
}
