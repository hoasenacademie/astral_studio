import { Image, Page, Text, View } from "@react-pdf/renderer";
import { LayoutCoverPage } from "@/lib/editorial-layout-plan";
import { styles } from "@/lib/pdf/styles";

export function PdfCoverPage({ page, coverImage }: { page: LayoutCoverPage; coverImage: string | null }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      {coverImage ? <Image src={coverImage} style={styles.coverImage} /> : null}
      <View style={styles.coverVeil} />
      <View style={styles.coverOverlay}>
        <View />
        <View style={styles.coverCenter}>
          <Text style={styles.coverTitle}>{page.title}</Text>
          <Text style={styles.coverSubtitle}>{page.subtitle}</Text>
          <Text style={styles.coverSubject}>{page.subjectLabel}</Text>
        </View>
        <Text style={styles.coverBrand}>{page.brandLabel}</Text>
      </View>
    </Page>
  );
}

