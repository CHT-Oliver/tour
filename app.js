import { initTransitionLayer, transitionTo, playReveal, prefersReducedMotion } from "./router/transition.js";

const DEFAULT_PLACES = [
  {
    slug: "paris",
    name_zh: "巴黎",
    name_en: "Paris",
    lat: 48.8566,
    lon: 2.3522,
    visited: true,
    date_range: "2024.04",
    tags: ["Art", "River", "Museum"],
    quote: "雨后塞纳河像被一层丝绒轻轻覆盖。",
    thoughts: [
      "清晨的巴黎像一本泛黄的摄影集，石灰色的天光与古典建筑形成极细腻的对比。步行穿过第七区时，能听见路边咖啡杯的轻响，仿佛每一次停顿都被精心编排。",
      "最喜欢的是傍晚走上桥面时的风。它带着河水与旧书页的味道，让人觉得这一刻可以被珍藏很久。",
    ],
    photos: [
      "assets/photos/paris/1.jpg",
      "assets/photos/paris/2.jpg",
      "assets/photos/paris/3.jpg",
    ],
  },
  {
    slug: "tokyo",
    name_zh: "东京",
    name_en: "Tokyo",
    lat: 35.6762,
    lon: 139.6503,
    visited: true,
    date_range: "2023.11",
    tags: ["Night", "Design", "Tea"],
    quote: "东京的夜色克制而有序，像一枚被打磨过的黑曜石。",
    thoughts: [
      "在银座停留的几天，我不断被那些极致的细节吸引：店铺的灯光刻意保持在不刺眼的亮度，展示架像是博物馆里的展台。",
      "清晨的街道几乎无声，只有电车轻轻滑过。那种秩序感令人安心，也让人更愿意慢下来。",
    ],
    photos: [
      "assets/photos/tokyo/1.jpg",
      "assets/photos/tokyo/2.jpg",
      "assets/photos/tokyo/3.jpg",
    ],
  },
  {
    slug: "shanghai",
    name_zh: "上海",
    name_en: "Shanghai",
    lat: 31.2304,
    lon: 121.4737,
    visited: true,
    date_range: "2022.06",
    tags: ["River", "Architecture", "Old Lane"],
    quote: "黄浦江的风，吹开了旧日与新梦之间的距离。",
    thoughts: [
      "在梧桐树下的巷子里，时间似乎被减慢了。老房子的窗沿与新开的咖啡馆之间有一种微妙的平衡。",
      "夜晚来到外滩，霓虹被调低亮度后显得更有层次，城市在此处变成一面铺开的画册。",
    ],
    photos: [
      "assets/photos/shanghai/1.jpg",
      "assets/photos/shanghai/2.jpg",
      "assets/photos/shanghai/3.jpg",
    ],
  },
];

initTransitionLayer();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    playReveal();
  }
});

const page = document.body.dataset.page;
if (page === "home") {
  initHome();
}
if (page === "place") {
  initPlace();
}

async function loadPlaces() {
  try {
    const res = await fetch("./data/places.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load places");
    return await res.json();
  } catch (err) {
    return DEFAULT_PLACES;
  }
}

