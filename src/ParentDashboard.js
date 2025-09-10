import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Container, Navbar, Nav, Table, Form, Button, Accordion, Row, Col, ListGroup } from "react-bootstrap";

const days = ["Pon","Wt","Śr","Czw","Pt","Sob","Nd"];
const categories = ["Poranek","Po szkole","Wieczór"];

export default function ParentDashboard() {
  const [user, setUser] = useState(auth.currentUser);
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [penalties, setPenalties] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [taskScores, setTaskScores] = useState({}); // { "Poranek-Umycie zębów-Pon": 1 }
  const [newPenalty, setNewPenalty] = useState({ name: "", points: -1, date: "" });
  const [newReward, setNewReward] = useState({ name: "", points: 1, date: "" });

  // Pobranie dzieci
  useEffect(() => {
    if (!user) return;
    const fetchChildren = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return;
      const childIds = userDoc.data().childIds || [];
      const childData = [];
      for (const id of childIds) {
        const childDoc = await getDoc(doc(db, "children", id));
        if (!childDoc.exists()) continue;
        childData.push({ id, ...childDoc.data() });
      }
      setChildren(childData);
      if (childData.length > 0) setActiveChild(childData[0].id);
    };
    fetchChildren();
  }, [user]);

  // Pobranie harmonogramu i punktów
  useEffect(() => {
    if (!activeChild) return;

    const fetchData = async () => {
      // Harmonogram
      const snap = await getDocs(collection(db, "children", activeChild, "weeklySchedule"));
      const schedule = {};
      const scores = {};
      snap.forEach(docSnap => {
        const data = docSnap.data();
        schedule[docSnap.id] = data;
        // Inicjalizacja taskScores
        categories.forEach(cat => {
          const tasksCat = data.tasks?.[cat.toLowerCase().replace(" ","")] || [];
          tasksCat.forEach(task => {
            days.forEach(day => {
              const key = `${cat}-${task}-${day}`;
              scores[key] = 0; // default 0
            });
          });
        });
      });
      setWeeklySchedule(schedule);
      setTaskScores(scores);

      // Kary
      const penaltySnap = await getDocs(collection(db, "children", activeChild, "penalties"));
      setPenalties(penaltySnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Nagrody
      const rewardSnap = await getDocs(collection(db, "children", activeChild, "rewards"));
      setRewards(rewardSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchData();
  }, [activeChild]);

  const handleScoreChange = (key, value) => {
    setTaskScores(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  const totalPoints = () => {
    let sum = 0;
    Object.values(taskScores).forEach(v => sum += v);
    penalties.forEach(p => sum += p.points);
    rewards.forEach(r => sum += r.points);
    return sum;
  };

  const addPenalty = async () => {
    if (!newPenalty.name || !newPenalty.points) return;
    const colRef = collection(db, "children", activeChild, "penalties");
    const docRef = await addDoc(colRef, newPenalty);
    setPenalties([...penalties, { id: docRef.id, ...newPenalty }]);
    setNewPenalty({ name: "", points: -1, date: "" });
  };

  const removePenalty = async (id) => {
    await deleteDoc(doc(db, "children", activeChild, "penalties", id));
    setPenalties(penalties.filter(p => p.id !== id));
  };

  const addReward = async () => {
    if (!newReward.name || !newReward.points) return;
    const colRef = collection(db, "children", activeChild, "rewards");
    const docRef = await addDoc(colRef, newReward);
    setRewards([...rewards, { id: docRef.id, ...newReward }]);
    setNewReward({ name: "", points: 1, date: "" });
  };

  const removeReward = async (id) => {
    await deleteDoc(doc(db, "children", activeChild, "rewards", id));
    setRewards(rewards.filter(r => r.id !== id));
  };

  // Funkcja zapisująca punkty zadań do Firestore
const saveScores = async () => {
  if (!activeChild) return;

  try {
    for (const docId in weeklySchedule) {
      const scheduleDocRef = doc(db, "children", activeChild, "weeklySchedule", docId);
      // Pobieramy aktualny dokument
      const data = weeklySchedule[docId];
      // Tworzymy mapę scores dla tego dokumentu
      const scoresForDoc = {};
      categories.forEach(cat => {
        const tasksCat = data.tasks?.[cat.toLowerCase().replace(" ","")] || [];
        tasksCat.forEach(task => {
          days.forEach(day => {
            const key = `${cat}-${task}-${day}`;
            if (taskScores[key] !== undefined) scoresForDoc[key] = taskScores[key];
          });
        });
      });
      // Aktualizujemy dokument
      await updateDoc(scheduleDocRef, { scores: scoresForDoc });
    }
    alert("✅ Punkty zadań zapisane w Firestore!");
  } catch (err) {
    console.error("Błąd przy zapisie punktów:", err);
    alert("⚠️ Wystąpił błąd przy zapisie punktów.");
  }
};


  return (
    <>
      <Navbar bg="primary" variant="dark" className="mb-3">
        <Container>
          <Navbar.Brand>familyScoring</Navbar.Brand>
          <Nav className="ms-auto">{user?.email}</Nav>
        </Container>
      </Navbar>

      <Container>
        <Accordion className="mb-4">
          <Accordion.Item eventKey="0">
            <Accordion.Header>📖 Legenda: system kar i nagród</Accordion.Header>
            <Accordion.Body>
              <ul>
                <li><b>Punkty zadania:</b> -3 do 3</li>
                <li><b>Kary:</b> punkty ujemne</li>
                <li><b>Nagrody:</b> punkty dodatnie</li>
                <li><b>Całkowity wynik:</b> suma punktów</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Table bordered className="text-center align-middle">
          <thead className="table-primary">
            <tr>
              <th>Obowiązek</th>
              {days.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              // Pobranie zadań z activeChild
              const scheduleTasks = Object.values(weeklySchedule).flatMap(w => w.tasks?.[cat.toLowerCase().replace(" ","")] || []);
              return scheduleTasks.map((task,i) => (
                <tr key={`${cat}-${i}`}>
                  <td className="text-start">{task}</td>
                  {days.map(day => {
                    const key = `${cat}-${task}-${day}`;
                    return (
                      <td key={day}>
                        <Form.Select size="sm" value={taskScores[key] || 0} onChange={e=>handleScoreChange(key,e.target.value)}>
                          {Array.from({length:7},(_,i)=>i-3).map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </Form.Select>
                      </td>
                    )
                  })}
                </tr>
              ))
            })}
          </tbody>
        </Table>

        <Row className="mt-4">
          <Col>
            <h4>⚠️ Kary</h4>
            <ListGroup className="mb-3">
              {penalties.map(p => (
                <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                  {p.name} | Punkty: {p.points} | Data: {p.date}
                  <Button size="sm" variant="outline-dark" onClick={()=>removePenalty(p.id)}>Usuń</Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Form className="d-flex gap-2 flex-wrap mb-3">
              <Form.Control placeholder="Nazwa kary" value={newPenalty.name} onChange={e=>setNewPenalty({...newPenalty,name:e.target.value})} />
              <Form.Control type="number" value={newPenalty.points} onChange={e=>setNewPenalty({...newPenalty,points:parseInt(e.target.value)})} />
              <Form.Control type="date" value={newPenalty.date} onChange={e=>setNewPenalty({...newPenalty,date:e.target.value})} />
              <Button variant="danger" onClick={addPenalty}>Dodaj karę</Button>
            </Form>
          </Col>
          <Col>
            <h4>🏆 Nagrody</h4>
            <ListGroup className="mb-3">
              {rewards.map(r => (
                <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                  {r.name} | Punkty: {r.points} | Data: {r.date}
                  <Button size="sm" variant="outline-dark" onClick={()=>removeReward(r.id)}>Usuń</Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Form className="d-flex gap-2 flex-wrap mb-3">
              <Form.Control placeholder="Nazwa nagrody" value={newReward.name} onChange={e=>setNewReward({...newReward,name:e.target.value})} />
              <Form.Control type="number" value={newReward.points} onChange={e=>setNewReward({...newReward,points:parseInt(e.target.value)})} />
              <Form.Control type="date" value={newReward.date} onChange={e=>setNewReward({...newReward,date:e.target.value})} />
              <Button variant="success" onClick={addReward}>Dodaj nagrodę</Button>
            </Form>
          </Col>
        </Row>

        <h3 className="mt-4">📊 Podsumowanie: {totalPoints()} punktów</h3>
        <div className="d-flex gap-3 mt-3">
  <Button variant="success" onClick={saveScores}>💾 Zapisz punkty zadań</Button>
</div>

      </Container>
    </>
  )
}
