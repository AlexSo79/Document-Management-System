import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import './App.css'; 

// --- IMPORTAZIONI FIREBASE ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, doc, updateDoc,
  writeBatch, getDocs, Timestamp, addDoc, query, orderBy, getDoc, setDoc
} from "firebase/firestore";
import { 
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut 
} from "firebase/auth";

// --- CONFIGURAZIONE SICURA TRAMITE VARIABILI D'AMBIENTE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const METADATA_OPTIONS = {
    stati: ["Bozza", "In Approvazione", "Approvato", "Rifiutato", "Pubblicato"],
    reparti: ["Risorse Umane", "Marketing", "Vendite", "Sviluppo", "Supporto", "Legale"],
    tipi_documento: ["Contratto", "Guida", "Procedura", "Policy", "Report"]
};

// --- COMPONENTE LOGIN/REGISTRAZIONE ---
function AuthComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');

    const handleAuthAction = async () => {
        setError('');
        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "utenti", user.uid), {
                    email: user.email,
                    ruolo: "Lettore" // Ruolo di default
                });
                alert("Registrazione avvenuta con successo!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isRegistering ? 'Registrati' : 'Accedi'}</h2>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <button onClick={handleAuthAction}>{isRegistering ? 'Registrati' : 'Accedi'}</button>
                {error && <p className="auth-error">{error}</p>}
                <p className="auth-toggle" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
                </p>
            </div>
        </div>
    );
}


