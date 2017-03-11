<template>
<main>
<v-sidebar v-model="sidebar" fixed>
  <simple-list-data dense :items="items" />
</v-sidebar>
<v-content>
  <v-container fluid>
  Select a library from the left, Movies or TV Shows.
  </v-container>
</v-content>
</main>
</template>

<script>
import SimpleListData from '../components/SimpleListData'

export default {
  name: 'main-view',
  components: {
    SimpleListData
  },
  data () {
    return {
      items: [
        { header: 'MANAGE' },
        { divider: true },
        { title: 'Status', href: '#', icon: 'show_chart' },
        { title: 'Settings', href: '#', icon: 'settings' },
        { header: 'LIBRARIES' },
        { divider: true },
        { title: 'Movies', href: '/v/Movies', icon: 'local_movies' },
        { title: 'TV Shows', href: '/v/TV%20Shows', icon: 'tv' }
      ]
    }
  },
  computed: {
    sidebar: {
      get () { return this.$store.state.sidebar },
      set (s) { this.$store.commit('SIDEBAR', s) }
    }
  },
  mounted () {
  }
}
</script>

<style lang="stylus">
</style>
