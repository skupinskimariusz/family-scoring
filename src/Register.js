import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import NewAccountConfirmation from "./NewAccountConfirmation";

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const validatePassword = (pwd) => {
    // Minimalna długość 8 znaków, co najmniej jedna cyfra i jedna litera
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(pwd);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return setError("Wszystkie pola są wymagane!");
    }

    if (password !== confirmPassword) {
      return setError("Hasła nie są takie same!");
    }

    if (!validatePassword(password)) {
      return setError("Hasło musi mieć min. 8 znaków, zawierać literę i cyfrę.");
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Zapis danych rodzica w Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
        childIds: []
      });

      // Wyślij mail weryfikacyjny
      await sendEmailVerification(newUser);

      setUser(newUser);
    } catch (err) {
      console.error(err);
      setError(err.message || "Błąd rejestracji");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    // Konto utworzone – przejdź do ekranu potwierdzenia email
    return <NewAccountConfirmation user={user} />;
  }

  return (
    <Container style={{ maxWidth: "500px", marginTop: "50px" }}>
      <h2 className="mb-4 text-center">📝 Rejestracja rodzica</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleRegister} className="d-flex flex-column gap-3">
        <Form.Group>
          <Form.Label>Imię</Form.Label>
          <Form.Control value={firstName} onChange={e=>setFirstName(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Nazwisko</Form.Label>
          <Form.Control value={lastName} onChange={e=>setLastName(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Hasło</Form.Label>
          <Form.Control type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Powtórz hasło</Form.Label>
          <Form.Control type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
        </Form.Group>

        <Button type="submit" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Zarejestruj"}
        </Button>

        <div className="text-center mt-2">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </div>
      </Form>
    </Container>
  );
}
