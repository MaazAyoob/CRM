import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// Import Bootstrap components used in layouts
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

// --- Import Page & Auth Components ---
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Contacts from './components/contacts/Contacts';
import DashboardStats from './components/dashboard/DashboardStats'; // Main dashboard content

// --- Import Admin & Report Components ---
import AdminDashboard from './components/admin/AdminDashboard'; 
import MyPerformance from './components/performance/MyPerformance';
import TeamPerformance from './components/performance/TeamPerformance';
import ReportsPage from './components/reports/ReportsPage'; 

// --- Import Routing Components & Utilities ---
import PrivateRoute from './components/routing/PrivateRoute'; 
import AdminRoute from './components/routing/AdminRoute'; 
import useAuth from './utils/useAuth'; // <-- NEW: Hook to check user role

// --- Logout Handler ---
// Removes token from local storage and redirects to login
const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// --- Reusable Navigation Bar (Conditionally Renders Admin Links) ---
const AppNavbar = () => {
  // Use the custom hook to get the role
  const { userRole } = useAuth();
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand href="/">
          <i className="bi bi-buildings-fill me-2"></i>
          Real Estate CRM
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Standard User Links (always visible if logged in) */}
            <Nav.Link href="/">Dashboard</Nav.Link>
            <Nav.Link href="/contacts">Contacts</Nav.Link>
            <Nav.Link href="/my-performance">My Performance</Nav.Link>
            
            {/* --- CONDITIONAL ADMIN LINKS: Only visible if userRole is 'admin' --- */}
            {userRole === 'admin' && (
              <>
                <Nav.Link href="/admin">Admin</Nav.Link>
                <Nav.Link href="/team-performance">Team Performance</Nav.Link>
                <Nav.Link href="/reports">Reports</Nav.Link>
              </>
            )}
            {/* ------------------------------------------------------------------- */}
            
          </Nav>
          <Nav>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

// --- Page Layout Components ---
// These wrap the main content components with the Navbar and Container

const DashboardPage = () => (
  <div>
    <AppNavbar />
    <Container fluid className="mt-4">
      <DashboardStats />
    </Container>
  </div>
);

const ContactsPage = () => (
  <div>
    <AppNavbar />
    <Container fluid className="mt-4">
      <Contacts />
    </Container>
  </div>
);

const AdminPage = () => (
  <div>
    <AppNavbar />
    <AdminDashboard />
  </div>
);

const MyPerformancePage = () => (
  <div>
    <AppNavbar />
    <MyPerformance />
  </div>
);

const TeamPerformancePage = () => (
  <div>
    <AppNavbar />
    <TeamPerformance />
  </div>
);

const ReportsLayout = () => (
  <div>
    <AppNavbar />
    <ReportsPage />
  </div>
);


// --- Main App Router ---
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>

          {/* --- Public Routes --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- Private User Routes --- */}
          <Route
            path="/" 
            element={<PrivateRoute><DashboardPage /></PrivateRoute>}
          />
          <Route
            path="/contacts" 
            element={<PrivateRoute><ContactsPage /></PrivateRoute>}
          />
           <Route
            path="/my-performance" 
            element={<PrivateRoute><MyPerformancePage /></PrivateRoute>}
          />

          {/* --- Private Admin Routes (AdminRoute handles role check) --- */}
          <Route
            path="/admin" 
            element={<AdminRoute><AdminPage /></AdminRoute>}
          />
          <Route
            path="/team-performance" 
            element={<AdminRoute><TeamPerformancePage /></AdminRoute>}
          />
           <Route
            path="/reports" 
            element={<AdminRoute><ReportsLayout /></AdminRoute>}
          />

          {/* --- Fallback Redirect --- */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </div>
    </Router>
  );
}

// Export the main App component
export default App;