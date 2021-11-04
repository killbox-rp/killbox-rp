<template>
  <div :class="{
    'consumer': true,
    'http-busy': busy,
    'http-200': httpResponse && httpResponse.status === 200,
    'http-500': error
  }">
    <button @click="onClick">
      <span v-if="!busy">consume</span>
      <span v-if="busy">busy</span>
    </button> &nbsp; <span class="code link">{{api}}</span>
    <pre>config={{config}}</pre>
    <span v-if="dirty" class="code" :class="{
      'consumer': true,
      'http-busy': busy,
      'http-200': httpResponse && httpResponse.status === 200,
      'http-500': error
    }">Status {{httpResponse.status}} {{httpResponse.statusText}}</span>
    <pre v-if="error" class="error">error={{error}}\n</pre>
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
      dirty: false,
      error: null,
      response: null,
      httpResponse: {
        status: null,
        statusText: null,
        redirected: null
      }
    }
  },
  methods: {
    async onClick () {
      this.busy = true
      this.error = null
      this.dirty = true
      try {
        const response = await fetch(this.api, this.config)
        this.httpResponse = response
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
  div.consumer {
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
  div.http-busy {
    border: 1px solid yellow;
  }
  div.http-200 {
    border: 1px solid lime;
  }
  div.http-500 {
    border: 1px solid red;
  }
  .code {
    font-family: monospace;
  }
  span.http-busy {
    color: yellow;
  }
  span.http-200 {
    color: lime;
  }
  span.http-500 {
    color: red;
  }
  .link {
    color: rgb(30, 30, 182);
  }
</style>
