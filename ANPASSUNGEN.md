# Quartz 4 – Anpassungen und Erweiterungen

Wiederherstellungsreferenz für alle Änderungen am Quartz-Standard.
Letzte Aktualisierung: Mai 2026

---

## Übersicht: Update-Sicherheit

| Datei | Art | Sicher bei `npx quartz update`? |
|---|---|---|
| `quartz.layout.ts` | User-Config | ✅ Ja |
| `quartz/styles/custom.scss` | User-Customization | ✅ Ja |
| `quartz/static/lightbox.js` | Eigene Datei | ✅ Ja |
| `quartz/static/svg-lightbox.js` | Eigene Datei | ✅ Ja |
| `quartz/components/scripts/graph.inline.ts` | Framework-Kern | ⚠️ **Nein – manuell wiederherstellen** |

---

## ✅ 1. `quartz.layout.ts` — Graph-Konfiguration

**Was:** Zwei bedingte Graph-Komponenten (Startseite vs. Unterseiten). `#todo`-Tags werden im Graph ausgeblendet. Auf der Startseite wird der Graph mit voller Tiefe (`depth: -1`) angezeigt, auf allen anderen Seiten nur die direkten Nachbarn (`depth: 1`).

**Vollständige Graph-Konfiguration:**
```typescript
// Startseite (index): voller Graph
Component.ConditionalRender({
  component: Component.Graph({
    localGraph:  { depth: -1, repelForce: 1.2, centerForce: 0.5, linkDistance: 20,  removeTags: ["todo"] },
    globalGraph: { depth: -1, repelForce: 8,   centerForce: 0.7, linkDistance: 170, opacityScale: 3, removeTags: ["todo"] },
  }),
  condition: (page) => page.fileData.slug === "index",
}),

// Alle anderen Seiten: nur direkte Nachbarn
Component.ConditionalRender({
  component: Component.Graph({
    localGraph:  { depth: 1, repelForce: 1.2, centerForce: 0.5, linkDistance: 20,  removeTags: ["todo"] },
    globalGraph: { depth: 1, repelForce: 8,   centerForce: 0.7, linkDistance: 170, opacityScale: 3, removeTags: ["todo"] },
  }),
  condition: (page) => page.fileData.slug !== "index",
}),
```

> **Hinweis:** `repelForce` wird intern mit `-100` multipliziert → `repelForce: 8` entspricht D3-Stärke `-800`. Werte über `14` sprengen den Graph auseinander.

---

## ✅ 2. `quartz/styles/custom.scss` — Stile

**Was:** Bilder zentriert, Callout-Icons ausgeblendet, drei Callout-Typen mit eigenem Design.

**Verwendung in Markdown:**
- `> [!example|titel] HS1:` → Handlungssituation (blauer Balken links)
- `> [!info]` → Kenntnisse (grauer Balken links, Titel versteckt)
- `> [!note]` → Hinweise (gelber Balken links, Titel versteckt)
- `> [!info|titel]` oder `> [!note|titel]` → Titel einblenden

**Vollständiger Inhalt:**
```scss
@use "./base.scss";

/* ── Bilder zentriert mit Abstand ─────────── */
article img {
  display: block;
  margin: 1.5rem auto;
}

/* ── Callout-Icons ausblenden ─────────────── */
.callout-icon {
    display: none;
}

/* Titel bei Note und Info standardmässig verstecken */
.callout[data-callout="note"] .callout-title,
.callout[data-callout="info"] .callout-title {
    display: none;
}

/* Titel einblenden mit: > [!info|titel] oder > [!note|titel] */
.callout[data-callout="note"][data-callout-metadata~="titel"] .callout-title,
.callout[data-callout="info"][data-callout-metadata~="titel"] .callout-title {
    display: flex;
}

/* Handlungssituationen [!example] – dezentes Blau */
.callout[data-callout="example"] {
    --color: rgb(26, 127, 168);
    --bg: rgba(26, 127, 168, 0.05);
    border: none;
    border-left: 3px solid rgba(26, 127, 168, 0.6);
    box-shadow: none;
}

/* Kenntnisse [!info] – dezentes Grau */
.callout[data-callout="info"] {
    --color: rgb(100, 100, 100);
    --bg: rgba(0, 0, 0, 0.03);
    border: none;
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    box-shadow: none;
}

/* Hinweise [!note] – dezentes Gelb */
.callout[data-callout="note"] {
    --color: rgb(180, 140, 0);
    --bg: rgba(180, 140, 0, 0.05);
    border: none;
    border-left: 3px solid rgba(180, 140, 0, 0.4);
    box-shadow: none;
}
```

