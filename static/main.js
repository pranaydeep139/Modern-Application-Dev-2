import Vue from 'vue/dist/vue.js';
import App from './App.vue';
import router from './router.js';

new Vue({
  el: "#app",
  router: router,
  render: h => h(App),
});
