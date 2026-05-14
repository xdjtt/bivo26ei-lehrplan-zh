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