import { useState } from 'preact/hooks';
import type { ImportReport } from '../types';

interface Props {
  onImport: (text: string) => Promise<ImportReport>;
  onStart: () => void;
  onBack: () => void;
}

export function ImportView({ onImport, onStart, onBack }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);

  async function run(content: string) {
    setError('');
    setReport(null);
    try {
      setReport(await onImport(content));
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'import a échoué.");
    }
  }

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await run(await file.text());
    input.value = '';
  }

  return (
    <main class="screen">
      <button class="link-back" type="button" onClick={onBack}>← Retour</button>
      <h1>Importer une veille</h1>

      <label class="btn primary file-btn">
        Choisir un fichier .json
        <input type="file" accept=".json,application/json" onChange={onFile} hidden />
      </label>

      <p class="or">ou colle le texte :</p>
      <textarea
        value={text}
        rows={6}
        placeholder='{ "veille": { "numero": 5, … }, "items": [ … ] }'
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        aria-label="Texte JSON de la veille"
      />
      <button class="btn" type="button" disabled={!text.trim()} onClick={() => run(text)}>
        Importer le texte
      </button>

      {error && <p class="msg error" role="alert">{error}</p>}
      {report && (
        <div class="msg ok" role="status">
          <p>
            <strong>Veille {report.veille ?? '?'} :</strong> {report.ajoutes} ajouté{report.ajoutes > 1 ? 's' : ''}
            {report.doublons > 0 && `, ${report.doublons} déjà présent${report.doublons > 1 ? 's' : ''}`}
            {report.ignores.length > 0 && `, ${report.ignores.length} ignoré${report.ignores.length > 1 ? 's' : ''} (id ou titre manquant)`}.
          </p>
          {report.ajoutes > 0 && (
            <button class="btn primary" type="button" onClick={onStart}>Commencer les stories</button>
          )}
        </div>
      )}
    </main>
  );
}
