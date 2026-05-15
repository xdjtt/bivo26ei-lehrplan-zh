# CLAUDE.md – Projektkontext Riva 2028 Elektroinstallateur

## Projektübersicht

Quartz 4 Static-Site-Generator für ein Berufsschul-Lehrplan-Vault (Elektroinstallateur, Kanton Zürich).
- **Vault-Pfad:** `C:\Users\Nicolas\OneDrive - SekII Zürich\Lehrplan Muster\Lehrplan-Vault\`
- **Quartz-Pfad:** `C:\Users\Nicolas\quartz\`
- **Deployment:** GitHub Pages (Branch `v4`, User `xdjtt`)
- **Sprache:** Deutsch (Schweiz)

## Struktur

```
Lehrplan-Vault/
├── 01_Lehrjahr/          ← Lehrplan-Blöcke (AS, ID, KT, ES)
├── _Bilder/              ← Bilder und SVG-Dateien
├── index.md              ← Startseite mit Chronologie + Inhaltsverzeichnis
└── Inhaltsverzeichnis.md ← Übersicht aller Blöcke nach Semester
```

## Block-Dateistruktur (einheitliches Format)

```markdown
---
block: AS 1
lehrjahr: "1"
semester: "1"
lektionen_vorgabe: "8"
leistungsziele:
  - a1.1
---
# AS1_Titel des Blocks

![[Bild.jpg| 400]]

## Handlungssituationen

> [!example|titel] HS1:
> Beschreibung...

## Kenntnisse

> [!info]
> Kennt: [[leistungsziel]]
> - Punkt 1
> - Punkt 2

## Hinweise

> [!note]
>
```

## Wichtige Dateien und ihre Rolle

| Datei | Zweck | Update-sicher? |
|---|---|---|
| `quartz.layout.ts` | Graph-Konfiguration, Layout | ✅ Ja |
| `quartz/styles/custom.scss` | Callout-Stile, Bild-Zentrierung | ✅ Ja |
| `quartz/static/lightbox.js` | Lightbox für normale Bilder | ✅ Ja |
| `quartz/static/svg-lightbox.js` | SVG öffnet zentriert im neuen Tab | ✅ Ja |
| `quartz/components/scripts/graph.inline.ts` | Graph-Rendering (Knotengrösse, Labels) | ⚠️ Nein |
| `Anpassungen.md` | Vollständige Wiederherstellungsreferenz | ✅ Ja |

## Graph-Anpassungen (graph.inline.ts — nach Update wiederherstellen)

Drei Stellen müssen nach `npx quartz update` manuell wiederhergestellt werden:

**A) Knotengrösse nach eingehenden Links (~Zeile 216):**
```typescript
function nodeRadius(d: NodeData) {
  const numIncoming = graphData.links.filter((l) => l.target.id === d.id).length
  return 2 + Math.sqrt(numIncoming) * 4
}
```

**B) Texte mit Zeilenumbruch (~Zeile 391, im `style:` Block des `new Text(...)`):**
```typescript
wordWrap: true,
wordWrapWidth: 120,
align: "center",
```

**C) Kollisionsradius (~Zeile 180):**
```typescript
.force("collide", forceCollide<NodeData>((n) => nodeRadius(n) + 55).iterations(5))
```

## Callout-Konventionen

- `> [!example|titel] HS1:` → Handlungssituation (blauer Balken)
- `> [!info]` → Kenntnisse (grauer Balken, kein Titel)
- `> [!note]` → Hinweise (gelber Balken, kein Titel)
- `> [!info|titel]` oder `> [!note|titel]` → Titel einblenden

## SVG-Chronologie (Chronologie_1.Lehrjahr.svg)

- Links für AS1–AS4, ID1–ID5 vorhanden; KT1/KT2 ohne Link
- `<a>` muss `<g>` umschliessen (Inkscape-kompatibel)
- Pfade relativ: `href="../01_Lehrjahr/Seitenname"`
- `svg-lightbox.js` schreibt Pfade beim Öffnen zu absoluten URLs um

## Quartz-Slugify-Regeln (für SVG-Links und Verlinkungen)

- Leerzeichen → `-`
- Umlaute bleiben (ä, ö, ü, é)
- Klammern bleiben — z.B. `AS4_PSA-(Elektro)`
- `«»` → entfernt
- `&` → `-and-`

## Präferenzen

- **Dateien bearbeiten:** Bevorzuge User-Config-Dateien (`quartz.layout.ts`, `custom.scss`). Framework-Dateien (`graph.inline.ts`) nur wenn nötig.
- **Sprache:** Antworten auf Deutsch
- **Kommentare im Code:** Nur wenn der Grund nicht offensichtlich ist
- **Vor Änderungen:** Bei unklarem Auftrag erst fragen, dann ausführen
