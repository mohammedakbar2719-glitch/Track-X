/**
 * TRACKX - Centralized Smart Insights Engine
 * Generates authentic, factual insights strictly derived from actual TrackX logs,
 * habit completions, streaks, and milestone evaluations (zero fabricated statistics).
 */

(function (window) {
  'use strict';

  window.TrackX = window.TrackX || {};
  const { state, utils } = window.TrackX;
  const { getTodayKey, addDays } = utils;

  /**
   * Generates factual, data-grounded insights for TrackX
   */
  function generateSmartInsights(rangeDays = 30) {
    if (!state || !state.data) return [];

    const today = getTodayKey();
    const logs = state.data.logs || {};
    const habits = state.data.habits || [];
    const sortedDates = Object.keys(logs).sort();

    // 1. Check if user has sufficient activity
    let totalCompletions = 0;
    Object.values(logs).forEach((log) => {
      if (log.completedHabits) totalCompletions += log.completedHabits.length;
    });

    if (totalCompletions === 0 || sortedDates.length === 0) {
      return [
        {
          id: 'insight_start',
          icon: '🌱',
          headline: 'Your personal growth journey begins today',
          detail: 'Keep tracking to unlock personalized insights.',
          type: 'neutral'
        }
      ];
    }

    const insights = [];

    // ------------------------------------------------------------------------
    // Insight A: Active Streak Milestone
    // ------------------------------------------------------------------------
    const currentStreak = state.calculateOverallStreak();
    const bestStreak = state.calculateBestStreak();

    if (currentStreak >= 3) {
      insights.push({
        id: 'insight_streak',
        icon: '🔥',
        headline: `You're currently on a ${currentStreak}-day streak.`,
        detail: currentStreak === bestStreak
          ? `This is your all-time personal best! Maintain your rhythm today.`
          : `Great momentum! Your all-time record is ${bestStreak} days.`,
        type: 'positive'
      });
    } else if (currentStreak > 0) {
      insights.push({
        id: 'insight_streak_starter',
        icon: '⚡',
        headline: `Active streak in motion: ${currentStreak} day${currentStreak > 1 ? 's' : ''}.`,
        detail: 'Consistency is built one day at a time. Complete today\'s habits to level up.',
        type: 'positive'
      });
    }

    // ------------------------------------------------------------------------
    // Insight B: Milestones Within Reach
    // ------------------------------------------------------------------------
    if (window.TrackX.achievements && typeof window.TrackX.achievements.evaluateMilestones === 'function') {
      const milestones = window.TrackX.achievements.evaluateMilestones();
      const almostList = milestones.filter((m) => m.cardState === 'almost_unlocked' && !m.isSecret);

      if (almostList.length > 0) {
        const topAlmost = almostList[0];
        insights.push({
          id: 'insight_milestones',
          icon: '🏆',
          headline: almostList.length === 1
            ? '1 achievement is within reach.'
            : `${almostList.length} achievements are within reach.`,
          detail: `${topAlmost.title}: ${topAlmost.statusText} to claim +${topAlmost.xp} XP.`,
          type: 'highlight'
        });
      }
    }

    // ------------------------------------------------------------------------
    // Insight C: Skill Consistency & 30-Day Trend
    // ------------------------------------------------------------------------
    const datesCurrent = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      datesCurrent.push(addDays(today, -i));
    }
    const datesPrevious = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      datesPrevious.push(addDays(today, -rangeDays - i));
    }

    const categories = ['focus', 'mind', 'body', 'growth'];
    let bestImprovement = { skill: null, delta: 0 };
    let bestConsistency = { skill: null, rate: 0 };

    categories.forEach((cat) => {
      const catHabits = habits.filter((h) => (h.category || '').toLowerCase() === cat);
      if (catHabits.length === 0) return;

      let curActiveDays = 0;
      datesCurrent.forEach((d) => {
        const log = state.getDayLog(d);
        if (log.completedHabits && catHabits.some((h) => log.completedHabits.includes(h.id))) {
          curActiveDays++;
        }
      });
      const curPct = Math.round((curActiveDays / datesCurrent.length) * 100);

      let prevActiveDays = 0;
      datesPrevious.forEach((d) => {
        const log = state.getDayLog(d);
        if (log.completedHabits && catHabits.some((h) => log.completedHabits.includes(h.id))) {
          prevActiveDays++;
        }
      });
      const prevPct = Math.round((prevActiveDays / datesPrevious.length) * 100);

      const delta = curPct - prevPct;
      if (delta > bestImprovement.delta) {
        bestImprovement = { skill: cat, delta };
      }

      if (curPct > bestConsistency.rate) {
        bestConsistency = { skill: cat, rate: curPct };
      }
    });

    const categoryNames = {
      focus: 'Focus',
      mind: 'Mindfulness',
      body: 'Fitness & Health',
      growth: 'Learning'
    };

    if (bestImprovement.skill && bestImprovement.delta >= 5) {
      const name = categoryNames[bestImprovement.skill] || bestImprovement.skill;
      insights.push({
        id: 'insight_improvement',
        icon: '📈',
        headline: `Your ${name} consistency increased ${bestImprovement.delta}% over the last ${rangeDays} days.`,
        detail: `Higher execution frequency is compounds your mastery in this pillar.`,
        type: 'positive'
      });
    } else if (bestConsistency.skill && bestConsistency.rate > 0) {
      const name = categoryNames[bestConsistency.skill] || bestConsistency.skill;
      insights.push({
        id: 'insight_best_consistency',
        icon: '🎯',
        headline: `${name} is your most consistent developmental area.`,
        detail: `Maintained ${bestConsistency.rate}% active execution across the last ${rangeDays} days.`,
        type: 'positive'
      });
    }

    // ------------------------------------------------------------------------
    // Insight D: Wellness Consistency This Week
    // ------------------------------------------------------------------------
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      past7Days.push(addDays(today, -i));
    }

    let waterGoalDays = 0;
    let goodSleepDays = 0;

    past7Days.forEach((d) => {
      const log = state.getDayLog(d);
      if (log.waterIntake && log.waterIntake >= (log.waterGoal || 2500)) {
        waterGoalDays++;
      }
      if (log.sleep && log.sleep.hours >= 7) {
        goodSleepDays++;
      }
    });

    if (waterGoalDays >= 4) {
      insights.push({
        id: 'insight_hydration',
        icon: '💧',
        headline: `Hydration has been your most consistent wellness habit this week.`,
        detail: `Achieved your target on ${waterGoalDays} of 7 days (${Math.round((waterGoalDays / 7) * 100)}%).`,
        type: 'positive'
      });
    } else if (goodSleepDays >= 4) {
      insights.push({
        id: 'insight_sleep',
        icon: '🌙',
        headline: `Restful sleep has been your top wellness anchor this week.`,
        detail: `Logged 7+ hours on ${goodSleepDays} of 7 days (${Math.round((goodSleepDays / 7) * 100)}%).`,
        type: 'positive'
      });
    }

    // Fallback if not enough specific insights
    if (insights.length === 0) {
      insights.push({
        id: 'insight_fallback',
        icon: '✨',
        headline: 'Building your baseline pattern',
        detail: 'Keep tracking to unlock personalized insights.',
        type: 'neutral'
      });
    }

    return insights;
  }

  window.TrackX.insights = {
    generateSmartInsights
  };

})(window);