async function initHome() {
  playReveal();
  if (!window.L) return;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const isSmall = window.matchMedia("(max-width: 900px)").matches;
  const map = L.map("map", {
    zoomControl: false,
    minZoom: 1.6,
    maxZoom: 6,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    worldCopyJump: false,
    inertia: !isCoarse,
    scrollWheelZoom: !isCoarse,
    touchZoom: true,
    doubleClickZoom: !isCoarse,
    keyboard: !isCoarse,
    preferCanvas: true,
    zoomAnimation: !isCoarse,
    fadeAnimation: !isCoarse,
    markerZoomAnimation: !isCoarse,
  }).setView([20, 10], 2);
  const bounds = L.latLngBounds([[-72, -180], [78, 180]]);
  map.setMaxBounds(bounds);
  map.options.maxBoundsViscosity = 1.0;
  map.fitBounds([[-52, -150], [68, 150]], { padding: [20, 20] });

  const zoomBox = document.getElementById("lux-zoom");
  if (zoomBox) {
    zoomBox.querySelector('[data-zoom="in"]')?.addEventListener("click", () => map.zoomIn());
    zoomBox.querySelector('[data-zoom="out"]')?.addEventListener("click", () => map.zoomOut());
  }

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
    attribution: "",
    updateWhenIdle: !isCoarse,
    updateWhenZooming: false,
    keepBuffer: isSmall ? 1 : 2,
    noWrap: true,
    bounds,
  }).addTo(map);

  const mapEl = map.getContainer();
  const setDragging = (state) => {
    mapEl.classList.toggle("is-dragging", state);
  };
  map.on("movestart", () => setDragging(true));
  map.on("moveend", () => {
    setDragging(false);
    map.panInsideBounds(bounds, { animate: false });
  });
  map.on("zoomstart", () => setDragging(true));
  map.on("zoomend", () => {
    setDragging(false);
    map.panInsideBounds(bounds, { animate: false });
  });

  const places = await loadPlaces();
  const visited = places.filter((place) => place.visited);
  const cityLabelZoom = 5;
  const countryLabelMaxZoom = 3;

  const hoverLayer = L.layerGroup().addTo(map);
  const pinLayer = L.layerGroup().addTo(map);
  const cityLabelLayer = L.layerGroup().addTo(map);
  const countryLabelLayer = L.layerGroup().addTo(map);

  const countries = new Map();
  visited.forEach((place) => {
    const countryZh = place.country_zh;
    const countryEn = place.country_en;
    if (!countryZh && !countryEn) return;
    const key = `${countryZh || ""}|${countryEn || ""}`;
    const item = countries.get(key) || { lat: 0, lon: 0, count: 0, countryZh, countryEn };
    item.lat += place.lat;
    item.lon += place.lon;
    item.count += 1;
    countries.set(key, item);
  });

  countries.forEach((item) => {
    const lat = item.lat / item.count;
    const lon = item.lon / item.count;
    const label = `${item.countryZh || ""} ${item.countryEn || ""}`.trim();
    if (!label) return;
    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: "country-label leaflet-label",
        html: label,
        iconSize: [0, 0],
      }),
      interactive: false,
    });
    countryLabelLayer.addLayer(marker);
  });

  visited.forEach((place) => {
    const marker = L.marker([place.lat, place.lon], {
      icon: L.divIcon({
        className: "",
        html: "<span class=\"map-pin\"></span>",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
      interactive: false,
    });
    pinLayer.addLayer(marker);

    const labelText = `${place.name_zh} ${place.name_en}`.trim();
    const hitWidth = Math.min(260, Math.max(160, labelText.length * 12));
    const hitHeight = 80;
    const hoverMarker = L.marker([place.lat, place.lon], {
      icon: L.divIcon({
        className: "hover-hitbox",
        html: "",
        iconSize: [hitWidth, hitHeight],
        iconAnchor: [hitWidth / 2, hitHeight / 2],
      }),
      interactive: true,
    });
    hoverLayer.addLayer(hoverMarker);

    const tooltipHtml = `
      <span class="tooltip-title">${place.name_zh}</span>
      <span class="tooltip-sub">${place.name_en}</span>
    `;

    hoverMarker.bindTooltip(tooltipHtml, {
      className: "lux-tooltip",
      direction: "top",
      offset: [0, -12],
      opacity: 1,
    });

    hoverMarker.on("click", (event) => {
      const mapRect = map.getContainer().getBoundingClientRect();
      const point = map.latLngToContainerPoint(event.latlng);
      const x = mapRect.left + point.x;
      const y = mapRect.top + point.y;
      const pinEl = marker.getElement()?.querySelector(".map-pin");
      if (pinEl && window.gsap) {
        gsap.to(pinEl, {
          scale: 1.6,
          boxShadow: "0 0 22px rgba(220, 190, 130, 0.95)",
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(pinEl, { scale: 1, duration: 0.3, ease: "power2.inOut" });
          },
        });
      }
      transitionTo(`./place.html?slug=${place.slug}`, { x, y });
    });

    const cityLabel = L.marker([place.lat, place.lon], {
      icon: L.divIcon({
        className: "city-label leaflet-label",
        html: `${place.name_zh} ${place.name_en}`,
        iconSize: [0, 0],
      }),
      interactive: false,
    });
    cityLabelLayer.addLayer(cityLabel);
  });

  const updateLabelVisibility = () => {
    const zoom = map.getZoom();
    if (zoom <= countryLabelMaxZoom) {
      if (!map.hasLayer(countryLabelLayer)) map.addLayer(countryLabelLayer);
    } else {
      if (map.hasLayer(countryLabelLayer)) map.removeLayer(countryLabelLayer);
    }

    if (zoom >= cityLabelZoom) {
      if (!map.hasLayer(cityLabelLayer)) map.addLayer(cityLabelLayer);
    } else {
      if (map.hasLayer(cityLabelLayer)) map.removeLayer(cityLabelLayer);
    }
  };

  updateLabelVisibility();
  map.on("zoomend", updateLabelVisibility);
}

