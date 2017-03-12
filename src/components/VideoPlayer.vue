<template>
<div class="video-player__container">
<video class="video-player__main"
  autoplay
  controls
  preload="metadata"
  crossorigin="anonymous"
  :src="videoSrc">
  <track v-for="s in subs"
    kind="subtitles"
    :src="s.src"
    :srclang="s.lang"
    :label="s.label"></track>
</video>
</div>
</template>

<script>
import { joinpath } from '../lib/util'

const langMap = {
  'en': { lang: 'en', label: 'English' },
  'eng': { lang: 'en', label: 'English' },
  'nl': { lang: 'nl', label: 'Nederlands' },
  'dut': { lang: 'nl', label: 'Nederlands' },
  'fr': { lang: 'fr', label: 'Francois' },
  'fre': { lang: 'fr', label: 'Francois' },
  'de': { lang: 'de', label: 'Deutsch' },
  'ger': { lang: 'de', label: 'Deutsch' },
  'und': { lang: 'xx', label: '(probably english)' }
}

export default {
  name: 'video-player',
  props: {
    item: Object
  },
  mounted () {
    this.$store.commit('VIDEO_PLAYING', true)
  },
  destroyed () {
    this.$store.commit('VIDEO_PLAYING', false)
  },
  computed: {
    apiURL () {
      return this.$store.state.apiURL
    },
    videoSrc () {
      const item = this.item
      console.log('videosrc', item)
      return joinpath(this.apiURL, item.baseurl, item.path, item.video)
    },
    subs () {
      const item = this.item
      if (!item.vttsubs) {
        return []
      }
      let u = joinpath(this.apiURL, item.baseurl, item.path)
      let r = []
      for (let s of item.vttsubs) {
        let { lang, label } = this.langLabel(s.lang)
        let src = joinpath(u, s.path)
        r.push({ src, lang, label })
      }
      return r
    }
  },
  methods: {
    langLabel (ll) {
      if (langMap[ll]) {
        return langMap[ll]
      }
      return { lang: ll, label: ll }
    }
  }
}
</script>

<style>
.video-player__container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: black;
}
.video-player__main {
  width: auto  !important;
  height: auto !important;
  max-width: 100%;
  max-height: 100%;
}
video::cue {
  font-family: arial;
  font-size: 1.2em;
  font-weight: normal;
  color: white;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
             -1px 1px 0 #000, 1px 1px 0px #000;
  background: none;
}
</style>

