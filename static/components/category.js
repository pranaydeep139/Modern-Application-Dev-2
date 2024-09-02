export default {
    data() {
      return {
        categoryDetails: {
          c_name: '',
          c_desc: '',
          u_role:'',
          products: []
        },
        categoryId: null,
        resultMessage:'',
        user_role:''
      };
    },
    created() {
      this.user_role =  localStorage.getItem('user_role');
      this.categoryId = this.$route.params.categoryId;
      this.fetchCategoryDetails();
    },
    methods: {
      fetchCategoryDetails() {
        const categoryId = this.$route.params.categoryId;
        fetch(`http://127.0.0.1:5000/api/category/${categoryId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          .then(response => response.json())
          .then(data => {
            this.categoryDetails = data;
          })
          .catch(error => {
            if (error.message === '404') {
              this.resultMessage = 'Category not found'
            } else {
              this.resultMessage = 'Failed to fetch category details';
              console.log(error);
            }
          });
      },
      //navigateToProduct(productId) {
        //this.$router.push(`/product/${productId}`);},
      getImagePath(imageFileName) {
        return require(`../images/${imageFileName}`);
      },
      deleteCategory() {
        const token = localStorage.getItem('token');
        if (token) {
          const confirmation = confirm(`Category ${this.categoryDetails.c_name} and all its products will be deleted. Proceed?`);
          if (confirmation) {
            fetch(`http://127.0.0.1:5000/api/category/${this.categoryId}`, {
              method: 'DELETE',
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
              alert(data.message);
              if (this.categoryDetails.u_role=='admin'){
                window.location.href = '/admin'
              };
            })
            .catch(error => {
              if (error.message === '409') {
                alert('This category is already requested to be deleted');
              } else {
                this.resultMessage = 'Deletion unsuccessful';
                console.log(error);
              }
              
            });
          }
        } else {
          alert('Please log in to access this page');
        }
      }
    },
    template: `
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
    <h2 style="
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 1.5em;
      color: #444;
    ">{{ categoryDetails.c_name }}</h2>
    <p>{{ categoryDetails.c_desc }}</p>
    <p>{{ resultMessage }}</p>
    <h4 v-if="categoryDetails.u_role === 'admin' || categoryDetails.u_role === 'manager'">
      <router-link :to="'/editcat/' + categoryId" style="text-decoration: none; color: #000;">Edit Category</router-link>
    </h4>
    <button v-if="categoryDetails.u_role === 'admin' || categoryDetails.u_role === 'manager'" @click="deleteCategory" style="
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      background-color: #dc3545;
      color: #fff;
    ">Delete Category</button>
    <h3 style="margin-top: 20px;">Products in {{ categoryDetails.c_name }}:</h3>
    <div v-for="product in categoryDetails.products" :key="product.p_id" style="
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 15px;
    ">
      <h4>{{ product.p_name }}</h4>
      <img :src="getImagePath(product.p_img)" :alt="product.p_name" style="max-width: 100%;">
      <p>Cost: {{ product.p_cost }} per {{ product.p_unit }}</p>
      <router-link :to="'/product/' + product.p_id" style="text-decoration: none; color: #007bff;">View Product</router-link>
    </div>
  </div>
    `
  };
  