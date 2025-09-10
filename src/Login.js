import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        return setError("Twoje konto nie jest zweryfikowane. Sprawdź email, wysłaliśmy ponownie wiadomość weryfikacyjną.");
      }

      // callback do App.js
      onLogin(user);
    } catch (err) {
      console.error(err);
      setError(err.message || "Błąd podczas logowania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ maxWidth: "500px", marginTop: "50px" }}>
      <h2 className="mb-4 text-center">🔑 Logowanie rodzica</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Twój email"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Hasło</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Twoje hasło"
          />
        </Form.Group>

        <Button type="submit" className="w-100" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Zaloguj się"}
        </Button>
      </Form>

      <div className="mt-3 text-center">
        Nie masz konta? <Link to="/register">Zarejestruj się</Link>
      </div>
    </Container>
  );
}