---

## ✅ 3. `quartz/static/lightbox.js` — Lightbox für normale Bilder

**Was:** Klick auf ein Bild (kein SVG) öffnet es in einem dunklen Overlay. SVG-Bilder werden explizit ausgeschlossen, damit kein Doppel-Overlay mit `svg-lightbox.js` entsteht.

```javascript
document.addEventListener("DOMContentLoaded", () => { setupLightbox() })
document.addEventListener("nav", () => { setupLightbox() })

function setupLightbox() {
  const overlay = document.getElementById("lightbox-overlay") ?? createOverlay()
  document.querySelectorAll("article img:not([src$='.svg'])").forEach((img) => {
    img.style.cursor = "zoom-in"
    img.addEventListener("click", () => {
      overlay.querySelector("img").src = img.src
      overlay.style.display = "flex"
    })
  })
}

function createOverlay() {
  const overlay = document.createElement("div")
  overlay.id = "lightbox-overlay"
  overlay.style.cssText = `
    display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85);
    z-index:9999; justify-content:center; align-items:center; cursor:zoom-out;
  `
  const img = document.createElement("img")
  img.style.cssText = "max-width:90vw; max-height:90vh; border-radius:6px;"
  overlay.appendChild(img)
  overlay.addEventListener("click", () => (overlay.style.display = "none"))
  document.body.appendChild(overlay)
  return overlay
}
```

---

## ✅ 4. `quartz/static/svg-lightbox.js` — Lightbox für SVG-Bilder

**Was:** Klick auf ein SVG-Bild öffnet die SVG in einem neuen Tab, zentriert in einer HTML-Seite. Interne Links (AS1, ID3 etc.) navigieren im selben Tab zur entsprechenden Seite.

**Technischer Hintergrund:**
- Die SVG wird per `fetch` geladen und als Inline-SVG in eine HTML-Seite eingebettet
- Relative Pfade (`../01_Lehrjahr/...`) werden zu absoluten URLs umgeschrieben, damit sie vom Blob-URL-Kontext aus funktionieren
- `getSiteBase()` liest den Basispfad aus der Script-URL → funktioniert auch bei GitHub Pages mit Unterordner-Deployment (z.B. `user.github.io/repo/`)

```javascript
function getSiteBase() {
  const script = document.querySelector('script[src*="svg-lightbox.js"]')
  if (!script) return ""
  const scriptUrl = new URL(script.getAttribute("src"), window.location.href)
  return scriptUrl.pathname.replace(/\/static\/svg-lightbox\.js$/, "")
}

function setupSvgLightbox() {
  document.querySelectorAll('img[src$=".svg"]').forEach(img => {
    if (img.dataset.svgLightbox) return
    img.dataset.svgLightbox = "true"
    img.style.cursor = "zoom-in"

    img.addEventListener("click", async () => {
      const siteBase = getSiteBase()
      const origin = window.location.origin

      const response = await fetch(img.src)
      let svgText = await response.text()

      // Relative hrefs (../pfad) → absolute URLs für Blob-URL-Kontext
      svgText = svgText.replace(/href="\.\.\/([^"]+)"/g, `href="${origin}${siteBase}/$1"`)

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #d0d0d0;
               display: flex; justify-content: center; align-items: center; }
  svg { max-width: 95vw; max-height: 95vh; }
  a { cursor: pointer; }
</style>
</head>
<body>${svgText}</body>
</html>`

      const blob = new Blob([html], { type: "text/html" })
      window.open(URL.createObjectURL(blob), "_blank")
    })
  })
}

