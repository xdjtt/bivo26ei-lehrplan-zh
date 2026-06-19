function setupSvgLightbox() {
  document.querySelectorAll('img[src$=".svg"]').forEach(img => {
    if (img.dataset.svgLightbox) return
    img.dataset.svgLightbox = "true"
    img.style.cursor = "zoom-in"

    img.addEventListener("click", async () => {
      const response = await fetch(img.src)
      const svgText = await response.text()

      const overlay = document.createElement("div")
      overlay.style.cssText = `
        position: fixed; inset: 0; background: #d0d0d0;
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; cursor: zoom-out; overflow: auto;
      `
      overlay.innerHTML = svgText

      const svgEl = overlay.querySelector("svg")
      if (svgEl) {
        svgEl.style.maxWidth = "95vw"
        svgEl.style.maxHeight = "95vh"
        svgEl.style.transformOrigin = "top left"
      }

      const close = () => {
        overlay.remove()
        document.removeEventListener("keydown", onKeyDown)
      }
      const onKeyDown = (e) => { if (e.key === "Escape") close() }
      document.addEventListener("keydown", onKeyDown)

      // Links: href als String via getAttribute (SVG-a gibt kein String bei .href)
      overlay.querySelectorAll("a").forEach(link => {
        link.style.cursor = "pointer"
        link.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          const href = link.getAttribute("href")
          if (href) {
            close()
            window.location.href = href
          }
        })
      })

      // Ermittelt die tatsächlich gezeichnete Fläche des SVG-Inhalts auf dem Bildschirm
      // (die Elementgrenze von <svg> selbst kann grösser sein als der sichtbare Inhalt, z.B. durch Letterboxing)
      function getContentRect() {
        if (!svgEl || typeof svgEl.getBBox !== "function") return null
        let bbox
        try { bbox = svgEl.getBBox() } catch { return null }
        const ctm = svgEl.getScreenCTM()
        if (!ctm) return null
        const p1 = new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm)
        const p2 = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(ctm)
        return {
          left: Math.min(p1.x, p2.x),
          right: Math.max(p1.x, p2.x),
          top: Math.min(p1.y, p2.y),
          bottom: Math.max(p1.y, p2.y),
        }
      }

      function isInsideContent(x, y) {
        const rect = getContentRect()
        return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      }

      // Strg+Mausrad: SVG vergrössern/verkleinern, zentriert auf den Mauszeiger
      // (transform-origin bleibt "top left" für die Erreichbarkeit; der Cursor-zentrierte
      // Eindruck entsteht rein durchs Mit-Scrollen, damit der Punkt unter der Maus fix bleibt)
      let zoomLevel = 1
      overlay.addEventListener("wheel", (e) => {
        if (!e.ctrlKey || !svgEl) return
        e.preventDefault()

        const rectBefore = svgEl.getBoundingClientRect()
        const ratioX = (e.clientX - rectBefore.left) / rectBefore.width
        const ratioY = (e.clientY - rectBefore.top) / rectBefore.height

        const oldZoom = zoomLevel
        zoomLevel = Math.min(4, Math.max(1, zoomLevel + (e.deltaY < 0 ? 0.1 : -0.1)))
        if (zoomLevel === oldZoom) return

        svgEl.style.transform = `scale(${zoomLevel})`

        const rectAfter = svgEl.getBoundingClientRect()
        const targetX = rectAfter.left + ratioX * rectAfter.width
        const targetY = rectAfter.top + ratioY * rectAfter.height
        overlay.scrollLeft += targetX - e.clientX
        overlay.scrollTop += targetY - e.clientY
      }, { passive: false })

      // Klick-und-Ziehen: vergrössertes Bild verschieben; Cursor je nach tatsächlichem Bildinhalt
      let isDragging = false
      let startX = 0
      let startY = 0
      let startScrollLeft = 0
      let startScrollTop = 0

      overlay.addEventListener("mousedown", (e) => {
        if (e.target.closest("a")) return
        if (!isInsideContent(e.clientX, e.clientY)) return
        isDragging = true
        overlay.style.cursor = "grabbing"
        startX = e.clientX
        startY = e.clientY
        startScrollLeft = overlay.scrollLeft
        startScrollTop = overlay.scrollTop
        e.preventDefault()
      })

      overlay.addEventListener("mousemove", (e) => {
        if (isDragging) {
          e.preventDefault()
          overlay.scrollLeft = startScrollLeft - (e.clientX - startX)
          overlay.scrollTop = startScrollTop - (e.clientY - startY)
          return
        }
        overlay.style.cursor = isInsideContent(e.clientX, e.clientY) ? "grab" : "zoom-out"
      })

      overlay.addEventListener("mouseup", () => {
        isDragging = false
      })

      // Klick nur ausserhalb des sichtbaren Bildinhalts: Overlay schliessen
      overlay.addEventListener("click", (e) => {
        if (e.target.closest("a")) return
        if (!isInsideContent(e.clientX, e.clientY)) close()
      })

      // × Schaltfläche
      const closeBtn = document.createElement("button")
      closeBtn.textContent = "×"
      closeBtn.style.cssText = `
        position: fixed; top: 1rem; right: 1.5rem;
        background: none; border: none; font-size: 2rem;
        cursor: pointer; color: #444; line-height: 1; z-index: 10000;
      `
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        close()
      })
      overlay.appendChild(closeBtn)

      document.body.appendChild(overlay)
    })
  })
}

document.addEventListener("DOMContentLoaded", () => { setupSvgLightbox() })
document.addEventListener("nav", () => { setupSvgLightbox() })
