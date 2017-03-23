<template>
<div class="poster-row-header" :style="{'font-size': fontSize}" v-html="items.name" />
</template>

<script>
export default {
  name: 'poster-row-header',
  data: () => ({
  }),
  props: {
    items: { type: Object },
    context: { type: Object },
    index: { type: Number }
  },
  computed: {
    fontSize () {
      // console.log('height', this.context.height)
      return Math.floor(this.context.height / 1.3) + 'px'
    }
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style lang="scss">
.poster-row-header {
  width: 100%;
  i {
    display: inline;
  }
}
</style>
