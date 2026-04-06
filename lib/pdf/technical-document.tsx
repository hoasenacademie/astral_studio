import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  getEditorialSectionSchema,
  type EditorialSectionShape
} from "@/lib/editorial/section-schema";
import { sanitizePdfText } from "@/lib/pdf/text-utils";
import type { ParsedChart, ReportRecord, SubjectPerson } from "@/lib/types";

const techStyles = StyleSheet.create({
  page: {
    backgroundColor: "#F7F2EC",
    color: "#171616",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Times-Roman",
    fontSize: 10.5
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8.2,
    color: "#8A817B"
  },
  kicker: {
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#8C6A61",
    marginBottom: 8
  },
  title: {
    fontSize: 24,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 11,
    color: "#6E6A67",
    marginBottom: 16,
    lineHeight: 1.45
  },
  sectionTitle: {
    fontSize: 12.5,
    marginBottom: 8,
    marginTop: 12
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 8
  },
  card: {
    border: "1px solid #DED6CE",
    backgroundColor: "rgba(255,255,255,0.72)",
    padding: 10,
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#8C6A61",
    marginBottom: 6
  },
  line: {
    fontSize: 10.2,
    lineHeight: 1.45,
    marginBottom: 3
  },
  monoBlock: {
    border: "1px solid #D8D1CA",
    backgroundColor: "rgba(255,255,255,0.76)",
    padding: 8,
    marginTop: 6
  },
  monoText: {
    fontSize: 9.1,
    lineHeight: 1.35
  }
});

function chunk<T>(input: T[], size: number): T[][] {
  if (!input.length) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
}

function clean(value?: string | null) {
  return sanitizePdfText(value);
}

function profileLines(label: string, person?: SubjectPerson) {
  if (!person) return [`${label}:`];
  return [
    `${label}: ${clean(person.firstName)}`,
    `Date de naissance: ${clean(person.birthDate)}`,
    `Heure de naissance: ${clean(person.birthTime)}`,
    `Lieu de naissance: ${clean(person.birthPlace)}`,
    `Signe principal: ${clean(person.signPrimary)}`,
    `Symbole: ${clean(person.signSymbol)}`,
    `Asset signe: ${clean(person.signImage)}`
  ];
}

function formatDegree(degree?: number | null, minute?: number | null) {
  if (degree == null) return "";
  const safeMinute = minute == null ? 0 : minute;
  return `${degree}deg${String(safeMinute).padStart(2, "0")}`;
}

function chartLines(chart: ParsedChart, label: string): string[] {
  const lines: string[] = [];
  lines.push(`=== ${label} :: POSITIONS (${chart.positions.length}) ===`);
  for (const item of chart.positions) {
    const degree = formatDegree(item.degree, item.minute);
    const retro = item.retrograde ? " R" : "";
    const house = item.house ? ` | Maison ${item.house}` : "";
    lines.push(`${item.label}: ${item.sign}${degree ? ` ${degree}` : ""}${retro}${house}`);
  }

  lines.push(`=== ${label} :: MAISONS (${chart.houses.length}) ===`);
  for (const item of chart.houses) {
    const degree = formatDegree(item.degree, item.minute);
    lines.push(`${item.label}: ${item.sign}${degree ? ` ${degree}` : ""}`);
  }

  lines.push(`=== ${label} :: ASPECTS (${chart.aspects.length}) ===`);
  for (const item of chart.aspects) {
    lines.push(`${item.from} ${item.type} ${item.to}${item.orb ? ` (orb ${item.orb})` : ""}`);
  }

  lines.push(`=== ${label} :: REGLAGES (${chart.settings.length}) ===`);
  for (const item of chart.settings) {
    lines.push(`${item.label}: ${item.value}`);
  }

  lines.push(`=== ${label} :: WARNINGS (${chart.warnings.length}) ===`);
  if (chart.warnings.length) {
    for (const warning of chart.warnings) lines.push(warning);
  } else {
    lines.push("Aucun warning.");
  }
  lines.push(`=== ${label} :: CONFIDENCE === ${chart.confidence}`);
  return lines;
}

