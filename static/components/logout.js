export default {
    mounted() {
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      window.location.href = '/login';
    },
    template: `
    <div style="
    font-family: Arial, sans-serif;
    color: #333;
    max-width: 300px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    text-align: center;
  ">
    <p style="margin-bottom: 20px;">Logging out...</p>
  </div>
    `
  };
  