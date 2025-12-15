# Deployment su GitHub Pages

## ✅ Configurazione Completata

La tua app è ora pronta per essere deployata come webapp su GitHub Pages!

## 📋 Come Fare il Deploy

### Opzione 1: Deploy Automatico (Consigliato)

1. **Pusha il codice su GitHub:**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages"
   git push origin main
   ```
   
   ⚠️ **Nota:** Se il tuo branch principale si chiama `master` invece di `main`, assicurati che il file `.github/workflows/deploy.yml` sia configurato correttamente.

2. **Abilita GitHub Pages:**
   - Vai su GitHub.com → il tuo repository
   - Settings → Pages
   - Source: seleziona "Deploy from a branch"
   - Branch: seleziona `gh-pages` e `/ (root)`
   - Clicca Save

3. **Aspetta il completamento:**
   - Vai alla tab "Actions" del tuo repository
   - Vedrai il workflow "Deploy to GitHub Pages" in esecuzione
   - Una volta completato (check verde ✅), la tua app sarà live!

4. **Accedi alla tua app:**
   La tua webapp sarà disponibile all'indirizzo:
   **https://liukct98.github.io/GymTracker**

### Opzione 2: Deploy Manuale

Se preferisci fare il deploy manualmente:

```bash
npm run deploy
```

Questo comando:
- Fa il build dell'app per il web (`npm run build:web`)
- Pubblica il contenuto su GitHub Pages

## 🔧 Script Aggiunti

- `npm run build:web` - Crea il build ottimizzato per il web
- `npm run deploy` - Deploy manuale su GitHub Pages

## 📱 Funzionalità Web

La tua app React Native funzionerà sul web con:
- ✅ Stessa UI e logica dell'app mobile
- ✅ Autenticazione Supabase
- ✅ Storage persistente (localStorage invece di AsyncStorage)
- ✅ Responsive design ottimizzato per mobile
- ✅ Funziona su qualsiasi browser moderno

## 🚨 Nota Importante

Alcune funzionalità potrebbero non essere disponibili sul web:
- Notifiche push native
- Accesso al calendario nativo (expo-calendar)
- Alcune feature specifiche mobile

Per una migliore esperienza utente mobile, considera di usare l'app nativa quando possibile.

## 🔄 Aggiornamenti Futuri

Ogni volta che pushes codice sul branch main/master:
1. GitHub Actions farà automaticamente il build
2. Aggiornerà la versione live su GitHub Pages
3. Le modifiche saranno visibili entro 1-2 minuti

## 🐛 Troubleshooting

Se la app non funziona dopo il deploy:
1. Controlla la console del browser (F12) per errori
2. Verifica che le API keys di Supabase siano valide
3. Assicurati che l'URL in `package.json` ("homepage") corrisponda al tuo repository
4. Controlla che GitHub Pages sia abilitato nelle impostazioni del repository
