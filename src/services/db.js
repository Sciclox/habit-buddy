import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

class DatabaseService {
  constructor() {
    this.sqlite = null;
    this.db = null;
    this.isNative = Capacitor.isNativePlatform();
  }

  async init() {
    if (this.isNative) {
      try {
        const sqliteConn = new SQLiteConnection(CapacitorSQLite);
        // Create/Open the database connection
        this.db = await sqliteConn.createConnection('habitbuddy_db', false, 'no-encryption', 1, false);
        await this.db.open();
        
        // Create tables if they do not exist
        const createHabitsTable = `
          CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            emoji TEXT NOT NULL,
            theme TEXT NOT NULL,
            streak INTEGER DEFAULT 0,
            bestStreak INTEGER DEFAULT 0,
            image TEXT,
            difficulty TEXT DEFAULT 'facil',
            targetDays INTEGER DEFAULT 21
          );
        `;
        const createHistoryTable = `
          CREATE TABLE IF NOT EXISTS history (
            habitId TEXT NOT NULL,
            dateStr TEXT NOT NULL,
            PRIMARY KEY (habitId, dateStr)
          );
        `;
        
        await this.db.execute(createHabitsTable);
        await this.db.execute(createHistoryTable);
        console.log("SQLite Database initialized on native platform!");
      } catch (err) {
        console.error("SQLite init failed, falling back to LocalStorage mock", err);
        this.isNative = false; // Fallback to LocalStorage
        this.initBrowserMock();
      }
    } else {
      console.log("Running in browser. Fallback to LocalStorage mock database.");
      this.initBrowserMock();
    }
  }

  initBrowserMock() {
    // Initialize mock local storage if empty
    if (!localStorage.getItem('habitbuddy_habits')) {
      const defaultHabits = [
        {
          id: '1',
          name: 'Tomar Agua',
          emoji: '💧',
          theme: 'ocean',
          history: [new Date().toISOString().split('T')[0]],
          streak: 1,
          bestStreak: 1,
          difficulty: 'facil',
          targetDays: 21
        },
        {
          id: '2',
          name: 'Leer un libro',
          emoji: '📚',
          theme: 'purple',
          history: [],
          streak: 0,
          bestStreak: 0,
          difficulty: 'medio',
          targetDays: 66
        }
      ];
      localStorage.setItem('habitbuddy_habits', JSON.stringify(defaultHabits));
    }
  }

  async getHabits() {
    if (this.isNative) {
      try {
        // Query habits
        const habitsResult = await this.db.query('SELECT * FROM habits');
        const habits = habitsResult.values || [];
        
        // Query history
        const historyResult = await this.db.query('SELECT * FROM history');
        const historyList = historyResult.values || [];
        
        // Map history to habits
        return habits.map(h => {
          const habitHistory = historyList
            .filter(hist => hist.habitId === h.id)
            .map(hist => hist.dateStr);
          return {
            ...h,
            history: habitHistory,
            streak: Number(h.streak || 0),
            bestStreak: Number(h.bestStreak || 0),
            image: h.image || null,
            difficulty: h.difficulty || 'facil',
            targetDays: Number(h.targetDays || 21)
          };
        });
      } catch (err) {
        console.error("SQLite getHabits failed, using backup array", err);
        return [];
      }
    } else {
      // Browser Mock
      const data = localStorage.getItem('habitbuddy_habits');
      return data ? JSON.parse(data) : [];
    }
  }

  async addHabit(habit) {
    if (this.isNative) {
      try {
        const query = `
          INSERT INTO habits (id, name, emoji, theme, streak, bestStreak, image, difficulty, targetDays)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await this.db.run(query, [
          habit.id, 
          habit.name, 
          habit.emoji, 
          habit.theme, 
          habit.streak || 0, 
          habit.bestStreak || 0,
          habit.image || null,
          habit.difficulty || 'facil',
          habit.targetDays || 21
        ]);
        console.log("Habit added to SQLite:", habit.name);
      } catch (err) {
        console.error("SQLite addHabit failed", err);
      }
    } else {
      // Browser Mock
      const habits = await this.getHabits();
      habits.push(habit);
      localStorage.setItem('habitbuddy_habits', JSON.stringify(habits));
    }
  }

  async deleteHabit(habitId) {
    if (this.isNative) {
      try {
        await this.db.run('DELETE FROM habits WHERE id = ?', [habitId]);
        await this.db.run('DELETE FROM history WHERE habitId = ?', [habitId]);
        console.log("Habit deleted from SQLite:", habitId);
      } catch (err) {
        console.error("SQLite deleteHabit failed", err);
      }
    } else {
      // Browser Mock
      let habits = await this.getHabits();
      habits = habits.filter(h => h.id !== habitId);
      localStorage.setItem('habitbuddy_habits', JSON.stringify(habits));
    }
  }

  async saveHabitHistory(habitId, historyDates, streak, bestStreak) {
    if (this.isNative) {
      try {
        // Update streaks in habits table
        await this.db.run('UPDATE habits SET streak = ?, bestStreak = ? WHERE id = ?', [
          streak, 
          bestStreak, 
          habitId
        ]);
        
        // Refresh history: delete old and insert current history
        await this.db.run('DELETE FROM history WHERE habitId = ?', [habitId]);
        
        for (const dateStr of historyDates) {
          await this.db.run('INSERT INTO history (habitId, dateStr) VALUES (?, ?)', [habitId, dateStr]);
        }
        console.log("History saved to SQLite for habit:", habitId);
      } catch (err) {
        console.error("SQLite saveHabitHistory failed", err);
      }
    } else {
      // Browser Mock
      const habits = await this.getHabits();
      const updated = habits.map(h => {
        if (h.id === habitId) {
          return { ...h, history: historyDates, streak, bestStreak };
        }
        return h;
      });
      localStorage.setItem('habitbuddy_habits', JSON.stringify(updated));
    }
  }

  async resetAll() {
    if (this.isNative) {
      try {
        await this.db.execute('DELETE FROM habits');
        await this.db.execute('DELETE FROM history');
        console.log("SQLite DB cleared");
      } catch (err) {
        console.error("SQLite resetAll failed", err);
      }
    } else {
      // Browser Mock
      localStorage.removeItem('habitbuddy_habits');
    }
  }
}

export const dbService = new DatabaseService();
