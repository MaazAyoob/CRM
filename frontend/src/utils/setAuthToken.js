import axios from 'axios';

const setAuthToken = (token) => {
  if (token) {
    // If a token is provided, apply it to every request
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    // If there's no token, delete it from the defaults
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export default setAuthToken;