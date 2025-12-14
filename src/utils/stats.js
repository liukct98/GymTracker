export const calculateVolume = (exercises) => {
  let totalVolume = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      if (set.completed) {
        totalVolume += set.reps * set.weight;
      }
    });
  });
  return totalVolume;
};

export const getWeekWorkouts = (workouts) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return workouts.filter((w) => new Date(w.date) >= oneWeekAgo).length;
};

export const getMonthWorkouts = (workouts, year, month) => {
  return workouts.filter((w) => {
    const date = new Date(w.date);
    return date.getFullYear() === year && date.getMonth() === month;
  }).length;
};

export const getWorkoutsByDate = (workouts, dateStr) => {
  return workouts.filter((w) => w.date === dateStr);
};
