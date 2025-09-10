import { useState } from "react";
import { auth, sendEmailVerification } from "./firebase";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NewAccountConfirmation({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        setMessage("📧 Wiadomość weryfikacyjna została wysłana ponownie. Sprawdź skrzynkę odbiorczą.");
      } else {
        setError("Nie można wysłać weryfikacji – konto jest już zweryfikowane lub brak użytkownika.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Błąd podczas wysyłania maila weryfikacyjnego");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ maxWidth: "500px", marginTop: "50px" }}>
      <h2 className="mb-4 text-center">✅ Konto utworzone</h2>
      <p className="text-center">
        Konto zostało utworzone. Aby móc korzystać z aplikacji, potwierdź swój email klikając link w wiadomości, którą otrzymałeś.
      </p>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex flex-column gap-2">
        <Button onClick={handleResend} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Wyślij ponownie mail weryfikacyjny"}
        </Button>
        <Link to="/login" className="btn btn-outline-primary text-center">Przejdź do logowania</Link>
      </div>
    </Container>
  );
}
