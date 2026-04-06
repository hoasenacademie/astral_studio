"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { ReportRecord } from "@/lib/types";
import { resolveEditorialLayoutPlan, EditorialLayoutPage, LayoutSignatureColumn } from "@/lib/editorial-layout-plan";

type MobileScreen =
  | { kind: "cover"; id: string; title: string; subtitle: string; names: string }
  | { kind: "signature"; id: string; title: string; subtitle: string; columns: LayoutSignatureColumn[] }
  | { kind: "toc"; id: string; items: Array<{ label: string; anchor: string }> }
  | { kind: "section_intro"; id: string; order: number; title: string; subtitle: string; introParagraphs: string[] }
  | { kind: "body"; id: string; text: string }
  | { kind: "quote"; id: string; text: string; fullPage?: boolean }
  | { kind: "signature_card"; id: string; label: string; text: string }
  | { kind: "conclusion"; id: string; title: string; subtitle: string; paragraphs: string[]; finalLine: string; reminderLines: string[] };

type MobileReadingOptions = {
  analysisOnly?: boolean;
  showShareActions?: boolean;
  showPdfDownloadAtEnd?: boolean;
  forceToc?: boolean;
  showTocFab?: boolean;
};

function textOrFallback(value?: string) {
  return value && value.trim() ? value : "Non renseigne";
}

function resolveMobileSignImage(
  asset: { key?: string; image?: string } | null | undefined
) {
  if (asset?.key) return `/signs-mobile/${asset.key}.webp`;
  return asset?.image ?? "";
}

function countWords(input: string) {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

function splitSentenceByWords(sentence: string, maxWords: number) {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [sentence.trim()].filter(Boolean);

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

function sentenceUnits(paragraph: string, maxWords: number) {
  const normalized = paragraph.replace(/\s+/g, " ").trim();
  if (!normalized) return [] as string[];

  const sentences = normalized
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return splitSentenceByWords(normalized, maxWords);

  const units: string[] = [];
  for (const sentence of sentences) {
    units.push(...splitSentenceByWords(sentence, maxWords));
  }
  return units;
}

function splitLongParagraph(paragraph: string, maxWords: number) {
  const normalized = paragraph.replace(/\s+/g, " ").trim();
  if (!normalized) return [] as string[];
  if (countWords(normalized) <= maxWords) return [normalized];

  const units = sentenceUnits(normalized, maxWords);
  if (!units.length) return [] as string[];

  const minTailWords = Math.max(10, Math.floor(maxWords * 0.22));
  const hardCap = maxWords + Math.max(12, Math.floor(maxWords * 0.2));
  const unitWords = units.map((unit) => countWords(unit));

  const suffixRemaining = new Array(unitWords.length).fill(0);
  let running = 0;
  for (let i = unitWords.length - 1; i >= 0; i -= 1) {
    suffixRemaining[i] = running;
    running += unitWords[i];
  }

  const chunks: string[] = [];
  let current = "";
  let currentWords = 0;

  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    const words = unitWords[i];
    if (!current) {
      current = unit;
      currentWords = words;
      continue;
    }

    const combinedWords = currentWords + words;
    const remainingWords = suffixRemaining[i];
    const canKeepSentenceWhole =
      combinedWords <= maxWords ||
      (remainingWords <= minTailWords && combinedWords <= hardCap);

    if (canKeepSentenceWhole) {
      current = `${current} ${unit}`;
      currentWords = combinedWords;
      continue;
    }

    chunks.push(current.trim());
    current = unit;
    currentWords = words;
  }

  if (current) chunks.push(current.trim());

  if (chunks.length >= 2) {
    const lastIndex = chunks.length - 1;
    const lastWords = countWords(chunks[lastIndex]);
    const prevWords = countWords(chunks[lastIndex - 1]);
    if (lastWords < minTailWords && prevWords + lastWords <= hardCap) {
      chunks[lastIndex - 1] = `${chunks[lastIndex - 1]} ${chunks[lastIndex]}`.trim();
      chunks.pop();
    }
  }

  return chunks;
}

function findScrollContainer(node: HTMLElement | null): HTMLElement | Window {
  if (!node) return window;
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const scrollable = /(auto|scroll)/.test(style.overflowY);
    if (scrollable && current.scrollHeight > current.clientHeight) return current;
    current = current.parentElement;
  }
  return window;
}

