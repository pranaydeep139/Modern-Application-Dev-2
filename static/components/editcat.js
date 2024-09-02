export default{
    data() {
        return {
            categoryId: null,
            categoryData:{
                c_name:'',
                c_desc: ''
            },
            resultMessage:'',
            user_role: ''
        }
    },
    created () {
        this.categoryId = this.$route.params.categoryId;
        this.user_role=localStorage.getItem('user_role');
        this.fetchCategoryData(this.categoryId);
    },
    methods: {
        fetchCategoryData(categoryId) {
            const token = localStorage.getItem('token');
            if (token) {
              fetch(`http://127.0.0.1:5000/api/editcat/${categoryId}`, {
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
                this.categoryData = data;
              })
              .catch(error => {
                if (error.message === '404') {
                  this.resultMessage = 'Category not found'
                } else {
                  this.resultMessage = 'Failed to fetch category details';
                  console.log(error);
                }
              });
            } else {
                this.resultMessage = 'Please log in to access protected content';
            }
          },
          updateCategory() {
            const categoryId = this.categoryId;
            const formData = new FormData();
            formData.append('c_name', this.categoryData.c_name);
            formData.append('c_desc', this.categoryData.c_desc);
        
            fetch(`http://127.0.0.1:5000/api/editcat/${categoryId}`, {
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
                this.resultMessage = 'Category not found'
              } else {
                this.resultMessage = 'Failed to update category';
                console.log(error);
              }
            });
          }
    },
    template:`
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
      <h2 style="margin-top: 20px; margin-bottom: 10px; font-size: 1.5em; color: #444;">Edit the Category {{ categoryData.c_name }}</h2>
      <div style="margin-bottom: 15px;">{{ resultMessage }}</div>
      <label style="display: block; margin-bottom: 10px;">Category description:</label>
      <textarea v-model="categoryData.c_desc" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;"></textarea><br>
      <button @click="updateCategory" style="
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        background-color: #007bff;
        color: #fff;
      ">Update</button>
      <h4 style="margin-top: 15px;"><router-link :to="'/category/' + categoryId" style="text-decoration: none; color: #000;">Back to Category</router-link></h4>
    </div>
  </div>
    `
}