/* ═══════════════════════════════════════════════════
   Nikah · Touhid & Rukshana — interactions
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     TELEGRAM DELIVERY — fill these two in.

     1. Open Telegram, message @BotFather, send /newbot, follow the
        prompts. It replies with a token like 123456789:AAE...xyz.
     2. Open a chat with YOUR OWN new bot and send it any message
        (a bot cannot write to you until you have written to it —
        this is why a @username alone is not enough).
     3. Visit, in any browser:
          https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
        Find "chat":{"id":123456789 — that number is CHAT_ID.

     ⚠ This token ships to every guest's browser and is readable in
     DevTools. Anyone who finds it can post as this bot or spam you.
     Use a bot created ONLY for this invitation, never a bot with
     access to anything else, and revoke it via @BotFather after the
     wedding. If it gets abused, /revoke in BotFather kills it.
     ═══════════════════════════════════════════════════ */
  var TELEGRAM = {
    token: '8982970902:AAH49l384z3HthSib2A-7be2sIt9WhEqAYA',
    chatId: '1949127313',
    enabled: function () { return this.token && this.chatId; }
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Cover: open the invitation ────────────────── */
  var cover = document.getElementById('cover');
  var openBtn = document.getElementById('openBtn');
  var progress = document.getElementById('progress');
  var opened = false;

  function openInvitation() {
    if (opened) return;
    opened = true;

    // Unlock and pin to the top BEFORE the fade begins. The lock no longer
    // changes document height, so nothing reflows underneath the cover.
    window.scrollTo(0, 0);
    document.body.classList.remove('is-locked');

    cover.classList.add('is-open');
    progress.classList.add('is-visible');

    var hero = document.getElementById('hero');
    if (hero) hero.classList.add('is-ready');

    startReveals();

    // Let the fade finish before the cover stops catching clicks.
    window.setTimeout(function () {
      cover.setAttribute('hidden', '');
    }, 1200);
  }

  openBtn.addEventListener('click', openInvitation);

  /* ── Scroll reveals ────────────────────────────── */
  var revealables = document.querySelectorAll('.reveal');

  revealables.forEach(function (el) {
    var d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--d', d);
  });

  // Held back until the cover lifts, so the hero animates in on arrival
  // rather than playing out unseen behind it.
  function startReveals() {
    if (!('IntersectionObserver' in window) || reduced) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ── Parallax + progress bar (single rAF loop) ─── */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.parallax'));
  var progressBar = document.getElementById('progressBar');
  var ticking = false;

  function frame() {
    var vh = window.innerHeight;

    if (!reduced) {
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;

        var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
        var drift = parseFloat(el.getAttribute('data-drift')) || 0;
        var zoom = parseFloat(el.getAttribute('data-zoom'));
        if (isNaN(zoom)) zoom = 0.07;

        // -1 once the image has climbed past the top, +1 while still below the fold.
        var offset = (rect.top + rect.height / 2 - vh / 2) / vh;
        var clamped = Math.max(-1, Math.min(1, offset));

        var y = (offset * speed * 100).toFixed(2);
        var x = (offset * drift * 100).toFixed(2);
        var scale = (1 + zoom * ((1 - clamped) / 2)).toFixed(4);

        el.style.transform =
          'translate3d(' + x + 'px,' + y + 'px,0) scale(' + scale + ')';
      });
    }

    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - vh;
    var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();

  /* ── Countdown to 24 July 2026, 4:00 PM AST (UTC+3) ── */
  var TARGET = new Date('2026-07-24T16:00:00+03:00').getTime();
  var out = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs')
  };

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    var diff = TARGET - Date.now();

    if (diff <= 0) {
      out.days.textContent = out.hours.textContent = out.mins.textContent = out.secs.textContent = '00';
      var kicker = document.querySelector('.strip .kicker');
      if (kicker) kicker.textContent = 'Alhamdulillah — The Blessed Day';
      window.clearInterval(timer);
      return;
    }

    var s = Math.floor(diff / 1000);
    out.days.textContent = pad(Math.floor(s / 86400));
    out.hours.textContent = pad(Math.floor(s / 3600) % 24);
    out.mins.textContent = pad(Math.floor(s / 60) % 60);
    out.secs.textContent = pad(s % 60);
  }

  var timer = window.setInterval(tick, 1000);
  tick();

  /* ── RSVP ──────────────────────────────────────── */
  var form = document.getElementById('rsvpForm');
  var status = document.getElementById('formStatus');
  var nameInput = document.getElementById('name');
  var errName = document.getElementById('err-name');
  var errAttendance = document.getElementById('err-attendance');

  nameInput.addEventListener('input', function () {
    if (nameInput.value.trim()) {
      errName.textContent = '';
      nameInput.classList.remove('is-invalid');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errName.textContent = '';
    errAttendance.textContent = '';
    nameInput.classList.remove('is-invalid');

    var name = nameInput.value.trim();
    var attendance = form.querySelector('input[name="attendance"]:checked');
    var valid = true;

    if (!name) {
      errName.textContent = 'Please tell us your name.';
      nameInput.classList.add('is-invalid');
      valid = false;
    }
    if (!attendance) {
      errAttendance.textContent = 'Please let us know if you can join us.';
      valid = false;
    }
    if (!valid) {
      (name ? form.querySelector('.field--group') : nameInput)
        .scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }

    var entry = {
      name: name,
      phone: document.getElementById('phone').value.trim(),
      attendance: attendance.value,
      message: document.getElementById('message').value.trim(),
      submittedAt: new Date().toISOString()
    };

    // Keep a local copy regardless — Telegram is delivery, not storage.
    try {
      var all = JSON.parse(localStorage.getItem('nikah-rsvp') || '[]');
      all.push(entry);
      localStorage.setItem('nikah-rsvp', JSON.stringify(all));
    } catch (err) {
      /* storage unavailable — still show the confirmation */
    }

    sendToTelegram(entry);

    var accepted = entry.attendance === 'Joyfully Accepts';
    var first = escapeHtml(entry.name.split(' ')[0]);

    status.textContent = '';
    form.classList.add('is-sent');
    form.innerHTML =
      '<div class="thanks">' +
        '<p class="thanks__ar" lang="ar" dir="rtl">جَزَاكَ ٱللَّٰهُ خَيْرًا</p>' +
        '<h4 class="thanks__title">' + (accepted ? 'We will see you in Madinah' : 'Thank you, dear friend') + '</h4>' +
        '<p class="thanks__text">' +
          (accepted
            ? 'Your RSVP is received, ' + first + '. It would be our honour to have you beside us, in shaa Allah.'
            : 'Your duʿā reaches us further than any journey could, ' + first + '. Thank you.') +
        '</p>' +
      '</div>';
    form.querySelector('.thanks').scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ── Telegram ──────────────────────────────────────
     Fire-and-forget: the guest sees their confirmation whether or not
     the message lands. Anything that fails to send stays queued in
     localStorage under 'nikah-rsvp-unsent' so nothing is ever lost.
     ─────────────────────────────────────────────────── */
  function sendToTelegram(entry) {
    if (!TELEGRAM.enabled()) {
      queueUnsent(entry);
      return Promise.resolve(false);
    }

    var lines = [
      '🕌 *New RSVP — Nikah in Madinah*',
      '',
      '*Name:* ' + tgEscape(entry.name),
      '*Attendance:* ' + (entry.attendance === 'Joyfully Accepts' ? '✅ Joyfully Accepts' : '🤍 With Regret'),
      '*Phone:* ' + (entry.phone ? tgEscape(entry.phone) : '—'),
      '*Message:* ' + (entry.message ? tgEscape(entry.message) : '—'),
      '',
      '_' + new Date(entry.submittedAt).toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }) + ' (Madinah time)_'
    ];

    /* Form-encoded, and deliberately so. A JSON Content-Type is not
       CORS-safelisted, so the browser sends an OPTIONS preflight first —
       and api.telegram.org answers preflights with 501, so the request
       never leaves the page. URLSearchParams keeps it a "simple request":
       no preflight, and Telegram's Access-Control-Allow-Origin:* lets the
       response through. Do not set a Content-Type header here. */
    return fetch('https://api.telegram.org/bot' + TELEGRAM.token + '/sendMessage', {
      method: 'POST',
      body: new URLSearchParams({
        chat_id: TELEGRAM.chatId,
        text: lines.join('\n'),
        parse_mode: 'Markdown',
        disable_web_page_preview: 'true'
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.description || 'Telegram rejected the message');
        return true;
      })
      .catch(function (err) {
        // Never surface this to the guest — it is our problem, not theirs.
        console.warn('RSVP not delivered to Telegram:', err.message);
        queueUnsent(entry);
        return false;
      });
  }

  function queueUnsent(entry) {
    try {
      var q = JSON.parse(localStorage.getItem('nikah-rsvp-unsent') || '[]');
      q.push(entry);
      localStorage.setItem('nikah-rsvp-unsent', JSON.stringify(q));
    } catch (err) { /* storage unavailable */ }
  }

  /* Telegram's Markdown parser breaks on these if a guest types them. */
  function tgEscape(str) {
    return String(str).replace(/([_*`\[\]])/g, '\\$1');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
