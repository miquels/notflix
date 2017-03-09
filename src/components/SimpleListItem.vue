<template>
<v-list-item>
  <v-list-tile :href="href" :router="href !== undefined" @click.native="clicked($event)">
    <v-list-tile-action v-if="icon !== undefined">
      <v-icon>{{icon}}</v-icon>
    </v-list-tile-action>
    <v-list-tile-content>
      <v-list-tile-title v-text="title" />
    </v-list-tile-content>
  </v-list-tile>
</v-list-item>
</template>

<script>
export default {
  name: 'simple-list-item',
  props: {
    href: { type: String, default: undefined },
    icon: { type: String, default: undefined },
    title: { type: String, default: '' }
  },
  methods: {
    clicked (evt) {
      this.$emit('click', evt)
    }
  }
}
</script>
