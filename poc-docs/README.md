# Knowledge Base MVP - Un Sistema di Gestione Documentale Intelligente

Questo repository contiene il codice sorgente per un'applicazione web avanzata per la gestione documentale, costruita con React e Firebase. L'applicazione è progettata per superare i limiti dei sistemi di archiviazione tradizionali basati su cartelle, adottando una filosofia incentrata sui metadati, workflow di approvazione e integrazione con l'intelligenza artificiale, ispirata a piattaforme enterprise come M-Files.

## Funzionalità Principali

L'applicazione è stata sviluppata attraverso una roadmap incrementale, implementando le seguenti funzionalità:

- Gestione basata sui Metadati (v1.1): Ogni documento è definito da ciò che è, non da dove si trova. L'interfaccia permette di visualizzare e modificare metadati chiave come "Tipo di Documento", "Stato" e "Reparto".

- Workflow di Approvazione (v1.2): Un ciclo di vita del documento che permette di spostare un file attraverso stati come Bozza, In Approvazione, Approvato e Rifiutato, con azioni contestuali disponibili per gli utenti appropriati.

- Controllo delle Versioni (v1.3): Ogni salvataggio crea una nuova versione del documento, preservando la cronologia completa delle modifiche. L'interfaccia permette di visualizzare e ripristinare le versioni precedenti.

- Gestione Utenti e Permessi (v2.0): Sistema di autenticazione reale (Email/Password) con tre ruoli utente:

  - Amministratore: Controllo completo sul sistema e sui documenti.

  - Editor: Può creare e modificare documenti, partecipando ai workflow.

  - Lettore: Può solo visualizzare e cercare i documenti.

- Integrazione AI (v2.1): Utilizzo dell'API di Google Gemini per analizzare il contenuto dei documenti e suggerire automaticamente i metadati (tipo e reparto), riducendo l'inserimento manuale e aumentando la coerenza.

## Stack Tecnologico

- Frontend: React (con Vite per il setup)

- Backend & Database: Google Firebase (Firestore Database, Authentication)

- Editor di Testo: TinyMCE

- Intelligenza Artificiale: Google Gemini API

## Setup e Installazione

Segui questi passaggi per avviare il progetto in locale.

### Prerequisiti

- Node.js (versione 16 o successiva)

- Un account Google per creare un progetto Firebase/Google Cloud.

1. Clona il Repository
git clone https://github.com/tuo-username/tuo-repository.git
cd tuo-repository

2. Installa le Dipendenze
Esegui il seguente comando per installare tutte le librerie necessarie:

npm install

3. Configurazione di Firebase
Vai alla Console di Firebase e crea un nuovo progetto.

All'interno del progetto, vai su Costruisci > Authentication > Metodi di accesso e abilita "Email/Password".

Vai su Costruisci > Firestore Database, crea un database e avvialo in modalità di test.

Nelle Impostazioni progetto (icona a forma di ingranaggio), registra una nuova app web.

Copia l'oggetto di configurazione firebaseConfig.

4. Configurazione dell'API di Gemini
Vai alla Console di Google Cloud e assicurati che il progetto selezionato sia lo stesso di Firebase.

Vai su API e servizi > Libreria, cerca "Generative Language API" e abilitala.

Assicurati che al progetto sia collegato un account di fatturazione attivo.

Vai su API e servizi > Credenziali, clicca su "+ CREA CREDENZIALI" e seleziona "Chiave API".

Copia la chiave API generata.

5. Inserisci le Chiavi nel Codice
Apri il file src/App.jsx e inserisci le chiavi che hai appena copiato nei rispettivi segnaposto:

// Inserisci la configurazione del tuo progetto Firebase
const firebaseConfig = {
  apiKey: "LA_TUA_CHIAVE_FIREBASE",
  // ...
};

// ... all'interno della funzione handleAiAnalysis ...
const apiKey = "LA_TUA_CHIAVE_API_GEMINI";

6. Avvia l'Applicazione
Una volta configurato tutto, avvia il server di sviluppo:

npm run dev

Apri il browser all'indirizzo http://localhost:5173 (o quello indicato nel terminale) per visualizzare l'applicazione.
