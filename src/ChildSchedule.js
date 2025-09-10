// src/ChildSchedule.js
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button, Card, Form, Row, Col } from "react-bootstrap";

const defaultTasks = {
  morning: [
    "Umycie zębów i twarzy",
    "Pościelenie łóżka i ogarnięcie pokoju",
    "Pomoc domowa (śniadanie)",
    "Nauka przed szkołą",
  ],
  afternoon: [
    "Odrabianie lekcji",
    "Przestrzeganie czasu na telefon i TV",
    "Wykonywanie domowych obowiązków",
    "Zadania sportowe lub spacer",
  ],
  evening: [
    "Sprzątanie wspólnej przestrzeni",
    "Przygotowanie się na jutro (nauka lub czytanie)",
    "Umycie się, piżama",
    "Odkładanie elektroniki",
    "Pójście spać o czasie",
    "Spanie bez lampki",
  ],
};

export default function ChildSchedule({ childId, childrenList = [], onComplete }) {
  const [tasks, setTasks] = useState(defaultTasks);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("morning");

  // Pobranie istniejącego harmonogramu dziecka
  useEffect(() => {
    const fetchSchedule = async () => {
      const ref = doc(db, "children", childId, "schedule", "default");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setTasks(snap.data());
      }
    };
    if (childId) fetchSchedule();
  }, [childId]);

  // Dodawanie zadania
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => ({
      ...prev,
      [category]: [...prev[category], newTask.trim()],
    }));
    setNewTask("");
  };

  // Usuwanie zadania
  const removeTask = (cat, idx) => {
    setTasks((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== idx),
    }));
  };

  // Zapis harmonogramu do Firestore
  const saveSchedule = async () => {
    const ref = doc(db, "children", childId, "schedule", "default");
    await setDoc(ref, tasks);

    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">📅 Harmonogram dziecka</h2>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-center">
            <Col xs={12} md={4}>
              <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="morning">Poranek</option>
                <option value="afternoon">Po szkole</option>
                <option value="evening">Wieczór</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={6}>
              <Form.Control
                type="text"
                placeholder="Nowe zadanie"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
            </Col>
            <Col xs={12} md={2}>
              <Button onClick={addTask} className="w-100">
                Dodaj
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {Object.entries(tasks).map(([cat, items]) => (
        <Card key={cat} className="mb-3">
          <Card.Header className="fw-bold">
            {cat === "morning" && "🌅 Poranek"}
            {cat === "afternoon" && "🏫 Po szkole"}
            {cat === "evening" && "🌙 Wieczór"}
          </Card.Header>
          <Card.Body>
            {items.length === 0 && <p className="text-muted">Brak zadań</p>}
            <ul className="list-group">
              {items.map((task, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {task}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeTask(cat, idx)}
                  >
                    Usuń
                  </Button>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      ))}

      <div className="text-center mt-4">
        <Button onClick={saveSchedule} variant="success" size="lg">
          ✅ Przypisz harmonogram
        </Button>
      </div>
    </div>
  );
}
