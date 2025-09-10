import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Container, Tab, Tabs, Table, Form, Row, Col, ListGroup, Accordion } from "react-bootstrap";
import NavbarWithSettings from "./components/NavbarWithSettings";
import Coupons from "./Coupons";

const days = ["Pon","Wt","Śr","Czw","Pt","Sob","Nd"];
const categories = ["Poranek","Po szkole","Wieczór"];

export default function ParentDashboard({ user }) {
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [penalties, setPenalties] = useState([]);
  const [rewards, setRewards] = useState([]);

  const [showCoupons, setShowCoupons] = useState(false);

  const handleShowCoupons = () => setShowCoupons(true);
  const handleCloseCoupons = () => setShowCoupons(false);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload();
  };

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
    const fetchSchedule = async () => {
      const snapshot = await getDocs(collection(db, "children", activeChild, "weeklySchedule"));
      const schedule = {};
      snapshot.forEach(doc => {
        schedule[doc.id] = doc.data();
      });
      setWeeklySchedule(schedule);
      setPenalties([]);
      setRewards([]);
    };
    fetchSchedule();
  }, [activeChild]);

  const handleScoreChange = (taskKey, value) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [taskKey]: {
        ...prev[taskKey],
        score: parseInt(value)
      }
    }));
  };

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
            <>
              <tr className="table-secondary">
                <td colSpan={days.length+1} className="fw-bold">{cat}</td>
              </tr>
              {tasksCat.map((task, i) => (
                <tr key={i}>
                  <td className="text-start">{task}</td>
                  {days.map(day => (
                    <td key={day}>
                      <Form.Select size="sm" value={0} onChange={e => handleScoreChange(`${cat}-${task}-${day}`, e.target.value)}>
                        {Array.from({length:7},(_,i)=>i-3).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Form.Select>
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )
        })}
      </tbody>
    </Table>
  );

  return (
    <>
      <NavbarWithSettings 
        user={user} 
        onShowCoupons={handleShowCoupons} 
        onLogout={handleLogout} 
      />

      <Container className="mt-3">
        {showCoupons ? (
          <Coupons parentId={user.uid} onClose={handleCloseCoupons} />
        ) : (
          <Tabs activeKey={activeChild} onSelect={k => setActiveChild(k)} className="mb-3">
            {children.map(c => (
              <Tab eventKey={c.id} title={c.name} key={c.id}>
                <h3 className="text-center mb-4">✅ Tygodniowa Checklista Obowiązków - {c.age} lat</h3>
                {renderLegend()}
                {renderTable()}

                <Row className="mt-5">
                  <Col>
                    <h4>⚠️ Kary</h4>
                    <ListGroup>
                      {penalties.map((p,i)=><ListGroup.Item key={i}>{p.name} | {p.points} | {p.date}</ListGroup.Item>)}
                    </ListGroup>
                  </Col>
                  <Col>
                    <h4>🏆 Nagrody</h4>
                    <ListGroup>
                      {rewards.map((r,i)=><ListGroup.Item key={i}>{r.name} | {r.points} | {r.date}</ListGroup.Item>)}
                    </ListGroup>
                  </Col>
                </Row>

                <h5 className="mt-4">📊 Podsumowanie: <span>0</span> punktów</h5>
              </Tab>
            ))}
          </Tabs>
        )}
      </Container>
    </>
  );
}
