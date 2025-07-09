var primaVolta=true;
var svg = null;
var force = null;
var node;
var link;
var nodi = [];
var links =[];
var width = 900;
var height = 600;
var color = d3.scale.category10();



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
      //document.getElementById("updateButton").disabled = false;
      //document.getElementById("check-span").classList.remove('hidden');
    })
    .catch(error => {
      console.log('Si è verificato un errore:', error);
    });
}

/* Funzione che carica in automatico i dati al caricamento della pagina */
window.onload = function() {
  leggiJSON();
};

window.addEventListener('DOMContentLoaded', function() {
  const chapterSelect = document.getElementById("chapter-select");
  const checkbox = document.getElementById("myCheckbox");

  checkbox.addEventListener('change', function() {
    if (checkbox.checked) {
      chapterSelect.classList.remove('hidden');
    } else {
      chapterSelect.classList.add('hidden');
    }
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


/* Funzione che disegna i nodi del grafo gerarchico nel SVG */
function drawNodes(svg, data, selectedNodeId) {
  const spanY = 100;

  // Crea un gruppo separato per i link 
  const linksGroup = svg.append("g")
    .attr("id", "linksGroup");

  // Crea un gruppo <g> per ciascun array di nodi nel dataset
  const groups = svg.selectAll("g")
    .filter(function () {
      return this.getAttribute("id") !== "linksGroup";
    })
    .data(data)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(40, ${i * spanY})`)
    .attr("y", (d, i) => i * spanY);

  // Aggiunge i cerchi dei nodi all'interno di ciascun gruppo
  const nodes = groups.selectAll("circle")
    .data(d => d)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", function (d) {
      return d.id === selectedNodeId ? 8 : 5;
    })
    .attr("id", d => d.id)
    .style("fill", d => color(d.gender))
    .attr("cx", (d, i) => i * 50 + 50)
    .attr("cy", spanY / 2);

  // Calcola la posizione assoluta dei nodi e la memorizza in d.tx / d.ty
  data.flat().forEach((d) => {
    const nodeEl = document.getElementById(d.id);
    const parentY = parseInt(nodeEl.parentNode.getAttribute('y'));
    const cy = parseInt(nodeEl.getAttribute('cy'));
    const cx = parseInt(nodeEl.getAttribute('cx'));

    d.tx = cx;
    d.ty = cy + parentY;
  });
}


/* Funzione che disegna gli archi del grafo gerarchico nel SVG */
function drawEdges(svg, filteredLinks) {
  filteredLinks.forEach(function(l) {
    var x1 = parseInt(document.getElementById(l.source.id).getAttribute('cx')) + 40;
    var y1 = parseInt(document.getElementById(l.source.id).getAttribute('cy')) +
             parseInt(document.getElementById(l.source.id).parentNode.getAttribute('y'));
    var x2 = parseInt(document.getElementById(l.target.id).getAttribute('cx')) + 40;
    var y2 = parseInt(document.getElementById(l.target.id).getAttribute('cy')) +
             parseInt(document.getElementById(l.target.id).parentNode.getAttribute('y'));

    svg.select("#linksGroup")
      .append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('etichetta', l.source.label + " " + readAction(l.action) + " " + l.target.label)
      .style("stroke-width", 3)
      .style("stroke", "#828282");
  });

  d3.selectAll("line").attr("order", -1);
}

/* Funzione che restituisce la descrizione testuale */
function readAction(nAction){
  var actionCodesObject = window.action_codes[nAction];
  var actionDescription = actionCodesObject['action description'];
  return actionDescription;
}


/* Funzione che crea l'albero gerarchico a partire da un nodo selezionato */
function createTree(filteredNodes, filteredLinks, selectedNodeId) {
  allNodes = [];
  spanY = 100;
  levelLinks = [];
  svg = d3.select("#treeSVG");
  
  descents = filteredLinks.filter(function(l) {
    return parseInt(l.action) == 1;
  });
  
  pairs = filteredLinks.filter(function(l) {
    return parseInt(l.action) == 2;
  });

  while (filteredNodes.length != 0) {
    let levelNodes = [];
    for (let i = 0; i < filteredNodes.length; i++) {
      let flag = true;
      for (let j = 0; j < descents.length; j++) {
        if (descents[j].source == filteredNodes[i]) {
          flag = false;
          break;
        }  
      }
      if (flag == true) {
        levelNodes.push(filteredNodes[i]);
        filteredNodes.splice(i, 1);
        i--;
      }
    }
    
    for (let i = 0; i < levelNodes.length; i++) {
      var risultato = true;
      for (let j = 0; j < pairs.length; j++) {
        if (pairs[j].source == levelNodes[i]) {
          risultato = levelNodes.includes(pairs[j].target);
          break;
        } else if (pairs[j].target == levelNodes[i]) {
          risultato = levelNodes.includes(pairs[j].source);
          break;
        }
      }
      if (risultato == false) {
        filteredNodes.push(levelNodes[i]);
        levelNodes.splice(i, 1);
        i--;
      }
    }
    
    allNodes.push(levelNodes);
    levelLinks = [];
    
    for (let i = 0; i < descents.length; i++) {
      for (let j = 0; j < levelNodes.length; j++) {
        if (descents[i].target == levelNodes[j]) {
          levelLinks.push(descents[i]);
          descents.splice(i, 1);
          i--;
          break;
        }
      }
    }
  }
  drawNodes(svg, allNodes, selectedNodeId);
  drawEdges(svg, filteredLinks);
  showNode();
  showLinkForTree();
}


/* Funzione che aggiunge la descrizione testuale agli archi del grafo */
function showLink() {
  d3.selectAll(".link")
    .on("mouseover", function(d) {
      var actionCodesObject = window.action_codes[d.action];
      var actionDescription = actionCodesObject['action description'];
      d3.select("#link-info")
        .text(d.source.label + " " + actionDescription + " " + d.target.label)
        .style("visibility", "visible")
        .style("font-size", "25px");
    })
    .on("mouseout", function() {
      d3.select("#link-info").style("visibility", "hidden");
    });
}


/* Funzione che aggiunge la descrizione testuale agli archi dell'albero */
function showLinkForTree() {
  var lines = d3.selectAll("svg#treeSVG line");
  var linesOfInterest = lines[0];
  d3.selectAll(linesOfInterest)
    .on("mouseover", function(d) {
      var etichetta = d3.select(this).attr('etichetta');
      d3.select("#link-info")
        .text(etichetta)
        .style("visibility", "visible")
        .style("font-size", "25px");
    })
    .on("mouseout", function() {
      d3.select("#link-info").style("visibility", "hidden");
    });
}


/* Funzione che mostra un popup informativo quando l’utente passa il mouse su un nodo */
function showNode() {
  d3.selectAll(".node")
    .on("mouseover", function(d) {
      var popup = d3.select("body")
        .append("div")
        .attr("class", "popup")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px");

      popup.append("h2")
        .text(d.label + "[" + d.id + "]");

      if (d.chapter !== undefined) {
        popup.append("p")
          .text("Chapter: " + d.chapter);
      }

      var genderCodesObject = window.gender_codes[d.gender];
      var genderDescription = genderCodesObject['gender description'];

      if (d.gender !== undefined) {
        popup.append("p")
          .text("Gender: " + genderDescription);
      }
    })
    .on("mouseout", function(d) {
      d3.select(".popup").remove();
    });
}


/* Funzione per visualizzare il grafo */
function draw() {
  // Parametri del layout force-directed
  var charge = -120;
  var linkDistance = 120;
  var gravity = 0.1;
  var linkStrength = 1;
  var friction = 0.9;
  var theta = 0.8;
  var alpha = 0.1;
  var chargeDistance = 1000;

  var chapterSelect = document.getElementById("chapter-select");
  showNodeOK = false;

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

    // Mostra l'interfaccia principale, nasconde l'intro
    d3.selectAll(".intro").classed("hidden", true);
    d3.selectAll(".main").classed("hidden", false);
    d3.select("#treeSVG")
      .classed("hidden", false)
      .attr("width", 300)
      .attr("height", 600);
  }

  primaVolta = false;

  // Se è selezionato il checkbox per il grafo filtrato per capitolo
  if (document.getElementById("myCheckbox").checked) {
    var nodiCapitolo = [];

    // Filtra i nodi per capitolo selezionato
    for (var i = 0; i < nodi.length; i++) {
      var appartenenza = nodi[i].chapter <= parseInt(chapterSelect.value);
      if (appartenenza) nodiCapitolo.push(nodi[i].id);
    }

    // Disegna solo i link i cui nodi estremi sono inclusi nei nodi filtrati
    link = svg.selectAll(".link")
      .data(links)
      .enter().append("line")
      .filter(function(d) {
        return nodiCapitolo.includes(d.source.id) &&
               nodiCapitolo.includes(d.target.id);
      })
      .attr("class", "link")
      .style("stroke-width", 4)
      .style("stroke", "#828282");

    // Disegna i nodi filtrati
    node = svg.selectAll(".node")
      .data(nodi)
      .enter().append("circle")
      .filter(function(d) {
        return nodiCapitolo.includes(d.id);
      })
      .attr("class", "node")
      .attr("r", function(d) {
        return (d.chapter === parseInt(chapterSelect.value)) ? 8 : 5;
      })
      .style("fill", function(d) {
        return color(d.gender);
      })
      .call(force.drag);
  } else {
    // Disegna il grafo completo (nessun filtro per capitolo)
    link = svg.selectAll(".link")
      .data(links)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", 3)
      .style("stroke", "#828282");

    node = svg.selectAll(".node")
      .data(nodi)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", function(d) {
        return color(d.gender);
      })
      .call(force.drag);
  }

  // Gestione click su un nodo: mostra l'albero genealogico del componente connesso
  d3.selectAll(".node").on("click", function(clickedNode) {
    d3.select(".popup").remove();
    d3.select("#treeSVG").selectAll("*").remove();

    var selectedNodeId = clickedNode.id;
    var selectedComponent = findConnectedComponent(selectedNodeId);

    // Filtra i link della componente connessa (azione <= 2)
    var filteredLinks = links.filter(function(d) {
      return isNodeInComponent(d.source, selectedComponent) &&
             isNodeInComponent(d.target, selectedComponent) &&
             parseInt(d.action) <= 2;
    });

    // Filtra i nodi della componente connessa
    var filteredNodes = nodi.filter(function(d) {
      return isNodeInComponent(d, selectedComponent);
    });

    // Costruisce l'albero genealogico relativo al nodo selezionato
    createTree(filteredNodes, filteredLinks, selectedNodeId);
  });

  // Avvia il layout force-directed
  force.nodes(nodi)
    .links(links)
    .start();

  // Aggiorna posizioni dei nodi e dei link a ogni "tick"
  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });

  // Dopo un breve delay, abilita tooltip e info su nodi e link
  setTimeout(function() {
    showNode();
    showLink();
  }, 2500);
}

 
window.addEventListener("beforeunload", function(event) {
  document.getElementById("drawButton").disabled = true;
  document.getElementById("updateButton").disabled = true;
  document.getElementById("myCheckbox").checked = false;
  document.getElementById("check-span").classList.add('hidden');
  document.getElementById("treeSVG").classList.add('hidden');
  document.getElementsByClassName("intro").classList.remove('hidden');
  document.getElementsByClassName("main").classList.add('hidden');
});
