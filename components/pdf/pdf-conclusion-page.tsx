import { Page, Text, View } from "@react-pdf/renderer";
import { LayoutConclusionPage } from "@/lib/editorial-layout-plan";
import { sanitizePdfText } from "@/lib/pdf/text-utils";
import { styles } from "@/lib/pdf/styles";
import { PdfPageFooter } from "@/components/pdf/pdf-page-footer";

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

  return { left, right };
}

function shouldUseConclusionColumns(paragraphs: string[]) {
  if (paragraphs.length < 3) return false;
  const totalWords = paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0);
  // Keep one-column by default.
  // Switch to two columns only when single-column likely spills to an extra sparse page.
  const singleColumnCapacity = 470;
  const overflow = totalWords - singleColumnCapacity;
  if (overflow <= 0) return false;

  return overflow <= 140;
}

export function PdfConclusionPage({ page }: { page: LayoutConclusionPage }) {
  const paragraphs = page.paragraphs.map((paragraph) => sanitizePdfText(paragraph)).filter(Boolean);
  const columns = splitParagraphsInColumns(paragraphs);
  const useTwoColumns = shouldUseConclusionColumns(paragraphs);

  return (
    <Page size="A4" style={styles.conclusionPage}>
      <Text style={styles.conclusionKicker}>Conclusion</Text>
      <Text style={styles.conclusionTitle}>{sanitizePdfText(page.title)}</Text>
      <Text style={styles.conclusionSubtitle}>{sanitizePdfText(page.subtitle)}</Text>

      {useTwoColumns ? (
        <View style={styles.conclusionColumns}>
          <View style={styles.conclusionColumn}>
            {columns.left.map((paragraph, index) => (
              <Text key={`conclusion-left-${index}`} style={styles.conclusionParagraphColumn}>
                {paragraph}
              </Text>
            ))}
          </View>
          <View style={styles.conclusionColumn}>
            {columns.right.map((paragraph, index) => (
              <Text key={`conclusion-right-${index}`} style={styles.conclusionParagraphColumn}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      ) : (
        paragraphs.map((paragraph, index) => (
          <Text key={`conclusion-body-${index}`} style={styles.conclusionParagraph}>
            {paragraph}
          </Text>
        ))
      )}

      <View style={styles.conclusionFinalWrap}>
        <Text style={styles.conclusionFinal}>{sanitizePdfText(page.finalLine)}</Text>
      </View>

      {page.signatureReminderLines.length ? (
        <View style={styles.conclusionReminder}>
          {page.signatureReminderLines.map((line, index) => (
            <Text key={`reminder-${index}`} style={styles.conclusionReminderLine}>
              {sanitizePdfText(line)}
            </Text>
          ))}
        </View>
      ) : null}

      <PdfPageFooter />
    </Page>
  );
}
