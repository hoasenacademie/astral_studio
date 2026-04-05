import { Text } from "@react-pdf/renderer";
import { styles } from "@/lib/pdf/styles";

export function PdfPageFooter() {
  return <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />;
}

