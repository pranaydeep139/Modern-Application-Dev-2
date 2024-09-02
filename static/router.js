import Vue from 'vue/dist/vue.js';
import VueRouter from 'vue-router';
import Display from './components/display.js';
import Home from './components/home.js';
import Register from './components/register.js';
import Login from './components/login.js';
import Customer from './components/customer.js';
import Admin from './components/admin.js';
import Manager from './components/manager.js';
import Manreq from './components/a-manreq.js';
import Catreq from './components/a-catreq.js';
import Newcat from './components/newcat.js';
import Newpro from './components/newpro.js';
import Editcat from './components/editcat.js';
import Editpro from './components/editpro.js';
import Product from './components/product.js';
import Category from './components/category.js';
import Cart from './components/cart.js';
import Search from './components/search.js';
import Catlist from './components/catlist.js';
import Logout from './components/logout.js';

Vue.use(VueRouter);

const routes = [
  { path: '/display', component: Display },
  { path: '/', component: Home },
  { path: '/register', component: Register },
  { path: '/login', component: Login },
  { path: '/customer', component: Customer },
  { path: '/admin', component: Admin },
  { path: '/manager', component: Manager },
  { path: '/manreq', component: Manreq },
  { path: '/catreq', component: Catreq },
  { path: '/newcat', component: Newcat },
  { path: '/newpro', component: Newpro },
  { path: '/editcat/:categoryId', component: Editcat },
  { path: '/editpro/:productId', component: Editpro },
  { path: '/product/:productId', component: Product },
  { path: '/category/:categoryId', component: Category },
  { path: '/cart', component: Cart },
  { path: '/search', component: Search },
  { path: '/catlist', component: Catlist },
  { path: '/logout', component: Logout }
];

const router = new VueRouter({
  mode: 'history',
  routes
});

export default router;
