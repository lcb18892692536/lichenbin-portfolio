/* ============================================================
   作品集 · 交互（零依赖）
   1) 顶栏滚动变实线
   2) 首页：横向幻灯片（滚轮 / ←→ / 空格 / 触摸 / 角落箭头）
      带轻微视差；不循环，到头箭头置灰
   3) 进场动画 / 图片灯箱
   ============================================================ */
(function () {
  'use strict';

  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var pad2 = function (n) { return ('0' + n).slice(-2); };

  /* 截图/自检用：?notrans=1 关掉全部过渡，避免无头浏览器把动画冻在半路 */
  if (/notrans/.test(location.search)) {
    var st = document.createElement('style');
    st.textContent = '*{transition:none!important;animation:none!important}';
    document.head.appendChild(st);
  }

  /* ---------- 顶栏 ---------- */
  var nav = q('.nav');
  function onScroll() {
    if (nav) nav.classList.toggle('solid', (window.scrollY || 0) > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 首页横向幻灯片 ---------- */
  var lane = q('.lane');
  if (lane) {
    var slides = qa('.slide', lane);
    var bgs = qa('.slide .bg', lane);
    var n = slides.length;
    var i = 0;
    var cnt = q('.pager .cnt'), bar = q('.pager .track i');
    var prevB = q('.arrow-l'), nextB = q('.arrow-r');
    var tot = q('.pager .tot');
    if (tot) tot.textContent = pad2(n);
    // 截图用：?notrans=1 关掉过渡，避免无头浏览器把动画冻在半路
    if (/notrans/.test(location.search)) lane.style.transition = 'none';

    function go(k) {
      i = Math.max(0, Math.min(n - 1, k));
      lane.style.transform = 'translate3d(' + (-i * 100) + '%,0,0)';
      if (cnt) cnt.textContent = pad2(i + 1);
      if (bar) bar.style.width = ((i + 1) / n * 100) + '%';
      if (prevB) prevB.disabled = i === 0;
      if (nextB) nextB.disabled = i === n - 1;
      // 视差：当前屏 0，相邻屏按距离偏移
      bgs.forEach(function (bg, idx) {
        bg.style.transform = 'translate3d(' + ((i - idx) * 10) + '%,0,0)';
      });
      onScroll();
    }
    var next = function () { go(i + 1); };
    var prev = function () { go(i - 1); };

    /* 滚轮：竖向滚动映射为横向翻页（ck-design 同款行为） */
    var lock = false, acc = 0;
    function unlock() { lock = false; acc = 0; }
    lane.parentNode.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (lock) { return; }
      acc += e.deltaY || 0;
      if (Math.abs(acc) < 24) return;
      lock = true;
      if (acc > 0) next(); else prev();
      setTimeout(unlock, 900);
    }, { passive: false });

    /* 键盘 */
    window.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ') {
        e.preventDefault(); next();
      } else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') {
        e.preventDefault(); prev();
      } else if (k === 'Home') { e.preventDefault(); go(0); }
      else if (k === 'End') { e.preventDefault(); go(n - 1); }
    });

    /* 触摸 */
    var tx = 0, ty = 0;
    lane.addEventListener('touchstart', function (e) {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    lane.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) next(); else prev();
    }, { passive: true });

    if (prevB) prevB.onclick = prev;
    if (nextB) nextB.onclick = next;

    /* 深链 #3 / 分享用 */
    function fromHash() {
      var m = /^#(\d+)$/.exec(location.hash || '');
      if (m) go(parseInt(m[1], 10) - 1);
    }
    go(0);
    setTimeout(fromHash, 40);
    window.addEventListener('hashchange', fromHash);
  } else {
    onScroll();
  }

  /* ---------- 进场 ---------- */
  var rv = qa('.rv');
  if (rv.length) {
    if (!('IntersectionObserver' in window)) {
      rv.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
      rv.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- 灯箱 ---------- */
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<img alt="">';
  document.body.appendChild(lb);
  var lbImg = q('img', lb);
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.closest('figure')) {
      lbImg.src = t.src; lb.classList.add('on');
    } else if (lb.classList.contains('on')) {
      lb.classList.remove('on'); lbImg.removeAttribute('src');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.classList.contains('on')) {
      lb.classList.remove('on'); lbImg.removeAttribute('src');
    }
  });

  qa('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
