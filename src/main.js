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

// measure scrollbar width.
if (!util.isMobile()) {
  let w = 6
  if (!util.isWebkit()) {
    w = util.scrollbarWidth()
  }
  store.commit('SCROLLBAR_WIDTH', w)
}

// Android adds the size of the lower button area (56px) to '100vh'.
// Try to measure this offset, then use calc(100vh - state.vhOffset)
// instead of 100vh to get the _real_ viewport height.
let md1 = document.getElementById('vhMeasureDiv1').clientHeight
let md2 = document.getElementById('vhMeasureDiv2').clientHeight
if (md1 !== md2 && md1 > 0 && md2 > 0) {
  store.commit('VH_OFFSET', md1 - md2)
}

// see if the screen is smallish, in that case start out with the
// smallest poster size - hopefully we can fit 3 in a row.
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

