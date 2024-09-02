export default {
    data() {
      return {
        c_name: '',
        c_desc: '',
        resultMessage: '',
        user_role: ''
      };
    },
    created() {
      this.user_role = localStorage.getItem('user_role');
    },
    methods: {
      createCategory() {
        const token = localStorage.getItem('token');
        if (token) {
          fetch('http://127.0.0.1:5000/api/createcat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                c_name: this.c_name,
                c_desc: this.c_desc
            })
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(response.status);
              }
              return response.json();
            })
            .then(data => {
              this.resultMessage = data.message;
              this.user_role= data.role;
              if (this.user_role=='admin'){
                window.location.href = '/admin'
              }
              if (this.user_role=='manager'){
                window.location.href = '/manager'
              }; 
            })
            .catch(error => {
              if (error.message === '409') {
                this.resultMessage = 'Category already exists'
              } else {
                this.resultMessage = 'Failed to create category';
                console.log('Error:', error);
              }
              ;
            });
        } else {
          this.resultMessage = 'Please log in to create a category';
        }
      }
    },
    template: `
    <div v-if="user_role === 'admin' || user_role === 'manager'" style="
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
    <h2 style="margin-bottom: 15px;">Create New Category</h2>
    <div style="margin-bottom: 20px;">{{ resultMessage }}</div>
    <label style="display: block; margin-bottom: 10px;">Category Name:</label>
    <input type="text" v-model="c_name" style="
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 100%;
      margin-bottom: 15px;
    " required><br>
    <label style="display: block; margin-bottom: 10px;">Category Description:</label>
    <textarea v-model="c_desc" style="
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 100%;
      margin-bottom: 20px;
    " required></textarea><br>
    <button @click="createCategory" style="
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: #007bff;
      color: #fff;
    ">Create</button>
  </div>
    `
  };
  