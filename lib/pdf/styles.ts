import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 18,
    left: 48,
    right: 48,
    fontSize: 8.5,
    color: "#8A817B",
    textAlign: "center"
  },

  coverPage: {
    position: "relative",
    backgroundColor: "#F7F2EC"
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  coverVeil: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(247,242,236,0.18)"
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 68,
    justifyContent: "space-between"
  },
  coverCenter: {
    alignItems: "center",
    gap: 10
  },
  coverTitle: {
    fontSize: 34,
    lineHeight: 1.1,
    textAlign: "center"
  },
  coverSubtitle: {
    fontSize: 11,
    color: "#6E6A67",
    textAlign: "center",
    letterSpacing: 1.2
  },
  coverSubject: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center"
  },
  coverBrand: {
    fontSize: 8.5,
    color: "#8C6A61",
    textTransform: "uppercase",
    letterSpacing: 2.1,
    textAlign: "center"
  },

  signaturePage: {
    backgroundColor: "#FBF7F3",
    paddingTop: 46,
    paddingBottom: 46,
    paddingHorizontal: 52,
    color: "#181615",
    fontFamily: "Times-Roman"
  },
  signatureKicker: {
    fontSize: 8.8,
    textTransform: "uppercase",
    letterSpacing: 2.2,
    color: "#8C6A61",
    textAlign: "center",
    marginBottom: 10
  },
  signatureTitle: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8
  },
  signatureSubtitle: {
    fontSize: 11,
    color: "#6E6A67",
    textAlign: "center",
    marginBottom: 26
  },
  signatureColumns: {
    flexDirection: "row",
    gap: 18
  },
  signatureColumn: {
    flexGrow: 1,
    flexBasis: 0,
    gap: 8
  },
  signatureColumnTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    color: "#8C6A61",
    textAlign: "center",
    marginBottom: 4
  },
  signatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  signatureCard: {
    width: "47%",
    border: "1px solid #DED6CE",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    minHeight: 136
  },
  signatureCardLabel: {
    fontSize: 8.2,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#8C6A61",
    marginBottom: 8
  },
  signatureImageFrame: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #E5DDD5",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    marginBottom: 8
  },
  signatureImage: {
    width: 52,
    height: 52,
    objectFit: "contain"
  },
  signatureCardValue: {
    fontSize: 12.5,
    textAlign: "center"
  },

  editorialPage: {
    backgroundColor: "#F7F2EC",
    color: "#181615",
    paddingTop: 38,
    paddingBottom: 40,
    paddingHorizontal: 44,
    fontSize: 11,
    fontFamily: "Times-Roman"
  },
  editorialOpeningPage: {
    backgroundColor: "#F8F4EF",
    color: "#181615",
    paddingTop: 42,
    paddingBottom: 40,
    paddingHorizontal: 46,
    fontSize: 11,
    fontFamily: "Times-Roman"
  },
  editorialFocusPage: {
    backgroundColor: "#F9F5F1",
    color: "#181615",
    paddingTop: 38,
    paddingBottom: 40,
    paddingHorizontal: 46,
    fontSize: 11,
    fontFamily: "Times-Roman"
  },
  editorialMethodPage: {
    backgroundColor: "#FAF7F4",
    color: "#181615",
    paddingTop: 46,
    paddingBottom: 46,
    paddingHorizontal: 60,
    fontSize: 10.8,
    fontFamily: "Times-Roman"
  },
  editorialIndex: {
    fontSize: 8.8,
    color: "#8C6A61",
    textTransform: "uppercase",
    letterSpacing: 2.1,
    marginBottom: 8
  },
  editorialTitle: {
    fontSize: 25,
    marginBottom: 4
  },
  editorialSubtitle: {
    fontSize: 11.2,
    color: "#6E6A67",
    marginBottom: 16,
    lineHeight: 1.5
  },
  editorialColumns: {
    flexDirection: "row",
    gap: 18
  },
  editorialColumn: {
    flexGrow: 1,
    flexBasis: 0
  },
  editorialParagraph: {
    fontSize: 11.4,
    lineHeight: 1.92,
    marginBottom: 8,
    maxWidth: 455
  },
  editorialParagraphColumn: {
    fontSize: 10.6,
    lineHeight: 1.68,
    marginBottom: 7
  },
  editorialAfterColumns: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12
  },
  editorialQuoteBox: {
    marginTop: 20,
    marginBottom: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderTop: "1px solid #D8D1CA",
    borderBottom: "1px solid #D8D1CA"
  },
  editorialQuoteBoxSplit: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderTop: "1px solid #D8D1CA",
    borderBottom: "1px solid #D8D1CA"
  },
  editorialQuoteText: {
    fontSize: 19,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 1.45
  },
  editorialQuoteTextSplit: {
    fontSize: 15.5,
    textAlign: "left",
    fontStyle: "italic",
    lineHeight: 1.45
  },
  editorialSignatureBox: {
    marginTop: 16,
    border: "1px solid #D8D1CA",
    backgroundColor: "rgba(255,255,255,0.62)",
    padding: 14,
    maxWidth: 430
  },
  editorialSignatureBoxSplit: {
    flexGrow: 1,
    flexBasis: 0,
    border: "1px solid #D8D1CA",
    backgroundColor: "rgba(255,255,255,0.62)",
    padding: 10
  },
  editorialSignatureLabel: {
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#8C6A61",
    marginBottom: 8
  },
  editorialSignatureText: {
    fontSize: 11.4,
    lineHeight: 1.7
  },

  quotePage: {
    backgroundColor: "#F8F4EF",
    paddingTop: 70,
    paddingBottom: 70,
    paddingHorizontal: 68,
    justifyContent: "center"
  },
  quoteFrame: {
    borderTop: "1px solid #D8D1CA",
    borderBottom: "1px solid #D8D1CA",
    paddingVertical: 34,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  quoteMark: {
    fontSize: 34,
    color: "#B3978F",
    marginBottom: 10
  },
  quoteText: {
    fontSize: 24,
    lineHeight: 1.45,
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: 420
  },

  conclusionPage: {
    backgroundColor: "#F8F4EF",
    color: "#181615",
    paddingTop: 54,
    paddingBottom: 46,
    paddingHorizontal: 58,
    fontSize: 11.2,
    fontFamily: "Times-Roman"
  },
  conclusionKicker: {
    fontSize: 8.8,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#8C6A61",
    marginBottom: 8
  },
  conclusionTitle: {
    fontSize: 28,
    marginBottom: 4
  },
  conclusionSubtitle: {
    fontSize: 11.3,
    color: "#6E6A67",
    marginBottom: 16
  },
  conclusionColumns: {
    flexDirection: "row",
    gap: 18
  },
  conclusionColumn: {
    flexGrow: 1,
    flexBasis: 0
  },
  conclusionParagraph: {
    fontSize: 11.6,
    lineHeight: 1.9,
    marginBottom: 8,
    maxWidth: 455
  },
  conclusionParagraphColumn: {
    fontSize: 10.7,
    lineHeight: 1.72,
    marginBottom: 7
  },
  conclusionFinalWrap: {
    marginTop: 14,
    marginBottom: 14,
    borderTop: "1px solid #D8D1CA",
    borderBottom: "1px solid #D8D1CA",
    paddingVertical: 24
  },
  conclusionFinal: {
    fontSize: 22,
    lineHeight: 1.42,
    textAlign: "center",
    fontStyle: "italic"
  },
  conclusionReminder: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid #E2DAD2"
  },
  conclusionReminderLine: {
    fontSize: 8.7,
    color: "#8A817B",
    lineHeight: 1.5,
    marginBottom: 3
  }
});
