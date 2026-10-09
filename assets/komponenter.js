/* Komponentene i LecaForms, slik rendererne i lecaforms-lib tegner dem med
   Fasaden (Husbankens designsystem 26.0.1). Hver komponent har:
     standard     egenskapene den starter med
     tilstander   forhåndsvalg, som i Storybook; hvert er en lapp over standard
     redigerbart  feltene inspektøren viser i byggeren
     render       markup, samme klasser og struktur som Angular-rendereren
     dsl          LecaForms-koden som lager elementet
   Containere tar imot barn: render(p, barn, liste) får barna som ferdige
   <div>-er og legger liste-attributtet på elementet som holder dem. */

let lopenr = 0;
const nyId = (prefiks) => `${prefiks}-${++lopenr}`;

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const ikon = (navn, klasse = '') => `<span class="hb-icon ${klasse}" aria-hidden="true">${IKON[navn] || ''}</span>`;

const tusen = (v) => {
  const tall = String(v ?? '').replace(/\D/g, '');
  return tall ? tall.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : '';
};

const valgfriTekst = (p) => (p.valgfri ? '<span class="hb-text--regular">&nbsp;(valgfritt)</span>' : '');

/* hb-felt: rammen rundt alle felt. Feilmeldingen ligger nederst, og
   hb-felt--med-feil gir den røde streken til venstre. */
function hbFelt(innhold, p, klasser = '') {
  const feil = p.feil
    ? `<p class="hb-felt-feilmelding"><span class="hb-screenreader-only">Feilmelding: </span>${esc(p.feil)}</p>`
    : '';
  return `<div class="hb-felt ${klasser}${p.feil ? ' hb-felt--med-feil' : ''}">${innhold}<div aria-live="polite">${feil}</div></div>`;
}

function labelOgBeskrivelse(id, p, labelKlasse = 'hb-label-text') {
  return (
    `<div class="hb-label"><label class="${labelKlasse}" for="${id}">${esc(p.label)}${valgfriTekst(p)}</label></div>` +
    (p.beskrivelse ? `<p class="hb-felt-beskrivelse" id="${id}-beskrivelse">${esc(p.beskrivelse)}</p>` : '')
  );
}

function breddeKlasse(p) {
  if (p.bredde === 'full') return 'hb-inputfelt--fullbredde';
  if (p.bredde) return `hb-inputfelt--${p.bredde}tegn`;
  return '';
}