function isWindowTarget(target: HTMLElement | Window): target is Window {
  return target === window;
}

function mapPlanToScreens(
  plan: EditorialLayoutPage[],
  report: ReportRecord,
  options: MobileReadingOptions
): MobileScreen[] {
  const screens: MobileScreen[] = [];
  const maxWords = Math.max(70, report.rendering.mobileReading.bodyBlockMaxWords || 110);
  const analysisOnly = Boolean(options.analysisOnly);

  for (const page of plan) {
    if (page.kind === "cover_page") {
      if (analysisOnly) continue;
      screens.push({
        kind: "cover",
        id: "cover",
        title: page.title,
        subtitle: page.subtitle,
        names: page.subjectLabel
      });
      continue;
    }

    if (page.kind === "signature_page") {
      if (analysisOnly) continue;
      screens.push({
        kind: "signature",
        id: "signature",
        title: page.title,
        subtitle: page.subtitle,
        columns: page.columns
      });
      continue;
    }

    if (page.kind === "quote_page") {
      screens.push({ kind: "quote", id: page.key, text: page.text, fullPage: true });
      continue;
    }

    if (page.kind === "editorial_page") {
      screens.push({
        kind: "section_intro",
        id: `intro-${page.sectionId}`,
        order: page.order,
        title: page.title,
        subtitle: page.subtitle,
        introParagraphs: page.introParagraphs
      });

      for (const paragraph of page.bodyParagraphs) {
        for (const chunk of splitLongParagraph(paragraph, maxWords)) {
          screens.push({ kind: "body", id: `body-${page.sectionId}-${screens.length}`, text: chunk });
        }
      }

      if (page.inlineQuote) {
        screens.push({ kind: "quote", id: `inline-quote-${page.sectionId}`, text: page.inlineQuote });
      }

      if (page.signatureBox?.text) {
        screens.push({
          kind: "signature_card",
          id: `signature-card-${page.sectionId}`,
          label: page.signatureBox.label,
          text: page.signatureBox.text
        });
      }
      continue;
    }

    screens.push({
      kind: "conclusion",
      id: "conclusion",
      title: page.title,
      subtitle: page.subtitle,
      paragraphs: page.paragraphs,
      finalLine: page.finalLine,
      reminderLines: page.signatureReminderLines
    });
  }

  if (report.rendering.mobileReading.showToc || options.forceToc) {
    const items = screens
      .filter((screen) => screen.kind === "section_intro" || screen.kind === "conclusion")
      .map((screen) => {
        if (screen.kind === "conclusion") return { label: "Conclusion", anchor: `screen-${screen.id}` };
        return { label: screen.title, anchor: `screen-${screen.id}` };
      });

    if (items.length) {
      const insertionIndex = analysisOnly ? 0 : 2;
      screens.splice(insertionIndex, 0, { kind: "toc", id: "toc", items });
    }
  }

  return screens;
}

