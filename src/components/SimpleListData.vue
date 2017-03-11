<template>
<v-list :dense="dense !== undefined">
  <template v-for="(item, index) in items">
    <v-subheader v-if="item.header !== undefined" v-text="item.header"/>
    <v-divider v-else-if="item.divider" v-bind:inset="item.inset"/>
    <v-list-item v-else>
      <v-list-tile
        :href="item.href"
        :router="item.href !== undefined"
        :action="item.icon !== undefined"
        :avatar="item.avatar !== undefined"
        @click.native="clicked($event, item, 'list_ref_' + index)">
        <v-list-tile-action v-if="item.icon !== undefined">
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-tile-action>
        <v-list-tile-content>
          <radio name="item.radio"
           :label="item.label"
           :value="item.value"
           v-model="radiovalue"
           v-if="item.radio !== undefined"/>
          <checkbox
           :name="item.checkbox"
           :label="item.label"
           :value="item.value"
           v-model="checkboxarray"
           v-if="item.checkbox !== undefined"/>
          <v-list-tile-title v-text="item.title" v-if="item.title !== undefined"/>
          <v-text-input
            type="search"
            :placeholder="item.search"
            v-if="item.search !== undefined"
            :ref="'list_ref_' + index" />
        </v-list-tile-content>
        <v-list-tile-avatar v-if="item.avatar !== undefined">
          <v-icon>{{ item.avatar }}</v-icon>
        </v-list-tile-avatar>
      </v-list-tile>
    </v-list-item>
  </template>
</v-list>
</template>

<script>
import Checkbox from './Checkbox'
import Radio from './Radio'

export default {
  name: 'simple-list-data',
  components: {
    Checkbox,
    Radio
  },
  props: {
    items: { type: Array },
    dense: { type: String, default: undefined }
  },
  data: () => ({
    checkboxarray: [],
    radiovalue: 'name'
  }),
  watch: {
    checkboxarray (a) {
      // console.log('checkboxarray watch', a)
    },
    radiovalue (a) {
      // console.log('radiovalue watch', a)
    }
  },
  methods: {
    clicked (evt, item, ref) {
      if (item.search) {
        let el = this.$refs[ref][0].$el
        let input = el.getElementsByTagName('INPUT')[0]
        input.focus()
      } else {
        this.$emit('click', evt, item)
      }
    }
  }
}
</script>
