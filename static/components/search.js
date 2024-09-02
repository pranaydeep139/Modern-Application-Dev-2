export default {
    data() {
      return {
        searchTerm: '',
        selectedCategory: 'all',
        maxPrice: null,
        products: [],
        filteredProducts: [],
        availableCategories: [],
        user_role:''
      };
    },
    created() {
      this.fetchProducts();
      this.user_role =  localStorage.getItem('user_role');
    },
    methods: {
      fetchProducts() {
        fetch('http://127.0.0.1:5000/api/search', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.products = data.serialized_products;
          this.availableCategories = data.cats;
          this.filterProducts();
        })
        .catch(error => {
          console.error('Error fetching products:', error);
        });
      },
      getImagePath(imageFileName) {
        return require(`../images/${imageFileName}`);
      },
      filterProducts() {
        this.filteredProducts = this.products.filter(product => {
          const nameMatch = product.p_name.toLowerCase().includes(this.searchTerm.toLowerCase());
          const categoryMatch = this.selectedCategory === 'all' || product.category_name === this.selectedCategory;
          const priceMatch = !this.maxPrice || product.p_cost <= this.maxPrice;
          return nameMatch && categoryMatch && priceMatch;
        });
      }
    },
    watch: {
      searchTerm() {
        this.filterProducts();
      },
      selectedCategory() {
        this.filterProducts();
      },
      maxPrice() {
        this.filterProducts();
      }
    },
    template: `
    <div style="
    font-family: 'Arial', sans-serif;
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

    <div style="margin-bottom: 20px;">
        <input type="text" v-model="searchTerm" placeholder="Search product..." style="padding: 8px; margin-bottom: 10px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
        <select v-model="selectedCategory" style="padding: 8px; margin-bottom: 10px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
            <option value="all">All Categories</option>
            
            <option v-for="category in availableCategories" :key="category">{{ category }}</option>
        </select>
        <input type="number" v-model.number="maxPrice" placeholder="Max price..." style="padding: 8px; margin-bottom: 10px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
    </div>

    <div v-if="filteredProducts.length === 0" style="text-align: center; margin-bottom: 20px;">No products found.</div>

    <div v-for="product in filteredProducts" :key="product.p_id" style="border: 1px solid #ccc; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
        
        <h4 style="margin-top: 0;">{{ product.p_name }}</h4>
        <img :src="getImagePath(product.p_img)" :alt="product.p_name" style="max-width: 100%; border-radius: 4px;">
        <p style="margin: 10px 0;">Cost: {{ product.p_cost }} per {{ product.p_unit }}</p>
        <router-link :to="'/product/' + product.p_id" style="text-decoration: none; color: #007bff;">View Product</router-link>
    </div>
</div>

    `
  };
  