import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Moon, 
  Sun, 
  Flame, 
  Check, 
  Trash2, 
  Calendar, 
  Award, 
  Sparkles, 
  X,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService } from './services/db';

// Predefined list of emojis for custom habits
const EMOJIS = ['🏃‍♂️', '💧', '📚', '🧘‍♂️', '🍎', '😴', '🧹', '🦷', '💊', '🚶‍♂️', '🍳', '💼', '🎨', '🎸', '🌱', '✍️', '🗣️', '🚭'];

// Predefined theme gradients matching index.css
const THEMES = [
  { name: 'coral', gradient: 'var(--gradient-coral)', shadow: 'rgba(255, 106, 136, 0.3)' },
  { name: 'emerald', gradient: 'var(--gradient-emerald)', shadow: 'rgba(11, 163, 96, 0.3)' },
  { name: 'ocean', gradient: 'var(--gradient-ocean)', shadow: 'rgba(0, 159, 253, 0.3)' },
  { name: 'sunset', gradient: 'var(--gradient-sunset)', shadow: 'rgba(247, 107, 28, 0.3)' },
  { name: 'purple', gradient: 'var(--gradient-purple)', shadow: 'rgba(118, 75, 162, 0.3)' },
  { name: 'indigo', gradient: 'var(--gradient-indigo)', shadow: 'rgba(33, 147, 176, 0.3)' },
  { name: 'gold', gradient: 'var(--gradient-gold)', shadow: 'rgba(166, 193, 238, 0.3)' }
];

// Helper to format date as YYYY-MM-DD in local time
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate dates for current week (Monday to Sunday)
const getCurrentWeekDates = () => {
  const dates = [];
  const today = new Date();
  
  // Get current day (0 for Sun, 1 for Mon, etc.)
  const dayOfWeek = today.getDay();
  
  // Calculate difference to last Monday (in JS, if Sunday, day = 0, we want Monday to be start)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    dates.push({
      dateStr: formatDateLocal(nextDate),
      label: nextDate.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase(),
      dayNum: nextDate.getDate(),
      isToday: formatDateLocal(nextDate) === formatDateLocal(today),
      isFuture: nextDate > today && formatDateLocal(nextDate) !== formatDateLocal(today)
    });
  }
  return dates;
};

// Synth pop sound effect using Web Audio API
const playPopSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    // Frequency ramps up from 350Hz to 850Hz to make a satisfying "bubble pop" sound
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    console.warn("Web Audio API not supported or blocked by user interaction.", e);
  }
};

