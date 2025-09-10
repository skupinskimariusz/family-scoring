import { useState, useEffect } from "react";
import { auth } from "./firebase";
import Login from "./Login";
import ChildWizard from "./ChildWizard";
import ParentDashboard from "./ParentDashboard";
import { Container, Spinner } from "react-bootstrap";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupDone, setSetupDone] = useState(false); // czy zakończono ChildWizard

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
      if (u) {
        // tu można pobrać flagę z Firestore: czy rodzic już skonfigurował dzieci
        // dla uproszczenia zakładamy false i ustawiamy po ChildWizard
        setSetupDone(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  if (!setupDone) return <ChildWizard parentId={user.uid} onFinish={() => setSetupDone(true)} />;

  return <ParentDashboard />;
}

export default App;
