<template>
<thumb-wall
    :items="items"
    :thumbSize="thumbSize"
    :scrollbarWidth="scrollbarWidth"
    :focus="focus"
    :renderers="renderers" />
</template>

<script>
import { mapState } from 'vuex'

import ThumbWall from './ThumbWall'
import PosterRow from './PosterRow'
import PosterRowHeader from './PosterRowHeader'
import MovieInfo from './MovieInfo'

const renderers = {
  row: {
    component: PosterRow,
    height: [ 180, 230, 300 ],
    itemWidth: [ 110, 143, 190 ],
    imgHeight: [ 150, 200, 270 ],
    imgWidth: [ 100, 133, 200 ],
    infoHeight: 20
  },
  header: {
    component: PosterRowHeader,
    height: [ 40, 60, 60 ]
  },
  panel: {
    component: MovieInfo,
    height: 400
  }
}

export default {
  name: 'movies',
  components: {
    ThumbWall
  },

  props: {
    collection: String,
    sort: String,
    search: String,
    genre: { type: Array, default: [] }
  },

  data: () => ({
    renderers: Object.freeze(renderers),
    focus: null,
    panel: null,
    thumbSize: null,
    items: []
  }),

  created () {
    // this.thumbSize = this.posterSize
    // this.panel = this.movieInfo
    this.renderers.panel.collection = this.collection
  },

  mounted () {
    console.log('movies mounted calling getMovies')
    this.api.getMovies(this.collection).then((movies) => {
      console.log('getmovies promise callback, builditems')
      this.items = Object.freeze(movies)
    })
    // console.log('movies mounted called done')
  },

  computed: mapState([ 'api', 'thumbSize', 'panel', 'scrollbarWidth' ]),

  watch: {
    panel (pn) {
      if (pn) {
        this.focus = {
          key: pn.rowKey,
          offset: pn.rowOffset,
          intoView: 'pn_' + this.generation
        }
      } else {
        this.focus = null
      }
    }
  }
}
</script>

