import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  Camera,
  ArrowLeft,
  Info
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
  const dayOfWeek = today.getDay();
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

// Growth phase calculator for the plant/tree
const getTreePhase = (completionsCount, targetDays) => {
  const percentage = Math.min((completionsCount / targetDays) * 100, 100);
  
  if (percentage <= 10) {
    return { phase: 1, name: 'Semilla', icon: '🟤', desc: 'Semilla sembrada en tierra. ¡Nutre tu hábito para brotar!', range: '0-10%' };
  } else if (percentage <= 30) {
    return { phase: 2, name: 'Brote', icon: '🌱', desc: '¡El primer brote está asomando! Sigue adelante.', range: '11-30%' };
  } else if (percentage <= 60) {
    return { phase: 3, name: 'Plántula', icon: '🌿', desc: 'Tu planta tiene hojas jóvenes. Sigue alimentándola.', range: '31-60%' };
  } else if (percentage <= 90) {
    return { phase: 4, name: 'Árbol Joven', icon: '🌳', desc: 'Un árbol joven y firme. El hábito casi está automatizado.', range: '61-90%' };
  } else {
    return { phase: 5, name: 'Árbol Florecido', icon: '🌳🌸', desc: '¡Espectacular! Hábito plenamente consolidado en tu rutina.', range: '91-100%' };
  }
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
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    console.warn("Web Audio API blocked.", e);
  }
};

