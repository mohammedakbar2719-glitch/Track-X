/**
 * TRACKX - Main Application Orchestrator
 * View routing, date navigator, theme switcher, modal management, and settings handlers
 */

(function (window) {
  'use strict';

  window.TrackX = window.TrackX || {};
  const { state, utils, storage, dashboard, habits, progress, calendar, achievements, notifications } = window.TrackX;
  const { icons, formatDisplayDate, addDays, isToday, getTodayKey, showToast, sounds } = utils;
  const { exportDataAsJSON, importDataFromJSON } = storage;
  const { initDashboard, renderDashboard } = dashboard;
  const { initHabits, renderHabits } = habits;
  const { initProgress, renderProgress } = progress;
  const { initCalendar, renderCalendar } = calendar;
  const { initAchievements, renderAchievements } = achievements;
  const { initNotifications } = notifications || {};

  function initApp() {
    // Apply saved theme
    const currentTheme = state.data.settings.theme || 'light';
    applyTheme(currentTheme);

    // Initialize sound settings
    sounds.enabled = state.data.settings.sounds !== false;

    // Initialize all view modules
    initDashboard();
    initHabits();
    initProgress();
    initCalendar();
    initAchievements();
    if (initNotifications) initNotifications();
    if (window.TrackX.showcase && window.TrackX.showcase.initShowcase) {
      window.TrackX.showcase.initShowcase();
    }

    // Setup Global Navigators and Controls
    setupNavigation();
    setupDateNavigator();
    setupThemeToggle();
    setupNewHabitModal();
    setupSettingsHandlers();
    setupKeyboardShortcuts();

    // Listen for state changes to sync top bar and active views
    state.subscribe((event) => {
      syncTopBarDate();
      syncSidebarProfile();
    });

    // Initial render of current view
    switchView(state.getActiveView());
    syncTopBarDate();
    syncSidebarProfile();
  }

  // ==========================================
  // VIEW ROUTING
  // ==========================================

  function switchView(viewName) {
    state.setActiveView(viewName);

    // Update Desktop Sidebar active states
    document.querySelectorAll('.app-sidebar .nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update Mobile Bottom Nav active states
    document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Toggle View Panels
    document.querySelectorAll('.view-panel').forEach((panel) => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view${capitalize(viewName)}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Trigger view-specific render
    if (viewName === 'today') renderDashboard();
    else if (viewName === 'habits') renderHabits();
    else if (viewName === 'progress') renderProgress();
    else if (viewName === 'calendar') renderCalendar();
    else if (viewName === 'achievements') renderAchievements();
    else if (viewName === 'settings') renderSettings();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupNavigation() {
    document.querySelectorAll('.app-sidebar .nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) switchView(view);
      });
    });

    document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view) switchView(view);
      });
    });

    const userCard = document.getElementById('sidebarUserCard');
    if (userCard) {
      userCard.addEventListener('click', () => switchView('settings'));
    }

    const topProfileBtn = document.getElementById('topProfileBtn');
    if (topProfileBtn) {
      topProfileBtn.addEventListener('click', () => switchView('settings'));
    }
  }

  // ==========================================
  // DATE NAVIGATOR IN TOP APP BAR
  // ==========================================

  function setupDateNavigator() {
    const prevBtn = document.getElementById('datePrevBtn');
    const nextBtn = document.getElementById('dateNextBtn');
    const centerBtn = document.getElementById('dateCenterLabel');
    const todayBtn = document.getElementById('dateTodayShortcut');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const current = state.getSelectedDate();
        state.setSelectedDate(addDays(current, -1));
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const current = state.getSelectedDate();
        state.setSelectedDate(addDays(current, 1));
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.setSelectedDate(getTodayKey());
      });
    }

    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        switchView('calendar');
      });
    }
  }

  function syncTopBarDate() {
    const selectedDate = state.getSelectedDate();
    const label = document.getElementById('dateText');
    const todayShortcut = document.getElementById('dateTodayShortcut');

    if (label) {
      label.textContent = formatDisplayDate(selectedDate);
    }

    if (todayShortcut) {
      todayShortcut.style.display = isToday(selectedDate) ? 'none' : 'inline-block';
    }
  }

  function syncSidebarProfile() {
    const nameEl = document.getElementById('sidebarUserName');
    const streakEl = document.getElementById('sidebarUserStreak');
    const avatarEl = document.getElementById('sidebarUserAvatar');
    const topAvatarEl = document.getElementById('topProfileAvatar');

    if (nameEl) nameEl.textContent = state.data.user.name || 'User';
    if (avatarEl) avatarEl.textContent = state.data.user.avatar || '✨';
    if (topAvatarEl) topAvatarEl.textContent = state.data.user.avatar || '✨';
    if (streakEl) {
      const streak = state.calculateOverallStreak();
      streakEl.innerHTML = `${icons.flame} <span>${streak}d streak</span>`;
    }
  }

  // ==========================================
  // THEME SWITCHER (Light / Dark)
  // ==========================================

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === 'dark' ? icons.sun : icons.moon;
      toggleBtn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = state.data.settings.theme || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        state.updateSettings({ theme: next });
        applyTheme(next);
        sounds.playPop();
      });
    }
  }

  // ==========================================
  // NEW HABIT MODAL
  // ==========================================

  function setupNewHabitModal() {
    const modal = document.getElementById('newHabitModal');
    const closeBtn = document.getElementById('closeNewHabitModalBtn');
    const cancelBtn = document.getElementById('cancelNewHabitBtn');
    const form = document.getElementById('newHabitForm');
    const iconOptions = document.querySelectorAll('.icon-picker-item');

    let selectedIcon = '✨';

    iconOptions.forEach((opt) => {
      opt.addEventListener('click', () => {
        iconOptions.forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedIcon = opt.textContent.trim();
      });
    });

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('habitNameInput');
        const catInput = document.getElementById('habitCategoryInput');
        const freqInput = document.getElementById('habitFrequencyInput');

        if (!nameInput || !nameInput.value.trim()) {
          alert('Please enter a habit name.');
          return;
        }

        state.addHabit({
          name: nameInput.value.trim(),
          category: catInput ? catInput.value : 'mind',
          icon: selectedIcon,
          frequency: freqInput ? freqInput.value : 'daily'
        });

        nameInput.value = '';
        closeModal();
      });
    }
  }

  // ==========================================
  // SETTINGS VIEW
  // ==========================================

  function renderSettings() {
    const container = document.getElementById('viewSettings');
    if (!container) return;

    const s = state.data.settings;
    const u = state.data.user;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="section-title">Settings & Preferences</h1>
          <p class="section-meta">Customize your tracking goals, profile, and app experience</p>
        </div>
      </div>

      <div class="settings-container">
        <!-- Profile Settings -->
        <div class="settings-card">
          <h3 class="section-title" style="font-size: 16px;">Personal Profile</h3>
          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Your Name</span>
              <span class="settings-desc">Displayed on your dashboard header</span>
            </div>
            <input type="text" id="settingsUserName" class="settings-input" style="width: 180px;" value="${u.name || ''}">
          </div>

          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Avatar Emoji</span>
              <span class="settings-desc">Your personal visual token</span>
            </div>
            <input type="text" id="settingsUserAvatar" class="settings-input" style="width: 60px; text-align: center;" maxlength="2" value="${u.avatar || '✨'}">
          </div>
        </div>

        <!-- Daily Targets -->
        <div class="settings-card">
          <h3 class="section-title" style="font-size: 16px;">Daily Wellness Targets</h3>
          
          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Water Goal (ml)</span>
              <span class="settings-desc">Target daily water consumption</span>
            </div>
            <input type="number" id="settingsWaterGoal" class="settings-input" value="${s.dailyWaterGoal || 2500}" step="100">
          </div>

          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Sleep Target (Hours)</span>
              <span class="settings-desc">Recommended restful sleep duration</span>
            </div>
            <input type="number" id="settingsSleepGoal" class="settings-input" value="${s.dailySleepGoal || 8}" step="0.5">
          </div>

          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Focus Target (Minutes)</span>
              <span class="settings-desc">Daily deep focus time goal</span>
            </div>
            <input type="number" id="settingsFocusGoal" class="settings-input" value="${s.dailyFocusGoal || 60}" step="15">
          </div>
        </div>

        <!-- Audio & Appearance -->
        <div class="settings-card">
          <h3 class="section-title" style="font-size: 16px;">App Preferences</h3>

          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Sound Effects</span>
              <span class="settings-desc">Subtle micro-audio on clicks & streaks</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="settingsSoundToggle" ${s.sounds !== false ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-label-wrap">
              <span class="settings-label">Appearance Mode</span>
              <span class="settings-desc">Light or Dark aesthetic</span>
            </div>
            <button class="btn-secondary" id="settingsThemeBtn" style="padding: 6px 14px; font-size: 13px;">
              ${s.theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
            </button>
          </div>
        </div>

        <!-- Data Portability -->
        <div class="settings-card">
          <h3 class="section-title" style="font-size: 16px;">Data & Backup</h3>
          <p class="settings-desc" style="margin-top: -8px;">
            All your records are stored locally in your browser. Export anytime to back up your habits and logs.
          </p>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn-secondary" id="exportDataBtn">
              📥 Export Backup (JSON)
            </button>
            
            <label class="btn-secondary" style="cursor: pointer;">
              📤 Import Backup
              <input type="file" id="importFileInput" accept=".json" style="display: none;">
            </label>

            <button class="btn-secondary" id="resetDataBtn" style="color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.3);">
              🔄 Reset Demo Data
            </button>
          </div>
        </div>

        <!-- Track X Product Showcase & Feature Tour -->
        ${window.TrackX.showcase && window.TrackX.showcase.getSettingsShowcaseHTML ? window.TrackX.showcase.getSettingsShowcaseHTML() : ''}
      </div>
    `;

    attachSettingsEvents(container);
  }

  function setupSettingsHandlers() {}

  function attachSettingsEvents(container) {
    const nameInput = container.querySelector('#settingsUserName');
    if (nameInput) {
      nameInput.addEventListener('change', () => {
        state.updateProfile({ name: nameInput.value.trim() });
        showToast('Profile updated', 'success', '👤');
      });
    }

    const avatarInput = container.querySelector('#settingsUserAvatar');
    if (avatarInput) {
      avatarInput.addEventListener('change', () => {
        state.updateProfile({ avatar: avatarInput.value.trim() });
        showToast('Avatar updated', 'success', avatarInput.value.trim() || '✨');
      });
    }

    const waterInput = container.querySelector('#settingsWaterGoal');
    if (waterInput) {
      waterInput.addEventListener('change', () => {
        const val = parseInt(waterInput.value, 10);
        if (val > 0) state.updateSettings({ dailyWaterGoal: val });
      });
    }

    const sleepInput = container.querySelector('#settingsSleepGoal');
    if (sleepInput) {
      sleepInput.addEventListener('change', () => {
        const val = parseFloat(sleepInput.value);
        if (val > 0) state.updateSettings({ dailySleepGoal: val });
      });
    }

    const focusInput = container.querySelector('#settingsFocusGoal');
    if (focusInput) {
      focusInput.addEventListener('change', () => {
        const val = parseInt(focusInput.value, 10);
        if (val > 0) state.updateSettings({ dailyFocusGoal: val });
      });
    }

    const soundToggle = container.querySelector('#settingsSoundToggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        state.updateSettings({ sounds: soundToggle.checked });
        showToast(soundToggle.checked ? 'Sounds enabled' : 'Sounds muted', 'info', '🔊');
      });
    }

    const themeBtn = container.querySelector('#settingsThemeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = state.data.settings.theme || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        state.updateSettings({ theme: next });
        applyTheme(next);
        renderSettings();
      });
    }

    const exportBtn = container.querySelector('#exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportDataAsJSON(state.data);
        showToast('Backup JSON downloaded', 'success', '💾');
      });
    }

    const importInput = container.querySelector('#importFileInput');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const res = importDataFromJSON(ev.target.result);
          if (res.success) {
            state.data = res.data;
            showToast('Data imported successfully!', 'success', '🎉');
            renderSettings();
          } else {
            alert('Failed to import: ' + res.error);
          }
        };
        reader.readAsText(file);
      });
    }

    const resetBtn = container.querySelector('#resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset TrackX to initial sample data? This will overwrite existing records.')) {
          state.resetAllData();
          renderSettings();
        }
      });
    }
  }

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('active'));
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === '1') switchView('today');
      else if (e.key === '2') switchView('habits');
      else if (e.key === '3') switchView('progress');
      else if (e.key === '4') switchView('calendar');
      else if (e.key === '5') switchView('achievements');
      else if (e.key === '6') switchView('settings');
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  window.TrackX.app = {
    initApp,
    switchView
  };

  document.addEventListener('DOMContentLoaded', initApp);

})(window);