document.addEventListener("DOMContentLoaded", () => { setupSvgLightbox() })
document.addEventListener("nav", () => { setupSvgLightbox() })
```

---

## ⚠️ 5. `quartz/components/scripts/graph.inline.ts` — Graph-Rendering

> **Diese Datei wird bei `npx quartz update` überschrieben.**
> Nach jedem Update die drei folgenden Stellen manuell wiederherstellen.

### Änderung A — Knotengrösse nach eingehenden Links (ca. Zeile 216)

**Wozu:** Leistungsziele (d2.3, a1.1 etc.) auf die viele Blöcke verweisen werden gross dargestellt. Blöcke selbst (ID4, KT3), die nur verlinken, bleiben klein.

```typescript
function nodeRadius(d: NodeData) {
  const numIncoming = graphData.links.filter(
    (l) => l.target.id === d.id,
  ).length
  return 2 + Math.sqrt(numIncoming) * 4
}
```

### Änderung B — Texte mit Zeilenumbruch (im `new Text({...})` Block, ca. Zeile 391)

**Wozu:** Lange Knotennamen werden umgebrochen statt überlappend dargestellt.

```typescript
style: {
  fontSize: fontSize * 15,
  fill: computedStyleMap["--dark"],
  fontFamily: computedStyleMap["--bodyFont"],
  wordWrap: true,        // ← NEU
  wordWrapWidth: 120,    // ← NEU
  align: "center",       // ← NEU
},
```

### Änderung C — Kollisionsradius (`.force("collide", ...)`, ca. Zeile 180)

**Wozu:** Knoten halten grösseren Abstand → Labels überlappen sich nicht.

```typescript
.force("collide", forceCollide<NodeData>((n) => nodeRadius(n) + 55).iterations(5))
```

---

## SVG-Chronologie — Linkstruktur

Die Datei `content/_Bilder/Chronologie_1.Lehrjahr.svg` enthält klickbare Links für AS1–AS4 und ID1–ID5.

**Inkscape-kompatible Struktur** (`<a>` muss `<g>` umschliessen, nicht umgekehrt):
```xml
<a
   href="../01_Lehrjahr/AS1_Baustelle-einrichten,-PSA"
   id="link-as1">
  <g id="g5-50" inkscape:label="AS1" transform="...">
    <rect ... />
    <text ... />
  </g>
</a>
```

**Pfade als relative URLs** (`../01_Lehrjahr/...`):
- Funktioniert wenn SVG direkt im Browser geöffnet wird (neuer Tab)
- Wird von `svg-lightbox.js` zu absoluten URLs umgeschrieben (Blob-Kontext)
- Kompatibel mit GitHub Pages Unterordner-Deployment

**Quartz-Slugify-Regeln** (für korrekte URLs):
- Leerzeichen → `-`
- Umlaute bleiben (ä, ö, ü)
- Klammern bleiben — z.B. `AS4_PSA-(Elektro)`
- `«»` → entfernt

---

## Wiederherstellung nach `npx quartz update`

1. `quartz.layout.ts` — Graph-Konfiguration aus Abschnitt 1 prüfen (meist unverändert)
2. `quartz/styles/custom.scss` — Inhalt aus Abschnitt 2 prüfen (meist unverändert)
3. `quartz/static/lightbox.js` — Falls überschrieben: Inhalt aus Abschnitt 3 einfügen
4. `quartz/static/svg-lightbox.js` — Falls überschrieben: Inhalt aus Abschnitt 4 einfügen
5. `quartz/components/scripts/graph.inline.ts` — **Die drei Änderungen A, B, C aus Abschnitt 5 manuell einpflegen**
