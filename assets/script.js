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

  /* ---------- Multiplier Effect: radial hub-and-spoke particle field ---------- */
  // A dense field of clusters arranged in a ring around one distinct central
  // node (Organization), connected by spokes. Cursor movement repels nearby
  // nodes away, like a force field pushing through the network.
  function buildRadialField() {
    var PALETTE = [
      { fill: '#85c093', stroke: 'none', sw: 0 },          // moss solid
      { fill: 'transparent', stroke: '#09352e', sw: 0.8 }, // hollow ink
      { fill: '#77aa83', stroke: 'none', sw: 0 },          // muted sage
      { fill: 'transparent', stroke: '#117025', sw: 0.9 }, // hollow pine
      { fill: '#09352e', stroke: 'none', sw: 0 },          // forest ink solid
      { fill: '#cad3d2', stroke: 'none', sw: 0 },          // lichen faint
    ];
    var hub = {
      baseX: 0, baseY: 0, x: 0, y: 0, ready: false,
      r: 10, fill: '#09352e', stroke: 'none', sw: 0,
      phase: 0, ampX: 0, ampY: 0, freqX: 0, freqY: 0, vx: 0, vy: 0, isHub: true,
    };
    var particles = [hub];
    var edges = [];
    var clusterCount = 9;
    var R1 = 170;

    for (var c = 0; c < clusterCount; c++) {
      var angle = (360 / clusterCount) * c;
      var rad = (angle * Math.PI) / 180;
      var cx = R1 * Math.cos(rad), cy = R1 * Math.sin(rad);
      var palette = PALETTE[c % PALETTE.length];
      var clusterParticles = [];
      var n = 46 + Math.floor(Math.random() * 14);
      for (var i = 0; i < n; i++) {
        var jr = Math.sqrt(Math.random()) * 58;
        var ja = Math.random() * Math.PI * 2;
        var bx = cx + jr * Math.cos(ja), by = cy + jr * Math.sin(ja);
        var p = {
          baseX: bx, baseY: by, x: 0, y: 0, ready: false,
          r: 1.6 + Math.random() * 1.8,
          fill: palette.fill, stroke: palette.stroke, sw: palette.sw,
          phase: Math.random() * Math.PI * 2,
          ampX: 3 + Math.random() * 4, ampY: 3 + Math.random() * 4,
          freqX: 0.35 + Math.random() * 0.3, freqY: 0.35 + Math.random() * 0.3,
          vx: 0, vy: 0,
        };
        particles.push(p);
        clusterParticles.push(p);
      }
      clusterParticles.slice(0, 4).forEach(function (p) { edges.push({ a: hub, b: p, stroke: '#cad3d2', width: 1, op: 0.55 }); });
      clusterParticles.forEach(function (p, i) {
        var order = clusterParticles
          .map(function (q, j) { return [j === i ? Infinity : Math.hypot(p.baseX - q.baseX, p.baseY - q.baseY), j]; })
          .sort(function (a, b) { return a[0] - b[0]; }).slice(0, 2);
        order.forEach(function (pair) { edges.push({ a: p, b: clusterParticles[pair[1]], stroke: '#cad3d2', width: 0.5, op: 0.4 }); });
      });

      for (var s = 0; s < 2; s++) {
        var sAngle = angle + (s === 0 ? -15 : 15);
        var srad = (sAngle * Math.PI) / 180;
        var scx = (R1 + 108) * Math.cos(srad), scy = (R1 + 108) * Math.sin(srad);
        var satParticles = [];
        var sn = 24 + Math.floor(Math.random() * 10);
        for (var k = 0; k < sn; k++) {
          var sjr = Math.sqrt(Math.random()) * 40;
          var sja = Math.random() * Math.PI * 2;
          var sbx = scx + sjr * Math.cos(sja), sby = scy + sjr * Math.sin(sja);
          var sp = {
            baseX: sbx, baseY: sby, x: 0, y: 0, ready: false,
            r: 1.3 + Math.random() * 1.2,
            fill: 'transparent', stroke: '#9aa6a4', sw: 0.65,
            phase: Math.random() * Math.PI * 2,
            ampX: 2 + Math.random() * 3, ampY: 2 + Math.random() * 3,
            freqX: 0.25 + Math.random() * 0.3, freqY: 0.25 + Math.random() * 0.3,
            vx: 0, vy: 0,
          };
          particles.push(sp);
          satParticles.push(sp);
        }
        var nearest = null, nd = Infinity;
        clusterParticles.forEach(function (q) { var d = Math.hypot(scx - q.baseX, scy - q.baseY); if (d < nd) { nd = d; nearest = q; } });
        satParticles.slice(0, 2).forEach(function (p) { edges.push({ a: nearest, b: p, stroke: '#e5e5e5', width: 0.5, op: 0.3 }); });
        satParticles.forEach(function (p, i) {
          var order = satParticles
            .map(function (q, j) { return [j === i ? Infinity : Math.hypot(p.baseX - q.baseX, p.baseY - q.baseY), j]; })
            .sort(function (a, b) { return a[0] - b[0]; }).slice(0, 2);
          order.forEach(function (pair) { edges.push({ a: p, b: satParticles[pair[1]], stroke: '#e5e5e5', width: 0.4, op: 0.25 }); });
        });
      }
    }

    return { particles: particles, edges: edges };
  }

  function initMultiplierCanvas(canvas) {
    var field = buildRadialField();
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
    var REPEL_RADIUS = 130;
    var REPEL_STRENGTH = 0.9;
    var start = performance.now();

    function draw(now) {
      var t = (now - start) / 1000;
      var w = size.w, h = size.h;
      var scale = Math.min(w, h) / 600;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var mAX = null, mAY = null;
      if (mouse.active) {
        mAX = (mouse.x - w / 2) / scale;
        mAY = (mouse.y - h / 2) / scale;
      }

      var particles = field.particles, edges = field.edges;

      particles.forEach(function (p) {
        var driftX = reduceMotion ? 0 : Math.sin(t * p.freqX + p.phase) * p.ampX;
        var driftY = reduceMotion ? 0 : Math.cos(t * p.freqY + p.phase) * p.ampY;
        var targetX = p.baseX + driftX;
        var targetY = p.baseY + driftY;

        var ax = (targetX - p.x) * SPRING;
        var ay = (targetY - p.y) * SPRING;

        if (mouse.active && !reduceMotion) {
          var dx = p.x - mAX;
          var dy = p.y - mAY;
          var dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.01) {
            var falloff = 1 - dist / REPEL_RADIUS;
            ax += (dx / dist) * falloff * falloff * REPEL_STRENGTH;
            ay += (dy / dist) * falloff * falloff * REPEL_STRENGTH;
          }
        }

        p.vx = (p.vx + ax) * DAMPING;
        p.vy = (p.vy + ay) * DAMPING;
        if (!p.ready) { p.x = targetX; p.y = targetY; p.ready = true; }
        p.x += p.vx;
        p.y += p.vy;
      });

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);

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

      ctx.restore();
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
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

    var W = 0, H = 0, points = [], segLens = [], totalLen = 0;

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
      glowPath.attr('d', lineGen(points));
      linePath.attr('d', lineGen(points));

      gridG.selectAll('line').remove();
      var gridYears = d3.range(alumniData[0].year, last.year + 1);
      gridG.selectAll('line')
        .data(gridYears)
        .join('line')
        .attr('x1', function (yr) { return xScale(yr); })
        .attr('x2', function (yr) { return xScale(yr); })
        .attr('y1', margin.top - 10)
        .attr('y2', H - margin.bottom + 10)
        .attr('stroke', 'rgba(10,42,28,0.22)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '1.5 4');

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
      glowPath.attr('stroke-dasharray', totalLen).attr('stroke-dashoffset', totalLen);
      linePath.attr('stroke-dasharray', totalLen).attr('stroke-dashoffset', totalLen);

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
          glowPath.attr('stroke-dashoffset', totalLen * (1 - t));
          linePath.attr('stroke-dashoffset', totalLen * (1 - t));
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
