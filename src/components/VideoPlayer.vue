<template>
<div class="video-player__container" ref="container">
<div class="video-player__main"
  :class="{ 'video-player__maxsize': maxSize }"
  @mousemove="showControls()"
  @click="$refs.main.focus(); play()"
  @dblclick="fullscreen()"
  @keydown="keyDown($event)"
  @keyup="keyUp($event)"
  ref="main"
  tabindex="1">
  <video
    ref="video"
    autoplay
    preload="metadata"
    crossorigin="anonymous"
    :src="videoSrc"
    @ended="ended()"
    @loadeddata="loadedData()"
    @loadedmetadata="loadedMetaData()"
    @timeupdate="timeUpdate()"
    >
    <track v-for="s in subs"
      kind="subtitles"
      :src="s.src"
      :srclang="s.lang"
      :label="s.label"></track>
  </video>
  <div class="video-player__controls" v-show="controlsVisible" @click.stop="showControls()">
    <div class="video-player__progress" ref="progress" @click="progressClick($event)">
      <div class="video-player__pstart" :style="{ flexBasis: timePct + '%' }"></div>
      <div class="video-player__pend">
        <div class="video-player__knob"></div>
      </div>
    </div>
    <div class="video-player__buttons">
      <i class="video-player__btn material-icons md-light" @click="stop()">stop</i>
      <i class="video-player__btn material-icons md-light" @click="play()">{{playIcon}}</i>
      <div class="video-player__time">{{ time }}</div>
      <div class="video-player__spacer" />
      <i class="video-player__btn material-icons md-light" @click="volume()">{{volIcon}}</i>
      <i class="video-player__btn material-icons md-light" @click="subs()">subtitles</i>
      <i class="video-player__btn material-icons md-light" @click="fullscreen()">{{fsIcon}}</i>
    </div>
  </div>
</div>
</div>
</template>

<script>
import * as util from '../lib/util'

const langMap = {
  'en': { lang: 'en', label: 'English' },
  'eng': { lang: 'en', label: 'English' },
  'nl': { lang: 'nl', label: 'Nederlands' },
  'dut': { lang: 'nl', label: 'Nederlands' },
  'fr': { lang: 'fr', label: 'Francois' },
  'fre': { lang: 'fr', label: 'Francois' },
  'de': { lang: 'de', label: 'Deutsch' },
  'ger': { lang: 'de', label: 'Deutsch' },
  '': { lang: 'zz', label: 'Subtitles' },
  'zz': { lang: 'zz', label: 'Subtitles' },
  'und': { lang: 'zz', label: 'Subtitles' }
}

