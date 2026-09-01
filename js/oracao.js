/* ============================================================
   Pedido de oracao - envio por Formspree, WhatsApp ou e-mail
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.HESED_CONFIG || {};
  var form = document.getElementById('formOracao');
  if (!form) return;

  var campoNome = document.getElementById('nome');
  var campoPedido = document.getElementById('pedido');
  var status = document.getElementById('statusEnvio');

  function dados() {
    var nome = (campoNome.value || '').trim();
    var pedido = (campoPedido.value || '').trim();
    return { nome: nome, pedido: pedido };
  }

  function valido(d) {
    if (!d.pedido) {
      status.textContent = 'Escreva o seu pedido de oracao.';
      campoPedido.focus();
      return false;
    }
    status.textContent = '';
    return true;
  }

  function texto(d) {
    return 'Pedido de oracao\n\n' + d.pedido +
      (d.nome ? '\n\nDe: ' + d.nome : '');
  }

  /* ---------- WhatsApp ---------- */
  document.getElementById('enviarZap').addEventListener('click', function () {
    var d = dados();
    if (!valido(d)) return;
    window.open('https://wa.me/' + cfg.WHATSAPP + '?text=' + encodeURIComponent(texto(d)),
      '_blank', 'noopener');
  });

  /* ---------- E-mail ---------- */
  document.getElementById('enviarEmail').addEventListener('click', function () {
    var d = dados();
    if (!valido(d)) return;
    window.location.href = 'mailto:' + cfg.EMAIL +
      '?subject=' + encodeURIComponent('Pedido de oracao') +
      '&body=' + encodeURIComponent(texto(d));
  });

  /* ---------- Envio direto (Formspree), se configurado ---------- */
  var botaoSite = document.getElementById('enviarSite');
  if (!cfg.FORMSPREE_ID) {
    if (botaoSite) botaoSite.hidden = true;
  } else if (botaoSite) {
    botaoSite.addEventListener('click', function () {
      var d = dados();
      if (!valido(d)) return;
      botaoSite.disabled = true;
      status.textContent = 'Enviando...';
      fetch('https://formspree.io/f/' + cfg.FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ nome: d.nome, pedido: d.pedido })
      }).then(function (r) {
        botaoSite.disabled = false;
        if (r.ok) {
          form.reset();
          status.textContent = 'Recebemos o seu pedido. As irmas vao rezar por voce.';
        } else {
          status.textContent = 'Nao conseguimos enviar agora. Tente pelo WhatsApp ou e-mail.';
        }
      }).catch(function () {
        botaoSite.disabled = false;
        status.textContent = 'Nao conseguimos enviar agora. Tente pelo WhatsApp ou e-mail.';
      });
    });
  }
})();
