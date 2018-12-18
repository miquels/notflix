<template>
<main>
<v-sidebar v-model="sidebar" fixed>
  <v-list dense>
  <input-list dense type="search" :items="searchItems" v-model="search" />
  </v-list dense>
  <v-list dense>
  <input-list dense type="radio" :items="sortItems" v-model="sort" />
  </v-list dense>
  <v-list dense>
  <v-list-group no-action>
    <v-list-item slot="item">
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title v-text="'GENRE'" />
        </v-list-tile-content>
        <v-list-tile-action>
          <v-icon>keyboard_arrow_down</v-icon>
        </v-list-tile-action>
      </v-list-tile>
    </v-list-item>
    <input-list type="checkbox" :items="filterItems" v-model="genre" />
  </v-list-group>
  </v-list>
  <v-list dense>
  <v-list-group no-action>
    <v-list-item slot="item">
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title v-text="'STUDIOS'" />
        </v-list-tile-content>
        <v-list-tile-action>
          <v-icon>keyboard_arrow_down</v-icon>
        </v-list-tile-action>
      </v-list-tile>
    </v-list-item>
    <input-list type="checkbox" :items="filterStudios" v-model="studios" />
  </v-list-group>
  </v-list>
</v-sidebar>
<v-content>
  <v-container fluid>
    <movies class="movies-view__movies"
      :style="{ height: moviesViewHeight }"
      :collection="collection"
      :genre="genre"
      :studios="studios"
      :sort="sort"
      :search="search" />
  </v-container>
</v-content>
</main>
</template>

<script>
import Movies from '../components/Movies'
import InputList from '../components/InputList'
import { mapState } from 'vuex'

export default {
  name: 'movies-view',
  components: {
    Movies,
    InputList
  },
  data () {
    return {
      searchItems: [
        { search: 'Search...', avatar: 'search' }
      ],
      sortItems: [
        { header: 'SORT' },
        { divider: true },
        { label: 'Year', name: 'sort', value: 'year' },
        { label: 'Name', name: 'sort', value: 'name' },
        { label: 'Rating', name: 'sort', value: 'rating' },
        { label: 'Studio', name: 'sort', value: 'studio' },
        { label: 'Added', name: 'sort', value: 'added' },
        { label: 'Updated', name: 'sort', value: 'updated' }
      ],
      filterItems: [
//        { header: 'FILTER' },
//        { divider: true },
        { label: 'Action', name: 'genre', value: 'action' },
        { label: 'Adventure', name: 'genre', value: 'adventure' },
        { label: 'Animation', name: 'genre', value: 'animation' },
        { label: 'Comedy', name: 'genre', value: 'comedy' },
        { label: 'Crime', name: 'genre', value: 'crime' },
        { label: 'Drama', name: 'genre', value: 'drama' },
        { label: 'Family', name: 'genre', value: 'family' },
        { label: 'Fantasy', name: 'genre', value: 'fantasy' },
        { label: 'Horror', name: 'genre', value: 'horror' },
        { label: 'Musical', name: 'genre', value: 'musical' },
        { label: 'Mystery', name: 'genre', value: 'mystery' },
        { label: 'Romance', name: 'genre', value: 'romance' },
        { label: 'Sci-Fi', name: 'genre', value: 'sci-fi' },
        { label: 'Thriller', name: 'genre', value: 'thriller' },
        { label: 'Western', name: 'genre', value: 'western' }
      ],
      filterStudios: [
        { label: 'Example content', name: 'studio', value: 'Example' }
      ],
      search: '',
      sort: 'year',
      genre: [],
      studios: [],
      collection: 'Movies'
    }
  },
  computed: {
    ...mapState([ 'api' ]),
    sidebar: {
      get () { return this.$store.state.sidebar },
      set (s) { this.$store.commit('SIDEBAR', s) }
    },
    moviesViewHeight () {
      return 'calc(100vh - ' + (64 + 10 + this.$store.state.vhOffset) + 'px)'
    }
  },
  created () {
    this.collection = this.$route.params.coll || 'Movies'
  },
  mounted () {
    console.log('Moviesview mounted; calling getStudios')
    this.api.getStudios(this.collection).then((studios) => {
      console.log('getStudios promise callback, builditems')
      this.filterStudios = Object.freeze(studios)
      console.log('done')
    })
  }
}
</script>

<style lang="scss">
.movies-view__movies {
  height: calc(100vh - 64px);
  margin-left: 8px;
  margin-right: 2px;
}
// .list--group .list__tile {
//   padding-left: 10px !important
// }
</style>
