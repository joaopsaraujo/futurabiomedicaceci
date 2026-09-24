(function () {
  "use strict";

  const D = window.DADOS;
  const app = document.getElementById("app");
  const AULAS = {
    "6": { nome: "Aula 6", tema: "Carboidratos e diabetes mellitus" },
    "8": { nome: "Aula 8", tema: "Síndrome plurimetabólica, lipídios e fígado" },
    "9": { nome: "Aula 9", tema: "Eletrólitos e metabolismo do ferro" },
  };
  const ALL_Q = D.questoes;
  const OBJ_Q = ALL_Q.filter((q) => !q.discursiva);

  /* ---------- armazenamento (por navegador) ---------- */
  const KEY = "bioquimica_estudo_v1";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  let store = Object.assign({ respostas: {}, discursivas: {}, filtro: { aula: "todas", modo: "todas", ordem: "seq" } }, load());
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  /* ---------- tema ---------- */
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme(store.tema);
  function isDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.getElementById("themeBtn").addEventListener("click", () => {
    store.tema = isDark() ? "light" : "dark";
    applyTheme(store.tema); save(); route();
  });

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function stats(aula) {
    const qs = OBJ_Q.filter((q) => aula === "todas" || q.aula === aula);
    let feitas = 0, certas = 0;
    qs.forEach((q) => { const r = store.respostas[q.id]; if (r) { feitas++; if (r.ok) certas++; } });
    return { total: qs.length, feitas, certas };
  }
  function setNav(name) {
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
  }
  function stmtLine(t) {
    const cls = t.startsWith("( )") ? ' class="stmt"' : "";
    return `<p${cls}>${t}</p>`;
  }

  /* ---------- HOME ---------- */
  function home() {
    setNav("");
    const cards = Object.keys(AULAS).map((k) => {
      const s = stats(k);
      const pct = s.total ? Math.round((s.feitas / s.total) * 100) : 0;
      return `<a class="card" href="#/resumo/${k}">
        <span class="tag">${AULAS[k].nome}</span>
        <h3>${AULAS[k].tema}</h3>
        <p>${s.feitas}/${s.total} questões feitas · ${s.feitas ? Math.round((s.certas / s.feitas) * 100) + "% de acerto" : "comece pelo resumo"}</p>
        <div class="meter"><i style="width:${pct}%"></i></div>
      </a>`;
    }).join("");
    const g = stats("todas");
    app.innerHTML = `
      <section class="hero">
        <span class="tag">Bioquímica Clínica</span>
        <h1>Resumo + ${ALL_Q.length} questões comentadas</h1>
        <p>Leia o resumo de cada aula, treine com as questões (a resposta aparece na hora, com explicação) e depois faça um simulado para se testar. Seu progresso fica salvo neste navegador.</p>
      </section>
      <div class="grid">${cards}</div>
      <h2 class="section-title">Treinar</h2>
      <div class="grid">
        <a class="card" href="#/questoes"><h3>Questões comentadas</h3><p>Uma por vez, com feedback imediato. Filtre por aula, embaralhe ou refaça só as que errou.</p>
          <div class="meter"><i style="width:${g.total ? (g.feitas / g.total) * 100 : 0}%"></i></div>
          <p class="small" style="margin-top:8px">${g.feitas}/${g.total} feitas · ${g.certas} certas</p></a>
        <a class="card" href="#/simulado"><h3>Simulado</h3><p>Questões sorteadas, sem gabarito até o fim. Bom para testar com seu amigo quem acerta mais.</p></a>
      </div>
      <h2 class="section-title">Fontes</h2>
      <div class="card prose">${D.fontes}</div>`;
  }

  /* ---------- RESUMO ---------- */
  function resumo(aula) {
    setNav("resumo");
    if (!AULAS[aula]) aula = "6";
    const tabs = Object.keys(AULAS).map((k) =>
      `<a class="tab ${k === aula ? "active" : ""}" href="#/resumo/${k}">${AULAS[k].nome}</a>`).join("");
    const partes = D.resumo[aula];
    let html = "";
    partes.forEach((p, i) => { html += `<h2 id="s${i}">${esc(p.titulo)}</h2>` + p.html; });
    const note = aula === "9" ? `<div class="note">Os slides desta aula vieram só com imagens. O resumo segue o conteúdo padrão da disciplina; confira os valores de referência com os da professora.</div>` : "";
    app.innerHTML = `
      <div class="tabs">${tabs}</div>
      <div class="resumo-layout">
        <nav class="toc" id="toc"></nav>
        <article class="prose" id="prose">${note}${html}
          <p style="margin-top:40px"><a class="btn primary" href="#/questoes?aula=${aula}" style="text-decoration:none">Fazer as questões da ${AULAS[aula].nome} →</a></p>
        </article>
      </div>`;
    const prose = document.getElementById("prose");
    prose.querySelectorAll("table").forEach((t) => {
      const w = document.createElement("div"); w.className = "tablewrap"; t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    let toc = "", n = 0;
    prose.querySelectorAll("h2, h3").forEach((h) => {
      if (!h.id) h.id = "h" + n++;
      toc += `<a class="${h.tagName.toLowerCase()}" href="#" data-target="${h.id}">${esc(h.textContent)}</a>`;
    });
    const tocEl = document.getElementById("toc");
    tocEl.innerHTML = toc;
    tocEl.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-target]"); if (!a) return;
      e.preventDefault(); document.getElementById(a.dataset.target).scrollIntoView({ behavior: "smooth" });
    });
    renderExtras(prose);
    window.scrollTo(0, 0);
  }

  function renderExtras(el) {
    if (window.renderMathInElement) {
      try { renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }], throwOnError: false }); } catch (e) {}
    }
    if (window.mermaid) {
      try {
        mermaid.initialize({ startOnLoad: false, theme: isDark() ? "dark" : "neutral", securityLevel: "strict" });
        mermaid.run({ nodes: el.querySelectorAll(".mermaid") });
      } catch (e) {}
    }
  }

  /* ---------- QUESTÕES ---------- */
  let sessao = null; // { lista: [ids], idx }

  function montarLista() {
    const f = store.filtro;
    let qs = ALL_Q.filter((q) => f.aula === "todas" || q.aula === f.aula);
    if (f.modo === "erradas") qs = qs.filter((q) => store.respostas[q.id] && !store.respostas[q.id].ok);
    if (f.modo === "naofeitas") qs = qs.filter((q) => !q.discursiva && !store.respostas[q.id]);
    if (f.ordem === "rand") qs = shuffle(qs);
    sessao = { lista: qs.map((q) => q.id), idx: 0 };
  }

  function questoes(params) {
    setNav("questoes");
    if (params.aula && (AULAS[params.aula] || params.aula === "todas")) {
      if (store.filtro.aula !== params.aula) { store.filtro.aula = params.aula; sessao = null; save(); }
    }
    if (!sessao) montarLista();
    renderQuestao();
  }

  function renderQuestao() {
    const f = store.filtro;
    const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? "selected" : ""}>${label}</option>`;
    const toolbar = `
      <div class="toolbar">
        <label>Aula <select id="fAula">
          ${opt("todas", f.aula, "Todas")}${Object.keys(AULAS).map((k) => opt(k, f.aula, AULAS[k].nome)).join("")}
        </select></label>
        <label>Mostrar <select id="fModo">
          ${opt("todas", f.modo, "Todas")}${opt("naofeitas", f.modo, "Não respondidas")}${opt("erradas", f.modo, "Só as que errei")}
        </select></label>
        <label>Ordem <select id="fOrdem">${opt("seq", f.ordem, "Sequencial")}${opt("rand", f.ordem, "Embaralhada")}</select></label>
        <span class="spacer"></span>
        <button class="btn ghost" id="reset">Zerar progresso</button>
      </div>`;

    if (!sessao.lista.length) {
      app.innerHTML = toolbar + `<div class="card"><h3>Nada por aqui</h3><p>${f.modo === "erradas" ? "Você não tem questões erradas neste filtro. Boa!" : "Todas as questões deste filtro já foram respondidas."}</p></div>`;
      bindToolbar(); return;
    }
    const q = ALL_Q.find((x) => x.id === sessao.lista[sessao.idx]);
    const r = store.respostas[q.id];
    const s = stats(f.aula);
    const pos = sessao.idx + 1, tot = sessao.lista.length;

    let corpo = "";
    if (q.discursiva) {
      const txt = store.discursivas[q.id] || "";
      corpo = `<textarea id="disc" placeholder="Escreva sua resposta antes de ver a esperada...">${esc(txt)}</textarea>
        <div id="discAns"></div>
        <button class="btn" id="showAns">Mostrar resposta esperada</button>`;
    } else {
      corpo = `<div class="opts">` + q.opcoes.map((o) => {
        let cls = "";
        if (r) { if (o.id === q.correta) cls = "correct"; else if (o.id === r.pick) cls = "wrong"; }
        return `<button class="opt ${cls}" data-id="${o.id}" ${r ? "disabled" : ""}><span class="letter">${o.id}</span><span>${o.texto}</span></button>`;
      }).join("") + `</div>`;
      if (r) corpo += feedbackHtml(q, r);
    }

    const dots = sessao.lista.map((id, i) => {
      const rr = store.respostas[id];
      const qq = ALL_Q.find((x) => x.id === id);
      let c = rr ? (rr.ok ? "ok" : "bad") : (qq.discursiva && store.discursivas[id] ? "done" : "");
      return `<button class="dot ${c} ${i === sessao.idx ? "cur" : ""}" data-i="${i}" title="Aula ${qq.aula} · Questão ${qq.n}">${qq.n}</button>`;
    }).join("");

    app.innerHTML = toolbar + `
      <div class="progress"><span>${pos} de ${tot}</span><div class="meter"><i style="width:${(pos / tot) * 100}%"></i></div>
        <span>${s.certas}/${s.feitas} certas</span></div>
      <div class="card qcard">
        <div class="qmeta"><span class="tag">${AULAS[q.aula].nome}${q.topico ? " · " + esc(q.topico) : ""}</span>
          <span class="small">Questão ${q.n}${q.discursiva ? " · discursiva" : ""}</span></div>
        <div class="qtext">${q.enunciado.map(stmtLine).join("")}</div>
        ${corpo}
        <div class="navrow">
          <button class="btn" id="prev" ${sessao.idx === 0 ? "disabled" : ""}>← Anterior</button>
          <button class="btn primary" id="next" ${sessao.idx === tot - 1 ? "disabled" : ""}>Próxima →</button>
        </div>
      </div>
      <div class="dots">${dots}</div>`;

    bindToolbar();
    app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => responder(q, b.dataset.id)));
    app.querySelectorAll(".dot").forEach((b) => b.addEventListener("click", () => { sessao.idx = +b.dataset.i; renderQuestao(); }));
    document.getElementById("prev").onclick = () => { sessao.idx--; renderQuestao(); window.scrollTo(0, 0); };
    document.getElementById("next").onclick = () => { sessao.idx++; renderQuestao(); window.scrollTo(0, 0); };
    if (q.discursiva) {
      const ta = document.getElementById("disc");
      ta.addEventListener("input", () => { store.discursivas[q.id] = ta.value; save(); });
      document.getElementById("showAns").onclick = (e) => {
        document.getElementById("discAns").innerHTML = `<div class="feedback neutral"><b>Resposta esperada</b>${q.resposta}</div>`;
        e.target.remove();
      };
    }
  }

  function feedbackHtml(q, r) {
    const ok = r.ok;
    return `<div class="feedback ${ok ? "ok" : "bad"}"><b>${ok ? "Acertou!" : "Resposta correta: " + q.correta.toUpperCase()}</b>${q.explicacao}</div>`;
  }

  function responder(q, pick) {
    store.respostas[q.id] = { pick, ok: pick === q.correta };
    save(); renderQuestao();
  }

  function bindToolbar() {
    const on = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener("change", () => { store.filtro[key] = el.value; save(); montarLista(); renderQuestao(); });
    };
    on("fAula", "aula"); on("fModo", "modo"); on("fOrdem", "ordem");
    document.getElementById("reset").onclick = () => {
      if (!confirm("Apagar todas as respostas salvas neste navegador?")) return;
      store.respostas = {}; store.discursivas = {}; save(); montarLista(); renderQuestao();
    };
  }

  /* ---------- SIMULADO ---------- */
  let sim = null; // { ids, picks:{}, fim:false, inicio }

  function simulado() {
    setNav("simulado");
    if (!sim) return simuladoConfig();
    if (sim.fim) return simuladoResultado();
    simuladoProva();
  }

  function simuladoConfig() {
    app.innerHTML = `
      <div class="card" style="max-width:560px">
        <h3>Montar simulado</h3>
        <p class="small">Questões objetivas sorteadas. O gabarito só aparece quando você finalizar. Não altera seu progresso das questões comentadas.</p>
        <div class="toolbar" style="margin-top:16px">
          <label>Aula <select id="sAula"><option value="todas">Todas</option>${Object.keys(AULAS).map((k) => `<option value="${k}">${AULAS[k].nome}</option>`).join("")}</select></label>
          <label>Quantidade <select id="sQtd"><option>10</option><option selected>20</option><option>30</option><option value="999">Todas</option></select></label>
        </div>
        <button class="btn primary" id="start">Começar</button>
      </div>`;
    document.getElementById("start").onclick = () => {
      const aula = document.getElementById("sAula").value;
      const qtd = +document.getElementById("sQtd").value;
      const pool = OBJ_Q.filter((q) => aula === "todas" || q.aula === aula);
      sim = { ids: shuffle(pool).slice(0, qtd).map((q) => q.id), picks: {}, fim: false, inicio: Date.now() };
      simulado();
    };
  }

  function simuladoProva() {
    const blocos = sim.ids.map((id, i) => {
      const q = ALL_Q.find((x) => x.id === id);
      return `<div class="card qcard" style="margin-bottom:16px">
        <div class="qmeta"><span class="tag">${i + 1}/${sim.ids.length}</span><span class="small">${AULAS[q.aula].nome}</span></div>
        <div class="qtext">${q.enunciado.map(stmtLine).join("")}</div>
        <div class="opts">${q.opcoes.map((o) => `<button class="opt ${sim.picks[id] === o.id ? "picked" : ""}" data-q="${id}" data-id="${o.id}"><span class="letter">${o.id}</span><span>${o.texto}</span></button>`).join("")}</div>
      </div>`;
    }).join("");
    const feitas = Object.keys(sim.picks).length;
    app.innerHTML = `
      <div class="progress"><span>${feitas} de ${sim.ids.length} respondidas</span><div class="meter"><i style="width:${(feitas / sim.ids.length) * 100}%"></i></div></div>
      ${blocos}
      <div class="navrow"><button class="btn primary" id="finish">Finalizar e ver resultado</button><button class="btn ghost" id="cancel">Cancelar</button></div>`;
    app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      sim.picks[b.dataset.q] = b.dataset.id;
      b.parentNode.querySelectorAll(".opt").forEach((x) => x.classList.toggle("picked", x === b));
      const n = Object.keys(sim.picks).length;
      app.querySelector(".progress span").textContent = `${n} de ${sim.ids.length} respondidas`;
      app.querySelector(".progress .meter i").style.width = (n / sim.ids.length) * 100 + "%";
    }));
    document.getElementById("finish").onclick = () => {
      const faltam = sim.ids.length - Object.keys(sim.picks).length;
      if (faltam && !confirm(`Faltam ${faltam} questões. Finalizar mesmo assim?`)) return;
      sim.fim = true; sim.fimEm = Date.now(); simulado(); window.scrollTo(0, 0);
    };
    document.getElementById("cancel").onclick = () => { sim = null; simulado(); };
  }

  function simuladoResultado() {
    let certas = 0;
    const porAula = {};
    const itens = sim.ids.map((id, i) => {
      const q = ALL_Q.find((x) => x.id === id);
      const pick = sim.picks[id];
      const ok = pick === q.correta;
      if (ok) certas++;
      porAula[q.aula] = porAula[q.aula] || { c: 0, t: 0 };
      porAula[q.aula].t++; if (ok) porAula[q.aula].c++;
      return `<div class="card review-item">
        <div class="qmeta"><span class="tag">${i + 1}</span><span class="small">${AULAS[q.aula].nome} · ${ok ? "✔ certa" : pick ? "✘ errada" : "em branco"}</span></div>
        <div class="qtext">${q.enunciado.map(stmtLine).join("")}</div>
        <div class="opts">${q.opcoes.map((o) => {
          const cls = o.id === q.correta ? "correct" : o.id === pick ? "wrong" : "";
          return `<div class="opt ${cls}"><span class="letter">${o.id}</span><span>${o.texto}</span></div>`;
        }).join("")}</div>
        <div class="feedback ${ok ? "ok" : "bad"}"><b>Gabarito: ${q.correta.toUpperCase()}</b>${q.explicacao}</div>
      </div>`;
    }).join("");
    const pct = Math.round((certas / sim.ids.length) * 100);
    const min = Math.max(1, Math.round((sim.fimEm - sim.inicio) / 60000));
    const detalhe = Object.keys(porAula).sort().map((k) => `${AULAS[k].nome}: ${porAula[k].c}/${porAula[k].t}`).join(" · ");
    app.innerHTML = `
      <div class="card result">
        <span class="tag">Resultado</span>
        <div class="big">${pct}%</div>
        <p>${certas} de ${sim.ids.length} certas em ${min} min</p>
        <p class="small">${detalhe}</p>
        <div class="navrow" style="justify-content:center;margin-top:16px">
          <button class="btn primary" id="again">Novo simulado</button>
        </div>
      </div>
      <h2 class="section-title">Correção</h2>
      ${itens}`;
    document.getElementById("again").onclick = () => { sim = null; simulado(); };
  }

  /* ---------- roteador ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [path, query] = h.split("?");
    const params = Object.fromEntries(new URLSearchParams(query || ""));
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "resumo") resumo(parts[1] || "6");
    else if (parts[0] === "questoes") questoes(params);
    else if (parts[0] === "simulado") simulado();
    else home();
  }
  window.addEventListener("hashchange", () => { route(); if (!location.hash.startsWith("#/questoes")) window.scrollTo(0, 0); });
  route();
})();
