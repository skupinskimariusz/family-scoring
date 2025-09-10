import { useState, useEffect } from "react";
import { auth } from "./firebase";
import Login from "./Login";
import ChildWizard from "./ChildWizard";
import { Container, Spinner } from "react-bootstrap";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
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

  return <ChildWizard parentId={user.uid} />;
}

export default App;
