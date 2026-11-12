/* ============================================================
   Tech Text —— 参考 reactbits.dev/text-animations/tech-text
   原理：每个字两层叠放
     ・实心层  <i class="s">
     ・虚线层  <i class="d">  ← 用 text-stroke 描边 + 斜向 mask 切成虚线
   鼠标靠近时实心淡出、虚线浮现 → 字母变成虚线矢量路径
   （不用 SVG 重建字形，所以对齐永远准确）
   ============================================================ */
(function () {
  'use strict';
  var els = [].slice.call(document.querySelectorAll('[data-tech]'));
  if (!els.length) return;

  var R = 150;           // 影响半径（px）
  var chars = [];        // {el, cx, cy}

  els.forEach(function (el) {
    if (el.getAttribute('data-tech-done')) return;   // 防止重复执行导致「重字」
    el.setAttribute('data-tech-done', '1');
    var frag = document.createDocumentFragment();

    function wrap(text, into) {
      for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        if (c === ' ' || c === '\n' || c === '\t') {
          into.appendChild(document.createTextNode(c === '\n' ? '' : ' '));
          continue;
        }
        var sp = document.createElement('span');
        sp.className = 'ch';
        var s = document.createElement('i');
        s.className = 's';
        s.textContent = c;
        var d = document.createElement('i');
        d.className = 'd';
        d.setAttribute('aria-hidden', 'true');
        d.textContent = c;
        sp.appendChild(s);
        sp.appendChild(d);
        into.appendChild(sp);
      }
    }

    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        wrap(n.nodeValue, frag);
      } else if (n.nodeName === 'BR') {
        frag.appendChild(document.createElement('br'));
      } else {
        var copy = n.cloneNode(false);   // 保留 em 等标签与样式
        wrap(n.textContent, copy);
        frag.appendChild(copy);
      }
    });

    el.innerHTML = '';
    el.appendChild(frag);
    el.classList.add('tech-on');
  });

  function measure() {
    chars = [];
    [].slice.call(document.querySelectorAll('[data-tech] .ch')).forEach(function (c) {
      var r = c.getBoundingClientRect();
      chars.push({ el: c, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
    });
  }

  var raf = null, mx = -9999, my = -9999;
  function tick() {
    raf = null;
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];
      var dx = c.cx - mx, dy = c.cy - my;
      var on = dx * dx + dy * dy < R * R;
      if (on !== c.el.classList.contains('on')) c.el.classList.toggle('on', on);
    }
  }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    mx = my = -9999;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  // 截图 / 预览用：地址栏加 #hover 让所有字进入虚线态
  if (location.hash === '#hover') {
    [].slice.call(document.querySelectorAll('[data-tech] .ch')).forEach(function (c) {
      c.classList.add('on');
    });
  }

  window.addEventListener('resize', function () { measure(); });
  // 字体加载完成后再量一次，避免位置偏移
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }
  setTimeout(measure, 60);
  setTimeout(measure, 600);

  /* 首屏入场：逐字上浮 */
  [].slice.call(document.querySelectorAll('[data-tech] .ch')).forEach(function (c, i) {
    c.style.animationDelay = (i * 32) + 'ms';
    c.classList.add('in');
  });
})();
