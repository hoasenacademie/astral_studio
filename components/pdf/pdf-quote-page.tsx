import { Page, Text, View } from "@react-pdf/renderer";
import { LayoutQuotePage } from "@/lib/editorial-layout-plan";
import { styles } from "@/lib/pdf/styles";
import { PdfPageFooter } from "@/components/pdf/pdf-page-footer";

export function PdfQuotePage({ page }: { page: LayoutQuotePage }) {
  return (
    <Page size="A4" style={styles.quotePage}>
      <View style={styles.quoteFrame}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>{page.text}</Text>
      </View>
      <PdfPageFooter />
    </Page>
  );
}