export default {
  name: 'video-player',
  props: {
    item: Object
  },
  data: () => ({
    playing: false,
    muted: false,
    time: '00:00',
    timePct: 0,
    maxSize: false,
    isFullscreen: false,
    controlsVisible: true
  }),
  mounted () {
    // console.log('VideoPlayer mounted')
    this.$store.commit('VIDEO_PLAYING', true)
    this.video = this.$refs.video
    this.video.play()
    let fsce = util.fullscreenEvent('fullscreenchange')
    document.addEventListener(fsce, this.fullscreenChanged)
    this.$refs.main.focus()
  },
  beforeDestroy () {
    // console.log('VideoPlayer destroyed')
    // firefox needs pause + invalidate src, or it will
    // keep on playing even though the <video> element is gone.
    this.video.pause()
    delete this.video.src
    let fsce = util.fullscreenEvent('fullscreenchange')
    document.removeEventListener(fsce, this.fullscreenChanged)
    if (this.controlsVisibleTimer) {
      clearTimeout(this.controlsVisibleTimer)
    }
    this.$store.commit('VIDEO_PLAYING', false)
    this.cleanupFullscreen()
  },
  beforeUpdate () {
    // console.log('VideoPlayer beforeupdate')
  },
  updated () {
    // console.log('VideoPlayer updated')
  },
  watch: {
    playing () {
      this.showControls()
    }
  },
  computed: {
    playIcon () { return this.playing ? 'pause' : 'play_arrow' },
    volIcon () { return this.muted ? 'volume_off' : 'volume_up' },
    fsIcon () { return this.isFullscreen ? 'fullscreen_exit' : 'fullscreen' },
    apiURL () {
      return this.$store.state.apiURL
    },
    videoSrc () {
      const item = this.item
      return util.joinpath(this.apiURL, item.baseurl, item.path, item.video)
    },
    subs () {
      const item = this.item
      if (!item.vttsubs) {
        return []
      }
      let u = util.joinpath(this.apiURL, item.baseurl, item.path)
      let r = []
      for (let s of item.vttsubs) {
        let { lang, label } = this.langLabel(s.lang)
        let src = util.joinpath(u, s.path)
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
    },
    progressClick (ev) {
      let rect = this.$refs.progress.getBoundingClientRect()
      let w = (rect.right - rect.left) || 1
      let x = ev.pageX - rect.left
      x = x > w ? w : (x < 0 ? 0 : x)
      let duration = this.video.duration || 0
      if (duration) {
        this.video.currentTime = (x / w) * duration
      }
    },
    showControls () {
      if (this.controlsVisibleTimer) {
        clearTimeout(this.controlsVisibleTimer)
        this.controlsVisibleTimer = null
      }
      this.controlsVisible = true
      if (this.playing) {
        this.controlsVisibleTimer = setTimeout(() => { this.controlsVisible = false }, 2500)
      }
    },
    ended () {
      this.stop()
    },
    loadedData () {
      // Here we should disable the mp4 builtin subtitle tracks and only
      // leave the VTT ones enabled- Safari player might otherwise crash.
      // XXX FIXME TODO
      // console.log('loaded data, tracks:', this.video.textTracks.length);
      // for (var i = 0; i < this.video.textTracks.length; i++) {
      //  this.video.textTracks[i].mode = 'disabled'
      // }
    },
    loadedMetaData () {
    },
    timeUpdate () {
      this.playing = !this.video.paused
      let duration = this.video.duration || 0
      let time = this.video.currentTime || 0
      this.time = util.hhmmss(time, duration >= 3600)
      if (duration) {
        if (this.$refs.progress && this.$refs.progress.clientWidth >= 280) {
          this.time += ' / ' + util.hhmmss(duration)
        }
        this.timePct = 100 * (time / duration)
        if (this.timePct > 100) {
          this.timePct = 100
        }
      }
    },
    stop () {
      this.video.pause()
      this.playing = false
      this.video.currentTime = 5
      this.fullscreen(false)
    },
    play () {
      if (this.video.paused) {
        this.video.play()
      } else {
        this.video.pause()
        this.playing = false
      }
    },
    volume () {
      this.video.volume = this.video.volume > 0 ? 0 : 1
      this.muted = this.video.volume === 0
    },

    keyDown (ev) {
      console.log('keyDown', ev)
      switch (ev.keyCode) {
        case 32: // space
          this.play()
          break
        case 37: // arrowLeft
          this.video.currentTime -= 10
          this.showControls()
          break
        case 38: // arrowUp
          break
        case 39: // arrowRight
          this.video.currentTime += 10
          this.showControls()
          break
        case 40: // arrowDown
          break
        default:
          return
      }
      ev.preventDefault()
      ev.stopPropagation()
    },

    keyUp () {
      return
    },

    subs () {
    },

    fullscreenChanged () {
      if (!util.isFullscreen()) {
        // got out of fullscreen mode, either by user pressing
        // exit-fullscreen button, or hitting the escape key.
        setTimeout(() => { this.$store.commit('VIDEO_FULLSCREEN', false) }, 650)
        this.fullscreen(false)
      }
    },

    fullscreen (what) {
      // set or toggle.
      if (what !== undefined) {
        this.isFullscreen = what
      } else {
        this.isFullscreen = !this.isFullscreen
      }

      let nativeFullscreen = false
      if (util.fullscreenEnabled()) {
        let e = util.fullscreenElement()
        if (e === null || e === this.$refs.main) {
          nativeFullscreen = true
        }
      }

      if (nativeFullscreen) {
        if (this.isFullscreen) {
          if (!util.isFullscreen()) {
            // console.log('request fullscreen')
            this.$store.commit('VIDEO_FULLSCREEN', true)
            util.requestFullscreen(this.$refs.main)
          }
        } else {
          // console.log('exit fullscreen')
          util.exitFullscreen()
          this.maxSize = false
          this.$refs.container.appendChild(this.$refs.main)
        }
        return
      }

      // fullwindow mode.
      if (!this.video.paused) {
        setTimeout(() => { this.video.play() }, 1)
      }
      this.maxSize = this.isFullscreen
      if (this.maxSize) {
        document.getElementsByTagName('BODY')[0].appendChild(this.$refs.main)
      } else {
        this.$refs.container.appendChild(this.$refs.main)
      }
    },

    cleanupFullscreen () {
      // called on exit.
      let e = util.fullscreenElement()
      if (e === this.$refs.main) {
        util.exitFullscreen()
        setTimeout(() => { this.$store.commit('VIDEO_FULLSCREEN', false) }, 650)
      } else {
        this.$store.commit('VIDEO_FULLSCREEN', false)
      }
      this.$refs.container.appendChild(this.$refs.main)
    }
  }
}
</script>

<style lang="scss">
.video-player__container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: black;
}
.video-player__main {
  position: relative;
  width: 100;
  height: 100%;
  video {
    width: 100%  !important;
    height: auto !important;
    max-width: 100%;
    max-height: 100%;
  }
  background: black;
}
.video-player__maxsize {
  position: fixed;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
  background: black;
  z-index: 10;
}
.video-player__controls {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  color: #ddd;
  background-color: rgba(0, 0, 0, 0.6)
}

.video-player__progress {
  display: flex;
  box-sizing: border-box;
  position: relative;
  height: 20px;
  padding-top: 8px;
  padding-bottom: 12px;
  margin-left: 10px;
  margin-right: 10px;
}
.video-player__knob {
  position: absolute;
  top: -4px;
  left: -4px;
  border-radius: 12px;
  background: red;
  height: 0px;
  width: 0px;
}
.video-player__pstart {
  height: 3px;
  background: red;
  flex: 0 0 0%;
}
.video-player__pend {
  position: relative;
  height: 3px;
  background: #ccc;
  flex: 1 1;
}
.video-player__progress:hover {
  .video-player__pstart, .video-player__pend {
    height: 5px;
  }
  .video-player__knob {
    height: 14px;
    width: 14px;
    height: 14px;
    width: 14px;
  }
}

.video-player__buttons {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: baseline;
  margin-left: 10px;
  margin-right: 10px;
}
.video-player__btn {
  flex: 0 0;
  margin-left: 4px;
  margin-right: 4px;
}
.video-player__btn:hover {
  color: white;
  cursor: pointer;
}
.video-player__time {
  margin-left: 4px;
  margin-right: 4px;
}
.video-player__spacer {
  flex: 1 1;
}
.video-player__subs {
  flex: 0 0;
}
.video-player__full {
  flex: 0 0;
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

