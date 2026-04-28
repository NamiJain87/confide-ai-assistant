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

function scheduleNotif(task) {
  if (!task.deadline || Notification.permission !== "granted") return;
  const ms = new Date(task.deadline).getTime() - Date.now();
  if (ms <= 0) return;
  setTimeout(() => {
    new Notification(`⏰ Task Due: ${task.text}`, {
      body: "Your task deadline has arrived!",
      icon: "/favicon.ico",
    });
    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
  }, ms);
}

export default function TasksMode() {
  const [tasks,    setTasks]    = useState(loadTasks);
  const [input,    setInput]    = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter,   setFilter]   = useState("all");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { requestNotifPermission(); }, []);
  useEffect(() => { saveTasks(tasks); }, [tasks]);

  function addTask(text = input, dl = deadline, pri = priority) {
    if (!text.trim()) return;
    const task = {
      id:        Date.now(),
      text:      text.trim(),
      status:    "todo",
      priority:  pri,
      deadline:  dl,
      createdAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
    scheduleNotif(task);
    setInput("");
    setDeadline("");
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
          {task.deadline && (
            <span className="tasks__item-deadline">
              ⏰ {new Date(task.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </span>
          )}
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
        <div className="tasks__add-row">
          <input
            type="datetime-local"
            className="tasks__deadline-input"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            title="Set deadline"
          />
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
      <div className="tasks__toolbar">
        <button className="tasks__ai-btn" onClick={aiPrioritize} disabled={aiLoading || tasks.length < 2}>
          {aiLoading ? "🤔 Thinking…" : "🤖 AI Prioritize (To Do)"}
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
