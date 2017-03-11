<template>
<div class="poster-row__container">
  <div v-for="item in items"
    class="poster-row__item" :style="itemStyle(item)" :key="item.name">
    <div :style="wrapStyle" class="poster-row__imgwrap"
          @mouseenter="mouse(item)"
          @click="click(item)"
          ref="posters">
      <span>{{ item.name }}</span>
      <img :src="url(item)" class="poster-row__img"></img>
    </div>
    <div class="poster-row__info">
      {{ item.name }}
    </div>
  </div>
</div>
</template>

<script>
let pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAA' +
            'AC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='

export default {
  name: 'poster-row',
  data: () => ({
    _items: []
  }),
  props: {
    items: { type: Array },
    index: { type: Number },
    rowKey: { type: String },
    isScrolling: { type: Boolean },
    context: { type: Object }
  },
  computed: {
    fontSize () {
      let sz = Math.floor(this.context.imgWidth / 10)
      return sz > 15 ? 15 : sz
    },
    wrapStyle () {
      let fontsz = Math.floor(this.context.imgWidth / 7)
      fontsz = fontsz > 22 ? 22 : fontsz
      return {
        fontSize: fontsz + 'px',
        width: this.context.imgWidth + 'px',
        height: this.context.imgHeight + 'px'
      }
    },
    movieInfo () {
      return this.$store.state.movieInfo
    }
  },
  created () {
    let ratio = window.devicePixelRatio || 1
    let w = this.context.imgWidth * ratio
    let h = this.context.imgHeight * ratio
    this.query = `?w=${w}&h=${h}&q=70`
  },
  mounted () {
    // console.log('mounted, items is', this.items)
  },
  methods: {
    url (item) {
      let url = item.url
      if (this.isScrolling || !url.match(/\.(jpg|jpeg|gif|tbn)$/)) {
        return pixel
      }
      return url + this.query
    },
    itemStyle (item) {
      let r = {
        fontSize: this.fontSize + 'px',
        width: this.context.imgWidth + 'px',
        height: this.context.imgHeight + 20 + 'px'
      }
      if (this.movieInfo && this.movieInfo.name === item.name) {
        r.borderColor = '#dedede'
      }
      return r
    },
    setMovieInfo (item) {
      let rowKey = this.rowKey
      let rowOffset = this.$parent.getOffset(rowKey)
      let newItem = Object.assign({ rowKey, rowOffset, url: item.url }, item.m)
      this.$store.commit('MOVIE_INFO', newItem)
    },
    click (item) {
      if (this.movieInfo === null || this.movieInfo.name !== item.name) {
        this.setMovieInfo(item)
      }
    },
    mouse (item) {
      if (this.$store.state.videoPlaying) {
        return
      }
      if (this.movieInfo && this.movieInfo.name !== item.name) {
        if (this.movieInfo.rowKey === this.rowKey) {
          this.setMovieInfo(item)
        }
      }
    }
  }
}
</script>

<style lang="scss">
.poster-row__container {
  display: flex;
}

.poster-row__item:hover {
  cursor: pointer;
  box-shadow: 0px 0px 10px 1px #888;
  z-index: 4;
}

.poster-row__item {
  box-sizing: content-box;
  border: 5px solid rgba(0, 0, 0, 0);
  position: relative;
  transition: all .2s ease-in-out;
}
.poster-row__imgwrap {
  display: flex;
  align-items: center;
  position: relative;
  background: black;
  background: linear-gradient(to bottom, rgba(125,126,125,1) 0%,rgba(14,14,14,1) 100%);
  color: #ddd;
  text-align: center;
  font-size: 14px;
  font-family: sans-serif;
  font-weight: bold;
  transition: all .2s ease-in-out;
  text-overflow: ellipsis;
  overflow: hidden;
}
.poster-row__img {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  width: 100%;
  height: 100%;
  transition: all .2s ease-in-out;
  overflow: hidden;
}
.poster-row__info {
  width: 100%;
  max-height: 20px;
  min-height: 20px;
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  box-sizing: border-box;
  padding-left: 3px;
  padding-right: 3px;
  text-overflow: ellipsis;
  background: black;
}
</style>
