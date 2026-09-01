/* ============================================================
   Instituto Hesed Itajuba - interacoes do site
   1) abertura animada do envelope
   2) copiar a chave PIX
   ============================================================ */
(function () {
  'use strict';

  /* ---------- aviso flutuante ("chave copiada") ---------- */
  var aviso = document.getElementById('aviso');
  var avisoTimer;

  function mostrarAviso(texto) {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () {
      aviso.classList.remove('visivel');
    }, 2600);
  }

  /* ---------- copiar chave PIX ---------- */
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(
        function () { mostrarAviso('Chave PIX copiada!'); },
        function () { copiarAntigo(texto); }
      );
    } else {
      copiarAntigo(texto);
    }
  }

  function copiarAntigo(texto) {
    var campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(campo);
    mostrarAviso(ok ? 'Chave PIX copiada!' : 'Copie a chave: ' + texto);
  }

  document.addEventListener('click', function (ev) {
    if (!(ev.target instanceof Element)) return;
    var alvo = ev.target.closest('[data-copiar]');
    if (!alvo) return;
    ev.preventDefault();
    copiar(alvo.getAttribute('data-copiar'));
  });

  /* ---------- envelope (apenas na pagina inicial) ---------- */
  var palco = document.getElementById('palco');
  var envelope = document.getElementById('envelope');
  var carta = document.getElementById('carta');
  if (!palco || !envelope || !carta) return;

  var aberto = false;

  function abrir(imediato) {
    if (aberto) return;
    aberto = true;
    envelope.classList.add('aberto');
    envelope.setAttribute('aria-expanded', 'true');
    carta.hidden = false;

    var espera = imediato ? 0 : 5400;  // tempo da aba abrir + carta subir (animacao lenta)
    setTimeout(function () {
      requestAnimationFrame(function () {
        palco.classList.add('revelado');
      });
    }, espera);
  }

  function fechar() {
    if (!aberto) return;
    aberto = false;
    palco.classList.remove('revelado');
    envelope.classList.remove('aberto');
    envelope.setAttribute('aria-expanded', 'false');
    setTimeout(function () {
      if (!aberto) carta.hidden = true;
      envelope.focus();
    }, 1100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  envelope.addEventListener('click', function () { abrir(false); });

  var btnFechar = document.getElementById('fecharEnvelope');
  if (btnFechar) btnFechar.addEventListener('click', fechar);

  // chegando de outra pagina com #carta, ja mostra a carta aberta
  if (window.location.hash === '#carta') abrir(true);
})();
