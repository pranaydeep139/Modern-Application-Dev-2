export default {
    data() {
      return {
        protectedMessage: '',
        products: [],
        user_role: '',
        user_name:''
      };
    },
    mounted() {
      this.user_role = localStorage.getItem('user_role');
      this.user_name = localStorage.getItem('user_name');
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://127.0.0.1:5000/api/customer', {
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
            this.products = data;
          })
          .catch(error => {
            console.error('Error fetching products:', error);
          });
      }
    },
    methods: {
      getImagePath(imageFileName) {
        return require(`../images/${imageFileName}`);
      }
    },
    template: `
    <div>
    <div v-if="user_role === 'customer'" style="
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
      <h2 style="margin-top: 20px; margin-bottom: 10px; font-size: 1.5em; color: #444;">It's awesome to see you, {{ user_name }}</h2>
      <div style="margin-bottom: 15px;">{{ protectedMessage }}</div>
      <h4><router-link to="/search" style="text-decoration: none; color: #000;">Search for products</router-link></h4>
      <h4><router-link to="/catlist" style="text-decoration: none; color: #000;">View all categories</router-link></h4>
      <h2 style="margin-top: 20px;">Newly added products:</h2>
      <div v-for="product in products" :key="product.p_id" style="
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 15px;
      ">
        <h3>{{ product.p_name }}</h3>
        <img :src="getImagePath(product.p_img)" :alt="product.p_name" style="max-width: 100%;">
        <p>Cost: {{ product.p_cost }} per {{ product.p_unit }}</p>
        <router-link :to="'/product/' + product.p_id" style="text-decoration: none; color: #007bff;">View Product</router-link>
      </div>
    </div>
  </div>
    `
  };
  