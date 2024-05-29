<template>
  <div id="app">
    <VideoPlayer />
    <KeyPad />
  </div>
</template>

<script>
import VideoPlayer from './components/VideoPlayer.vue'
import KeyPad from './components/KeyPad.vue'

export default {
  components: {
    VideoPlayer,
    KeyPad,
  }
}
</script>

<style scoped>
</style>