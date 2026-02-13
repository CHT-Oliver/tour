const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initTransitionLayer() {
  if (prefersReducedMotion) return;
  if (document.querySelector(".transition-layer")) return;
  const layer = document.createElement("div");
  layer.className = "transition-layer";
  layer.innerHTML = "<div class=\"transition-sheen\"></div><div class=\"transition-veil\"></div><div class=\"transition-dust\"></div><div class=\"transition-glint\"></div><div class=\"transition-orbit\"></div>";
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
  gsap.set(".transition-veil", { opacity: 0.0 });
  gsap.set(".transition-dust", { opacity: 0.0, scale: 1.05 });
  gsap.set(".transition-glint", { opacity: 0.0, rotation: -6, scale: 1.05 });
  gsap.set(".transition-orbit", { opacity: 0.0, scale: 0.9 });

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
      ".transition-veil",
      { opacity: 0.6, duration: 0.55, ease: "power1.inOut" },
      0.12
    )
    .to(
      ".transition-dust",
      { opacity: 0.22, scale: 1, duration: 0.7, ease: "power2.out" },
      0.2
    )
    .to(
      ".transition-glint",
      { opacity: 0.6, rotation: 2, scale: 1, duration: 0.6, ease: "power2.out" },
      0.16
    )
    .to(
      ".transition-orbit",
      { opacity: 0.35, scale: 1.02, duration: 0.8, ease: "power2.out" },
      0.22
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
  gsap.set(".transition-veil", { opacity: 0.55 });
  gsap.set(".transition-dust", { opacity: 0.18, scale: 1 });
  gsap.set(".transition-glint", { opacity: 0.5, rotation: 4, scale: 1 });
  gsap.set(".transition-orbit", { opacity: 0.25, scale: 1.01 });
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
  gsap.to(".transition-veil", {
    opacity: 0,
    duration: 1,
    ease: "power2.out",
  });
  gsap.to(".transition-dust", {
    opacity: 0,
    scale: 1.02,
    duration: 1,
    ease: "power2.out",
  });
  gsap.to(".transition-glint", {
    opacity: 0,
    rotation: -6,
    duration: 0.9,
    ease: "power2.out",
  });
  gsap.to(".transition-orbit", {
    opacity: 0,
    scale: 0.98,
    duration: 0.9,
    ease: "power2.out",
  });
}

export { prefersReducedMotion };
