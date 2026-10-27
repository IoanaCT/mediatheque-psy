import { useState } from 'preact/hooks';
import type { Item } from '../types';

export function NoteDialog({ item, onSave, onClose }: { item: Item; onSave: (note: string) => void; onClose: () => void }) {
  const [text, setText] = useState(item.note);
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="note-title">
      <div class="sheet">
        <h2 id="note-title">Ma note</h2>
        <p class="hint">Jamais d'information sur un patient, même sans nom.</p>
        <textarea
          value={text}
          rows={6}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          aria-label="Note personnelle"
          autofocus
        />
        <div class="sheet-actions">
          <button class="btn primary" type="button" onClick={() => onSave(text.trim())}>Enregistrer</button>
          <button class="btn" type="button" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