export default function App() {
  // --- States ---
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [weekDates, setWeekDates] = useState([]);
  
  // New Habit form states
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('🏃‍♂️');
  const [newHabitTheme, setNewHabitTheme] = useState('coral');

  // --- Initial Load ---
  useEffect(() => {
    // Set week dates
    setWeekDates(getCurrentWeekDates());
    
    // Load Database and Fetch Habits
    const initDbAndLoadHabits = async () => {
      try {
        await dbService.init();
        const loadedHabits = await dbService.getHabits();
        setHabits(loadedHabits);
      } catch (err) {
        console.error("Failed to initialize database", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initDbAndLoadHabits();

    // Load sound preference
    const savedSound = localStorage.getItem('habitbuddy_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    // Load and apply theme
    const savedTheme = localStorage.getItem('habitbuddy_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, []);

  // --- Helper calculations ---
  const calculateStreak = (history) => {
    if (!history || history.length === 0) return 0;
    const sortedHistory = [...new Set(history)].sort().reverse(); // Decending sort
    
    const todayStr = formatDateLocal(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateLocal(yesterday);
    
    // Check if completed today or yesterday
    const completedToday = sortedHistory.includes(todayStr);
    const completedYesterday = sortedHistory.includes(yesterdayStr);
    
    if (!completedToday && !completedYesterday) {
      return 0;
    }
    
    let streak = 0;
    let checkDate = completedToday ? new Date() : yesterday;
    
    while (true) {
      const dateStr = formatDateLocal(checkDate);
      if (sortedHistory.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateBestStreak = (history, currentBest = 0) => {
    if (!history || history.length === 0) return 0;
    const sortedHistory = [...new Set(history)].sort(); // Ascending sort
    let tempStreak = 0;
    let maxStreak = currentBest;
    
    for (let i = 0; i < sortedHistory.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedHistory[i - 1]);
        const curr = new Date(sortedHistory[i]);
        const diffTime = Math.abs(curr - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          if (tempStreak > maxStreak) maxStreak = tempStreak;
          tempStreak = 1;
        }
      }
    }
    if (tempStreak > maxStreak) maxStreak = tempStreak;
    return maxStreak;
  };

  // --- Theme Toggle ---
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('habitbuddy_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  };

  // --- Sound Toggle ---
  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    localStorage.setItem('habitbuddy_sound', String(nextSound));
  };

  // --- Habits Actions ---
  const handleToggleHabit = async (habitId, dateStr, event) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const exists = habit.history.includes(dateStr);
    let newHistory;
    
    if (exists) {
      // Remove completion
      newHistory = habit.history.filter(d => d !== dateStr);
    } else {
      // Add completion
      newHistory = [...habit.history, dateStr];
      
      // Trigger completion feedback if completed date is today/past
      const isToday = dateStr === formatDateLocal(new Date());
      if (isToday) {
        if (soundEnabled) playPopSound();
        
        // Trigger canvas confetti at click location (if event provided)
        if (event) {
          const x = event.clientX / window.innerWidth;
          const y = event.clientY / window.innerHeight;
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { x, y },
            colors: ['#FF9A8B', '#FF6A88', '#FF99AC', '#43CB73', '#009EFD', '#F76B1C', '#B176FC']
          });
        } else {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      }
    }
    
    const currentStreak = calculateStreak(newHistory);
    const bestStreak = calculateBestStreak(newHistory, habit.bestStreak);
    
    // Save to SQLite
    await dbService.saveHabitHistory(habitId, newHistory, currentStreak, bestStreak);
    
    // Refresh habits from SQLite to update React UI state
    const updatedHabits = await dbService.getHabits();
    setHabits(updatedHabits);
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      theme: newHabitTheme,
      history: [],
      streak: 0,
      bestStreak: 0
    };

    // Save to SQLite
    await dbService.addHabit(newHabit);
    
    // Refresh habits
    const updatedHabits = await dbService.getHabits();
    setHabits(updatedHabits);

    // Reset fields & close
    setNewHabitName('');
    setNewHabitEmoji('🏃‍♂️');
    setNewHabitTheme('coral');
    setShowModal(false);
    
    // Tiny celebration for new habit!
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  };

  const handleDeleteHabit = async (habitId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este hábito?')) {
      // Delete from SQLite
      await dbService.deleteHabit(habitId);
      
      // Refresh habits
      const updatedHabits = await dbService.getHabits();
      setHabits(updatedHabits);
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('¿Quieres reiniciar todos tus hábitos y progreso? Esta acción no se puede deshacer.')) {
      // Reset database
      await dbService.resetAll();
      setHabits([]);
    }
  };

  // --- Statistics calculations ---
  const todayStr = formatDateLocal(new Date());
  const habitsCompletedToday = habits.filter(h => h.history.includes(todayStr)).length;
  const totalHabitsCount = habits.length;
  const completionPercentage = totalHabitsCount > 0 
    ? Math.round((habitsCompletedToday / totalHabitsCount) * 100) 
    : 0;

  // Best streak overall
  const maxStreakOverall = habits.length > 0 
    ? Math.max(...habits.map(h => h.bestStreak || 0)) 
    : 0;
  
  // Total completions overall
  const totalCompletionsCount = habits.reduce((acc, h) => acc + h.history.length, 0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', color: 'var(--text-main-light)' }}>
        <div style={{ fontSize: '2.5rem', animation: 'float 2s ease-in-out infinite' }}>🌱</div>
        <h3 style={{ margin: 0, fontWeight: 600 }}>Cargando HabitBuddy...</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6 }}>Iniciando base de datos SQLite</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Header */}
      <header className="app-header">
        <div className="welcome-section">
          <h1>HabitBuddy</h1>
          <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleSound}
            title={soundEnabled ? "Desactivar sonidos" : "Activar sonidos"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Progress & Quick Stats */}
      <section className="glass-panel progress-card">
        <div className="progress-info">
          <h2>Progreso de hoy</h2>
          <p>{habitsCompletedToday} de {totalHabitsCount} completados</p>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>
        
        {/* SVG Circular Progress */}
        <div className="circular-progress">
          <svg>
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2AF598" />
                <stop offset="100%" stopColor="#009EFD" />
              </linearGradient>
            </defs>
            <circle className="bg-circle" cx="35" cy="35" r="32" />
            <circle 
              className="value-circle" 
              cx="35" 
              cy="35" 
              r="32" 
              style={{ strokeDashoffset: 201 - (201 * completionPercentage) / 100 }}
            />
          </svg>
          <span className="circular-percentage">{completionPercentage}%</span>
        </div>
      </section>

      {/* Grid Stats */}
      {totalHabitsCount > 0 && (
        <section className="stats-container">
          <div className="glass-panel stat-box">
            <span className="stat-value" style={{ color: '#FF5A79' }}>
              <Flame size={20} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {maxStreakOverall}
            </span>
            <span className="stat-label">Mejor Racha (Días)</span>
          </div>
          <div className="glass-panel stat-box">
            <span className="stat-value" style={{ color: '#0BA360' }}>
              <Award size={20} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {totalCompletionsCount}
            </span>
            <span className="stat-label">Completados Totales</span>
          </div>
        </section>
      )}

      {/* Habits Section */}
      <main style={{ flex: 1 }}>
        <div className="habits-header">
          <h3>Mis Hábitos</h3>
          {totalHabitsCount > 0 && (
            <button 
              onClick={handleResetAll} 
              style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted-light)', opacity: 0.8 }}
              className="reset-btn"
            >
              <RotateCcw size={12} /> Reiniciar todo
            </button>
          )}
        </div>

        {totalHabitsCount === 0 ? (
          <div className="glass-panel empty-state">
            <div className="empty-icon">🌱</div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '700' }}>¡Comienza tu viaje!</h4>
            <p>Aún no has agregado ningún hábito. Presiona el botón de abajo para empezar a construir tu rutina ideal.</p>
          </div>
        ) : (
          <div className="habit-list">
            {habits.map((habit) => {
              const theme = THEMES.find(t => t.name === habit.theme) || THEMES[0];
              const completedToday = habit.history.includes(todayStr);

              return (
                <div key={habit.id} className="glass-panel habit-card">
                  
                  {/* Top info and main click area */}
                  <div className="habit-card-main">
                    <div className="habit-details">
                      <div 
                        className="habit-emoji-container" 
                        style={{ background: theme.gradient, boxShadow: `0 8px 20px ${theme.shadow}` }}
                      >
                        {habit.emoji}
                      </div>
                      
                      <div className="habit-info-text">
                        <h4 className="habit-title">{habit.name}</h4>
                        <span className={`habit-streak ${habit.streak > 0 ? 'streak-active' : ''}`}>
                          <Flame size={12} className="streak-icon" />
                          Racha: {habit.streak || 0} {(habit.streak === 1) ? 'día' : 'días'}
                        </span>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <button 
                        onClick={(e) => handleToggleHabit(habit.id, todayStr, e)}
                        className={`complete-btn ${completedToday ? 'done' : 'not-done'}`}
                        style={{ 
                          background: completedToday ? theme.gradient : undefined,
                          boxShadow: completedToday ? `0 6px 15px ${theme.shadow}` : undefined
                        }}
                      >
                        {completedToday ? <Check size={24} /> : <Plus size={24} />}
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="delete-btn"
                        title="Eliminar hábito"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Weekly Progress Tracker */}
                  <div className="weekly-grid">
                    {weekDates.map((day) => {
                      const isCompleted = habit.history.includes(day.dateStr);
                      let dotClass = 'empty';
                      let style = {};

                      if (day.isFuture) {
                        dotClass = 'future';
                      } else if (isCompleted) {
                        dotClass = 'completed';
                        style = { 
                          background: theme.gradient, 
                          boxShadow: `0 4px 10px ${theme.shadow}` 
                        };
                      }

                      return (
                        <div key={day.dateStr} className="day-column">
                          <span className="day-label">{day.label}</span>
                          <button
                            disabled={day.isFuture}
                            onClick={(e) => handleToggleHabit(habit.id, day.dateStr, e)}
                            className={`day-dot ${dotClass} ${day.isToday ? 'today-active' : ''}`}
                            style={style}
                            title={`${day.isToday ? 'Hoy: ' : ''}${isCompleted ? 'Completado' : 'Pendiente'}`}
                          >
                            {isCompleted ? <Check size={12} /> : day.dayNum}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button className="fab" onClick={() => setShowModal(true)}>
        <Plus size={20} />
        Crear nuevo hábito
      </button>

      {/* Add Habit Modal Sheet */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Nuevo Hábito</h4>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateHabit}>
              {/* Habit Name */}
              <div className="form-group">
                <label htmlFor="habit-name">¿Qué hábito quieres construir?</label>
                <input
                  id="habit-name"
                  type="text"
                  className="input-text"
                  placeholder="Ej: Tomar agua, Leer, Ejercicio..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  maxLength={25}
                  required
                  autoFocus
                />
              </div>

              {/* Emoji Selector */}
              <div className="form-group">
                <label>Selecciona un ícono/emoji</label>
                <div className="emoji-selector">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-option ${newHabitEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setNewHabitEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="form-group">
                <label>Selecciona un color</label>
                <div className="theme-selector">
                  {THEMES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      className={`theme-option ${newHabitTheme === t.name ? 'selected' : ''}`}
                      style={{ background: t.gradient }}
                      onClick={() => setNewHabitTheme(t.name)}
                    >
                      <div className="theme-option-dot" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="save-habit-btn">
                ¡Empezar hábito!
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
