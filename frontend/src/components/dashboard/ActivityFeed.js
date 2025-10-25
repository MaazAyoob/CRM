import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ListGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import setAuthToken from '../../utils/setAuthToken';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to fetch activities - wrapped in useCallback
  const fetchActivities = useCallback(async () => {
    if (activities.length === 0) setLoading(true);
    setError('');
    setAuthToken(localStorage.getItem('token'));
    try {
      const res = await axios.get('/api/activities');
      setActivities(res.data);
    } catch (err) {
      setError('Failed to load activity feed. Check backend connection.');
      console.error("Activity Feed Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [activities.length]); // Dependency: re-run if activities.length changes

  useEffect(() => {
    fetchActivities(); // Fetch on component mount

    const intervalId = setInterval(fetchActivities, 60000); // Refresh every 60 seconds

    return () => clearInterval(intervalId); // Cleanup interval

  }, [fetchActivities]); // ADDED fetchActivities to dependency array

  // Helper to render activity details more readably
  const renderActivityDetails = (activity) => {
    const userName = activity.user?.name || 'System User'; // Use optional chaining
    const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
    const details = activity.details || {}; // Ensure details is an object

    // Define badge colors based on action type category
    let badgeBg = 'secondary';
    if (activity.actionType?.includes('create')) badgeBg = 'success';
    else if (activity.actionType?.includes('update')) badgeBg = 'info';
    else if (activity.actionType?.includes('delete')) badgeBg = 'danger';
    else if (activity.actionType?.includes('complete')) badgeBg = 'primary';
    
    let message = `performed action: ${activity.actionType}.`; // Default message

    // Customize messages based on actionType
    switch (activity.actionType) {
      case 'created_contact':
        message = `added contact "${details.name || 'N/A'}".`;
        break;
      case 'updated_contact':
         if (details.changed) {
             message = `updated ${details.changed} for "${details.name || 'contact'}" from "${details.from || '-'}" to "${details.to || '-'}".`;
         } else {
            message = `updated contact "${details.name || 'N/A'}".`;
         }
         break;
      case 'deleted_contact':
        message = `deleted contact "${details.name || 'N/A'}".`;
        break;
      case 'created_deal':
         message = `created deal "${details.name || 'N/A'}" ($${(details.value || 0).toLocaleString()}).`;
         break;
      case 'updated_deal_stage':
        message = `moved deal "${details.name || 'N/A'}" to ${details.to || 'a new stage'}.`;
        break;
      case 'created_appointment': // NEW CASE for Appointment
         message = `scheduled appointment: "${details.title || 'N/A'}" with ${details.contactName || 'contact'}.`;
         break;
      // Add more cases for other actions (tasks, users, teams) here
      case 'completed_task':
        message = `completed task: "${details.content || 'N/A'}".`;
        break;
      case 'created_task':
        message = `created task: "${details.content || 'N/A'}".`;
        break;
      case 'added_team_member':
        message = `added user "${details.userName || 'N/A'}" to team "${details.teamName || 'N/A'}".`;
         break;
      case 'removed_team_member':
         message = `removed user "${details.userName || 'N/A'}" from team "${details.teamName || 'N/A'}".`;
         break;
    }

    return (
        <div className="d-flex flex-column align-items-start">
            <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                <span className="fw-bold text-truncate me-2" style={{fontSize: '0.9rem'}}>
                    <Badge bg={badgeBg} className='me-2'>{activity.relatedModel || 'General'}</Badge>
                    {userName}
                </span>
                <small className="text-muted text-nowrap" style={{fontSize: '0.75rem'}}>{timeAgo}</small>
            </div>
            <p className="mb-0 ms-1" style={{fontSize: '0.8rem'}}>
                {message}
            </p>
        </div>
    );
  };


  if (loading && activities.length === 0) {
      return <div className="text-center p-3"><Spinner animation="border" size="sm" /> Loading Feed...</div>;
  }
  if (error) {
      return <Alert variant="warning" className="m-2">{error}</Alert>;
  }


  return (
    // Make the ListGroup scrollable
    <ListGroup variant="flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {activities.length > 0 ? activities.map(activity => (
        <ListGroup.Item key={activity._id} className="px-3 py-2">
            {renderActivityDetails(activity)}
        </ListGroup.Item>
      )) : (
        <ListGroup.Item className="text-muted text-center">No recent activity logged.</ListGroup.Item>
      )}
    </ListGroup>
  );
};

export default ActivityFeed;