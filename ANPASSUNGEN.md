# Quartz 4 – Anpassungen und Erweiterungen

Dieses Dokument beschreibt alle Änderungen am Quartz-Standard, die für dieses Projekt vorgenommen wurden. Es dient als Wiederherstellungsreferenz.

---

## Übersicht der geänderten Dateien

| Datei | Art | Update-sicher? |
|---|---|---|
| `quartz/styles/custom.scss` | Geändert | Ja |
| `quartz.layout.ts` | Geändert | Ja |
| `quartz/static/lightbox.js` | Neu erstellt | Ja |
| `quartz/static/svg-lightbox.js` | Neu erstellt | Ja |
| `quartz/components/scripts/graph.inline.ts` | Geändert (Core) | Nein – bei Updates manuell prüfen |

---

## 1. `quartz/styles/custom.scss`

Eigene CSS-Anpassungen. Diese Datei überschreibt Quartz-Standardstile, da sie nach `base.scss` (welches `callouts.scss` einschliesst) geladen wird.

**Vollständiger Inhalt:**
```scss
@use "./base.scss";

/* ── Bilder mit Abstand ──────────────────── */
article img {
  display: block;
  margin: 1.5rem auto;
}

/* ── Callouts ─────────────────────────────── */
/* Icons ausblenden */
.callout-icon {
    display: none;
}

/* Titel bei Note ausblenden */
.callout[data-callout="note"] .callout-title {
    display: none;
}

/* Handlungssituationen – dezentes Blau */
.callout[data-callout="example"] {
    --color: rgb(26, 127, 168);
    --bg: rgba(26, 127, 168, 0.05);
    border: none;
    border-left: 3px solid rgba(26, 127, 168, 0.6);
    box-shadow: none;
}

/* Kenntnisse – dezentes Grau */
.callout[data-callout="info"] {
    --color: rgb(100, 100, 100);
    --bg: rgba(0, 0, 0, 0.03);
    border: none;
    border-left: 3px solid rgba(0, 0, 0, 0.2);
    box-shadow: none;
}

/* Hinweise – dezentes Gelb */
.callout[data-callout="note"] {
    --color: rgb(180, 140, 0);
    --bg: rgba(180, 140, 0, 0.05);
    border: none;
    border-left: 3px solid rgba(180, 140, 0, 0.4);
    box-shadow: none;
}
```

**Wichtig für Callouts:** Quartz verwendet `--color`, `--bg` und `--border` als CSS-Variablen (nicht `--callout-color` wie Obsidian Publish). Der Rahmen muss mit `border: none` vollständig zurückgesetzt werden, bevor `border-left` gesetzt wird.

---

## 2. `quartz.layout.ts`

Layout-Konfiguration. Anpassungen gegenüber dem Standard:

- **Seitentitel** (`PageTitle`) wird im Header angezeigt (über die volle Seitenbreite), nicht in der linken Sidebar
- **Breadcrumbs** werden auf der Index-Seite ausgeblendet
- **ArticleTitle, ContentMeta, TagList** sind auskommentiert (deaktiviert)
- **Graph** ist seitenabhängig konfiguriert (Index vs. alle anderen Seiten)
- **ReaderMode** ist in der Toolbar aktiviert

**PageTitle im Header:**

Der Titel wird in `sharedPageComponents.header` gesetzt und ist damit auf allen Seiten sichtbar. In den `left`-Bereichen von `defaultContentPageLayout` und `defaultListPageLayout` wurde `Component.PageTitle()` entfernt.

```typescript
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.PageTitle()],  // ← Titel im Header
  ...
}
```

**Graph-Konfiguration:**

| Parameter | Index-Seite | Andere Seiten | Erklärung |
|---|---|---|---|
| `depth` (local) | `-1` (alle) | `1` (direkte Nachbarn) | Tiefe des lokalen Graphen |
| `depth` (global) | `-1` (alle) | `1` (direkte Nachbarn) | Tiefe beim Klick auf das Graph-Icon |
| `repelForce` | `1.2` | `1.2` | Abstosskraft zwischen Nodes |
| `centerForce` (local) | `0.5` | `0.5` | Anziehung zur Mitte |
| `centerForce` (global) | `*(angepasst)*` | `0.8` | Stärkere Zentrierung im grossen Graph |
| `linkDistance` (local) | `20` | `20` | Länge der Verbindungslinien |
| `linkDistance` (global) | `*(angepasst)*` | `15` | Kürzere Linien im grossen Graph |

---

## 3. `quartz/static/lightbox.js` *(neu erstellt)*

Lightbox für normale Bilder (alle ausser SVG). Beim Klick auf ein Bild öffnet sich ein dunkles Overlay mit dem Bild in Vollgrösse. Klick auf das Overlay schliesst es wieder.

