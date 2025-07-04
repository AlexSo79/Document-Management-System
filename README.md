# Knowledge Base MVP - Sistema di Gestione Documentale Intelligente

Questo repository contiene una webapp React per la gestione documentale avanzata, con autenticazione Firebase, gestione metadati, workflow di approvazione, versionamento, ruoli utente e suggerimento automatico dei metadati tramite AI (Google Gemini).

## Funzionalità Implementate

- **Gestione Metadati**: Ogni documento ha metadati chiave (`tipo_documento`, `stato`, `reparto`, `data_creazione`). I valori sono selezionabili da liste predefinite.
- **Workflow di Approvazione**: Stati supportati: Bozza, In Approvazione, Approvato, Rifiutato, Pubblicato. Azioni contestuali in base al ruolo.
- **Controllo Versioni**: Ogni modifica crea una nuova versione, consultabile nella cronologia.
- **Gestione Utenti e Permessi**: Autenticazione Firebase (Email/Password). Ruoli: Amministratore, Editor, Lettore. I permessi sono gestiti lato client e memorizzati in Firestore.
- **Integrazione AI**: Tramite Google Gemini API, è possibile analizzare il contenuto di un documento e ricevere suggerimenti automatici per tipo documento e reparto.
- **Editor WYSIWYG**: TinyMCE integrato per la modifica dei contenuti.
- **Filtri e Ricerca**: Filtri per tipo documento e stato nella sidebar.

## Stack Tecnologico

- **Frontend**: React 19 + Vite
- **Editor**: TinyMCE (via `@tinymce/tinymce-react`)
- **Backend/Database**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini API
- **Linting**: ESLint

## Struttura del Codice

- Tutto il codice principale si trova in `poc-docs/src/`:
  - `App.jsx`: logica principale, autenticazione, gestione documenti, workflow, AI, versioni.
  - `data.json`: dati di esempio (non usati in produzione).
  - `App.css` e `index.css`: stili.
- Configurazione Vite e ESLint in `poc-docs/`.

## Setup e Avvio

### Prerequisiti

- Node.js 16+
- Un progetto Firebase e una chiave API Gemini

### Passaggi

1. **Clona il repository**
2. **Installa le dipendenze**
   ```sh
   npm install
   ```
   (da dentro la cartella `poc-docs`)

3. **Configura Firebase e Gemini**
   - Crea un file `.env.local` in `poc-docs/`.
   - Inserisci le chiavi di Firebase e Gemini.

4. **Avvia il server di sviluppo**
   ```sh
   npm run dev
   ```
   L'app sarà disponibile su [http://localhost:5173](http://localhost:5173).

## Note di Sicurezza

- Le chiavi API sono caricate tramite variabili d'ambiente Vite (`.env.local`).
- I permessi utente sono gestiti lato client: per produzione è necessario rafforzare la sicurezza con regole Firestore adeguate.

## TODO e Limitazioni

- **Gestione permessi lato server**: attualmente i permessi sono solo lato client.
- **Gestione upload file**: non implementata.
- **Notifiche e audit log**: non presenti.
- **Test automatici**: non presenti.
