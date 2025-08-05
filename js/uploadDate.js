var nodes = [];
var links = [];
var action_codes = {};
var gender_codes = {};

function leggiJSON() {
  return fetch('dataset/hrafnkel_saga_network.json')
    .then(response => response.json())
    .then(data => {
      nodes = data.nodes;
      links = data.links;
      action_codes = data.action_codes;
      gender_codes = data.gender_codes;
      console.log("Dati caricati");
    })
    .catch(error => {
      console.error('Errore nel caricamento JSON:', error);
    });
}

window.onload = function () {
  leggiJSON().then(() => {
    drawTimeline();
  });
};
