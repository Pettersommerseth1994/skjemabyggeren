# Skjemabyggeren

Komponentene i LecaForms, skjemarammeverket i Husbankens lånesøknad, på én
side. Til venstre står hver komponent med tilstandene sine, som i Storybook.
Til høyre er en byggeflate: dra komponentene over og sett sammen et steg.

Publisert på https://pettersommerseth1994.github.io/skjemabyggeren/

## Slik bruker du den

- **Tilstander:** knappene på hvert kort bytter mellom tilstandene rendereren
  støtter, for eksempel med beskrivelse, valgfritt, utfylt og feil.
- **Bygg:** dra et kort etter håndtaket øverst til venstre, eller trykk
  «Legg til». Kortet havner i skjemaet med tilstanden du har valgt.
  Containere (feltgruppe, horisontal, rutenett, innrykket gruppe, panel,
  les mer, trekkspill) tar imot felt.
- **Rediger:** klikk på et element for å endre tekster og egenskaper nederst.
  Dra i den blå fanen for å flytte. Delete sletter.
- **Vis spacing:** måler avstandene mellom elementene og viser tokenet
  (`36 · xl`, `52 · 2-xl` osv.).
- **Desktop / Mobil:** 640 px innholdskolonne eller 375 px skjerm.
- **Vis kode:** LecaForms-DSL for steget, som et utkast. Feltnavnene må finnes
  i datamodellen, og alternativene til `EnumField` og `EnumListField` kommer
  fra enumene der.

Skjemaet lagres i nettleseren din.

## Kildene

- Markup og stiler er hentet fra rendererne i
  `frontend/projects/lecaforms-lib/src/lib/angular` i
  lanogtilskudd-selvbetjening-lanesoknad, og fra komponentmalene i
  designsystem-angular-forms og designsystem-angular-core i Fasaden.
- `fasaden/` er Fasaden 26.0.1, bygget av `verktoy/bygg-fasaden.py` i
  [husbanken](https://github.com/Pettersommerseth1994/husbanken), med
  skrifter og tokenene som CSS-variabler.
- `assets/leca.css` er SCSS-en fra lecaforms-lib. LecaForms bruker rem med
  10 px rot, så alt er regnet om til px. Mediespørringene på skjermbredde er
  byttet mot Desktop/Mobil-valget.

## Filer

- `index.html` – siden
- `assets/komponenter.js` – komponentene: tilstander, markup og DSL
- `assets/app.js` – biblioteket, byggeflaten, dra og slipp, spacing-målene
- `assets/leca.css` – stilene fra lecaforms-lib
- `assets/app.css` – stilene til selve verktøyet
- `assets/ikoner.js` – ikonene fra designsystem-icons

## Kjør lokalt

```bash
python3 -m http.server 4330
```

Åpne så <http://localhost:4330>.