// ----------------------------------------------------
// 🌳 3D Canvas Tree Component with Nourishing Particles
// ----------------------------------------------------
export function Tree3D({ progressPct, triggerNourish, themeColor }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const pulseFactor = useRef(1);
  const rotationAngle = useRef(0);

  // Trigger nourish animation (spawns falling glowing particles)
  useEffect(() => {
    if (triggerNourish > 0) {
      // Spawn 35 particles falling down
      for (let i = 0; i < 35; i++) {
        particles.current.push({
          x: Math.random() * 240 + 10,
          y: Math.random() * -60 - 5, // above canvas view
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 1.8 + 1.2,
          size: Math.random() * 3 + 2,
          color: i % 2 === 0 ? '#ffd700' : '#4ade80', // Alternate Gold and Green glows
          alpha: 1.0
        });
      }
      pulseFactor.current = 1.2; // Trigger pulse zoom effect
    }
  }, [triggerNourish]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Slow Y-axis rotation over time
      rotationAngle.current += 0.006;
      
      // Slowly decay the branch scale pulse
      if (pulseFactor.current > 1) {
        pulseFactor.current -= 0.008;
      }

      const width = canvas.width;
      const height = canvas.height;
      const startX = width / 2;
      const startY = height - 25;

      // Draw soil base pot
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(startX, startY + 5, 45, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fill();
      ctx.restore();

      // Update and draw particles
      particles.current.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        // Light gravity pull towards trunk center
        p.vx += (startX - p.x) * 0.0008;
        p.alpha -= 0.007;
        
        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Filter dead/out-of-bounds particles
      particles.current = particles.current.filter(p => p.alpha > 0 && p.y < startY + 15);

      // Recursive 3D branch drawer
      const drawBranch3D = (x1, y1, z1, angleX, angleY, length, depth, maxDepth) => {
        if (depth > maxDepth) return;

        // Calculate 3D endpoints relative to starting point
        const dx = length * Math.sin(angleX) * Math.cos(angleY);
        const dy = -length * Math.cos(angleX);
        const dz = length * Math.sin(angleX) * Math.sin(angleY);

        const x2 = x1 + dx;
        const y2 = y1 + dy;
        const z2 = z1 + dz;

        // Apply 3D rotation matrix around Y axis
        const cosY = Math.cos(rotationAngle.current);
        const sinY = Math.sin(rotationAngle.current);

        const rx1 = x1 * cosY - z1 * sinY;
        const rz1 = x1 * sinY + z1 * cosY;

        const rx2 = x2 * cosY - z2 * sinY;
        const rz2 = x2 * sinY + z2 * cosY;

        // Project Z-depth coordinate to 2D scaling
        const perspective = 220;
        const scale1 = perspective / (perspective + rz1);
        const scale2 = perspective / (perspective + rz2);

        const screenX1 = startX + rx1 * scale1;
        const screenY1 = startY + y1 * scale1;

        const screenX2 = startX + rx2 * scale2;
        const screenY2 = startY + y2 * scale2;

        // Calculate thickness, boosted by nourish pulse
        const thickness = Math.max((maxDepth - depth + 1) * 1.3 * pulseFactor.current, 0.7);
        
        ctx.beginPath();
        ctx.moveTo(screenX1, screenY1);
        ctx.lineTo(screenX2, screenY2);
        ctx.strokeStyle = '#783f04'; // Brown bark color
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw leaves/flowers at outer branches
        if (depth === maxDepth || (depth > maxDepth - 2 && Math.random() > 0.45)) {
          ctx.beginPath();
          const leafSize = Math.max((5 - depth) * 1.8, 2.2) * pulseFactor.current;
          ctx.arc(screenX2, screenY2, leafSize, 0, Math.PI * 2);
          
          if (progressPct >= 90) {
            ctx.fillStyle = 'rgba(244, 143, 177, 0.88)'; // Cherry blossoms pink
            ctx.strokeStyle = 'rgba(240, 98, 146, 0.4)';
          } else {
            ctx.fillStyle = 'rgba(74, 222, 128, 0.88)'; // Green leaf
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
          }
          ctx.fill();
          ctx.stroke();
        }

        // Branch parameters
        const nextLength = length * 0.73;
        
        // Render splits
        drawBranch3D(x2, y2, z2, angleX - 0.38, angleY + 0.7, nextLength, depth + 1, maxDepth);
        drawBranch3D(x2, y2, z2, angleX + 0.28, angleY - 0.9, nextLength, depth + 1, maxDepth);
        
        // Render 3rd branch for thicker foliage at high levels
        if (maxDepth >= 5 && depth > 1) {
          drawBranch3D(x2, y2, z2, angleX + 0.08, angleY + 2.2, nextLength * 0.85, depth + 1, maxDepth);
        }
      };

      // Define tree structural depth (maxDepth) based on habit percentage progress
      let maxDepth = 2; // Tiny seed / stick
      let initialLength = 35;
      
      if (progressPct > 10 && progressPct <= 30) {
        maxDepth = 3;
        initialLength = 40;
      } else if (progressPct > 30 && progressPct <= 60) {
        maxDepth = 4;
        initialLength = 46;
      } else if (progressPct > 60 && progressPct <= 90) {
        maxDepth = 5;
        initialLength = 50;
      } else if (progressPct > 90) {
        maxDepth = 6; // Beautiful large blooming tree
        initialLength = 55;
      }

      // Start recursive drawing at root
      drawBranch3D(0, 0, 0, 0, 0, initialLength, 1, maxDepth);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [progressPct]);

  return (
    <div className="canvas-3d-wrapper">
      <canvas 
        ref={canvasRef} 
        width={250} 
        height={220} 
        style={{ display: 'block', margin: '0 auto' }}
      />
    </div>
  );
}

// ----------------------------------------------------
// Main App Component
// ----------------------------------------------------
export default function App() {
  // --- States ---
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [weekDates, setWeekDates] = useState([]);
  
  // Navigation Screens: 'dashboard' | 'create' | 'details'
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  
  // Nourishing Animation trigger count
  const [nourishTriggered, setNourishTriggered] = useState(0);

  // New Habit form states
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('🏃‍♂️');
  const [newHabitTheme, setNewHabitTheme] = useState('coral');
  const [newHabitDifficulty, setNewHabitDifficulty] = useState('facil'); // 'facil' | 'medio' | 'dificil'
  const [newHabitImage, setNewHabitImage] = useState(null); // base64 string

  // --- Initial Load ---
  useEffect(() => {
    setWeekDates(getCurrentWeekDates());
    
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

    const savedSound = localStorage.getItem('habitbuddy_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

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
    const sortedHistory = [...new Set(history)].sort().reverse();
    
    const todayStr = formatDateLocal(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateLocal(yesterday);
    
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
    const sortedHistory = [...new Set(history)].sort();
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

  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    localStorage.setItem('habitbuddy_sound', String(nextSound));
  };

  // --- Habits Actions ---
  const handleToggleHabit = async (habitId, dateStr, event) => {
    if (event) event.stopPropagation(); // Avoid opening details screen
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const exists = habit.history.includes(dateStr);
    let newHistory;
    
    if (exists) {
      newHistory = habit.history.filter(d => d !== dateStr);
    } else {
      newHistory = [...habit.history, dateStr];
      
      const isToday = dateStr === formatDateLocal(new Date());
      if (isToday) {
        if (soundEnabled) playPopSound();
        
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
    
    await dbService.saveHabitHistory(habitId, newHistory, currentStreak, bestStreak);
    
    const updatedHabits = await dbService.getHabits();
    setHabits(updatedHabits);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewHabitImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    let targetDays = 21;
    if (newHabitDifficulty === 'medio') targetDays = 66;
    else if (newHabitDifficulty === 'dificil') targetDays = 90;

    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      theme: newHabitTheme,
      history: [],
      streak: 0,
      bestStreak: 0,
      image: newHabitImage,
      difficulty: newHabitDifficulty,
      targetDays: targetDays
    };

    await dbService.addHabit(newHabit);
    
    const updatedHabits = await dbService.getHabits();
    setHabits(updatedHabits);

    // Reset fields & Navigate
    setNewHabitName('');
    setNewHabitEmoji('🏃‍♂️');
    setNewHabitTheme('coral');
    setNewHabitDifficulty('facil');
    setNewHabitImage(null);
    setCurrentScreen('dashboard');
    
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
    if (window.confirm('¿Estás seguro de que quieres eliminar este hábito y todo su historial de progreso?')) {
      await dbService.deleteHabit(habitId);
      const updatedHabits = await dbService.getHabits();
      setHabits(updatedHabits);
      setCurrentScreen('dashboard');
      setSelectedHabitId(null);
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('¿Quieres reiniciar todos tus hábitos y progreso? Esta acción no se puede deshacer.')) {
      await dbService.resetAll();
      setHabits([]);
    }
  };

  const triggerNourishAnimation = (e) => {
    if (!activeHabit) return;
    
    // Increment nourish count to spawn canvas particles
    setNourishTriggered(prev => prev + 1);
    
    const todayStr = formatDateLocal(new Date());
    const isCompletedToday = activeHabit.history.includes(todayStr);

    if (!isCompletedToday) {
      // Toggle today's completion (which writes to db and plays standard pop sound)
      handleToggleHabit(activeHabit.id, todayStr, e);
    } else {
      // Today is already completed, just play nourishment sounds and extra sparkles!
      if (soundEnabled) playPopSound();
      
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.65 },
        colors: ['#ffd700', '#4ade80']
      });
    }
  };

  // --- Statistics calculations ---
  const todayStr = formatDateLocal(new Date());
  const habitsCompletedToday = habits.filter(h => h.history.includes(todayStr)).length;
  const totalHabitsCount = habits.length;
  const completionPercentage = totalHabitsCount > 0 
    ? Math.round((habitsCompletedToday / totalHabitsCount) * 100) 
    : 0;

  const maxStreakOverall = habits.length > 0 
    ? Math.max(...habits.map(h => h.bestStreak || 0)) 
    : 0;
  
  const totalCompletionsCount = habits.reduce((acc, h) => acc + h.history.length, 0);

  const activeHabit = habits.find(h => h.id === selectedHabitId);

  // --- Render Screens ---
  
  // 1. Dashboard Screen
  const renderDashboard = () => (
    <>
      {/* Progress & Quick Stats */}
      <section className="glass-panel progress-card">
        <div className="progress-info">
          <h2>Progreso de hoy</h2>
          <p>{habitsCompletedToday} de {totalHabitsCount} completados</p>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>
        
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
            <span className="stat-label">Mejor Racha</span>
          </div>
          <div className="glass-panel stat-box">
            <span className="stat-value" style={{ color: '#0BA360' }}>
              <Award size={20} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {totalCompletionsCount}
            </span>
            <span className="stat-label">Completados</span>
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
              className="reset-btn"
              style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted-light)', opacity: 0.8 }}
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
              const treeInfo = getTreePhase(habit.history.length, habit.targetDays || 21);
              
              // Conditional background styling if custom image exists
              const cardStyle = habit.image ? {
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.72)), url(${habit.image})`
              } : {};

              return (
                <div 
                  key={habit.id} 
                  className={`glass-panel habit-card ${habit.image ? 'habit-card-image-bg' : ''}`}
                  onClick={() => {
                    setSelectedHabitId(habit.id);
                    setCurrentScreen('details');
                    setNourishTriggered(0); // Reset animation trigger count
                  }}
                  style={cardStyle}
                >
                  <div className="habit-card-main">
                    <div className="habit-details">
                      {/* Render circular emoji/icon ONLY if card DOES NOT have full-cover image background */}
                      {!habit.image && (
                        <div 
                          className="habit-emoji-container" 
                          style={{ background: theme.gradient, boxShadow: `0 8px 20px ${theme.shadow}` }}
                        >
                          {habit.emoji}
                        </div>
                      )}
                      
                      <div className="habit-info-text">
                        <h4 className="habit-title">{habit.name}</h4>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.15rem' }}>
                          <span className={`habit-streak ${habit.streak > 0 ? 'streak-active' : ''}`}>
                            <Flame size={12} className="streak-icon" />
                            {habit.streak || 0}d
                          </span>
                          <span className="card-tree-badge">
                            {treeInfo.icon} {treeInfo.name}
                          </span>
                        </div>
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

      <button className="fab" onClick={() => setCurrentScreen('create')}>
        <Plus size={20} />
        Crear nuevo hábito
      </button>
    </>
  );

  // 2. Create Screen (Full Screen View)
  const renderCreateScreen = () => (
    <div className="fullscreen-screen animate-slide-in">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setCurrentScreen('dashboard')}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <h2>Crear Hábito</h2>
      </div>

      <form onSubmit={handleCreateHabit} className="create-form">
        {/* Habit Name */}
        <div className="form-group">
          <label htmlFor="habit-name">¿Qué hábito quieres construir?</label>
          <input
            id="habit-name"
            type="text"
            className="input-text"
            placeholder="Ej: Meditar, Beber agua, Ejercicio..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            maxLength={25}
            required
            autoFocus
          />
        </div>

        {/* Scientific Difficulty Levels */}
        <div className="form-group">
          <label>Nivel de Dificultad (Ciencia del Hábito)</label>
          <div className="difficulty-picker-container">
            <button
              type="button"
              className={`difficulty-card ${newHabitDifficulty === 'facil' ? 'selected-facil' : ''}`}
              onClick={() => setNewHabitDifficulty('facil')}
            >
              <div className="diff-title">🟢 Fácil</div>
              <div className="diff-days">21 días</div>
            </button>
            <button
              type="button"
              className={`difficulty-card ${newHabitDifficulty === 'medio' ? 'selected-medio' : ''}`}
              onClick={() => setNewHabitDifficulty('medio')}
            >
              <div className="diff-title">🟡 Medio</div>
              <div className="diff-days">66 días</div>
            </button>
            <button
              type="button"
              className={`difficulty-card ${newHabitDifficulty === 'dificil' ? 'selected-dificil' : ''}`}
              onClick={() => setNewHabitDifficulty('dificil')}
            >
              <div className="diff-title">🔴 Difícil</div>
              <div className="diff-days">90 días</div>
            </button>
          </div>

          {/* Dynamic Scientific description footnote */}
          <div className="science-footnote glass-panel">
            <Info size={16} className="footnote-icon" />
            <div className="footnote-text">
              {newHabitDifficulty === 'facil' && (
                <p><strong>Meta 21 Días (Mito de Maltz):</strong> Ideal para acciones muy simples que no requieren gran esfuerzo cognitivo (ej. tomar vitaminas, hidratación simple).</p>
              )}
              {newHabitDifficulty === 'medio' && (
                <p><strong>Meta 66 Días (Estudio UCL):</strong> El estándar de oro de la Dra. Phillippa Lally. Promedio real necesario para automatizar rutinas diarias en nuestra mente (ej. leer, meditar).</p>
              )}
              {newHabitDifficulty === 'dificil' && (
                <p><strong>Meta 90 Días (Regla 90/90):</strong> Recomendado para cambios significativos del estilo de vida o eliminar dependencias (ej. ir al gimnasio, aprender idioma, no fumar).</p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Custom Photo */}
        <div className="form-group">
          <label>Foto de referencia (Opcional)</label>
          <div className="image-upload-container">
            {newHabitImage ? (
              <div className="image-preview-wrapper animate-pop">
                <img src={newHabitImage} alt="Referencia" className="image-upload-preview" />
                <button 
                  type="button" 
                  className="remove-image-btn" 
                  onClick={() => setNewHabitImage(null)}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="image-upload-label">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }}
                />
                <div className="upload-placeholder">
                  <Camera size={16} style={{ marginRight: '6px' }} />
                  <span>Subir foto de referencia</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Emoji selector (only shown if no image is uploaded) */}
        {!newHabitImage && (
          <div className="form-group">
            <label>O selecciona un emoji</label>
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
        )}

        {/* Color Theme Selector */}
        <div className="form-group">
          <label>Color Temático</label>
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

        <button type="submit" className="save-habit-btn" style={{ marginTop: '2rem' }}>
          ¡Empezar hábito!
        </button>
      </form>
    </div>
  );

  // 3. Details Screen (Full Screen View for specific habit)
  const renderDetailsScreen = () => {
    if (!activeHabit) return null;

    const theme = THEMES.find(t => t.name === activeHabit.theme) || THEMES[0];
    const totalCompletions = activeHabit.history.length;
    const targetDays = activeHabit.targetDays || 21;
    const progressPct = Math.min(Math.round((totalCompletions / targetDays) * 100), 100);
    const treeInfo = getTreePhase(totalCompletions, targetDays);

    const remainingDays = targetDays - totalCompletions;
    const isConsolidated = remainingDays <= 0;

    // Create dates for the current calendar grid
    const getCalendarDays = () => {
      const days = [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      const numDays = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        const d = new Date(year, month, i);
        days.push({
          dateStr: formatDateLocal(d),
          dayNum: i,
          isCompleted: activeHabit.history.includes(formatDateLocal(d)),
          isFuture: d > now && formatDateLocal(d) !== formatDateLocal(now)
        });
      }
      return days;
    };

    const calendarDays = getCalendarDays();
    const currentMonthName = new Date().toLocaleDateString('es-ES', { month: 'long' });

    return (
      <div className="fullscreen-screen animate-slide-in" style={{ padding: 0 }}>
        
        {/* Banner Section: renders cover image or simple header */}
        {activeHabit.image ? (
          <div 
            className="detail-image-banner animate-pop" 
            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.7)), url(${activeHabit.image})` }}
          >
            <button className="back-btn-floating" onClick={() => setCurrentScreen('dashboard')} title="Volver al Dashboard">
              <ArrowLeft size={20} />
            </button>
            <div className="banner-overlay-text">
              <h2>{activeHabit.name}</h2>
              <span className="banner-diff-badge" data-diff={activeHabit.difficulty}>
                {activeHabit.difficulty === 'facil' && '🟢 Fácil'}
                {activeHabit.difficulty === 'medio' && '🟡 Medio'}
                {activeHabit.difficulty === 'dificil' && '🔴 Difícil'}
              </span>
            </div>
          </div>
        ) : (
          <div className="screen-header" style={{ padding: '2rem 1rem 0 1rem' }}>
            <button className="back-btn" onClick={() => setCurrentScreen('dashboard')}>
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
            <h2>{activeHabit.name}</h2>
          </div>
        )}

        {/* Inner Padding Container for remaining components */}
        <div style={{ padding: '0 1rem 2rem 1rem', marginTop: activeHabit.image ? '1.5rem' : '0.5rem' }}>
          
          {/* 🌳 3D Canvas Tree Dedicated Section */}
          <section className="glass-panel tree-3d-section animate-pop">
            <h3 className="section-title">Mi Árbol de Hábito</h3>
            
            <Tree3D 
              progressPct={progressPct} 
              triggerNourish={nourishTriggered} 
              themeColor={theme.gradient} 
            />
            
            <div className="tree-details-footer">
              <span className="tree-phase-badge">Fase {treeInfo.phase}: {treeInfo.name}</span>
              <p className="tree-desc-text">{treeInfo.desc}</p>
            </div>
            
            <button 
              type="button" 
              onClick={triggerNourishAnimation}
              className="nourish-btn"
              style={{ background: theme.gradient, boxShadow: `0 8px 20px ${theme.shadow}` }}
            >
              <Sparkles size={16} style={{ marginRight: '6px' }} />
              Nutrir Árbol {!activeHabit.history.includes(todayStr) ? '(+1 Completado)' : '(Ver Brillo)'}
            </button>
          </section>

          {/* Scientific Progression Alert */}
          <section className="glass-panel science-alert-panel">
            <Info size={20} className="science-icon" />
            <div className="science-text">
              <h4>Constancia Científica</h4>
              {isConsolidated ? (
                <p>🎉 <strong>¡Hábito Consolidado!</strong> Has superado la meta de {targetDays} días. Tu cerebro ha fijado esta conducta como un proceso subconsciente y automático.</p>
              ) : (
                <p>💪 Te faltan <strong>{remainingDays} días</strong> completados para consolidar este hábito. Según la ciencia del comportamiento, alcanzar los {targetDays} días fijará esta rutina de forma permanente en tu mente.</p>
              )}
            </div>
          </section>

          {/* Statistics Grid */}
          <section className="stats-container" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-panel stat-box">
              <span className="stat-value" style={{ color: '#FF5A79' }}>
                <Flame size={20} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {activeHabit.streak}
              </span>
              <span className="stat-label">Racha Actual</span>
            </div>
            <div className="glass-panel stat-box">
              <span className="stat-value" style={{ color: '#F76B1C' }}>
                <Award size={20} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {activeHabit.bestStreak}
              </span>
              <span className="stat-label">Mejor Racha</span>
            </div>
          </section>

          {/* Month Calendar History Grid */}
          <section className="glass-panel calendar-history-panel">
            <div className="calendar-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>Registro de {currentMonthName}</h4>
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Completados: {activeHabit.history.filter(h => h.startsWith(formatDateLocal(new Date()).slice(0, 7))).length} días</span>
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day) => {
                let gridClass = 'empty';
                let style = {};

                if (day.isFuture) {
                  gridClass = 'future';
                } else if (day.isCompleted) {
                  gridClass = 'completed';
                  style = { background: theme.gradient, color: 'white' };
                }

                return (
                  <div 
                    key={day.dateStr} 
                    className={`calendar-cell ${gridClass}`} 
                    style={style}
                    onClick={() => !day.isFuture && handleToggleHabit(activeHabit.id, day.dateStr)}
                    title={`${day.isCompleted ? 'Completado' : 'Pendiente'} el ${day.dateStr}`}
                  >
                    {day.dayNum}
                  </div>
                );
              })}
            </div>
            <p className="calendar-tip" style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.8rem', textAlign: 'center' }}>Puedes pulsar sobre un día del calendario para activar/desactivar tu progreso de esa fecha.</p>
          </section>

          {/* Delete button wrapper */}
          <div style={{ marginTop: '2rem' }}>
            <button 
              type="button" 
              onClick={() => handleDeleteHabit(activeHabit.id)} 
              className="delete-habit-full-btn"
            >
              <Trash2 size={16} style={{ marginRight: '6px' }} />
              Eliminar este Hábito
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Universal header layout (only show toggles on dashboard) */}
      {currentScreen === 'dashboard' && (
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
      )}

      {/* Screen Router */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '1rem', color: 'var(--text-main-light)' }}>
          <div style={{ fontSize: '2.5rem', animation: 'float 2s ease-in-out infinite' }}>🌱</div>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Cargando HabitBuddy...</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6 }}>Iniciando base de datos SQLite</p>
        </div>
      ) : (
        <>
          {currentScreen === 'dashboard' && renderDashboard()}
          {currentScreen === 'create' && renderCreateScreen()}
          {currentScreen === 'details' && renderDetailsScreen()}
        </>
      )}

    </div>
  );
}
