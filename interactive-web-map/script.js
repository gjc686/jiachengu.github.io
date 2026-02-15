mapboxgl.accessToken =
  "pk.eyJ1IjoiZ2pjNjY2IiwiYSI6ImNta2NtcXR5YjAzMG8zZHM4NWRyeHczbHgifQ.4ZPU4lj443Hst6gkb3LqZQ";

const STYLE_URL = "mapbox://styles/gjc666/cmlmu0gra004301se2bc5b8e9";
const LAYER_ID = "1";
const APARTMENT_NAME_FIELD = "name";

// Edinburgh bounds (approx)
const EDIN_BOUNDS = [
  [-3.45, 55.86],
  [-3.05, 56.02]
];

const ROOM_TYPES_ORDERED = ["Entire home/apt", "Private room", "Shared room", "Hotel room"];
const PRICE_MIN_REASONABLE = 40;
const PRICE_MAX_REASONABLE = 1800;

const map = new mapboxgl.Map({
  container: "map",
  style: STYLE_URL
});

// Controls
map.addControl(new mapboxgl.NavigationControl(), "top-left");

map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  }),
  "top-left"
);

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  placeholder: "Search places in Edinburgh...",
  proximity: { longitude: -3.1883, latitude: 55.9533 }
});
map.addControl(geocoder, "top-left");

// Fit to Edinburgh
map.on("load", () => {
  map.fitBounds(EDIN_BOUNDS, { padding: 50, duration: 0 });
});


const roomTypeSelect = document.getElementById("roomTypeSelect");
const minSlider = document.getElementById("minPrice");
const maxSlider = document.getElementById("maxPrice");
const minLabel = document.getElementById("minPriceLabel");
const maxLabel = document.getElementById("maxPriceLabel");

const statusRoomType = document.getElementById("statusRoomType");
const statusPrice = document.getElementById("statusPrice");

function initRoomTypes() {
  roomTypeSelect.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "ALL";
  optAll.textContent = "All room types";
  roomTypeSelect.appendChild(optAll);

  ROOM_TYPES_ORDERED.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    roomTypeSelect.appendChild(opt);
  });
}

function initPriceSliders() {
  minSlider.min = String(PRICE_MIN_REASONABLE);
  minSlider.max = String(PRICE_MAX_REASONABLE);
  minSlider.step = "10";
  minSlider.value = String(PRICE_MIN_REASONABLE);

  maxSlider.min = String(PRICE_MIN_REASONABLE);
  maxSlider.max = String(PRICE_MAX_REASONABLE);
  maxSlider.step = "10";
  maxSlider.value = String(PRICE_MAX_REASONABLE);

  minLabel.innerText = "£" + PRICE_MIN_REASONABLE;
  maxLabel.innerText = "£" + PRICE_MAX_REASONABLE;
}

initRoomTypes();
initPriceSliders();

let currentRoomType = "ALL";
let minPrice = PRICE_MIN_REASONABLE;
let maxPrice = PRICE_MAX_REASONABLE;

function updateFilterStatus() {
  statusRoomType.textContent =
    currentRoomType === "ALL" ? "Room type: All" : `Room type: ${currentRoomType}`;
  statusPrice.textContent = `Price: £${minPrice}–£${maxPrice}`;
}

function clampPriceRange(lastChangedId) {
  if (minPrice > maxPrice) {
    if (lastChangedId === "minPrice") {
      maxPrice = minPrice;
      maxSlider.value = String(maxPrice);
    } else {
      minPrice = maxPrice;
      minSlider.value = String(minPrice);
    }
  }
  minLabel.innerText = "£" + minPrice;
  maxLabel.innerText = "£" + maxPrice;
}

function applyCombinedFilters() {
  const filter = ["all"];

  if (currentRoomType !== "ALL") {
    filter.push(["==", ["get", "room_type"], currentRoomType]);
  }


  filter.push([">=", ["to-number", ["get", "price"]], minPrice]);
  filter.push(["<=", ["to-number", ["get", "price"]], maxPrice]);

  map.setFilter(LAYER_ID, filter);
  updateFilterStatus();
  updateStatsFromView();
}

roomTypeSelect.addEventListener("change", (e) => {
  currentRoomType = e.target.value;
  applyCombinedFilters();
});

