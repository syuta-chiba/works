/* 読まれ方の計測。メールのリンク(?r=目印)から開かれたページで、開いた・どこまで読んだ・どこを押した・どのくらいいたか を記録する。
   目印は相手ごとの記号で、名前やアドレスは含まない。同じタブでは同じ記録を 1 回だけ送る。 */
(function () {
  var API = 'https://160-251-215-139.sslip.io/lab/v';
  var page = document.documentElement.getAttribute('data-page') || 'works';
  var r = '';
  try {
    var q = new URLSearchParams(location.search);
    r = (q.get('r') || '').replace(/[^0-9a-f]/g, '').slice(0, 10);
    if (r) { sessionStorage.setItem('r', r); } else { r = sessionStorage.getItem('r') || ''; }
  } catch (e) {}
  window.__rid = r;
  function send(ev) {
    try {
      var k = 'v:' + page + ':' + ev;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch (e) {}
    new Image().src = API + '?p=' + page + '&r=' + r + '&e=' + encodeURIComponent(ev) + '&t=' + Date.now();
  }
  window.__track = send;
  send('view');
  /* 同じサイト内のリンクに目印を引き継ぐ(回遊も同じ人として数える) */
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (r && h && h.indexOf('://') < 0 && h.indexOf('mailto:') !== 0 && h.charAt(0) !== '#') {
      a.setAttribute('href', h + (h.indexOf('?') < 0 ? '?' : '&') + 'r=' + r);
    }
  });
  /* どこまで読んだか(25/50/75/100%) */
  function depth() {
    var d = document.documentElement, h = d.scrollHeight - innerHeight;
    var p = h <= 0 ? 100 : Math.round((scrollY / h) * 100);
    [25, 50, 75, 100].forEach(function (m) { if (p >= m - 2) send('depth' + m); });
  }
  addEventListener('scroll', depth, { passive: true });
  setTimeout(depth, 1500);
  /* どのくらいいたか(画面に出ている時間だけ数える) */
  var shown = 0, last = Date.now();
  setInterval(function () {
    var now = Date.now();
    if (document.visibilityState === 'visible') shown += now - last;
    last = now;
    [10, 30, 60, 180].forEach(function (s) { if (shown >= s * 1000) send('sec' + s); });
  }, 2000);
  /* どの欄が読まれたか(data-sec の欄までスクロールした) */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) send('sec:' + e.target.getAttribute('data-sec')); });
    }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });   /* 欄の上端が画面の 6 割の位置まで来たら(縦に長い欄でも数えられるように) */
    window.__observe = function (el) { io.observe(el); };
    document.querySelectorAll('[data-sec]').forEach(function (el) { io.observe(el); });
  }
  /* どこを押したか(data-t が付いたリンク・ボタン) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-t]');
    if (t) send('click:' + t.getAttribute('data-t'));
  }, true);
})();
