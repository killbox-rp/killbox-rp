<template>
  <div>
    <button @click="onClick">
      <span v-if="!busy">consume</span>
      <span v-if="busy">busy</span>
    </button> &nbsp; {{api}}
    <pre>config={{config}}</pre>
    <pre v-if="error" class="error">error={{error}}</pre>
    <pre>response={{response}}</pre>
  </div>
</template>

<script>
export default {
  name: 'Consumer',
  props: {
    config: Object,
    api: String
  },
  data () {
    return {
      busy: false,
      error: null,
      response: null
    }
  },
  methods: {
    async onClick () {
      this.busy = true
      this.error = null
      try {
        const response = await fetch(this.api, this.config)
        this.response = await response.json()
      } catch (error) {
        this.error = error
      }
      this.busy = false
    }
  }
}
</script>

<style scoped>
  div {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ddd;
  }
  pre {
    border: 1px solid #ccc;
    background-color: #eee;
    padding: 15px;
  }
  pre.error {
    border: 1px solid rgb(207, 174, 174);
    background-color: rgb(238, 217, 217);
    color: rgb(32, 4, 4);
    padding: 15px;
  }

</style>