function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [docs, setDocs] = useState([]); 
  const [activeDoc, setActiveDoc] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [editingContent, setEditingContent] = useState('');
  const [editingMetadata, setEditingMetadata] = useState(null);

  const [filters, setFilters] = useState({ tipo_documento: '', stato: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [versions, setVersions] = useState([]);
  const [viewingVersionContent, setViewingVersionContent] = useState(null);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "utenti", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          setUserProfile({ email: currentUser.email, ruolo: 'Sconosciuto' });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (!user) return; 
    const docsCollectionRef = collection(db, 'documents');
    const unsubscribe = onSnapshot(docsCollectionRef, (snapshot) => {
      const documentsData = snapshot.docs.map(d => {
        const data = d.data();
        if (data.metadati?.data_creazione instanceof Timestamp) {
          data.metadati.data_creazione = data.metadati.data_creazione.toDate();
        }
        return { id: d.id, ...data };
      });
      setDocs(documentsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (activeDoc && docs.length > 0) {
        const updatedActiveDoc = docs.find(d => d.id === activeDoc.id);
        if (updatedActiveDoc && JSON.stringify(updatedActiveDoc) !== JSON.stringify(activeDoc)) {
            setActiveDoc(updatedActiveDoc);
        }
    }
  }, [docs, activeDoc]);

  useEffect(() => {
    if (!activeDoc) {
      setVersions([]);
      return;
    }
    const versionsCollectionRef = collection(db, 'documents', activeDoc.id, 'versioni');
    const q = query(versionsCollectionRef, orderBy('timestamp_modifica', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVersions(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp_modifica: d.data().timestamp_modifica.toDate() })));
    });
    return () => unsubscribe();
  }, [activeDoc]);

  const handleAiAnalysis = async () => {
    if (!editingContent) {
        alert("Scrivi del contenuto nel documento prima di avviare l'analisi AI.");
        return;
    }
    setIsAiAnalyzing(true);

    const prompt = `
        Analizza il seguente testo di un documento aziendale. Il tuo compito è estrarre i metadati corretti.
        Rispondi ESCLUSIVAMENTE con un oggetto JSON valido.

        Testo del documento:
        ---
        ${editingContent.substring(0, 4000)}
        ---

        Basandoti sul testo, determina il 'tipo_documento' e il 'reparto'.
        Per 'tipo_documento', scegli uno tra: ${METADATA_OPTIONS.tipi_documento.join(', ')}.
        Per 'reparto', scegli uno tra: ${METADATA_OPTIONS.reparti.join(', ')}.
    `;
    
    try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { 
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "tipo_documento": { "type": "STRING" },
                        "reparto": { "type": "STRING" }
                    },
                }
            }
        };

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            alert("La chiave API di Gemini non è stata trovata. Assicurati di averla impostata nel tuo file .env.local");
            setIsAiAnalyzing(false);
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Dettagli errore API:", errorBody);
            throw new Error(`Errore API: ${response.statusText} - ${errorBody.error?.message || 'Nessun dettaglio aggiuntivo.'}`);
        }

        const result = await response.json();
        
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text);
            setEditingMetadata(prev => ({
                ...prev,
                tipo_documento: aiResponse.tipo_documento || prev.tipo_documento,
                reparto: aiResponse.reparto || prev.reparto
            }));
        } else {
            throw new Error("La risposta dell'AI non è nel formato previsto.");
        }

    } catch (error) {
        console.error("Errore durante l'analisi AI:", error);
        alert(`Si è verificato un errore durante l'analisi AI: ${error.message}`);
    } finally {
        setIsAiAnalyzing(false);
    }
  };


  const handleSaveClick = async () => {
    if (!activeDoc || !user) return;
    
    const docRef = doc(db, 'documents', activeDoc.id);
    const versionsCollectionRef = collection(docRef, 'versioni');
    
    const metadataToSave = { ...editingMetadata };
    if (metadataToSave.data_creazione instanceof Date) {
      metadataToSave.data_creazione = Timestamp.fromDate(metadataToSave.data_creazione);
    }
    
    try {
        await addDoc(versionsCollectionRef, {
          content: editingContent,
          timestamp_modifica: Timestamp.now(),
          autore_modifica_id: user.uid
        });
        await updateDoc(docRef, { 
          latest_content: editingContent, 
          metadati: metadataToSave 
        });
        setIsEditMode(false);
    } catch (error) {
        console.error("Errore durante il salvataggio:", error);
        alert(`Errore durante il salvataggio: ${error.message}. L'editor rimarrà aperto.`);
    }
  };
  
  const handleWorkflowAction = async (newStatus) => {
    if (!activeDoc || !user) return;
    const docRef = doc(db, 'documents', activeDoc.id);
    const newMetadata = { ...activeDoc.metadati, stato: newStatus };
    if (newStatus === 'In Approvazione') {
      newMetadata.revisore_id = user.uid;
    } else {
      delete newMetadata.revisore_id;
    }
    await updateDoc(docRef, { metadati: newMetadata });
  };

  const handleLogout = async () => {
      await signOut(auth);
  };

  const handleDocClick = (doc) => {
    if (isEditMode) setIsEditMode(false);
    setViewingVersionContent(null);
    setActiveDoc(doc);
  };

  const handleEditClick = () => {
    setViewingVersionContent(null); 
    setEditingContent(activeDoc.latest_content);
    setEditingMetadata({ ...activeDoc.metadati });
    setIsEditMode(true);
  };
  
  const handleCancelClick = () => setIsEditMode(false);
  const handleMetadataChange = (e) => setEditingMetadata(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const filteredDocs = docs.filter(doc => {
      const { metadati } = doc;
      if (!metadati) return false;
      const filterByType = filters.tipo_documento ? metadati.tipo_documento === filters.tipo_documento : true;
      const filterByState = filters.stato ? metadati.stato === filters.stato : true;
      return filterByType && filterByState;
  });

  if (authLoading) {
    return <div className="loading-screen">Caricamento...</div>;
  }

  if (!user) {
    return <AuthComponent />;
  }

  const isAdmin = userProfile?.ruolo?.toLowerCase() === 'amministratore';
  const isEditor = userProfile?.ruolo?.toLowerCase() === 'editor';
  const canInitiateEdit = activeDoc && (isAdmin || (isEditor && (activeDoc.metadati?.stato === 'Bozza' || activeDoc.metadati?.stato === 'Rifiutato')));
  const canPerformWorkflow = activeDoc && (isAdmin || isEditor);
  const isReviewer = activeDoc && activeDoc.metadati?.revisore_id === user?.uid;
  const canApproveOrReject = isReviewer || isAdmin;
  const displayContent = viewingVersionContent !== null ? viewingVersionContent.content : (activeDoc?.latest_content || "");

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <h1>Knowledge Base 2.1</h1>
          </div>
          <div className="filters-container">
             <select value={filters.tipo_documento} onChange={e => setFilters({...filters, tipo_documento: e.target.value})}>
                <option value="">Tutti i Tipi</option>
                {METADATA_OPTIONS.tipi_documento.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <select value={filters.stato} onChange={e => setFilters({...filters, stato: e.target.value})}>
                <option value="">Tutti gli Stati</option>
                {METADATA_OPTIONS.stati.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          <div className="docs-list-container">
            {isLoading ? <p style={{padding: '20px'}}>Caricamento dati...</p> : filteredDocs.map(d => (
              <div key={d.id} onClick={() => handleDocClick(d)} className={`doc-list-item ${activeDoc?.id === d.id ? 'active' : ''}`}>
                <span className="doc-title">{d.titolo}</span>
                <span className={`doc-status-badge status-${d.metadati?.stato?.toLowerCase().replace(/ /g, '-')}`}>{d.metadati?.stato}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="user-profile">
            <div className="user-avatar">{userProfile?.email?.substring(0,2).toUpperCase()}</div>
            <div className="user-info">
                <div className="user-name">{userProfile?.email}</div>
                <div className="user-role">{userProfile?.ruolo}</div>
            </div>
            <button onClick={handleLogout} className="logout-button">Esci</button>
        </div>
      </aside>

      <main className="content-area">
        {!activeDoc ? ( <div className="welcome-message"><h2>Benvenuto!</h2><p>Seleziona un documento per iniziare.</p></div> ) 
        : (
          <div className="main-content-wrapper">
            <div className="document-panel">
                {isEditMode ? ( 
                  <div className="document-editor">
                    <Editor
                        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                        value={editingContent}
                        init={{ height: "100%", menubar: false, plugins: 'lists link image paste help wordcount', toolbar: 'undo redo | blocks | bold italic | bullist numlist | link' }}
                        onEditorChange={(content) => setEditingContent(content)}
                    />
                  </div> 
                ) : (
                    <>
                        {viewingVersionContent !== null && (
                            <div className="version-viewer-bar">
                                <p>Stai visualizzando una versione del {viewingVersionContent.timestamp.toLocaleString('it-IT')}</p>
                                <button onClick={() => setViewingVersionContent(null)}>Torna alla versione attuale</button>
                            </div>
                        )}
                        <div className="document-view">
                            <h1>{activeDoc.titolo}</h1>
                            <div className="document-content" dangerouslySetInnerHTML={{ __html: displayContent }} />
                        </div>
                    </>
                )}
            </div>
            <aside className="metadata-panel">
                 <div className="metadata-header">
                    <h3>Proprietà</h3>
                    {canInitiateEdit && !isEditMode && <button onClick={handleEditClick} className="button-edit">Modifica</button>}
                 </div>
                 {isEditMode && editingMetadata ? ( 
                    <div className="metadata-form">
                        <button onClick={handleAiAnalysis} className="button-ai" disabled={isAiAnalyzing}>
                            {isAiAnalyzing ? 'Analisi in corso...' : 'Analizza con AI'}
                        </button>
                        <label>Tipo Documento</label>
                        <select name="tipo_documento" value={editingMetadata.tipo_documento || ''} onChange={handleMetadataChange}>
                            {METADATA_OPTIONS.tipi_documento.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <label>Stato</label>
                        <select name="stato" value={editingMetadata.stato || ''} onChange={handleMetadataChange}>
                            {METADATA_OPTIONS.stati.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <label>Reparto</label>
                        <select name="reparto" value={editingMetadata.reparto || ''} onChange={handleMetadataChange}>
                            {METADATA_OPTIONS.reparti.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <div className="edit-actions">
                            <button onClick={handleSaveClick} className="button-save">Salva</button>
                            <button onClick={handleCancelClick} className="button-cancel">Annulla</button>
                        </div>
                    </div>
                 ) : (
                    <div className="metadata-view">
                      <p><strong>Stato:</strong> <span className={`doc-status-badge status-${activeDoc.metadati?.stato?.toLowerCase().replace(/ /g, '-')}`}>{activeDoc.metadati?.stato}</span></p>
                      <p><strong>Tipo Documento:</strong> {activeDoc.metadati?.tipo_documento}</p>
                      <p><strong>Reparto:</strong> {activeDoc.metadati?.reparto}</p>
                      <p><strong>Data Creazione:</strong> 
                        {activeDoc.metadati?.data_creazione instanceof Date 
                          ? activeDoc.metadati.data_creazione.toLocaleDateString('it-IT')
                          : 'N/A'
                        }
                      </p>
                    </div>
                 )}
                 
                 {canPerformWorkflow && (
                    <div className="workflow-actions">
                        <h4>Azioni Workflow</h4>
                        {activeDoc.metadati?.stato === 'Bozza' && 
                            <button onClick={() => handleWorkflowAction('In Approvazione')} className="button-workflow">Richiedi Approvazione</button>
                        }
                        {activeDoc.metadati?.stato === 'In Approvazione' && canApproveOrReject &&
                        <>
                            <button onClick={() => handleWorkflowAction('Approvato')} className="button-workflow approve">Approva</button>
                            <button onClick={() => handleWorkflowAction('Rifiutato')} className="button-workflow reject">Rifiuta</button>
                        </>
                        }
                    </div>
                 )}

                 <div className="versions-history">
                    <h4>Cronologia Versioni</h4>
                    {versions.map(v => (
                        <div key={v.id} className="version-item">
                            <span>{v.timestamp_modifica.toLocaleString('it-IT')}</span>
                        </div>
                    ))}
                 </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;