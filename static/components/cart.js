export default {
    data() {
      return {
        cartDetails: {
          products: [],
          totalCost: 0
        },
        user_role:'',
        resultMessage:''
      };
    },
    mounted() {
      this.fetchCartDetails();
      this.user_role=localStorage.getItem('user_role');
    },
    methods: {
      fetchCartDetails() {
        fetch(`http://127.0.0.1:5000/api/cart`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          this.cartDetails = data;
        })
        .catch(error => {
          if (error.message === '404') {
            this.resultMessage = 'Cart is empty';
          } else {
            this.resultMessage = 'Failed to fetch cart';
            console.log(error);
          }
        });
      },
      buyCart() {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`http://127.0.0.1:5000/api/cart/buy`, {
            method: 'POST',
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
            this.fetchCartDetails();
            this.resultMessage = data.message;
          })
          .catch(error => {
            if (error.message === '404') {
              this.resultMessage = 'Cart is empty';
            } else {
              this.resultMessage = 'Failed to buy cart';
              console.log(error);
            }
          });
        }
      },
      removeFromCart(productId) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`http://127.0.0.1:5000/api/cart/remove/${productId}`, {
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
            this.fetchCartDetails();
            this.resultMessage = data.message;
          })
          .catch(error => {
            if (error.message === '404') {
              this.resultMessage = 'Item not found in cart'
            } else {
              this.resultMessage = 'Failed to remove from cart';
              console.log(error);
            }
          });
        }
      },
      getImagePath(imageFileName) {
        return require(`../images/${imageFileName}`);
      },
    },
    template: `
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
    <h2 style="
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 1.5em;
      color: #444;
    ">Your Cart</h2>
    <div v-for="product in cartDetails.products" :key="product.p_id" style="
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 15px;
    ">
      <h4>{{ product.p_name }}</h4>
      <img :src="getImagePath(product.p_img)" :alt="product.p_name" style="max-width: 100%;">
      <p>Cost: {{ product.subTotal }} </p>
      <p>Quantity: {{ product.c_quantity }}</p>
      <p>In stock: {{ product.p_quantity }}</p>
      <p>Category: {{ product.category_name }}</p>
      <button @click="removeFromCart(product.p_id)" style="
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        background-color: #007bff;
        color: #fff;
      ">Remove from Cart</button>
    </div>
    <p>Total Cost: {{ cartDetails.totalCost }}</p>
    <p>{{ resultMessage }}</p>
    <button @click="buyCart" style="
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      background-color: #28a745;
      color: #fff;
    ">Buy the Cart</button>
    <p><b>Note:</b> If you are trying to buy more items than available for any product, you will only be given the available number of items for that product, and the price will be reduced accordingly.</p>
  </div>
    `
  };
  