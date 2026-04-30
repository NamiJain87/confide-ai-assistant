import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

function loadTasks() {
  try { return JSON.parse(localStorage.getItem("confide_tasks") || "[]"); }
  catch { return []; }
}
function saveTasks(tasks) {
  localStorage.setItem("confide_tasks", JSON.stringify(tasks));
}

function requestNotifPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function playReminderMusic() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };
    // Play a pleasant alert chime
    playNote(523.25, 0, 0.5);
    playNote(659.25, 0.15, 0.5);
    playNote(783.99, 0.3, 0.5);
    playNote(1046.50, 0.45, 1.0);
  } catch (e) { console.warn("AudioContext not supported", e); }
}

const activeTimeouts = {};

function scheduleNotif(task) {
  if (Notification.permission !== "granted" || task.status === "done") return;
  
  if (activeTimeouts[`${task.id}_start`]) clearTimeout(activeTimeouts[`${task.id}_start`]);
  if (activeTimeouts[`${task.id}_end`]) clearTimeout(activeTimeouts[`${task.id}_end`]);

  const now = Date.now();

  // Advance reminder (10 mins before start)
  if (task.startTime) {
    const startMs = new Date(task.startTime).getTime();
    const advanceMs = startMs - (10 * 60 * 1000) - now;
    if (advanceMs > 0) {
      activeTimeouts[`${task.id}_start`] = setTimeout(() => {
        new Notification(`⏰ Heads up!`, {
          body: `Your task '${task.text}' starts in 10 minutes!`,
          icon: "/favicon.ico",
        });
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
        playReminderMusic();
        delete activeTimeouts[`${task.id}_start`];
      }, advanceMs);
    }
  }

  // End time reminder
  const finalDeadline = task.endTime || task.deadline; // Backwards compatible
  if (finalDeadline) {
    const endMs = new Date(finalDeadline).getTime() - now;
    if (endMs > 0) {
      activeTimeouts[`${task.id}_end`] = setTimeout(() => {
        new Notification(`⏳ Time's Up!`, {
          body: `Deadline reached for: ${task.text}`,
          icon: "/favicon.ico",
        });
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
        playReminderMusic();
        delete activeTimeouts[`${task.id}_end`];
      }, endMs);
    }
  }
}

