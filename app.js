// Storage Manager
const Storage = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    getWorkouts() {
        return this.get('workouts') || [];
    },
    saveWorkouts(workouts) {
        this.set('workouts', workouts);
    },
    getExercises() {
        return this.get('exercises') || [];
    },
    saveExercises(exercises) {
        this.set('exercises', exercises);
    }
};

// App State
let currentWorkout = null;
let editingExerciseIndex = null;
let currentUser = null;

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('gym-current-user');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    currentUser = JSON.parse(user);
    return true;
}

// Logout function
function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        localStorage.removeItem('gym-current-user');
        window.location.href = 'login.html';
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!checkAuth()) return;
    
    // Load data from cloud first
    loadDataFromCloud().then(() => {
        initializeTabs();
        initializeModals();
        initializeForms();
        updateDashboard();
        renderWorkouts();
        renderExercises();
        renderStats();
        
        // Request notification permission
        requestNotificationPermission();
        
        // Check for active timer
        checkActiveTimer();
        
        // Set today's date as default
        document.getElementById('workoutDate').valueAsDate = new Date();
        
        // Display username
        updateUserDisplay();
        
        // Setup auto-sync every 5 minutes
        setInterval(() => {
            SupabaseStorage.fullSync();
        }, 5 * 60 * 1000);
    });
});

// Load data from cloud on startup
async function loadDataFromCloud() {
    if (typeof SupabaseStorage !== 'undefined') {
        await SupabaseStorage.fullSync();
    }
}

// Tab Navigation
function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // Refresh data if needed
            if (targetTab === 'stats') {
                renderStats();
            }
        });
    });
}

// Modal Management
function initializeModals() {
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // New workout button
    document.getElementById('newWorkoutBtn').addEventListener('click', () => {
        openModal('workoutModal');
        currentWorkout = null;
        const workoutForm = document.getElementById('workoutForm');
        workoutForm.reset();
        delete workoutForm.dataset.editingId;
        document.getElementById('workoutDate').valueAsDate = new Date();
        document.getElementById('workoutExercises').innerHTML = '';
        addExerciseEntry();
    });
    
    // New exercise button
    document.getElementById('newExerciseBtn').addEventListener('click', () => {
        openModal('exerciseModal');
        document.getElementById('exerciseForm').reset();
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Forms
function initializeForms() {
    // Workout Form
    const workoutForm = document.getElementById('workoutForm');
    workoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editingId = workoutForm.dataset.editingId;
        saveWorkout(editingId);
        delete workoutForm.dataset.editingId;
    });
    
    // Add Exercise to Workout
    document.getElementById('addExerciseBtn').addEventListener('click', addExerciseEntry);
    
    // Exercise Form
    document.getElementById('exerciseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveExercise();
    });
}

function addExerciseEntry() {
    const container = document.getElementById('workoutExercises');
    const exercises = Storage.getExercises();
    const index = container.children.length;
    
    const entry = document.createElement('div');
    entry.className = 'exercise-entry';
    entry.innerHTML = `
        <button type="button" class="remove-exercise" onclick="this.parentElement.remove()">&times;</button>
        <div class="form-group">
            <label>Esercizio</label>
            <select class="form-input exercise-select" required>
                <option value="">Seleziona esercizio...</option>
                ${exercises.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('')}
            </select>
        </div>
        <div class="sets-container" data-exercise-index="${index}">
            <div class="set-row">
                <span class="set-label">Serie 1:</span>
                <input type="number" placeholder="Reps" class="set-input" min="1" required>
                <input type="number" placeholder="Kg" class="set-input" min="0" step="0.5" required>
                <input type="number" placeholder="Riposo (sec)" class="set-input" min="0" step="5" value="90">
            </div>
        </div>
        <button type="button" class="btn btn-secondary add-set" onclick="addSet(${index})">+ Aggiungi Serie</button>
    `;
    container.appendChild(entry);
}