export function MobileReadingView({ report, options }: { report: ReportRecord; options?: MobileReadingOptions }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const resolvedOptions = {
    analysisOnly: Boolean(options?.analysisOnly),
    showShareActions: options?.showShareActions ?? true,
    showPdfDownloadAtEnd: Boolean(options?.showPdfDownloadAtEnd),
    forceToc: Boolean(options?.forceToc),
    showTocFab: Boolean(options?.showTocFab)
  };

  const plan = useMemo(() => resolveEditorialLayoutPlan(report), [report]);
  const screens = useMemo(
    () => mapPlanToScreens(plan, report, resolvedOptions),
    [plan, report, resolvedOptions.analysisOnly, resolvedOptions.forceToc]
  );
  const hasToc = screens.some((screen) => screen.kind === "toc");

  function scrollToToc() {
    const target = document.getElementById("screen-toc");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const container = findScrollContainer(rootRef.current);

    const update = () => {
      if (isWindowTarget(container)) {
        const doc = document.documentElement;
        const total = Math.max(1, doc.scrollHeight - window.innerHeight);
        const ratio = Math.max(0, Math.min(1, window.scrollY / total));
        setProgress(ratio);
        return;
      }

      const total = Math.max(1, container.scrollHeight - container.clientHeight);
      const ratio = Math.max(0, Math.min(1, container.scrollTop / total));
      setProgress(ratio);
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", update as EventListener);
      window.removeEventListener("resize", update);
    };
  }, []);

  const names = report.mode === "solo"
    ? textOrFallback(report.subjects.solo?.firstName)
    : `${textOrFallback(report.subjects.personA?.firstName)} — ${textOrFallback(report.subjects.personB?.firstName)}`;
  const endPdfLabel = report.mode === "compatibility" ? "Astral Compatibility" : "Astral Portrait";

  return (
    <div ref={rootRef} className="mobile-reading-shell">
      <div className="mobile-progressline">
        <div className="mobile-progressline__bar" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <div className="mobile-reading">
        {screens.map((screen, index) => {
          const animatedStyle = { "--delay": `${Math.min(index * 34, 360)}ms` } as CSSProperties;

          if (screen.kind === "cover") {
            return (
              <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--cover mobile-fade-up" style={animatedStyle}>
                <div className="mobile-screen__content">
                  <img
                    className="mobile-cover-image"
                    src="/mobile/cover-mobile.png"
                    alt={`Couverture mobile ${screen.title}`}
                  />
                  <p className="mobile-screen__names">{screen.names}</p>
                </div>
              </section>
            );
          }

          if (screen.kind === "signature") {
            return (
              <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--signature mobile-fade-up" style={animatedStyle}>
                <div className="section-kicker">Signature astrologique</div>
                <h2>{screen.title}</h2>
                <p className="mobile-screen__subtitle">{screen.subtitle}</p>
                <div className="mobile-signature-columns">
                  {screen.columns.map((column) => (
                    <div key={column.label} className="mobile-signature-column">
                      <p className="mobile-screen__eyebrow">{column.label}</p>
                      <div className="mobile-signature-grid">
                        {column.points.map((point) => (
                          <article key={`${column.label}-${point.key}`} className="mobile-signature-card">
                            <span className="mobile-signature-card__label">{point.label}</span>
                            <div className="mobile-signature-card__frame">
                              {point.asset?.image ? (
                                <img
                                  className="mobile-signature-card__image"
                                  src={resolveMobileSignImage(point.asset)}
                                  alt={`Signe ${point.asset.label}`}
                                  loading="lazy"
                                  onError={(event) => {
                                    const target = event.currentTarget;
                                    if (target.src.includes("/signs-mobile/")) {
                                      target.src = point.asset?.image ?? "";
                                    }
                                  }}
                                />
                              ) : (
                                <span className="mobile-signature-card__symbol" aria-hidden="true">
                                  {point.asset?.symbol ?? "•"}
                                </span>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (screen.kind === "toc") {
            return (
              <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--toc mobile-fade-up" style={animatedStyle}>
                <div className="section-kicker">Votre lecture</div>
                <h2>Sommaire</h2>
                <nav className="mobile-toc">
                  {screen.items.map((item) => (
                    <a key={item.anchor} href={`#${item.anchor}`}>{item.label}</a>
                  ))}
                </nav>
              </section>
            );
          }

          if (screen.kind === "section_intro") {
            return (
              <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--section-intro mobile-fade-up" style={animatedStyle}>
                <div className="section-kicker">{String(screen.order).padStart(2, "0")}</div>
                <h2>{screen.title}</h2>
                <p className="mobile-screen__subtitle">{screen.subtitle}</p>
                {screen.introParagraphs.length ? (
                  <div className="mobile-body-flow">
                    {screen.introParagraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${screen.id}-intro-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          }

          if (screen.kind === "body") {
            return (
              <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--body mobile-fade-up" style={animatedStyle}>
                <div className="mobile-body-flow">
                  <p>{screen.text}</p>
                </div>
              </section>
            );
          }

          if (screen.kind === "signature_card") {
            return (
              <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--signature-card mobile-fade-up" style={animatedStyle}>
                <div className="signature-card signature-card--mobile">
                  <div className="signature-card__label">{screen.label}</div>
                  <div className="signature-card__text">{screen.text}</div>
                </div>
              </section>
            );
          }

          if (screen.kind === "quote") {
            return (
              <section
                key={screen.id}
                id={`screen-${screen.id}`}
                className={`mobile-screen ${screen.fullPage ? "mobile-screen--quote-full" : "mobile-screen--quote-card"} mobile-fade-up`}
                style={animatedStyle}
              >
                <blockquote className="mobile-quote-card">{screen.text}</blockquote>
              </section>
            );
          }

          return (
            <section key={screen.id} id={`screen-${screen.id}`} className="mobile-screen mobile-screen--conclusion mobile-fade-up" style={animatedStyle}>
              <div className="section-kicker">Conclusion</div>
              <h2>{screen.title}</h2>
              <p className="mobile-screen__subtitle">{screen.subtitle}</p>
              {screen.paragraphs.length ? (
                <div className="mobile-body-flow">
                  {screen.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${screen.id}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              <div className="mobile-conclusion-final">{screen.finalLine}</div>
              {screen.reminderLines.length ? (
                <div className="mobile-conclusion-reminder">
                  {screen.reminderLines.map((line, lineIndex) => <p key={`${screen.id}-line-${lineIndex}`}>{line}</p>)}
                </div>
              ) : null}
            </section>
          );
        })}

        {resolvedOptions.showShareActions && report.share?.isPublished ? (
          <section className="mobile-screen mobile-screen--share mobile-fade-up" style={{ "--delay": "180ms" } as CSSProperties}>
            <div className="section-kicker">Partager ce rapport</div>
            <h2>Version PDF & lien mobile</h2>
            <div className="mobile-share-actions">
              <a className="mobile-share-button mobile-share-button--pdf" href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer">
                Telecharger le PDF
              </a>
              <button
                className="mobile-share-button mobile-share-button--link"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Lien copie dans le presse-papiers !");
                }}
              >
                Copier le lien
              </button>
            </div>
            <p className="mobile-screen__subtitle">Partagez cette lecture en conservant son format editorial complet.</p>
          </section>
        ) : null}

        {!resolvedOptions.showShareActions && resolvedOptions.showPdfDownloadAtEnd && report.share?.isPublished ? (
          <section className="mobile-screen mobile-screen--share mobile-fade-up" style={{ "--delay": "220ms" } as CSSProperties}>
            <div className="section-kicker">Votre document</div>
            <div className="mobile-share-actions">
              <a className="mobile-share-button mobile-share-button--pdf" href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer">
                {endPdfLabel}
              </a>
            </div>
          </section>
        ) : null}
      </div>

      <div className="mobile-reading-footnote">{names}</div>

      {resolvedOptions.showTocFab && hasToc ? (
        <button
          type="button"
          className={`mobile-jump-toc ${progress > 0.06 ? "is-visible" : ""}`}
          onClick={scrollToToc}
          aria-label="Retour au sommaire des passages"
        >
          <span className="mobile-jump-toc__line" />
          <span className="mobile-jump-toc__line" />
          <span className="mobile-jump-toc__line" />
        </button>
      ) : null}
    </div>
  );
}
