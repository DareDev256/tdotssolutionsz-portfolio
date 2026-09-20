/* Two Bencho blocks (MIT, bencho.dev/licence — Lorenzo Cabra), ported from
   React + framer-motion to vanilla for this static page. Sources with the full
   commentary: ~/Projects/tools/bencho-blocks/blocks/tilt-card and
   blocks/slide-to-confirm. The comments below are Bencho's where they explain
   a number; the token mapping is ours: --ink / --paper / --signal.

   Both are progressive: the tiles stay links and the CTA stays a link when
   motion is reduced or a fine pointer is absent, so nothing here is required
   for the page to do its job. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var mix = function (a, b, t) { return a + (b - a) * t; };

  /* ── one spring, for everything that settles ──────────────────────────
     Frames, not milliseconds. `dt` is in sixtieths of a second and the
     damping is RAISED to it rather than multiplied by it, so a dropped frame
     decays the same energy as the two frames it replaced. The loop parks
     itself the moment the value has settled. 0..100 → (k, d) by damping
     ratio: 50 sits near zeta 0.41, which is where every elastic knob on
     Bencho's bench is tuned. */
  function spring(tune, onFrame) {
    var k = 0.08 + (tune / 100) * 0.16, d = 0.62 + (tune / 100) * 0.2;
    var cur = 0, vel = 0, target = 0, raf = 0, prev = 0;
    function tick(t) {
      var dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1; prev = t;
      vel += (target - cur) * k * dt; vel *= Math.pow(d, dt); cur += vel * dt;
      if (Math.abs(target - cur) < 0.002 && Math.abs(vel) < 0.002) { cur = target; vel = 0; raf = 0; prev = 0; onFrame(cur); return; }
      onFrame(cur); raf = requestAnimationFrame(tick);
    }
    return {
      to: function (v) { target = v; if (!raf) raf = requestAnimationFrame(tick); },
      set: function (v) { cur = target = v; vel = 0; onFrame(cur); },
      get: function () { return cur; }
    };
  }

  /* ══ Tilt ═════════════════════════════════════════════════════════════
     A picture card that gives under the pointer. IT SINKS, IT DOES NOT
     LIFT: the point you are over goes AWAY and the far side comes up. A
     surface that rises to your finger is being displayed to you; one that
     gives under it is being touched. Hence rx = -ny, ry = +nx, the negation
     of the usual pair. The rotation alone is not enough — the darkest point
     tracks the pointer (a dent catches shadow at its deepest) and the rim
     opposite catches light. One pair of sprung numbers is the state; the
     transform, both gradients and the shadow are three readings of it.
     DEPTH 800 against a ~300px card is two and a half card heights back:
     foreshortening as a suggestion, not a fisheye. SINK 14: past ~20 it
     stops being a press and becomes a zoom. */
  var DEPTH = 800, SINK = 14, TILT = 10, SHADE = 60;
  function tilt(tile) {
    /* the frame is what the pointer is measured against and the only thing
       that never moves; perspective lives on it, not the card, so the
       vanishing point stays put in the room */
    var frame = document.createElement('div');
    frame.className = 'tlt';
    frame.style.perspective = DEPTH + 'px';
    tile.parentNode.insertBefore(frame, tile);
    frame.appendChild(tile);
    tile.classList.add('tlt-card');
    var sheen = document.createElement('span');
    sheen.className = 'tlt-sheen'; sheen.setAttribute('aria-hidden', 'true');
    tile.appendChild(sheen);

    var sx = 0, sy = 0, lit = 0;
    function paint() {
      var rx = -sy * TILT, ry = sx * TILT;
      var px = ((sx + 1) / 2) * 100, py = ((sy + 1) / 2) * 100;
      var dark = (SHADE / 100) * 0.55 * lit, rim = (SHADE / 100) * 0.34 * lit;
      /* translateZ FIRST, so the retreat is measured in the room's axes */
      tile.style.transform = 'translateZ(' + (-SINK * lit) + 'px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      /* the shadow TIGHTENS: a thing pressed into a surface has less air
         under it. Growing it on hover is what a card that LIFTS would do. */
      tile.style.boxShadow = '0 ' + mix(20, 9, lit) + 'px ' + mix(44, 24, lit) + 'px -8px rgba(0,0,0,' + mix(0.35, 0.25, lit) + ')';
      sheen.style.backgroundImage =
        'radial-gradient(42% 34% at ' + px + '% ' + py + '%, rgba(0,0,0,' + dark + ') 0%, rgba(0,0,0,0) 100%),' +
        'radial-gradient(52% 42% at ' + (100 - px) + '% ' + (100 - py) + '%, rgba(255,255,255,' + rim + ') 0%, rgba(255,255,255,0) 100%)';
    }
    var X = spring(50, function (v) { sx = v; paint(); });
    var Y = spring(50, function (v) { sy = v; paint(); });
    var L = spring(50, function (v) { lit = v; paint(); });
    /* sprung rather than tracked one-to-one: a card with no weight follows
       the cursor exactly and reads as a texture pinned to the mouse */
    frame.addEventListener('pointermove', function (e) {
      var r = frame.getBoundingClientRect();
      X.to(clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1));
      Y.to(clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1));
      L.to(1);
    });
    /* `out` with a containment test, not `leave`; null counts as outside */
    var off = function () { X.to(0); Y.to(0); L.to(0); };
    frame.addEventListener('pointerout', function (e) { var to = e.relatedTarget; if (!to || !frame.contains(to)) off(); });
    frame.addEventListener('pointercancel', off);
  }
  if (!reduce && fine) document.querySelectorAll('#work .tile').forEach(tilt);

  /* ══ Slide to confirm ═════════════════════════════════════════════════
     A handle you push across a track. It follows the finger exactly, and
     past the mark it takes over and finishes the journey itself.
     THE HANDLE BECOMES THE ANSWER: on commit it unfurls leftward and fills
     the track it was crossing, and the arrow becomes a check. The right edge
     does not move while that happens — x loses what width gains, so the
     right edge is stationary by arithmetic rather than by two animations
     agreeing (two springs measured 6.8px of wobble).
     THE END IS THE COMMIT, and there is no knob: a slide-to-confirm that
     fires at 60% is one you can trigger by knocking the handle, which is the
     one thing the gesture exists to prevent.
     The drag is followed on the WINDOW, bound at the press: capture is
     best-effort and a release anywhere must end the drag. */
  var H = 56, PAD = 4, GRIP = H - PAD * 2, HOLD = 900;
  function slide(a) {
    var href = a.getAttribute('href');
    var label = a.textContent.trim();
    var track = document.createElement('div');
    track.className = 'stc';
    track.setAttribute('role', 'group');
    track.innerHTML =
      '<span class="stc-wash" aria-hidden="true"></span>' +
      '<span class="stc-say"></span>' +
      '<a class="stc-grip" href="' + href + '" aria-label="' + label + ' (slide or press)">' +
        '<svg class="stc-arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '<svg class="stc-check" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' +
      '</a>';
    track.querySelector('.stc-say').textContent = label;
    a.parentNode.replaceChild(track, a);
    var grip = track.querySelector('.stc-grip'), wash = track.querySelector('.stc-wash'), say = track.querySelector('.stc-say');
    var arrow = track.querySelector('.stc-arrow'), check = track.querySelector('.stc-check');
    var x = 0, anchor = 0, shown = 1, done = false, held = false, grab = null, travel = 0;
    function measure() { travel = track.clientWidth - PAD * 2 - GRIP; }
    measure(); addEventListener('resize', measure);
    function paint() {
      var seen = clamp(x, 0, travel);
      var wide = GRIP + clamp(anchor - seen, 0, travel);
      /* the overshoot becomes a SQUASH: the return spring is under-damped
         and the handle is already against its wall, so the energy that
         would carry it past turns into compression instead. 8% is a give;
         14 read as a squish. Origin at the left edge, the wall it hit. */
      var over = Math.max(0, -x), q = 1 - Math.min(0.08, over / 110);
      grip.style.transform = 'translateX(' + seen + 'px) scale(' + q + ',' + (1 / q) + ')';
      grip.style.width = wide + 'px';
      wash.style.width = (seen + GRIP + PAD) + 'px';
      say.style.opacity = clamp(1 - seen / (travel * 0.55), 0, 1);
      arrow.style.opacity = shown * clamp(1 - (seen - travel * 0.55) / (travel * 0.4), 0, 1);
    }
    /* SPEED, deliberately not Bounce: on commit the handle exactly fills the
       track and there is nowhere for an overshoot to go, so the commit sits
       exactly on critical damping. The RETURN is 0.62 of critical, so it
       arrives with something left over — spent as the squash above. */
    var commit = spring(70, function (v) { x = v; paint(); });
    var home = spring(38, function (v) { x = v; paint(); });
    function finish() {
      done = true; track.classList.add('is-done');
      anchor = x; shown = 0; check.style.opacity = 1;
      /* x goes to ZERO, and that is the whole morph: the handle plants
         itself where it arrived and opens out behind it */
      commit.set(x); commit.to(0);
      say.textContent = 'Opening WhatsApp';
      setTimeout(function () { location.href = href; }, HOLD);
    }
    function local(clientX) { var b = track.getBoundingClientRect(); return clientX - b.left; }
    function move(e) {
      if (!held || done) return;
      if (grab === null) grab = local(e.clientX) - x;
      x = clamp(local(e.clientX) - grab, 0, travel); paint();
    }
    function up() {
      if (!held || done) return;
      held = false; track.classList.remove('is-held');
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (x >= travel - 1) { finish(); return; }
      home.set(x); home.to(0);
    }
    grip.addEventListener('pointerdown', function (e) {
      if (done || e.button) return;
      e.preventDefault();
      held = true; grab = null; track.classList.add('is-held');
      try { grip.setPointerCapture(e.pointerId); } catch (_) {}
      /* bound at the press, not in an effect: a fast flick's first move
         must not fall in a gap */
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
    /* the handle stays a real link: Enter/Space/click without a drag still
       goes to WhatsApp, and a screen reader hears one control */
    grip.addEventListener('click', function (e) { if (held || x > 2) e.preventDefault(); });
    grip.addEventListener('dragstart', function (e) { e.preventDefault(); });
    paint();
  }
  if (!reduce) { var cta = document.querySelector('#offer .btn.primary'); if (cta) slide(cta); }
})();
