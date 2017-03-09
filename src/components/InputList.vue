<template>
<span>
  <template v-for="item in items">
    <v-subheader v-if="item.header" v-text="item.header"/>
    <v-divider v-else-if="item.divider" v-bind:inset="item.inset"/>
    <v-list-item v-else>
      <v-list-tile :action="item.icon !== undefined" :avatar="item.avatar !== undefined">
      <v-list-tile-action v-if="item.icon">
        <v-icon>{{ item.icon }}</v-icon>
      </v-list-tile-action>
      <v-list-tile-content>
      <radio name="item.name"
       :label="item.label"
       :value="item.value"
       v-model="model"
       v-if="type === 'radio'" />
      <checkbox
       :name="item.checkbox"
       :label="item.label"
       :value="item.value"
       v-model="model"
       v-if="type === 'checkbox'"" />
      <input
        type="search"
        :placeholder="item.search"
        v-model="model"
        v-if="type === 'search'" />
      </v-list-tile-content>
      <v-list-tile-avatar v-if="item.avatar">
        <v-icon>{{ item.avatar }}</v-icon>
      </v-list-tile-avatar>
      </v-list-tile>
    </v-list-item>
  </template>
</span>
</template>

<script>
import Checkbox from './Checkbox'
import Radio from './Radio'

export default {
  name: 'list-input',
  components: {
    Checkbox,
    Radio
  },
  model: {
    prop: 'vmodel',
    event: 'change'
  },
  props: {
    items: Array,
    dense: { type: String, default: undefined },
    type: String,
    vmodel: [ Array, String, Number ]
  },
  data: () => ({
    model: null
  }),
  watch: {
    model (v) {
      console.log('change', v)
      this.$emit('change', v)
    },
    vmodel (v) {
      this.model = v
    }
  },
  created () {
    this.model = this.vmodel
  },
  methods: {
/*
    clicked (evt, item, ref) {
      if (item.search) {
        let el = this.$refs[ref][0].$el
        let input = el.getElementsByTagName('INPUT')[0]
        input.focus()
      } else {
        this.$emit('click', evt, item)
      }
    }
*/
  }
}
</script>
