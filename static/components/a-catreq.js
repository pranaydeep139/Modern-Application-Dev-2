export default {
    data() {
        return {
            resultMessage: '',
            createRequests: [],
            editRequests: [],
            deleteRequests: [],
            user_role: ''
        };
    },
    methods: {
        approveRequest(request, type) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://127.0.0.1:5000/api/catreq', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ r_id: request.r_id, approve: true, r_type: type })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    this.resultMessage = data.message;
                    this.fetchCatRequests();
                })
                .catch(error => {
                    if (error.message === '409') {
                        this.resultMessage = 'Category already exists';
                      } else if (error.message === '404') {
                        this.resultMessage = 'Category not found';
                      } else {
                        console.error('Error:', error);
                      }
                    
                });
            } else {
                console.error('Please log in to view protected content');
            }
        },
        deleteRequest(request) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://127.0.0.1:5000/api/catreq', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ r_id: request.r_id, delete: true })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    this.resultMessage = data.message;
                    this.fetchCatRequests();
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            } else {
                console.error('Please log in to view protected content');
            }
        },
        fetchCatRequests() {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://127.0.0.1:5000/api/catreq', {
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
                    this.createRequests = data.filter(req => req.r_type === 'create');
                    this.editRequests = data.filter(req => req.r_type === 'edit');
                    this.deleteRequests = data.filter(req => req.r_type === 'delete');
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            } else {
                console.error('Please log in to view protected content');
            }
        },
        approveDeleteRequest(request) {
            const confirmation = confirm(`Category ${request.r_name} and all its products will be deleted. Proceed?`);
            if (confirmation) {
                const token = localStorage.getItem('token');
                if (token) {
                    fetch('http://127.0.0.1:5000/api/catreq', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ r_id: request.r_id, approve: true, r_type: 'delete' })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        this.resultMessage = data.message;
                        this.fetchCatRequests();
                    })
                    .catch(error => {
                        if (error.message === '500') {
                            this.resultMessage = 'Failed to delete category';
                          } else if (error.message === '404') {
                            this.resultMessage = 'Category not found';
                          } else {
                            console.error('Error:', error);
                            this.resultMessage = 'Failed to delete category';
                          }
                        
                    });
                } else {
                    console.error('Please log in to view protected content');
                }
            }
        }
        },
    mounted() {
        this.user_role =  localStorage.getItem('user_role');
        this.fetchCatRequests();
    },
    template: `
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
    ">Category Create Requests</h2>
    <ul style="padding: 0; margin: 0;">
      <li v-for="request in createRequests" :key="request.r_id" style="
        list-style: none;
        margin-bottom: 10px;
        padding: 10px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <div>{{ request.r_name }}</div>
        <div>{{ request.r_desc }}</div>
        <div>User: {{ request.username }}</div>
        <button @click="approveRequest(request, 'create')" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">Approve</button>
        <button @click="deleteRequest(request)" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Delete</button>
      </li>
    </ul>
    <h2 style="
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 1.5em;
      color: #444;
    ">Category Edit Requests</h2>
    <ul style="padding: 0; margin: 0;">
      <li v-for="request in editRequests" :key="request.r_id" style="
        list-style: none;
        margin-bottom: 10px;
        padding: 10px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <div>{{ request.r_name }}</div>
        <div>{{ request.r_desc }}</div>
        <div>User: {{ request.username }}</div>
        <button @click="approveRequest(request, 'edit')" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">Approve</button>
        <button @click="deleteRequest(request)" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Delete</button>
      </li>
    </ul>
    <h2 style="
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 1.5em;
      color: #444;
    ">Category Delete Requests</h2>
    <ul style="padding: 0; margin: 0;">
      <li v-for="request in deleteRequests" :key="request.r_id" style="
        list-style: none;
        margin-bottom: 10px;
        padding: 10px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <div>{{ request.r_name }}</div>
        <div>{{ request.r_desc }}</div>
        <div>User: {{ request.username }}</div>
        <button @click="approveDeleteRequest(request)" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">Approve</button>
        <button @click="deleteRequest(request)" style="
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Delete</button>
      </li>
    </ul>
    <div style="
      margin-top: 20px;
      font-style: italic;
      color: #777;
    ">{{ resultMessage }}</div>
  </div>
    `
}

