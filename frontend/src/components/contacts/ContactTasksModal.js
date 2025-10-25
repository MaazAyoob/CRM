import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, ListGroup, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';

const ContactTasksModal = ({ show, handleClose, contact }) => {
  const [tasks, setTasks] = useState([]);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    if (!contact?._id) return;
    setLoading(true);
    setAuthToken(localStorage.getItem('token'));
    try {
      const res = await axios.get(`/api/tasks/${contact._id}`);
      setTasks(res.data);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // When the modal opens (i.e., 'show' or 'contact' changes), fetch tasks
  useEffect(() => {
    if (show) {
      fetchTasks();
    }
  }, [show, contact]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskContent) return;
    
    try {
      const res = await axios.post(`/api/tasks/${contact._id}`, { content: newTaskContent });
      setTasks([res.data, ...tasks]); // Add new task to top of list
      setNewTaskContent(''); // Clear input
    } catch (err) {
      setError('Failed to add task');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedTask = { ...task, isCompleted: !task.isCompleted };
      await axios.put(`/api/tasks/${task._id}`, updatedTask);
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Tasks for {contact?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {/* Form to Add New Task */}
        <Form onSubmit={handleAddTask}>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Add a new task..."
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
            />
            <Button variant="primary" type="submit">Add Task</Button>
          </InputGroup>
        </Form>
        
        <hr />

        {/* List of Tasks */}
        {loading ? (
          <Spinner animation="border" />
        ) : (
          <ListGroup>
            {tasks.length > 0 ? tasks.map(task => (
              <ListGroup.Item key={task._id} as="div" className="d-flex justify-content-between align-items-center">
                <Form.Check
                  type="checkbox"
                  label={task.content}
                  checked={task.isCompleted}
                  onChange={() => handleToggleComplete(task)}
                  style={{ textDecoration: task.isCompleted ? 'line-through' : 'none' }}
                />
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTask(task._id)}>
                  &times;
                </Button>
              </ListGroup.Item>
            )) : <p>No tasks for this contact yet.</p>}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ContactTasksModal;