/* ===== Configurações (fáceis de alterar) ===== */
const CONFIG = {
  whatsapp: '5521995665116',   // número do WhatsApp
  abre: 10,                    // horário de abertura (h)
  fecha: 19,                   // horário de fechamento (h)
  diasAbertos: [1, 2, 3, 4, 5, 6] // 0=dom ... 6=sáb (CONFIRMAR com a clínica)
};
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const waLink = txt => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;

/* Botões de WhatsApp com mensagem contextual */
document.querySelectorAll('[data-wa]').forEach(a => a.href = waLink(a.dataset.wa));
document.getElementById('horarioTxt').textContent = `${CONFIG.abre}h às ${CONFIG.fecha}h`;
document.getElementById('ano').textContent = new Date().getFullYear();

/* Navbar muda ao rolar */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* Fecha o menu mobile ao clicar em um link */
document.querySelectorAll('#menu .nav-link').forEach(l => l.addEventListener('click', () => {
  const m = document.getElementById('menu');
  if (m.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(m).hide();
}));

/* Scroll-spy */
const links = [...document.querySelectorAll('.nav-link')];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

/* Animação de entrada + contadores (apenas dados reais: 5,0 e 2) */
const contar = el => {
  const to = +el.dataset.to, dec = +(el.dataset.dec || 0);
  if (reduzir) { el.textContent = to.toFixed(dec).replace('.', ','); return; }
  const t0 = performance.now();
  const passo = t => { const p = Math.min((t - t0) / 1200, 1);
    el.textContent = (to * p).toFixed(dec).replace('.', ','); if (p < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
};
const rev = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  e.target.querySelectorAll('.count').forEach(contar);
  if (e.target.classList.contains('count')) contar(e.target);
  rev.unobserve(e.target);
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => rev.observe(el));

/* Brilho que segue o mouse (apenas desktop) */
const gc = document.querySelector('.glow-cursor');
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduzir) {
  addEventListener('mousemove', e => { gc.style.opacity = 1; gc.style.left = e.clientX + 'px'; gc.style.top = e.clientY + 'px'; });
}

/* Inclinação 3D dos cards de serviço */
if (matchMedia('(hover:hover)').matches && !reduzir) {
  document.querySelectorAll('.tilt').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    c.addEventListener('mouseleave', () => c.style.transform = '');
  });
}

/* Partículas leves no hero */
(() => {
  const cv = document.getElementById('particulas'); if (!cv || reduzir) return;
  const ctx = cv.getContext('2d'); let w, h, ps = [];
  const ajusta = () => { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight;
    ps = Array.from({ length: w < 600 ? 22 : 48 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, v: Math.random() * .3 + .1 })); };
  ajusta(); addEventListener('resize', ajusta);
  (function loop() {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = 'rgba(201,148,138,.5)';
    ps.forEach(p => { p.y -= p.v; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill(); });
    requestAnimationFrame(loop);
  })();
})();

/* Indicador Aberto/Fechado (America/Sao_Paulo) */
(() => {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false, weekday: 'short' }).formatToParts(new Date());
  const hora = +partes.find(p => p.type === 'hour').value % 24;
  const dia = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(partes.find(p => p.type === 'weekday').value);
  const aberto = CONFIG.diasAbertos.includes(dia) && hora >= CONFIG.abre && hora < CONFIG.fecha;
  const s = document.getElementById('status');
  s.textContent = aberto ? 'Aberto agora' : 'Fechado agora';
  s.classList.add(aberto ? 'open' : 'closed');
})();

/* Filtro da galeria + lightbox */
document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); b.classList.add('active');
  document.querySelectorAll('.gi').forEach(g => g.classList.toggle('hide', b.dataset.f !== 'all' && g.dataset.cat !== b.dataset.f));
}));
const lb = new bootstrap.Modal(document.getElementById('lightbox'));
document.querySelectorAll('.gi img').forEach(img => {
  img.tabIndex = 0;
  const abrir = () => { const l = document.getElementById('lbImg'); l.src = img.src; l.alt = img.alt; lb.show(); };
  img.addEventListener('click', abrir);
  img.addEventListener('keydown', e => { if (e.key === 'Enter') abrir(); });
});

/* Formulário de agendamento -> WhatsApp */
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, campos = ['nome', 'proc', 'per'].map(id => f.querySelector('#' + id));
  let ok = true;
  campos.forEach(c => { const v = c.value.trim().length >= (c.id === 'nome' ? 2 : 1); c.classList.toggle('is-invalid', !v); if (!v) ok = false; });
  if (!ok) return;
  const [nome, proc, per] = campos.map(c => c.value.trim());
  window.open(waLink(`Olá! Meu nome é ${nome}. Vi o site e gostaria de agendar uma avaliação de ${proc.toLowerCase()}. Melhor período: ${per.toLowerCase()}.`), '_blank', 'noopener');
});