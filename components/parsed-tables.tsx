import { ParsedChart } from "@/lib/types";
export function ParsedTables({ chart, title }: { chart: ParsedChart; title: string }) {
  return (
    <div className="stack">
      <div className="table-card"><h3>{title}</h3><div className="badges"><span className="badge">Confiance : {chart.confidence}%</span>{chart.warnings.map((warning) => <span key={warning} className="badge">{warning}</span>)}</div></div>
      <div className="grid-2">
        <div className="table-card"><h4>Positions</h4><table className="table"><thead><tr><th>Point</th><th>Signe</th><th>Coordonnée</th></tr></thead><tbody>{chart.positions.length ? chart.positions.map((item, index) => <tr key={`${item.label}-${index}`}><td>{item.label}</td><td>{item.sign}</td><td>{item.degree ?? "—"}° {item.minute ?? "—"}</td></tr>) : <tr><td colSpan={3}>Aucune position reconnue</td></tr>}</tbody></table></div>
        <div className="table-card"><h4>Maisons</h4><table className="table"><thead><tr><th>Maison</th><th>Signe</th><th>Coordonnée</th></tr></thead><tbody>{chart.houses.length ? chart.houses.map((item, index) => <tr key={`${item.label}-${index}`}><td>{item.label}</td><td>{item.sign}</td><td>{item.degree ?? "—"}° {item.minute ?? "—"}</td></tr>) : <tr><td colSpan={3}>Aucune maison reconnue</td></tr>}</tbody></table></div>
      </div>
      <div className="grid-2">
        <div className="table-card"><h4>Aspects</h4><table className="table"><thead><tr><th>De</th><th>Aspect</th><th>Vers</th></tr></thead><tbody>{chart.aspects.length ? chart.aspects.map((item, index) => <tr key={`${item.from}-${item.to}-${index}`}><td>{item.from}</td><td>{item.type}</td><td>{item.to}</td></tr>) : <tr><td colSpan={3}>Aucun aspect reconnu</td></tr>}</tbody></table></div>
        <div className="table-card"><h4>Paramètres</h4><table className="table"><thead><tr><th>Libellé</th><th>Valeur</th></tr></thead><tbody>{chart.settings.length ? chart.settings.map((item, index) => <tr key={`${item.label}-${index}`}><td>{item.label}</td><td>{item.value}</td></tr>) : <tr><td colSpan={2}>Aucun paramètre reconnu</td></tr>}</tbody></table></div>
      </div>
    </div>
  );
}
