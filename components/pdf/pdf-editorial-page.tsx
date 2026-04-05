import { Page, Text, View } from "@react-pdf/renderer";
import { LayoutEditorialPage } from "@/lib/editorial-layout-plan";
import { sanitizePdfText } from "@/lib/pdf/text-utils";
import { styles } from "@/lib/pdf/styles";
import { PdfPageFooter } from "@/components/pdf/pdf-page-footer";

function pageStyle(page: LayoutEditorialPage) {
  if (page.isMethodNote) return styles.editorialMethodPage;
  if (page.sectionType === "section_opening") return styles.editorialOpeningPage;
  if (page.sectionType === "focus_page") return styles.editorialFocusPage;
  return styles.editorialPage;
}

function countWords(input: string) {
  return input.trim().split(/\s+/).filter(Boolean).length;
}

function splitParagraphsInColumns(paragraphs: string[]) {
  if (paragraphs.length <= 1) return { left: paragraphs, right: [] as string[] };

  const totalWords = paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0);
  const target = Math.ceil(totalWords / 2);

  const left: string[] = [];
  const right: string[] = [];
  let leftWords = 0;

  for (const paragraph of paragraphs) {
    const words = countWords(paragraph);
    if (leftWords < target || right.length === 0) {
      left.push(paragraph);
      leftWords += words;
    } else {
      right.push(paragraph);
    }
  }

  if (!right.length && left.length > 2) {
    const moved = left.splice(Math.floor(left.length / 2));
    right.push(...moved);
  }

  return { left, right };
}

function shouldUseMagazineColumns(
  paragraphs: string[],
  quoteText: string,
  signatureText: string,
  isMethodNote: boolean
) {
  if (isMethodNote) return false;
  if (paragraphs.length < 3) return false;

  const bodyWords = paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0);
  const quoteWords = countWords(quoteText);
  const signatureWords = countWords(signatureText);
  const weightedTotal = bodyWords + Math.min(quoteWords, 22) + Math.min(signatureWords, 24);

  // Keep one-column by default.
  // Switch to two columns only when single-column is likely to overflow
  // onto an extra sparse page (small overflow window).
  const singleColumnCapacity = 560;
  const overflow = weightedTotal - singleColumnCapacity;
  if (overflow <= 0) return false;

  return overflow <= 170;
}

export function PdfEditorialPage({ page }: { page: LayoutEditorialPage }) {
  const paragraphs = [...page.introParagraphs, ...page.bodyParagraphs]
    .map((paragraph) => sanitizePdfText(paragraph))
    .filter(Boolean);
  const quoteText = sanitizePdfText(page.inlineQuote);
  const signatureText = page.signatureBox ? sanitizePdfText(page.signatureBox.text) : "";
  const signatureLabel = page.signatureBox ? sanitizePdfText(page.signatureBox.label) : "";
  const useTwoColumns = shouldUseMagazineColumns(paragraphs, quoteText, signatureText, page.isMethodNote);
  const columns = splitParagraphsInColumns(paragraphs);

  return (
    <Page size="A4" style={pageStyle(page)}>
      <Text style={styles.editorialIndex}>{String(page.order).padStart(2, "0")}</Text>
      <Text style={styles.editorialTitle}>{sanitizePdfText(page.title)}</Text>
      <Text style={styles.editorialSubtitle}>{sanitizePdfText(page.subtitle)}</Text>

      {useTwoColumns ? (
        <View style={styles.editorialColumns}>
          <View style={styles.editorialColumn}>
            {columns.left.map((paragraph, index) => (
              <Text key={`${page.sectionId}-left-${index}`} style={styles.editorialParagraphColumn}>
                {paragraph}
              </Text>
            ))}
          </View>
          <View style={styles.editorialColumn}>
            {columns.right.map((paragraph, index) => (
              <Text key={`${page.sectionId}-right-${index}`} style={styles.editorialParagraphColumn}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        paragraphs.map((paragraph, index) => (
          <Text key={`${page.sectionId}-single-${index}`} style={styles.editorialParagraph}>
            {paragraph}
          </Text>
        ))
      )}

      {quoteText || signatureText ? (
        useTwoColumns ? (
          <View style={styles.editorialAfterColumns}>
            {quoteText ? (
              <View style={styles.editorialQuoteBoxSplit}>
                <Text style={styles.editorialQuoteTextSplit}>{quoteText}</Text>
              </View>
            ) : null}

            {signatureText ? (
              <View style={styles.editorialSignatureBoxSplit}>
                {signatureLabel ? <Text style={styles.editorialSignatureLabel}>{signatureLabel}</Text> : null}
                <Text style={styles.editorialSignatureText}>{signatureText}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <>
            {quoteText ? (
              <View style={styles.editorialQuoteBox}>
                <Text style={styles.editorialQuoteText}>{quoteText}</Text>
              </View>
            ) : null}
            {signatureText ? (
              <View style={styles.editorialSignatureBox}>
                {signatureLabel ? <Text style={styles.editorialSignatureLabel}>{signatureLabel}</Text> : null}
                <Text style={styles.editorialSignatureText}>{signatureText}</Text>
              </View>
            ) : null}
          </>
        )
      ) : null}

      <PdfPageFooter />
    </Page>
  );
}
