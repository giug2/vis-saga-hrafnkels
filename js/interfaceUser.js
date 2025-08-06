/*
* Gestione delle interazioni dell'utente.
*/
window.addEventListener('DOMContentLoaded', function() {
  const btnShowGraph = document.getElementById('btnShowGraph');
  const graphContainer = document.getElementById('graphContainer');
  const btnShowTimeline = document.getElementById('btnShowTimeline');
  const timelineContainer = document.getElementById('timelineContainer');
  const btnShowTree = document.getElementById('btnShowTree');
  const treeContainer = document.getElementById('treeContainer');

  const checkbox = document.getElementById("myCheckbox");
  const slider = document.getElementById("chapter-slider");
  const valueLabel = document.getElementById("chapter-value");

  btnShowGraph.disabled = false;
  btnShowTimeline.disabled = false;
  btnShowTree.disabled = false;

  btnShowGraph.addEventListener('click', () => {
    graphContainer.classList.remove('hidden');
    timelineContainer.classList.add('hidden');
    treeContainer.classList.add('hidden');
    drawGraph();
  });

  btnShowTimeline.addEventListener('click', () => {
    graphContainer.classList.add('hidden');
    timelineContainer.classList.remove('hidden');
    treeContainer.classList.add('hidden');
    drawTimeline();
  });

  btnShowTree.addEventListener('click', () => {
    graphContainer.classList.add('hidden');
    timelineContainer.classList.add('hidden');
    treeContainer.classList.remove('hidden');
    setupDropdownAndListener(nodes, links);
  });

  // Creazione e gestione dello slider
  noUiSlider.create(slider, {
    start: [1, 16],
    connect: true,
    range: { min: 1, max: 16 },
    step: 1,
    tooltips: [true, true],
    format: {
      to: value => Math.round(value),
      from: value => Number(value)
    }
  });

  slider.classList.add('hidden');
  valueLabel.textContent = 'Capitoli dal 1 al 16';

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      valueLabel.classList.remove('hidden');
      slider.classList.remove('hidden');
    } else {
      valueLabel.classList.add('hidden');
      slider.classList.add('hidden');
    }
    drawGraph();
  });

  slider.noUiSlider.on('update', (values) => {
    const minChapter = values[0];
    const maxChapter = values[1];
    valueLabel.textContent = `Capitoli dal ${minChapter} al ${maxChapter}`;
    drawGraph();
  });
});
