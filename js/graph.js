// Variabili globali
var node;              
var link;              
var width = 900;   
var height = 600;      

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
function showLinkGraph() {
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

      let popupText = d.source.label + " " + actionDescription + " " + d.target.label;
      if (d.chapter !== undefined && d.chapter !== null) {
        popupText += " (Capitolo: " + d.chapter + ")";
      }
      popup.append("p").text(popupText);
    })
    .on("mouseout", function() {
      d3.select(".popup").remove();
    });
}

/* 
 * Mostra un popup e evidenzia i nodi e link connessi quando si passa il mouse su un nodo.
 */
function showNodeGraph() {
  d3.selectAll(".node")
    .on("mouseover", function(d) {
      // evidenzia solo nodi connessi direttamente al nodo d (compreso d)
     d3.selectAll(".node")
      .style("opacity", function(o) {
        return isConnected(d, o) ? 1 : 0.1;  // evidenzia nodo + adiacenti
      });

      // evidenzia solo link incidenti al nodo d
      d3.selectAll(".link")
        .style("opacity", function(o) {
          return (o.source.id === d.id || o.target.id === d.id) ? 1 : 0.05;
        });

      // popup
      d3.select(".popup").remove(); // rimuovi popup precedente

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
        .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.3)")
        .style("pointer-events", "none"); // per evitare che popup intercetti mouse

      popup.append("h2").text(d.label);

      if (d.chapter !== undefined) popup.append("p").text("Chapter: " + d.chapter);
      if (d.page !== undefined) popup.append("p").text("Page: " + d.page);

      var genderCodesObject = window.gender_codes[d.gender];
      var genderDescription = genderCodesObject ? genderCodesObject['gender description'] : "N/A";
      var genderSymbol = d.gender === 1 ? "\u2642" : (d.gender === 0 ? "\u2640" : "\u26A7");

      popup.append("p").text("Gender: " + genderDescription + " " + genderSymbol);
    })
    .on("mouseout", function() {
      d3.select(".popup").remove();

      // ripristina opacità a tutti
      d3.selectAll(".node").style("opacity", 1);
      d3.selectAll(".link").style("opacity", 1);
    });
}

// Funzione che verifica se due nodi sono direttamente connessi (o sono lo stesso nodo)
function isConnected(a, b) {
  if (a.id === b.id) return true;
  return window.links.some(function(l) {
    var sourceId = typeof l.source === "object" ? l.source.id : l.source;
    var targetId = typeof l.target === "object" ? l.target.id : l.target;
    return (sourceId === a.id && targetId === b.id) || 
           (sourceId === b.id && targetId === a.id);
  });
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
function drawGraph() {
  var charge = -400;           // maggiore repulsione
  var linkDistance = 100;      // distanzia meglio i nodi
  var gravity = 0.1;          // meno forza centripeta
  var linkStrength = 0.1;      // archi più elastici
  var friction = 0.9;
  var theta = 0.8;
  var alpha = 0.1;
  var chargeDistance = 1800;   // distanza massima di repulsione


  var svg = d3.select("#graphSVG").attr("width", width).attr("height", height);
  svg.selectAll("*").remove();

  // Definizione delle frecce
  const defs = svg.append("defs");
  window.action_codes.forEach((label, action) => {
    defs.append("marker")
      .attr("id", "arrow" + action)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", getColorByAction(action));
  });

  // Capitoli selezionati
  const sliderActive = document.getElementById("myCheckbox").checked;
  let range = [1, 16];
  if (sliderActive) {
    range = document.getElementById("chapter-slider").noUiSlider.get().map(Number);
  }
  const [minChapter, maxChapter] = range;

  // Filtro nodi e mappa
  const nodi = window.nodes.filter(n => n.chapter >= minChapter && n.chapter <= maxChapter);
  const validNodeIds = new Set(nodi.map(n => n.id));
  const nodeMap = new Map(nodi.map(n => [n.id, n]));

  // Filtro e normalizzazione link
  const links = window.links
    .filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    })
    .map(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return {
        ...l,
        source: nodeMap.get(sourceId),
        target: nodeMap.get(targetId)
      };
    });

  // Inizializza forza
  const force = d3.layout.force()
    .charge(charge)
    .linkDistance(linkDistance)
    .gravity(gravity)
    .friction(friction)
    .linkStrength(linkStrength)
    .alpha(alpha)
    .theta(theta)
    .chargeDistance(chargeDistance)
    .size([width, height]);

  // Disegna link
  const link = svg.selectAll(".link")
    .data(links)
    .enter().append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("marker-end", d => "url(#arrow" + d.action + ")")
    .attr("stroke", d => getColorByAction(d.action));

  // Disegna nodi
  const node = svg.selectAll(".node")
    .data(nodi)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", d => (d.chapter === minChapter ? 12 : 10))
    .style("fill", d => {
      if (d.gender === 1) return "#214b9fff";
      if (d.gender === 0) return "#990f0fff";
      return "#0e770eff";
    })
    .call(force.drag);

  // Avvia simulazione
  force.nodes(nodi).links(links).start();

  force.on("tick", function () {
    node.each(function (d) {
      const r = 12;
      const padding = 5;

      if (d.x < r || d.x > width - r) d.vx *= -1;
      if (d.y < r || d.y > height - r) d.vy *= -1;

      if (d.x < r) d.x = r;
      if (d.x > width - r - padding) d.x = width - r - padding;
      if (d.y < r) d.y = r;
      if (d.y > height - r - padding) d.y = height - r - padding;
    });

    link.attr("d", function (d) {
      const x1 = d.source.x;
      const y1 = d.source.y;
      const x2 = d.target.x;
      const y2 = d.target.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
      return `M${x1},${y1} A${dr},${dr} 0 0,1 ${x2},${y2}`;
    });

    node.attr("cx", d => d.x).attr("cy", d => d.y);
  });

  // Riattiva interazioni
  setTimeout(function () {
    showNodeGraph();
    showLinkGraph();
  }, 2500);
}
