# 🚀 Quick Start - GymTracker React Native

## Avvia l'App

```bash
cd /Users/lucavalenti/Desktop/GymTracker/GymTrackerRN
npm start
```

Poi:
- Premi `i` per iOS Simulator
- Premi `a` per Android Emulator  
- Scansiona il QR Code con Expo Go sul telefono

## Test Credenziali

Usa le stesse credenziali dell'app web o registra un nuovo account.

## Funzionalità Implementate

✅ Login/Registrazione con Supabase
✅ Gestione Allenamenti (CRUD completo)
✅ Gestione Esercizi con categorie e note
✅ Vista Calendario mensile
✅ Template Allenamenti
✅ Statistiche e Volume tracking
✅ Sincronizzazione Cloud + Storage locale
✅ Sistema Admin (lca.valenti@gmail.com)

## Differenze rispetto all'app Web

### Implementato:
- Tutte le funzionalità principali
- Navigazione mobile-friendly
- Storage locale con AsyncStorage
- UI/UX ottimizzata per mobile

### Da implementare (opzionale):
- Timer con notifiche per riposo tra serie
- Modifica serie durante l'allenamento
- Grafici progressi temporali
- Export dati

## Struttura Navigazione

```
LoginScreen (se non autenticato)
    ↓
TabNavigator
    ├─ Allenamenti Tab
    │   ├─ Lista Allenamenti
    │   ├─ → Dettaglio Allenamento
    │   ├─ → Nuovo Allenamento
    │   └─ → Vista Calendario
    ├─ Esercizi Tab
    │   └─ Lista/Gestione Esercizi
    └─ Statistiche Tab
        └─ Dashboard Statistiche
```

## Debug

Se l'app non si avvia:

```bash
# Pulisci cache
npm start -- --clear

# Reinstalla node_modules
rm -rf node_modules
npm install

# Verifica Supabase
# Controlla che le credenziali in src/services/supabase.js siano corrette
```

## Note Tecniche

- **React Native**: 0.81.5
- **Expo**: ~54.0
- **React Navigation**: v7
- **Supabase**: v2.86
- **AsyncStorage**: v2.2

## Prossimi Passi

1. Testa tutte le funzionalità
2. Personalizza colori in `src/utils/colors.js`
3. Aggiungi icone personalizzate in `assets/`
4. Build per produzione con `eas build`
