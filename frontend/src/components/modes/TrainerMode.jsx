import React, { useState, useEffect } from "react";

// --- Existing Alarm & Buzzer Logic ---
function loadAlarms() {
  try { return JSON.parse(localStorage.getItem("confide_alarms") || "[]"); }
  catch { return []; }
}
function saveAlarms(a) { localStorage.setItem("confide_alarms", JSON.stringify(a)); }

function requestNotif() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function playBuzzer() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.warn("AudioContext not supported", e); }
}

function scheduleAlarm(alarm) {
  const now      = new Date();
  const [h, m]   = alarm.time.split(":").map(Number);
  const fire     = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (fire < now) fire.setDate(fire.getDate() + 1);
  const ms = fire - now;

  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(`🏋️ ${alarm.label}`, {
        body: alarm.message || "Time to work out! Let's go 💪",
        icon: "/favicon.ico",
      });
    }
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    playBuzzer();
    scheduleAlarm(alarm); // reschedule for tomorrow
  }, ms);
}

const QUOTES = [
  "No more excuses. Your goals don't care how you feel.",
  "Discipline equals freedom. Put in the work.",
  "You're not tired, you're uninspired. Get up.",
  "Pain is temporary. Quitting lasts forever.",
  "Nobody is coming to save you. Save yourself.",
  "Stop negotiating with your own mind. Just start."
];

const GOALS = [
  { id: "lose",    label: "🔥 Fat Loss"    },
  { id: "muscle",  label: "💪 Muscle Gain" },
  { id: "active",  label: "🏃 General Fitness" },
  { id: "endure",  label: "🚴 Endurance" }
];

