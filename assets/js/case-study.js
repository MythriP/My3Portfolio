/* Continuum case-study panel: open, close, and play the architecture video. */
(function () {
  'use strict';

  var dialog = document.getElementById('case-continuum');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  var root = document.documentElement;
  var video = dialog.querySelector('video');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    root.style.overflow = 'hidden';
    // muted autoplay, unless the visitor prefers reduced motion; the controls stay available
    if (video && !reduced) {
      video.currentTime = 0;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function close() { dialog.close(); }

  dialog.addEventListener('close', function () {
    root.style.overflow = '';
    if (video) video.pause();
    if (location.hash === '#case-continuum') history.replaceState(null, '', location.pathname + location.search);
  });

  // a click on the backdrop (outside the panel) closes it
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
  dialog.querySelector('.case-close').addEventListener('click', close);

  document.querySelectorAll('[data-case-open="case-continuum"]').forEach(function (btn) {
    btn.addEventListener('click', open);
  });
  if (location.hash === '#case-continuum') open();
})();
