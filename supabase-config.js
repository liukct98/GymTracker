// Supabase Configuration
const SUPABASE_URL = 'https://wqrbcfanfasbceiqmubq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcmJjZmFuZmFzYmNlaXFtdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDY0MDMsImV4cCI6MjA4MDQyMjQwM30.DTBb_4NJSTNkFLysLDSvMVL90FaJFQG3f3v1ULPAjlk';

// Admin emails
const ADMIN_EMAILS = ['lca.valenti@gmail.com'];

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase Storage Manager
const SupabaseStorage = {
    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem('gym-current-user');
        return user ? JSON.parse(user) : null;
    },

    // Sync workouts to cloud
    async syncWorkouts() {
        const user = this.getCurrentUser();
        if (!user) return;

        const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
        
        try {
            const { data, error } = await supabase
                .from('workouts')
                .upsert(
                    workouts.map(w => ({
                        id: w.id,
                        user_id: user.id,
                        name: w.name,
                        date: w.date,
                        notes: w.notes,
                        exercises: w.exercises,
                        created_at: w.createdAt
                    })),
                    { onConflict: 'id' }
                );

            if (error) throw error;
            console.log('✓ Workouts synced to cloud');
            return { success: true };
        } catch (error) {
            console.error('Error syncing workouts:', error);
            return { success: false, error };
        }
    },

    // Load workouts from cloud
    async loadWorkouts() {
        const user = this.getCurrentUser();
        if (!user) return [];

        try {
            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            const workouts = data.map(w => ({
                id: w.id,
                name: w.name,
                date: w.date,
                notes: w.notes,
                exercises: w.exercises,
                createdAt: w.created_at
            }));

            localStorage.setItem('workouts', JSON.stringify(workouts));
            console.log('✓ Workouts loaded from cloud');
            return workouts;
        } catch (error) {
            console.error('Error loading workouts:', error);
            return JSON.parse(localStorage.getItem('workouts') || '[]');
        }
    },

    // Sync exercises to cloud
    async syncExercises() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Check if user is admin
        if (!user.isAdmin) {
            console.log('Only admin can modify exercises');
            return { success: false, error: 'Permission denied' };
        }

        const exercises = JSON.parse(localStorage.getItem('exercises') || '[]');
        
        try {
            const { data, error } = await supabase
                .from('exercises')
                .upsert(
                    exercises.map(ex => ({
                        id: ex.id,
                        name: ex.name,
                        category: ex.category,
                        notes: ex.notes,
                        created_at: ex.createdAt
                    })),
                    { onConflict: 'id' }
                );

            if (error) throw error;
            console.log('✓ Exercises synced to cloud');
            return { success: true };
        } catch (error) {
            console.error('Error syncing exercises:', error);
            return { success: false, error };
        }
    },

    // Load exercises from cloud
    async loadExercises() {
        try {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const exercises = data.map(ex => ({
                id: ex.id,
                name: ex.name,
                category: ex.category,
                notes: ex.notes,
                createdAt: ex.created_at
            }));

            localStorage.setItem('exercises', JSON.stringify(exercises));
            console.log('✓ Exercises loaded from cloud');
            return exercises;
        } catch (error) {
            console.error('Error loading exercises:', error);
            return JSON.parse(localStorage.getItem('exercises') || '[]');
        }
    },

    // Full sync (load from cloud, then merge local changes)
    async fullSync() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            showSyncIndicator('syncing');
            
            // Load from cloud first
            await this.loadWorkouts();
            await this.loadExercises();
            
            // Then sync any local changes
            await this.syncWorkouts();
            await this.syncExercises();
            
            showSyncIndicator('success');
            
            return { success: true };
        } catch (error) {
            console.error('Full sync error:', error);
            showSyncIndicator('error');
            return { success: false, error };
        }
    },

    // Register user in Supabase
    async registerUser(username, email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    // Login user with Supabase
    async loginUser(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Sync indicator UI
function showSyncIndicator(state) {
    let indicator = document.getElementById('syncIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'syncIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 10000;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(indicator);
    }

    if (state === 'syncing') {
        indicator.textContent = '🔄 Sincronizzazione...';
        indicator.style.background = '#6366f1';
        indicator.style.color = 'white';
        indicator.style.display = 'block';
    } else if (state === 'success') {
        indicator.textContent = '✓ Sincronizzato';
        indicator.style.background = '#10b981';
        indicator.style.color = 'white';
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    } else if (state === 'error') {
        indicator.textContent = '✗ Errore sincronizzazione';
        indicator.style.background = '#ef4444';
        indicator.style.color = 'white';
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }
}
