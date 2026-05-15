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

      // Relative hrefs (../path) → absolute so they work from blob URL context
      svgText = svgText.replace(/href="\.\.\/([^"]+)"/g, `href="${origin}${siteBase}/$1"`)

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #d0d0d0; display: flex; justify-content: center; align-items: center; }
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
