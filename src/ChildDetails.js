// src/ChildDetails.js
import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { Container, Form, Button, ListGroup } from "react-bootstrap";

export default function ChildDetails({ parentId, onFinish }) {
  const [children, setChildren] = useState([]);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Dodaj dziecko lokalnie do listy
  const addChildToList = () => {
    if (!name || !birthDate) return;
    setChildren([...children, { name, birthDate }]);
    setName("");
    setBirthDate("");
  };

  // Zapis dzieci w Firestore
  const saveChildren = async () => {
    const ids = [];
    for (const child of children) {
      const docRef = await addDoc(collection(db, "children"), {
        parentId,
        name: child.name,
        birthDate: child.birthDate,
      });
      ids.push(docRef.id);
    }
    if (onFinish) onFinish(ids);
  };

  return (
    <Container style={{ maxWidth: "600px", marginTop: "50px" }}>
      <h2 className="mb-4">👶 Dodaj dzieci</h2>
      <Form className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Imię dziecka</Form.Label>
          <Form.Control
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Data urodzenia</Form.Label>
          <Form.Control
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </Form.Group>
        <Button onClick={addChildToList}>Dodaj do listy</Button>
      </Form>

      <h4>Lista dzieci:</h4>
      <ListGroup className="mb-3">
        {children.map((c, i) => (
          <ListGroup.Item key={i}>
            {c.name} — {new Date(c.birthDate).toLocaleDateString()}
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Button
        onClick={saveChildren}
        disabled={children.length === 0}
        variant="success"
      >
        ➡️ Przejdź do harmonogramów
      </Button>
    </Container>
  );
}
