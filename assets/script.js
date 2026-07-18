(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // EDIT ME: year-by-year alumni counts for the "Alumni Network Growth"
  // visualization in the What's Next section. Add/remove/change rows freely
  // — the chart's scales, ticks, and animation timing all derive from this.
  // -----------------------------------------------------------------------
  const alumniData = [
    { year: 2002, value: 0 },
    { year: 2003, value: 42 },
    { year: 2004, value: 112 },
    { year: 2005, value: 248 },
    { year: 2006, value: 430 },
    { year: 2007, value: 660 },
    { year: 2008, value: 1014 },
    { year: 2009, value: 1426 },
    { year: 2010, value: 1918 },
    { year: 2011, value: 2373 },
    { year: 2012, value: 2852 },
    { year: 2013, value: 3367 },
    { year: 2014, value: 3819 },
    { year: 2015, value: 4490 },
    { year: 2016, value: 5245 },
    { year: 2017, value: 6076 },
    { year: 2018, value: 7019 },
    { year: 2019, value: 7863 },
    { year: 2020, value: 8426 },
    { year: 2021, value: 9303 },
    { year: 2022, value: 10348 },
    { year: 2023, value: 11494 },
    { year: 2024, value: 12734 },
    { year: 2025, value: 14215 },
    { year: 2026, value: 16016 },
  ];

  // -----------------------------------------------------------------------
  // EDIT ME: network graph data for "The Multiplier Effect". Organization
  // sits at the center; Fellows/Alumni are 1st-degree connections; their
  // institutional ties (Employer/University/etc.) are 2nd-degree; the outer
  // cloud of personal/professional relationships is 3rd-degree. Regenerated
  // fresh on each page load — re-run buildNetworkData() for a new layout.
  // -----------------------------------------------------------------------
  const networkData = (function buildNetworkData() {
    var nodes = [];
    var links = [];

    nodes.push({ id: 'org', label: 'Organization', layer: 1, type: 'org' });

    var fellowCount = 8, alumniCount = 12;
    for (var i = 1; i <= fellowCount; i++) {
      var fid = 'fellow-' + i;
      nodes.push({ id: fid, label: 'Fellow ' + i, layer: 2, type: 'fellow' });
      links.push({ source: 'org', target: fid });
    }
    for (var a = 1; a <= alumniCount; a++) {
      var aid = 'alumni-' + a;
      nodes.push({ id: aid, label: 'Alumni ' + a, layer: 2, type: 'alumni' });
      links.push({ source: 'org', target: aid });
    }

    var layer2Ids = nodes.filter(function (n) { return n.layer === 2; }).map(function (n) { return n.id; });
    function randomParent(ids) { return ids[Math.floor(Math.random() * ids.length)]; }

    var layer3Categories = ['Employer', 'University', 'Community Partner', 'Nonprofit', 'Foundation'];
    var l3i = 0;
    layer3Categories.forEach(function (cat) {
      for (var i = 1; i <= 5; i++) {
        var id = 'l3-' + (l3i++);
        nodes.push({ id: id, label: cat + ' ' + i, layer: 3, type: 'labeled3' });
        links.push({ source: randomParent(layer2Ids), target: id });
      }
    });
    var l3UnlabeledCount = 15;
    for (var u3 = 0; u3 < l3UnlabeledCount; u3++) {
      var uid3 = 'l3-' + (l3i++);
      nodes.push({ id: uid3, label: null, layer: 3, type: 'generic3' });
      links.push({ source: randomParent(layer2Ids), target: uid3 });
    }

    var layer3Ids = nodes.filter(function (n) { return n.layer === 3; }).map(function (n) { return n.id; });
    var layer4LabelPool = ['Colleagues', 'Family', 'Friends', 'Volunteer', 'Donor', 'Policy', 'Research', 'Colleagues', 'Family'];
    var l4i = 0;
    layer4LabelPool.forEach(function (label) {
      var id = 'l4-' + (l4i++);
      nodes.push({ id: id, label: label, layer: 4, type: 'labeled4' });
      links.push({ source: randomParent(layer3Ids), target: id });
    });
    var l4UnlabeledCount = 50 - layer4LabelPool.length;
    for (var u4 = 0; u4 < l4UnlabeledCount; u4++) {
      var uid4 = 'l4-' + (l4i++);
      nodes.push({ id: uid4, label: null, layer: 4, type: 'generic4' });
      links.push({ source: randomParent(layer3Ids), target: uid4 });
    }

    // Stable string key + target layer, computed while source/target are
    // still plain id strings. d3-force mutates link.source/link.target into
    // resolved node object references the moment a link is bound to the
    // simulation — a join key or layer filter that reads those fields later
    // would silently break (or throw) once earlier layers' links have
    // already been through that mutation.
    links.forEach(function (l) {
      l.id = l.source + '~' + l.target;
      l.targetLayer = nodes.filter(function (n) { return n.id === l.target; })[0].layer;
    });

    return { nodes: nodes, links: links };
  })();

  /* ---------- Stat counters ---------- */
  function formatStat(card, raw) {
    if (card.dataset.static) return card.dataset.static;
    var target = parseFloat(card.dataset.target || '0');
    var n = Math.round(raw);
    var s = card.dataset.comma ? n.toLocaleString('en-US') : String(n);
    return s + (card.dataset.suffix || '');
  }

  function animateStat(card) {
    if (card.dataset.static) return;
    var display = card.querySelector('.stat-display');
    var target = parseFloat(card.dataset.target || '0');
    var start = performance.now();
    var dur = 1300;
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      display.textContent = formatStat(card, target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initStatCounters() {
    var cards = document.querySelectorAll('.stat-card');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    cards.forEach(function (card) { io.observe(card); });
  }

  /* ---------- Alumni story tabs ---------- */
  function initStoryTabs() {
    var tabsWrap = document.getElementById('story-tabs');
    var cards = document.querySelectorAll('.story-card');
    if (!tabsWrap) return;
    tabsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      tabsWrap.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var key = btn.dataset.tab;
      cards.forEach(function (card) {
        var show = key === 'all' || card.dataset.category === key;
        card.hidden = !show;
      });
    });
  }

  /* ---------- Donor breakdown toggle ---------- */
  function initDonorToggle() {
    var btn = document.getElementById('donor-toggle');
    var chevron = document.getElementById('donor-chevron');
    var panel = document.getElementById('donor-breakdown');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      chevron.textContent = open ? '−' : '+';
    });
  }

  /* ---------- Multiplier Effect: D3 force-directed network ---------- */
  // Organization sits fixed at the center; Fellows/Alumni (1st degree) are
  // added first and radiate out; their institutional ties (2nd degree) are
  // added next as the camera starts pulling back; the outer cloud of
  // personal/professional relationships (3rd degree) is added last as the
  // camera finishes zooming out to the full network. After the reveal, the
  // simulation is left running at a low alphaTarget so the graph keeps
  // breathing gently, and hover reveals a node's connections + a tooltip.
  var NETWORK_NODE_COLOR = {
    org: '#007010',      // --fern
    fellow: '#117025',   // --pine
    alumni: '#433787',   // --indigo
    labeled3: '#85c093', // --moss
    generic3: '#85c093', // --moss
    labeled4: '#6c7a79', // --ink-soft
    generic4: '#6c7a79', // --ink-soft
  };
  var NETWORK_NODE_RADIUS = {
    org: 22, fellow: 11, alumni: 11,
    labeled3: 6, generic3: 3.5,
    labeled4: 4, generic4: 2.2,
  };
  var NETWORK_LAYER_RADIAL = { 1: 0, 2: 95, 3: 175, 4: 250 };
  var NETWORK_LAYER_CHARGE = { 1: -60, 2: -40, 3: -14, 4: -6 };

  function networkLayerDescriptor(d) {
    if (d.layer === 1) return 'Center of network';
    if (d.layer === 2) return (d.type === 'fellow' ? 'Fellow' : 'Alumni') + ' · 1st degree';
    if (d.layer === 3) return '2nd degree connection';
    return '3rd degree connection';
  }

  function initMultiplierCanvas(svgEl) {
    if (typeof d3 === 'undefined') return;

    var wrap = svgEl.closest('.multiplier-canvas-wrap');
    var tooltip = document.getElementById('network-tooltip');
    var replayBtn = document.getElementById('network-replay');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var svg = d3.select(svgEl);
    var W = 0, H = 0;

    var defs = svg.append('defs');
    var haloFilter = defs.append('filter').attr('id', 'networkHaloGlow').attr('x', '-300%').attr('y', '-300%').attr('width', '700%').attr('height', '700%');
    haloFilter.append('feGaussianBlur').attr('stdDeviation', 3);

    // Dense, fixed-pixel-spacing vertical rules behind everything — a
    // decorative "ruled notebook paper" texture, static regardless of the
    // camera's pan/zoom. Matches the same treatment on the Alumni chart.
    var gridG = svg.append('g').attr('class', 'network-grid');

    var camera = svg.append('g').attr('class', 'network-camera');
    var linksG = camera.append('g').attr('class', 'network-links');
    var nodesG = camera.append('g').attr('class', 'network-nodes');

    var nodeById = {};
    networkData.nodes.forEach(function (n) { nodeById[n.id] = n; });

    var activeNodes = [];
    var activeLinks = [];

    var simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(function (d) { return d.id; }).distance(function (l) {
        var s = typeof l.source === 'object' ? l.source : nodeById[l.source];
        var t = typeof l.target === 'object' ? l.target : nodeById[l.target];
        var maxLayer = Math.max(s.layer, t.layer);
        return maxLayer === 2 ? 70 : maxLayer === 3 ? 42 : 26;
      }).strength(0.6))
      .force('charge', d3.forceManyBody().strength(function (d) { return NETWORK_LAYER_CHARGE[d.layer]; }))
      .force('collide', d3.forceCollide().radius(function (d) { return NETWORK_NODE_RADIUS[d.type] + 2; }))
      .force('radial', d3.forceRadial(function (d) { return NETWORK_LAYER_RADIAL[d.layer]; }, 0, 0).strength(0.12))
      .alphaDecay(0.03)
      .velocityDecay(0.45)
      .stop();

    function ticked() {
      nodesG.selectAll('g.network-node').attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
      linksG.selectAll('line')
        .attr('x1', function (d) { return d.source.x; }).attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; }).attr('y2', function (d) { return d.target.y; });
    }
    simulation.on('tick', ticked);

    function resize() {
      var rect = svgEl.getBoundingClientRect();
      W = rect.width; H = rect.height;
      svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

      gridG.selectAll('line').remove();
      gridG.selectAll('line')
        .data(d3.range(0, W, 18))
        .join('line')
        .attr('x1', function (x) { return x; })
        .attr('x2', function (x) { return x; })
        .attr('y1', 0)
        .attr('y2', H)
        .attr('stroke', 'rgba(10,42,28,0.18)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '1.5 4');
    }
    resize();
    window.addEventListener('resize', resize);

    function setCameraTransform(scale, cx, cy, duration) {
      var tx = W / 2 - scale * cx;
      var ty = H / 2 - scale * cy;
      var transform = 'translate(' + tx + ',' + ty + ') scale(' + scale + ')';
      if (duration) camera.transition().duration(duration).ease(d3.easeCubicInOut).attr('transform', transform);
      else camera.interrupt().attr('transform', transform);
    }

    function fitCamera(nodes, padding, duration) {
      if (!nodes.length) return;
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      nodes.forEach(function (d) {
        x0 = Math.min(x0, d.x); x1 = Math.max(x1, d.x);
        y0 = Math.min(y0, d.y); y1 = Math.max(y1, d.y);
      });
      var w = Math.max(60, x1 - x0 + padding * 2);
      var h = Math.max(60, y1 - y0 + padding * 2);
      var scale = Math.min(W / w, H / h, 6);
      setCameraTransform(scale, (x0 + x1) / 2, (y0 + y1) / 2, duration);
    }

    function updateSim() {
      simulation.nodes(activeNodes);
      simulation.force('link').links(activeLinks);
      simulation.alpha(0.9).restart();
    }

    function renderJoin(orgDuration) {
      var nodeSel = nodesG.selectAll('g.network-node').data(activeNodes, function (d) { return d.id; });
      var nodeEnter = nodeSel.enter().append('g')
        .attr('class', 'network-node')
        .on('mouseenter', onNodeEnter)
        .on('mousemove', onNodeMove)
        .on('mouseleave', onNodeLeave);
      // Permanent soft blue-white halo behind every node, so each stays
      // legible against the green panel even where a node's own color
      // (--pine, --moss) sits close in hue to the background.
      nodeEnter.append('circle')
        .attr('class', 'network-node-halo')
        .attr('r', 0)
        .attr('fill', 'rgba(140,200,255,0.5)')
        .attr('filter', 'url(#networkHaloGlow)');
      nodeEnter.append('circle')
        .attr('class', 'network-node-core')
        .attr('r', 0)
        .attr('fill', function (d) { return NETWORK_NODE_COLOR[d.type]; });
      var dur = reduceMotion ? 0 : (orgDuration || 550);
      nodeEnter.select('circle.network-node-halo').transition().duration(dur).ease(d3.easeBackOut.overshoot(1.5))
        .attr('r', function (d) { return NETWORK_NODE_RADIUS[d.type] * 1.6; });
      nodeEnter.select('circle.network-node-core').transition().duration(dur).ease(d3.easeBackOut.overshoot(1.5))
        .attr('r', function (d) { return NETWORK_NODE_RADIUS[d.type]; });

      var linkSel = linksG.selectAll('line').data(activeLinks, function (d) { return d.id; });
      linkSel.enter().append('line')
        .attr('class', 'network-link')
        .attr('stroke', '#cad3d2')
        .attr('stroke-width', 0.75)
        .attr('stroke-opacity', 0)
        .transition().duration(reduceMotion ? 0 : 500).attr('stroke-opacity', 0.55);
    }

    function addLayer(layerNum, duration) {
      var newNodes = networkData.nodes.filter(function (n) { return n.layer === layerNum; });
      var newLinks = networkData.links.filter(function (l) { return l.targetLayer === layerNum; });
      activeNodes = activeNodes.concat(newNodes);
      activeLinks = activeLinks.concat(newLinks);
      updateSim();
      renderJoin(duration);
    }

    function onNodeEnter(event, d) {
      d3.select(this).classed('is-hovered', true).raise();
      linksG.selectAll('line')
        .classed('is-highlighted', function (l) { return l.source.id === d.id || l.target.id === d.id; });
      showTooltip(d, event);
    }
    function onNodeMove(event) { positionTooltip(event); }
    function onNodeLeave() {
      d3.select(this).classed('is-hovered', false);
      linksG.selectAll('line').classed('is-highlighted', false);
      hideTooltip();
    }

    function showTooltip(d, event) {
      if (!tooltip) return;
      tooltip.innerHTML = '<div class="tt-label">' + (d.label || 'Connection') + '</div><div class="tt-layer">' + networkLayerDescriptor(d) + '</div>';
      tooltip.classList.add('is-visible');
      positionTooltip(event);
    }
    function positionTooltip(event) {
      if (!tooltip || !wrap) return;
      var rect = wrap.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left + 14) + 'px';
      tooltip.style.top = (event.clientY - rect.top + 14) + 'px';
    }
    function hideTooltip() { if (tooltip) tooltip.classList.remove('is-visible'); }

    var pendingTimers = [];
    function clearPending() { pendingTimers.forEach(clearTimeout); pendingTimers = []; simulation.stop(); }

    function play() {
      clearPending();
      hideTooltip();
      nodesG.selectAll('*').remove();
      linksG.selectAll('*').remove();

      var org = nodeById.org;
      org.x = 0; org.y = 0; org.fx = 0; org.fy = 0;
      activeNodes = [org];
      activeLinks = [];
      updateSim();
      renderJoin(reduceMotion ? 0 : 900);
      // Frame roughly org + the 1st-degree ring's eventual extent before
      // those nodes exist, so the arrival doesn't jump-cut once they do.
      setCameraTransform(Math.min(W, H) / ((NETWORK_LAYER_RADIAL[2] + 40) * 2), 0, 0, 0);

      if (reduceMotion) {
        activeNodes = networkData.nodes.slice();
        activeLinks = networkData.links.slice();
        updateSim();
        renderJoin(0);
        for (var i = 0; i < 200; i++) simulation.tick();
        ticked();
        fitCamera(activeNodes, 40, 0);
        simulation.alphaTarget(0.01).restart();
        return;
      }

      pendingTimers.push(setTimeout(function () { addLayer(2, 650); }, 1000));
      pendingTimers.push(setTimeout(function () {
        addLayer(3, 500);
        fitCamera(activeNodes, 55, 1500);
      }, 2500));
      pendingTimers.push(setTimeout(function () {
        addLayer(4, 400);
        fitCamera(networkData.nodes, 45, 2000);
      }, 4000));
      pendingTimers.push(setTimeout(function () {
        simulation.alphaTarget(0.015).restart();
      }, 7000));
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          play();
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    io.observe(svgEl);

    if (replayBtn) replayBtn.addEventListener('click', play);
  }

  /* ---------- Alumni Network Growth: cinematic zoom-and-follow chart ---------- */
  // D3-driven. Camera starts tight on the earliest point, follows the curve
  // upward at constant apparent speed (arc-length parameterized), then pulls
  // back dramatically to reveal the full trend and a closing annotation.
  //
  // Built with a <g class="camera-layer"> that gets a translate+scale
  // transform each frame (the standard d3-zoom transform formula) rather
  // than manipulating the SVG's viewBox directly — this keeps every element
  // (dots, glow trail, axis ticks) living in one shared coordinate space, so
  // nothing can drift out of alignment the way an HTML tick overlay can.
  function initAlumniChart(container) {
    if (typeof d3 === 'undefined') return;

    var svgEl = document.getElementById('alumni-svg');
    var svg = d3.select(svgEl);
    var liveWrap = document.getElementById('alumni-live');
    var liveYear = document.getElementById('alumni-live-year');
    var liveCount = document.getElementById('alumni-live-count');
    var finalWrap = document.getElementById('alumni-final');
    var finalNum = document.getElementById('alumni-final-num');
    var replayBtn = document.getElementById('alumni-replay');
    if (!svgEl) return;

    var last = alumniData[alumniData.length - 1];
    var margin = { top: 30, right: 34, bottom: 40, left: 56 };

    var xScale = d3.scaleLinear().domain(d3.extent(alumniData, function (d) { return d.year; }));
    var yScale = d3.scaleLinear().domain([0, last.value * 1.08]);

    var defs = svg.append('defs');
    var glowFilter = defs.append('filter').attr('id', 'alumniGlow').attr('x', '-200%').attr('y', '-200%').attr('width', '500%').attr('height', '500%');
    var glowBlur = glowFilter.append('feGaussianBlur').attr('stdDeviation', 6);
    var dotGlowFilter = defs.append('filter').attr('id', 'alumniDotGlow').attr('x', '-400%').attr('y', '-400%').attr('width', '900%').attr('height', '900%');
    var dotBlur = dotGlowFilter.append('feGaussianBlur').attr('stdDeviation', 4);

    var gridG = svg.append('g').attr('class', 'grid-layer');
    var camera = svg.append('g').attr('class', 'camera-layer');
    var glowPath = camera.append('path').attr('fill', 'none').attr('stroke', 'rgba(130,190,255,0.75)').attr('filter', 'url(#alumniGlow)').attr('stroke-linecap', 'round');
    var linePath = camera.append('path').attr('fill', 'none').attr('stroke', '#0a2a1c').attr('stroke-linecap', 'round').attr('vector-effect', 'non-scaling-stroke');
    var dotsG = camera.append('g').attr('class', 'dots-layer');
    var axisXG = camera.append('g').attr('class', 'axis-x').style('opacity', 0);
    var axisYG = camera.append('g').attr('class', 'axis-y').style('opacity', 0);

    var W = 0, H = 0, points = [], segLens = [], totalLen = 0, renderedLen = 0;

    function layout() {
      // Measure the <svg> itself, not the outer panel — the panel's flex
      // layout gives the top bar/caption their own space first, so the
      // SVG's real rendered box is shorter than the panel. Sizing off the
      // panel instead left the bottom of the chart (the x-axis) positioned
      // outside the SVG's actual box, where it silently gets clipped.
      var rect = svgEl.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      xScale.range([margin.left, W - margin.right]);
      yScale.range([H - margin.bottom, margin.top]);

      points = alumniData.map(function (d) { return { x: xScale(d.year), y: yScale(d.value), year: d.year, value: d.value }; });
      segLens = [];
      totalLen = 0;
      for (var i = 1; i < points.length; i++) {
        var l = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        segLens.push(l);
        totalLen += l;
      }

      var lineGen = d3.line().x(function (p) { return p.x; }).y(function (p) { return p.y; }).curve(d3.curveMonotoneX);
      var pathD = lineGen(points);
      glowPath.attr('d', pathD);
      linePath.attr('d', pathD);
      // The dash-reveal must match the path's REAL rendered length, not the
      // straight-line distance between points used for camera/arc-length
      // math below — curveMonotoneX bows outward between points, so it's
      // measurably longer than that straight-line total. A mismatch there
      // understates the dash pattern's length, and since a single-value
      // stroke-dasharray repeats forever, the reveal was cycling a second
      // partial dash-gap-dash near the end of the animation, showing up as
      // a disconnected floating line segment beyond a gap.
      renderedLen = linePath.node().getTotalLength();

      // Dense, fixed-pixel-spacing vertical rules — a decorative "ruled
      // notebook paper" texture behind the chart, independent of the year
      // scale (unlike the tick years below, which still map to real dates).
      gridG.selectAll('line').remove();
      var gridPositions = d3.range(0, W, 18);
      gridG.selectAll('line')
        .data(gridPositions)
        .join('line')
        .attr('x1', function (x) { return x; })
        .attr('x2', function (x) { return x; })
        .attr('y1', 0)
        .attr('y2', H)
        .attr('stroke', 'rgba(10,42,28,0.18)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '1.5 4');

      var gridYears = d3.range(alumniData[0].year, last.year + 1);

      dotsG.selectAll('g.dot').remove();
      var dotSel = dotsG.selectAll('g.dot').data(points).join('g')
        .attr('class', 'dot')
        .attr('transform', function (p) { return 'translate(' + p.x + ',' + p.y + ')'; })
        .style('opacity', 0);
      dotSel.append('circle').attr('class', 'dot-halo').attr('r', 6).attr('fill', 'rgba(140,200,255,0.55)').attr('filter', 'url(#alumniDotGlow)');
      dotSel.append('circle').attr('class', 'dot-core').attr('r', 3.4).attr('fill', '#eefbf1').attr('stroke', '#0a2a1c').attr('stroke-width', 0.75).attr('vector-effect', 'non-scaling-stroke');

      var tickYears = gridYears.filter(function (yr) { return yr % 4 === 0 || yr === last.year || yr === alumniData[0].year; });
      axisXG.attr('transform', 'translate(0,' + (H - margin.bottom) + ')')
        .call(d3.axisBottom(xScale).tickValues(tickYears).tickFormat(d3.format('d')).tickSizeOuter(0));
      axisYG.attr('transform', 'translate(' + margin.left + ',0)')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(',')).tickSizeOuter(0));
      [axisXG, axisYG].forEach(function (g) {
        g.selectAll('text').attr('fill', 'rgba(10,42,28,0.75)').attr('font-family', "'JetBrains Mono', monospace").attr('font-size', 10);
        g.selectAll('path,line').attr('stroke', 'rgba(10,42,28,0.35)');
      });
    }
    layout();
    window.addEventListener('resize', layout);

    function pointAtLenFraction(t) {
      var target = t * totalLen;
      var acc = 0;
      for (var i = 0; i < segLens.length; i++) {
        if (acc + segLens[i] >= target || i === segLens.length - 1) {
          var segT = segLens[i] > 0 ? (target - acc) / segLens[i] : 0;
          var a = points[i], b = points[i + 1];
          var ct = Math.max(0, Math.min(1, segT));
          return {
            x: a.x + (b.x - a.x) * ct, y: a.y + (b.y - a.y) * ct,
            value: a.value + (b.value - a.value) * ct, year: a.year + (b.year - a.year) * ct,
          };
        }
        acc += segLens[i];
      }
      return points[points.length - 1];
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // Everything inside `camera` lives in a group scaled by k, so any raw
    // stroke-width / radius / filter stdDeviation set on those children gets
    // multiplied by k again at render time (filters especially: stdDeviation
    // is interpreted in the *already-scaled* local coordinate system). To
    // keep the glow, dots, and blur radius a deliberate, consistent size on
    // screen regardless of zoom, each is computed as "desired on-screen
    // size / k" every frame — the group's scale(k) then cancels back out.
    function setCamera(px, py, k) {
      var tx = W / 2 - k * px;
      var ty = H / 2 - k * py;
      camera.attr('transform', 'translate(' + tx + ',' + ty + ') scale(' + k + ')');
      glowPath.attr('stroke-width', clamp(12 / k, 0.3, 60));
      linePath.attr('stroke-width', 2.4); // also enforced by vector-effect:non-scaling-stroke
      glowBlur.attr('stdDeviation', clamp(5 / k, 0.15, 20));
      dotsG.selectAll('g.dot circle.dot-core').attr('r', clamp(3.4 / k, 0.3, 12));
      dotsG.selectAll('g.dot circle.dot-halo').attr('r', clamp(9 / k, 0.5, 30));
      dotBlur.attr('stdDeviation', clamp(3.5 / k, 0.1, 14));
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FOLLOW_MS = 9000;
    var ZOOMOUT_MS = 2200;
    var TOTAL_MS = FOLLOW_MS + ZOOMOUT_MS;
    var K_START = 15;
    var K_FOLLOW_END = 4.2;

    function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function showFullView() {
      setCamera((xScale.range()[0] + xScale.range()[1]) / 2, (yScale.range()[0] + yScale.range()[1]) / 2, 1);
      dotsG.selectAll('g.dot').style('opacity', 1);
      axisXG.transition().duration(400).style('opacity', 1);
      axisYG.transition().duration(400).style('opacity', 1);
      liveWrap.classList.remove('is-visible');
      finalNum.textContent = last.value.toLocaleString('en-US');
      finalWrap.classList.add('is-visible');
    }

    var rafId = null;
    var revealedCount = 0;

    function revealDotsUpTo(curX) {
      points.forEach(function (p, i) {
        if (p.x <= curX + 0.5 && i >= revealedCount - 1) {
          var el = dotsG.selectAll('g.dot').filter(function (d, j) { return j === i; });
          if (+el.style('opacity') !== 1) {
            el.style('opacity', 1);
            revealedCount = Math.max(revealedCount, i + 1);
          }
        }
      });
    }

    function play() {
      revealedCount = 0;
      dotsG.selectAll('g.dot').style('opacity', 0);
      axisXG.style('opacity', 0);
      axisYG.style('opacity', 0);
      finalWrap.classList.remove('is-visible');
      liveWrap.classList.add('is-visible');
      glowPath.attr('stroke-dasharray', renderedLen).attr('stroke-dashoffset', renderedLen);
      linePath.attr('stroke-dasharray', renderedLen).attr('stroke-dashoffset', renderedLen);

      if (reduceMotion) {
        glowPath.attr('stroke-dashoffset', 0);
        linePath.attr('stroke-dashoffset', 0);
        showFullView();
        return;
      }

      var startTime = performance.now();
      function frame(now) {
        // rAF's timestamp can occasionally precede a performance.now() taken
        // just before scheduling it — clamp so elapsed never goes negative
        // on the first frame (which would otherwise feed a later Math.sqrt()
        // a negative number and NaN the whole camera transform).
        var elapsed = Math.max(0, now - startTime);
        if (elapsed <= FOLLOW_MS) {
          var t = Math.min(1, elapsed / FOLLOW_MS);
          var cur = pointAtLenFraction(t);
          var k = K_START + (K_FOLLOW_END - K_START) * Math.sqrt(t);
          setCamera(cur.x, cur.y, k);
          glowPath.attr('stroke-dashoffset', renderedLen * (1 - t));
          linePath.attr('stroke-dashoffset', renderedLen * (1 - t));
          revealDotsUpTo(cur.x);
          liveYear.textContent = String(Math.round(cur.year));
          liveCount.textContent = Math.round(cur.value).toLocaleString('en-US') + ' alumni';
          rafId = requestAnimationFrame(frame);
        } else if (elapsed <= TOTAL_MS) {
          var zt = easeOutExpo((elapsed - FOLLOW_MS) / ZOOMOUT_MS);
          var lastPt = points[points.length - 1];
          var fullCx = (xScale.range()[0] + xScale.range()[1]) / 2;
          var fullCy = (yScale.range()[0] + yScale.range()[1]) / 2;
          var cx = lastPt.x + (fullCx - lastPt.x) * zt;
          var cy = lastPt.y + (fullCy - lastPt.y) * zt;
          var k2 = K_FOLLOW_END + (1 - K_FOLLOW_END) * zt;
          setCamera(cx, cy, k2);
          dotsG.selectAll('g.dot').style('opacity', 1);
          if (zt > 0.6) {
            var axisOp = (zt - 0.6) / 0.4;
            axisXG.style('opacity', axisOp);
            axisYG.style('opacity', axisOp);
          }
          if (zt > 0.85) liveWrap.classList.remove('is-visible');
          rafId = requestAnimationFrame(frame);
        } else {
          showFullView();
        }
      }
      setCamera(points[0].x, points[0].y, K_START);
      rafId = requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          play();
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(container);

    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        if (rafId) cancelAnimationFrame(rafId);
        play();
      });
    }
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initStatCounters();
    initStoryTabs();
    initDonorToggle();

    var canvas = document.getElementById('multiplier-canvas');
    if (canvas) initMultiplierCanvas(canvas);

    var alumniContainer = document.getElementById('alumni-chart-container');
    if (alumniContainer) initAlumniChart(alumniContainer);
  });
})();
