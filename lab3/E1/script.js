// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoiZ2pjNjY2IiwiYSI6ImNta2NtcXR5YjAzMG8zZHM4NWRyeHczbHgifQ.4ZPU4lj443Hst6gkb3LqZQ";
//Before map
const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/gjc666/cmkwjvdpw002s01sb3aw854u6",
  center: [-1.3932, 54.784441],
  zoom: 14
});
//After map
const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/gjc666/cmkwjth8k000l01qxbhls8iwt",
  center: [-1.3932, 54.784441],
  zoom: 14
});
const container = "#comparison-container";
const map = new mapboxgl.Compare(beforeMap, afterMap, container, {});