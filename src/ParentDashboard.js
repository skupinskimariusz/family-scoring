import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { Container, Tab, Tabs, Accordion, Table, Form, Button, Row, Col, ListGroup } from "react-bootstrap";
import NavbarWithSettings from "./NavbarWithSettings";

const days = ["Pon","Wt","Śr","Czw","Pt","Sob","Nd"];
const categories = ["Poranek","Po szkole","Wieczór"];

export default function ParentDashboard() {
  const [user, setUser] = useState(auth.currentUser);
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [scores, setScores] = useState({}); // { taskId: score }
  const [penalties, setPenalties] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

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

  useEffect(() => {
    if (!activeChild) return;
    const fetchChildData = async () => {
      // Harmonogram
      const scheduleSnapshot = await getDocs(collection(db, "children", activeChild, "weeklySchedule"));
      const schedule = {};
      scheduleSnapshot.forEach(doc => {
        schedule[doc.id] = doc.data();
      });
      setWeeklySchedule(schedule);

      // Kary
      const penaltiesSnapshot = await getDocs(collection(db, "children", activeChild, "penalties"));
      const fetchedPenalties = [];
      penaltiesSnapshot.forEach(doc => fetchedPenalties.push({ id: doc.id, ...doc.data() }));
      setPenalties(fetchedPenalties);

      // Nagrody
      const rewardsSnapshot = await getDocs(collection(db, "children", activeChild, "rewards"));
      const fetchedRewards = [];
      rewardsSnapshot.forEach(doc => fetchedRewards.push({ id: doc.id, ...doc.data() }));
      setRewards(fetchedRewards);

      // Reset scores
      setScores({});
    };
    fetchChildData();
  }, [activeChild]);

  const handleScoreChange = (taskId, value) => {
    const newScores = { ...scores, [taskId]: parseInt(value) };
    setScores(newScores);
    updateTotal(newScores, penalties, rewards);
  };

  const addPenalty = async (name, points, date) => {
    if (!name || !points || !date) return;
    const docRef = await addDoc(collection(db, "children", activeChild, "penalties"), { name, points, date });
    const updated = [...penalties, { id: docRef.id, name, points, date }];
    setPenalties(updated);
    updateTotal(scores, updated, rewards);
  };

  const removePenalty = async (id) => {
    await deleteDoc(doc(db, "children", activeChild, "penalties", id));
    const updated = penalties.filter(p => p.id !== id);
    setPenalties(updated);
    updateTotal(scores, updated, rewards);
  };

  const addReward = async (name, points, date) => {
    if (!name || !points || !date) return;
    const docRef = await addDoc(collection(db, "children", activeChild, "rewards"), { name, points, date });
    const updated = [...rewards, { id: docRef.id, name, points, date }];
    setRewards(updated);
    updateTotal(scores, penalties, updated);
  };

  const removeReward = async (id) => {
    await deleteDoc(doc(db, "children", activeChild, "rewards", id));
    const updated = rewards.filter(r => r.id !== id);
    setRewards(updated);
    updateTotal(scores, penalties, updated);
  };

  const updateTotal = (taskScores, penaltiesArr, rewardsArr) => {
    let sum = Object.values(taskScores).reduce((acc, val) => acc + val, 0);
    sum += penaltiesArr.reduce((acc, p) => acc + parseInt(p.points), 0);
    sum += rewardsArr.reduce((acc, r) => acc + parseInt(r.points), 0);
    setTotalPoints(sum);
  };

  const renderTable = () => (
    <Table bordered className="text-center align-middle">
      <thead className="table-primary">
        <tr>
          <th>Obowiązek</th>
          {days.map(d => <th key={d}>{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {categories.map(cat => {
          const tasksCat = Object.values(weeklySchedule).flatMap(w => w.tasks?.[cat.toLowerCase().replace(" ","")] || []);
          return (
            <tbody key={cat}>
              <tr className="table-secondary">
                <td colSpan={days.length+1} className="fw-bold">{cat}</td>
              </tr>
              {tasksCat.map((task, i) => (
                <tr key={i}>
                  <td className="text-start">{task}</td>
                  {days.map(day => {
                    const id = `${cat}-${task}-${day}`;
                    return (
                      <td key={day}>
                        <Form.Select size="sm" value={scores[id] || 0} onChange={e => handleScoreChange(id, e.target.value)}>
                          {Array.from({length:7},(_,i)=>i-3).map(n=>(
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </Form.Select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          )
        })}
      </tbody>
    </Table>
  );

  const renderLegend = () => (
    <Accordion className="mb-4">
      <Accordion.Item eventKey="0">
        <Accordion.Header>📖 Legenda: system kar i nagród</Accordion.Header>
        <Accordion.Body>
          <ul>
            <li><b>Punkty zadania:</b> od -3 do +3</li>
            <li><b>Kary:</b> punkty ujemne</li>
            <li><b>Nagrody:</b> punkty dodatnie</li>
            <li><b>Całkowity wynik:</b> suma punktów zadań, kar i nagród</li>
          </ul>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );

  return (
    <>
      <NavbarWithSettings user={user} />

      <Container>
        <Tabs activeKey={activeChild} onSelect={k => setActiveChild(k)} className="mb-3">
          {children.map(c => (
            <Tab eventKey={c.id} title={c.name} key={c.id}>
              <h3 className="text-center mb-4">✅ Tygodniowa Checklista Obowiązków</h3>
              {renderLegend()}
              {renderTable()}

              <Row className="mt-5">
                <Col>
                  <h4>⚠️ Kary</h4>
                  <ListGroup>
                    {penalties.map(p => (
                      <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center flex-wrap">
                        <div>{p.name} | Punkty: <b>{p.points}</b> | Data: <b>{p.date}</b></div>
                        <Button size="sm" variant="outline-dark" onClick={()=>removePenalty(p.id)}>Usuń</Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  <Form className="mt-2" onSubmit={e=>{e.preventDefault(); addPenalty(e.target.name.value, parseInt(e.target.points.value), e.target.date.value); e.target.reset();}}>
                    <Row className="g-2">
                      <Col><Form.Control name="name" placeholder="Nazwa kary"/></Col>
                      <Col><Form.Control name="points" type="number" placeholder="Punkty ujemne" defaultValue={-1}/></Col>
                      <Col><Form.Control name="date" type="date"/></Col>
                      <Col><Button type="submit" variant="danger">Dodaj karę</Button></Col>
                    </Row>
                  </Form>
                </Col>

                <Col>
                  <h4>🏆 Nagrody</h4>
                  <ListGroup>
                    {rewards.map(r => (
                      <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center flex-wrap">
                        <div>{r.name} | Punkty: <b>{r.points}</b> | Data: <b>{r.date}</b></div>
                        <Button size="sm" variant="outline-dark" onClick={()=>removeReward(r.id)}>Usuń</Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  <Form className="mt-2" onSubmit={e=>{e.preventDefault(); addReward(e.target.name.value, parseInt(e.target.points.value), e.target.date.value); e.target.reset();}}>
                    <Row className="g-2">
                      <Col><Form.Control name="name" placeholder="Nazwa nagrody"/></Col>
                      <Col><Form.Control name="points" type="number" placeholder="Punkty dodatnie" defaultValue={1}/></Col>
                      <Col><Form.Control name="date" type="date"/></Col>
                      <Col><Button type="submit" variant="success">Dodaj nagrodę</Button></Col>
                    </Row>
                  </Form>
                </Col>
              </Row>

              <h3 className="mt-4 text-center">📊 Podsumowanie: {totalPoints} punktów</h3>
            </Tab>
          ))}
        </Tabs>
      </Container>
    </>
  );
}