function buildSectionMachineTemplate(section: EditorialSectionShape) {
  const subtitle = section.subtitle?.trim() ? section.subtitle : "";
  const introPlaceholder = section.quoteOnly ? "[Laisser vide]" : "[Intro redigee]";
  const bodyPlaceholder = section.quoteOnly ? "[Laisser vide]" : "[Body redige]";
  const quotePlaceholder = "[Quote redigee]";
  const signaturePlaceholder = section.quoteOnly ? "[Laisser vide]" : "[Signature redigee ou laisser vide]";
  const required = section.quoteOnly
    ? "quote obligatoire (intro/body/signature laisses vides)"
    : "intro + body + quote obligatoires, signature optionnelle";

  return {
    key: section.key,
    meta: [
      `Section key: ${section.key}`,
      `Titre attendu: ${section.title}`,
      `Sous-titre attendu: ${subtitle}`,
      `Parametrage: ${required}`
    ],
    payload: [
      "===SECTION===",
      `key: ${section.key}`,
      `title: ${section.title}`,
      `subtitle: ${subtitle}`,
      "",
      "intro:",
      introPlaceholder,
      "",
      "body:",
      bodyPlaceholder,
      "",
      "quote:",
      quotePlaceholder,
      "",
      "signature:",
      signaturePlaceholder,
      "===END==="
    ].join("\n")
  };
}

