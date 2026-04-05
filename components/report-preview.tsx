
import { ReportRecord } from "@/lib/types";
import { MobileReadingView } from "@/components/mobile-reading-view";
import { SignaturePointsStrip } from "@/components/signature-points-strip";
import { getChartSignaturePoints } from "@/lib/chart-signatures";
import { getRenderableSections, toUniqueParagraphs } from "@/lib/editorial-normalizer";

function renderParagraphs(text: string) {
  return toUniqueParagraphs(text)
    .map((paragraph, index) => <p key={`${paragraph.slice(0, 18)}-${index}`}>{paragraph}</p>);
}

export function ReportPreview({ report }: { report: ReportRecord }) {
  const bodySections = getRenderableSections(report);
  const pointsA = getChartSignaturePoints(report.parsedA);
  const pointsB = report.mode === "compatibility" ? getChartSignaturePoints(report.parsedB) : [];

  return (
    <div className="preview-columns">
      <div className="stack">
        <section className="cover-card cover-card--art">
          <div className="cover-card__veil" />
          <div className="cover-card__content">
            <div className="section-kicker">{report.meta.brand.name}</div>
            <div className="cover-title">{report.meta.title}</div>
            <div className="cover-subtitle">{report.meta.subtitle}</div>
            <div className="cover-meta">
              {report.mode === "solo"
                ? (report.subjects.solo?.firstName || "Non renseigné")
                : `${report.subjects.personA?.firstName || "Profil A"} & ${report.subjects.personB?.firstName || "Profil B"}`}
            </div>
          </div>
        </section>

        <section className="report-page report-page--identity">
          <div className="section-kicker">Votre signature astrologique</div>
          <div className="section-title">Les quatre repères de votre thème</div>
          <div className="section-subtitle">Une page identité pensée comme un repère éditorial, pas comme une fiche technique.</div>

          {report.mode === "solo" ? (
            <SignaturePointsStrip points={pointsA} variant="identity" />
          ) : (
            <div className="mobile-duo-points-grid">
              <div className="mobile-duo-points-col">
                <div className="section-kicker">{report.subjects.personA?.firstName || "Profil A"}</div>
                <SignaturePointsStrip points={pointsA} compact variant="identity" />
              </div>
              <div className="mobile-duo-points-col">
                <div className="section-kicker">{report.subjects.personB?.firstName || "Profil B"}</div>
                <SignaturePointsStrip points={pointsB} compact variant="identity" />
              </div>
            </div>
          )}
        </section>

        {bodySections.map((section) => (
          <article
            key={section.id}
            className={`report-page report-page--${section.type.replace(/_/g, "-")}`}
            id={`preview-${section.id}`}
          >
            <div className={section.type === "section_opening" ? "section-opening" : ""}>
              <div className="section-index">{String(section.order).padStart(2, "0")}</div>
              <div className="section-title">{section.title}</div>
              <div className="section-subtitle">{section.subtitle}</div>

              {section.pullQuote && (section.type === "section_opening" || section.type === "quote_page") ? (
                <div className="quote-card quote-card--full"><blockquote>{section.pullQuote}</blockquote></div>
              ) : null}

              {section.intro ? <div className="report-body">{renderParagraphs(section.intro)}</div> : null}
              {section.bodyBlocks.length ? <div className="report-body">{section.bodyBlocks.map((block) => <div key={block.id}>{renderParagraphs(block.text)}</div>)}</div> : null}

              {section.pullQuote && section.type !== "section_opening" && section.type !== "quote_page" ? (
                <div className="quote-card"><blockquote>{section.pullQuote}</blockquote></div>
              ) : null}

              {section.signatureBox ? (
                <div className="signature-card">
                  <div className="signature-card__label">{section.signatureBox.label}</div>
                  <div className="signature-card__text">{section.signatureBox.text}</div>
                </div>
              ) : null}

              {section.items?.length ? (
                <div className="mini-feature-grid">
                  {section.items.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="mini-feature-card">
                      <div className="mini-feature-card__title">{item.title}</div>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}

        <section className="report-page report-page--epilogue">
          <div className="section-kicker">Épilogue</div>
          <div className="section-title">Ce chemin astrologique vous appartient</div>
          <div className="section-subtitle">
            Les repères que vous portez guident chaque instant de votre présence au monde.
          </div>
          {report.mode === "solo" ? (
            <SignaturePointsStrip points={pointsA} variant="identity" />
          ) : (
            <div className="mobile-duo-points-grid">
              <div className="mobile-duo-points-col">
                <div className="section-kicker">{report.subjects.personA?.firstName || "Profil A"}</div>
                <SignaturePointsStrip points={pointsA} compact variant="identity" />
              </div>
              <div className="mobile-duo-points-col">
                <div className="section-kicker">{report.subjects.personB?.firstName || "Profil B"}</div>
                <SignaturePointsStrip points={pointsB} compact variant="identity" />
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="panel mobile-preview">
        <div className="section-kicker">Rendu mobile partageable</div>
        <MobileReadingView report={report} />
      </div>
    </div>
  );
}
