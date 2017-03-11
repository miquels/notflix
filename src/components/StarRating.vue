<template>
<span class="material-icons" v-html="stars" />
</template>

<script>
export default {
  name: 'star-rating',
  props: {
    rating: { type: Number, default: 0 }
  },
  computed: {
    stars () {
      let r = Math.round(this.rating)
      let s = ''
      for (let i = 0; i < 10; i += 2) {
        if (r > i + 1) {
          s += '&#xE838;'
        } else if (r > i) {
          s += '&#xE839;'
        } else {
          s += '&#xE83A;'
        }
      }
      return s
    }
  }
}
</script>
