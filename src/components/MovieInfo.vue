<template>
<div class="movie-info__container">
<div class="movie-info__right" :style="rightStyle">
  <div class="movie-info__play">
    <div class="movie-info__playicons">
      <i class="material-icons movie-info__play-fsicon" @click="play(true)">fullscreen</i>
      <i class="material-icons movie-info__play-arrowicon">play_arrow</i>
      <i class="material-icons movie-info__play-circleicon" @click="play()">play_circle_outline</i>
      <i class="material-icons movie-info__play-infoicon">info_outline</i>
    </div>
  </div>
</div>
<div class="movie-info__left" :style="leftStyle">
  <div class="movie-info__title">{{ title }}</div>
  <div class="movie-info__rating">
    <div>
      <star-rating class="movie-info__stars" :rating="items.rating" v-if="items.rating > 0"/>
    </div>
    <div class="movie-info__year">{{items.year}}</div>
    <div class="movie-info__white">{{seasonInfo}}</div>
    <div class="movie-info__white" v-if="runtime">{{runtime}}</div>
  </div>
  <div class="movie-info__plot movie-info__grey" v-if="plot">
    {{plot}}
  </div>
  <div class="movie-info__grey" v-if="starring">
    Starring: <span class="movie-info__white">{{starring}}</span>
  </div>
  <div class="movie-info__grey" v-if="genres">
    Genres: <span class="movie-info__white">{{genres}}</span>
  </div>
  <div class="movie-info__plot movie-info__grey" v-if="subs">
    Subtitles: {{subs}}
  </div>
</div>
<video-player v-if="video" class="movie-info__player" :item="video" :fullscreen="videoFullscreen"  @stop="close()" />
<div class="movie-info__close" @click="close()"><v-icon>close</v-icon></div>
</div>
</template>

<script>
import { mapState } from 'vuex'
import { joinpath } from '../lib/util'

import StarRating from './StarRating'
import VideoPlayer from './VideoPlayer'

let pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAA' +
            'AC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='

export default {
  name: 'movie-info',
  data: () => ({
    itemNfo: {},
    seasons: null,
    video: null,
    videoFullscreen: false
  }),
  components: {
    StarRating,
    VideoPlayer
  },
  props: {
    items: { type: Object },
    context: { type: Object },
    index: { type: Number }
  },
  watch: {
    items () {
      this.video = null
      this.updateItemNfo()
    }
  },
  beforeDestroy () {
    this.video = null
  },
  computed: {
    leftStyle () {
      return {}
    },
    rightStyle () {
      return {
        height: this.context.height + 'px',
        backgroundColor: '#000000',
        backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0,0,0, 0.7) 10%, rgba(0, 0, 0, 0) 25%),' + this.bgUrl()
        // fontSize: Math.floor(this.context.height / 1.3) + 'px'
      }
    },
    imgStyle () {
      return {
        height: this.context.height + 'px',
        width: this.context.imgWidth + 'px'
      }
    },
    imgUrl () {
      let query = `?w=${this.context.imgWidth}&h=${this.context.height}&q=70`
      return this.movieInfo.url + query
    },
    title () {
      let title = this.items.name
      let s = /^(.*) *\([0-9]+\)$/.exec(title)
      if (s) {
        title = s[1]
      }
      return title
    },
    plot () {
      if (!this.itemNfo || !this.itemNfo.plot) {
        return
      }
      let plot = this.itemNfo.plot
      if (plot.length > 160) {
        let s = /^([^.]*)/.exec(plot)
        if (s && s[1].length > 120) {
          plot = s[1] + '.'
        }
        if (plot.length > 160) {
          plot = plot.substring(0, 157) + '...'
        }
      }
      return plot
    },
    runtime () {
      return this.itemNfo ? this.itemNfo.runtime : null
    },
    starring () {
      return this.getArray('actor', 3, 'name')
    },
    genres () {
      return this.getArray('genre', 3)
    },
    seasonInfo () {
      if (!this.seasons) {
        return
      }
      let count = 0
      let max = 0
      let s = this.seasons
      for (let i in s) {
        if (s[i].seasonno) {
          max = Math.max(max, s[i].seasonno)
          count++
        }
      }
      if (count === 0) {
        return ''
      }
      let r = ` ${count} Season` + (count > 1 ? 's' : '')
      if (max > count) {
        r += ` (of ${max})`
      }
      return r
    },
    subs () {
      if (!this.items || !this.items.vttsubs) {
        return null
      }
      let s = []
      for (let i of this.items.vttsubs) {
        if (i.lang) {
          s.push(i.lang)
        }
      }
      return s.join(', ')
    },
    ...mapState([ 'movieInfo', 'api', 'apiURL' ])
  },
  mounted () {
    this.updateItemNfo()
  },
  methods: {
    bgUrl () {
      let m = this.movieInfo
      let img = m.fanart || m.poster
      if (img) {
        let url = joinpath(this.apiURL, m.baseurl, m.path, img)
        let ratio = window.devicePixelRatio || 1
        let h = this.context.height * 2 * ratio
        if (h > 1080) {
          h = 1080
        }
        let u = ` url('${url}?h=${h}&q=70')`
        return u
      }
      return `url(${pixel})`
    },
    updateItemNfo () {
      this.itemNfo = {}
      this.seasons = null
      this.api.getItem(this.context.collection, this.items.path).then((item) => {
        if (item.name === this.items.name) {
          this.itemNfo = item.nfo
          this.seasons = item.seasons
        }
      }).catch(() => { return })
    },
    getArray (name, max, objElem) {
      if (!this.itemNfo || !this.itemNfo[name]) {
        return ''
      }
      let a = []
      for (let i = 0; i < this.itemNfo[name].length; i++) {
        if (i >= max) {
          break
        }
        let e
        if (objElem) {
          e = this.itemNfo[name][i][objElem]
        } else {
          e = this.itemNfo[name][i]
        }
        if (e) {
          a.push(e)
        }
      }
      return a.join(', ')
    },
    play (fs) {
      this.videoFullscreen = fs
      this.video = this.items
    },
    close () {
      this.$store.commit('MOVIE_INFO', null)
    }
  }
}
</script>

