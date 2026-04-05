
import Image from "next/image";
import { SignaturePoint } from "@/lib/chart-signatures";

export function SignaturePointsStrip({
  points,
  compact = false,
  variant = "editorial"
}: {
  points: SignaturePoint[];
  compact?: boolean;
  variant?: "editorial" | "identity";
}) {
  const validPoints = points.filter((point) => point.asset && point.sign);
  if (!validPoints.length) return null;

  return (
    <div className={`signature-points-strip ${compact ? "compact" : ""} ${variant === "identity" ? "identity" : ""}`}>
      {validPoints.map((point) => (
        <div className="signature-point-card" key={point.key}>
          <div className="signature-point-frame">
            <Image
              src={point.asset!.image}
              alt={`${point.label} en ${point.asset!.label}`}
              width={compact ? 64 : 96}
              height={compact ? 64 : 96}
            />
          </div>
          <div className="signature-point-meta">
            <span className="signature-point-label">{point.label}</span>
            <strong className="signature-point-sign">{point.asset!.label}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