export default function TrainerMode() {
  const [step, setStep] = useState("D"); // D -> C -> B/A
  const [quote, setQuote] = useState("");
  
  // Subpage C state
  const loadStored = (key, defaultVal) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : defaultVal;
    } catch { return defaultVal; }
  };

  const [weight, setWeight] = useState(() => loadStored("confide_trainer_weight", ""));
  const [height, setHeight] = useState(() => loadStored("confide_trainer_height", ""));
  const [age, setAge] = useState(() => loadStored("confide_trainer_age", ""));
  const [goal, setGoal] = useState(() => loadStored("confide_trainer_goal", "lose"));
  const [routine, setRoutine] = useState(() => loadStored("confide_trainer_routine", ""));
  const [availability, setAvailability] = useState(() => loadStored("confide_trainer_availability", ""));
  const [level, setLevel] = useState(() => loadStored("confide_trainer_level", "beginner"));
  
  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bmiData, setBmiData] = useState(null);
  
  // Subpage B & A state
  const [activeTab, setActiveTab] = useState("B"); // 'B' = Daily Workout, 'A' = Weekly Schedule
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [dailyWorkout, setDailyWorkout] = useState([]);
  
  // Checklists
  const [checklist, setChecklist] = useState({}); // For Daily Workout (Tab B)
  const [weeklyChecklists, setWeeklyChecklists] = useState({}); // { dayIndex: { exerciseIndex: boolean } }
  const [activeWeeklyDay, setActiveWeeklyDay] = useState(0); // For Weekly Schedule (Tab A)

  // Alarms
  const [alarms, setAlarms] = useState(loadAlarms);
  const [alarmTime, setAlarmTime] = useState("07:00");
  const [alarmLabel, setAlarmLabel] = useState("Morning Workout");

  useEffect(() => { requestNotif(); }, []);
  useEffect(() => { saveAlarms(alarms); }, [alarms]);
  useEffect(() => { alarms.forEach(scheduleAlarm); }, []); // eslint-disable-line

  useEffect(() => {
    // Randomize quote on mount
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  function getBmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  async function handleGenerate() {
    if (!weight || !height || !age || !routine || !availability) {
      alert("Please fill all required details.");
      return;
    }
    
    const bmiVal = (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1);
    const cat = getBmiCategory(bmiVal);
    setBmiData({ value: bmiVal, category: cat });

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("confide_trainer_weight", weight);
      localStorage.setItem("confide_trainer_height", height);
      localStorage.setItem("confide_trainer_age", age);
      localStorage.setItem("confide_trainer_goal", goal);
      localStorage.setItem("confide_trainer_routine", routine);
      localStorage.setItem("confide_trainer_availability", availability);
      localStorage.setItem("confide_trainer_level", level);
    } catch(e) {}

    try {
      const prompt = `CRITICAL INSTRUCTION: You are an expert, strict personal trainer. You must analyze the following user details and output a highly personalized daily workout plan and a 7-day weekly schedule. DO NOT give generic advice. Do not output anything except the JSON.

User Details:
- Goal: ${goal}
- Level: ${level}
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmiVal} (${cat})
- Age: ${age}
- Daily Routine: ${routine}
- Availability: ${availability}

Return ONLY valid JSON in this exact ultra-compressed format:
{
  "w": [
    { 
      "d": "Day 1", 
      "f": "Focus Name", 
      "desc": "Short description",
      "ex": "Exercise 1 3x15, Exercise 2 3x15, Exercise 3 3x15, Exercise 4 3x15, Exercise 5 3x15, Exercise 6 3x15, Exercise 7 3x15, Exercise 8 3x15, Exercise 9 3x15, Exercise 10 3x15"
    }
  ]
}
Make sure "w" has exactly 7 items (Day 1 to 7). 
CRITICAL: 'ex' MUST be a single comma-separated string containing EXACTLY 10 exercises with sets/reps. DO NOT use arrays for exercises! This saves memory.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Parse JSON
      let cleaned = data.reply.replace(/```json|```/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        const w = Array.isArray(parsed.w) ? parsed.w : (parsed.weeklySchedule || []);
        setWeeklySchedule(w);
        
        let dWork = [];
        if (w[0]) {
          dWork = typeof w[0].ex === 'string' ? w[0].ex.split(',').filter(Boolean) : (w[0].ex || w[0].exercises || []);
        }
        setDailyWorkout(dWork);
      } catch (err) {
        // Robust brute-force fallback for truncated JSON limits
        let repaired = false;
        let cut = cleaned.substring(0, Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']')) + 1);
        cut = cut.replace(/,\s*$/, '');
        
        const endings = ['', '}', ']}', '}]}', ']}]}', '}]}]}', ']}]}]}'];
        for (let end of endings) {
          try {
            const fixed = JSON.parse(cut + end);
            const w = Array.isArray(fixed.w) ? fixed.w : (fixed.weeklySchedule || []);
            setWeeklySchedule(w);
            
            let dWork = [];
            if (w[0]) {
              dWork = typeof w[0].ex === 'string' ? w[0].ex.split(',').filter(Boolean) : (w[0].ex || w[0].exercises || []);
            }
            setDailyWorkout(dWork);
            repaired = true;
            break;
          } catch(e) {}
        }
        
        if (!repaired) {
          throw new Error("Data was heavily truncated. " + err.message);
        }
      }
      
      setChecklist({});
      setWeeklyChecklists({});
      setActiveWeeklyDay(0);
      setStep("BA");
      setActiveTab("B");

    } catch (err) {
      setError("Failed to generate plan. Please try again. Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleChecklist(index) {
    setChecklist(prev => ({ ...prev, [index]: !prev[index] }));
  }

  function toggleWeeklyChecklist(dayIndex, exIndex) {
    setWeeklyChecklists(prev => {
      const dayState = prev[dayIndex] || {};
      return {
        ...prev,
        [dayIndex]: { ...dayState, [exIndex]: !dayState[exIndex] }
      };
    });
  }

  function addAlarm() {
    const alarm = { id: Date.now(), time: alarmTime, label: alarmLabel, message: "Time to work out! 💪" };
    const updated = [...alarms, alarm];
    setAlarms(updated);
    scheduleAlarm(alarm);
  }

  function removeAlarm(id) {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }

  // Render Subpage D
  if (step === "D") {
    return (
      <div className="mode-panel trainer-d">
        <div className="trainer-d__overlay">
          <h2 className="trainer-d__title">WAKE UP.</h2>
          <p className="trainer-d__quote">"{quote}"</p>
          <button className="trainer-d__btn" onClick={() => setStep("C")}>Begin Training</button>
        </div>
      </div>
    );
  }

  // Render Subpage C
  if (step === "C") {
    return (
      <div className="mode-panel">
        <div className="mode-panel__header">
          <span className="mode-panel__title">🏋️ Trainer Processing</span>
          <span className="mode-panel__sub">I need your exact stats. Do not lie to me.</span>
        </div>

        <div className="trainer__goals">
          {GOALS.map((g) => (
            <button
              key={g.id}
              className={`trainer__goal-btn ${goal === g.id ? "trainer__goal-btn--active" : ""}`}
              onClick={() => setGoal(g.id)}
            >{g.label}</button>
          ))}
        </div>

        <div className="trainer__section-label">👤 Physical Stats</div>
        <div className="docs__input-row" style={{ flexWrap: "wrap", marginBottom: "12px" }}>
          <input className="docs__input" style={{ width: "calc(33% - 8px)" }} type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <input className="docs__input" style={{ width: "calc(33% - 8px)" }} type="number" placeholder="Height (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
          <input className="docs__input" style={{ width: "calc(33% - 8px)" }} type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>

        <div className="trainer__section-label">🕒 Lifestyle</div>
        <div className="docs__input-row" style={{ flexWrap: "wrap", marginBottom: "12px" }}>
          <input className="docs__input" style={{ width: "calc(50% - 6px)" }} placeholder="Routine (e.g. 9-5 desk job)" value={routine} onChange={(e) => setRoutine(e.target.value)} />
          <input className="docs__input" style={{ width: "calc(50% - 6px)" }} placeholder="Availability (e.g. 45m evening)" value={availability} onChange={(e) => setAvailability(e.target.value)} />
        </div>

        <div className="docs__input-row">
          <select className="docs__input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">🌱 Beginner</option>
            <option value="intermediate">🔥 Intermediate</option>
            <option value="advanced">⚡ Advanced</option>
          </select>
          <button
            className="docs__generate-btn docs__generate-btn--active"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "⚙️ Processing..." : "Analyze & Generate"}
          </button>
        </div>

        {error && <div className="docs__error">⚠️ {error}</div>}
      </div>
    );
  }

  // Render Subpage B & A (Tabbed)
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = dailyWorkout.length;

  return (
    <div className="mode-panel">
      <div className="mode-panel__header">
        <span className="mode-panel__title">🏋️ Your Plan</span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {bmiData && (
            <span className="mode-panel__sub" style={{ color: "var(--accent-a)", fontWeight: "600" }}>
              BMI: {bmiData.value} ({bmiData.category})
            </span>
          )}
          <button className="trainer__edit-btn" onClick={() => setStep("C")}>
            ✏️ Edit Details
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="trainer-tabs">
        <button 
          className={`trainer-tab ${activeTab === "B" ? "trainer-tab--active" : ""}`}
          onClick={() => setActiveTab("B")}
        >
          📝 Daily Checklist
        </button>
        <button 
          className={`trainer-tab ${activeTab === "A" ? "trainer-tab--active" : ""}`}
          onClick={() => setActiveTab("A")}
        >
          📅 Weekly Roadmap
        </button>
      </div>

      <div className="trainer-content">
        {activeTab === "B" && (
          <div className="trainer-b">
            <div className="trainer-b__progress">
              <span>Today's Progress</span>
              <strong>{completedCount}/{totalCount} Completed</strong>
            </div>
            <div className="trainer-b__list">
              {dailyWorkout.length === 0 && <p className="trainer__empty-hint">No exercises generated.</p>}
              {dailyWorkout.map((exObj, i) => {
                let name = "Exercise";
                let meta = "Do your best!";
                
                if (typeof exObj === "string") {
                  const splitChar = exObj.includes("|") ? "|" : (exObj.match(/\s\d+x/) ? " " : null);
                  if (splitChar === "|") {
                    const parts = exObj.split("|").map(p => p.trim());
                    name = parts[0];
                    meta = parts.slice(1).join(" • ");
                  } else if (splitChar === " ") {
                    const match = exObj.match(/(.+?)\s+(\d+x\d+.*)/);
                    if (match) {
                      name = match[1].trim();
                      meta = match[2].trim();
                    } else {
                      name = exObj.trim();
                    }
                  } else {
                    name = exObj.trim();
                  }
                } else if (typeof exObj === "object") {
                  name = exObj.exercise || exObj.name || "Exercise";
                  meta = `${exObj.sets || '-'} sets × ${exObj.reps || '-'} reps • ${exObj.duration || ''}`;
                }

                return (
                  <div 
                    key={i} 
                    className={`trainer-b__item ${checklist[i] ? "trainer-b__item--done" : ""}`}
                    onClick={() => toggleChecklist(i)}
                    style={{ cursor: 'pointer' }}
                  >
                    <button className="trainer-b__check">
                      {checklist[i] ? "✔️" : "⬜"}
                    </button>
                    <div className="trainer-b__details">
                      <span className="trainer-b__name">{name}</span>
                      <span className="trainer-b__meta">{meta}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="trainer__divider" style={{ marginTop: "20px" }} />
            
            <div className="trainer__section-label">⏰ Workout Alarms</div>
            <div className="trainer__alarm-row">
              <input type="time" className="tasks__deadline-input" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
              <input className="docs__input" placeholder="Label" value={alarmLabel} onChange={(e) => setAlarmLabel(e.target.value)} style={{ flex: 1 }} />
              <button className="docs__generate-btn docs__generate-btn--active" style={{ padding: "8px 16px" }} onClick={addAlarm}>+ Set</button>
            </div>
            <div className="trainer__alarm-list">
              {alarms.map((a) => (
                <div key={a.id} className="trainer__alarm-item">
                  <span className="trainer__alarm-time">⏰ {a.time}</span>
                  <span className="trainer__alarm-label">{a.label}</span>
                  <button className="tasks__delete" onClick={() => removeAlarm(a.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "A" && (
          <div className="trainer-a">
            <div className="trainer-a__list">
              {weeklySchedule.length === 0 && <p className="trainer__empty-hint">No schedule generated.</p>}
              {weeklySchedule.map((day, i) => (
                <div 
                  key={i} 
                  className={`trainer-a__card ${activeWeeklyDay === i ? 'trainer-a__card--active' : ''}`}
                  onClick={() => setActiveWeeklyDay(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="trainer-a__day">{day.d || day.day}</div>
                  <div className="trainer-a__focus">{day.f || day.focus}</div>
                  <div className="trainer-a__desc">{day.desc || day.description}</div>
                </div>
              ))}
            </div>

            {/* Interactive Day Panel */}
            {weeklySchedule[activeWeeklyDay] && (() => {
              const activeDay = weeklySchedule[activeWeeklyDay];
              let exList = [];
              if (typeof activeDay.ex === 'string') {
                exList = activeDay.ex.split(',').filter(Boolean);
              } else {
                exList = activeDay.ex || activeDay.exercises || [];
              }
              
              return (
                <div className="trainer-a__panel">
                  <div className="trainer-a__panel-header">
                    <h3>{activeDay.d || activeDay.day} Workout</h3>
                    <strong>
                      {Object.values(weeklyChecklists[activeWeeklyDay] || {}).filter(Boolean).length} / {exList.length} Completed
                    </strong>
                  </div>
                  <div className="trainer-b__list">
                    {exList.length === 0 && <p className="trainer__empty-hint">No exercises found for this day.</p>}
                    {exList.map((exObj, i) => {
                      let name = "Exercise";
                      let meta = "Do your best!";
                      
                      if (typeof exObj === "string") {
                        // Extract name and sets/reps if formatted like "Pushups 3x15" or "Pushups | 3x15"
                        const splitChar = exObj.includes("|") ? "|" : (exObj.match(/\s\d+x/) ? " " : null);
                        if (splitChar === "|") {
                          const parts = exObj.split("|").map(p => p.trim());
                          name = parts[0];
                          meta = parts.slice(1).join(" • ");
                        } else if (splitChar === " ") {
                          const match = exObj.match(/(.+?)\s+(\d+x\d+.*)/);
                          if (match) {
                            name = match[1].trim();
                            meta = match[2].trim();
                          } else {
                            name = exObj.trim();
                          }
                        } else {
                          name = exObj.trim();
                        }
                      } else if (typeof exObj === "object") {
                        name = exObj.exercise || exObj.name || "Exercise";
                        meta = `${exObj.sets || '-'} sets × ${exObj.reps || '-'} reps • ${exObj.duration || ''}`;
                      }

                      const isDone = (weeklyChecklists[activeWeeklyDay] || {})[i];
                    return (
                      <div 
                        key={i} 
                        className={`trainer-b__item ${isDone ? "trainer-b__item--done" : ""}`}
                        onClick={() => toggleWeeklyChecklist(activeWeeklyDay, i)}
                        style={{ cursor: 'pointer' }}
                      >
                        <button className="trainer-b__check">
                          {isDone ? "✔️" : "⬜"}
                        </button>
                        <div className="trainer-b__details">
                          <span className="trainer-b__name">{name}</span>
                          <span className="trainer-b__meta">{meta}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) })()}
          </div>
        )}
      </div>
    </div>
  );
}
