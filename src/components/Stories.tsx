import { useEffect, useRef, useState } from 'preact/hooks';
import type { Item, Shelf } from '../types';
import { ItemCard } from './ItemCard';
import { NoteDialog } from './NoteDialog';
import { SHELF_LABEL } from '../labels';

interface Props {
  items: Item[];
  veille: number | null;
  onChange: (item: Item) => void;
  onBack: () => void;
}

const SWIPE = 90;

function suggested(item: Item): Shelf[] {
  const u = (item.usage ?? '').split(/\s+/);
  return (['P', 'R'] as Shelf[]).filter((s) => u.includes(s));
}

export function Stories({ items, veille, onChange, onBack }: Props) {
  const pool = items.filter((i) => i.veille === veille).sort((a, b) => a.id.localeCompare(b.id));
  const fresh = pool.filter((i) => i.decision === null);
  const later = pool
    .filter((i) => i.decision === 'plus_tard')
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const pending = [...fresh, ...later];
  const current = pending[0];
  const decided = pool.filter((i) => i.decision === 'garder' || i.decision === 'passer').length;

  const [choosingShelf, setChoosingShelf] = useState(false);
  const [noting, setNoting] = useState(false);
  const [undo, setUndo] = useState<Item | null>(null);
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setChoosingShelf(false);
  }, [current?.id]);
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  function commit(next: Item) {
    if (!current) return;
    setUndo(current);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
    onChange({ ...next, updatedAt: new Date().toISOString() });
  }

  const pass = () => current && commit({ ...current, decision: 'passer', etageres: [] });
  const later_ = () => current && commit({ ...current, decision: 'plus_tard' });
  const keep = (etageres: Shelf[]) => {
    if (!current) return;
    setChoosingShelf(false);
    commit({ ...current, decision: 'garder', etageres, statut: 'a_lire' });
  };

  function undoLast() {
    if (!undo) return;
    window.clearTimeout(undoTimer.current);
    onChange({ ...undo, updatedAt: new Date().toISOString() });
    setUndo(null);
  }

  function down(e: PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
  }
  function move(e: PointerEvent) {
    if (!start.current) return;
    const mx = e.clientX - start.current.x;
    const my = e.clientY - start.current.y;
    if (Math.abs(mx) > Math.abs(my)) setDx(mx);
  }
  function up() {
    const d = dx;
    start.current = null;
    setDx(0);
    if (d > SWIPE) setChoosingShelf(true);
    else if (d < -SWIPE) pass();
  }

  if (!current) {
    const kept = pool.filter((i) => i.decision === 'garder').length;
    return (
      <main class="screen center">
        <h1>{pool.length ? 'Veille terminée' : 'Rien à trier'}</h1>
        {pool.length > 0 && <p class="big-msg">{kept} gardé{kept > 1 ? 's' : ''}, {pool.length - kept} passé{pool.length - kept > 1 ? 's' : ''}.</p>}
        {undo && <button class="btn" type="button" onClick={undoLast}>Annuler le dernier geste</button>}
        <button class="btn primary" type="button" onClick={onBack}>Retour à l'accueil</button>
      </main>
    );
  }

  return (
    <div class="stories">
      <header class="stories-top">
        <button class="link-back" type="button" onClick={onBack}>← Quitter</button>
        <span class="counter" aria-live="polite">{Math.min(decided + 1, pool.length)} sur {pool.length}</span>
      </header>
      <div class="progress" aria-hidden="true">
        <div class="progress-fill" style={{ width: `${(decided / pool.length) * 100}%` }} />
      </div>

      <div class="scroller" ref={scroller}>
        <div
          class="swipe"
          style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)` }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => { start.current = null; setDx(0); }}
        >
          <ItemCard item={current} onNote={() => setNoting(true)} />
        </div>
      </div>

      <footer class="stories-bar">
        {undo && (
          <div class="toast" role="status">
            <span>C'est noté.</span>
            <button class="link" type="button" onClick={undoLast}>Annuler</button>
          </div>
        )}
        <div class="triple">
          <button class="btn pass" type="button" onClick={pass}>Passer</button>
          <button class="btn later" type="button" onClick={later_}>Plus tard</button>
          <button class="btn primary keep" type="button" onClick={() => setChoosingShelf(true)}>Garder</button>
        </div>
      </footer>

      {choosingShelf && (
        <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="shelf-title">
          <div class="sheet">
            <h2 id="shelf-title">Sur quelle étagère ?</h2>
            {suggested(current).length > 0 && (
              <p class="hint">Suggestion de la veille : {suggested(current).map((s) => SHELF_LABEL[s]).join(' et ')}.</p>
            )}
            <button class="btn primary" type="button" onClick={() => keep(['P'])}>Personnelle</button>
            <button class="btn primary" type="button" onClick={() => keep(['R'])}>Praticienne</button>
            <button class="btn primary" type="button" onClick={() => keep(['P', 'R'])}>Les deux</button>
            <button class="btn" type="button" onClick={() => setChoosingShelf(false)}>Annuler</button>
          </div>
        </div>
      )}

      {noting && (
        <NoteDialog
          item={current}
          onClose={() => setNoting(false)}
          onSave={(note) => {
            onChange({ ...current, note, updatedAt: new Date().toISOString() });
            setNoting(false);
          }}
        />
      )}
    </div>
  );
}
