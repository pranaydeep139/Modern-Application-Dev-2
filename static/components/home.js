export default {
    template:`
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
    <h2>Welcome to the Web Grocery Store!</h2>
    <h3 style="margin-top: 15px;"><router-link to="/login" style="text-decoration: none; color: #000;">Sign in for grocery shopping</router-link></h3>
    <h3 style="margin-top: 15px;"><router-link to="/register" style="text-decoration: none; color: #000;">Register as a new user</router-link></h3>
    </div>
    `
}