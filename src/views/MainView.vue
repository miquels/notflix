<template>
<main>
<v-sidebar v-model="sidebar" fixed>
  <data-list dense :items="items" />
</v-sidebar>
<v-content>
  <v-container fluid>
  Select a library from the left, Movies or TV Shows.
  </v-container>
</v-content>
</main>
</template>

<script>
import DataList from '../components/DataList'

export default {
  name: 'main-view',
  components: {
    DataList
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
        { title: 'Movies', href: '/v/Movies', avatar: 'local_movies' },
        { title: 'TV Shows', href: '/v/TV%20Shows', avatar: 'tv' }
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
