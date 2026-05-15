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

      // Relative hrefs (../path) → absolute für iframe-Kontext
      svgText = svgText.replace(/href="\.\.\/([^"]+)"/g, `href="${origin}${siteBase}/$1"`)

      // SVG in isolierter HTML-Seite — alle Aktionen via postMessage
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #d0d0d0;
               display: flex; justify-content: center; align-items: center;
               cursor: zoom-out; }
  svg { max-width: 100%; max-height: 100%; cursor: zoom-out; }
  a { cursor: pointer; }
</style>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    // Links: href als String via getAttribute (SVG-a gibt kein String bei .href)
    document.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        const href = link.getAttribute("href")
        if (href) window.top.postMessage({ type: "svg-navigate", href }, "*")
      })
    })

    // Escape: Overlay schliessen
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") window.top.postMessage({ type: "svg-close" }, "*")
    })

    // Klick irgendwo ausserhalb eines Links: Overlay schliessen
    document.body.addEventListener("click", () => {
      window.top.postMessage({ type: "svg-close" }, "*")
    })
  })
<\/script>
</head>
<body>${svgText}</body>
</html>`

      const blob = new Blob([html], { type: "text/html" })
      const blobUrl = URL.createObjectURL(blob)

      const overlay = document.createElement("div")
      overlay.style.cssText = `
        position: fixed; inset: 0; background: #d0d0d0;
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; cursor: zoom-out;
      `

      const iframe = document.createElement("iframe")
      iframe.style.cssText = "width: 95vw; height: 95vh; border: none;"
      iframe.src = blobUrl
      overlay.appendChild(iframe)

      const close = () => {
        overlay.remove()
        URL.revokeObjectURL(blobUrl)
        window.removeEventListener("message", onMessage)
        document.removeEventListener("keydown", onKeyDown)
      }

      const onKeyDown = (e) => { if (e.key === "Escape") close() }
      document.addEventListener("keydown", onKeyDown)

      const onMessage = (e) => {
        if (e.data?.type === "svg-close") {
          close()
        } else if (e.data?.type === "svg-navigate") {
          close()
          window.location.href = e.data.href
        }
      }
      window.addEventListener("message", onMessage)

      // Klick auf äusseren Rand (ausserhalb iframe)
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close() })

      // × Schaltfläche
      const closeBtn = document.createElement("button")
      closeBtn.textContent = "×"
      closeBtn.style.cssText = `
        position: absolute; top: 1rem; right: 1.5rem;
        background: none; border: none; font-size: 2rem;
        cursor: pointer; color: #444; line-height: 1;
      `
      closeBtn.addEventListener("click", close)
      overlay.appendChild(closeBtn)

      document.body.appendChild(overlay)
    })
  })
}

document.addEventListener("DOMContentLoaded", () => { setupSvgLightbox() })
document.addEventListener("nav", () => { setupSvgLightbox() })
