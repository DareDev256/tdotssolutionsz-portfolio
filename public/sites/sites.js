(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveals: slide in from the right once
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) { io.observe(el); });

  // counters in the terms strip
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var el = e.target, target = +el.getAttribute('data-count'), pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = pre + target + suf; return; }
      var t0 = performance.now();
      (function tick(now) {
        var p = Math.min((now - t0) / 1100, 1), k = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(k * target) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  // the pinned thread: section height = span * viewport; progress drives message reveal
  var act = document.querySelector('.act');
  if (!act || reduce) { document.querySelectorAll('.msg').forEach(function (m) { m.classList.add('on'); }); return; }
  var span = +act.getAttribute('data-span') || 3;
  var msgs = Array.prototype.slice.call(act.querySelectorAll('.msg'));
  var beats = Array.prototype.slice.call(act.querySelectorAll('.beats li'));
  function size() { act.style.height = (span * 100) + 'svh'; }
  function frame() {
    var r = act.getBoundingClientRect(), vh = innerHeight;
    var p = Math.min(Math.max(-r.top / (r.height - vh), 0), 1);
    msgs.forEach(function (m) { m.classList.toggle('on', p >= +m.getAttribute('data-at')); });
    var b = p < 0.28 ? 1 : p < 0.7 ? 2 : 3;
    beats.forEach(function (li) { li.classList.toggle('on', +li.getAttribute('data-beat') <= b); });
  }
  size(); frame();
  addEventListener('resize', function () { size(); frame(); });
  addEventListener('scroll', frame, { passive: true });
})();
