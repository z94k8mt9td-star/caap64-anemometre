(function () {
  'use strict';
  var PERIODS = [
    { label: '1 h', ms: 3600000 },
    { label: '2 h', ms: 7200000 },
    { label: '24 h', ms: 86400000 },
    { label: '48 h', ms: 172800000 },
    { label: '7 j', ms: 604800000 }
  ];
  var DEFAULT_INDEX = 2;
  var MAX_POINTS = 240;
  function valid(v) {
    return v !== null && v !== undefined && !isNaN(v);
  }
  function fmt(v) {
    return valid(v) ? (Math.round(v * 10) / 10).toString().replace('.', ',') : '—';
  }
  function parseRows(j) {
    var rows = (j && j.data) || [];
    var pts = [];
    for (var i = 0; i < rows.length; i += 1) {
      var r = rows[i];
      var avg = r[4];
      if (!valid(avg)) continue;
      pts.push({
        t: new Date(String(r[0])).getTime(),
        min: valid(r[3]) ? Number(r[3]) : Number(avg),
        avg: Number(avg),
        max: valid(r[5]) ? Number(r[5]) : Number(avg)
      });
    }
    pts.sort(function (a, b) {
      return a.t - b.t;
    });
    return pts;
  }
  function downsample(pts) {
    if (pts.length <= MAX_POINTS) return pts;
    var stride = Math.ceil(pts.length / MAX_POINTS);
    var out = [];
    for (var i = 0; i < pts.length; i += stride) out.push(pts[i]);
    if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
    return out;
  }
  function timeLabel(t, spanMs) {
    var d = new Date(t);
    var hh = d.getHours();
    var mm = d.getMinutes();
    if (spanMs <= 2 * 3600000) return hh + 'h' + (mm < 10 ? '0' : '') + mm;
    return d.getDate() + '/' + (d.getMonth() + 1) + ' ' + hh + 'h';
  }
  function renderChart(svg, pts, spanMs) {
    var W = 600;
    var H = 220;
    var L = 38;
    var R = 8;
    var T = 10;
    var B = 22;
    var iw = W - L - R;
    var ih = H - T - B;
    var maxV = 10;
    var i;
    for (i = 0; i < pts.length; i += 1) {
      if (pts[i].max > maxV) maxV = pts[i].max;
    }
    maxV = Math.ceil((maxV * 1.15) / 10) * 10;
    var t0 = pts[0].t;
    var t1 = pts[pts.length - 1].t;
    function x(p) {
      return L + ((p.t - t0) / Math.max(1, t1 - t0)) * iw;
    }
    function y(v) {
      return T + ih - (v / maxV) * ih;
    }
    var s = '';
    var g;
    for (g = 0; g <= 4; g += 1) {
      var gy = T + (ih * g) / 4;
      s += '<line x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '" stroke="#1e2d4d" stroke-width="1"/>';
      s += '<text x="' + (L - 6) + '" y="' + (gy + 3) + '" text-anchor="end" class="caap64-axis">' + Math.round((maxV * (4 - g)) / 4) + '</text>';
    }
    for (g = 0; g <= 4; g += 1) {
      var tp = t0 + ((t1 - t0) * g) / 4;
      s += '<text x="' + x({ t: tp }).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="caap64-axis">' + timeLabel(tp, spanMs) + '</text>';
    }
    var bandPts = '';
    for (i = 0; i < pts.length; i += 1) bandPts += x(pts[i]).toFixed(1) + ',' + y(pts[i].max).toFixed(1) + ' ';
    for (i = pts.length - 1; i >= 0; i -= 1) bandPts += x(pts[i]).toFixed(1) + ',' + y(pts[i].min).toFixed(1) + ' ';
    s += '<polygon points="' + bandPts.trim() + '" fill="rgba(56,189,248,0.15)" stroke="none"/>';
    var linePts = '';
    for (i = 0; i < pts.length; i += 1) linePts += x(pts[i]).toFixed(1) + ',' + y(pts[i].avg).toFixed(1) + ' ';
    s += '<polyline points="' + linePts.trim() + '" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    svg.innerHTML = s;
  }
  function summarize(pts) {
    if (!pts.length) return 'Aucune mesure sur la période';
    var maxG = 0;
    var sum = 0;
    for (var i = 0; i < pts.length; i += 1) {
      if (pts[i].max > maxG) maxG = pts[i].max;
      sum += pts[i].avg;
    }
    return 'Rafale max : ' + fmt(maxG) + ' km/h · moyenne : ' + fmt(sum / pts.length) + ' km/h · ' + pts.length + ' mesures';
  }
  function load(root, period) {
    var station = root.getAttribute('data-station') || '986';
    var status = root.querySelector('.caap64-history-status');
    var svg = root.querySelector('.caap64-chart');
    if (status) status.textContent = "Chargement de l'historique…";
    var params = 'start=' + encodeURIComponent(new Date(Date.now() - period.ms).toISOString()) + '&stop=' + encodeURIComponent(new Date().toISOString()) + '&format=json';
    fetch('https://api.openwindmap.org/v1/archive/' + station + '?' + params)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        var pts = downsample(parseRows(j));
        if (!pts.length) {
          if (svg) svg.innerHTML = '';
          if (status) status.textContent = 'Aucune mesure sur cette période';
          return;
        }
        renderChart(svg, pts, period.ms);
        if (status) status.textContent = summarize(pts);
      })
      .catch(function () {
        if (status) status.textContent = 'Historique indisponible, nouvel essai dans 5 min';
      });
  }
  function initRoot(root) {
    var idx = DEFAULT_INDEX;
    var buttons = root.querySelectorAll('.caap64-period');
    function apply(i) {
      idx = i;
      for (var b = 0; b < buttons.length; b += 1) {
        buttons[b].classList.toggle('active', b === i);
      }
      load(root, PERIODS[i]);
    }
    for (var b = 0; b < buttons.length; b += 1) {
      (function (btn, i) {
        btn.addEventListener('click', function () {
          apply(i);
        });
      })(buttons[b], b);
    }
    apply(idx);
    setInterval(function () {
      load(root, PERIODS[idx]);
    }, 300000);
  }
  function init() {
    var roots = document.querySelectorAll('.caap64-history');
    for (var i = 0; i < roots.length; i += 1) initRoot(roots[i]);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
