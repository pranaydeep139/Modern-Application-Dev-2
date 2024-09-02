export default {
    data() {
      return {
        productId: null,
        p_img: null,
        productData: {
            p_name: '',
            p_unit: '',
            p_cost: 0,
            manuf_date_year: null,
            manuf_date_month: null,
            manuf_date_day: null,
            usage_days: 0,
            quantity:0,
            selectedCategory: '',
            categories: []
        },
        resultMessage: '',
        user_role:''
      };
    },
    created() {
      this.productId = this.$route.params.productId;
      this.fetchProductData(this.productId);
      this.user_role = localStorage.getItem('user_role');
    },
    methods: {
        fetchProductData(productId) {
            const token = localStorage.getItem('token');
            if (token) {
              fetch(`http://127.0.0.1:5000/api/editpro/${productId}`, {
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
                this.productData = data;
              })
              .catch(error => {
                if (error.message === '404') {
                  this.resultMessage = 'Product not found';
                } else {
                  this.resultMessage = 'Failed to fetch product details';
                }
              });
            } else {
                this.resultMessage = 'Please log in to access protected content';
            }
          },
  
      updateProduct() {
        const productId = this.productId;
        const formData = new FormData();
        formData.append('p_cost', this.productData.p_cost);
        formData.append('usage_days', this.productData.usage_days);
        formData.append('quantity', this.productData.quantity);
        formData.append('selectedCategory', this.productData.selectedCategory);
        formData.append('p_img', this.p_img);
    
        fetch(`http://127.0.0.1:5000/api/editpro/${productId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        })
        .catch(error => {
          if (error.message === '404') {
            this.resultMessage = 'Product not found'
          } else {
            this.resultMessage = 'Failed to update product';
          }
        });
      },
      handleFileUpload(event) {
        this.p_img = event.target.files[0];
      }
    },
    template: `
    <div>
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
      <h2 style="margin-top: 20px; margin-bottom: 10px; font-size: 1.5em; color: #444;">Edit the Product {{ productData.p_name }}</h2>
      <div style="margin-bottom: 15px;">{{ resultMessage }}</div>
      <label style="display: block; margin-bottom: 5px;">Product Cost:</label>
      <input type="number" v-model="productData.p_cost" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-bottom: 10px;"><br>
      <label style="display: block; margin-bottom: 5px;">Usage Days:</label>
      <input type="number" v-model="productData.usage_days" step="1" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-bottom: 10px;"><br>
      <label style="display: block; margin-bottom: 5px;">Quantity:</label>
      <input type="number" v-model="productData.quantity" step="1" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-bottom: 10px;"><br>
      <label style="display: block; margin-bottom: 5px;">Category:</label>
      <select v-model="productData.selectedCategory" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; margin-bottom: 10px;">
        <option v-for="category in productData.categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select><br>
      <label style="display: block; margin-bottom: 5px;">Product Image:</label>
      <input type="file" @change="handleFileUpload" style="margin-bottom: 10px;"><br>
      <button @click="updateProduct" style="
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        background-color: #007bff;
        color: #fff;
      ">Update</button>
      <h4 style="margin-top: 15px;"><router-link :to="'/product/' + productId" style="text-decoration: none; color: #000;">Back to Product</router-link></h4>
    </div>
  </div>
    `
  };
  