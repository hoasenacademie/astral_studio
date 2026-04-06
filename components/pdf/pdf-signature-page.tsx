import { Page, Text, View } from "@react-pdf/renderer";
import { LayoutSignaturePage } from "@/lib/editorial-layout-plan";
import { sanitizePdfText } from "@/lib/pdf/text-utils";
import { styles } from "@/lib/pdf/styles";
import { PdfPageFooter } from "@/components/pdf/pdf-page-footer";

function pointLabel(value?: string | null) {
  return sanitizePdfText(value);
}

export function PdfSignaturePage({
  page,
  imageResolver
}: {
  page: LayoutSignaturePage;
  imageResolver: (publicPath?: string) => string | null;
}) {
  void imageResolver;
  return (
    <Page size="A4" style={styles.signaturePage}>
      <Text style={styles.signatureKicker}>Signature Astrologique</Text>
      <Text style={styles.signatureTitle}>{sanitizePdfText(page.title)}</Text>
      <Text style={styles.signatureSubtitle}>{sanitizePdfText(page.subtitle)}</Text>

      <View style={styles.signatureColumns}>
        {page.columns.map((column) => (
          <View key={column.label} style={styles.signatureColumn}>
            <Text style={styles.signatureColumnTitle}>{sanitizePdfText(column.label)}</Text>
            <View style={styles.signatureGrid}>
              {column.points.map((point) => {
                return (
                  <View key={`${column.label}-${point.key}`} style={styles.signatureCard}>
                    <Text style={styles.signatureCardLabel}>{point.label}</Text>
                    <View style={styles.signatureImageFrame}>
                      <Text style={styles.signatureSymbol}>{point.asset?.symbol || "•"}</Text>
                    </View>
                    <Text style={styles.signatureCardValue}>{pointLabel(point.asset?.label || point.sign)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
      <PdfPageFooter />
    </Page>
  );
}