minSlider.addEventListener("input", (e) => {
  minPrice = Number.parseInt(e.target.value, 10);
  clampPriceRange("minPrice");
  applyCombinedFilters();
});

maxSlider.addEventListener("input", (e) => {
  maxPrice = Number.parseInt(e.target.value, 10);
  clampPriceRange("maxPrice");
  applyCombinedFilters();
});

// ===== Stats =====
function parsePrice(raw) {
  if (raw === null || raw === undefined) return null;
  const cleaned = raw.toString().replace(/[^\d.]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(raw) {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function formatGBP(n) {
  if (!Number.isFinite(n)) return "—";
  return "£" + Math.round(n).toString();
}

function updateStatsFromView() {
  const feats = map.queryRenderedFeatures({ layers: [LAYER_ID] });

  const count = feats.length;
  let priceSum = 0, priceCount = 0;
  let mnSum = 0, mnCount = 0;

  for (const f of feats) {
    const p = f.properties || {};

    const price = parsePrice(p.price);
    if (price !== null) { priceSum += price; priceCount += 1; }

    const mn = parseIntSafe(p.minimum_nights);
    if (mn !== null) { mnSum += mn; mnCount += 1; }
  }

  const avgPrice = priceCount ? (priceSum / priceCount) : null;
  const avgMinNights = mnCount ? (mnSum / mnCount) : null;

  document.getElementById("statCount").innerText = count.toString();
  document.getElementById("statAvgPrice").innerText =
    avgPrice === null ? "—" : formatGBP(avgPrice);
  document.getElementById("statAvgMinNights").innerText =
    avgMinNights === null ? "—" : Math.round(avgMinNights).toString();

  const emptyMsg = document.getElementById("emptyMessage");
  emptyMsg.style.display = (count === 0) ? "block" : "none";
}


map.on("load", () => {
  updateFilterStatus();
  applyCombinedFilters();
  map.once("idle", () => updateStatsFromView());
});


map.on("idle", () => updateStatsFromView());

// ===== Popup =====
map.on("click", (event) => {
  const features = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] });
  if (!features.length) return;

  const f = features[0];
  const p = f.properties || {};

  const name = p.name ?? "No name";
  const roomType = p.room_type ?? "NA";
  const price = p.price ?? "NA";

  const neighbourhood = p.neighbourhood_cleansed ?? p.neighbourhood ?? "NA";
  const minNights = p.minimum_nights ?? "NA";
  const availability = p.availability_365 ?? "NA";

  new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" })
    .setLngLat(f.geometry.coordinates)
    .setHTML(`
      <h3 class="apt-title">${name}</h3>

      <div class="popup-keyline">
        <span class="badge"><span class="muted">Type</span> ${roomType}</span>
        <span class="badge"><span class="muted">Price</span> ${price}</span>
      </div>

      <div class="details">
        <p><span class="label-inline">Neighbourhood:</span> <span class="value">${neighbourhood}</span></p>
        <p><span class="label-inline">Min nights:</span> <span class="value">${minNights}</span></p>
        <p><span class="label-inline">Availability (365):</span> <span class="value">${availability}</span></p>
      </div>
    `)
    .addTo(map);
});


map.on("mousemove", (e) => {
  const f = map.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
  map.getCanvas().style.cursor = f.length ? "pointer" : "";
});


function searchApartmentByName() {
  const keyword = document.getElementById("aptInput").value?.trim();
  if (!keyword) return;

  const candidates = map.queryRenderedFeatures({ layers: [LAYER_ID] });

  const hit = candidates.find((f) => {
    const n = (f.properties?.[APARTMENT_NAME_FIELD] ?? "").toString().toLowerCase();
    return n.includes(keyword.toLowerCase());
  });

  if (!hit) {
    alert("No matching apartment found in the current view. Try zooming/panning.");
    return;
  }

  map.flyTo({ center: hit.geometry.coordinates, zoom: Math.max(map.getZoom(), 14) });

  new mapboxgl.Popup({ offset: [0, -15], className: "my-popup" })
    .setLngLat(hit.geometry.coordinates)
    .setHTML(`<h3 class="apt-title">${hit.properties?.[APARTMENT_NAME_FIELD] ?? "Matched listing"}</h3>`)
    .addTo(map);
}

document.getElementById("aptSearchBtn").addEventListener("click", searchApartmentByName);
document.getElementById("aptInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchApartmentByName();
});