function buildOperationalGuidelineLines(options: {
  strictKeys: string[];
  mode: "solo" | "compatibility";
}) {
  const isCompatibility = options.mode === "compatibility";
  const strictKeys = options.strictKeys;
  const productionContext = isCompatibility
    ? "dynamique relationnelle a deux"
    : "portrait intime a un theme";

  return [
    "Tu es un expert en astrologie multi-traditions.",
    `Tu produis des analyses rigoureuses, incarnees et editoriales premium destinees a un outil automatise (${productionContext}).`,
    "",
    "CADRE",
    "L astrologie est presentee comme une tradition symbolique interpretative, non scientifique.",
    "Ne jamais affirmer comme verite absolue.",
    "Ne jamais inventer de donnees.",
    "Si une donnee manque: ecrire \"Je ne sais pas\" + impact.",
    "",
    "RIGUEUR METHODOLOGIQUE (CRITIQUE)",
    "S appuyer sur les standards astrologiques reconnus, sans exposer de technique brute.",
    "Distinguer implicitement calculs et interpretation.",
    "Commenter uniquement ce qui est fiable selon les donnees disponibles.",
    "",
    "BASE DE CALCUL (IMPLICITE)",
    "Considerer: conversion correcte en temps universel.",
    "Considerer: verification fuseau et heure legale.",
    "Considerer: coordonnees geographiques precises.",
    "Considerer: calcul du temps sideral.",
    "Considerer: positions planetaires geocentriques.",
    "Considerer: Ascendant et MC exacts.",
    "Considerer: maisons selon systeme fourni.",
    "Considerer: aspects avec orbes et hierarchisation.",
    "Si un parametre manque: ecrire \"Je ne sais pas\" et indiquer l impact (surtout maisons / Ascendant).",
    "",
    "STRUCTURE D ANALYSE (PRIORITAIRE)",
    "1. Luminaires (Soleil / Lune)",
    "2. Ascendant + maitre d Ascendant",
    "3. MC / vocation",
    "4. Planetes dominantes (angles, stelliums)",
    "5. Axes majeurs (1/7, 4/10, etc.)",
    "6. Aspects les plus exacts",
    "Les elements secondaires viennent ensuite.",
    "",
    "LOGIQUE D INTERPRETATION",
    "Croiser signe + maison + aspects.",
    "Integrer repetitions symboliques et tensions recurrentes.",
    "Prendre en compte les polarites (elements, modalites).",
    "Maintenir l equilibre identite / emotion / relation / action.",
    "Eviter toute lecture isolee d un facteur.",
    "",
    "POINTS STRUCTURANTS A INTEGRER",
    "Saturne: structuration / maturation.",
    "Noeuds: dynamique evolutive symbolique.",
    "Pluton / Uranus / Neptune: transformations profondes.",
    "Lune: securite interieure.",
    "Venus / Mars: relationnel et desir.",
    "MC: trajectoire et exposition.",
    "",
    "CONFIGURATIONS",
    "Si presentes: stellium, T-carre, grand trigone, yod, autres structures majeures.",
    "Toujours expliquer leur impact global.",
    "",
    "CYCLES (SI DONNES)",
    "Peut integrer: retours planetaires, transits, progressions, cycles nodaux.",
    "Sinon: ne pas extrapoler.",
    "",
    "TRADITIONS MULTIPLES",
    "Si plusieurs approches sont mobilisees: ne pas melanger et distinguer implicitement les logiques.",
    "",
    "LIMITES (OBLIGATOIRE)",
    "Signaler la dependance a l heure de naissance, zones incertaines et limites de precision.",
    "Ne pas alourdir le texte.",
    "",
    "STYLE EDITORIAL",
    "Produire une lecture incarnee, jamais descriptive.",
    "Chaque section contient: idee forte + tension/contraste + manifestation concrete + evolution (sous tension / a son meilleur).",
    "Eviter phrases generiques, ton neutre, repetitions.",
    "Privilegier formulations directes, dynamiques vecues, psychologie fine.",
    "",
    "DENSITE EDITORIALE (OBLIGATOIRE)",
    "Chaque section doit avoir la meme profondeur.",
    "Le body ne doit jamais etre trop court, trop simple, ni limite a une seule idee.",
    "Chaque body contient au minimum:",
    "1) idee centrale claire",
    "2) nuance ou mise en tension",
    "3) manifestation concrete dans la realite",
    "4) ouverture ou evolution possible",
    "Structure interne attendue:",
    "Phrase 1: position claire (idee forte)",
    "Phrase 2: approfondissement / nuance",
    "Phrase 3: traduction concrete (vie reelle)",
    "Phrase 4: tension ou limite",
    "Phrase 5: potentiel ou transformation",
    "Interdictions: paragraphes plats, repetitions de schema, phrases faibles, manque de progression.",
    "Objectif: chaque section doit exister seule comme mini-texte complet, coherent et dense.",
    "Chaque section doit contenir au moins 250 mots sauf exception explicite.",
    "",
    "FORMAT OBLIGATOIRE",
    "Repondre uniquement avec des blocs machine:",
    "===SECTION===",
    "key: <cle>",
    "title: <titre>",
    "subtitle: <texte ou \"Non renseigne\">",
    "intro:",
    "20-50 mots",
    "body:",
    "250-500 mots (min 2 idees)",
    "quote:",
    "8-24 mots ou \"Non renseigne\"",
    "signature:",
    "10-25 mots, phrase forte, memorable",
    "===END===",
    "Aucun texte hors blocs. Aucun markdown. Aucune variation.",
    "",
    "REGLES SPECIALES",
    "Sections citation: intro/body/signature = Non renseigne.",
    "about_reading: quote/signature = Non renseigne.",
    "conclusion: intro 20-40 mots, body 250-500 mots, quote 10-25 mots, signature = Non renseigne.",
    "signature: equivalent \"EN UNE PHRASE\", jamais plate, quasi toujours remplie.",
    "quote: uniquement si pertinent sinon \"Non renseigne\".",
    "",
    "CLES STRICTES (ORDRE FIXE)",
    ...strictKeys,
    "Ne jamais changer une cle, changer l ordre ou oublier une section.",
    "",
    "ANTI-PARSING BUG",
    "Chaque champ commence immediatement apres son label.",
    "Exemple:",
    "intro:",
    "Texte...",
    "Aucune ligne vide au debut.",
    "",
    "MODES DE REPONSE",
    "MODE GLOBAL: si theme complet, produire toutes les sections en format machine strict.",
    "MODE LOCAL: si demande ciblee, repondre en texte normal (sans ===SECTION===), ameliorer profondeur/style/impact, ne jamais renvoyer tout le rapport.",
    "",
    "OBJECTIF",
    "Produire un texte directement injectable, editorial premium, incarne, precis, non neutre, exploitable en PDF haut de gamme."
  ];
}

