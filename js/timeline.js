// Variabili globali
var node;              
var link;              
var margin = { top: 40, right: 70, bottom: 100, left: 350 };


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
function showLinkTimeline() {
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
function showNodeTimeline() {
  d3.selectAll(".node")
    .on("mouseover", function(d) {
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

// Funzione principale per disegnare la timeline
function drawTimeline() {
  const container = d3.select("#timelineContainer");
  container.selectAll("*").remove();
  
  var width = 1300 - margin.left - margin.right;
    var height = 850 - margin.top - margin.bottom;

    var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);



  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Capitoli + Undefined
  var chapters = [];
  for(var i=1; i<=16; i++) chapters.push(i);
  chapters.push("Undefined");

  // Prepara i nodi: aggiungi chapterLabel con controllo su capitolo esistente
  var timelineNodes = nodes.map(function(d){
    return {
      id: d.id,
      label: d.label,
      chapterLabel: (d.chapter && chapters.indexOf(d.chapter) !== -1) ? d.chapter : "Undefined",
      gender: d.gender
    };
  });

  // Scala X: ordinale per capitoli
  var xScale = d3.scale.ordinal()
    .domain(chapters)
    .rangePoints([0, width], 0.5);

  // Scala Y: ordinal per personaggi (label)
  var yDomain = timelineNodes.map(function(d){ return d.label; });
  var yScale = d3.scale.ordinal()
    .domain(yDomain)
    .rangeBands([0, height], 0.02);

  // Assi
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");

  // Disegna assi
  g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  g.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  // Tooltip
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("padding", "5px 10px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px");

  // Posizioni nodi per link
  var nodePositions = {};
  timelineNodes.forEach(function(d){
    nodePositions[d.id] = {
      x: xScale(d.chapterLabel),
      y: yScale(d.label)
    };
  });

  // Disegna link
  g.selectAll("line.link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", function(d){ return nodePositions[d.source] ? nodePositions[d.source].x : 0; })
    .attr("y1", function(d){ return nodePositions[d.source] ? nodePositions[d.source].y : 0; })
    .attr("x2", function(d){ return nodePositions[d.target] ? nodePositions[d.target].x : 0; })
    .attr("y2", function(d){ return nodePositions[d.target] ? nodePositions[d.target].y : 0; })
    .attr("stroke", d => getColorByAction(d.action))
    .attr("stroke-width", 2)
    .attr("opacity", 0.6);

  // Disegna nodi come cerchi
  g.selectAll("circle.node")
    .data(timelineNodes)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("cx", function(d){ return xScale(d.chapterLabel); })
    .attr("cy", function(d){ return yScale(d.label); })
    .attr("r", 8)
    .style("fill", d => {
      if (d.gender === 1) return "#214b9fff";
      if (d.gender === 0) return "#990f0fff";
      return "#0e770eff";
    })
    .style("cursor", "pointer")
    .on("mouseover", function(event, d){
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html("<strong>" + d.label + "</strong><br>Capitolo: " + d.chapterLabel)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function(){
      tooltip.transition().duration(500).style("opacity", 0);
    });

    // Riattiva interazioni
  setTimeout(function () {
    showNodeTimeline();
    showLinkTimeline();
  }, 2500);
}
