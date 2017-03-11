import Vue from 'vue'
import Vuetify from 'vuetify'
import VueRouter from 'vue-router'
import Resize from './directives/resize'

import store from './store'
import App from './App.vue'

import * as util from './lib/util'

import 'whatwg-fetch'

import './stylus/main.styl'
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

if (!util.isMobile()) {
  let w = 6
  if (!util.isWebkit()) {
    w = util.scrollbarWidth()
  }
  store.commit('SCROLLBAR_WIDTH', w)
}

let cw = document.body.clientWidth
let ch = document.body.clientHeight
if (cw < 800 || (ch > 0 && ch < 500)) {
  store.commit('POSTER_SIZE', 0)
}

store.dispatch('LOAD_CONFIG').then((res) => {
  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    store,
    router,
    render: h => h(App)
  })
})

