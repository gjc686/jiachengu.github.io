// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoiZ2pjNjY2IiwiYSI6ImNta2NtcXR5YjAzMG8zZHM4NWRyeHczbHgifQ.4ZPU4lj443Hst6gkb3LqZQ";

const style_2025 = "mapbox://styles/gjc666/cmkwjth8k000l01qxbhls8iwt";
const style_2024 = "mapbox://styles/gjc666/cmkwjvdpw002s01sb3aw854u6";

const map = new mapboxgl.Map({
  container: "map", // container ID
  style: style_2025,
  center: [-1.5, 54.714441],
  zoom: 14
});

const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");
//On click the radio button, toggle the style of the map.
for (const input of inputs) {
  input.onclick = (layer) => {
    if (layer.target.id == "style_2025") {
      map.setStyle(style_2025);
    }
    if (layer.target.id == "style_2024") {
      map.setStyle(style_2024);
    }
  };
}