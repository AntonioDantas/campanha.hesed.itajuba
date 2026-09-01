/* ============================================================
   Instituto Hesed Itajuba - musica de fundo
   "Regaco Acolhedor" - Ir. Kelly Patricia / Instituto Hesed
   (a cancao mais tocada da Madre)

   Duas fontes, nesta ordem:
     a) assets/musica-fundo.mp3 - se o arquivo existir, e ele que toca;
     b) video oficial no YouTube - usado automaticamente se nao houver mp3.

   O som so comeca depois de um toque do visitante (os navegadores
   bloqueiam audio automatico). Na pagina inicial esse toque e o
   proprio clique que abre o envelope. O estado fica em sessionStorage,
   entao a musica continua ao navegar entre as paginas.
   ============================================================ */
(function () {
  'use strict';

  var MP3    = 'assets/musica-fundo.mp3';
  var YT_ID  = 'mZ9JMuM9LkU';   // Ir. Kelly Patricia - Regaco Acolhedor (canal oficial)
  var VOLUME = 0.35;            // 0 a 1 - discreto, para nao atrapalhar a leitura
  var CHAVE  = 'hesed:musica';
  var TEMPO  = 'hesed:musica-tempo';

  var motor   = null;   // { tocar, pausar, volume, tempo }
  var tocando = false;
  var botao, rotulo;

  function guardar(chave, valor) {
    try { sessionStorage.setItem(chave, valor); } catch (e) {}
  }
  function ler(chave) {
    try { return sessionStorage.getItem(chave); } catch (e) { return null; }
  }

  /* ---------- botao flutuante ---------- */
  function criarBotao() {
    botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'musica-btn';
    botao.id = 'musicaBtn';
    botao.setAttribute('aria-pressed', 'false');
    botao.innerHTML =
      '<span class="musica-icone" aria-hidden="true">' +
        '<i></i><i></i><i></i><i></i>' +
      '</span>' +
      '<span class="musica-texto"></span>';
    rotulo = botao.querySelector('.musica-texto');
    botao.addEventListener('click', function () {
      if (tocando) { pausar(true); } else { tocar(true); }
    });
    document.body.appendChild(botao);
    pintarBotao();
  }

  function pintarBotao() {
    if (!botao) return;
    botao.classList.toggle('tocando', tocando);
    botao.setAttribute('aria-pressed', tocando ? 'true' : 'false');
    var t = tocando ? 'Pausar a musica' : 'Tocar a musica';
    botao.setAttribute('aria-label', t);
    botao.title = t + ' — "Regaço Acolhedor", Ir. Kelly Patrícia';
    if (rotulo) rotulo.textContent = tocando ? 'Música' : 'Ouvir';
  }

  /* ---------- motor A: arquivo mp3 local ---------- */
  function motorMp3(el) {
    return {
      tocar:  function () { var p = el.play(); if (p && p.catch) { p.catch(function () {}); } },
      pausar: function () { el.pause(); },
      volume: function (v) { el.volume = v; },
      tempo:  function (s) {
        if (s === undefined) return el.currentTime || 0;
        try { el.currentTime = s; } catch (e) {}
      }
    };
  }

  /* ---------- motor B: YouTube (sem imagem, so o som) ---------- */
  function criarMotorYouTube(pronto) {
    var caixa = document.createElement('div');
    caixa.className = 'musica-yt';
    caixa.setAttribute('aria-hidden', 'true');
    caixa.innerHTML = '<div id="musicaYT"></div>';
    document.body.appendChild(caixa);

    function iniciar() {
      var player = new window.YT.Player('musicaYT', {
        videoId: YT_ID,
        playerVars: {
          autoplay: 0, controls: 0, disablekb: 1, fs: 0,
          modestbranding: 1, rel: 0, playsinline: 1,
          loop: 1, playlist: YT_ID
        },
        events: {
          onReady: function () {
            player.setVolume(Math.round(VOLUME * 100));
            pronto({
              tocar:  function () { player.playVideo(); },
              pausar: function () { player.pauseVideo(); },
              volume: function (v) { player.setVolume(Math.round(v * 100)); },
              tempo:  function (s) {
                if (s === undefined) {
                  return player.getCurrentTime ? player.getCurrentTime() : 0;
                }
                player.seekTo(s, true);
              }
            });
          },
          onStateChange: function (ev) {
            if (ev.data === window.YT.PlayerState.ENDED) {
              player.seekTo(0, true);
              player.playVideo();
            }
          },
          onError: function () { pausar(false); }
        }
      });
    }

    if (window.YT && window.YT.Player) { iniciar(); return; }
    var anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof anterior === 'function') anterior();
      iniciar();
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }

  /* ---------- escolhe a fonte ---------- */
  function prepararMotor(pronto) {
    if (motor) { pronto(motor); return; }

    var audio = document.createElement('audio');
    audio.src = MP3;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = VOLUME;
    audio.setAttribute('aria-hidden', 'true');
    document.body.appendChild(audio);

    var decidido = false;
    function usarMp3() {
      if (decidido) return;
      decidido = true;
      motor = motorMp3(audio);
      pronto(motor);
    }
    function usarYouTube() {
      if (decidido) return;
      decidido = true;
      if (audio.parentNode) audio.parentNode.removeChild(audio);
      criarMotorYouTube(function (m) { motor = m; pronto(motor); });
    }

    audio.addEventListener('loadedmetadata', usarMp3);
    audio.addEventListener('canplay', usarMp3);
    audio.addEventListener('error', usarYouTube);
    // se o mp3 nao existir ou demorar demais, cai para o YouTube
    setTimeout(function () { if (!decidido) usarYouTube(); }, 2500);
  }

  /* ---------- ligar / desligar ---------- */
  function tocar() {
    prepararMotor(function (m) {
      var guardado = parseFloat(ler(TEMPO) || '0');
      if (guardado > 1) m.tempo(guardado);
      m.volume(VOLUME);
      m.tocar();
      tocando = true;
      guardar(CHAVE, 'on');
      pintarBotao();
    });
  }

  function pausar(porClique) {
    if (motor) {
      guardar(TEMPO, String(motor.tempo() || 0));
      motor.pausar();
    }
    tocando = false;
    if (porClique) guardar(CHAVE, 'off');
    pintarBotao();
  }

  /* ---------- inicio ---------- */
  criarBotao();

  // guarda a posicao ao sair da pagina, para retomar de onde parou
  window.addEventListener('pagehide', function () {
    if (motor && tocando) guardar(TEMPO, String(motor.tempo() || 0));
  });

  // primeiro toque do visitante libera o som (regra dos navegadores)
  function primeiroGesto() {
    document.removeEventListener('pointerdown', primeiroGesto);
    document.removeEventListener('keydown', primeiroGesto);
    if (ler(CHAVE) === 'off') return;
    tocar();
  }

  if (ler(CHAVE) === 'on') {
    // veio de outra pagina com a musica ligada: tenta seguir tocando
    tocar();
    document.addEventListener('pointerdown', primeiroGesto);
    document.addEventListener('keydown', primeiroGesto);
  } else if (ler(CHAVE) !== 'off') {
    var envelopeBtn = document.getElementById('envelope');
    if (envelopeBtn) {
      // na pagina inicial, o clique que abre o envelope tambem comeca a musica
      envelopeBtn.addEventListener('click', function () { tocar(); }, { once: true });
    } else {
      // nas demais paginas, o primeiro toque em qualquer lugar
      document.addEventListener('pointerdown', primeiroGesto);
      document.addEventListener('keydown', primeiroGesto);
    }
  }
})();