async function initPlace() {
  playReveal();
  const lenis = !prefersReducedMotion && window.Lenis ? new Lenis({ smoothWheel: true, duration: 1.2 }) : null;
  if (lenis) {
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const places = await loadPlaces();
  const place = places.find((item) => item.slug === slug) || places[0];

  const titleEl = document.getElementById("place-title");
  const metaEl = document.getElementById("place-meta");
  const tagsEl = document.getElementById("place-tags");
  const quoteEl = document.getElementById("place-quote");
  const galleryEl = document.getElementById("place-gallery");
  const thoughtsEl = document.getElementById("place-thoughts");

  if (!place) {
    titleEl.textContent = "Location";
    metaEl.innerHTML = "";
    tagsEl.innerHTML = "";
    quoteEl.textContent = "";
    galleryEl.innerHTML = "";
    thoughtsEl.innerHTML = "<div class=\"notice\">未找到该地点。</div>";
    return;
  }

  document.title = `${place.name_zh} ${place.name_en} · Haotian’s Atlas`;
  titleEl.textContent = `${place.name_zh} ${place.name_en}`;
  metaEl.innerHTML = `<span>${place.date_range}</span><span>${place.name_en}</span>`;

  tagsEl.innerHTML = place.tags.map((tag) => `<span class=\"tag\">${tag}</span>`).join("");

  if (place.quote) {
    quoteEl.textContent = place.quote;
  } else {
    quoteEl.style.display = "none";
  }

  galleryEl.innerHTML = place.photos
    .map(
      (photo) => `
        <figure>
          <a href="${photo}" class="glightbox" data-gallery="${place.slug}">
            <img src="${photo}" alt="${place.name_en}" loading="lazy" />
          </a>
        </figure>
      `
    )
    .join("");

  thoughtsEl.innerHTML = place.thoughts
    .map((text, index) => `<p class=\"${index === 0 ? "dropcap" : ""}\">${text}</p>`)
    .join("");

  if (window.GLightbox) {
    GLightbox({ selector: ".glightbox", touchNavigation: true, loop: true });
  }

  setupMasonry();
  setupScrollReveal();

  // Page scroll handles gallery naturally.

  const backBtn = document.getElementById("back-to-map");
  backBtn.addEventListener("click", (event) => {
    event.preventDefault();
    transitionTo("./index.html", { x: window.innerWidth * 0.5, y: 0 });
  });

}

function setupMasonry() {
  const grid = document.querySelector(".gallery-masonry");
  if (!grid) return;
  const items = Array.from(grid.querySelectorAll("figure"));
  if (!items.length) return;
  const isNarrow = window.matchMedia("(max-width: 700px)").matches;
  if (isNarrow) {
    items.forEach((item) => {
      item.style.gridRowEnd = "auto";
    });
    return;
  }

  const getSizes = () => {
    const style = window.getComputedStyle(grid);
    const rowHeight = parseInt(style.getPropertyValue("grid-auto-rows"), 10);
    const rowGap = parseInt(style.getPropertyValue("row-gap"), 10);
    return { rowHeight, rowGap };
  };

  const layout = () => {
    const { rowHeight, rowGap } = getSizes();
    items.forEach((item) => {
      const contentHeight = item.getBoundingClientRect().height;
      const span = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
      item.style.gridRowEnd = `span ${span}`;
    });
  };

  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      layout();
      pending = false;
    });
  };

  const imgs = items.map((item) => item.querySelector("img")).filter(Boolean);
  let loaded = 0;
  imgs.forEach((img) => {
    if (img.complete) {
      loaded += 1;
      if (loaded === imgs.length) schedule();
    } else {
      img.addEventListener("load", () => {
        loaded += 1;
        if (loaded === imgs.length) schedule();
      });
      img.addEventListener("error", () => {
        loaded += 1;
        if (loaded === imgs.length) schedule();
      });
    }
  });

  window.addEventListener("resize", schedule, { passive: true });
  schedule();
}

function setupScrollReveal() {
  if (prefersReducedMotion) return;
  const targets = [
    document.querySelector(".place-hero"),
    ...document.querySelectorAll(".divider"),
    ...document.querySelectorAll(".thoughts p"),
    document.querySelector(".back-button"),
  ].filter(Boolean);

  targets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}
