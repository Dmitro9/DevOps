import { useEffect, useState } from "react";

export default function App() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    category: "Конспект",
    author: "",
  });
  const [status, setStatus] = useState("");

  async function loadMaterials() {
    try {
      const res = await fetch("/api/materials");
      if (res.ok) setMaterials(await res.json());
    } catch {
      setStatus("Помилка з'єднання з API");
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({ title: "", subject: "", category: "Конспект", author: "" });
      setStatus("Матеріал успішно додано!");
      loadMaterials();
    } else {
      setStatus("Не вдалося зберегти матеріал");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: "0 16px" }}>
      <h1>StudShare — Обмін навчальними матеріалами</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <input
          placeholder="Назва (напр., Лабораторна №2: Docker)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Предмет (напр., DevOps)"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="Конспект">Конспект</option>
          <option value="Лабораторна робота">Лабораторна робота</option>
          <option value="Методичка">Методичка</option>
        </select>
        <input
          placeholder="Автор"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          required
        />
        <button type="submit" style={{ padding: "8px 14px", cursor: "pointer" }}>
          Опублікувати матеріал
        </button>
        {status && <p style={{ margin: 0 }}>{status}</p>}
      </form>

      <h2>Доступні матеріали ({materials.length})</h2>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {materials.map((item) => (
          <li key={item.id} style={{ padding: 12, border: "1px solid #e0e0e0", borderRadius: 6 }}>
            <strong>{item.title}</strong> — {item.subject} [{item.category}]
            <div style={{ fontSize: 13, color: "#555" }}>Автор: {item.author}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}