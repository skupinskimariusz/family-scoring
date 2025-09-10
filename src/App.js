import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase";
import Login from "./Login";
import Register from "./Register";
import ChildWizard from "./ChildWizard";
import ParentDashboard from "./ParentDashboard";
import Coupons from "./Coupons";
import NewAccountConfirmation from "./NewAccountConfirmation";
import { Container, Spinner } from "react-bootstrap";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Pobierz flagę z Firestore: czy rodzic zakończył konfigurację dzieci
        const userDoc = await db.collection("users").doc(u.uid).get();
        setSetupDone(userDoc.exists && userDoc.data().setupDone);
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

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/confirmation" element={<NewAccountConfirmation />} />

        {/* Chronione routingi */}
        <Route
          path="/"
          element={
            user ? (setupDone ? <ParentDashboard user={user} /> : <ChildWizard parentId={user.uid} onFinish={() => setSetupDone(true)} />)
                 : <Navigate to="/login" />
          }
        />
        <Route path="/coupons" element={user ? <Coupons user={user} /> : <Navigate to="/login" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