**Wichtig:** SVG-Bilder werden explizit ausgeschlossen (`:not([src$='.svg'])`), damit kein Doppel-Overlay mit `svg-lightbox.js` entsteht.

**Vollständiger Inhalt:**
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

## 4. `quartz/static/svg-lightbox.js` *(neu erstellt)*

Lightbox speziell für SVG-Dateien. Im Gegensatz zur normalen Lightbox wird das SVG inline gerendert, damit enthaltene Links klickbar bleiben.

**Besonderheiten:**
- `data-svg-lightbox`-Attribut verhindert doppelte Event-Listener bei mehrfachem Seitenaufruf (Quartz ruft `nav` und `DOMContentLoaded` auf)
- Klick auf SVG-Links (`<a>`) schliesst das Overlay **nicht** (via `stopPropagation`)
- Klick irgendwo sonst schliesst das Overlay

**Vollständiger Inhalt:**
```javascript
function setupSvgLightbox() {
  const svgImages = document.querySelectorAll('img[src$=".svg"]')
  
  svgImages.forEach(img => {
    if (img.dataset.svgLightbox) return
    img.dataset.svgLightbox = "true"
    img.style.cursor = "zoom-in"

    img.addEventListener("click", async () => {
      const response = await fetch(img.src)
      const svgText = await response.text()
      
      const overlay = document.createElement("div")
      overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.8);
        display: flex; align-items: center;
        justify-content: center;
        z-index: 9999; cursor: zoom-out;
      `
      overlay.innerHTML = svgText

      const svg = overlay.querySelector("svg")
      svg.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        cursor: zoom-out;
      `

      overlay.addEventListener("click", () => overlay.remove())

      overlay.querySelectorAll("a").forEach(link => {
        link.style.cursor = "pointer"
        link.addEventListener("click", (e) => e.stopPropagation())
      })
      
      document.body.appendChild(overlay)
    })
  })
}

document.addEventListener("DOMContentLoaded", () => { setupSvgLightbox() })
document.addEventListener("nav", () => { setupSvgLightbox() })
```

---

## 5. `quartz/components/scripts/graph.inline.ts` *(Core-Datei – Update-Risiko)*

> **Achtung:** Diese Datei gehört zum Quartz-Kern. Bei einem `git pull` vom Upstream-Repo können hier Merge-Konflikte entstehen. Die drei Änderungen müssen dann manuell erneut eingepflegt werden.

### Änderung 1 – Unverlinkte Nodes ausblenden

**Wo:** Nach Zeile 162 (nach dem Aufbau von `graphData`)

**Einfügen:**
```typescript
// Unverlinkte Nodes ausblenden (ausser aktuelle Seite)
const linkedIds = new Set<SimpleSlug>()
graphData.links.forEach((l) => {
  linkedIds.add(l.source.id)
  linkedIds.add(l.target.id)
})
graphData.nodes = graphData.nodes.filter((n) => linkedIds.has(n.id) || n.id === slug)
```

### Änderung 2 – Kollisions-Radius erhöhen

**Wo:** In der Simulation-Konfiguration (Zeile ~180)

**Original:**
```typescript
.force("collide", forceCollide<NodeData>((n) => nodeRadius(n)).iterations(3))
```

**Geändert zu:**
```typescript
.force("collide", forceCollide<NodeData>((n) => nodeRadius(n) + 14).iterations(3))
```

**Zweck:** Verhindert Label-Überlappungen indem Nodes einen Mindestabstand von 14px halten.

### Änderung 3 – Label-Abstand erhöhen

**Wo:** In der Label-Erstellung (Zeile ~390)

**Original:**
```typescript
anchor: { x: 0.5, y: 1.2 },
```

**Geändert zu:**
```typescript
anchor: { x: 0.5, y: 1.6 },
```

**Zweck:** Verschiebt den Label-Text weiter vom Node weg. Höherer Wert = mehr Abstand.

---

## Wiederherstellung nach Quartz-Update

1. `quartz/styles/custom.scss` — Inhalt aus Abschnitt 1 einfügen
2. `quartz.layout.ts` — Graph-Konfiguration aus Abschnitt 2 übernehmen
3. `quartz/static/lightbox.js` — Neue Datei mit Inhalt aus Abschnitt 3 erstellen
4. `quartz/static/svg-lightbox.js` — Neue Datei mit Inhalt aus Abschnitt 4 erstellen
5. `quartz/components/scripts/graph.inline.ts` — Die drei Änderungen aus Abschnitt 5 manuell einpflegen (Merge-Konflikt auflösen)
