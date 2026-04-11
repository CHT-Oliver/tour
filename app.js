import { initTransitionLayer, transitionTo, playReveal, prefersReducedMotion } from "./router/transition.js";

const PLACE_GALLERY_BATCH_SIZE = 8;

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
    const res = await fetch("./data/places.json");
    if (!res.ok) throw new Error("Failed to load places");
    return await res.json();
  } catch (err) {
    return DEFAULT_PLACES;
  }
}

async function initHome() {
  playReveal();
  const bootMap = () => {
    void mountHomeMap();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(bootMap, { timeout: 800 });
  } else {
    window.setTimeout(bootMap, 96);
  }
}

async function mountHomeMap() {
  if (!window.L) return;
  const showTextLabels = window.innerWidth > 900;
  const initialCenter = [35.0, 104.0];
  const initialZoom = 4.0;
  const map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
    minZoom: 1.2,
    maxZoom: 12,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    worldCopyJump: false,
    inertia: true,
    scrollWheelZoom: true,
    touchZoom: true,
    doubleClickZoom: true,
    keyboard: true,
    preferCanvas: false,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    bounceAtZoomLimits: false,
  }).setView(initialCenter, initialZoom);
  const bounds = L.latLngBounds([[-85.0511, -180], [85.0511, 180]]);
  map.setMaxBounds(bounds);
  map.options.maxBoundsViscosity = 1.0;
  map.setView(initialCenter, initialZoom, { animate: false });

  const zoomBox = document.getElementById("lux-zoom");
  if (zoomBox) {
    zoomBox.querySelector('[data-zoom="in"]')?.addEventListener("click", () => map.zoomIn());
    zoomBox.querySelector('[data-zoom="out"]')?.addEventListener("click", () => map.zoomOut());
  }

  const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
  const primaryTiles = L.tileLayer(tileUrl, {
    attribution: "",
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 1,
    updateInterval: 150,
    detectRetina: false,
    maxNativeZoom: 19,
    noWrap: true,
    bounds,
  }).addTo(map);

  // Fallback on unstable mobile networks to avoid blank tile patches.
  let switchedToFallback = false;
  const fallbackTiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "",
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
    updateInterval: 150,
    detectRetina: false,
    maxNativeZoom: 19,
    noWrap: true,
    bounds,
  });

  primaryTiles.on("tileerror", () => {
    if (switchedToFallback) return;
    switchedToFallback = true;
    if (map.hasLayer(primaryTiles)) {
      map.removeLayer(primaryTiles);
    }
    fallbackTiles.addTo(map);
  });

  // Mobile browsers can report wrong map size during URL bar transitions.
  const syncMapSize = () => map.invalidateSize({ pan: false, animate: false });
  setTimeout(syncMapSize, 120);
  window.addEventListener("resize", syncMapSize, { passive: true });
  window.addEventListener(
    "orientationchange",
    () => setTimeout(syncMapSize, 220),
    { passive: true }
  );

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
  const showCountryLabels = false;

  const hoverLayer = L.layerGroup().addTo(map);
  const pinLayer = L.layerGroup().addTo(map);
  const cityLabelLayer = L.layerGroup();
  const countryLabelLayer = L.layerGroup();
  if (showTextLabels) {
    cityLabelLayer.addTo(map);
    countryLabelLayer.addTo(map);
  }

  // Country labels are intentionally disabled by request.

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

    if (showTextLabels) {
      const cityLabel = L.marker([place.lat, place.lon], {
        icon: L.divIcon({
          className: "city-label leaflet-label",
          html: `${place.name_zh} ${place.name_en}`,
          iconSize: [0, 0],
        }),
        interactive: false,
      });
      cityLabelLayer.addLayer(cityLabel);
    }
  });

  const updateLabelVisibility = () => {
    if (!showTextLabels) return;
    const zoom = map.getZoom();
    if (showCountryLabels && zoom <= countryLabelMaxZoom) {
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

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const places = await loadPlaces();
  const place = places.find((item) => item.slug === slug) || places[0];

  const titleEl = document.getElementById("place-title");
  const metaEl = document.getElementById("place-meta");
  const tagsEl = document.getElementById("place-tags");
  const quoteEl = document.getElementById("place-quote");
  const galleryEl = document.getElementById("place-gallery");
  const galleryControlsEl = document.getElementById("gallery-controls");
  const thoughtsEl = document.getElementById("place-thoughts");

  if (!place) {
    titleEl.textContent = "Location";
    metaEl.innerHTML = "";
    tagsEl.innerHTML = "";
    quoteEl.textContent = "";
    galleryEl.innerHTML = "";
    galleryControlsEl.innerHTML = "";
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

  galleryEl.innerHTML = "";
  galleryControlsEl.innerHTML = "";

  const markFigureLoaded = (img) => {
    img.closest("figure")?.classList.add("is-loaded");
  };

  let lightbox = null;
  const syncLightbox = () => {
    if (!window.GLightbox) return;
    lightbox?.destroy?.();
    lightbox = GLightbox({ selector: ".glightbox", touchNavigation: true, loop: true });
  };

  let renderedPhotos = 0;
  const updateGalleryControls = () => {
    galleryControlsEl.innerHTML = "";
    const progress = document.createElement("div");
    progress.className = "gallery-progress";
    progress.textContent = `${renderedPhotos} / ${place.photos.length} photos`;
    galleryControlsEl.appendChild(progress);

    if (renderedPhotos >= place.photos.length) return;

    const remaining = place.photos.length - renderedPhotos;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "load-more-button";
    button.textContent = `Load ${Math.min(PLACE_GALLERY_BATCH_SIZE, remaining)} More Photos`;
    button.addEventListener("click", renderNextBatch);
    galleryControlsEl.appendChild(button);
  };

  const renderNextBatch = () => {
    const nextPhotos = place.photos.slice(renderedPhotos, renderedPhotos + PLACE_GALLERY_BATCH_SIZE);
    const fragment = document.createDocumentFragment();

    nextPhotos.forEach((photo, index) => {
      const absoluteIndex = renderedPhotos + index;
      const figure = document.createElement("figure");
      const link = document.createElement("a");
      const img = document.createElement("img");

      link.href = photo;
      link.className = "glightbox";
      link.dataset.gallery = place.slug;

      img.src = photo;
      img.alt = place.name_en;
      img.loading = absoluteIndex === 0 ? "eager" : "lazy";
      img.fetchPriority = absoluteIndex === 0 ? "high" : "low";
      img.decoding = "async";
      img.draggable = false;

      link.appendChild(img);
      figure.appendChild(link);

      if (img.complete) {
        markFigureLoaded(img);
      } else {
        img.addEventListener("load", () => markFigureLoaded(img), { once: true });
        img.addEventListener("error", () => markFigureLoaded(img), { once: true });
      }

      fragment.appendChild(figure);
    });

    galleryEl.appendChild(fragment);
    renderedPhotos += nextPhotos.length;
    updateGalleryControls();
    syncLightbox();
  };

  if (!place.photos.length) {
    galleryEl.innerHTML = "<div class=\"notice\">暂无照片。</div>";
  } else {
    renderNextBatch();
  }

  thoughtsEl.innerHTML = place.thoughts
    .map((text, index) => `<p class=\"${index === 0 ? "dropcap" : ""}\">${text}</p>`)
    .join("");
  setupScrollReveal();

  // Page scroll handles gallery naturally.

  const backBtn = document.getElementById("back-to-map");
  backBtn.addEventListener("click", (event) => {
    event.preventDefault();
    transitionTo("./index.html", { x: window.innerWidth * 0.5, y: 0 });
  });

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
