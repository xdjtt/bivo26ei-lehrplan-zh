function getSiteBase() {
  const script = document.querySelector('script[src*="svg-lightbox.js"]')
  if (!script) return ""
  const scriptUrl = new URL(script.getAttribute("src"), window.location.href)
  return scriptUrl.pathname.replace(/\/static\/svg-lightbox\.js$/, "")
}

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

      const siteBase = getSiteBase()
      overlay.querySelectorAll("a").forEach(link => {
        link.style.cursor = "pointer"
        link.addEventListener("click", (e) => {
          e.stopPropagation()
          const href = link.getAttribute("href")
          if (href && href.startsWith("/")) {
            e.preventDefault()
            window.open(siteBase + href, "_blank")
          }
        })
      })

      document.body.appendChild(overlay)
    })
  })
}

document.addEventListener("DOMContentLoaded", () => { setupSvgLightbox() })
document.addEventListener("nav", () => { setupSvgLightbox() })
