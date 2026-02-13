const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initTransitionLayer() {
  if (prefersReducedMotion) return;
  if (document.querySelector(".transition-layer")) return;
  const layer = document.createElement("div");
  layer.className = "transition-layer";
  layer.innerHTML = "<div class=\"transition-sheen\"></div>";
  layer.style.setProperty("--x", "50vw");
  layer.style.setProperty("--y", "50vh");
  layer.style.setProperty("--r", "0vmax");
  document.body.appendChild(layer);
}

function setOrigin(layer, x, y) {
  const xx = typeof x === "number" ? x : window.innerWidth / 2;
  const yy = typeof y === "number" ? y : window.innerHeight / 2;
  layer.style.setProperty("--x", `${xx}px`);
  layer.style.setProperty("--y", `${yy}px`);
}

export function transitionTo(url, origin = {}) {
  if (prefersReducedMotion) {
    window.location.href = url;
    return;
  }
  const layer = document.querySelector(".transition-layer");
  if (!layer || !window.gsap) {
    window.location.href = url;
    return;
  }

  setOrigin(layer, origin.x, origin.y);
  gsap.set(layer, { opacity: 1 });
  gsap.set(layer, { "--r": "0vmax" });
  gsap.set(".transition-sheen", { opacity: 0.15, xPercent: -30 });

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete: () => {
      window.location.href = url;
    },
  });

  tl.to(layer, { "--r": "160vmax", duration: 0.95, ease: "power3.in" }, 0)
    .to(
      ".transition-sheen",
      { opacity: 0.55, xPercent: 10, duration: 0.7, ease: "power2.out" },
      0.18
    )
    .to(
      ".transition-sheen",
      { opacity: 0.2, duration: 0.5, ease: "power2.in" },
      0.6
    );
}

export function playReveal() {
  if (prefersReducedMotion) return;
  const layer = document.querySelector(".transition-layer");
  if (!layer || !window.gsap) return;
  setOrigin(layer);
  gsap.set(layer, { opacity: 1 });
  gsap.set(layer, { "--r": "160vmax" });
  gsap.set(".transition-sheen", { opacity: 0.4, xPercent: 10 });
  gsap.to(layer, {
    "--r": "0vmax",
    duration: 1.1,
    ease: "power2.out",
    onComplete: () => {
      gsap.set(layer, { opacity: 0 });
    },
  });
  gsap.to(".transition-sheen", {
    opacity: 0,
    xPercent: -25,
    duration: 1,
    ease: "power2.out",
  });
}

export { prefersReducedMotion };
