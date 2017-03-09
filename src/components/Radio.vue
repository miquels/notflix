<template>
<span class="radio-container">
  <input type="radio"
   :id="id"
   :name="name"
   :value="value"
   :checked="checked"
   @change="change($event)">
  <label :for="id">{{ label }}</label>
</span>
</template>

<script>
export default {
  name: 'radio',
  model: {
    prop: 'vmodel',
    event: 'change'
  },
  props: {
    name: String,
    label: String,
    value: String,
    vmodel: [ String, Number ]
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
      this.checked = this.vmodel === this.value
    },
    change (ev) {
      let checked = ev.target.checked
      if (checked) {
        this.$emit('change', this.value)
      }
    }
  }
}
</script>

<style lang="scss">
.radio-container {
  display: inline-block;
  width: 100%;
  input[type='radio'] {
    display: block;
    height: 0;
    width: 0;
    opacity: 0;
    overflow: hidden;
  }
  input[type='radio'] + label {
    border-left: 2px solid rgba(0, 0, 0, 0);
    display: inline-block;
  }
  input[type='radio']:checked + label {
    border-left: 2px solid #fff;
    color: #eee;
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
