export default {
    data() {
      return {
        categories: [],
        user_role: ''
      };
    },
    created() {
      this.fetchCategoryList();
      this.user_role =  localStorage.getItem('user_role');
    },
    methods: {
      fetchCategoryList() {
        fetch('http://127.0.0.1:5000/api/categories', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.categories = data;
        })
        .catch(error => {
          console.error('Error fetching category list:', error);
        });
      }
    },
    template: `
    <template>
    <div>
      <div style="
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
        <h2 style="margin-top: 20px; margin-bottom: 10px; font-size: 1.5em; color: #444;">Category List</h2>
        <ul style="list-style: none; padding: 0;">
          <li v-for="category in categories" :key="category.c_id" style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin-bottom: 10px;">
            <h4 style="margin-bottom: 5px;">
              <router-link :to="'/category/' + category.c_id" style="text-decoration: none; color: #007bff;">
                {{ category.c_name }} - {{ category.c_desc }}
              </router-link>
            </h4>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
    `
  };
  