(function () {
  'use strict';
  var COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  var BFT = [
    [1, 'Calme', '#94a3b8'],
    [5, 'Très légère brise', '#7dd3fc'],
    [11, 'Légère brise', '#38bdf8'],
    [19, 'Jolie brise', '#34d399'],
    [28, 'Bonne brise', '#a3e635'],
    [38, 'Vent frais', '#fde047'],
    [49, 'Vent fort', '#fbbf24'],
    [61, 'Grand frais', '#fb923c'],
    [74, 'Coup de vent', '#f87171'],
    [88, 'Fort coup de vent', '#ef4444'],
    [102, 'Tempête', '#dc2626'],
    [117, 'Violente tempête', '#b91c1c'],
    [Infinity, 'Ouragan', '#7f1d1d']
  ];
  function valid(h) {
    return h !== null && h !== undefined && !isNaN(h);
  }
  function dir(h) {
    if (!valid(h)) return '—';
    var x = ((h % 360) + 360) % 360;
    return COMPASS[Math.round(x / 22.5) % 16];
  }
  function bft(kmh) {
    if (!valid(kmh)) return { label: '—', color: '#94a3b8' };
    for (var i = 0; i < BFT.length; i += 1) {
      if (kmh < BFT[i][0]) return { force: i, label: 'Force ' + i + ' · ' + BFT[i][1], color: BFT[i][2] };
    }
    return { force: 12, label: 'Force 12 · Ouragan', color: '#7f1d1d' };
  }
  function fmt(v) {
    if (!valid(v)) return '—';
    return (Math.round(v * 10) / 10).toString().replace('.', ',');
  }
  function ago(iso) {
    if (!iso) return '—';
    var s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 10) return "à l'instant";
    if (s < 60) return 'il y a ' + s + ' s';
    var m = Math.floor(s / 60);
    if (m < 60) return 'il y a ' + m + ' min';
    var h = Math.floor(m / 60);
    return 'il y a ' + h + ' h';
  }
  function setText(root, sel, v) {
    var el = root.querySelector(sel);
    if (el) el.textContent = v;
  }
  function tick(root) {
    var station = root.getAttribute('data-station') || '986';
    fetch('https://api.openwindmap.org/v1/live-with-meta/' + station)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        var d = j.data || {};
        var m = d.measurements || {};
        var heading = m.wind_heading;
        var avg = m.wind_speed_avg;
        var arrow = root.querySelector('.caap64-arrow');
        if (arrow) {
          var deg = valid(heading) ? heading + 180 : 0;
          arrow.setAttribute('transform', 'rotate(' + deg + ' 50 50)');
        }
        setText(root, '.caap64-avg', fmt(avg));
        setText(root, '.caap64-min', fmt(m.wind_speed_min));
        setText(root, '.caap64-max', fmt(m.wind_speed_max));
        setText(root, '.caap64-dir-label', dir(heading));
        setText(root, '.caap64-deg', valid(heading) ? Math.round(heading) + '°' : '—');
        setText(root, '.caap64-opp', valid(heading) ? dir(heading + 180) : '—');
        var b = bft(avg);
        var bftEl = root.querySelector('.caap64-bft');
        if (bftEl) {
          bftEl.textContent = b.label;
          bftEl.style.color = b.color;
        }
        var st = (d.status && d.status.state) || '';
        setText(
          root,
          '.caap64-state',
          st === 'on' ? 'Station en ligne' : st === 'off' ? 'Station hors ligne' : 'État inconnu',
        );
        setText(root, '.caap64-date', m.date ? new Date(m.date).toLocaleString('fr-FR') : '—');
        setText(root, '.caap64-ago', ago(m.date));
      })
      .catch(function () {
        setText(root, '.caap64-meta', 'Données indisponibles, nouvel essai dans 60 s');
      });
  }
  function init() {
    var roots = document.querySelectorAll('.caap64-wind');
    for (var i = 0; i < roots.length; i += 1) {
      (function (root) {
        tick(root);
        setInterval(function () {
          tick(root);
        }, 60000);
      })(roots[i]);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
