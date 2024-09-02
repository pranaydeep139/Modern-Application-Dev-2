export default {
  data() {
    return {
      protectedMessage: '',
      mUsers: [],
      c_len:0,
      user_role:'',
      user_name:'',
      products:[],
      exportInProgress: false
    };
  },
  methods: {
    fetchMUsers() {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://127.0.0.1:5000/api/admin', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status);
            }
            return response.json();
          })
          .then(data => {
            this.protectedMessage = data.message;
            this.mUsers = data.m_users;
            this.c_len=data.c_len;
            this.products=data.products;
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
    getImagePath(imageFileName) {
      return require(`../images/${imageFileName}`);
    },
    exportAsCSV() {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://127.0.0.1:5000/api/exportcsv', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(response.status);
          }
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const a = document.createElement('a');
          a.href = url;
          a.download = 'product_details.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setTimeout(() => {
            alert('Product details exported as CSV');
          }, 500);
        })
        .catch(error => {
          console.log(error);
          alert('Failed to export product details as CSV');
        });
      } else {
        alert('Please log in to access this functionality');
      }
    }
  },
  mounted() {
    this.fetchMUsers();
    this.user_role = localStorage.getItem('user_role');
    this.user_name = localStorage.getItem('user_name');

  },
  computed: {
    managerRequestsCount() {
      return this.mUsers.length;
    }
  },
  template: `
  <div>
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
      <h2 style="
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 1.5em;
        color: #444;
      ">Admin's Dashboard - Welcome, {{ user_name }}!</h2>
      <div style="margin-top: 10px; margin-bottom: 20px;">{{ protectedMessage }}</div>
      <h4><router-link to="/newcat" style="text-decoration: none; color: #000;">Create a new category</router-link></h4>
      <h4><router-link to="/newpro" style="text-decoration: none; color: #000;">Create a new product</router-link></h4>
      <h4><router-link :to="'/manreq'" style="text-decoration: none; color: #000;">Manager requests ({{ managerRequestsCount }})</router-link></h4>
      <h4><router-link to="/catreq" style="text-decoration: none; color: #000;">Category requests ({{ c_len }})</router-link></h4>
      <h4><router-link to="/search" style="text-decoration: none; color: #000;">Search for products</router-link></h4>
      <h4><router-link to="/catlist" style="text-decoration: none; color: #000;">View all categories</router-link></h4>
      <button @click="exportAsCSV" style="
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        background-color: red;
        color: #fff;
      ">Export Product Details as CSV</button>
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
    <div v-else style="
      font-family: Arial, sans-serif;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      text-align: center;
    ">
      <h3>This is admin exclusive content</h3>
    </div>
  </div>
  `
};

  