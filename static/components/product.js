export default {
    data() {
      return {
        productDetails: {
          p_name: '',
          p_unit: '',
          p_cost: 0,
          p_img: '',
          category_name: '',
          category_id:'',
          manuf_date: '',
          usage_days: 0,
          quantity: 0,
          u_role: null
        },
        cartQuantity: 1,
        totalPrice: 0,
        resultMessage: '',
        path:'',
        productId: null,
        user_role:''
      };
    },
    created() {
      this.productId = this.$route.params.productId;
      this.fetchProductDetails(this.productId);
      this.user_role =  localStorage.getItem('user_role');
    },
    methods: {
      fetchProductDetails(productId) {
        fetch(`http://127.0.0.1:5000/api/product/${productId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          .then(response => response.json())
          .then(data => {
            this.productDetails = data;
            this.totalPrice = this.productDetails.p_cost
          })
          .catch(error => {
            if (error.message === '404') {
              this.resultMessage = 'Product not found'
            } else {
              this.resultMessage = 'Failed to fetch product details';
              console.log(error);
          }
        });
      },
      getImagePath(imageFileName) {
        return require(`../images/${imageFileName}`);
      },
      addToCart() {
        const productId = this.productId;
        const token = localStorage.getItem('token');
        if (token) {
          const formData = new FormData();
          formData.append('product_id', this.productId);
          formData.append('quantity', this.cartQuantity);
          formData.append('type', 'cart');
  
          fetch(`http://127.0.0.1:5000/api/product/${productId}`, {
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
          })
          .catch(error => {
            if (error.message === '404') {
              this.resultMessage = 'Product not found'
            } else {
              this.resultMessage = 'Failed to add product the cart';
              console.log(error);
          }
        });
        } else {
            this.resultMessage = 'Please log in to access this page'
        }
      },
      calculateTotalPrice() {
        this.totalPrice = this.productDetails.p_cost * this.cartQuantity;
      },
      buyProduct() {
        const productId = this.productId;
        const token = localStorage.getItem('token');
        if (token) {
          const formData = new FormData();
          formData.append('product_id', this.productId);
          formData.append('quantity', this.cartQuantity);
          formData.append('type', 'buy');
  
          fetch(`http://127.0.0.1:5000/api/product/${productId}`, {
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
            this.fetchProductDetails(this.productId);
          })
          .catch(error => {
            if (error.message === '400') {
              this.resultMessage = 'Sorry, you can not buy more items than available stock!'
            } else if (error.message === '404') {
              this.resultMessage = 'Product not found'
            } else {
              this.resultMessage = 'Failed to buy product';
              console.log(error);
          }
        });
        } else {
          this.resultMessage = 'Please log in to access this page';
        }
      },
      deleteProduct() {
        const token = localStorage.getItem('token');
        if (token) {
          const confirmation = confirm(`Product ${this.productDetails.p_name} will be deleted. Proceed?`);
          if (confirmation) {
            fetch(`http://127.0.0.1:5000/api/product/${this.productId}`, {
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
              if (this.productDetails.u_role=='admin'){
                window.location.href = '/admin'
              }
              if (this.productDetails.u_role=='manager'){
                window.location.href = '/manager'
              };
            })
            .catch(error => {
              if (error.message === '404') {
                alert('Product not found');
              } else {
                alert('Failed to buy product');
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
    max-width: 600px;
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
  
    <h2 style="margin-bottom: 10px;">{{ productDetails.p_name }}</h2>
    <img :src="getImagePath(productDetails.p_img)" :alt="productDetails.p_name" style="max-width: 100%; margin-bottom: 10px;">
    <p style="margin-bottom: 5px;">Category: <router-link :to="'/category/' + productDetails.category_id" style="text-decoration: none; color: #007bff;">{{ productDetails.category_name }}</router-link></p>
    <p>Cost per Unit: {{ productDetails.p_cost }} per {{ productDetails.p_unit }}</p>
    <p>Manufacture Date: {{ productDetails.manuf_date }}</p>
    <p>Usage Days: {{ productDetails.usage_days }}</p>
    <p>In Stock: {{ productDetails.quantity }}</p>
  
    <div v-if="productDetails.u_role === 'customer'">
      <label style="display: block; margin-bottom: 5px;">Quantity:</label>
      <input type="number" v-model="cartQuantity" @input="calculateTotalPrice" min="1" :max="productDetails.quantity" style="margin-bottom: 10px;">
      <p>Total Price: {{ totalPrice }}</p>
    </div>
  
    <h4 style="margin-top: 15px; margin-bottom: 5px;"><router-link v-if="productDetails.u_role === 'admin' || productDetails.u_role === 'manager'" :to="'/editpro/' + productId" style="text-decoration: none; color: #000;">Edit Product</router-link></h4>
    <button v-if="productDetails.u_role === 'admin' || productDetails.u_role === 'manager'" @click="deleteProduct" style="margin-bottom: 10px; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; background-color: #dc3545; color: #fff;">Delete Product</button>
    <button v-if="productDetails.u_role === 'customer'" @click="addToCart" style="margin-bottom: 10px; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; background-color: #007bff; color: #fff;">Add to Cart</button>
    <button v-if="productDetails.u_role === 'customer'" @click="buyProduct" style="padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; background-color: #28a745; color: #fff;">Buy Product</button>
    
    <div style="margin-top: 10px;">{{ resultMessage }}</div>
  </div>  
    `
  };
  