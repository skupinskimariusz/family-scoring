import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase";
import Login from "./Login";
import Register from "./Register";
import NewAccountConfirmation from "./NewAccountConfirmation";
import ChildWizard from "./ChildWizard";
import ParentDashboard from "./ParentDashboard";
import Coupons from "./Coupons";
import NavbarWithSettings from "./NavbarWithSettings";
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
        // Pobieramy flagę czy rodzic skonfigurował dzieci
        const userDoc = await db.collection("users").doc(u.uid).get();
        if (userDoc.exists()) {
          const childIds = userDoc.data().childIds || [];
          setSetupDone(childIds.length > 0);
        }
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
      <NavbarWithSettings user={user} />
      <Routes>
        {!user && (
          <>
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confirm" element={<NewAccountConfirmation />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}

        {user && !setupDone && (
          <>
            <Route
              path="/wizard"
              element={<ChildWizard parentId={user.uid} onFinish={() => setSetupDone(true)} />}
            />
            <Route path="*" element={<Navigate to="/wizard" />} />
          </>
        )}

        {user && setupDone && (
          <>
            <Route path="/dashboard" element={<ParentDashboard />} />
            <Route path="/coupons" element={<Coupons parentId={user.uid} />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