<style lang="scss">
.movie-info__container {
  position: relative;
  // display: flex;
  box-sizing: border-box;
  width: 100%;
  font-family: sans-serif;
  overflow: hidden;
  margin-left: auto;
  margin-right: auto;
  background: black;
}
.movie-info__close {
  position: absolute;
  display: flex;
  cursor: pointer;
  text-shadow: 6px 0px 18px #000, 0px 6px 18px #000;
  align-items: flex-end;
  right: 0px;
  top: 0px;
  width: 35px;
  height: 35px;
}
.movie-info__left {
  position: relative;
  padding: 20px;
  width: 43%;
  // flex-grow: 1;
  // flex-basis: 0;
}
.movie-info__right {
  position: absolute;
  width: 67%;
  top: 0px;
  right: 0px;
  // display: flex;
  // flex-grow: 2;
  // flex-basis: 0;
  background-size: cover;
}
.movie-info__title {
  font-size: 32px;
  font-weight: bold;
}
.movie-info__rating {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
}
.movie-info__stars {
  color: red;
  margin-right: 12px;
}
.movie-info__plot {
  margin-top: 10px;
  margin-bottom: 10px;
}
.movie-info__year {
  font-size: 20px;
  margin-right: 12px;
}
.movie-info__grey {
  font-size: 16px;
  color: #bbb;
}
.movie-info__white {
  font-size: 16px;
  color: white;
}
.movie-info__play {
  display: flex;
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  align-items: center;
  justify-content: center;
  text-shadow: 0px 0px 10px #000;
  color: white;
}
.movie-info__playicons {
  position: relative;
  align-items: center;
  display: flex;
}
.movie-info__play-fsicon {
  font-size: 80px !important;
  position: absolute;
  left: -20px;
  cursor: pointer;
}
.movie-info__play-arrowicon {
  font-size: 40px !important;
  margin-right: 10px;
}
.movie-info__play-circleicon {
  font-size: 64px !important;
  margin-left: 10px;
  margin-right: 10px;
  cursor: pointer;
}
.movie-info__play-infoicon {
  font-size: 64px !important;
  margin-left: 10px;
  cursor: pointer;
}
.movie-info__player {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
}
</style>
