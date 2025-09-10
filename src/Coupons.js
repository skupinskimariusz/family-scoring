// src/Coupons.js
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Container, Form, Button, ListGroup, Row, Col } from "react-bootstrap";

export default function Coupons({ parentId, onClose }) {
  const [coupons, setCoupons] = useState([]);
  const [name, setName] = useState("");
  const [points, setPoints] = useState(1);
  const [expiry, setExpiry] = useState("");

  // Pobierz bony z Firestore
  useEffect(() => {
    if (!parentId) return;
    const fetchCoupons = async () => {
      const snapshot = await getDocs(collection(db, "users", parentId, "coupons"));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(list);
    };
    fetchCoupons();
  }, [parentId]);

  const addCoupon = async () => {
    if (!name || !points) return alert("Podaj nazwę i punkty bonu!");
    const newCoupon = { name, points, expiry: expiry || null };
    const docRef = await addDoc(collection(db, "users", parentId, "coupons"), newCoupon);
    setCoupons([...coupons, { id: docRef.id, ...newCoupon }]);
    setName("");
    setPoints(1);
    setExpiry("");
  };

  const removeCoupon = async (id) => {
    await deleteDoc(doc(db, "users", parentId, "coupons", id));
    setCoupons(coupons.filter(c => c.id !== id));
  };

  return (
    <Container className="mt-3">
      <Row className="mb-3 align-items-center">
        <Col><h3>🏷️ Definiowanie bonów</h3></Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={onClose}>⬅️ Powrót do Dashboard</Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4} className="mb-2">
          <Form.Control 
            placeholder="Nazwa bonu"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </Col>
        <Col md={2} className="mb-2">
          <Form.Control 
            type="number"
            placeholder="Punkty"
            value={points}
            onChange={e => setPoints(parseInt(e.target.value))}
          />
        </Col>
        <Col md={3} className="mb-2">
          <Form.Control 
            type="date"
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
          />
        </Col>
        <Col md={3} className="mb-2">
          <Button variant="success" onClick={addCoupon}>Dodaj bon</Button>
        </Col>
      </Row>

      <ListGroup>
        {coupons.map(c => (
          <ListGroup.Item key={c.id} className="d-flex justify-content-between align-items-center">
            <div>
              <b>{c.name}</b> | Punkty: {c.points} | {c.expiry ? `Ważny do: ${c.expiry}` : "Brak daty"}
            </div>
            <Button size="sm" variant="outline-danger" onClick={() => removeCoupon(c.id)}>Usuń</Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
}
