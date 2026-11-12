/* ============================================================
   Z·SPACE 十步链演示 · 页面侧播放器
   演示本体在 demo/zspace-flow.html（iframe，1600×900 固定画布）
   这里只负责：缩放、控制条、剧场模式、进/出视口暂停
   ============================================================ */
(function () {
  var wrap = document.getElementById('flowwrap');
  if (!wrap) return;

  var frame = document.getElementById('flowFrame');
  var stage = document.getElementById('flowStage');
  var dotsBox = document.getElementById('fbDots');
  var btn = document.getElementById('fbPlay');
  var btnFull = document.getElementById('fbFull');
  var label = btn.querySelector('span');

  var W = 1600, ready = false;
  var state = { step: 0, busy: false, played: false, idle: true };

  /* ---------- 10 个步点 ----------
     横向位置对齐演示画布里的节点：X0=384, PITCH=115, NW=100，画布宽 1600 */
  var dots = [];
  for (var i = 0; i < 10; i++) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', '跳到第 ' + (i + 1) + ' 步');
    b.title = '第 ' + String(i + 1).padStart(2, '0') + ' 步';
    b.style.left = ((384 + i * 115 + 50) / 16) + '%';
    (function (idx) {
      b.addEventListener('click', function () { send({ cmd: 'goto', i: idx }); });
    })(i);
    dotsBox.appendChild(b);
    dots.push(b);
  }

  /* ---------- 与 iframe 通信 ---------- */
  function send(m) {
    if (!ready || !frame.contentWindow) return;
    m.zspace = 'cmd';
    frame.contentWindow.postMessage(m, '*');
  }

  frame.addEventListener('load', function () {
    ready = true;
    fit();
    render();
    var q = new URLSearchParams(location.search);
    if (q.has('goto')) setTimeout(function () { send({ cmd: 'goto', i: parseInt(q.get('goto'), 10) || 0 }); }, 600);
    /* 调试用：?scroll=1 定位到演示区（截图/自检） */
    if (q.has('scroll')) {
      document.documentElement.style.scrollBehavior = 'auto';
      setTimeout(function () { window.scrollTo(0, wrap.offsetTop - 80); }, 700);
    }
    /* 调试用：?full=1 直接进剧场 */
    if (q.has('full')) setTimeout(function () { theater(true); }, 500);
  });

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.zspace !== 'state') return;
    state = d;
    render();
  });

  function render() {
    var cur = state.idle ? -1 : (state.step - 1);
    dots.forEach(function (d, i) {
      d.classList.toggle('on', i === cur);
      d.classList.toggle('done', cur >= 0 && i < cur);
    });
    if (state.busy) {
      btn.disabled = true; btn.classList.add('on'); label.textContent = '播放中';
    } else {
      btn.disabled = false; btn.classList.remove('on');
      label.textContent = state.played ? '重播' : '播放';
    }
  }

  btn.addEventListener('click', function () {
    if (btn.disabled) return;
    send({ cmd: 'play' });
  });

  /* ---------- 缩放 ---------- */
  function fit() {
    var k = stage.clientWidth / W;
    frame.style.setProperty('--k', k);
    stage.style.height = Math.round(900 * k) + 'px';
  }
  window.addEventListener('resize', fit);

  /* ---------- 剧场模式 ---------- */
  function theater(on) {
    wrap.classList.toggle('theater', on);
    document.body.classList.toggle('locked', on);
    btnFull.textContent = on ? '✕ 退出' : '⤢ 放大';
    fit();
  }
  btnFull.addEventListener('click', function () {
    theater(!wrap.classList.contains('theater'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wrap.classList.contains('theater')) theater(false);
  });

  /* ---------- 滚出视口就冻结，滚回来接着走 ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) send({ cmd: 'resume' });
        else if (state.busy) send({ cmd: 'pause' });
      });
    }, { threshold: 0.15 }).observe(stage);
  }

  fit();
})();
