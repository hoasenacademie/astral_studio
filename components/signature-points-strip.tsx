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
            <span className="signature-point-symbol" aria-hidden="true">
              {point.asset?.symbol ?? "•"}
            </span>
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
