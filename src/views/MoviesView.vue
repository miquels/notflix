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
        <v-list-tile-title v-text="'GENRE'" />
          <v-list-tile-action>
            <v-icon>keyboard_arrow_down</v-icon>
          </v-list-tile-action>
        </v-list-tile>
    </v-list-item>
    <input-list type="checkbox" :items="filterItems" v-model="genre" />
  </v-list-group>
  </v-list>
</v-sidebar>
<v-content>
  <v-container fluid>
    <movies class="movies-view__movies"
      :collection="collection"
      :genre="genre"
      :sort="sort"
      :search="search" />
  </v-container>
</v-content>
</main>
</template>

<script>
import Movies from '../components/Movies'
import DataList from '../components/DataList'
import InputList from '../components/InputList'

export default {
  name: 'movies-view',
  components: {
    Movies,
    DataList,
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
      search: '',
      sort: 'year',
      genre: [],
      collection: 'Movies'
    }
  },
  computed: {
    sidebar: {
      get () { return this.$store.state.sidebar },
      set (s) { this.$store.commit('SIDEBAR', s) }
    }
  },
  created () {
    this.collection = this.$route.params.coll || 'Movies'
  },
  mounted () {
  }
}
</script>

<style lang="scss">
.movies-view__movies {
  height: calc(100vh - 80px);
  margin-left: 8px;
  margin-right: 2px;
}
// .list--group .list__tile {
//   padding-left: 10px !important
// }
</style>