export default function TasksMode() {
  const [tasks,    setTasks]    = useState(loadTasks);
  const [input,    setInput]    = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime,   setEndTime]   = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter,   setFilter]   = useState("all");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { 
    requestNotifPermission(); 
    // Schedule all pending tasks with deadlines on mount
    tasks.forEach(scheduleNotif);
  }, []); // eslint-disable-line

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  function notifyPendingSummary() {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
      alert("Please allow notifications to use this feature.");
      return;
    }
    const pendingTasks = tasks.filter(t => t.status !== "done");
    if (pendingTasks.length === 0) {
      alert("No pending tasks to remind you about!");
      return;
    }
    
    let bodyText = pendingTasks.map(t => `• ${t.text}`).join("\n");
    if (bodyText.length > 150) bodyText = bodyText.slice(0, 147) + "...";

    new Notification(`You have ${pendingTasks.length} pending tasks`, {
      body: bodyText,
      icon: "/favicon.ico",
    });
    playReminderMusic();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function addTask(text = input, start = startTime, end = endTime, pri = priority) {
    if (!text.trim()) return;
    const task = {
      id:        Date.now(),
      text:      text.trim(),
      status:    "todo",
      priority:  pri,
      startTime: start,
      endTime:   end,
      createdAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
    scheduleNotif(task);
    setInput("");
    setStartTime("");
    setEndTime("");
    setPriority("medium");
  }

  function setTaskStatus(id, newStatus) {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      if (newStatus === "done" && t.status !== "done") {
        // Celebrate!
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#f43f8e","#a855f7","#10b981"] });
      }
      return { ...t, status: newStatus };
    }));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function aiPrioritize() {
    if (tasks.length === 0) return;
    setAiLoading(true);
    const taskList = tasks.map((t, i) => `${i + 1}. ${t.text}${t.deadline ? ` (due: ${new Date(t.deadline).toLocaleDateString()})` : ""}`).join("\n");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Here are my tasks:\n${taskList}\n\nPrioritize them from most to least urgent. Reply ONLY with the task numbers in order, like: 3, 1, 2, 4. No explanation.`,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) return;

      const order = data.reply.match(/\d+/g)?.map(Number);
      if (!order) return;
      const reordered = [];
      order.forEach((n) => { if (tasks[n - 1]) reordered.push(tasks[n - 1]); });
      tasks.forEach((t) => { if (!reordered.includes(t)) reordered.push(t); });
      setTasks(reordered);
    } finally {
      setAiLoading(false);
    }
  }

  const PRIORITY_COLORS = { high: "#ef4444", medium: "#f97316", low: "#22c55e" };
  const pending  = tasks.filter((t) => t.status !== "done").length;

  const todoTasks = tasks.filter(t => t.status === "todo" || t.done === false /* fallback for old data */);
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  const doneTasks = tasks.filter(t => t.status === "done" || t.done === true /* fallback */);

  function renderTask(task) {
    return (
      <div key={task.id} className={`tasks__item ${task.status === "done" || task.done ? "tasks__item--done" : ""}`}>
        <select
          className="tasks__status-select"
          value={task.status || (task.done ? "done" : "todo")}
          onChange={(e) => setTaskStatus(task.id, e.target.value)}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <div className="tasks__item-body">
          <span className="tasks__item-text">{task.text}</span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
            {task.startTime && (
              <span className="tasks__item-deadline">
                ▶️ Start: {new Date(task.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
            {(task.endTime || task.deadline) && (
              <span className="tasks__item-deadline">
                ⏹️ End: {new Date(task.endTime || task.deadline).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </div>
        </div>
        <span className="tasks__item-pri" style={{ background: PRIORITY_COLORS[task.priority] + "33", color: PRIORITY_COLORS[task.priority] }}>
          {task.priority}
        </span>
        <button className="tasks__delete" onClick={() => deleteTask(task.id)} aria-label="Delete">×</button>
      </div>
    );
  }

  return (
    <div className="mode-panel">
      <div className="mode-panel__header">
        <span className="mode-panel__title">✅ Task Manager</span>
        <span className="mode-panel__sub">{pending} task{pending !== 1 ? "s" : ""} pending</span>
      </div>

      {/* Add task */}
      <div className="tasks__add-card">
        <input
          className="docs__input"
          placeholder="Add a task… (press Enter)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <div className="tasks__add-row" style={{ flexWrap: "wrap" }}>
          <div className="tasks__add-dates" style={{ display: "flex", gap: "8px", flex: "1 1 auto" }}>
            <input
              type="datetime-local"
              className="tasks__deadline-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              title="Start Time"
              style={{ flex: 1, minWidth: "130px" }}
            />
            <input
              type="datetime-local"
              className="tasks__deadline-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              title="End Time"
              style={{ flex: 1, minWidth: "130px" }}
            />
          </div>
          <div className="tasks__priority-btns">
            {["high","medium","low"].map((p) => (
              <button
                key={p}
                className={`tasks__pri-btn ${priority === p ? "tasks__pri-btn--active" : ""}`}
                style={{ "--pri-color": PRIORITY_COLORS[p] }}
                onClick={() => setPriority(p)}
              >{p}</button>
            ))}
          </div>
          <button className="docs__generate-btn docs__generate-btn--active" style={{ padding: "8px 18px" }} onClick={() => addTask()}>
            + Add
          </button>
        </div>
      </div>

      {/* Filter + AI prioritize */}
      <div className="tasks__toolbar" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button className="tasks__ai-btn" onClick={aiPrioritize} disabled={aiLoading || tasks.length < 2}>
          {aiLoading ? "🤔 Thinking…" : "🤖 AI Prioritize (To Do)"}
        </button>
        <button className="tasks__ai-btn" style={{ background: "var(--surface-hover)", border: "1px solid var(--glass-border)", color: "var(--text)" }} onClick={notifyPendingSummary}>
          🔔 Send Pending Summary
        </button>
      </div>

      {/* Task Kanban */}
      <div className="tasks__kanban">
        {tasks.length === 0 && (
          <div className="music__empty" style={{ gridColumn: "1 / -1" }}><span>🎉</span><p>No tasks here — you're all caught up!</p></div>
        )}
        
        {tasks.length > 0 && (
          <>
            <div className="tasks__column">
              <div className="tasks__column-header">📌 To Do ({todoTasks.length})</div>
              <div className="tasks__column-list">
                {todoTasks.map(renderTask)}
              </div>
            </div>
            <div className="tasks__column">
              <div className="tasks__column-header">⏳ In Progress ({inProgressTasks.length})</div>
              <div className="tasks__column-list">
                {inProgressTasks.map(renderTask)}
              </div>
            </div>
            <div className="tasks__column">
              <div className="tasks__column-header">✅ Done ({doneTasks.length})</div>
              <div className="tasks__column-list">
                {doneTasks.map(renderTask)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
