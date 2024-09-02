export default {
    data() {
        return {
            protectedMessage:'',
            resultMessage:'',
            mUsers: [],
            user_role: ''
        };
    },
    methods: {
        approveUser(mUser) {
            const token = localStorage.getItem('token');
            if (token) {
              fetch('http://127.0.0.1:5000/api/manreq', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ m_user: mUser, approve: true })
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(response.status);
                  }
                  return response.json();
                })
                .then(data => {
                  this.resultMessage = data.message1;
                  this.fetchMUsers();
                })
                .catch(error => {
                    if (error.message === '403') {
                      this.protectedMessage = 'Access denied! Admin privileges required';
                    } else if (error.message === '404') {
                      this.protectedMessage = 'User not found in manager requests';
                    } else {
                      console.error('Error fetching protected data:', error);
                      this.protectedMessage = 'Failed to fetch protected data';
                    }
                  });
              }
            else {
                this.protectedMessage = 'Please log in to view protected content';
            }
          },
          deleteUser(mUser) {
            const token = localStorage.getItem('token');
            if (token) {
              fetch('http://127.0.0.1:5000/api/manreq', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ m_user: mUser, delete: true })
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(response.status);
                  }
                  return response.json();
                })
                .then(data => {
                  this.resultMessage = data.message2;
                  this.fetchMUsers();
                })
                .catch(error => {
                    if (error.message === '403') {
                      this.protectedMessage = 'Access denied! Admin privileges required';
                    } else {
                      console.error('Error fetching protected data:', error);
                      this.protectedMessage = 'Failed to fetch protected data';
                    }
                  });
              } else {
                this.protectedMessage = 'Please log in to view protected content';
            }
          },
          fetchMUsers() {
            const token = localStorage.getItem('token');
            if (token) {
              fetch('http://127.0.0.1:5000/api/manreq', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(response.status);
                  }
                  return response.json();
                })
                .then(data => {
                  this.mUsers = data.m_users;
                  this.user_role = data.user_role;
                })
                .catch(error => {
                    if (error.message === '403') {
                      this.protectedMessage = 'Access denied! Admin privileges required';
                    } else {
                      console.error('Error fetching protected data:', error);
                      this.protectedMessage = 'Failed to fetch protected data';
                    }
                  });
              } else {
                this.protectedMessage = 'Please log in to view protected content';
            }
          },
    },
    mounted() {
        this.fetchMUsers();
    },
    template: `
    <div v-if="user_role === 'admin'" style="
    font-family: Arial, sans-serif;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  ">
    <nav>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li v-if="user_role === 'customer'" style="display: inline-block; margin-right: 15px;">
          <router-link to="/customer" style="text-decoration: none; color: #555;">Dashboard</router-link>
        </li>
        <li v-if="user_role === 'admin'" style="display: inline-block; margin-right: 15px;">
          <router-link to="/admin" style="text-decoration: none; color: #555;">Dashboard</router-link>
        </li>
        <li v-if="user_role === 'manager'" style="display: inline-block; margin-right: 15px;">
          <router-link to="/manager" style="text-decoration: none; color: #555;">Dashboard</router-link>
        </li>
        <li v-if="user_role === 'customer'" style="display: inline-block; margin-right: 15px;">
          <router-link to="/cart" style="text-decoration: none; color: #555;">Cart</router-link>
        </li>
        <li style="display: inline-block;">
          <router-link to="/logout" style="text-decoration: none; color: #555;">Logout</router-link>
        </li>
      </ul>
    </nav>
    <div style="margin-top: 20px; font-style: italic; color: #777;">{{ protectedMessage }}</div>
    <h2 style="margin-top: 20px; margin-bottom: 10px; font-size: 1.5em; color: #444;">Manager approval requests</h2>
    <ul style="padding: 0; margin: 0;">
      <li v-for="mUser in mUsers" :key="mUser" style="
        list-style: none;
        margin-bottom: 10px;
        padding: 10px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        {{ mUser }}
        <button @click="approveUser(mUser)" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">Approve</button>
        <button @click="deleteUser(mUser)" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Delete</button>
      </li>
    </ul>
    <div style="margin-top: 20px; font-style: italic; color: #777;">{{ resultMessage }}</div>
  </div>
    `
}