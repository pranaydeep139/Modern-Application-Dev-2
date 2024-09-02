export default {
    data() {
      return {
        p_name: '',
        p_unit: '',
        p_cost: 0,
        p_img: null,
        manuf_date_day: null,
        manuf_date_month: null,
        manuf_date_year: null,
        usage_days: 0,
        quantity: 0,
        selectedCategory: '',
        categories: [], 
        resultMessage: '',
        user_role:''
      };
    },
    created() {
      this.fetchCategories();
      this.user_role = localStorage.getItem('user_role');
    },
    methods: {
      createProduct() {
        const token = localStorage.getItem('token');
        if (token) {
          
          const formData = new FormData();
          formData.append('p_name', this.p_name);
          formData.append('p_unit', this.p_unit);
          formData.append('p_cost', this.p_cost);
          formData.append('p_img', this.p_img);
          formData.append('quantity', this.quantity);
          formData.append('manuf_date_year', this.manuf_date_year);
          formData.append('manuf_date_month', this.manuf_date_month);
          formData.append('manuf_date_day', this.manuf_date_day);
          formData.append('usage_days', this.usage_days);
          formData.append('selectedCategory', this.selectedCategory);
  
          fetch('http://127.0.0.1:5000/api/createpro', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status);
            }
            return response.json();
          })
          .then(data => {
            this.resultMessage = data.message;
            this.p_name= '',
            this.p_unit= '',
            this.p_cost= 0,
            this.p_img= null,
            this.quanitity= 0,
            this.manuf_date_day= null,
            this.manuf_date_month= null,
            this.manuf_date_year= null,
            this.usage_days= 0,
            this.quantity=0,
            this.selectedCategory= ''
            this.fetchCategories();
          })
          .catch(error => {
            if (error.message === '409') {
              this.resultMessage = 'Product already exists'
            } else {
              this.resultMessage = 'Failed to create product';
              console.log(error);
            }
          });
        } else {
          this.resultMessage = 'Please log in to create a product';
        }
      },
      handleFileUpload(event) {
        this.p_img = event.target.files[0];
      },
      fetchCategories() {
        fetch('http://127.0.0.1:5000/api/createpro', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.categories = data.categories;
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
          this.resultMessage = 'Failed to fetch categories';
        });
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

  <h2 style="margin-bottom: 20px;">Create New Product</h2>
  <div>{{ resultMessage }}</div>

  <form style="display: flex; flex-direction: column; gap: 10px;">
    <label style="display: flex; align-items: center;">
      Product Name:
      <input type="text" v-model="p_name" required style="margin-left: 10px;">
    </label>
    
    <label style="display: flex; align-items: center;">
      Product Unit:
      <input type="text" v-model="p_unit" required style="margin-left: 10px;">
    </label>
    
    <label style="display: flex; align-items: center;">
      Product Cost:
      <input type="number" v-model="p_cost" required style="margin-left: 10px;">
    </label>
    
    <div style="display: flex; gap: 10px;">
      <label style="display: flex; align-items: center;">
        Manufacture Date:
        <input type="number" v-model="manuf_date_day" placeholder="Day" required min="1" max="31" step="1" style="margin-left: 10px;">
        <input type="number" v-model="manuf_date_month" placeholder="Month" required min="1" max="12" step="1">
        <input type="number" v-model="manuf_date_year" placeholder="Year" required step="1">
      </label>
      
      <label style="display: flex; align-items: center;">
        Usage Days:
        <input type="number" v-model="usage_days" required step="1" style="margin-left: 10px;">
      </label>
    </div>

    <label style="display: flex; align-items: center;">
      Quantity:
      <input type="number" v-model="quantity" required step="1" style="margin-left: 10px;">
    </label>
    
    <label style="display: flex; align-items: center;">
      Category:
      <select v-model="selectedCategory" required style="margin-left: 10px;">
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </label>
    
    <label style="display: flex; align-items: center;">
      Product Image:
      <input type="file" @change="handleFileUpload" required style="margin-left: 10px;">
    </label>
    
    <button @click="createProduct" style="
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: #007bff;
      color: #fff;
      align-self: flex-start;
      width: 120px;
    ">Create</button>
  </form>
</div>
    `
  };
  