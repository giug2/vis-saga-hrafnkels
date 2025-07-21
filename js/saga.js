var primaVolta=true;
var node;
var link;
var width = 800;
var height = 500;


/* Funzione che legge i dati contenuti nel file JSON */
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


/* Funzione che carica in automatico i dati al caricamento della pagina */
window.onload = function() {
  leggiJSON();
};


/* Funzione che gestisce lo slider */
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

  // Aggiorna il valore del capitolo mostrato
  slider.addEventListener('input', function () {
    valueLabel.textContent = "Capitolo " + slider.value;
  });
});


/* Funzione per trovare la componente connessa al nodo selezionato */
function findConnectedComponent(selectedNodeId) {
  const component = new Set();
  const visited = new Set();
  const queue = [selectedNodeId];

  // Utilizza una ricerca in ampiezza per trovare tutti i nodi connessi
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


/* Funzione per verificare se un nodo appartiene a una componente specifica */
function isNodeInComponent(node, component) {
  return component.has(node.id);
}


/* Funzione che restituisce la descrizione testuale */
function readAction(nAction){
  var actionCodesObject = window.action_codes[nAction];
  var actionDescription = actionCodesObject['action description'];
  return actionDescription;
}


/* Funzione che mostra un popup informativo quando l’utente passa il mouse su un  link */
function showLinkPopup() {
  d3.selectAll(".link")
    .on("mouseover", function(d) {
      // Rimuove eventuali popup esistenti
      d3.select(".popup").remove();

      // Ottiene coordinate del mouse
      var mouseX = d3.event.pageX;
      var mouseY = d3.event.pageY;

      // Ottiene la descrizione dell’azione
      var actionDescription = readAction(d.action);

      // Crea il popup
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


/* Funzione che mostra un popup informativo quando l’utente passa il mouse su un nodo 
   Inoltre evidenzia solo i link e nodi connessi al nodo su cui si passa il mouse */
function showNode() {
  d3.selectAll(".node")
    .on("mouseover", function(d) {
      // Evidenzia nodi e link connessi
      d3.selectAll(".node")
        .style("opacity", function(o) {
          return isConnected(d, o) ? 1 : 0.1;
        });

      d3.selectAll(".link")
        .style("opacity", function(o) {
          return (o.source.id === d.id || o.target.id === d.id) ? 1 : 0.05;
        });

      // Crea il popup
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

      popup.append("h2")
        .text(d.label + " [" + d.id + "]");

      if (d.chapter !== undefined) {
        popup.append("p").text("Chapter: " + d.chapter);
      }

      if (d.page !== undefined) {
        popup.append("p").text("Page: " + d.page);
      }

      var genderCodesObject = window.gender_codes[d.gender];
      var genderDescription = genderCodesObject ? genderCodesObject['gender description'] : "N/A";
      var genderSymbol = d.gender === 1 ? "\u2642" : (d.gender === 0 ? "\u2640" : "\u26A7");

      popup.append("p").text("Gender: " + genderDescription + " " + genderSymbol);
    })
    .on("mouseout", function(d) {
      d3.select(".popup").remove();

      // Ripristina opacità normale
      d3.selectAll(".node").style("opacity", 1);
      d3.selectAll(".link").style("opacity", 1);
    });
}


/* Funzione di ausilio per capire se due nodi sono connessi tra loro */
function isConnected(a, b) {
  return window.links.some(function(l) {
    return (l.source.id === a.id && l.target.id === b.id) ||
           (l.source.id === b.id && l.target.id === a.id);
  }) || a.id === b.id;
}


/* Funzione che restituisce il colore degli archi in base al tipo di relazione che unisce i due nodi */
function getColorByAction(action) {
  const code = window.action_codes[action];
  if (!code) return "#ff00d0d1"; // fallback se l'action non esiste

  if (code.isFamily === 1) {
    return "#ffd500ff"; // parentela
  }

  switch (parseInt(code.hostilityLevel)) {
    case 0: return "#6a6565ff"; // neutra o cooperativa
    case 1: return "#366e38ff"; // lievemente positiva / neutra
    case 2: return "#6b1515ff"; // ostile
    case 3: return "#2c0101ff"; // molto ostile
    default: return "#ff00d0d1"; // fallback
  }
}


/* Funzione per visualizzare il grafo */
function draw() {
  document.getElementById("check-span").classList.remove("hidden"); 
  document.getElementById("legendContainer").classList.remove("hidden"); 
  document.getElementById("graph-container").classList.remove("hidden");
  // Parametri del layout force-directed
  var charge = -120;
  var linkDistance = 120;
  var gravity = 0.1;
  var linkStrength = 1;
  var friction = 0.9;
  var theta = 0.8;
  var alpha = 0.1;
  var chargeDistance = 1000;

  var chapterSlider = document.getElementById("chapter-slider");

  // Inizializzazione del layout force-directed di D3
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

  // Rimuove i nodi e i link esistenti se non è la prima volta
  if (!primaVolta) {
    node.remove();
    link.remove();
  }

  // Seleziona l'SVG e imposta dimensioni
  svg = d3.select("#graphSVG")
    .attr("width", width)
    .attr("height", height);

  nodi = window.nodes;
  links = window.links;

  if (primaVolta === true) {
    // Corregge gli indici dei link (probabilmente partono da 1)
    links.forEach(function(link) {
      link.source = link.source - 1;
      link.target = link.target - 1;
    });
  }

  primaVolta = false;

  // Se è selezionato il checkbox per il grafo filtrato per capitolo
  if (document.getElementById("myCheckbox").checked) {
    var nodiCapitolo = [];

    // Filtra i nodi per capitolo selezionato
    for (var i = 0; i < nodi.length; i++) {
      var appartenenza = nodi[i].chapter <= parseInt(chapterSlider.value);
      if (appartenenza) nodiCapitolo.push(nodi[i].id);
    }

    // Disegna solo i link i cui nodi estremi sono inclusi nei nodi filtrati
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

    // Disegna i nodi filtrati
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
        if (d.gender === 1) return "#214b9fff";     // blu
        if (d.gender === 0) return "#990f0fff";   // rosso
          return "#0e770eff";                              // verde per neutro o mancante
      })
      .call(force.drag);
  } else {
    
    // Disegna il grafo completo (nessun filtro per capitolo)
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
        if (d.gender === 1) return "#214b9fff";     // blu
        if (d.gender === 0) return "#990f0fff";   // rosso
          return "#0e770eff";                              // verde per neutro o mancante
      })
      .call(force.drag);
  }

  // Avvia il layout force-directed
  force.nodes(nodi)
    .links(links)
    .start();

  // Aggiorna posizioni dei nodi e dei link a ogni "tick"
  force.on("tick", function() {
    link.attr("d", function(d) {
      const x1 = d.source.x;
      const y1 = d.source.y;
      const x2 = d.target.x;
      const y2 = d.target.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // raggio per curva
      return `M${x1},${y1} A${dr},${dr} 0 0,1 ${x2},${y2}`;
      });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });

  // Dopo un breve delay, abilita tooltip e info su nodi e link
  setTimeout(function() {
    showNode();
    showLinkPopup();
  }, 2500);
}

 
/* Funzione che al caricamento della pagina disattiva tutte le funzioni attivate */
window.addEventListener("beforeunload", function(event) {
  document.getElementById("drawButton").disabled = true;
  document.getElementById("myCheckbox").checked = false;
  document.getElementById("check-span").classList.add('hidden');
});

