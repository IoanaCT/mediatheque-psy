import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ImportReport, Item } from './types';
import { askPersistentStorage, getAllItems, getMeta, putItems, setMeta } from './db';
import { parseVeille } from './importer';
import { ImportView } from './components/ImportView';
import { Stories } from './components/Stories';

type View = 'home' | 'import' | 'stories';
type ThemePref = 'auto' | 'clair' | 'sombre';

function applyPrefs(theme: ThemePref, scale: number) {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme === 'clair' ? 'light' : 'dark');
  root.style.setProperty('--scale', String(scale));
}

export function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('home');
  const [veille, setVeille] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemePref>('auto');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    (async () => {
      const [all, t, s] = await Promise.all([
        getAllItems(),
        getMeta<ThemePref>('theme', 'auto'),
        getMeta<number>('police', 1),
      ]);
      setItems(all);
      setTheme(t);
      setScale(s);
      applyPrefs(t, s);
      const latest = all.map((i) => i.veille).filter((v): v is number => v !== null);
      setVeille(latest.length ? Math.max(...latest) : null);
      setReady(true);
      askPersistentStorage();
    })();
  }, []);

  const pendingByVeille = useMemo(() => {
    const m = new Map<number, number>();
    items.forEach((i) => {
      if (i.veille !== null && (i.decision === null || i.decision === 'plus_tard'))
        m.set(i.veille, (m.get(i.veille) ?? 0) + 1);
    });
    return m;
  }, [items]);

  async function doImport(text: string): Promise<ImportReport> {
    const { items: fresh, report } = parseVeille(text, new Set(items.map((i) => i.id)));
    if (fresh.length) {
      await putItems(fresh);
      setItems((prev) => [...prev, ...fresh]);
      if (report.veille !== null) setVeille(report.veille);
    }
    return report;
  }

  function change(item: Item) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    putItems([item]);
  }

  function setPrefs(t: ThemePref, s: number) {
    setTheme(t);
    setScale(s);
    applyPrefs(t, s);
    setMeta('theme', t);
    setMeta('police', s);
  }

  if (!ready) return <main class="screen center"><p>Chargement…</p></main>;

  if (view === 'import')
    return <ImportView onImport={doImport} onStart={() => setView('stories')} onBack={() => setView('home')} />;
  if (view === 'stories')
    return <Stories items={items} veille={veille} onChange={change} onBack={() => setView('home')} />;

  const pending = veille !== null ? pendingByVeille.get(veille) ?? 0 : 0;
  const kept = items.filter((i) => i.decision === 'garder').length;

  return (
    <main class="screen">
      <h1>Médiathèque psy</h1>

      {items.length === 0 ? (
        <p class="big-msg">Rien ici pour l'instant. Importe la veille du lundi.</p>
      ) : pending > 0 ? (
        <section class="hero">
          <p class="big-msg">Veille {veille} : {pending} à trier</p>
          <button class="btn primary big" type="button" onClick={() => setView('stories')}>Trier maintenant</button>
        </section>
      ) : (
        <p class="big-msg">Tout est trié. {kept} élément{kept > 1 ? 's' : ''} gardé{kept > 1 ? 's' : ''}.</p>
      )}

      <button class="btn" type="button" onClick={() => setView('import')}>Importer une veille</button>

      <section class="prefs" aria-label="Affichage">
        <h2>Affichage</h2>
        <div class="seg" role="group" aria-label="Thème">
          {(['auto', 'clair', 'sombre'] as ThemePref[]).map((t) => (
            <button key={t} type="button" class={theme === t ? 'on' : ''} aria-pressed={theme === t} onClick={() => setPrefs(t, scale)}>
              {t === 'auto' ? 'Auto' : t === 'clair' ? 'Clair' : 'Sombre'}
            </button>
          ))}
        </div>
        <div class="seg" role="group" aria-label="Taille du texte">
          {[1, 1.15, 1.3, 1.5].map((s, i) => (
            <button key={s} type="button" class={scale === s ? 'on' : ''} aria-pressed={scale === s} aria-label={`Texte taille ${i + 1} sur 4`} onClick={() => setPrefs(theme, s)}>
              <span style={{ fontSize: `${0.9 + i * 0.2}em` }}>A</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
