(function () {
  'use strict';

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

  /* ---------- Multiplier Effect: embedding-style particle field ---------- */
  // Many loosely-clustered nodes scattered across the whole canvas (no single
  // hub), evoking a t-SNE/UMAP scatter rather than a literal org chart.
  // Cursor movement attracts nearby nodes toward it.
  function buildEmbeddingField() {
    var PALETTE = [
      { fill: '#09352e', stroke: 'none', sw: 0 },          // forest ink solid
      { fill: '#85c093', stroke: 'none', sw: 0 },          // moss solid
      { fill: 'transparent', stroke: '#09352e', sw: 0.8 }, // hollow ink
      { fill: '#77aa83', stroke: 'none', sw: 0 },          // muted sage
      { fill: 'transparent', stroke: '#117025', sw: 0.9 }, // hollow pine
      { fill: '#cad3d2', stroke: 'none', sw: 0 },          // lichen faint
    ];
    var particles = [];
    var edges = [];

    // Poisson-disc-ish rejection sampling for organic (non-grid) cluster centers.
    var seeds = [];
    var minDistF = 0.19;
    var attempts = 0;
    while (seeds.length < 15 && attempts < 4000) {
      attempts++;
      var fx = 0.04 + Math.random() * 0.92;
      var fy = 0.08 + Math.random() * 0.84;
      var ok = seeds.every(function (s) { return Math.hypot((s.fx - fx) * 2.3, s.fy - fy) > minDistF; });
      if (ok) seeds.push({ fx: fx, fy: fy });
    }

    var clusters = seeds.map(function (seed, idx) {
      return {
        fx: seed.fx,
        fy: seed.fy,
        palette: PALETTE[idx % PALETTE.length],
        spreadF: 0.04 + Math.random() * 0.05,
        n: 26 + Math.floor(Math.random() * 34),
      };
    });

    clusters.forEach(function (cl) {
      var clusterParticles = [];
      for (var i = 0; i < cl.n; i++) {
        var jr = Math.sqrt(Math.random()) * cl.spreadF;
        var ja = Math.random() * Math.PI * 2;
        var fx = cl.fx + jr * Math.cos(ja) * 1.5;
        var fy = cl.fy + jr * Math.sin(ja);
        var p = {
          baseFX: fx, baseFY: fy, x: 0, y: 0, ready: false,
          r: 1.5 + Math.random() * 1.7,
          fill: cl.palette.fill, stroke: cl.palette.stroke, sw: cl.palette.sw,
          phase: Math.random() * Math.PI * 2,
          ampX: 3 + Math.random() * 5, ampY: 3 + Math.random() * 5,
          freqX: 0.28 + Math.random() * 0.3, freqY: 0.28 + Math.random() * 0.3,
          vx: 0, vy: 0,
        };
        particles.push(p);
        clusterParticles.push(p);
      }
      clusterParticles.forEach(function (p, i) {
        var order = clusterParticles
          .map(function (q, j) { return [j === i ? Infinity : Math.hypot(p.baseFX - q.baseFX, p.baseFY - q.baseFY), j]; })
          .sort(function (a, b) { return a[0] - b[0]; }).slice(0, 2);
        order.forEach(function (pair) { edges.push({ a: p, b: clusterParticles[pair[1]], stroke: '#cad3d2', width: 0.5, op: 0.38 }); });
      });
    });

    // sparse ambient noise points scattered independently of clusters
    for (var n = 0; n < 90; n++) {
      particles.push({
        baseFX: 0.03 + Math.random() * 0.94,
        baseFY: 0.06 + Math.random() * 0.88,
        x: 0, y: 0, ready: false,
        r: 1 + Math.random() * 1.1,
        fill: 'transparent', stroke: '#9aa6a4', sw: 0.6,
        phase: Math.random() * Math.PI * 2,
        ampX: 2 + Math.random() * 3, ampY: 2 + Math.random() * 3,
        freqX: 0.2 + Math.random() * 0.25, freqY: 0.2 + Math.random() * 0.25,
        vx: 0, vy: 0,
      });
    }

    // sparse long-range edges suggesting the overall manifold between clusters
    for (var k = 0; k < 30; k++) {
      var a = particles[Math.floor(Math.random() * particles.length)];
      var b = particles[Math.floor(Math.random() * particles.length)];
      if (a !== b) edges.push({ a: a, b: b, stroke: '#cad3d2', width: 0.4, op: 0.1 });
    }

    return { particles: particles, edges: edges };
  }

  function initMultiplierCanvas(canvas) {
    var field = buildEmbeddingField();
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = { w: 0, h: 0 };

    function resize() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      size = { w: rect.width, h: rect.height };
    }
    resize();
    window.addEventListener('resize', resize);

    var mouse = { x: null, y: null, active: false };
    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    canvas.addEventListener('mouseleave', function () { mouse.active = false; });

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SPRING = 0.055;
    var DAMPING = 0.8;
    var start = performance.now();

    function draw(now) {
      var t = (now - start) / 1000;
      var w = size.w, h = size.h;
      var minDim = Math.min(w, h);
      var ATTRACT_RADIUS = minDim * 0.32;
      var ATTRACT_STRENGTH = 0.1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var particles = field.particles, edges = field.edges;

      particles.forEach(function (p) {
        var driftX = reduceMotion ? 0 : Math.sin(t * p.freqX + p.phase) * p.ampX;
        var driftY = reduceMotion ? 0 : Math.cos(t * p.freqY + p.phase) * p.ampY;
        var targetX = p.baseFX * w + driftX;
        var targetY = p.baseFY * h + driftY;

        var ax = (targetX - p.x) * SPRING;
        var ay = (targetY - p.y) * SPRING;

        if (mouse.active && !reduceMotion) {
          var dx = mouse.x - p.x;
          var dy = mouse.y - p.y;
          var dist = Math.hypot(dx, dy);
          if (dist < ATTRACT_RADIUS && dist > 0.01) {
            var falloff = 1 - dist / ATTRACT_RADIUS;
            ax += dx * falloff * falloff * ATTRACT_STRENGTH * 6;
            ay += dy * falloff * falloff * ATTRACT_STRENGTH * 6;
          }
        }

        p.vx = (p.vx + ax) * DAMPING;
        p.vy = (p.vy + ay) * DAMPING;
        if (!p.ready) { p.x = targetX; p.y = targetY; p.ready = true; }
        p.x += p.vx;
        p.y += p.vy;
      });

      edges.forEach(function (e) {
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.strokeStyle = e.stroke;
        ctx.globalAlpha = e.op;
        ctx.lineWidth = e.width;
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      particles.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.fill && p.fill !== 'transparent') { ctx.fillStyle = p.fill; ctx.fill(); }
        if (p.sw > 0) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.sw; ctx.stroke(); }
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Alumni Network Growth: zoom-and-follow chart ---------- */
  // Builds a zoomed-in "camera" animation that follows the ascending line from
  // 2003 as it climbs, then pulls back at the end to reveal the full
  // 2003->2026 trend.
  var ALUMNI_DATA = [
    { year: 2003, value: 20 }, { year: 2005, value: 150 }, { year: 2007, value: 420 },
    { year: 2009, value: 900 }, { year: 2011, value: 1600 }, { year: 2013, value: 2500 },
    { year: 2015, value: 3700 }, { year: 2017, value: 5100 }, { year: 2019, value: 6900 },
    { year: 2021, value: 8800 }, { year: 2023, value: 10800 }, { year: 2024, value: 11700 },
    { year: 2025, value: 12600 }, { year: 2026, value: 13500 }
  ];

  function initAlumniChart(container) {
    var x0 = 50, x1 = 980, y0 = 20, y1 = 210;
    var yearMin = 2003, yearMax = 2026, valMax = 14000;
    function xs(year) { return x0 + ((year - yearMin) / (yearMax - yearMin)) * (x1 - x0); }
    function ys(val) { return y1 - (val / valMax) * (y1 - y0); }
    var points = ALUMNI_DATA.map(function (d) { return { x: xs(d.year), y: ys(d.value), year: d.year, value: d.value }; });
    var last = points[points.length - 1];

    var segLens = [];
    var totalLen = 0;
    for (var i = 1; i < points.length; i++) {
      var l = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      segLens.push(l);
      totalLen += l;
    }
    // arc-length parameterization so the "camera" travels at constant speed
    function pointAtLenFraction(t) {
      var target = t * totalLen;
      var acc = 0;
      for (var j = 0; j < segLens.length; j++) {
        if (acc + segLens[j] >= target || j === segLens.length - 1) {
          var segT = segLens[j] > 0 ? (target - acc) / segLens[j] : 0;
          var a = points[j], b = points[j + 1];
          var ct = Math.max(0, Math.min(1, segT));
          return {
            x: a.x + (b.x - a.x) * ct, y: a.y + (b.y - a.y) * ct,
            value: a.value + (b.value - a.value) * ct, year: a.year + (b.year - a.year) * ct,
          };
        }
        acc += segLens[j];
      }
      return last;
    }

    var linePathD = points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    var areaPathD = 'M' + points[0].x.toFixed(1) + ',' + y1 + ' ' +
      points.map(function (p) { return 'L' + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') +
      ' L' + points[points.length - 1].x.toFixed(1) + ',' + y1 + ' Z';

    var svgNS = 'http://www.w3.org/2000/svg';
    var body = container.querySelector('.alumni-chart-body');
    var countEl = container.querySelector('.alumni-chart-count');
    function fmtCount(n, label) {
      return Math.round(n).toLocaleString('en-US') + ' <span class="alumni-count-unit">alumni · ' + label + '</span>';
    }

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 260');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '240px';
    svg.style.display = 'block';
    svg.style.overflow = 'visible';

    var defs = document.createElementNS(svgNS, 'defs');
    var clipPathEl = document.createElementNS(svgNS, 'clipPath');
    var clipId = 'alumniRevealClip-' + Math.random().toString(36).slice(2, 9);
    clipPathEl.setAttribute('id', clipId);
    clipPathEl.setAttribute('clipPathUnits', 'userSpaceOnUse');
    var revealRect = document.createElementNS(svgNS, 'rect');
    revealRect.setAttribute('x', x0); revealRect.setAttribute('y', 0);
    revealRect.setAttribute('width', 0); revealRect.setAttribute('height', 260);
    clipPathEl.appendChild(revealRect);
    defs.appendChild(clipPathEl);
    svg.appendChild(defs);

    var gridG = document.createElementNS(svgNS, 'g');
    [0, 5000, 10000, 14000].forEach(function (v) {
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x0); line.setAttribute('x2', x1);
      line.setAttribute('y1', ys(v)); line.setAttribute('y2', ys(v));
      line.setAttribute('stroke', '#cad3d2'); line.setAttribute('stroke-width', 0.5);
      line.setAttribute('stroke-dasharray', '2 3');
      line.style.opacity = 0;
      gridG.appendChild(line);
    });
    svg.appendChild(gridG);

    var areaEl = document.createElementNS(svgNS, 'path');
    areaEl.setAttribute('d', areaPathD);
    areaEl.setAttribute('fill', '#77aa83');
    areaEl.setAttribute('clip-path', 'url(#' + clipId + ')');
    areaEl.style.opacity = 0;
    svg.appendChild(areaEl);

    var lineEl = document.createElementNS(svgNS, 'path');
    lineEl.setAttribute('d', linePathD);
    lineEl.setAttribute('fill', 'none');
    lineEl.setAttribute('stroke', '#09352e');
    lineEl.setAttribute('stroke-width', 1.5);
    lineEl.style.strokeDasharray = String(totalLen);
    lineEl.style.strokeDashoffset = String(totalLen);
    svg.appendChild(lineEl);

    var markerEls = points.map(function (p) {
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 3);
      c.setAttribute('fill', '#ffffff'); c.setAttribute('stroke', '#09352e'); c.setAttribute('stroke-width', 1);
      c.style.opacity = 0;
      c.style.transition = 'opacity 0.3s ease';
      svg.appendChild(c);
      return c;
    });

    var trailDots = [0, 1, 2].map(function () {
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('fill', '#85c093');
      c.style.opacity = 0;
      svg.appendChild(c);
      return c;
    });
    var cometDot = document.createElementNS(svgNS, 'circle');
    cometDot.setAttribute('fill', '#09352e');
    cometDot.style.opacity = 0;
    svg.appendChild(cometDot);

    body.appendChild(svg);

    var xticksWrap = document.createElement('div');
    var yticksWrap = document.createElement('div');
    body.appendChild(xticksWrap);
    body.appendChild(yticksWrap);
    var tickFont = { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6c7a79', whiteSpace: 'nowrap', position: 'absolute', opacity: '0', transition: 'opacity 0.3s ease' };
    var tickEls = [];
    [2003, 2008, 2013, 2018, 2023, 2026].forEach(function (yr) {
      var d = document.createElement('div');
      d.textContent = String(yr);
      Object.assign(d.style, tickFont, { left: (xs(yr) / 1000 * 100) + '%', top: (235 / 260 * 100) + '%', transform: 'translate(-50%,0)' });
      xticksWrap.appendChild(d);
      tickEls.push(d);
    });
    [0, 5000, 10000, 14000].forEach(function (v) {
      var d = document.createElement('div');
      d.textContent = v === 0 ? '0' : v.toLocaleString('en-US');
      Object.assign(d.style, tickFont, { left: (x0 / 1000 * 100) + '%', top: (ys(v) / 260 * 100) + '%', transform: 'translate(-100%,-50%)', paddingRight: '6px' });
      yticksWrap.appendChild(d);
      tickEls.push(d);
    });

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ASPECT = (x1 - x0 + 100) / (y1 - y0 + 60);
    var FOLLOW_MS = 5200;
    var ZOOMOUT_MS = 1800;
    var TOTAL_MS = FOLLOW_MS + ZOOMOUT_MS;
    function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function setViewBox(cx, cy, w, h) {
      svg.setAttribute('viewBox', (cx - w / 2).toFixed(2) + ' ' + (cy - h / 2).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2));
    }

    function showFullChart() {
      setViewBox((x0 + x1) / 2, (y0 + y1) / 2 + 15, 1000, 260);
      gridG.querySelectorAll('line').forEach(function (l) { l.style.opacity = 1; });
      tickEls.forEach(function (l) { l.style.opacity = 1; });
      lineEl.style.strokeDashoffset = '0';
      revealRect.setAttribute('width', x1 - x0);
      areaEl.style.opacity = 1;
      markerEls.forEach(function (m) { m.style.opacity = 1; });
      cometDot.style.opacity = 0;
      trailDots.forEach(function (t) { t.style.opacity = 0; });
      countEl.innerHTML = fmtCount(last.value, '2003 → 2026');
    }

    if (reduceMotion) {
      showFullChart();
      return;
    }

    var rafId = null;
    function play() {
      var startTime = performance.now();
      function frame(now) {
        var elapsed = now - startTime;
        if (elapsed <= FOLLOW_MS) {
          var t = Math.min(1, elapsed / FOLLOW_MS);
          var cur = pointAtLenFraction(t);
          lineEl.style.strokeDashoffset = String(totalLen * (1 - t));
          areaEl.style.opacity = 1;
          revealRect.setAttribute('width', Math.max(0, cur.x - x0));
          points.forEach(function (p, idx) { if (p.x <= cur.x + 0.5) markerEls[idx].style.opacity = 1; });
          var zoomH = 55 + t * 55;
          var zoomW = zoomH * ASPECT;
          setViewBox(cur.x, cur.y, zoomW, zoomH);
          cometDot.setAttribute('r', zoomH * 0.05);
          cometDot.setAttribute('cx', cur.x); cometDot.setAttribute('cy', cur.y);
          cometDot.style.opacity = 1;
          trailDots.forEach(function (td, idx) {
            var tt = Math.max(0, t - (idx + 1) * 0.018);
            var tp = pointAtLenFraction(tt);
            td.setAttribute('cx', tp.x); td.setAttribute('cy', tp.y);
            td.setAttribute('r', zoomH * 0.05 * (1 - (idx + 1) * 0.25));
            td.style.opacity = String(0.35 - idx * 0.1);
          });
          countEl.innerHTML = fmtCount(cur.value, String(Math.round(cur.year)));
          rafId = requestAnimationFrame(frame);
        } else if (elapsed <= TOTAL_MS) {
          var zt = easeInOutCubic((elapsed - FOLLOW_MS) / ZOOMOUT_MS);
          var startZoomH = 110, startZoomW = startZoomH * ASPECT;
          var fullCx = (x0 + x1) / 2, fullCy = (y0 + y1) / 2 + 15;
          var cx = last.x + (fullCx - last.x) * zt;
          var cy = last.y + (fullCy - last.y) * zt;
          var w = startZoomW + (1000 - startZoomW) * zt;
          var h = startZoomH + (260 - startZoomH) * zt;
          setViewBox(cx, cy, w, h);
          cometDot.style.opacity = String(1 - zt);
          trailDots.forEach(function (td) { td.style.opacity = String(Math.max(0, 0.3 * (1 - zt))); });
          gridG.querySelectorAll('line').forEach(function (l) { l.style.opacity = zt; });
          tickEls.forEach(function (l) { l.style.opacity = zt; });
          revealRect.setAttribute('width', x1 - x0);
          countEl.innerHTML = fmtCount(last.value, '2003 → 2026');
          rafId = requestAnimationFrame(frame);
        } else {
          showFullChart();
        }
      }
      setViewBox(points[0].x, points[0].y, 55 * ASPECT, 55);
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