function addSet(exerciseIndex) {
    const container = document.querySelector(`[data-exercise-index="${exerciseIndex}"]`);
    const setNumber = container.children.length + 1;
    
    const setRow = document.createElement('div');
    setRow.className = 'set-row';
    setRow.innerHTML = `
        <span class="set-label">Serie ${setNumber}:</span>
        <input type="number" placeholder="Reps" class="set-input" min="1" required>
        <input type="number" placeholder="Kg" class="set-input" min="0" step="0.5" required>
        <input type="number" placeholder="Riposo (sec)" class="set-input" min="0" step="5" value="90">
        <button type="button" class="remove-set" onclick="this.parentElement.remove()">🗑️</button>
    `;
    container.appendChild(setRow);
}

function saveWorkout(editingWorkoutId = null) {
    const name = document.getElementById('workoutName').value;
    const date = document.getElementById('workoutDate').value;
    const notes = document.getElementById('workoutNotes').value;
    
    const exerciseEntries = document.querySelectorAll('.exercise-entry');
    const exercises = [];
    
    exerciseEntries.forEach(entry => {
        const exerciseId = entry.querySelector('.exercise-select').value;
        if (!exerciseId) return;
        
        const exerciseData = Storage.getExercises().find(ex => ex.id === exerciseId);
        const sets = [];
        
        const setRows = entry.querySelectorAll('.set-row');
        setRows.forEach(row => {
            const inputs = row.querySelectorAll('.set-input');
            if (inputs.length >= 2) {
                sets.push({
                    reps: parseInt(inputs[0].value),
                    weight: parseFloat(inputs[1].value),
                    rest: inputs.length >= 3 ? parseInt(inputs[2].value) || 90 : 90,
                    completed: false
                });
            }
        });
        
        if (sets.length > 0) {
            exercises.push({
                exerciseId,
                exerciseName: exerciseData.name,
                sets
            });
        }
    });
    
    if (exercises.length === 0) {
        alert('Aggiungi almeno un esercizio con le serie!');
        return;
    }
    
    const workouts = Storage.getWorkouts();
    
    if (editingWorkoutId) {
        // Update existing workout
        const workoutIndex = workouts.findIndex(w => w.id === editingWorkoutId);
        if (workoutIndex !== -1) {
            workouts[workoutIndex] = {
                ...workouts[workoutIndex],
                name,
                date,
                notes,
                exercises
            };
        }
    } else {
        // Create new workout
        const workout = {
            id: Date.now().toString(),
            name,
            date,
            notes,
            exercises,
            createdAt: new Date().toISOString()
        };
        workouts.unshift(workout);
    }
    
    Storage.saveWorkouts(workouts);
    
    // Sync to cloud
    if (typeof SupabaseStorage !== 'undefined') {
        SupabaseStorage.syncWorkouts();
    }
    
    closeModal('workoutModal');
    updateDashboard();
    renderWorkouts();
    renderStats();
}

function saveExercise() {
    const name = document.getElementById('exerciseName').value;
    const category = document.getElementById('exerciseCategory').value;
    const notes = document.getElementById('exerciseNotes').value;
    
    const exercises = Storage.getExercises();
    const exercise = {
        id: Date.now().toString(),
        name,
        category,
        notes,
        createdAt: new Date().toISOString()
    };
    
    exercises.push(exercise);
    Storage.saveExercises(exercises);
    
    // Sync to cloud
    if (typeof SupabaseStorage !== 'undefined') {
        SupabaseStorage.syncExercises();
    }
    
    closeModal('exerciseModal');
    renderExercises();
}

// Dashboard
function updateDashboard() {
    const workouts = Storage.getWorkouts();
    document.getElementById('totalWorkouts').textContent = workouts.length;
    
    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    document.getElementById('weekWorkouts').textContent = weekWorkouts.length;
}

