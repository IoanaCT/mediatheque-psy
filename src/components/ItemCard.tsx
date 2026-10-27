import type { Item } from '../types';
import { TYPE_LABEL, themeHue, readingTime, usageLabels } from '../labels';

function Gauge({ value }: { value: number }) {
  return (
    <div class="gauge" role="img" aria-label={`Solidité ${value} sur 3`}>
      <span class="gauge-title">Solidité</span>
      {[1, 2, 3].map((n) => (
        <span key={n} class={n <= value ? 'pip on' : 'pip'} aria-hidden="true" />
      ))}
      <span class="gauge-text" aria-hidden="true">{value}/3</span>
    </div>
  );
}

function Compare({ c }: { c: NonNullable<Item['comparaison']> }) {
  const max = Math.max(c.a.valeur, c.b.valeur, 1);
  const unit = c.unite ?? '';
  return (
    <div class="compare" role="group" aria-label="Comparaison">
      {[c.a, c.b].map((v, i) => (
        <div class="bar-row" key={i}>
          <div class="bar-label">{v.label}</div>
          <div class="bar-track">
            <div class={i === 0 ? 'bar a' : 'bar b'} style={{ width: `${(v.valeur / max) * 100}%` }} />
          </div>
          <div class="bar-value">{v.valeur} {unit}</div>
        </div>
      ))}
    </div>
  );
}

function Links({ item, onNote }: { item: Item; onNote: () => void }) {
  const s = item.source;
  const isMedia = item.type !== 'etude';
  return (
    <div class="actions-row">
      {s?.lienEtude && (
        <a class="btn" href={s.lienEtude} target="_blank" rel="noopener noreferrer">
          {isMedia ? 'Lien de vérification' : "Lire l'étude"}
        </a>
      )}
      {s?.lienVulgarisation && (
        <a class="btn" href={s.lienVulgarisation} target="_blank" rel="noopener noreferrer">
          Article de vulgarisation
        </a>
      )}
      <button class="btn" type="button" onClick={onNote}>
        {item.note ? 'Modifier ma note' : 'Ajouter une note'}
      </button>
    </div>
  );
}

export function ItemCard({ item, onNote }: { item: Item; onNote: () => void }) {
  const hue = themeHue(item.themes);
  const time = readingTime(item.tempsLectureMin);
  const isStudy = item.type === 'etude' || item.type === 'formation';
  const m = item.methode;

  return (
    <article class="card" style={{ '--h': hue }} aria-label={item.titre}>
      <header class="card-head">
        <span class="badge type">{TYPE_LABEL[item.type]}</span>
        {item.themes.slice(0, 2).map((t) => (
          <span class="badge theme" key={t}>{t}</span>
        ))}
        {time && <span class="time">{time}</span>}
      </header>

      <h2 class="title">{item.titre}</h2>
      {item.ideeCle && <p class="key-idea">{item.ideeCle}</p>}

      {isStudy ? (
        <>
          {item.chiffreCle && (
            <div class="big-number">
              <div class="big-value">{item.chiffreCle.valeur}</div>
              {item.chiffreCle.legende && <div class="big-legend">{item.chiffreCle.legende}</div>}
            </div>
          )}
          {item.comparaison && <Compare c={item.comparaison} />}

          <div class="badges">
            {m?.type && <span class="badge">{m.type}</span>}
            {m?.participants !== undefined && <span class="badge">{m.participants} participants</span>}
            {m?.pays && <span class="badge">{m.pays}</span>}
            {item.source?.revue && <span class="badge">{item.source.revue}</span>}
          </div>
          {item.solidite && <Gauge value={item.solidite} />}

          {item.pourquoi.length > 0 && (
            <section>
              <h3>Pourquoi c'est intéressant</h3>
              <ul>{item.pourquoi.slice(0, 2).map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
          )}
          {item.limites.length > 0 && (
            <section>
              <h3>Limites</h3>
              <ul>{item.limites.slice(0, 2).map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
          )}
          {item.question && (
            <aside class="question">
              <span class="question-title">Question ouverte</span>
              {item.question}
            </aside>
          )}
        </>
      ) : (
        <dl class="media-facts">
          {item.auteur && (<><dt>Auteur</dt><dd>{item.auteur}</dd></>)}
          {item.source?.revue && (<><dt>Éditeur / plateforme</dt><dd>{item.source.revue}</dd></>)}
          {item.source?.dateParution && (<><dt>Date</dt><dd>{item.source.dateParution}</dd></>)}
          {usageLabels(item.usage).length > 0 && (<><dt>Usage</dt><dd>{usageLabels(item.usage).join(' · ')}</dd></>)}
        </dl>
      )}

      {!isStudy && item.miseEnGarde && (
        <aside class="warning"><strong>Mise en garde.</strong> {item.miseEnGarde}</aside>
      )}

      {item.note && <p class="note-preview">Ma note : {item.note}</p>}
      <Links item={item} onNote={onNote} />
    </article>
  );
}
