# GymTracker - React Native App

Versione mobile dell'app GymTracker, sviluppata con React Native ed Expo.

## 🚀 Features

- ✅ **Autenticazione** con Supabase
- 💪 **Gestione Allenamenti** - Crea, visualizza, modifica ed elimina allenamenti
- 🏋️ **Gestione Esercizi** - Database personalizzato di esercizi con categorie
- 📊 **Statistiche** - Volume totale, esercizi più frequenti, progressi
- 📅 **Vista Calendario** - Visualizza allenamenti mensili
- 📝 **Template Allenamenti** - Salva e riutilizza allenamenti frequenti
- ☁️ **Sincronizzazione Cloud** - I dati sono sincronizzati con Supabase
- 📱 **Storage Locale** - Funziona offline con AsyncStorage
- 👑 **Sistema Admin** - Modifica esercizi (solo admin)

## 📦 Tecnologie Utilizzate

- **React Native** con **Expo**
- **React Navigation** - Navigazione tra schermate
- **Supabase** - Backend e autenticazione
- **AsyncStorage** - Storage locale
- **Expo Notifications** - Notifiche push
- **Expo Vector Icons** - Icone

## 🛠️ Setup Progetto

### Prerequisiti

- Node.js (v14 o superiore)
- npm o yarn
- Expo CLI
- App Expo Go sul telefono (per testing)

### Installazione

```bash
# Naviga nella cartella del progetto
cd GymTrackerRN

# Installa le dipendenze
npm install

# Avvia il progetto
npm start
```

### Eseguire l'App

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web

# Scansiona QR Code con Expo Go
npm start
```

## 📁 Struttura Progetto

```
GymTrackerRN/
├── src/
│   ├── screens/           # Schermate dell'app
│   │   ├── LoginScreen.js
│   │   ├── WorkoutsScreen.js
│   │   ├── ExercisesScreen.js
│   │   ├── StatsScreen.js
│   │   ├── WorkoutDetailScreen.js
│   │   ├── NewWorkoutScreen.js
│   │   └── CalendarScreen.js
│   ├── components/        # Componenti riutilizzabili
│   ├── navigation/        # Configurazione navigazione
│   │   └── AppNavigator.js
│   ├── context/          # Context API
│   │   └── AuthContext.js
│   ├── services/         # Servizi backend
│   │   ├── supabase.js
│   │   ├── storage.js
│   │   └── supabaseStorage.js
│   └── utils/            # Utility functions
│       ├── colors.js
│       └── stats.js
├── App.js               # Entry point
└── package.json
```

## 🎨 Schermate

### 1. Login/Registrazione

- Autenticazione con email e password
- Integrazione con Supabase Auth

### 2. Allenamenti

- Lista allenamenti con volume e data
- Vista calendario mensile
- Dettaglio allenamento con serie completate
- Creazione nuovo allenamento
- Template allenamenti

### 3. Esercizi

- Filtro per categoria
- Ricerca esercizi
- Aggiunta/modifica esercizi
- Note per esercizio

### 4. Statistiche

- Allenamenti totali, settimanali, mensili
- Volume totale
- Volume per categoria
- Top 5 esercizi più frequenti

## 🔧 Configurazione

### Supabase

Le credenziali Supabase sono configurate in `src/services/supabase.js`:

```javascript
const SUPABASE_URL = 'https://wqrbcfanfasbceiqmubq.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Admin Email

Email amministratore configurata in `src/services/supabase.js`:

```javascript
export const ADMIN_EMAILS = ['lca.valenti@gmail.com'];
```

## 📱 Build per Produzione

### iOS

```bash
# Build per iOS
eas build --platform ios
```

### Android

```bash
# Build per Android
eas build --platform android
```

## 🆘 Troubleshooting

### Errore Metro Bundler

```bash
# Pulisci cache
npm start -- --clear
```

### Errore AsyncStorage

```bash
# Reinstalla dipendenze
rm -rf node_modules
npm install
```

### Errore Supabase

- Verifica che le credenziali siano corrette
- Controlla le policy RLS su Supabase

## 📝 TODO / Future Features

- [X] Timer per riposo tra serie
- [X] Grafici progressi nel tempo
- [ ] Export dati in CSV/PDF
- [ ] Foto progressi
- [ ] Note vocali per esercizi
- [X] Condivisione allenamenti
- [ ] Dark/Light theme toggle
- [ ] Lingua EN/IT

## 👤 Autore

Luca Valenti

## 📄 Licenza

MIT
