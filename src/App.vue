<template>
  <div id="app">
    <FeedbackTimer class="timer" :isInputAllowed="isInputAllowed"/>
    <div v-if="!isInputAllowed" class="overlay">
      <p>{{ blockingMessage }}</p>
    </div>
    <VideoPlayer ref="videoPlayer" @videoReceived="handleVideoReceived" @changeBlockingMessage="handleChangeBlockingMessage" />
    <KeyPad :isInputAllowed="isInputAllowed" @inputSent="handleInputSent" @feedbackCountUpdated="handleFeedbackCountUpdated"/>
    <FeedbackCounter class="feedback-counter" :givenFeedbacks="feedbackCount" />
  </div>
</template>

<script>
import KeyPad from './components/KeyPad.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import FeedbackTimer from './components/FeedbackTimer.vue'
import FeedbackCounter from './components/FeedbackCounter.vue';

export default {
  name: 'App',
  components: {
    FeedbackTimer,
    VideoPlayer,
    KeyPad,
    FeedbackCounter,
  },
  data() {
    return {
      isInputAllowed: false,
      blockingMessage: 'Waiting for videos...',
      feedbackCount: 0
    }
  },
  methods: {
    handleInputSent() {
      this.isInputAllowed = false;
      this.$refs.videoPlayer.feedbackReceived = true;
    },
    handleVideoReceived() {
      this.isInputAllowed = true;
    },
    handleChangeBlockingMessage(message) {
      this.blockingMessage = message;
    },
    handleFeedbackCountUpdated(feedbackCount) {
      this.feedbackCount = feedbackCount;
    },
  }
}
</script>

<style scoped>
.timer {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1001;
}

.feedback-counter {
  position: fixed;
  bottom: 10px;
  right: 10px;
  z-index: 1001;
}
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