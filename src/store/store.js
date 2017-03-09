import Vue from 'vue'
import Vuex from 'vuex'
import { isFullScreen } from '../lib/util'

Vue.use(Vuex)

var Store = {}

const state = {
  apiURL: 'http://localhost:8040/',
  api: null,
  media: {},
  sidebar: false,
  fullscreen: isFullScreen(),
  posterSize: 1,
  collection: '',
  movieInfo: null,
  videoPlaying: false
}

// mutations: synchronous changes
const mutations = {
  SIDEBAR (state, data) {
    state.sidebar = data
  },
  FULLSCREEN (state, data) {
    state.fullscreen = data
  },
  POSTER_SIZE (state, size) {
    console.log('STORE: set poster size to', size)
    state.posterSize = size
  },
  POSTER_HOVER (state, obj) {
    state.posterHover = obj
  },
  MOVIE_INFO (state, item) {
    state.movieInfo = item
  },
  COLLECTION (state, coll) {
    state.collection = coll
  },
  API (state, api) {
    state.api = api
  },
  VIDEO_PLAYING (state, flag) {
    state.videoPlaying = flag
  }
}

// actions: asynchronous changes.
const actions = {
}

Store = new Vuex.Store({
  state,
  mutations,
  actions,
  strict: process.env.NODE_ENV !== 'production'
})
export default Store
