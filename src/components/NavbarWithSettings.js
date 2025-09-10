import { Navbar, Container, Nav, Dropdown } from "react-bootstrap";
import { GearFill } from "react-bootstrap-icons";

export default function NavbarWithSettings({ user, onShowCoupons, onLogout }) {
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand>familyScoring</Navbar.Brand>
        <Nav className="ms-auto d-flex align-items-center">
          <span className="me-3 text-white">{user?.email}</span>
          <Dropdown align="end">
            <Dropdown.Toggle variant="secondary" id="dropdown-settings">
              <GearFill />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={onShowCoupons}>Definiowanie bonów</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={onLogout}>Wyloguj się</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}
