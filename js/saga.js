// Variabili globali
var primaVolta = true; // Indica se è il primo disegno del grafo
var node;              
var link;              
var width = 800;       // Larghezza SVG
var height = 500;      // Altezza SVG

/* 
 * Funzione che legge il file JSON locale.
 * Abilita il pulsante per disegnare il grafo.
 */
function leggiJSON() {
  fetch('dataset/hrafnkel_saga_network.json')
    .then(response => response.json())
    .then(data => {
      window.nodes = data.nodes;
      window.links = data.links;
      window.action_codes = data.action_codes;
      window.gender_codes = data.gender_codes;

      document.getElementById("drawButton").disabled = false;
      document.getElementById("loadFileFromClient").disabled = true;
    })
    .catch(error => {
      console.log('Si è verificato un errore:', error);
    });
}

/* 
 * Funzione che viene eseguita al caricamento della pagina.
 * Chiama automaticamente la funzione per leggere il JSON.
 */
window.onload = function() {
  leggiJSON();
};

/* 
 * Gestione dinamica dello slider e della sua visibilità.
 * Se il checkbox è attivo, mostra lo slider per selezionare il capitolo.
 */
window.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById("myCheckbox");
  const sliderContainer = document.getElementById("slider-container");
  const slider = document.getElementById("chapter-slider");
  const valueLabel = document.getElementById("chapter-value");

  checkbox.addEventListener('change', function () {
    if (checkbox.checked) {
      sliderContainer.classList.remove('hidden');
    } else {
      sliderContainer.classList.add('hidden');
    }
  });

  slider.addEventListener('input', function () {
    valueLabel.textContent = "Capitolo " + slider.value;
  });
});

/* 
 * Funzione per trovare la componente connessa che contiene un certo nodo.
 * Usa BFS per esplorare solo i link con action ≤ 2.
 */
function findConnectedComponent(selectedNodeId) {
  const component = new Set();
  const visited = new Set();
  const queue = [selectedNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    component.add(nodeId);
    visited.add(nodeId);

    window.links.forEach(function(link) {
      if (parseInt(link.action) <= 2) {
        const sourceId = link.source.id;
        const targetId = link.target.id;

        if (sourceId === nodeId && !visited.has(targetId)) {
          queue.push(targetId);
          visited.add(targetId);
        } else if (targetId === nodeId && !visited.has(sourceId)) {
          queue.push(sourceId);
          visited.add(sourceId);
        }
      }
    });
  }

  return component;
}

/* 
 * Funzione che verifica se un nodo appartiene a una data componente connessa.
 */
function isNodeInComponent(node, component) {
  return component.has(node.id);
}

/* 
 * Funzione che restituisce la descrizione testuale di un tipo di azione.
 */
function readAction(nAction) {
  var actionCodesObject = window.action_codes[nAction];
  var actionDescription = actionCodesObject['action description'];
  return actionDescription;
}

/* 
 * Mostra un popup informativo quando si passa il mouse su un link.
 * Il popup mostra la relazione tra i due personaggi.
 */
function showLinkPopup() {
  d3.selectAll(".link")
    .on("mouseover", function(d) {
      d3.select(".popup").remove();

      var mouseX = d3.event.pageX;
      var mouseY = d3.event.pageY;
      var actionDescription = readAction(d.action);

      var popup = d3.select("body")
        .append("div")
        .attr("class", "popup")
        .style("position", "absolute")
        .style("left", (mouseX + 10) + "px")
        .style("top", (mouseY + 10) + "px")
        .style("background-color", "rgba(255,255,255,0.95)")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.3)");

      popup.append("p").text(d.source.label + " " + actionDescription + " " + d.target.label);
    })
    .on("mouseout", function() {
      d3.select(".popup").remove();
    });
}

/* 
 * Mostra un popup e evidenzia i nodi e link connessi quando si passa il mouse su un nodo.
 */
function showNode() {
  d3.selectAll(".node")
    .on("mouseover", function(d) {
      d3.selectAll(".node")
        .style("opacity", function(o) {
          return isConnected(d, o) ? 1 : 0.1;
        });

      d3.selectAll(".link")
        .style("opacity", function(o) {
          return (o.source.id === d.id || o.target.id === d.id) ? 1 : 0.05;
        });

      var mouseX = d3.event.pageX;
      var mouseY = d3.event.pageY;

      var popup = d3.select("body")
        .append("div")
        .attr("class", "popup")
        .style("position", "absolute")
        .style("left", (mouseX + 10) + "px")
        .style("top", (mouseY + 10) + "px")
        .style("background-color", "rgba(255,255,255,0.95)")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.3)");

      popup.append("h2").text(d.label + " [" + d.id + "]");

      if (d.chapter !== undefined) popup.append("p").text("Chapter: " + d.chapter);
      if (d.page !== undefined) popup.append("p").text("Page: " + d.page);

      var genderCodesObject = window.gender_codes[d.gender];
      var genderDescription = genderCodesObject ? genderCodesObject['gender description'] : "N/A";
      var genderSymbol = d.gender === 1 ? "\u2642" : (d.gender === 0 ? "\u2640" : "\u26A7");

      popup.append("p").text("Gender: " + genderDescription + " " + genderSymbol);
    })
    .on("mouseout", function() {
      d3.select(".popup").remove();
      d3.selectAll(".node").style("opacity", 1);
      d3.selectAll(".link").style("opacity", 1);
    });
}

