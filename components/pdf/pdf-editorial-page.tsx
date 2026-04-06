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

export function PdfEditorialPage({ page }: { page: LayoutEditorialPage }) {
  const introParagraphs = page.introParagraphs
    .map((paragraph) => sanitizePdfText(paragraph))
    .filter(Boolean);
  const bodyParagraphs = page.bodyParagraphs
    .map((paragraph) => sanitizePdfText(paragraph))
    .filter(Boolean);
  const quoteText = sanitizePdfText(page.inlineQuote);
  const signatureText = page.signatureBox ? sanitizePdfText(page.signatureBox.text) : "";
  const signatureLabel = page.signatureBox ? sanitizePdfText(page.signatureBox.label) : "";

  return (
    <Page size="A4" style={pageStyle(page)}>
      <View style={styles.editorialHeader} wrap={false}>
        <Text style={styles.editorialIndex}>{String(page.order).padStart(2, "0")}</Text>
        <Text style={styles.editorialTitle}>{sanitizePdfText(page.title)}</Text>
        <Text style={styles.editorialSubtitle}>{sanitizePdfText(page.subtitle)}</Text>
        <View style={styles.editorialDivider} />
      </View>

      {introParagraphs.map((paragraph, index) => (
        <Text
          key={`${page.sectionId}-intro-${index}`}
          style={page.isMethodNote ? styles.editorialMethodParagraph : styles.editorialLeadParagraph}
          widows={3}
          orphans={3}
        >
          {paragraph}
        </Text>
      ))}

      {bodyParagraphs.map((paragraph, index) => (
        <Text
          key={`${page.sectionId}-body-${index}`}
          style={page.isMethodNote ? styles.editorialMethodParagraph : styles.editorialParagraph}
          widows={3}
          orphans={3}
        >
          {paragraph}
        </Text>
      ))}

      {quoteText ? (
        <View style={styles.editorialQuoteBox} wrap={false}>
          <Text style={styles.editorialQuoteText}>{quoteText}</Text>
        </View>
      ) : null}

      {signatureText ? (
        <View style={styles.editorialSignatureBox} wrap={false}>
          {signatureLabel ? <Text style={styles.editorialSignatureLabel}>{signatureLabel}</Text> : null}
          <Text style={styles.editorialSignatureText}>{signatureText}</Text>
        </View>
      ) : null}

      <PdfPageFooter />
    </Page>
  );
}
