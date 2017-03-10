<template>
<v-app top-fixed-toolbar left-fixed-sidebar sidebar-under-toolbar>
  <header>
    <v-toolbar fixed>
      <v-toolbar-side-icon
         class="hidden-md-and-up"
         @click.native.stop="sidebar = !sidebar">
      </v-toolbar-side-icon>
      <router-link to="/" tag="span" exact>
        <v-btn icon dark>
          <v-icon>home</v-icon>
        </v-btn>
      </router-link>
      <v-toolbar-title class="hidden-sm-and-down">NotFlix</v-toolbar-title>
      <v-spacer/>

      <v-menu bottom left offset-y origin="top right" transition="v-slide-y-transition">
        <v-btn icon="icon" slot="activator" dark>
          <v-icon>apps</v-icon>
        </v-btn>
        <v-list>
          <simple-list-item title="small posters" @click="posters(0)" />
          <simple-list-item title="medium posters" @click="posters(1)" />
          <simple-list-item title="large posters" @click="posters(2)" />
        </v-list>
      </v-menu>
      <v-btn icon dark @click.native.stop="reload()" class="hidden-sm-and-down">
        <v-icon>refresh</v-icon>
      </v-btn>
      <v-btn icon dark @click.native.stop="fullscreen = !fullscreen">
        <v-icon>{{ fullscreen ? 'fullscreen_exit' : 'fullscreen' }}</v-icon>
      </v-btn>

      <v-menu bottom left offset-y origin="top right" transition="v-slide-y-transition">
        <v-btn icon="icon" slot="activator" dark>
          <v-icon>more_vert</v-icon>
        </v-btn>
        <v-list>
          <simple-list-item title="Status" />
          <simple-list-item title="Settings" />
        </v-list>
      </v-menu>

    </v-toolbar>
  </header>
  <router-view class="view"></router-view>
</v-app>
</template>

<script>
import { setFullScreen, isFullScreen } from './lib/util'
import SimpleListItem from './components/SimpleListItem'
import API from './lib/api'

export default {
  name: 'app',
  components: {
    SimpleListItem
  },
  data () {
    return {
      items: [
        { header: 'MANAGE' },
        { divider: true },
        { title: 'Status', href: '#', avatar: 'show_chart' },
        { title: 'Settings', href: '#', avatar: 'settings' },
        { header: 'LIBRARIES' },
        { divider: true },
        { title: 'Movies', href: '#', avatar: 'local_movies' },
        { title: 'TV Shows', href: '#', avatar: 'tv' }
      ]
    }
  },

  computed: {
    sidebar: {
      get () { return this.$store.state.sidebar },
      set (s) { this.$store.commit('SIDEBAR', s) }
    },
    fullscreen: {
      get () { return this.$store.state.fullscreen },
      set (s) {
        if (s !== this.$store.state.fullscreen) {
          let elem = document.getElementsByTagName('HTML')[0]
          setFullScreen(elem, s)
        }
      }
    }
  },
  created () {
    let store = this.$store
    let api = new API({ url: this.$store.state.apiURL })
    store.commit('API', Object.freeze(api))
  },
  mounted () {
    document.getElementById('initialLoadingDiv').style.display = 'none'
    document.addEventListener('fullscreenchange', this.fullScreenChanged)
    document.addEventListener('webkitfullscreenchange', this.fullScreenChanged)
    document.addEventListener('mozfullscreenchange', this.fullScreenChanged)
    window.addEventListener('resize', this.fullScreenChanged)
  },
  methods: {
    posters (size) {
      console.log('set poster size to', size)
      this.$store.commit('POSTER_SIZE', size)
    },
    reload () {
      location.reload()
    },
    fullScreenChanged () {
      // XXX fscking hack for now FIXME
      if (this.$store.state.videoPlaying) {
        return
      }
      let f = isFullScreen()
      if (f !== this.$store.state.fullscreen) {
        this.$store.commit('FULLSCREEN', f)
      }
    }
  }
}
</script>

<style lang="scss">
body {
 // needed for full screen mode.
  width: 100%;
}
html {
  // reset the reset stylesheet.
  overflow-y: auto !important;
}
*:focus {
  outline: none;
}
.view {
  margin-top: 10px;
}
.fade-enter-active, .fade-leave-active {
  transition: all .2s ease-in-out;
}
.fade-enter, .fade-leave-active {
  opacity: 0;
}
</style>
