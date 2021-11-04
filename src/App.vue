<template>
  <h1>jammer-1</h1>
  <Consumer :api="rootApi" :config="{}" />
  <Consumer :api="authenticateApi" :config="authenticateConfig" />
  <Consumer :api="userApi" :config="{ credentials: 'include' }" />
  <Consumer :api="unauthenticateApi" :config="{ method: 'PUT', credentials: 'include' }" />
</template>

<script>
const {
  VUE_APP_REST_API
} = process.env

import Consumer from '@/components/Consumer'

export default {
  name: 'App',
  components: {
    Consumer
  },
  computed: {
    rootApi () {
      return `${VUE_APP_REST_API}/`
    },
    authenticateApi () {
      return `${VUE_APP_REST_API}/api/v2/authenticate`
    },
    userApi () {
      return `${VUE_APP_REST_API}/api/v2/users/brn`
    },
    unauthenticateApi () {
      return `${VUE_APP_REST_API}/api/v2/unauthenticate`
    },
    authenticateConfig () {
      const formData = new FormData()
      formData.append('username', 'brn')
      formData.append('password', 'brn')
      return {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(formData)
      }
    }
  },
  methods: {

  }
}
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }
</style>
