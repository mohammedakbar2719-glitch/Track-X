/**
 * TRACKX - Persistence & Seed Data Layer
 * LocalStorage management, dynamic seed generator for past 7 days, import/export
 */

(function (window) {
  'use strict';

  window.TrackX = window.TrackX || {};
  const { getTodayKey, addDays } = window.TrackX.utils;

  const STORAGE_KEY = 'trackx_data_v1';

  function getDefaultSeedData() {
    const today = getTodayKey();

    const defaultHabits = [
      {
        id: 'h1',
        name: 'Morning Meditation',
        category: 'mind',
        icon: '🧘',
        frequency: 'daily',
        createdAt: addDays(today, -14)
      },
      {
        id: 'h2',
        name: 'Read 20 Pages',
        category: 'growth',
        icon: '📖',
        frequency: 'daily',
        createdAt: addDays(today, -14)
      },
      {
        id: 'h3',
        name: 'Drink 2.5L Water',
        category: 'body',
        icon: '💧',
        frequency: 'daily',
        createdAt: addDays(today, -14)
      },
      {
        id: 'h4',
        name: '30m Deep Work',
        category: 'focus',
        icon: '🎯',
        frequency: 'daily',
        createdAt: addDays(today, -14)
      },
      {
        id: 'h5',
        name: 'Evening Walk & Stretch',
        category: 'body',
        icon: '🏃',
        frequency: 'daily',
        createdAt: addDays(today, -14)
      },
      {
        id: 'h6',
        name: '8h Restful Sleep',
        category: 'body',
        icon: '🌙',
        frequency: 'daily',
        createdAt: addDays(today, -14)
      }
    ];

    const defaultAchievements = [
      {
        id: 'habit_first',
        title: 'First Step',
        desc: 'Complete your first habit check-in',
        icon: '🌱',
        category: 'habits',
        unlockedAt: addDays(today, -6)
      },
      {
        id: 'streak_spark',
        title: 'Spark',
        desc: 'Maintain a 3-day active habit streak',
        icon: '🔥',
        category: 'streaks',
        unlockedAt: addDays(today, -4)
      },
      {
        id: 'streak_momentum',
        title: 'Momentum',
        desc: 'Maintain a 7-day active habit streak',
        icon: '🔥',
        category: 'streaks',
        unlockedAt: null
      },
      {
        id: 'wellness_water_3',
        title: 'Hydration Hero',
        desc: 'Reach your water goal for 3 days',
        icon: '💧',
        category: 'wellness',
        unlockedAt: addDays(today, -1)
      },
      {
        id: 'focus_deep_work',
        title: 'Deep Work',
        desc: 'Complete 5 deep focus sessions',
        icon: '🧠',
        category: 'focus',
        unlockedAt: addDays(today, -2)
      },
      {
        id: 'secret_centurion',
        title: 'Flawless Century',
        desc: 'Achieve 100% daily score across 5 different days',
        icon: '⚡',
        category: 'milestones',
        isSecret: true,
        unlockedAt: addDays(today, -3)
      },
      {
        id: 'wellness_calm_7',
        title: 'Calm Mind',
        desc: 'Complete meditation or mindfulness for 7 days',
        icon: '🧘',
        category: 'wellness',
        unlockedAt: null
      },
      {
        id: 'secret_recharged',
        title: 'Recharged Pioneer',
        desc: 'Log 8+ hours restful sleep after a deep focus session',
        icon: '🌟',
        category: 'milestones',
        isSecret: true,
        unlockedAt: addDays(today, -5)
      }
    ];

    const logs = {};

    const historyPresets = [
      { offset: -6, habits: ['h1', 'h2', 'h3'], water: 2250, sleep: { h: 7.5, q: 4 }, mood: 4, exercise: 30, focus: 45 },
      { offset: -5, habits: ['h1', 'h3', 'h4', 'h6'], water: 2500, sleep: { h: 8.2, q: 5 }, mood: 5, exercise: 45, focus: 60 },
      { offset: -4, habits: ['h1', 'h2', 'h3', 'h5'], water: 2000, sleep: { h: 7.0, q: 3 }, mood: 3, exercise: 20, focus: 40 },
      { offset: -3, habits: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], water: 2750, sleep: { h: 8.0, q: 5 }, mood: 5, exercise: 50, focus: 90 },
      { offset: -2, habits: ['h2', 'h3', 'h4', 'h5'], water: 2500, sleep: { h: 7.8, q: 4 }, mood: 4, exercise: 35, focus: 75 },
      { offset: -1, habits: ['h1', 'h2', 'h3', 'h4', 'h6'], water: 2600, sleep: { h: 8.1, q: 4 }, mood: 5, exercise: 40, focus: 60 },
      { offset: 0, habits: ['h1', 'h3'], water: 1500, sleep: { h: 7.5, q: 4 }, mood: 4, exercise: 30, focus: 50 }
    ];

    historyPresets.forEach((p) => {
      const dStr = addDays(today, p.offset);
      logs[dStr] = {
        completedHabits: p.habits,
        waterIntake: p.water,
        waterGoal: 2500,
        sleep: {
          hours: p.sleep.h,
          quality: p.sleep.q,
          bedtime: '23:15',
          waketime: '07:00'
        },
        exercise: {
          minutes: p.exercise,
          type: 'General Fitness',
          intensity: 'moderate'
        },
        mood: {
          rating: p.mood,
          energy: p.mood,
          tags: ['Grateful', 'Focused'],
          note: p.offset === 0 ? 'Ready to make today count!' : 'Productive and feeling energized.'
        },
        focusMinutes: p.focus
      };
    });

    return {
      version: 1,
      user: {
        name: 'Alex Rivera',
        avatar: '✨',
        bio: 'Becoming 1% better every day.'
      },
      settings: {
        theme: 'light',
        sounds: true,
        dailyWaterGoal: 2500,
        dailySleepGoal: 8,
        dailyFocusGoal: 60,
        dailyExerciseGoal: 30
      },
      habits: defaultHabits,
      achievements: defaultAchievements,
      notifications: {
        readIds: [],
        dismissedIds: [],
        timestamps: {}
      },
      logs
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = getDefaultSeedData();
        saveData(seed);
        return seed;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.habits || !parsed.logs) {
        const seed = getDefaultSeedData();
        saveData(seed);
        return seed;
      }
      return parsed;
    } catch (err) {
      console.error('Error loading data from localStorage, falling back to seed:', err);
      return getDefaultSeedData();
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving data to localStorage:', err);
    }
  }

  function exportDataAsJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackx-backup-${getTodayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importDataFromJSON(fileContent) {
    try {
      const parsed = JSON.parse(fileContent);
      if (!parsed.habits || !parsed.logs || !Array.isArray(parsed.habits)) {
        throw new Error('Invalid TrackX backup file format.');
      }
      saveData(parsed);
      return { success: true, data: parsed };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  window.TrackX.storage = {
    getDefaultSeedData,
    loadData,
    saveData,
    exportDataAsJSON,
    importDataFromJSON
  };

})(window);
