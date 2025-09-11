import React from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

export default function NavbarWithSettings({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Błąd przy wylogowaniu:", err);
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
          FamilyPlanner
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {user ? (
              <>
                <Nav.Link onClick={() => navigate("/dashboard")}>Dashboard</Nav.Link>
                <Nav.Link onClick={() => navigate("/coupons")}>Bony</Nav.Link>
                <NavDropdown title={user.displayName || user.email} id="user-dropdown">
                  <NavDropdown.Item onClick={handleLogout}>Wyloguj</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link onClick={() => navigate("/login")}>Login</Nav.Link>
                <Nav.Link onClick={() => navigate("/register")}>Rejestracja</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