/* 
 * Verifica se due nodi sono direttamente connessi.
 */
function isConnected(a, b) {
  return window.links.some(function(l) {
    return (l.source.id === a.id && l.target.id === b.id) ||
           (l.source.id === b.id && l.target.id === a.id);
  }) || a.id === b.id;
}

/* 
 * Restituisce un colore per un arco in base al tipo di relazione:
 */
function getColorByAction(action) {
  const code = window.action_codes[action];
  if (!code) return "#ff00d0d1";

  if (code.isFamily === 1) return "#ffd500ff";

  switch (parseInt(code.hostilityLevel)) {
    case 0: return "#6a6565ff";
    case 1: return "#366e38ff";
    case 2: return "#6b1515ff";
    case 3: return "#2c0101ff";
    default: return "#ff00d0d1";
  }
}

/* 
 * Disegna il grafo nella pagina, usando un layout force-directed.
 * Supporta filtro per capitolo tramite checkbox e slider.
 */
function draw() {
  document.getElementById("check-span").classList.remove("hidden");
  document.getElementById("legendContainer").classList.remove("hidden");
  document.getElementById("graph-container").classList.remove("hidden");

  // Parametri per forza fisica del grafo
  var charge = -120;
  var linkDistance = 120;
  var gravity = 0.1;
  var linkStrength = 1;
  var friction = 0.9;
  var theta = 0.8;
  var alpha = 0.1;
  var chargeDistance = 1000;

  var chapterSlider = document.getElementById("chapter-slider");

  // Inizializza layout force-directed
  force = d3.layout.force()
    .charge(charge)
    .linkDistance(linkDistance)
    .gravity(gravity)
    .friction(friction)
    .linkStrength(linkStrength)
    .alpha(alpha)
    .theta(theta)
    .chargeDistance(chargeDistance)
    .size([width, height]);

  // Rimuove nodi e link precedenti
  if (!primaVolta) {
    node.remove();
    link.remove();
  }

  svg = d3.select("#graphSVG").attr("width", width).attr("height", height);

  nodi = window.nodes;
  links = window.links;

  if (primaVolta === true) {
    links.forEach(function(link) {
      link.source = link.source - 1;
      link.target = link.target - 1;
    });
  }

  primaVolta = false;

  // Filtro per capitolo
  if (document.getElementById("myCheckbox").checked) {
    var nodiCapitolo = [];
    for (var i = 0; i < nodi.length; i++) {
      if (nodi[i].chapter <= parseInt(chapterSlider.value)) {
        nodiCapitolo.push(nodi[i].id);
      }
    }

    link = svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .filter(function(d) {
        return nodiCapitolo.includes(d.source.id) &&
               nodiCapitolo.includes(d.target.id);
      })
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke-width", 4)
      .attr("stroke", function(d) {
        return getColorByAction(d.action);
      });

    node = svg.selectAll(".node")
      .data(nodi)
      .enter().append("circle")
      .filter(function(d) {
        return nodiCapitolo.includes(d.id);
      })
      .attr("class", "node")
      .attr("r", function(d) {
        return (d.chapter === parseInt(chapterSlider.value)) ? 12 : 10;
      })
      .style("fill", d => {
        if (d.gender === 1) return "#214b9fff";
        if (d.gender === 0) return "#990f0fff";
        return "#0e770eff";
      })
      .call(force.drag);
  } else {
    // Disegna grafo completo
    link = svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke-width", 3)
      .attr("stroke", function(d) {
        return getColorByAction(d.action);
      });

    node = svg.selectAll(".node")
      .data(nodi)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 10)
      .style("fill", d => {
        if (d.gender === 1) return "#214b9fff";
        if (d.gender === 0) return "#990f0fff";
        return "#0e770eff";
      })
      .call(force.drag);
  }

  // Simulazione
  force.nodes(nodi).links(links).start();

  force.on("tick", function() {
    link.attr("d", function(d) {
      const x1 = d.source.x;
      const y1 = d.source.y;
      const x2 = d.target.x;
      const y2 = d.target.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
      return `M${x1},${y1} A${dr},${dr} 0 0,1 ${x2},${y2}`;
    });

    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });

  // Mostra info dopo piccolo delay
  setTimeout(function() {
    showNode();
    showLinkPopup();
  }, 2500);
}

/* 
 * Funzione che disattiva interfaccia interattiva prima che l’utente lasci la pagina.
 */
window.addEventListener("beforeunload", function(event) {
  document.getElementById("drawButton").disabled = true;
  document.getElementById("myCheckbox").checked = false;
  document.getElementById("check-span").classList.add('hidden');
});