const alternativer = (p) =>
  String(p.alternativer || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/* Radio- og avkrysningslister: hb-fieldset med legend, beskrivelse og hb-feltliste. */
function valgliste(p, { type, klasse, valgt, beskrivelser = {}, grupper = null, beskrivelseKlasse = 'hb-label-alternativ-tekst' }) {
  const id = nyId(type === 'radio' ? 'radio' : 'avkryss');
  const inputKlasse = type === 'radio' ? 'hb-radiobutton' : 'hb-checkbox';
  const legend = `<div class="hb-legend"><span class="hb-legend-tekst" id="${id}-legend">${esc(p.label)}${p.valgfri ? ' <span class="hb-text--regular">(valgfritt)</span>' : ''}</span></div>`;
  const besk = p.beskrivelse ? `<p class="hb-felt-beskrivelse">${esc(p.beskrivelse)}</p>` : '';
  const li = (tekst, i) => {
    const iid = `${id}-${i}`;
    const sjekket = valgt.includes(tekst) ? ' checked' : '';
    const b = beskrivelser[tekst]
      ? beskrivelseKlasse === 'leca'
        ? `<p class="hb-felt-beskrivelse--alternativ">${esc(beskrivelser[tekst])}</p>`
        : `<div class="${type === 'radio' ? 'hb-label-alternativ-tekst' : 'hb-label-alternativ-tekst-checkbox'}"><p class="hb-felt-beskrivelse--alternativ">${esc(beskrivelser[tekst])}</p></div>`
      : '';
    const merke = `<div class="hb-label"><label class="hb-label-tekst" for="${iid}">${esc(tekst)}</label>${type === 'radio' ? b : ''}</div>`;
    return `<li><input class="${inputKlasse}" type="${type}" id="${iid}" name="${id}"${sjekket}${p.feil ? ' aria-invalid="true"' : ''}${p.lesemodus ? ' disabled' : ''}>${merke}${type === 'radio' ? '' : b}</li>`;
  };
  const ul = (liste, start = 0) =>
    `<ul class="hb-feltliste${p.horisontal ? ' hb-feltliste--horisontal' : ''}">${liste.map((t, i) => li(t, start + i)).join('')}</ul>`;
  let lister;
  if (grupper) {
    let i = 0;
    lister = grupper
      .map((g) => {
        const html = `<div class="hb-radio-group__header leca-radio-gruppe">${esc(g.navn)}</div>` + ul(g.alternativer, i);
        i += g.alternativer.length;
        return html;
      })
      .join('');
  } else {
    lister = ul(alternativer(p));
  }
  const fieldset = `<fieldset class="hb-felt"><legend class="hb-screenreader-only">${esc(p.label)}</legend>${lister}</fieldset>`;
  if (type === 'checkbox') {
    return hbFelt(`<div class="hb-fieldset">${legend}</div>${besk}${fieldset}`, p, klasse);
  }
  return hbFelt(`<div class="hb-fieldset">${legend}${besk}${fieldset}</div>`, p, klasse);
}

const knapp = (tekst, variant = 'standard', ekstra = '', ikonNavn = '', ikonHoyre = false) => {
  const klasser = {
    standard: 'hb-button--standard',
    prominent: 'hb-button--prominent',
    subtle: 'hb-button--subtle',
    link: 'hb-button--link',
    destruktiv: 'hb-button--standard hb-button--destructive',
    'prominent-destruktiv': 'hb-button--prominent hb-button--destructive',
  }[variant];
  const i = ikonNavn ? ikon(ikonNavn, 'hb-button-icon') : '';
  return `<button type="button" class="hb-button ${klasser} ${ekstra}">${ikonHoyre ? '' : i}<span class="hb-button-text">${esc(tekst)}</span>${ikonHoyre ? i : ''}</button>`;
};

const PANEL_IKON = { gray: 'hb-information-circle', blue: 'hb-information-circle', purple: 'hb-information-circle', green: 'check-circle-1', yellow: 'hb-alert-circle', red: 'hb-alert-circle' };
const PANEL_ENUM = { gray: 'GRAY', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW', red: 'RED', purple: 'PURPLE' };

/* Felles redigerbare felt for de vanligste felttypene. */
const FELT_REDIGER = ['label', 'beskrivelse', 'valgfri', 'feil', 'lesemodus'];

/* DSL-hjelpere. linjer() lager innholdet i init-funksjonen. */
const q = (s) => JSON.stringify(String(s ?? ''));
function felles(v, p) {
  const l = [];
  if (p.label) l.push(`${v}.label(${q(p.label)})`);
  if (p.beskrivelse) l.push(`${v}.fieldDescription(${q(p.beskrivelse)})`);
  if (p.valgfri) l.push(`${v}.notRequired()`);
  else if (p.feil) l.push(`${v}.required(${q(p.feil)})`);
  if (p.lesemodus) l.push(`// Skrivebeskyttet: settes med en enabled-regel som gir false`);
  return l;
}

const KOMPONENTER = [
  /* ---------------------------------------------------------- Felter */
  {
    type: 'TextField',
    navn: 'Tekstfelt',
    gruppe: 'Felter',
    kort: 'Fritekst på én linje. hb-felt-text.',
    felt: true,
    standard: { label: 'Hva heter du?', beskrivelse: '', valgfri: false, feil: '', verdi: '', lesemodus: false, bredde: '' },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Skriv fornavn og etternavn, slik det står i passet.' },
      Valgfritt: { valgfri: true },
      Utfylt: { verdi: 'Kari Nordmann' },
      Feil: { feil: 'Skriv navnet ditt.' },
      Skrivebeskyttet: { verdi: 'Kari Nordmann', lesemodus: true },
    },
    redigerbart: ['label', 'beskrivelse', 'verdi', 'bredde', ...FELT_REDIGER.slice(2)],
    render(p) {
      const id = nyId('tekst');
      return hbFelt(
        labelOgBeskrivelse(id, p) +
          `<input id="${id}" class="hb-inputfelt ${breddeKlasse(p)}" type="text" value="${esc(p.verdi)}"${p.lesemodus ? ' readonly' : ''}${p.feil ? ' aria-invalid="true"' : ''} autocomplete="off">`,
        p,
      );
    },
    dsl(p, v) {
      const l = felles(v, p);
      if (p.bredde === 'full') l.push(`${v}.fullBredde()`);
      else if (p.bredde) l.push(`${v}.bredde(${p.bredde})`);
      return l;
    },
  },
  {
    type: 'NumberField',
    navn: 'Tallfelt',
    gruppe: 'Felter',
    kort: 'Tall og beløp med tusenskille og enhet. hb-felt-number, maks 150 px bred.',
    felt: true,
    standard: { label: 'Hva er årsinntekten din?', beskrivelse: '', valgfri: false, feil: '', verdi: '', lesemodus: false, enhet: 'kroner', belop: true },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Inntekt før skatt, slik den står i skattemeldingen.' },
      Valgfritt: { valgfri: true },
      Utfylt: { verdi: '650000' },
      Feil: { feil: 'Skriv årsinntekten din, for eksempel 550000.' },
      'Uten enhet': { enhet: '', belop: false, label: 'Hvor mange bor i husstanden?' },
    },
    redigerbart: ['label', 'beskrivelse', 'verdi', 'enhet', 'belop', 'valgfri', 'feil', 'lesemodus'],
    render(p) {
      const id = nyId('tall');
      const verdi = p.belop ? tusen(p.verdi) : esc(p.verdi);
      return hbFelt(
        labelOgBeskrivelse(id, p) +
          `<input id="${id}" class="hb-inputfelt leca-inputfelt--year" type="text" inputmode="numeric" value="${verdi}"${p.lesemodus ? ' readonly' : ''}${p.feil ? ' aria-invalid="true"' : ''} data-tusen="${p.belop ? 1 : 0}" autocomplete="off">` +
          (p.enhet ? `&nbsp;<span class="hb-felt-enhet">${esc(p.enhet)}</span>` : ''),
        p,
      );
    },
    dsl(p, v) {
      const l = felles(v, p);
      if (p.enhet) l.push(`${v}.enhet(${q(p.enhet)})`);
      if (p.belop) l.push(`${v}.erBeloep(true)`);
      return l;
    },
  },
  {
    type: 'TextNumberField',
    navn: 'Tall som fritekst',
    gruppe: 'Felter',
    kort: 'Beholder det brukeren skrev og forklarer hva som er feil. ShadowValueField, maks 150 px bred.',
    felt: true,
    standard: { label: 'Hvor stor er boligen?', beskrivelse: '', valgfri: false, feil: '', verdi: '', lesemodus: false, enhet: 'kvadratmeter', bredde: '' },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Bruksarealet (BRA), slik det står i takst eller salgsoppgave.' },
      Utfylt: { verdi: '84' },
      'Ugyldig tall': { verdi: '84 kvm', feil: 'Arealet kan bare være tall, for eksempel 84.' },
      'Full bredde': { bredde: 'full', enhet: '' },
    },
    redigerbart: ['label', 'beskrivelse', 'verdi', 'enhet', 'bredde', 'valgfri', 'feil', 'lesemodus'],
    render(p) {
      const id = nyId('skygge');
      return hbFelt(
        `<div class="hb-label"><label class="hb-label-text" for="${id}">${esc(p.label)}${valgfriTekst(p)}</label></div>` +
          (p.beskrivelse ? `<p class="hb-felt-beskrivelse">${esc(p.beskrivelse)}</p>` : '') +
          `<input id="${id}" class="hb-inputfelt leca-inputfelt--skygge ${breddeKlasse(p)}" type="text" inputmode="decimal" value="${esc(p.verdi)}"${p.lesemodus ? ' readonly' : ''}${p.feil ? ' aria-invalid="true"' : ''} autocomplete="off">` +
          (p.enhet ? `&nbsp;<span class="hb-felt-enhet">${esc(p.enhet)}</span>` : ''),
        p,
      );
    },
    dsl(p, v) {
      const l = felles(v, p);
      if (p.enhet) l.push(`${v}.enhet(${q(p.enhet)})`);
      if (p.bredde === 'full') l.push(`${v}.fullBredde()`);
      if (p.feil) l.push(`${v}.ugyldigTallMelding(${q(p.feil)})`);
      return l;
    },
  },
  {
    type: 'TextAreaField',
    navn: 'Tekstområde',
    gruppe: 'Felter',
    kort: 'Lengre fritekst, full bredde, maks 1000 tegn. hb-felt-textarea.',
    felt: true,
    standard: { label: 'Fortell kort om behovet ditt', beskrivelse: '', valgfri: false, feil: '', verdi: '', lesemodus: false },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Skriv hva som gjør det vanskelig å bo i boligen i dag.' },
      Valgfritt: { valgfri: true },
      Utfylt: { verdi: 'Det er tre trappetrinn opp til inngangsdøra, og badet ligger i andre etasje.' },
      Feil: { feil: 'Skriv kort om behovet ditt.' },
    },
    redigerbart: ['label', 'beskrivelse', 'verdi', ...FELT_REDIGER.slice(2)],
    render(p) {
      const id = nyId('omraade');
      return hbFelt(
        `<div class="hb-label"><label class="hb-label-tekst" for="${id}">${esc(p.label)}${valgfriTekst(p)}</label></div>` +
          (p.beskrivelse ? `<p class="hb-felt-beskrivelse">${esc(p.beskrivelse)}</p>` : '') +
          `<textarea id="${id}" class="hb-inputfelt hb-inputfelt--fullbredde" rows="4" maxlength="1000"${p.lesemodus ? ' readonly' : ''}${p.feil ? ' aria-invalid="true"' : ''}>${esc(p.verdi)}</textarea>`,
        p,
        'hb-felt-textarea',
      );
    },
    dsl: (p, v) => felles(v, p),
  },
  {
    type: 'DateField',
    navn: 'Dato',
    gruppe: 'Felter',
    kort: 'Datovelger med min- og maksdato. hb-datepicker.',
    felt: true,
    standard: { label: 'Når er det ferdig?', beskrivelse: '', valgfri: false, feil: '', verdi: '', lesemodus: false },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Omtrentlig dato holder.' },
      Utfylt: { verdi: '2026-11-15' },
      Feil: { feil: 'Ferdigstillelse kan ikke være før dagens dato.' },
    },
    redigerbart: ['label', 'beskrivelse', 'verdi', 'valgfri', 'feil', 'lesemodus'],
    render(p) {
      const id = nyId('dato');
      return hbFelt(
        `<label class="hb-label" for="${id}">${esc(p.label)}</label>` +
          `<p class="leca-felt-beskrivelse">${esc(p.beskrivelse)}</p>` +
          `<input id="${id}" class="hb-datepicker" type="date" value="${esc(p.verdi)}"${p.lesemodus ? ' readonly' : ''}${p.feil ? ' aria-invalid="true"' : ''}>`,
        p,
      );
    },
    dsl(p, v) {
      const l = felles(v, p);
      l.push(`${v}.minDate(new Date(), "Datoen kan ikke være før i dag.")`);
      return l;
    },
  },
  {
    type: 'BooleanField',
    navn: 'Ja/nei',
    gruppe: 'Valg',
    kort: 'To radioknapper med egne tekster for ja og nei. hb-felt-janei.',
    felt: true,
    standard: { label: 'Er det endringer i prosjektkostnadene?', beskrivelse: '', valgfri: false, feil: '', verdi: '', lesemodus: false, ja: 'Ja', nei: 'Nei' },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Ta med alle endringer siden søknaden ble sendt.' },
      'Egne tekster': { ja: 'Ja, kostnadene har endret seg', nei: 'Nei' },
      'Ja valgt': { verdi: 'ja' },
      Feil: { feil: 'Du må velge ett av alternativene.' },
    },
    redigerbart: ['label', 'beskrivelse', 'ja', 'nei', 'janeiVerdi', 'feil', 'lesemodus'],
    render(p) {
      const id = nyId('janei');
      const rad = (verdi, tekst) =>
        `<li><input class="hb-radiobutton" type="radio" id="${id}-${verdi}" name="${id}"${p.verdi === verdi ? ' checked' : ''}${p.lesemodus ? ' disabled' : ''}${p.feil ? ' aria-invalid="true"' : ''}><div class="hb-label"><label class="hb-label-tekst" for="${id}-${verdi}">${esc(tekst || (verdi === 'ja' ? 'Ja' : 'Nei'))}</label></div></li>`;
      return hbFelt(
        `<div class="hb-fieldset"><div class="hb-legend"><span class="hb-legend-tekst">${esc(p.label)}</span></div>` +
          (p.beskrivelse ? `<p class="hb-felt-beskrivelse">${esc(p.beskrivelse)}</p>` : '') +
          `<fieldset class="hb-felt"><legend class="hb-screenreader-only">${esc(p.label)}</legend><ul class="hb-feltliste">${rad('ja', p.ja)}${rad('nei', p.nei)}</ul></fieldset></div>`,
        p,
        'hb-felt-janei',
      );
    },
    dsl(p, v) {
      const l = felles(v, p);
      if (p.ja && p.ja !== 'Ja') l.push(`${v}.jaLabel(${q(p.ja)})`);
      if (p.nei && p.nei !== 'Nei') l.push(`${v}.neiLabel(${q(p.nei)})`);
      return l;
    },
  },
  {
    type: 'EnumField',
    navn: 'Radioknapper',
    gruppe: 'Valg',
    kort: 'Ett valg fra en enum i skjemaet. hb-felt-radio, kan stå horisontalt.',
    felt: true,
    standard: {
      label: 'Hva er sivilstanden din?',
      beskrivelse: '',
      valgfri: false,
      feil: '',
      verdi: '',
      lesemodus: false,
      horisontal: false,
      alternativer: 'Gift eller registrert partner\nSamboer\nEnslig\nSeparert eller skilt',
    },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Slik det står i Folkeregisteret.' },
      Horisontal: { horisontal: true, label: 'Hvor mange elbiler har dere?', alternativer: 'Ingen\n1\n2\n3 eller flere' },
      Valgt: { verdi: 'Samboer' },
      Feil: { feil: 'Velg sivilstanden din.' },
    },
    redigerbart: ['label', 'beskrivelse', 'alternativer', 'valgtVerdi', 'horisontal', 'valgfri', 'feil', 'lesemodus'],
    render(p) {
      return valgliste(p, { type: 'radio', klasse: 'hb-felt-radio', valgt: [p.verdi] });
    },
    dsl(p, v) {
      const l = [`// Alternativene kommer fra enumen i datamodellen: ${alternativer(p).join(' | ')}`, ...felles(v, p)];
      if (p.horisontal) l.push(`${v}.css().horizontal()`);
      return l;
    },
  },
  {
    type: 'RadiobuttonField',
    navn: 'Radioknapper med beskrivelse',
    gruppe: 'Valg',
    kort: 'Alternativene settes i koden, med beskrivelse og grupper. leca-felt-radio.',
    felt: true,
    standard: {
      label: 'Er dette boligen du skal oppgradere?',
      beskrivelse: 'Storgata 12, 0155 Oslo',
      valgfri: false,
      feil: '',
      verdi: '',
      lesemodus: false,
      alternativer: 'Ja\nNei, en annen bolig',
      altBeskrivelser: '',
      fet: false,
      gruppert: false,
    },
    tilstander: {
      Standard: {},
      'Med alternativbeskrivelse': {
        label: 'Hvilken bolig gjelder søknaden?',
        beskrivelse: '',
        alternativer: 'Storgata 12\nFjellveien 3B',
        altBeskrivelser: 'Storgata 12=Gnr. 208, bnr. 112, Oslo\nFjellveien 3B=Gnr. 41, bnr. 7, Bergen',
      },
      'Fet alternativtekst': {
        label: 'Hvilken bolig gjelder søknaden?',
        beskrivelse: '',
        alternativer: 'Storgata 12\nFjellveien 3B',
        altBeskrivelser: 'Storgata 12=Gnr. 208, bnr. 112, Oslo\nFjellveien 3B=Gnr. 41, bnr. 7, Bergen',
        fet: true,
      },
      Gruppert: { label: 'Hva gjelder søknaden?', beskrivelse: '', gruppert: true },
      Feil: { feil: 'Velg om dette er boligen du skal oppgradere.' },
    },
    redigerbart: ['label', 'beskrivelse', 'alternativer', 'altBeskrivelser', 'valgtVerdi', 'fet', 'valgfri', 'feil'],
    render(p) {
      const beskrivelser = {};
      String(p.altBeskrivelser || '')
        .split('\n')
        .forEach((linje) => {
          const [k, ...r] = linje.split('=');
          if (k && r.length) beskrivelser[k.trim()] = r.join('=').trim();
        });
      const grupper = p.gruppert
        ? [
            { navn: 'Bolig', alternativer: ['Kjøpe bolig', 'Bygge bolig'] },
            { navn: 'Oppgradering', alternativer: ['Tilpasse boligen', 'Energitiltak'] },
          ]
        : null;
      const html = valgliste(p, { type: 'radio', klasse: 'hb-felt-radio', valgt: [p.verdi], beskrivelser, grupper, beskrivelseKlasse: 'leca' });
      return `<div class="leca-felt-radio${p.fet ? ' leca-felt-radio--fet-alternativtekst' : ''}">${html}</div>`;
    },
    dsl(p, v) {
      const l = [...felles(v, p)];
      if (p.fet) l.push(`${v}.styleClasses("leca-felt-radio--fet-alternativtekst")`);
      return l;
    },
    dslKonstruktor(p) {
      const alt = alternativer(p)
        .map((t, i) => `{key: ${q('ALT_' + (i + 1))}, tekst: ${q(t)}}`)
        .join(', ');
      return `Rule.constant([${alt}] as FeltAlternativ[]), `;
    },
  },
  {
    type: 'EnumListField',
    navn: 'Avkrysningsbokser',
    gruppe: 'Valg',
    kort: 'Flere valg fra en enum. hb-felt-checkboxgruppe.',
    felt: true,
    standard: {
      label: 'Hva skal du bruke lånet til?',
      beskrivelse: '',
      valgfri: false,
      feil: '',
      verdi: '',
      lesemodus: false,
      horisontal: false,
      alternativer: 'Kjøpe bolig\nRefinansiere\nPusse opp\nEnergitiltak',
    },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Velg alt som passer.' },
      Horisontal: { horisontal: true, label: 'Hvilke rom gjelder det?', alternativer: 'Bad\nKjøkken\nSoverom\nGang' },
      Valgt: { verdi: 'Kjøpe bolig\nPusse opp' },
      Valgfritt: { valgfri: true },
      Feil: { feil: 'Velg minst ett formål.' },
    },
    redigerbart: ['label', 'beskrivelse', 'alternativer', 'valgteVerdier', 'horisontal', 'valgfri', 'feil', 'lesemodus'],
    render(p) {
      return valgliste(p, { type: 'checkbox', klasse: 'hb-felt-checkboxgruppe', valgt: alternativer({ alternativer: p.verdi }) });
    },
    dsl(p, v) {
      const l = [`// Alternativene kommer fra enumen i datamodellen: ${alternativer(p).join(' | ')}`, ...felles(v, p)];
      if (p.horisontal) l.push(`${v}.css().horizontal()`);
      return l;
    },
  },
  {
    type: 'BooleanCheckboxField',
    navn: 'Enkel avkrysningsboks',
    gruppe: 'Valg',
    kort: 'Én boks for sann/usann. Innhold under rykkes inn 30 px og vises når boksen er krysset av.',
    felt: true,
    container: true,
    standard: { label: 'Justere terrenget', beskrivelse: '', verdi: false, feil: '' },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'For eksempel en rampe eller jevnere gangvei.' },
      Avkrysset: { verdi: true },
      Feil: { feil: 'Du må bekrefte at opplysningene er riktige.', label: 'Jeg bekrefter at opplysningene er riktige' },
    },
    eksempelBarn: [{ type: 'TextField', props: { label: 'Hvor skal terrenget justeres?', bredde: '' } }],
    redigerbart: ['label', 'beskrivelse', 'avkrysset', 'feil'],
    render(p, barn, liste) {
      const id = nyId('boks');
      const boks = hbFelt(
        `<input type="checkbox" class="hb-checkbox hb-form-control" id="${id}"${p.verdi ? ' checked' : ''}${p.feil ? ' aria-invalid="true"' : ''}>` +
          `<div class="hb-label"><label class="hb-label-tekst" for="${id}">${esc(p.label)}</label></div>` +
          (p.beskrivelse ? `<div class="hb-label-alternativ-tekst-checkbox"><p class="hb-felt-beskrivelse--alternativ">${esc(p.beskrivelse)}</p></div>` : ''),
        p,
        'hb-felt-checkbox',
      );
      return `<div class="leca-boolean-checkbox"><div class="checkbox-scoped">${boks}</div><div class="boolean-checkbox-elements" ${liste}>${barn.join('')}</div></div>`;
    },
    dsl(p, v) {
      const l = [];
      l.push(`${v}.label(${q(p.label)})`);
      if (p.beskrivelse) l.push(`${v}.fieldDescription(${q(p.beskrivelse)})`);
      if (p.feil) l.push(`${v}.required(${q(p.feil)})`);
      return l;
    },
  },
  {
    type: 'CheckboxGroupField',
    navn: 'Gruppe av avkrysningsbokser',
    gruppe: 'Valg',
    kort: 'Samler enkle avkrysningsbokser under én legend. Med outlined() får hver boks en ramme.',
    container: true,
    godtar: ['BooleanCheckboxField'],
    standard: { label: 'Dette har du fått godkjent', outlined: false, feil: '' },
    tilstander: {
      Standard: {},
      Outlined: { outlined: true },
    },
    eksempelBarn: [
      { type: 'BooleanCheckboxField', props: { label: 'Trinnfri adkomst', verdi: true } },
      { type: 'BooleanCheckboxField', props: { label: 'Tilpasset bad' } },
      { type: 'BooleanCheckboxField', props: { label: 'Bedre belysning' } },
    ],
    redigerbart: ['label', 'outlined'],
    render(p, barn, liste) {
      const innhold = p.outlined ? barn.map((b) => `<label class="checkbox-group-label">${b}</label>`).join('') : barn.join('');
      return `<fieldset class="vertical-layout leca-checkbox-group${p.outlined ? ' outlined' : ''}" ${liste}><legend class="checkbox-group-legend">${esc(p.label)}</legend>${innhold}</fieldset>`;
    },
    dsl(p, v) {
      const l = [`${v}.label(${q(p.label)})`];
      if (p.outlined) l.push(`${v}.css().outlined()`);
      return l;
    },
  },
  {
    type: 'SearchableField',
    navn: 'Søkbar nedtrekksliste',
    gruppe: 'Valg',
    kort: 'Skriv for å filtrere, viser opptil fem treff. hb-felt-autocomplete.',
    felt: true,
    standard: { label: 'Hvilken kommune bor du i?', beskrivelse: '', feil: '', verdi: '', apen: false, alternativer: 'Oslo\nBergen\nTrondheim\nStavanger\nTromsø\nDrammen' },
    tilstander: {
      Standard: {},
      'Med beskrivelse': { beskrivelse: 'Kommunen der du er folkeregistrert.' },
      'Liste åpen': { verdi: 'Tr', apen: true },
      Utfylt: { verdi: 'Trondheim' },
      Feil: { feil: 'Velg kommunen du bor i.' },
    },
    redigerbart: ['label', 'beskrivelse', 'alternativer', 'verdi', 'apen', 'feil'],
    render(p) {
      const id = nyId('sok');
      const treff = alternativer(p)
        .filter((a) => !p.verdi || a.toLowerCase().includes(String(p.verdi).toLowerCase()))
        .slice(0, 5);
      const liste = p.apen
        ? `<div class="hb-kontekstmeny hb-kontekstmeny--overlappende-venstre leca-sokeliste"><ul class="hb-kontekstmeny-liste" role="listbox">${
            treff.length
              ? treff.map((t, i) => `<li class="hb-kontekstmeny-listeelement${i === 0 ? ' leca-fokusert' : ''}" role="option"><span class="hb-kontekstmeny-valg">${esc(t)}</span></li>`).join('')
              : '<li class="hb-kontekstmeny-listeelement"><span class="hb-kontekstmeny-valg"><span class="hb-text--secondary">Ingen treff</span></span></li>'
          }</ul></div>`
        : '';
      return hbFelt(
        `<div class="hb-label"><label class="hb-label-tekst" for="${id}">${esc(p.label)}</label></div>` +
          (p.beskrivelse ? `<p class="hb-felt-beskrivelse">${esc(p.beskrivelse)}</p>` : '') +
          `<div class="hb-kontekstmeny--wrapper leca-sok"><input id="${id}" class="hb-inputfelt hb-inputfelt--fullbredde" role="combobox" type="text" value="${esc(p.verdi)}" aria-expanded="${p.apen}" autocomplete="off"${p.feil ? ' aria-invalid="true"' : ''}>${liste}</div>`,
        p,
      );
    },
    dsl(p, v) {
      return [`// Alternativene kommer fra options-regelen: ${alternativer(p).join(' | ')}`, ...felles(v, p)];
    },
  },
  {
    type: 'VedleggKrav',
    navn: 'Vedlegg',
    gruppe: 'Felter',
    kort: 'Opplasting med slippsone, 173 px høy. Mobil viser bare knappen.',
    felt: true,
    standard: { label: 'Last opp kjøpekontrakten', beskrivelse: 'Kontrakten må være signert av begge parter.', valgfri: false, feil: '', aktiv: false, filer: false },
    tilstander: {
      Standard: {},
      'Drar fil over': { aktiv: true },
      'Med filer': { filer: true },
      Valgfritt: { valgfri: true },
      Feil: { feil: 'Last opp kjøpekontrakten.' },
    },
    redigerbart: ['label', 'beskrivelse', 'aktiv', 'filer', 'valgfri', 'feil'],
    render(p) {
      const sone = p.aktiv
        ? `<div class="leca-drop-zone--drag"><div class="hb-mt--lg"><p>Slipp for å laste opp</p></div></div>`
        : `<div><div class="hb-mb--md"><p class="hb-mb--none">Dra og slipp filer her</p><p class="hb-mt--sm hb-mb--md">eller</p></div><div class="hb-pb--none">${knapp('Velg filer', 'standard', 'hb-button--s')}</div></div>`;
      const fil = (navn, str) =>
        `<li class="hb-panel hb-panel--hvit hb-my--sm hb-py--md leca-fil"><div class="leca-display-flex leca-display-flex--gap leca-display-flex--align-center">${ikon('common-file-text-add', 'leca-display-flex--no-shrink')}<div class="hb-ml--xs leca-text-ellipsis"><a href="#" onclick="return false">${navn}</a><p class="hb-mb--none hb-text--sm hb-text--secondary">${str}</p></div><div class="delete"><button type="button" class="hb-button hb-button--subtle hb-button--icon-only">${ikon('bin-1', 'hb-button-icon')}<span class="hb-screenreader-only">Slett ${navn}</span></button></div></div></li>`;
      const filer = p.filer
        ? `<div><h3 class="hb-text--regular hb-text--base hb-mb--none hb-pt--xs">Filer (2)</h3><ul class="hb-p--none hb-mb--none leca-filliste">${fil('kjopekontrakt-side-1.pdf', '1,2 MB')}${fil('kjopekontrakt-side-2.pdf', '980 kB')}</ul></div>`
        : '';
      return hbFelt(
        `<h2 class="hb-h4 hb-mb--sm">${esc(p.label)} <span class="hb-text--regular">${p.valgfri ? '(valgfritt)' : ''}</span></h2>` +
          `<p class="leca-felt-beskrivelse">${esc(p.beskrivelse)}</p>` +
          `<div class="hb-panel hb-panel--noytral leca-drop-zone leca-upload--desktop hb-my--lg${p.aktiv ? ' leca-drop-zone--active' : ''}">${sone}</div>` +
          `<div class="leca-upload--mobile"><div class="hb-mt--lg hb-pb--lg">${knapp('Last opp filer', 'standard', 'hb-button--s', 'upload-bottom')}</div></div>` +
          filer,
        p,
      );
    },
    dsl(p, v) {
      return [`${v}.opplastingLabel(${q(p.label)})`, ...felles(v, { ...p, label: '' })];
    },
  },

  /* ---------------------------------------------------------- Grupper og layout */
  {
    type: 'FieldSet',
    navn: 'Feltgruppe',
    gruppe: 'Grupper og layout',
    kort: 'Samler felt under én ledetekst, med felles feil. Siste felt får ingen bunnmarg. hb-feltgruppe.',
    container: true,
    standard: { label: 'Biler i husholdningen', feil: '' },
    tilstander: {
      Standard: {},
      Feil: { feil: 'Velg minst 1 av enten fossilbil eller elbil.' },
    },
    eksempelBarn: [
      { type: 'EnumField', props: { label: 'Hvor mange fossilbiler har dere?', horisontal: true, alternativer: 'Ingen\n1\n2\n3 eller flere' } },
      { type: 'EnumField', props: { label: 'Hvor mange elbiler har dere?', horisontal: true, alternativer: 'Ingen\n1\n2\n3 eller flere' } },
    ],
    redigerbart: ['label', 'feil'],
    render(p, barn, liste) {
      return hbFelt(`<div class="leca-feltgruppe-tittel">${esc(p.label)}</div><div class="leca-feltgruppe" ${liste}>${barn.join('')}</div>`, p, 'leca-fieldset');
    },
    dsl(p, v) {
      const l = [`${v}.label(${q(p.label)})`];
      if (p.feil) l.push(`${v}.valid(() => ({literal: ${q(p.feil)}}))`);
      return l;
    },
  },
  {
    type: 'Horizontal',
    navn: 'Horisontal',
    gruppe: 'Grupper og layout',
    kort: 'Barna side om side med 16 px mellomrom, brytes ved behov. horizontal-layout.',
    container: true,
    standard: {},
    tilstander: { Standard: {} },
    eksempelBarn: [
      { type: 'TextField', props: { label: 'Postnummer', bredde: '4' } },
      { type: 'TextField', props: { label: 'Poststed', bredde: '' } },
    ],
    redigerbart: [],
    render(p, barn, liste) {
      return `<div class="horizontal-layout" ${liste}>${barn.join('')}</div>`;
    },
    dsl: () => [],
  },
  {
    type: 'Grid',
    navn: 'Rutenett',
    gruppe: 'Grupper og layout',
    kort: 'Fasadens hb-grid. Gutteren er padding på hver celle, oppveid av negativ marg på rutenettet.',
    container: true,
    standard: { gap: 'md', kolonner: '2' },
    tilstander: {
      'Gap md (12 px)': {},
      'Gap none': { gap: 'none' },
      'Gap sm (8 px)': { gap: 'sm' },
      'Gap lg (20 px)': { gap: 'lg' },
      'Tre kolonner': { kolonner: '3' },
    },
    eksempelBarn: [
      { type: 'TextField', props: { label: 'Fornavn', bredde: 'full' } },
      { type: 'TextField', props: { label: 'Etternavn', bredde: 'full' } },
    ],
    redigerbart: ['gap', 'kolonner'],
    render(p, barn, liste) {
      const celle = { 1: 'hb-cell--12of12', 2: 'hb-cell--6of12', 3: 'hb-cell--4of12', 4: 'hb-cell--3of12' }[p.kolonner] || 'hb-cell--6of12';
      const celler = barn.map((b) => b.replace(/^<div( class="([^"]*)")?/, (m, a, k) => `<div class="hb-cell ${celle}${k ? ' ' + k : ''}"`)).join('');
      return `<div class="hb-grid hb-grid--gap-${p.gap} leca-grid" data-kolonner="${p.kolonner}" ${liste}>${celler}</div>`;
    },
    dsl: (p, v) => [`${v}.styleClasses("hb-grid--gap-${p.gap}")`],
  },
  {
    type: 'IndentedGroup',
    navn: 'Innrykket gruppe',
    gruppe: 'Grupper og layout',
    kort: 'Oppfølgingsspørsmål under et valg. 4 px grå strek, 20 px innrykk, feltene uten bunnmarg.',
    container: true,
    standard: {},
    tilstander: { Standard: {} },
    eksempelBarn: [{ type: 'EnumListField', props: { label: 'Velg hvor du skal justere terrenget', alternativer: 'Inngangsparti\nHage\nAnnet område' } }],
    redigerbart: [],
    render(p, barn, liste) {
      return `<div class="leca-indented"><div class="indented-group" ${liste}>${barn.join('')}</div></div>`;
    },
    dsl: () => [],
  },

  /* ---------------------------------------------------------- Informasjon */
  {
    type: 'Panel',
    navn: 'Panel',
    gruppe: 'Informasjon',
    kort: 'Farget informasjonsboks med ikon. 28/24 px innvendig, 20 px hjørner, 36 px under.',
    container: true,
    standard: { label: 'Dette må du vite', tekst: 'Vi henter opplysninger om inntekten din fra Skatteetaten.', variant: 'blue', visIkon: true, stor: false, punkter: '' },
    tilstander: {
      'Blå (info)': {},
      'Grå (nøytral)': { variant: 'gray', visIkon: false },
      'Grønn (positiv)': { variant: 'green', label: 'Søknaden er klar', tekst: 'Du har svart på alt vi trenger.' },
      'Gul (advarsel)': { variant: 'yellow', label: '', tekst: 'Kostnadene er høyere enn det godkjente lånebeløpet.' },
      'Rød (feil)': { variant: 'red', label: 'Vi fikk ikke hentet opplysningene', tekst: 'Prøv igjen om litt.' },
      'Lilla (veiledning)': { variant: 'purple' },
      'Med punktliste': { punkter: 'Kjøpekontrakt\nTakst eller verdivurdering\nLånebevis fra banken' , tekst: 'Du trenger:' },
      'Stor tittel': { stor: true },
    },
    redigerbart: ['label', 'tekst', 'variant', 'visIkon', 'stor', 'punkter'],
    render(p, barn, liste) {
      const visIkon = p.visIkon;
      const punkter = alternativer({ alternativer: p.punkter });
      return (
        `<div class="leca-panel-vert"><div class="leca-info-panel leca-info-panel--${p.variant}${visIkon ? '' : ' leca-info-panel--no-icon'}">` +
        (visIkon ? ikon(PANEL_IKON[p.variant], 'hb-icon--size150 leca-info-panel__icon') : '') +
        `<div class="leca-info-panel__content">` +
        (p.label ? `<p class="leca-info-panel__title leca-info-panel__title--${p.stor ? 'stor' : 'base'}">${esc(p.label)}</p>` : '') +
        `<div class="leca-info-panel__body" ${liste}>` +
        (p.tekst ? `<p class="leca-info-panel__tekst">${esc(p.tekst)}</p>` : '') +
        (punkter.length ? `<ul class="hb-list hb-list--gap-sm">${punkter.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
        barn.join('') +
        `</div></div></div></div>`
      );
    },
    dsl(p, v) {
      const l = [`${v}.variant(PanelVariant.${PANEL_ENUM[p.variant]})`];
      if (p.label) l.push(`${v}.label(${q(p.label)})`);
      if (p.tekst) l.push(`${v}.staticText(${q(p.tekst)})`);
      if (!p.visIkon && p.variant !== 'gray') l.push(`${v}.visIkon(false)`);
      if (p.stor) l.push(`${v}.tittelStorrelse(PanelTittelStorrelse.STOR)`);
      const pk = alternativer({ alternativer: p.punkter });
      if (pk.length) l.push(`${v}.listeData(Rule.constant(${JSON.stringify(pk)}))`);
      return l;
    },
  },
  {
    type: 'GuidePanel',
    navn: 'Veilederpanel',
    gruppe: 'Informasjon',
    kort: 'Grønn ramme med veilederen. 50 px over og under; stor variant 65 px over.',
    container: true,
    standard: { label: 'Hei!', tekst: 'Jeg hjelper deg gjennom søknaden. Det tar omtrent 15 minutter, og du kan lagre og fortsette senere.', visning: 'default', overskrift: true, visMer: false },
    tilstander: {
      Default: {},
      Liten: { visning: 'liten', overskrift: false, tekst: 'Kom tilbake når byggeprosjektet nærmer seg ferdigstillelse.' },
      'Liten med Vis mer': { visning: 'liten', visMer: true },
      Stor: { visning: 'stor', label: 'Velkommen til søknaden' },
    },
    redigerbart: ['label', 'tekst', 'visning', 'overskrift', 'visMer'],
    render(p, barn, liste) {
      const stor = p.visning === 'stor';
      const avatar = p.visning === 'liten' ? 'hb-avatar-default.svg' : stor ? 'hb-avatar-poster.svg' : '';
      const tekst =
        stor
          ? (p.overskrift && p.label ? `<p class="guidepanel-stor-heading">${esc(p.label)}</p>` : '') + (p.tekst ? `<p class="guidepanel-text">${esc(p.tekst)}</p>` : '')
          : `<p class="guidepanel-text${p.visMer ? ' collapsed' : ''}">${p.overskrift && p.label ? `<strong>${esc(p.label)}</strong> ` : ''}${esc(p.tekst)}</p>`;
      const visMer =
        p.visning === 'liten' && p.visMer
          ? `<hr><div class="guidepanel-vis-mer"><button type="button" class="hb-button hb-button--subtle hb-button--s"><span class="guidepanel-vis-mer-innhold">${ikon('arrow-down-1', 'hb-icon--size125')} Vis mer</span></button></div>`
          : '';
      return (
        `<div class="leca-guide-panel${stor ? ' leca-guide-panel--stor' : ''}"><div class="guidepanel${stor ? ' guidepanel--icon-top' : ''}"><div class="guidepanel--${p.visning}">` +
        `<div class="guidepanel-icon">${avatar ? `<img src="assets/grafikk/${avatar}" alt="">` : ''}</div>` +
        `<div class="guidepanel-content">${tekst}<div class="guidepanel-children" ${liste}>${barn.join('')}</div></div>` +
        `</div>${visMer}</div></div>`
      );
    },
    dsl(p, v) {
      const l = [];
      if (p.visning !== 'default') l.push(`${v}.visning(GuidePanelVisning.${p.visning.toUpperCase()})`);
      if (p.label) l.push(`${v}.label(${q(p.label)})`);
      if (p.tekst) l.push(`${v}.staticText(${q(p.tekst)})`);
      if (!p.overskrift) l.push(`${v}.overskrift(false)`);
      l.push(`${v}.visMerKnapp(${p.visMer})`);
      return l;
    },
  },
  {
    type: 'Callout',
    navn: 'Callout',
    gruppe: 'Informasjon',
    kort: 'Blå meldingsboks med tittel. Rendereren bruker alltid tonen INFO. hb-callout.',
    container: true,
    standard: { label: 'Husk vedleggene', tekst: 'Du må laste opp kjøpekontrakt før du kan sende inn.', punkter: '' },
    tilstander: {
      Standard: {},
      'Med punktliste': { tekst: '', punkter: 'Kjøpekontrakt\nTakst\nLånebevis' },
      'Uten tittel': { label: '' },
    },
    redigerbart: ['label', 'tekst', 'punkter'],
    render(p, barn, liste) {
      const punkter = alternativer({ alternativer: p.punkter });
      return (
        `<div class="hb-callout hb-callout--info"><div class="hb-callout-body">` +
        (p.label ? `<h2 class="hb-callout-title">${esc(p.label)}</h2>` : '') +
        `<div class="hb-callout-content" ${liste}>${barn.join('')}` +
        (p.tekst ? `<p>${esc(p.tekst)}</p>` : '') +
        (punkter.length ? `<ul>${punkter.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
        `</div></div></div>`
      );
    },
    dsl(p, v) {
      const l = [];
      if (p.label) l.push(`${v}.label(${q(p.label)})`);
      if (p.tekst) l.push(`${v}.staticText(${q(p.tekst)})`);
      const pk = alternativer({ alternativer: p.punkter });
      if (pk.length) l.push(`${v}.listeData(Rule.constant(${JSON.stringify(pk)}))`);
      return l;
    },
  },
  {
    type: 'ReadMore',
    navn: 'Les mer',
    gruppe: 'Informasjon',
    kort: 'Tekst som åpnes ved behov. Pil, 3 px strek og 20 px under innholdet.',
    container: true,
    standard: { label: 'Dette er SIFOs referansebudsjett', apen: false },
    tilstander: { Lukket: {}, Åpen: { apen: true } },
    eksempelBarn: [
      {
        type: 'FormattedText',
        props: { tekst: 'Referansebudsjettet viser hva en husholdning trenger å bruke på varer og tjenester for et vanlig liv i Norge.' },
      },
    ],
    redigerbart: ['label', 'apen'],
    render(p, barn, liste) {
      return (
        `<div class="leca-read-more"><button type="button" class="leca-read-more__button${p.apen ? ' leca-read-more__button--open' : ''}" aria-expanded="${p.apen}">` +
        ikon('arrow-down-1', 'leca-read-more__icon hb-icon--size125') +
        `<span class="leca-read-more__heading">${esc(p.label)}</span></button>` +
        `<div class="leca-read-more__content"${p.apen ? '' : ' hidden'}><div class="leca-read-more__content-body" ${liste}>${barn.join('')}</div></div></div>`
      );
    },
    dsl: (p, v) => [`${v}.label(${q(p.label)})`],
  },
  {
    type: 'Accordion',
    navn: 'Trekkspill',
    gruppe: 'Informasjon',
    kort: 'Én utvidbar seksjon med blå tittel. 36 px under, innholdet rykket inn 30 px.',
    container: true,
    standard: { label: 'Slik beregner vi hvor mye du kan låne', apen: false },
    tilstander: { Lukket: {}, Åpen: { apen: true } },
    eksempelBarn: [{ type: 'FormattedText', props: { tekst: 'Vi tar utgangspunkt i inntekten din og trekker fra faste utgifter og gjeld.' } }],
    redigerbart: ['label', 'apen'],
    render(p, barn, liste) {
      return (
        `<div class="leca-accordion"><div class="hb-accordion"><div class="hb-accordion-element${p.apen ? ' hb-accordion-element--utvidet' : ''}">` +
        `<button type="button" class="hb-accordion-header" aria-expanded="${p.apen}">${ikon('arrow-down-1', 'hb-accordion-toggle')}<span class="hb-accordion-tittel">${esc(p.label)}</span></button>` +
        `<div class="hb-accordion-body" ${liste}>${barn.join('')}</div></div></div></div>`
      );
    },
    dsl: (p, v) => [`${v}.label(${q(p.label)})`],
  },
  {
    type: 'FormattedText',
    navn: 'Tekst',
    gruppe: 'Informasjon',
    kort: 'Brødtekst, ingress eller mellomtittel. Ingressen har 52 px under seg.',
    standard: { tekst: 'Når vi beregner hvor stort lån du kan betjene, tar vi utgangspunkt i SIFOs referansebudsjett.', stil: 'brod' },
    tilstander: {
      Brødtekst: {},
      Ingress: { stil: 'ingress', tekst: 'Vi er snart i mål. Du har fortalt oss hva byggekostnadene er, og hva du trenger i lån.' },
      Mellomtittel: { stil: 'h2', tekst: 'Om boligen' },
    },
    redigerbart: ['tekst', 'stil'],
    render(p) {
      if (p.stil === 'ingress') return `<div><p class="hb-text--ingress">${esc(p.tekst)}</p></div>`;
      if (p.stil === 'h2') return `<div><h2 class="hb-h2 hb-text--xl hb-mb--lg">${esc(p.tekst)}</h2></div>`;
      return `<div><p>${esc(p.tekst)}</p></div>`;
    },
    dsl(p) {
      return [];
    },
    dslKonstruktor(p) {
      if (p.stil === 'ingress') return `'<p class="hb-text--ingress">${p.tekst.replace(/'/g, "\\'")}</p>'`;
      if (p.stil === 'h2') return `'<h2 class="hb-h2 hb-text--xl hb-mb--lg">${p.tekst.replace(/'/g, "\\'")}</h2>'`;
      return q(p.tekst);
    },
  },

  /* ---------------------------------------------------------- Handlinger */
  {
    type: 'Actionbutton',
    navn: 'Handlingsknapp',
    gruppe: 'Handlinger',
    kort: 'Knapp som kjører en handling, med spinner mens den venter. hb-button.',
    standard: { tekst: 'Hent opplysninger', variant: 'standard', ikonId: '' },
    tilstander: {
      Standard: {},
      Prominent: { variant: 'prominent' },
      Subtle: { variant: 'subtle', tekst: 'Legg til medlåntaker', ikonId: 'add' },
      Destruktiv: { variant: 'destruktiv', tekst: 'Slett søknaden' },
    },
    redigerbart: ['tekst', 'variant', 'ikonId'],
    render(p) {
      return `<div>${knapp(p.tekst, p.variant, '', p.ikonId)}</div>`;
    },
    dsl(p, v) {
      const varianter = { standard: 'STANDARD', prominent: 'PROMINENT', subtle: 'SUBTLE', link: 'LINK', destruktiv: 'STANDARD_DESTRUCTIVE' };
      const l = [`${v}.variant(ButtonVariantEnum.${varianter[p.variant]})`];
      if (p.ikonId) l.push(`${v}.iconId(${q(p.ikonId)})`);
      l.push(`${v}.action(() => { /* ... */ })`);
      return l;
    },
    dslKonstruktor: (p) => `${q(p.tekst)}, `,
  },
  {
    type: 'Link',
    navn: 'Lenke',
    gruppe: 'Handlinger',
    kort: 'Knapp med lenkerolle, til et annet steg eller en handling. 20 px under med hb-mb--lg.',
    standard: { label: 'Boligen er ikke i listen', variant: 'link' },
    tilstander: { Lenke: {}, Subtle: { variant: 'subtle', label: 'Til oversikten' } },
    redigerbart: ['label', 'lenkevariant'],
    render(p) {
      return `<div>${knapp(p.label, p.variant, 'hb-mb--lg', p.variant === 'subtle' ? 'arrow-right' : '', true).replace('<button', '<button role="link"')}</div>`;
    },
    dsl(p, v) {
      return [`${v}.label(${q(p.label)})`, `${v}.variant(ButtonVariantEnum.${p.variant === 'link' ? 'LINK' : 'SUBTLE'})`, `${v}.styleClasses("hb-mb--lg")`, `${v}.tilSteg(/* steg */)`];
    },
  },
];

/* Navigasjonsdelene tegnes av Sporvalg og Steg, ikke som egne element.
   De vises i biblioteket, men kan ikke dras. */
const NAVIGASJON = [
  {
    type: 'Steg',
    navn: 'Stegtittel',
    kort: 'h1 i 37 px, 52 px over og 20 px under. Valgfritt prefiks i ingress-stil over.',
    standard: { label: 'Om boligen', prefiks: '' },
    tilstander: { Standard: {}, 'Med prefiks': { prefiks: 'Steg 2 av 5' } },
    render(p) {
      return `<h1 class="hb-h1 hb-text--3xl hb-mt--2xl hb-mb--lg">${p.prefiks ? `<span class="hb-text--ingress">${esc(p.prefiks)} </span><br>` : ''}${esc(p.label)}</h1>`;
    },
  },
  {
    type: 'Stegknapper',
    navn: 'Stegknapper',
    kort: 'Forrige og Neste, 16 px mellom, maks 375 px. Under 375 px står de under hverandre, Neste øverst.',
    standard: { forste: false, siste: false, tilOppsummering: false },
    tilstander: {
      'Midt i skjemaet': {},
      'Første steg': { forste: true },
      'Siste steg': { siste: true },
      'Har vært på oppsummeringen': { tilOppsummering: true },
    },
    render(p) {
      return stegknapper(p);
    },
  },
  {
    type: 'Feilliste',
    navn: 'Feiloppsummering',
    kort: 'Vises over stegknappene når Neste trykkes med feil. Lenkene flytter fokus til feltet. 84 px under.',
    standard: {},
    tilstander: { Standard: {} },
    render() {
      return feilliste(['Skriv navnet ditt.', 'Velg sivilstanden din.']);
    },
  },
];

function stegknapper(p) {
  const hoved =
    `<div class="leca-steg-hovedknapper">` +
    (p.forste ? '' : knapp('Forrige')) +
    (p.siste ? knapp('Send inn', 'prominent') : knapp('Neste', 'prominent')) +
    `</div>`;
  const ekstra = p.tilOppsummering ? knapp('Til oppsummeringen', 'subtle', 'leca-steg-knapper--siste', 'arrow-right', true) : '';
  return `<div class="leca-steg-knapper">${hoved}${ekstra}</div>`;
}

function feilliste(feil) {
  return (
    `<div class="hb-avstand--seksjon"><div class="hb-felt hb-felt--med-feil"><h2 class="hb-h2 hb-text--xl hb-mb--md">For å gå videre må du rette opp i følgende feil:</h2>` +
    `<ul class="hb-list hb-feilliste">${feil.map((f) => `<li><a href="#" class="hb-feilliste--link" onclick="return false">${esc(f)}</a></li>`).join('')}</ul></div></div>`
  );
}

/* Spacing-tokenene fra designsystem-tokens, og målene LecaForms bruker. */
const SPACING = [
  { token: 'space-2-xs', px: 2 },
  { token: 'space-xs', px: 4 },
  { token: 'space-sm', px: 8 },
  { token: 'space-md', px: 12 },
  { token: 'space-lg', px: 20 },
  { token: 'space-xl', px: 36 },
  { token: 'space-2-xl', px: 52 },
  { token: 'space-3-xl', px: 84 },
];

const LECA_MAAL = [
  ['Skjemaets innholdsbredde', '640 px', 'width: min(640px, 100%)'],
  ['Under hvert felt (hb-felt)', '36 px', 'space-xl'],
  ['Mellom label og felt', '8 px', 'space-sm'],
  ['Under feltbeskrivelse', '8 px', 'hb-felt-beskrivelse'],
  ['Stegtittel, over / under', '52 / 20 px', 'hb-mt--2xl / hb-mb--lg'],
  ['Mellom feltene i Horisontal', '16 px', 'gap: 16px'],
  ['Stegknapper: rad / mellom knappene', '24 / 16 px', 'space-md × 2 / space-sm × 2'],
  ['Stegknapper, maks bredde', '375 px', 'fra mq-s (480 px)'],
  ['Panel: innvendig / under', '28 × 24 / 36 px', 'hjørner 20 px'],
  ['Veilederpanel, over og under', '50 px', 'stor: 65 px over'],
  ['Innrykket gruppe', '20 px inn, 4 px strek', 'padding 10 10 10 20'],
  ['Barn under avkrysningsboks', '30 px inn', 'boolean-checkbox-elements'],
  ['Feiloppsummering, under', '84 px', 'hb-avstand--seksjon'],
  ['Ingress, under', '52 px', 'hb-text--ingress'],
];

const BREAKPOINTS = [
  ['mq-xs', 320],
  ['mq-s', 480],
  ['mq-m', 768],
  ['mq-l', 1024],
  ['mq-xl', 1280],
];

const GRID_GAP = [
  ['none', 0],
  ['xs', 4],
  ['sm', 8],
  ['md', 12],
  ['lg', 20],
  ['xl', 36],
];
