<template>
<span class="checkbox-container">
  <input type="checkbox"
   :id="id"
   :name="name"
   :value="value"
   :checked="checked"
   @change="change($event)"/>
  <label :for="id">{{ label }}</label>
</span>
</template>

<script>
export default {
  name: 'checkbox',
  model: {
    prop: 'vmodel',
    event: 'change'
  },
  props: {
    name: String,
    label: String,
    value: String,
    vmodel: Array
  },
  data: () => ({
    checked: false
  }),
  watch: {
    vmodel () {
      this.update()
    }
  },
  mounted () {
    this.update()
  },
  computed: {
    id () {
      return this._uid + '_' + this.name
    }
  },
  methods: {
    update () {
      this.checked = this.vmodel.indexOf(this.value) >= 0
    },
    change (ev) {
      let checked = ev.target.checked
      let vmodel = this.vmodel.slice()
      let i = vmodel.indexOf(this.value)
      if (checked && i < 0) {
        vmodel.push(this.value)
      }
      if (!checked && i >= 0) {
        vmodel.splice(i, 1)
      }
      this.$emit('change', vmodel)
    }
  }
}
</script>

<style lang="scss">
.checkbox-container {
  display: inline-block;
  width: 100%;
  input[type='checkbox'] {
    display: block;
    height: 0;
    width: 0;
    opacity: 0;
    overflow: hidden;
  }
  input[type='checkbox'] + label {
    border-left: 2px solid rgba(0, 0, 0, 0);
    display: inline-block;
  }
  input[type='checkbox']:checked + label {
    border-left: 2px solid #fff;
    color: #ffffff;
    display: inline-block;
  }
  label {
    width: 100%;
    padding-left: 7px;
  }
  label:hover {
    cursor: pointer;
  }
}
</style>
