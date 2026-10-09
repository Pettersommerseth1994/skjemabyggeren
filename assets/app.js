(() => {
  const KOMP = Object.fromEntries(KOMPONENTER.map((k) => [k.type, k]));
  const NAV = Object.fromEntries(NAVIGASJON.map((k) => [k.type, k]));
  const LAGRING = 'skjemabyggeren.v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const lagre = () => {
    try {
      localStorage.setItem(LAGRING, JSON.stringify({ skjema, enhet, visSpacing }));
    } catch (e) {}
  };
  const hent = () => {
    try {
      return JSON.parse(localStorage.getItem(LAGRING));
    } catch (e) {
      return null;
    }
  };

  const tomtSkjema = () => ({ tittel: 'Om deg og boligen', prefiks: 'Steg 1 av 4', blokker: [] });
  const lagret = hent();
  let skjema = lagret?.skjema || tomtSkjema();
  let enhet = lagret?.enhet || 'desktop';
  let visSpacing = lagret?.visSpacing ?? true;
  let valgt = null;
  let dra = null;
  const kortTilstand = {};

  const nyBlokkId = () => 'b' + Math.random().toString(36).slice(2, 9);

  function lagBlokk(type, props, barnSpek) {
    const k = KOMP[type];
    const blokk = { id: nyBlokkId(), type, props: { ...k.standard, ...props } };
    if (k.container) {
      const spek = barnSpek ?? k.eksempelBarn ?? [];
      blokk.barn = spek.map((b) => lagBlokk(b.type, b.props, b.barn ?? []));
    }
    return blokk;
  }

  /* ---------------------------------------------------------- Treoperasjoner */
  function finn(id, liste = skjema.blokker, forelder = null) {
    for (let i = 0; i < liste.length; i++) {
      const b = liste[i];
      if (b.id === id) return { blokk: b, liste, indeks: i, forelder };
      if (b.barn) {
        const r = finn(id, b.barn, b);
        if (r) return r;
      }
    }
    return null;
  }
  const listeFor = (listeId) => (listeId === 'rot' ? skjema.blokker : finn(listeId)?.blokk.barn);
  const klon = (b) => ({ ...b, id: nyBlokkId(), props: { ...b.props }, barn: b.barn?.map(klon) });

  /* ---------------------------------------------------------- Biblioteket */
  const GRUPPER = ['Felter', 'Valg', 'Grupper og layout', 'Informasjon', 'Handlinger'];
  const gruppeId = (g) => 'g-' + g.toLowerCase().replace(/[^a-zæøå]+/g, '-');

  function propsForKort(k) {
    const navn = kortTilstand[k.type] || Object.keys(k.tilstander)[0];
    return { ...k.standard, ...k.tilstander[navn] };
  }

  function renderMal(k, props) {
    const barn = (k.eksempelBarn || []).map((b) => `<div>${KOMP[b.type].render({ ...KOMP[b.type].standard, ...b.props }, [], '')}</div>`);
    return k.render(props, barn, '');
  }

  function kortHtml(k, kanDras) {
    const tilstander = Object.keys(k.tilstander);
    const aktiv = kortTilstand[k.type] || tilstander[0];
    const props = propsForKort(k);
    const knapper =
      tilstander.length > 1
        ? `<div class="sb-tilstander" role="group" aria-label="Tilstand for ${k.navn}">${tilstander
            .map((t) => `<button type="button" class="sb-tilstand" data-type="${k.type}" data-tilstand="${esc(t)}" aria-pressed="${t === aktiv}">${esc(t)}</button>`)
            .join('')}</div>`
        : '';
    const forhandsvis = kanDras ? renderMal(k, props) : k.render(props);
    const kode = kanDras ? dslForBlokk(lagBlokk(k.type, props), 'steg', '', new Set()) : '';
    return `<article class="sb-kort" id="kort-${k.type}" data-sok="${esc((k.navn + ' ' + k.type + ' ' + k.kort).toLowerCase())}">
      <header class="sb-kort-topp">
        ${
          kanDras
            ? `<div class="sb-dra" draggable="true" data-type="${k.type}" title="Dra inn i skjemaet"><span class="sb-grep" aria-hidden="true"></span><div><h3 class="sb-kort-navn">${esc(k.navn)}</h3><code class="sb-klasse">${k.type}</code></div></div>
               <button type="button" class="sb-legg-til" data-type="${k.type}">Legg til <span aria-hidden="true">→</span></button>`
            : `<div class="sb-dra sb-dra--fast"><div><h3 class="sb-kort-navn">${esc(k.navn)}</h3><code class="sb-klasse">${k.type}</code></div></div><span class="sb-auto">Tegnes av Sporvalg</span>`
        }
      </header>
      <p class="sb-kort-tekst">${esc(k.kort)}</p>
      ${knapper}
      <div class="sb-forhandsvis fasaden">${forhandsvis}</div>
      ${kode ? `<details class="sb-kode-detaljer"><summary>LecaForms-kode</summary><pre class="sb-kode">${esc(kode)}</pre></details>` : ''}
    </article>`;
  }

  function spacingHtml() {
    const maks = 84;
    const tokens = SPACING.map(
      (s) => `<tr><td><code>--${s.token}</code></td><td class="sb-tall">${s.px} px</td><td><span class="sb-strek" style="width:${(s.px / maks) * 100}%"></span></td></tr>`,
    ).join('');
    const maal = LECA_MAAL.map(([a, b, c]) => `<tr><td>${a}</td><td class="sb-tall">${b}</td><td><code>${c}</code></td></tr>`).join('');
    const gap = GRID_GAP.map(
      ([g, px]) => `<div class="sb-gap-demo"><div class="sb-gap-navn"><code>hb-grid--gap-${g}</code> <span>${px} px</span></div>
        <div class="sb-gap-ramme"><div class="hb-grid hb-grid--gap-${g}">${[1, 2, 3]
          .map(() => `<div class="hb-cell hb-cell--4of12"><div class="sb-gap-celle"></div></div>`)
          .join('')}</div></div></div>`,
    ).join('');
    const bp = BREAKPOINTS.map(([n, px]) => `<li><code>--${n}</code> <span class="sb-tall">${px} px</span></li>`).join('');
    return `<section class="sb-gruppe" id="g-spacing">
      <h2 class="sb-gruppe-tittel">Spacing og grid</h2>
      <article class="sb-kort"><h3 class="sb-kort-navn">Spacing-tokens</h3>
        <p class="sb-kort-tekst">Fra <code>designsystem-tokens</code>. Klassene <code>hb-m--*</code>, <code>hb-mt--*</code>, <code>hb-p--*</code> osv. bruker de samme verdiene.</p>
        <table class="sb-tabell">${tokens}</table></article>
      <article class="sb-kort"><h3 class="sb-kort-navn">Mål i LecaForms</h3>
        <p class="sb-kort-tekst">Fra SCSS-en i <code>lecaforms-lib</code> og Fasaden. Slå på «Vis spacing» i byggeren for å se dem målt i skjemaet.</p>
        <table class="sb-tabell">${maal}</table></article>
      <article class="sb-kort"><h3 class="sb-kort-navn">Gutter i hb-grid</h3>
        <p class="sb-kort-tekst">Hver <code>hb-cell</code> får padding, og rutenettet får like stor negativ marg. Gutteren mellom to celler blir dermed det dobbelte.</p>
        <div class="fasaden">${gap}</div></article>
      <article class="sb-kort"><h3 class="sb-kort-navn">Brytpunkter</h3>
        <ul class="sb-bp">${bp}</ul>
        <p class="sb-kort-tekst">Stegknappene står under hverandre under 375 px, og er maks 375 px brede fra <code>mq-s</code>. Opplastingen viser bare knappen under <code>mq-m</code>.</p></article>
    </section>`;
  }

  function renderBibliotek() {
    const nav = [...GRUPPER, 'Navigasjon', 'Spacing og grid']
      .map((g) => `<a href="#${g === 'Spacing og grid' ? 'g-spacing' : gruppeId(g)}" class="sb-nav-lenke">${g}</a>`)
      .join('');
    const grupper = GRUPPER.map(
      (g) => `<section class="sb-gruppe" id="${gruppeId(g)}"><h2 class="sb-gruppe-tittel">${g}</h2>${KOMPONENTER.filter((k) => k.gruppe === g)
        .map((k) => kortHtml(k, true))
        .join('')}</section>`,
    ).join('');
    const nav2 = `<section class="sb-gruppe" id="${gruppeId('Navigasjon')}"><h2 class="sb-gruppe-tittel">Navigasjon</h2>${NAVIGASJON.map((k) => kortHtml(k, false)).join('')}</section>`;
    $('#bibliotek-nav').innerHTML = nav;
    $('#bibliotek').innerHTML = grupper + nav2 + spacingHtml();
  }

  function oppdaterKort(type) {
    const k = KOMP[type] || NAV[type];
    const gammel = $(`#kort-${type}`);
    const apen = gammel.querySelector('details')?.open;
    gammel.outerHTML = kortHtml(k, !!KOMP[type]);
    if (apen) $(`#kort-${type} details`).open = true;
  }

  /* ---------------------------------------------------------- Byggeren */
  function verktoyHtml(b) {
    const k = KOMP[b.type];
    return `<div class="sb-verktoy">
      <span class="sb-handtak" draggable="true" data-id="${b.id}" title="Dra for å flytte"><span class="sb-grep sb-grep--lys" aria-hidden="true"></span>${esc(k.navn)}</span>
      <button type="button" data-handling="opp" title="Flytt opp" aria-label="Flytt opp">↑</button>
      <button type="button" data-handling="ned" title="Flytt ned" aria-label="Flytt ned">↓</button>
      <button type="button" data-handling="kopi" title="Dupliser" aria-label="Dupliser">⧉</button>
      <button type="button" data-handling="slett" title="Slett" aria-label="Slett">✕</button>
    </div>`;
  }

  /* Her er barn et tillegg, ikke hovedinnholdet: plassholderen vises bare når man drar eller har valgt elementet. */
  const VALGFRIE_BARN = ['Panel', 'Callout', 'GuidePanel', 'BooleanCheckboxField'];

  function renderBlokk(b) {
    const k = KOMP[b.type];
    let barn = [];
    if (k.container) {
      barn = b.barn.map(renderBlokk);
      if (!b.barn.length) barn = [`<div class="sb-tom${VALGFRIE_BARN.includes(b.type) ? ' sb-tom--valgfri' : ''}">Slipp felt her</div>`];
    }
    const innhold = k.render(b.props, barn, k.container ? `data-liste="${b.id}"` : '');
    return `<div class="sb-blokk${valgt === b.id ? ' sb-valgt' : ''}${k.container ? ' sb-blokk--container' : ''}" data-id="${b.id}" data-type="${b.type}">${innhold}${verktoyHtml(b)}</div>`;
  }

  function renderLerret() {
    const side = $('#side');
    side.className = `sb-side fasaden sb-side--${enhet}${visSpacing ? ' sb-side--maal' : ''}`;
    const rot = skjema.blokker.length
      ? skjema.blokker.map(renderBlokk).join('')
      : `<div class="sb-tom sb-tom--rot"><strong>Dra komponenter hit</strong><span>eller trykk «Legg til» på et kort til venstre</span><button type="button" class="sb-eksempel">Last inn et eksempel</button></div>`;
    side.innerHTML = `<div class="sb-kolonne">
      <p class="hb-text--ingress hb-mt--2xl sb-intro" data-maal="intro">Bygg ditt eget skjema her og se hvordan det vil se ut</p>
      <div class="sb-rot" data-liste="rot">${rot}</div>
      <div class="sb-maallag" aria-hidden="true"></div>
    </div>`;
    $('#antall').textContent = tellBlokker(skjema.blokker);
    tegnMaal();
    lagre();
  }

  const tellBlokker = (liste) => liste.reduce((n, b) => n + 1 + (b.barn ? tellBlokker(b.barn) : 0), 0);

  /* ---------------------------------------------------------- Spacing-målene */
  const TOKEN = { 2: '2-xs', 4: 'xs', 5: '', 8: 'sm', 12: 'md', 16: 'sm×2', 20: 'lg', 24: 'md×2', 36: 'xl', 50: '', 52: '2-xl', 65: '', 84: '3-xl' };

  function tegnMaal() {
    const lag = $('.sb-maallag');
    if (!lag) return;
    lag.innerHTML = '';
    if (!visSpacing) return;
    const kolonne = $('.sb-kolonne');
    const base = kolonne.getBoundingClientRect();
    const biter = [];
    const band = (x, y, w, h, tekst, retning = 'v') => {
      if (h < 1 || w < 1) return;
      biter.push(
        `<div class="sb-maal sb-maal--${retning}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><span>${tekst}</span></div>`,
      );
    };
    const etikett = (px) => {
      const r = Math.round(px);
      return TOKEN[r] ? `${r} · ${TOKEN[r]}` : `${r}`;
    };

    const synlige = (el) => el && el.offsetParent !== null && el.getBoundingClientRect().height > 0;

    const rekke = [$('[data-maal="intro"]'), ...$$(':scope > .sb-blokk', $('.sb-rot'))].filter(synlige);
    const forste = rekke[0].getBoundingClientRect();
    band(0, 0, base.width, forste.top - base.top, etikett(forste.top - base.top));
    for (let i = 0; i < rekke.length - 1 && skjema.blokker.length; i++) {
      const a = rekke[i].getBoundingClientRect();
      const b = rekke[i + 1].getBoundingClientRect();
      band(0, a.bottom - base.top, base.width, b.top - a.bottom, etikett(b.top - a.bottom));
    }

    $$('[data-liste]:not([data-liste="rot"])', kolonne).forEach((liste) => {
      const barn = $$('.sb-blokk', liste).filter((b) => b.parentElement.closest('[data-liste]') === liste && synlige(b));
      const lr = liste.getBoundingClientRect();
      const horisontal = liste.matches('.horizontal-layout, .hb-grid');
      for (let i = 0; i < barn.length - 1; i++) {
        const indre = (el) => (horisontal ? el.firstElementChild || el : el).getBoundingClientRect();
        const a = indre(barn[i]);
        const b = indre(barn[i + 1]);
        if (horisontal && Math.abs(a.top - b.top) < 4) {
          const bredde = b.left - a.right;
          band(a.right - base.left, Math.max(a.top, b.top) - base.top, bredde, Math.min(a.height, b.height), etikett(bredde), 'h');
        } else if (b.top >= a.bottom) {
          band(lr.left - base.left, a.bottom - base.top, lr.width, b.top - a.bottom, etikett(b.top - a.bottom));
        }
      }
    });

    lag.innerHTML =
      biter.join('') +
      `<div class="sb-kolonnekant sb-kolonnekant--v"></div><div class="sb-kolonnekant sb-kolonnekant--h"></div><div class="sb-kolonnemaal">${Math.round(base.width)} px</div>`;
  }

  /* ---------------------------------------------------------- Inspektøren */
  const INSP = {
    label: { navn: 'Ledetekst', kontroll: 'tekst' },
    beskrivelse: { navn: 'Beskrivelse', hint: 'fieldDescription', kontroll: 'omraade' },
    verdi: { navn: 'Verdi', kontroll: 'tekst' },
    valgfri: { navn: 'Valgfritt', hint: 'notRequired()', kontroll: 'boks' },
    feil: { navn: 'Feilmelding', hint: 'tom = ingen feil', kontroll: 'tekst' },
    lesemodus: { navn: 'Skrivebeskyttet', kontroll: 'boks' },
    bredde: { navn: 'Bredde', hint: 'bredde(n) / fullBredde()', kontroll: 'velg', valg: [['', 'Standard'], ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => [String(n), `${n} tegn`]), ['full', 'Full bredde']] },
    enhet: { navn: 'Enhet', kontroll: 'tekst' },
    belop: { navn: 'Beløp med tusenskille', hint: 'erBeloep(true)', kontroll: 'boks' },
    ja: { navn: 'Tekst for ja', kontroll: 'tekst' },
    nei: { navn: 'Tekst for nei', kontroll: 'tekst' },
    janeiVerdi: { nokkel: 'verdi', navn: 'Valgt', kontroll: 'velg', valg: [['', 'Ingen'], ['ja', 'Ja'], ['nei', 'Nei']] },
    alternativer: { navn: 'Alternativer', hint: 'ett per linje', kontroll: 'omraade' },
    altBeskrivelser: { navn: 'Beskrivelser', hint: 'alternativ=tekst, én per linje', kontroll: 'omraade' },
    valgtVerdi: { nokkel: 'verdi', navn: 'Valgt', kontroll: 'velgAlternativ' },
    valgteVerdier: { nokkel: 'verdi', navn: 'Valgte', hint: 'ett per linje', kontroll: 'omraade' },
    horisontal: { navn: 'Horisontal', hint: 'css().horizontal()', kontroll: 'boks' },
    outlined: { navn: 'Med ramme', hint: 'css().outlined()', kontroll: 'boks' },
    avkrysset: { nokkel: 'verdi', navn: 'Avkrysset', kontroll: 'boks' },
    fet: { navn: 'Fet alternativtekst', kontroll: 'boks' },
    apen: { navn: 'Åpen', kontroll: 'boks' },
    aktiv: { navn: 'Drar fil over', kontroll: 'boks' },
    filer: { navn: 'Med opplastede filer', kontroll: 'boks' },
    tekst: { navn: 'Tekst', kontroll: 'omraade' },
    punkter: { navn: 'Punktliste', hint: 'ett per linje', kontroll: 'omraade' },
    variant: { navn: 'Variant', kontroll: 'velg' },
    lenkevariant: { nokkel: 'variant', navn: 'Variant', kontroll: 'velg', valg: [['link', 'Lenke'], ['subtle', 'Subtle']] },
    visIkon: { navn: 'Vis ikon', kontroll: 'boks' },
    stor: { navn: 'Stor tittel', kontroll: 'boks' },
    visning: { navn: 'Visning', kontroll: 'velg', valg: [['default', 'Default'], ['liten', 'Liten'], ['stor', 'Stor']] },
    overskrift: { navn: 'Vis overskrift', kontroll: 'boks' },
    visMer: { navn: 'Vis mer-knapp', kontroll: 'boks' },
    stil: { navn: 'Stil', kontroll: 'velg', valg: [['brod', 'Brødtekst'], ['ingress', 'Ingress'], ['h2', 'Mellomtittel']] },
    gap: { navn: 'Gutter', kontroll: 'velg', valg: GRID_GAP.map(([g, px]) => [g, `${g} (${px} px per celle)`]) },
    kolonner: { navn: 'Kolonner', kontroll: 'velg', valg: [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']] },
    ikonId: { navn: 'Ikon', kontroll: 'velg', valg: [['', 'Ingen'], ['add', 'add'], ['arrow-right', 'arrow-right'], ['search', 'search'], ['upload-bottom', 'upload-bottom'], ['bin-1', 'bin-1']] },
  };
  const VARIANTVALG = {
    Panel: [['blue', 'Blå (info)'], ['gray', 'Grå (nøytral)'], ['green', 'Grønn (positiv)'], ['yellow', 'Gul (advarsel)'], ['red', 'Rød (feil)'], ['purple', 'Lilla (veiledning)']],
    Actionbutton: [['standard', 'Standard'], ['prominent', 'Prominent'], ['subtle', 'Subtle'], ['destruktiv', 'Destruktiv']],
  };

  function renderInspektor() {
    const panel = $('#inspektor');
    const funnet = valgt && finn(valgt);
    if (!funnet) {
      panel.hidden = true;
      return;
    }
    const { blokk: b } = funnet;
    const k = KOMP[b.type];
    const p = b.props;
    const felter = [];
    if (k.felt) felter.push({ nokkel: 'feltnavn', navn: 'Feltnavn', hint: 'navnet i datamodellen', kontroll: 'tekst', plassholder: feltnavnFra(p) });
    k.redigerbart.forEach((r) => felter.push({ ...INSP[r], nokkel: INSP[r].nokkel || r }));
    const kontroll = (f) => {
      const id = `insp-${f.nokkel}`;
      const verdi = p[f.nokkel] ?? '';
      const navn = `<label for="${id}">${f.navn}${f.hint ? ` <span class="sb-hint">${esc(f.hint)}</span>` : ''}</label>`;
      if (f.kontroll === 'boks')
        return `<div class="sb-felt sb-felt--boks"><input type="checkbox" id="${id}" data-nokkel="${f.nokkel}"${verdi === true || verdi === 'ja' ? ' checked' : ''}>${navn}</div>`;
      if (f.kontroll === 'omraade') return `<div class="sb-felt">${navn}<textarea id="${id}" data-nokkel="${f.nokkel}" rows="3">${esc(verdi)}</textarea></div>`;
      if (f.kontroll === 'velg' || f.kontroll === 'velgAlternativ') {
        const valg =
          f.kontroll === 'velgAlternativ'
            ? [['', 'Ingen'], ...String(p.alternativer || '').split('\n').filter(Boolean).map((a) => [a.trim(), a.trim()])]
            : f.valg || VARIANTVALG[b.type] || [];
        return `<div class="sb-felt">${navn}<select id="${id}" data-nokkel="${f.nokkel}">${valg
          .map(([v, t]) => `<option value="${esc(v)}"${String(verdi) === v ? ' selected' : ''}>${esc(t)}</option>`)
          .join('')}</select></div>`;
      }
      return `<div class="sb-felt">${navn}<input type="text" id="${id}" data-nokkel="${f.nokkel}" value="${esc(verdi)}"${f.plassholder ? ` placeholder="${esc(f.plassholder)}"` : ''}></div>`;
    };
    const tilstander = Object.keys(k.tilstander);
    panel.innerHTML = `<div class="sb-insp-topp">
        <div><h2 class="sb-insp-tittel">${esc(k.navn)}</h2><code class="sb-klasse">${k.type}</code></div>
        <button type="button" class="sb-lukk" data-lukk aria-label="Lukk egenskaper">✕</button>
      </div>
      ${
        tilstander.length > 1
          ? `<div class="sb-felt"><span class="sb-felt-navn">Tilstand</span><div class="sb-tilstander">${tilstander
              .map((t) => `<button type="button" class="sb-tilstand" data-insp-tilstand="${esc(t)}">${esc(t)}</button>`)
              .join('')}</div></div>`
          : ''
      }
      <div class="sb-insp-felter">${felter.map(kontroll).join('') || '<p class="sb-kort-tekst">Ingen egenskaper å endre. Dra felt inn i containeren.</p>'}</div>`;
    panel.hidden = false;
  }

  /* ---------------------------------------------------------- DSL */
  const VAR = {
    FieldSet: 'fs', Horizontal: 'h', Grid: 'g', IndentedGroup: 'ig', Panel: 'p', GuidePanel: 'gp', Callout: 'c', ReadMore: 'rm',
    Accordion: 'acc', CheckboxGroupField: 'cgf', BooleanCheckboxField: 'f', Actionbutton: 'ab', Link: 'l', VedleggKrav: 'vk',
  };

  function feltnavnFra(p) {
    const ord = String(p.label || p.tekst || 'felt')
      .toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'aa')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(' ')
      .filter((o) => o && !['hva', 'er', 'du', 'din', 'ditt', 'dine', 'har', 'skal', 'til', 'i', 'pa', 'av', 'og', 'det', 'en', 'et', 'som', 'hvor', 'hvilken', 'hvilke', 'med', 'for'].includes(o))
      .slice(0, 3);
    if (!ord.length) return 'felt';
    return ord.map((o, i) => (i ? o[0].toUpperCase() + o.slice(1) : o)).join('');
  }

  function dslForBlokk(b, forelder, inn, brukte, forelderType) {
    const k = KOMP[b.type];
    const v = VAR[b.type] || 'f';
    const inn2 = inn + '    ';
    const kons = k.dslKonstruktor ? k.dslKonstruktor(b.props) : '';
    let uttrykk;
    if (b.type === 'FormattedText') {
      uttrykk = `new FormattedText(${kons})`;
    } else {
      const linjer = k.dsl(b.props, v).map((l) => inn2 + (l.startsWith('//') ? l : l + ';'));
      (b.barn || []).forEach((barn) => linjer.push(inn2 + dslForBlokk(barn, v, inn2, brukte, b.type) + ';'));
      uttrykk = linjer.length ? `new ${b.type}(${kons}${v} => {\n${linjer.join('\n')}\n${inn}})` : `new ${b.type}(${kons}${v} => {})`;
    }
    if (k.felt) {
      let navn = b.props.feltnavn || feltnavnFra(b.props);
      let n = 2;
      const grunn = navn;
      while (brukte.has(navn)) navn = grunn + n++;
      brukte.add(navn);
      const metode = forelderType === 'CheckboxGroupField' ? 'additionalField' : 'field';
      return `${forelder}.${metode}(${q(navn)}, ${uttrykk})`;
    }
    return `${forelder}.element(${uttrykk})`;
  }

  function dslForSkjema() {
    const brukte = new Set();
    const id = feltnavnFra({ label: skjema.tittel }).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    const kropp = skjema.blokker.map((b) => '    ' + dslForBlokk(b, 'steg', '    ', brukte) + ';').join('\n');
    return (
      `// Laget i Skjemabyggeren. Et utkast: feltnavnene må finnes i datamodellen,\n` +
      `// og alternativene til EnumField og EnumListField kommer fra enumene der.\n` +
      `sporvalg.steg(new Steg({id: ${q(id)}, label: ${q(skjema.tittel)}}, steg => {\n${kropp}\n}));\n`
    );
  }

  /* ---------------------------------------------------------- Endringer */
  function endre(fn, { inspektor = true } = {}) {
    fn();
    renderLerret();
    if (inspektor) renderInspektor();
  }

  function leggTil(blokk) {
    const v = valgt && finn(valgt);
    endre(() => {
      if (v && KOMP[v.blokk.type].container && godtar(v.blokk.type, blokk.type)) v.blokk.barn.push(blokk);
      else if (v) v.liste.splice(v.indeks + 1, 0, blokk);
      else skjema.blokker.push(blokk);
      valgt = blokk.id;
    });
    scrollTilBlokk(blokk.id);
  }

  const godtar = (containerType, type) => !KOMP[containerType].godtar || KOMP[containerType].godtar.includes(type);

  function scrollTilBlokk(id) {
    const el = $(`.sb-blokk[data-id="${id}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function eksempel() {
    const b = (type, props, barn) => lagBlokk(type, props, barn);
    skjema = {
      tittel: 'Om deg og boligen',
      prefiks: 'Steg 1 av 4',
      blokker: [
        b('FormattedText', { stil: 'ingress', tekst: 'Vi trenger noen opplysninger om deg og boligen du vil oppgradere.' }),
        b('TextField', { label: 'Hva heter du?' }),
        b('Horizontal', {}, [
          { type: 'TextField', props: { label: 'Postnummer', bredde: '4' } },
          { type: 'TextField', props: { label: 'Poststed' } },
        ]),
        b('BooleanField', { label: 'Bor du i boligen i dag?' }),
        b('EnumField', { label: 'Hva slags bolig er det?', alternativer: 'Enebolig\nRekkehus\nLeilighet' }),
        b('CheckboxGroupField', { label: 'Hva vil du gjøre med boligen?', outlined: true }, [
          { type: 'BooleanCheckboxField', props: { label: 'Trinnfri adkomst', verdi: true }, barn: [{ type: 'IndentedGroup', props: {}, barn: [{ type: 'EnumListField', props: { label: 'Hvor skal du justere terrenget?', alternativer: 'Inngangsparti\nHage\nAnnet område' } }] }] },
          { type: 'BooleanCheckboxField', props: { label: 'Tilpasse badet' }, barn: [] },
        ]),
        b('NumberField', { label: 'Hva vil oppgraderingen koste?', verdi: '350000' }),
        b('Panel', { variant: 'blue', label: 'Godt å vite', tekst: 'Du kan få tilskudd til inntil 50 prosent av kostnadene.' }, []),
        b('ReadMore', { label: 'Hvordan beregner dere tilskuddet?' }),
      ],
    };
    valgt = null;
    renderLerret();
    renderInspektor();
  }

  /* ---------------------------------------------------------- Dra og slipp */
  const indikator = $('#indikator');

  function finnMal(e) {
    let liste = e.target.closest('[data-liste]');
    if (!liste || !$('#side').contains(liste)) return null;
    const type = dra.kilde === 'bibliotek' ? dra.type : finn(dra.id)?.blokk.type;
    if (dra.kilde === 'lerret') {
      const draEl = $(`.sb-blokk[data-id="${dra.id}"]`);
      if (draEl && draEl.contains(liste)) liste = draEl.parentElement.closest('[data-liste]');
    }
    while (liste && liste.dataset.liste !== 'rot') {
      const eier = finn(liste.dataset.liste)?.blokk;
      if (eier && godtar(eier.type, type)) break;
      liste = liste.parentElement.closest('[data-liste]');
    }
    if (!liste) return null;
    const barn = $$('.sb-blokk', liste).filter((b) => b.parentElement.closest('[data-liste]') === liste && b.dataset.id !== dra.id);
    const horisontal = liste.matches('.horizontal-layout, .hb-grid');
    let indeks = barn.length;
    for (let i = 0; i < barn.length; i++) {
      const r = barn[i].getBoundingClientRect();
      const treff = horisontal ? e.clientY < r.top || (e.clientY < r.bottom && e.clientX < r.left + r.width / 2) : e.clientY < r.top + r.height / 2;
      if (treff) {
        indeks = i;
        break;
      }
    }
    return { liste, barn, indeks, horisontal };
  }

  function visIndikator(mal) {
    if (!mal) {
      indikator.hidden = true;
      return;
    }
    const { liste, barn, indeks, horisontal } = mal;
    const lr = liste.getBoundingClientRect();
    let x, y, w, h;
    if (!barn.length) {
      const tom = $(':scope > .sb-tom, .sb-tom', liste);
      const r = (tom || liste).getBoundingClientRect();
      [x, y, w, h] = [r.left, r.top, r.width, r.height];
      indikator.className = 'sb-indikator sb-indikator--flate';
    } else if (horisontal) {
      const ref = barn[Math.min(indeks, barn.length - 1)].getBoundingClientRect();
      x = indeks < barn.length ? ref.left - 2 : ref.right + 1;
      [y, w, h] = [ref.top, 3, ref.height];
      indikator.className = 'sb-indikator';
    } else {
      const ref = indeks < barn.length ? barn[indeks].getBoundingClientRect() : barn[barn.length - 1].getBoundingClientRect();
      y = indeks < barn.length ? ref.top - 2 : ref.bottom + 1;
      [x, w, h] = [lr.left, lr.width, 3];
      indikator.className = 'sb-indikator';
    }
    Object.assign(indikator.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    indikator.hidden = false;
  }

  function slipp(mal) {
    const malListe = listeFor(mal.liste.dataset.liste);
    let indeks = mal.indeks;
    let blokk;
    if (dra.kilde === 'bibliotek') {
      blokk = lagBlokk(dra.type, dra.props);
    } else {
      const fra = finn(dra.id);
      if (!fra) return;
      blokk = fra.blokk;
      fra.liste.splice(fra.indeks, 1);
      if (fra.liste === malListe && fra.indeks < indeks) indeks = Math.min(indeks, malListe.length);
    }
    endre(() => {
      malListe.splice(Math.min(indeks, malListe.length), 0, blokk);
      valgt = blokk.id;
    });
  }

  document.addEventListener('dragstart', (e) => {
    const kilde = e.target.closest?.('.sb-dra[draggable], .sb-handtak');
    if (!kilde) return;
    if (kilde.classList.contains('sb-handtak')) {
      dra = { kilde: 'lerret', id: kilde.dataset.id };
      e.dataTransfer.effectAllowed = 'move';
      const blokkEl = kilde.closest('.sb-blokk');
      e.dataTransfer.setDragImage(blokkEl, 20, 20);
      requestAnimationFrame(() => blokkEl.classList.add('sb-dras'));
    } else {
      const type = kilde.dataset.type;
      dra = { kilde: 'bibliotek', type, props: propsForKort(KOMP[type]) };
      e.dataTransfer.effectAllowed = 'copy';
      const kort = kilde.closest('.sb-kort');
      e.dataTransfer.setDragImage($('.sb-forhandsvis', kort), 24, 24);
    }
    e.dataTransfer.setData('text/plain', dra.type || dra.id);
    document.body.classList.add('sb-drar');
  });

  document.addEventListener('dragend', () => {
    dra = null;
    indikator.hidden = true;
    document.body.classList.remove('sb-drar');
    $$('.sb-dras').forEach((el) => el.classList.remove('sb-dras'));
  });

  const lerret = $('#lerret');
  lerret.addEventListener('dragover', (e) => {
    if (!dra) return;
    const mal = finnMal(e);
    if (!mal) return visIndikator(null);
    e.preventDefault();
    e.dataTransfer.dropEffect = dra.kilde === 'bibliotek' ? 'copy' : 'move';
    visIndikator(mal);
  });
  lerret.addEventListener('dragleave', (e) => {
    if (!lerret.contains(e.relatedTarget)) indikator.hidden = true;
  });
  lerret.addEventListener('drop', (e) => {
    if (!dra) return;
    const mal = finnMal(e);
    e.preventDefault();
    indikator.hidden = true;
    if (mal) slipp(mal);
  });

  /* ---------------------------------------------------------- Klikk og input */
  document.addEventListener('click', (e) => {
    const t = e.target;

    const tilst = t.closest('.sb-tilstand[data-type]');
    if (tilst) {
      kortTilstand[tilst.dataset.type] = tilst.dataset.tilstand;
      oppdaterKort(tilst.dataset.type);
      return;
    }
    const leggTilKnapp = t.closest('.sb-legg-til');
    if (leggTilKnapp) {
      const type = leggTilKnapp.dataset.type;
      leggTil(lagBlokk(type, propsForKort(KOMP[type])));
      return;
    }
    if (t.closest('.sb-eksempel')) return eksempel();

    const inspTilst = t.closest('[data-insp-tilstand]');
    if (inspTilst) {
      const { blokk } = finn(valgt);
      const k = KOMP[blokk.type];
      const nokler = new Set(Object.values(k.tilstander).flatMap(Object.keys));
      const nullstill = Object.fromEntries([...nokler].map((n) => [n, k.standard[n]]));
      endre(() => Object.assign(blokk.props, nullstill, k.tilstander[inspTilst.dataset.inspTilstand]));
      return;
    }
    if (t.closest('[data-lukk]')) {
      valgt = null;
      endre(() => {});
      return;
    }

    const handling = t.closest('.sb-verktoy button');
    if (handling) {
      const id = handling.closest('.sb-blokk').dataset.id;
      const { liste, indeks, blokk } = finn(id);
      const h = handling.dataset.handling;
      endre(() => {
        if (h === 'slett') {
          liste.splice(indeks, 1);
          if (valgt === id) valgt = null;
        } else if (h === 'kopi') {
          const kopi = klon(blokk);
          liste.splice(indeks + 1, 0, kopi);
          valgt = kopi.id;
        } else if (h === 'opp' && indeks > 0) {
          liste.splice(indeks - 1, 0, liste.splice(indeks, 1)[0]);
        } else if (h === 'ned' && indeks < liste.length - 1) {
          liste.splice(indeks + 1, 0, liste.splice(indeks, 1)[0]);
        }
      });
      return;
    }

    const blokkEl = t.closest('.sb-blokk');
    const iLerret = t.closest('#side');

    const trekk = t.closest('.hb-accordion-header, .leca-read-more__button');
    if (trekk) {
      if (blokkEl) {
        const b = finn(blokkEl.dataset.id).blokk;
        valgt = b.id;
        endre(() => (b.props.apen = !b.props.apen));
      } else {
        const el = trekk.closest('.hb-accordion-element');
        if (el) {
          el.classList.toggle('hb-accordion-element--utvidet');
          trekk.setAttribute('aria-expanded', el.classList.contains('hb-accordion-element--utvidet'));
        } else {
          const apen = trekk.getAttribute('aria-expanded') !== 'true';
          trekk.setAttribute('aria-expanded', apen);
          trekk.classList.toggle('leca-read-more__button--open', apen);
          trekk.nextElementSibling.hidden = !apen;
        }
      }
      return;
    }
    const visMer = t.closest('.guidepanel-vis-mer button');
    if (visMer && !blokkEl) {
      const tekst = visMer.closest('.guidepanel').querySelector('.guidepanel-text');
      const lukket = tekst.classList.toggle('collapsed');
      visMer.querySelector('.guidepanel-vis-mer-innhold').innerHTML = `${ikon(lukket ? 'arrow-down-1' : 'arrow-up-1', 'hb-icon--size125')} ${lukket ? 'Vis mer' : 'Vis mindre'}`;
      return;
    }

    if (blokkEl) {
      if (valgt !== blokkEl.dataset.id) {
        valgt = blokkEl.dataset.id;
        $$('.sb-valgt').forEach((el) => el.classList.remove('sb-valgt'));
        blokkEl.classList.add('sb-valgt');
        renderInspektor();
      }
    } else if (iLerret && !t.closest('.sb-redigerbar') && valgt) {
      valgt = null;
      $$('.sb-valgt').forEach((el) => el.classList.remove('sb-valgt'));
      renderInspektor();
    }
  });

  /* Hold musepekeren på den innerste blokken, så bare ett verktøyfelt vises. */
  lerret.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.sb-blokk');
    $$('.sb-hover').forEach((el) => el !== b && el.classList.remove('sb-hover'));
    if (b) b.classList.add('sb-hover');
  });
  lerret.addEventListener('mouseleave', () => $$('.sb-hover').forEach((el) => el.classList.remove('sb-hover')));

  $('#inspektor').addEventListener('input', (e) => {
    const el = e.target;
    const nokkel = el.dataset.nokkel;
    if (!nokkel) return;
    const { blokk } = finn(valgt);
    let verdi = el.type === 'checkbox' ? el.checked : el.value;
    if (nokkel === 'verdi' && blokk.type === 'BooleanField' && el.type === 'checkbox') verdi = el.checked ? 'ja' : '';
    blokk.props[nokkel] = verdi;
    renderLerret();
    if (nokkel === 'alternativer') {
      const sel = $('#insp-verdi');
      if (sel && sel.tagName === 'SELECT') renderInspektor();
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches?.('.sb-redigerbar')) {
      skjema[el.dataset.felt] = el.textContent;
      lagre();
      tegnMaal();
      return;
    }
    if (el.matches?.('input[data-tusen="1"]')) {
      const pos = el.value.length - el.selectionStart;
      el.value = tusen(el.value);
      el.setSelectionRange(el.value.length - pos, el.value.length - pos);
    }
    if (el.matches?.('#sok')) {
      const s = el.value.trim().toLowerCase();
      $$('#bibliotek .sb-kort[data-sok]').forEach((k) => (k.hidden = s && !k.dataset.sok.includes(s)));
      $$('#bibliotek .sb-gruppe').forEach((g) => (g.hidden = s && !$$('.sb-kort[data-sok]', g).some((k) => !k.hidden)));
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && valgt && !e.target.closest('input, textarea, select, [contenteditable]')) {
      e.preventDefault();
      const f = finn(valgt);
      if (f) endre(() => (f.liste.splice(f.indeks, 1), (valgt = null)));
    }
    if (e.key === 'Escape' && valgt && !$('#dsl-dialog').open) {
      valgt = null;
      endre(() => {});
    }
    if (e.key === 'Enter' && e.target.matches('.sb-redigerbar')) {
      e.preventDefault();
      e.target.blur();
    }
  });

  /* ---------------------------------------------------------- Verktøylinja */
  function oppdaterVerktoy() {
    $$('[data-enhet]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.enhet === enhet));
    $('#vis-spacing').checked = visSpacing;
  }
  $$('[data-enhet]').forEach((b) =>
    b.addEventListener('click', () => {
      enhet = b.dataset.enhet;
      oppdaterVerktoy();
      renderLerret();
    }),
  );
  $('#vis-spacing').addEventListener('change', (e) => {
    visSpacing = e.target.checked;
    renderLerret();
  });
  $('#tom').addEventListener('click', () => {
    if (!skjema.blokker.length || confirm('Fjerne alle komponentene fra skjemaet?')) {
      skjema.blokker = [];
      valgt = null;
      endre(() => {});
    }
  });
  const dialog = $('#dsl-dialog');
  $('#vis-dsl').addEventListener('click', () => {
    $('#dsl-kode').textContent = dslForSkjema();
    dialog.showModal();
  });
  $('#kopier-dsl').addEventListener('click', async () => {
    const knapp = $('#kopier-dsl');
    try {
      await navigator.clipboard.writeText($('#dsl-kode').textContent);
      knapp.textContent = 'Kopiert';
    } catch (e) {
      const r = document.createRange();
      r.selectNodeContents($('#dsl-kode'));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      knapp.textContent = 'Merket, trykk ⌘C';
    }
    setTimeout(() => (knapp.textContent = 'Kopier'), 1800);
  });
  $('#lukk-dsl').addEventListener('click', () => dialog.close());

  new ResizeObserver(() => tegnMaal()).observe($('#side'));
  if (document.fonts) document.fonts.ready.then(tegnMaal);

  renderBibliotek();
  oppdaterVerktoy();
  renderLerret();
})();
