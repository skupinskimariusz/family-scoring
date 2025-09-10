import { Navbar, Container, Nav, Dropdown } from "react-bootstrap";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

export default function NavBarWithSettings({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand href="/">familyScoring</Navbar.Brand>
        <Nav className="ms-auto">
          {user ? (
            <Dropdown align="end">
              <Dropdown.Toggle variant="secondary" id="dropdown-settings">
                {user.email} ⚙️
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => navigate("/coupons")}>
                  Definiowanie bonów
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>Wyloguj</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <>
              <Nav.Link onClick={() => navigate("/login")}>Zaloguj się</Nav.Link>
              <Nav.Link onClick={() => navigate("/register")}>Rejestracja</Nav.Link>
            </>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}
