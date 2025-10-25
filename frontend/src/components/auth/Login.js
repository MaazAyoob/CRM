import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- ADD THESE IMPORTS ---
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
// We'll also use Alert for better error messages
// -------------------------

import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // --- ADD THIS STATE FOR ERRORS ---
  const [error, setError] = useState(''); // To show errors in the Alert

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any old errors

    const user = {
      email,
      password,
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const body = JSON.stringify(user);
      const res = await axios.post('/api/auth/login', body, config);
      localStorage.setItem('token', res.data.token);
      
      // We don't need the alert anymore
      window.location.href = '/'; 

    } catch (err) {
      console.error(err.response.data);
      // Set the error to our new state
      setError(err.response.data.msg || 'An error occurred');
    }
  };

  return (
    // <Container> centers your content and adds padding
    <Container className="mt-5">
      <Row>
        {/* This centers the form in a 6-column grid on medium screens */}
        <Col md={{ span: 6, offset: 3 }}>
          <h2 className="text-center mb-4">Login</h2>
          
          {/* Replaced <form> with <Form> */}
          <Form onSubmit={onSubmit}>
            
            {/* --- SHOW THE ERROR HERE --- */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* <Form.Group> adds spacing and labels */}
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                required
              />
            </Form.Group>

            <div className="d-grid gap-2">
              {/* Replaced <input> with <Button> */}
              <Button variant="primary" type="submit" size="lg">
                Login
              </Button>
            </div>
          </Form>
          
          <p className="mt-3 text-center">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;