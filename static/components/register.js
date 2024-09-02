export default {
  data() {
    return {
      username: '',
      password: '',
      message: '',
      role: 'customer',
      approved:1
    };
  },
  methods: {
    registerUser() {
      if (document.getElementById('managerCheckbox').checked) {
        this.role = 'manager';
        this.approved = 0
      }
      fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          role: this.role,
          approved: this.approved
        })
      })
        .then(response => {
          if (!response.ok) {
            
            throw new Error(response.status); 
          }
          return response.json();
        })
        .then(data => {
          this.message = data.message;
          this.username = '';
          this.password = '';
          window.location.href = '/login';
        })
        .catch(error => {
          console.error('There was a problem with the registration:', error);
          if (error.message === '409') {
            this.message = 'Username already exists';
          } else if (error.message === '400') {
            this.message = 'Username and password are required';
          } else {
            this.message = 'Failed to register user';
            console.log(error);
          }
        });
    }
  },
  template: `
  <div style="
  font-family: Arial, sans-serif;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
">
  <h2>Welcome to the Web Grocery Store!</h2>
  <h3>Sign up here:</h3>
  <label for="username" style="display: block; margin-bottom: 5px;">Username</label>
  <input type="text" id="username" placeholder="username" v-model="username" required style="margin-bottom: 10px; padding: 8px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
  <label for="password" style="display: block; margin-bottom: 5px;">Password</label>
  <input type="password" id="password" v-model="password" required style="margin-bottom: 10px; padding: 8px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
  <label for="managerCheckbox" style="display: block; margin-bottom: 10px;">
    <input type="checkbox" id="managerCheckbox" style="vertical-align: middle; margin-right: 5px;"> Register as a manager
  </label>
  <button @click='registerUser' style="padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; background-color: #007bff; color: #fff; margin-bottom: 10px;">Register</button>
  <h4 style="margin-bottom: 5px;"><router-link to="/login" style="text-decoration: none; color: #000;">Already registered? Login here</router-link></h4>
  <div>{{ message }}</div>
  </div>
  `
};



  
  