import { useState } from "react";
import { StudentsView } from "./components/StudentsView.jsx";
import { TeachersView } from "./components/TeachersView.jsx";
import { ExamsView } from "./components/ExamsView.jsx";
import { apiBase } from "./config.js";

const TABS = [
  { id: "students", label: "Students" },
  { id: "teachers", label: "Teachers" },
  { id: "exams", label: "Exams" },
];

function App() {
  const [tab, setTab] = useState("students");

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Microservices console</h1>
          <p className="subtitle">
            Student API <code>{apiBase.student}</code> · Exam <code>{apiBase.exam}</code> · Teacher{" "}
            <code>{apiBase.teacher}</code>
          </p>
        </div>
        <nav className="tabs" aria-label="Primary">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === "students" && <StudentsView />}
        {tab === "teachers" && <TeachersView />}
        {tab === "exams" && <ExamsView />}
      </main>
    </div>
  );
}

export default App;
