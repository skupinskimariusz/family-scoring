// src/ChildWizard.js
import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { Container, Form, Button, ListGroup } from "react-bootstrap";

const predefinedTasks = {
  "0-3": ["Sprzątanie zabawek", "Mycie rąk przed posiłkiem"],
  "4-5": ["Sprzątanie zabawek", "Samodzielne ubieranie się", "Mycie rąk przed posiłkiem"],
  "6-8": ["Sprzątanie pokoju", "Pomoc w nakrywaniu do stołu", "Samodzielne mycie zębów"],
  "9-12": ["Przygotowanie śniadania z pomocą rodzica", "Zmywanie naczyń", "Sprzątanie pokoju"],
  "13-15": ["Samodzielne odrabianie lekcji", "Pranie swoich ubrań", "Pomoc w kuchni"],
  "16-18": ["Zarządzanie swoim czasem", "Pomoc w kuchni i obowiązkach domowych", "Samodzielne zakupy"]
};
const daysOfWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function ChildWizard({ parentId }) {
  const [children, setChildren] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const addChildToList = () => {
    if(!name || !age) return;
    setChildren([...children, { name, age: Number(age) }]);
    setName(""); setAge("");
  };

  const submitChildren = async () => {
    const parentRef = doc(db, "users", parentId);
    const childIds = [];

    for (const child of children) {
      const childDoc = await addDoc(collection(db, "children"), {
        name: child.name,
        age: child.age
      });
      childIds.push(childDoc.id);

      const ageGroup = Object.keys(predefinedTasks).find(range => {
        const [min,max] = range.split("-").map(Number);
        return child.age >= min && child.age <= max;
      });
      const tasks = predefinedTasks[ageGroup] || [];

      for(const day of daysOfWeek){
        await addDoc(collection(db, "children", childDoc.id, "weeklySchedule"), {
          day,
          tasks
        });
      }
    }

    await updateDoc(parentRef, { childIds });
    alert("Dzieci dodane i harmonogramy utworzone!");
  };

  return (
    <Container style={{ maxWidth: "600px", marginTop: "50px" }}>
      <h2 className="mb-4">Dodaj dzieci</h2>
      <Form className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Imię dziecka</Form.Label>
          <Form.Control value={name} onChange={e=>setName(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Wiek</Form.Label>
          <Form.Control type="number" value={age} onChange={e=>setAge(e.target.value)} />
        </Form.Group>
        <Button onClick={addChildToList}>Dodaj do listy</Button>
      </Form>

      <h4>Lista dzieci do dodania:</h4>
      <ListGroup className="mb-3">
        {children.map((c,i)=><ListGroup.Item key={i}>{c.name}, {c.age} lat</ListGroup.Item>)}
      </ListGroup>

      <Button onClick={submitChildren} disabled={children.length===0}>Zakończ konfigurację</Button>
    </Container>
  );
}