function technicalFileNameBase(report: ReportRecord) {
  const safeTitle = report.meta.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return safeTitle || "rapport";
}

export function technicalPdfFilename(report: ReportRecord) {
  return `${technicalFileNameBase(report)}-brief-technique.pdf`;
}

function TechnicalFooter() {
  return (
    <Text
      style={techStyles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `Document technique interne - Prompt master astrologie - Page ${pageNumber}/${totalPages}`
      }
    />
  );
}

export function TechnicalPromptPdfDocumentPages({ report }: { report: ReportRecord }) {
  const isCompatibility = report.mode === "compatibility";
  const strictKeys = getEditorialSectionSchema(report.mode).map((section) => section.key);
  const operationalGuidelineLines = buildOperationalGuidelineLines({
    strictKeys,
    mode: report.mode
  });
  const operationalGuidelinePages = chunk(operationalGuidelineLines, 36);
  const documentTitle = isCompatibility
    ? "Brief GPT Astrologie - Compatibilite 2 themes"
    : "Brief GPT Astrologie - Portrait intime";
  const introSubtitle = isCompatibility
    ? "Ce document sert de prompt structure pour un GPT astrologie relationnelle. Il contient l identite du duo, les deux themes complets et la trame machine section par section."
    : "Ce document sert de prompt structure pour un GPT astrologie. Il contient l identite consultant, les donnees de theme completes et la trame machine section par section.";
  const identityKicker = isCompatibility ? "Identite du duo" : "Identite consultant";
  const identityTitle = isCompatibility
    ? "Fiche identite du duo et contexte natal A/B"
    : "Fiche identite et contexte natal";
  const identitySubtitle = isCompatibility
    ? "Elements personnels et metadonnees techniques a fournir au GPT avant analyse de compatibilite."
    : "Elements personnels et metadonnees techniques a fournir au GPT avant analyse.";
  const promptTitle = isCompatibility
    ? "Instruction complete a donner au GPT astrologie compatibilite"
    : "Instruction complete a donner au GPT astrologie";
  const promptMission = isCompatibility
    ? "Mission: Rediger une analyse astrologique de compatibilite complete en francais editorial premium. Integrer de facon croisee les dynamiques A/B (resonances, tensions, complementarites, rythme du lien), sans reduire l analyse a des generalites."
    : "Mission: Rediger une analyse astrologique complete en francais editorial premium.";

  const identityBlocks = report.mode === "solo"
    ? [{ label: "Consultant", lines: profileLines("Consultant", report.subjects.solo) }]
    : [
        { label: "Profil A", lines: profileLines("Profil A", report.subjects.personA) },
        { label: "Profil B", lines: profileLines("Profil B", report.subjects.personB) }
      ];

  const chartA = chartLines(report.parsedA, report.mode === "solo" ? "THEME CONSULTANT" : "THEME PROFIL A");
  const chartB = report.mode === "compatibility" && report.parsedB
    ? chartLines(report.parsedB, "THEME PROFIL B")
    : [];
  const allChartLines = [...chartA, ...chartB];
  const chartPages = chunk(allChartLines, 40);

  const rawBlocks = [
    {
      label: report.mode === "solo" ? "Raw input consultant" : "Raw input profil A",
      text: clean(report.rawInputA)
    }
  ];
  if (report.mode === "compatibility") {
    rawBlocks.push({
      label: "Raw input profil B",
      text: clean(report.rawInputB)
    });
  }

  const machineSections = getEditorialSectionSchema(report.mode).map((section) => buildSectionMachineTemplate(section));
  const machinePages = chunk(machineSections, 4);

  return (
    <>
      <Page size="A4" style={techStyles.page}>
        <Text style={techStyles.kicker}>Document technique interne</Text>
        <Text style={techStyles.title}>{documentTitle}</Text>
        <Text style={techStyles.subtitle}>{introSubtitle}</Text>

        <View style={techStyles.card}>
          <Text style={techStyles.cardTitle}>Metadonnees dossier</Text>
          <Text style={techStyles.line}>Rapport ID: {report.id}</Text>
          <Text style={techStyles.line}>Mode: {report.mode}</Text>
          <Text style={techStyles.line}>Titre editorial: {clean(report.meta.title)}</Text>
          <Text style={techStyles.line}>Sous-titre editorial: {clean(report.meta.subtitle)}</Text>
          <Text style={techStyles.line}>Genere le: {new Date().toLocaleString("fr-FR")}</Text>
          <Text style={techStyles.line}>Sortie cible GPT: payload machine strict avec keys canoniques.</Text>
        </View>

        <Text style={techStyles.sectionTitle}>Regles globales de generation GPT</Text>
        <Text style={techStyles.paragraph}>
          1) Respecter l ordre exact des keys canoniques. 2) Produire un bloc par section en format machine.
          3) Ne jamais omettre quote. 4) Ne jamais laisser un champ vide: utiliser "Non renseigne" si necessaire.
          5) Redaction: precise, nuancee, concrete, style editorial premium.
        </Text>
        {isCompatibility ? (
          <Text style={techStyles.paragraph}>
            6) Compatibilite: analyser les interactions croisees A/B (affectif, communication, desir, projection, securite) avec exemples concrets de dynamique relationnelle.
          </Text>
        ) : null}

        <Text style={techStyles.sectionTitle}>Format machine obligatoire</Text>
        <View style={techStyles.monoBlock}>
          <Text style={techStyles.monoText}>
            {`===SECTION===\nkey: <canonical_key>\ntitle: <titre>\nsubtitle: <texte ou "Non renseigne">\n\nintro:\n<texte ou "Non renseigne">\n\nbody:\n<texte ou "Non renseigne">\n\nquote:\n<texte ou "Non renseigne">\n\nsignature:\n<texte ou "Non renseigne">\n===END===`}
          </Text>
        </View>
        <TechnicalFooter />
      </Page>

      <Page size="A4" style={techStyles.page}>
        <Text style={techStyles.kicker}>{identityKicker}</Text>
        <Text style={techStyles.title}>{identityTitle}</Text>
        <Text style={techStyles.subtitle}>{identitySubtitle}</Text>

        {identityBlocks.map((block) => (
          <View key={block.label} style={techStyles.card}>
            <Text style={techStyles.cardTitle}>{block.label}</Text>
            {block.lines.map((line) => (
              <Text key={`${block.label}-${line}`} style={techStyles.line}>
                {line}
              </Text>
            ))}
          </View>
        ))}

        <View style={techStyles.card}>
          <Text style={techStyles.cardTitle}>Intentions redactionnelles attendues</Text>
          <Text style={techStyles.line}>- Voix: experte, elegante, concrete, sans jargon vide.</Text>
          <Text style={techStyles.line}>- Structure: intro / body / quote / signature pour chaque section.</Text>
          <Text style={techStyles.line}>- Niveau detail: interpretation complete du theme (forces, tensions, leviers).</Text>
          <Text style={techStyles.line}>- Sortie exploitable directement par l import machine de l outil.</Text>
        </View>
        <TechnicalFooter />
      </Page>

      {chunk(rawBlocks, 1).map((blockPage, pageIndex) => (
        <Page key={`raw-${pageIndex}`} size="A4" style={techStyles.page}>
          <Text style={techStyles.kicker}>Donnees brutes</Text>
          <Text style={techStyles.title}>{isCompatibility ? "Blocs natals sources A/B" : "Bloc natal source"}</Text>
          <Text style={techStyles.subtitle}>
            {isCompatibility
              ? "Transcription complete des deux themes natals avant parsing."
              : "Transcription complete des donnees natives avant parsing."}
          </Text>
          {blockPage.map((block) => (
            <View key={block.label} style={techStyles.card}>
              <Text style={techStyles.cardTitle}>{block.label}</Text>
              <Text style={techStyles.monoText}>{block.text}</Text>
            </View>
          ))}
          <TechnicalFooter />
        </Page>
      ))}

      {chartPages.map((lines, index) => (
        <Page key={`chart-${index}`} size="A4" style={techStyles.page}>
          <Text style={techStyles.kicker}>{isCompatibility ? "Themes astraux integraux" : "Theme astral integral"}</Text>
          <Text style={techStyles.title}>Dump structure des donnees parsees</Text>
          <Text style={techStyles.subtitle}>
            Inventaire complet des positions, maisons, aspects, reglages et warnings.
          </Text>
          <View style={techStyles.card}>
            {lines.map((line, lineIndex) => (
              <Text key={`chart-line-${index}-${lineIndex}`} style={techStyles.line}>
                {line}
              </Text>
            ))}
          </View>
          <TechnicalFooter />
        </Page>
      ))}

      <Page size="A4" style={techStyles.page}>
        <Text style={techStyles.kicker}>Prompt master</Text>
        <Text style={techStyles.title}>{promptTitle}</Text>
        <View style={techStyles.monoBlock}>
          <Text style={techStyles.monoText}>
            {`${promptMission}\nContrainte critique: produire UNIQUEMENT des blocs machine au format ===SECTION=== / ===END===.\nOrdre: utiliser strictement les keys canoniques fournies dans ce document.\nContenu: interpretation concrete, nuancee, exploitable, sans placeholders.\nQualite: coherence narrative, style haut de gamme, precision des leviers et tensions.\nConsignes operatoires completes: voir pages suivantes.`}
          </Text>
        </View>

        <Text style={techStyles.sectionTitle}>Checklist machine avant livraison</Text>
        <Text style={techStyles.line}>- Tous les keys canoniques presents</Text>
        <Text style={techStyles.line}>- Aucun key inconnu</Text>
        <Text style={techStyles.line}>- Aucune section dupliquee</Text>
        <Text style={techStyles.line}>- quote renseignee partout</Text>
        <Text style={techStyles.line}>- signature renseignee ou laissee vide selon section</Text>
        <Text style={techStyles.line}>- Aucune prose hors bloc machine</Text>
        <TechnicalFooter />
      </Page>

      {operationalGuidelinePages.map((lines, pageIndex) => (
        <Page key={`${report.mode}-guidelines-${pageIndex}`} size="A4" style={techStyles.page}>
          <Text style={techStyles.kicker}>Consignes operatoires</Text>
          <Text style={techStyles.title}>
            {isCompatibility ? "Directive GPT dedie compatibilite" : "Directive GPT dedie portrait intime"}
          </Text>
          <Text style={techStyles.subtitle}>
            {isCompatibility
              ? "Rappel integral des consignes de production pour le GPT dedie a l analyse de compatibilite."
              : "Rappel integral des consignes de production pour le GPT dedie au portrait intime."}
          </Text>
          <View style={techStyles.card}>
            {lines.map((line, lineIndex) => (
              <Text key={`${report.mode}-guideline-line-${pageIndex}-${lineIndex}`} style={techStyles.line}>
                {line || " "}
              </Text>
            ))}
          </View>
          <TechnicalFooter />
        </Page>
      ))}

      {machinePages.map((sections, pageIndex) => (
        <Page key={`machine-${pageIndex}`} size="A4" style={techStyles.page}>
          <Text style={techStyles.kicker}>Trame directrice</Text>
          <Text style={techStyles.title}>Rubriques et parametrage machine</Text>
          <Text style={techStyles.subtitle}>
            Sections canoniques attendues par le parser interne, avec squelette de sortie.
          </Text>

          {sections.map((entry) => (
            <View key={entry.key} style={techStyles.card}>
              <Text style={techStyles.cardTitle}>{entry.key}</Text>
              {entry.meta.map((line) => (
                <Text key={`${entry.key}-${line}`} style={techStyles.line}>
                  {line}
                </Text>
              ))}
              <View style={techStyles.monoBlock}>
                <Text style={techStyles.monoText}>{entry.payload}</Text>
              </View>
            </View>
          ))}
          <TechnicalFooter />
        </Page>
      ))}
    </>
  );
}

export function TechnicalPromptPdfDocument({ report }: { report: ReportRecord }) {
  return (
    <Document title={`${report.meta.title} - Brief technique`}>
      <TechnicalPromptPdfDocumentPages report={report} />
    </Document>
  );
}
