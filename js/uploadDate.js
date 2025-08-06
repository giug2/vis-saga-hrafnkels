var nodes = [];
var links = [];
var action_codes = {};
var gender_codes = {};

/*
* Funzione per la lettura dei dati al load della pagina
*/
function leggiJSON() {
  return fetch('dataset/hrafnkel_saga_network.json')
    .then(response => response.json())
    .then(data => {
      nodes = data.nodes;
      links = data.links;
      action_codes = data.action_codes;
      gender_codes = data.gender_codes;
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
