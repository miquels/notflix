import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import Resize from './directives/resize'

import store from './store'
import App from './App.vue'

import 'whatwg-fetch'

import './styl/main.styl'
import './css/_scrollbar.scss'
// import '../node_modules/vuetify/src/stylus/main.styl'

import MainView from './views/MainView'
import MoviesView from './views/MoviesView'

Vue.use(Vuetify)
Vue.use(VueRouter)
Vue.directive('resize', Resize)

var router = new VueRouter({
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  // linkActiveClass: 'active',
  routes: [
      { path: '/', component: MainView },
      { path: '/v/:coll', component: MoviesView },
      { path: '/movies', component: MoviesView },
      { path: '*', redirect: '/' }
  ]
})

store.dispatch('LOAD_CONFIG').then((res) => {
  console.log('result:', res)
  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    store,
    router,
    render: h => h(App)
  })
})

