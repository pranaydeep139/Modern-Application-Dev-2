export default {
    data() {
      return {
        username: '',
        password: '',
        message: ''
      };
    },
    methods: {
      loginUser() {
        fetch('http://127.0.0.1:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status);
            }
            return response.json();
          })
          .then(data => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_role', data.role);
            localStorage.setItem('user_name', data.name);
            this.message = 'Login successful';
            if (data.role=='admin'){
              window.location.href = '/admin'
            }
            if (data.role=='manager'){
              window.location.href = '/manager'
            }
            if (data.role=='customer'){
              window.location.href = '/customer'
            }
            ;
          })
          .catch(error => {
            console.error('There was a problem with the login:', error);
            if (error.message === '401') {
              this.message = 'Invalid credentials';
            } else if (error.message === '402') {
              this.message = 'Your request is yet to be approved';
            } else {
              this.message = 'Failed to login';
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
    <h3>Login here:</h3>
    <label for="username" style="display: block; margin-bottom: 5px;">Username</label>
    <input type="text" id="username" placeholder="Username" v-model="username" style="margin-bottom: 10px; padding: 8px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
    <label for="password" style="display: block; margin-bottom: 5px;">Password</label>
    <input type="password" id="password" v-model="password" style="margin-bottom: 10px; padding: 8px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
    <button @click="loginUser" style="padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; background-color: #007bff; color: #fff; margin-bottom: 10px;">Login</button>
    <h4 style="margin-top: 15px;"><router-link to="/register" style="text-decoration: none; color: #000;">Don't have an account? Register here</router-link></h4>
    <div style="margin-top: 15px;">{{ message }}</div>
  </div>
    `
  };
  
