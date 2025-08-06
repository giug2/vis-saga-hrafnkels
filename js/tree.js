/* 
* Costruisce il menu a tendina con i personaggi.
*/
function populateDropdown(nodes) {
  const select = document.getElementById("personSelect");
  select.innerHTML = `<option value="">Seleziona un personaggio...</option>`;
  nodes.forEach(node => {
    const option = document.createElement("option");
    option.value = node.id;
    option.textContent = node.label || node.id;
    select.appendChild(option);
  });
}

function linkify(links, nodes) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  return links.map(link => ({
    ...link,
    source: nodeMap.get(link.source),
    target: nodeMap.get(link.target),
  }));
}

/*
* Filtra i nodi di interesse
*/
function filterTreeData(allNodes, allLinks, selectedNodeId) {
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const includedNodeIds = new Set([selectedNodeId]);

  function addDescendants(nodeId) {
    allLinks.forEach(link => {
      if (link.source.id === nodeId && parseInt(link.action) === 1) {
        if (!includedNodeIds.has(link.target.id)) {
          includedNodeIds.add(link.target.id);
          addDescendants(link.target.id);
        }
      }
    });
  }

  addDescendants(selectedNodeId);

  const filteredNodes = Array.from(includedNodeIds).map(id => nodeMap.get(id));
  const filteredLinks = allLinks.filter(l =>
    includedNodeIds.has(l.source.id) && includedNodeIds.has(l.target.id)
  );

  return { filteredNodes, filteredLinks };
}


/* 
* Funzione che disegna i nodi del grafo gerarchico nel SVG 
*/
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
      return d.id === selectedNodeId ? 12 : 10;
    })
    .attr("id", d => d.id)
    .style("fill", d => {
      if (d.gender === 1) return "#214b9fff";     // blu
      if (d.gender === 0) return "#990f0fff";   // rosso
        return "#0e770eff";                              // verde per neutro o mancante
    })
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


/* 
* Funzione che disegna gli archi del grafo gerarchico nel SVG 
*/
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
      .style("stroke", "#8a6a4ad1");
  });

  d3.selectAll("line").attr("order", -1);
}

/* 
* Funzione che crea l'albero gerarchico a partire da un nodo selezionato 
*/
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
  showNodeGraph();
}

/* 
* Funzione principale.
*/
function setupDropdownAndListener(allNodes, rawLinks) {
  const allLinks = linkify(rawLinks, allNodes); 

  populateDropdown(allNodes);

  const select = document.getElementById("personSelect");
  select.addEventListener("change", function () {
    const selectedNodeId = parseInt(this.value);
    d3.select("#treeSVG").selectAll("*").remove();

    if (selectedNodeId) {
      const { filteredNodes, filteredLinks } = filterTreeData(allNodes, allLinks, selectedNodeId);
      createTree(filteredNodes, filteredLinks, selectedNodeId);
    }
  });
}
