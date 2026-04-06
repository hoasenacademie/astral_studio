import { Page, Text, View } from "@react-pdf/renderer";
import { LayoutConclusionPage } from "@/lib/editorial-layout-plan";
import { sanitizePdfText } from "@/lib/pdf/text-utils";
import { styles } from "@/lib/pdf/styles";
import { PdfPageFooter } from "@/components/pdf/pdf-page-footer";

export function PdfConclusionPage({ page }: { page: LayoutConclusionPage }) {
  const paragraphs = page.paragraphs.map((paragraph) => sanitizePdfText(paragraph)).filter(Boolean);

  return (
    <Page size="A4" style={styles.conclusionPage}>
      <View wrap={false}>
        <Text style={styles.conclusionKicker}>Conclusion</Text>
        <Text style={styles.conclusionTitle}>{sanitizePdfText(page.title)}</Text>
        <Text style={styles.conclusionSubtitle}>{sanitizePdfText(page.subtitle)}</Text>
        <View style={styles.conclusionDivider} />
      </View>

      {paragraphs.map((paragraph, index) => (
        <Text
          key={`conclusion-body-${index}`}
          style={index === 0 ? styles.conclusionLeadParagraph : styles.conclusionParagraph}
          widows={3}
          orphans={3}
        >
          {paragraph}
        </Text>
      ))}

      <View style={styles.conclusionFinalWrap} wrap={false}>
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