// Render Workouts
function renderWorkouts() {
    const workouts = Storage.getWorkouts();
    const container = document.getElementById('workoutsList');
    
    if (workouts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💪</div>
                <h3>Nessun allenamento ancora</h3>
                <p>Inizia a tracciare i tuoi progressi!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = workouts.map(workout => `
        <div class="workout-card" onclick="viewWorkout('${workout.id}')">
            <div class="workout-header">
                <div>
                    <div class="workout-title">${workout.name}</div>
                    <div class="workout-date">${formatDate(workout.date)}</div>
                </div>
            </div>
            <div class="workout-exercises">
                ${workout.exercises.map(ex => `
                    <span class="exercise-tag">${ex.exerciseName} (${ex.sets.length} serie)</span>
                `).join('')}
            </div>
            ${workout.notes ? `<div class="workout-notes">${workout.notes}</div>` : ''}
        </div>
    `).join('');
}

function viewWorkout(workoutId) {
    const workouts = Storage.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    document.getElementById('detailWorkoutName').textContent = workout.name;
    
    const detailContent = document.getElementById('workoutDetailContent');
    detailContent.innerHTML = `
        <div class="workout-detail-info">
            <strong>Data:</strong> ${formatDate(workout.date)}
            ${workout.notes ? `<br><strong>Note:</strong> ${workout.notes}` : ''}
        </div>
        <div id="timerDisplay" class="timer-display" style="display: none;">
            <div class="timer-label">Riposo</div>
            <div class="timer-value" id="timerValue">0:00</div>
            <button class="btn btn-secondary btn-sm" onclick="stopTimer()">Stop</button>
        </div>
        ${workout.exercises.map((ex, exIndex) => `
            <div class="exercise-detail">
                <h4>${ex.exerciseName}</h4>
                <div class="sets-list">
                    ${ex.sets.map((set, index) => `
                        <div class="set-item-interactive" data-workout-id="${workout.id}" data-exercise-index="${exIndex}" data-set-index="${index}">
                            <label class="set-checkbox">
                                <input type="checkbox" ${set.completed ? 'checked' : ''} onchange="toggleSetCompletion('${workout.id}', ${exIndex}, ${index})">
                                <span class="checkmark"></span>
                            </label>
                            <div class="set-info" onclick="editSet('${workout.id}', ${exIndex}, ${index})">
                                <strong>Serie ${index + 1}</strong>
                                <span>${set.reps} reps × ${set.weight} kg</span>
                                ${set.rest ? `<span class="rest-time">⏱️ ${set.rest}s</span>` : ''}
                            </div>
                            ${set.rest && !set.completed ? `<button class="btn-timer" onclick="startTimer(${set.rest}, '${workout.id}', ${exIndex}, ${index})">⏱️</button>` : ''}
                            <button class="btn-edit-set" onclick="editSet('${workout.id}', ${exIndex}, ${index})" title="Modifica">✏️</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    `;
    
    document.getElementById('editWorkoutBtn').onclick = () => editWorkout(workoutId);
    document.getElementById('restartWorkoutBtn').onclick = () => restartWorkout(workoutId);
    document.getElementById('deleteWorkoutBtn').onclick = () => deleteWorkout(workoutId);
    openModal('workoutDetailModal');
}

function deleteWorkout(workoutId) {
    if (!confirm('Sei sicuro di voler eliminare questo allenamento?')) return;
    
    let workouts = Storage.getWorkouts();
    workouts = workouts.filter(w => w.id !== workoutId);
    Storage.saveWorkouts(workouts);
    
    closeModal('workoutDetailModal');
    updateDashboard();
    renderWorkouts();
    renderStats();
}

function editSet(workoutId, exIndex, setIndex) {
    const workouts = Storage.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    const set = workout.exercises[exIndex].sets[setIndex];
    
    // Create inline edit form
    const setElement = document.querySelector(
        `[data-workout-id="${workoutId}"][data-exercise-index="${exIndex}"][data-set-index="${setIndex}"]`
    );
    
    if (!setElement) return;
    
    const originalContent = setElement.innerHTML;
    
    setElement.innerHTML = `
        <label class="set-checkbox">
            <input type="checkbox" ${set.completed ? 'checked' : ''} disabled>
            <span class="checkmark"></span>
        </label>
        <div class="set-edit-form">
            <input type="number" class="edit-input" value="${set.reps}" min="1" placeholder="Reps">
            <input type="number" class="edit-input" value="${set.weight}" min="0" step="0.5" placeholder="Kg">
            <input type="number" class="edit-input" value="${set.rest || 90}" min="0" step="5" placeholder="Riposo">
        </div>
        <button class="btn-save-set" onclick="saveSetEdit('${workoutId}', ${exIndex}, ${setIndex})">✓</button>
        <button class="btn-cancel-set" onclick="cancelSetEdit('${workoutId}', ${exIndex}, ${setIndex}, \`${originalContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">✕</button>
    `;
    
    // Focus first input
    setElement.querySelector('.edit-input').focus();
}

function saveSetEdit(workoutId, exIndex, setIndex) {
    const setElement = document.querySelector(
        `[data-workout-id="${workoutId}"][data-exercise-index="${exIndex}"][data-set-index="${setIndex}"]`
    );
    
    const inputs = setElement.querySelectorAll('.edit-input');
    const reps = parseInt(inputs[0].value);
    const weight = parseFloat(inputs[1].value);
    const rest = parseInt(inputs[2].value);
    
    if (isNaN(reps) || isNaN(weight) || reps < 1 || weight < 0) {
        alert('Inserisci valori validi!');
        return;
    }
    
    const workouts = Storage.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    workout.exercises[exIndex].sets[setIndex].reps = reps;
    workout.exercises[exIndex].sets[setIndex].weight = weight;
    workout.exercises[exIndex].sets[setIndex].rest = rest;
    
    Storage.saveWorkouts(workouts);
    
    // Refresh view
    viewWorkout(workoutId);
}

function cancelSetEdit(workoutId, exIndex, setIndex, originalContent) {
    viewWorkout(workoutId);
}

function editWorkout(workoutId) {
    const workouts = Storage.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    // Close detail modal
    closeModal('workoutDetailModal');
    
    // Open workout modal in edit mode
    openModal('workoutModal');
    
    // Set editing flag
    const workoutForm = document.getElementById('workoutForm');
    workoutForm.dataset.editingId = workoutId;
    
    // Fill in the form
    document.getElementById('workoutName').value = workout.name;
    document.getElementById('workoutDate').value = workout.date;
    document.getElementById('workoutNotes').value = workout.notes || '';
    
    // Clear and recreate exercises
    const exercisesContainer = document.getElementById('workoutExercises');
    exercisesContainer.innerHTML = '';
    
    workout.exercises.forEach((exercise, exIndex) => {
        const container = document.getElementById('workoutExercises');
        const exercises = Storage.getExercises();
        const index = container.children.length;
        
        const entry = document.createElement('div');
        entry.className = 'exercise-entry';
        entry.innerHTML = `
            <button type="button" class="remove-exercise" onclick="this.parentElement.remove()">&times;</button>
            <div class="form-group">
                <label>Esercizio</label>
                <select class="form-input exercise-select" required>
                    <option value="">Seleziona esercizio...</option>
                    ${exercises.map(ex => `<option value="${ex.id}" ${ex.id === exercise.exerciseId ? 'selected' : ''}>${ex.name}</option>`).join('')}
                </select>
            </div>
            <div class="sets-container" data-exercise-index="${index}">
                ${exercise.sets.map((set, setIndex) => `
                    <div class="set-row">
                        <span class="set-label">Serie ${setIndex + 1}:</span>
                        <input type="number" placeholder="Reps" class="set-input" min="1" value="${set.reps}" required>
                        <input type="number" placeholder="Kg" class="set-input" min="0" step="0.5" value="${set.weight}" required>
                        <input type="number" placeholder="Riposo (sec)" class="set-input" min="0" step="5" value="${set.rest || 90}">
                        ${setIndex > 0 ? '<button type="button" class="remove-set" onclick="this.parentElement.remove()">🗑️</button>' : ''}
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn btn-secondary add-set" onclick="addSet(${index})">+ Aggiungi Serie</button>
        `;
        container.appendChild(entry);
    });
}

function restartWorkout(workoutId) {
    const workouts = Storage.getWorkouts();
    const originalWorkout = workouts.find(w => w.id === workoutId);
    if (!originalWorkout) return;
    
    // Close detail modal
    closeModal('workoutDetailModal');
    
    // Open new workout modal with pre-filled data
    openModal('workoutModal');
    
    // Fill in the form
    document.getElementById('workoutName').value = originalWorkout.name;
    document.getElementById('workoutDate').valueAsDate = new Date();
    document.getElementById('workoutNotes').value = originalWorkout.notes || '';
    
    // Clear and recreate exercises
    const exercisesContainer = document.getElementById('workoutExercises');
    exercisesContainer.innerHTML = '';
    
    originalWorkout.exercises.forEach(exercise => {
        const container = document.getElementById('workoutExercises');
        const exercises = Storage.getExercises();
        const index = container.children.length;
        
        const entry = document.createElement('div');
        entry.className = 'exercise-entry';
        entry.innerHTML = `
            <button type="button" class="remove-exercise" onclick="this.parentElement.remove()">&times;</button>
            <div class="form-group">
                <label>Esercizio</label>
                <select class="form-input exercise-select" required>
                    <option value="">Seleziona esercizio...</option>
                    ${exercises.map(ex => `<option value="${ex.id}" ${ex.id === exercise.exerciseId ? 'selected' : ''}>${ex.name}</option>`).join('')}
                </select>
            </div>
            <div class="sets-container" data-exercise-index="${index}">
                ${exercise.sets.map((set, setIndex) => `
                    <div class="set-row">
                        <span class="set-label">Serie ${setIndex + 1}:</span>
                        <input type="number" placeholder="Reps" class="set-input" min="1" value="${set.reps}" required>
                        <input type="number" placeholder="Kg" class="set-input" min="0" step="0.5" value="${set.weight}" required>
                        <input type="number" placeholder="Riposo (sec)" class="set-input" min="0" step="5" value="${set.rest || 90}">
                        ${setIndex > 0 ? '<button type="button" class="remove-set" onclick="this.parentElement.remove()">🗑️</button>' : ''}
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn btn-secondary add-set" onclick="addSet(${index})">+ Aggiungi Serie</button>
        `;
        container.appendChild(entry);
    });
}

// Render Exercises
function renderExercises() {
    const exercises = Storage.getExercises();
    const container = document.getElementById('exercisesGrid');
    
    if (exercises.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏋️</div>
                <h3>Nessun esercizio salvato</h3>
                <p>Crea il tuo database di esercizi!</p>
            </div>
        `;
        return;
    }
    
    const workouts = Storage.getWorkouts();
    const exerciseUsage = {};
    workouts.forEach(workout => {
        workout.exercises.forEach(ex => {
            exerciseUsage[ex.exerciseId] = (exerciseUsage[ex.exerciseId] || 0) + 1;
        });
    });
    
    container.innerHTML = exercises.map(exercise => `
        <div class="exercise-card">
            <div class="exercise-header">
                <div class="exercise-name">${exercise.name}</div>
                <button class="delete-exercise" onclick="deleteExercise('${exercise.id}')" title="Elimina">🗑️</button>
            </div>
            <span class="category-badge ${exercise.category}">${exercise.category}</span>
            ${exercise.notes ? `<div class="exercise-stats" style="margin-top: 10px;">${exercise.notes}</div>` : ''}
            <div class="exercise-stats">
                Usato ${exerciseUsage[exercise.id] || 0} volte
            </div>
        </div>
    `).join('');
}

function deleteExercise(exerciseId) {
    if (!confirm('Sei sicuro di voler eliminare questo esercizio?')) return;
    
    let exercises = Storage.getExercises();
    exercises = exercises.filter(ex => ex.id !== exerciseId);
    Storage.saveExercises(exercises);
    
    renderExercises();
}

// Stats
function renderStats() {
    renderMonthlyChart();
    renderTopExercises();
    updateExerciseSelect();
}

function renderMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    const ctx = canvas.getContext('2d');
    const workouts = Storage.getWorkouts();
    
    // Get last 6 months
    const months = [];
    const counts = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('it-IT', { month: 'short' }));
        
        const monthWorkouts = workouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate.getMonth() === date.getMonth() && 
                   workoutDate.getFullYear() === date.getFullYear();
        });
        counts.push(monthWorkouts.length);
    }
    
    drawBarChart(ctx, canvas, months, counts);
}

function drawBarChart(ctx, canvas, labels, data) {
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = 300;
    const padding = 40;
    const barWidth = (width - padding * 2) / labels.length;
    const maxValue = Math.max(...data, 5);
    
    ctx.clearRect(0, 0, width, height);
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#6b7280';
    
    // Draw bars
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (height - padding * 2);
        const x = padding + index * barWidth + barWidth * 0.2;
        const y = height - padding - barHeight;
        
        // Bar
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x, y, barWidth * 0.6, barHeight);
        
        // Value
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth * 0.3, y - 10);
        
        // Label
        ctx.fillStyle = '#6b7280';
        ctx.fillText(labels[index], x + barWidth * 0.3, height - 10);
    });
}

function renderTopExercises() {
    const workouts = Storage.getWorkouts();
    const exercises = Storage.getExercises();
    const container = document.getElementById('topExercises');
    
    const exerciseCount = {};
    workouts.forEach(workout => {
        workout.exercises.forEach(ex => {
            exerciseCount[ex.exerciseId] = (exerciseCount[ex.exerciseId] || 0) + 1;
        });
    });
    
    const sorted = Object.entries(exerciseCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: var(--gray);">Nessun dato disponibile</p>';
        return;
    }
    
    container.innerHTML = sorted.map(([id, count], index) => {
        const exercise = exercises.find(ex => ex.id === id);
        if (!exercise) return '';
        
        return `
            <div class="top-exercise-item">
                <span class="exercise-rank">${index + 1}</span>
                <div class="exercise-info">
                    <div class="exercise-info-name">${exercise.name}</div>
                </div>
                <span class="exercise-count">${count}</span>
            </div>
        `;
    }).join('');
}

function updateExerciseSelect() {
    const exercises = Storage.getExercises();
    const select = document.getElementById('exerciseSelect');
    
    select.innerHTML = '<option value="">Seleziona esercizio...</option>' +
        exercises.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('');
    
    select.onchange = () => renderProgressChart(select.value);
}

function renderProgressChart(exerciseId) {
    if (!exerciseId) {
        const canvas = document.getElementById('progressChart');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    const workouts = Storage.getWorkouts();
    const data = [];
    
    workouts.forEach(workout => {
        workout.exercises.forEach(ex => {
            if (ex.exerciseId === exerciseId && ex.sets.length > 0) {
                const maxWeight = Math.max(...ex.sets.map(s => s.weight));
                data.push({
                    date: new Date(workout.date),
                    weight: maxWeight
                });
            }
        });
    });
    
    data.sort((a, b) => a.date - b.date);
    
    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = 300;
    
    if (data.length === 0) {
        ctx.clearRect(0, 0, width, height);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText('Nessun dato disponibile', width / 2, height / 2);
        return;
    }
    
    drawLineChart(ctx, canvas, data);
}

function drawLineChart(ctx, canvas, data) {
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    
    ctx.clearRect(0, 0, width, height);
    
    const maxWeight = Math.max(...data.map(d => d.weight));
    const minWeight = Math.min(...data.map(d => d.weight));
    const range = maxWeight - minWeight || 1;
    
    // Draw line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
        const y = height - padding - ((point.weight - minWeight) / range) * (height - padding * 2);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = '#6366f1';
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
        const y = height - padding - ((point.weight - minWeight) / range) * (height - padding * 2);
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.fillText(`${point.weight}kg`, x, y - 15);
    });
}

// Timer functionality with timestamp and Service Worker
let timerInterval = null;
let serviceWorkerRegistration = null;

// Initialize Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            serviceWorkerRegistration = registration;
            console.log('Service Worker registered');
        })
        .catch(err => console.log('Service Worker registration failed:', err));
}

// Request notification permission on load
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
        });
    }
}

// Call on app init
document.addEventListener('DOMContentLoaded', () => {
    requestNotificationPermission();
    // ... existing initialization
});

function startTimer(seconds, workoutId, exIndex, setIndex) {
    if (timerInterval) clearInterval(timerInterval);
    
    const timerDisplay = document.getElementById('timerDisplay');
    const timerValue = document.getElementById('timerValue');
    timerDisplay.style.display = 'flex';
    
    // Save timer with timestamp
    const endTime = Date.now() + (seconds * 1000);
    const timerData = {
        endTime,
        workoutId,
        exIndex,
        setIndex,
        duration: seconds
    };
    
    Storage.set('activeTimer', timerData);
    
    // Schedule notification via Service Worker
    if (serviceWorkerRegistration && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.controller?.postMessage({
            type: 'SET_TIMER',
            endTime: endTime,
            title: '⏰ Riposo terminato!',
            body: 'Pronto per la prossima serie 💪'
        });
    }
    
    // Update display
    updateTimerFromTimestamp(endTime);
    
    timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        updateTimerDisplay(remaining);
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            Storage.set('activeTimer', null);
            
            // Show notification if in foreground
            if (document.visibilityState === 'visible') {
                showTimerComplete();
            }
            
            // Auto-hide after 2 seconds
            setTimeout(() => {
                timerDisplay.style.display = 'none';
            }, 2000);
        }
    }, 100); // Update more frequently for accuracy
}

function updateTimerFromTimestamp(endTime) {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    updateTimerDisplay(remaining);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    Storage.set('activeTimer', null);
    document.getElementById('timerDisplay').style.display = 'none';
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timerValue').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function showTimerComplete() {
    // Visual feedback
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    // Play sound (browser beep)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    setTimeout(() => {
        timerDisplay.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    }, 2000);
}

// Check for active timer on page load/visibility change
function checkActiveTimer() {
    const timerData = Storage.get('activeTimer');
    if (timerData && timerData.endTime) {
        const remaining = Math.floor((timerData.endTime - Date.now()) / 1000);
        
        if (remaining > 0) {
            // Timer still active, resume it
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                startTimer(remaining, timerData.workoutId, timerData.exIndex, timerData.setIndex);
            }
        } else {
            // Timer expired while away
            Storage.set('activeTimer', null);
        }
    }
}

// Check timer when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        checkActiveTimer();
    }
});

function toggleSetCompletion(workoutId, exIndex, setIndex) {
    const workouts = Storage.getWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    workout.exercises[exIndex].sets[setIndex].completed = !workout.exercises[exIndex].sets[setIndex].completed;
    Storage.saveWorkouts(workouts);
    
    // If completed, start timer if rest time exists
    const set = workout.exercises[exIndex].sets[setIndex];
    if (set.completed && set.rest) {
        startTimer(set.rest, workoutId, exIndex, setIndex);
    }
}

// User Display
function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && currentUser) {
        userDisplay.textContent = `👤 ${currentUser.username}`;
    }
}

// Utility
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}
