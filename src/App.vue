<template>
  <div id="app">
    <div v-if="!isInputAllowed" class="overlay">
      <p>{{ blockingMessage }}</p>
    </div>
    <VideoPlayer @videoReceived="handleVideoReceived" @changeBlockingMessage="handleChangeBlockingMessage" />
    <KeyPad :isInputAllowed="isInputAllowed" @inputSent="handleInputSent" />
  </div>
</template>

<script>
import KeyPad from './components/KeyPad.vue'
import VideoPlayer from './components/VideoPlayer.vue'

export default {
  name: 'App',
  components: {
    VideoPlayer,
    KeyPad,
  },
  data() {
    return {
      isInputAllowed: true,
      blockingMessage: 'Waiting for videos...'
    }
  },
  methods: {
    handleInputSent() {
      this.isInputAllowed = false;
    },
    handleVideoReceived() {
      this.isInputAllowed = true;
    },
    handleChangeBlockingMessage(message) {
      this.blockingMessage = message;
    }
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay p {
  color: white;
  font-size: 2em;
}
</style>