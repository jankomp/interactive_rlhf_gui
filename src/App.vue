<template>
  <div id="app">

    <div class="groupwise-comparison" v-if="$feedback === 'group'">
      <EmbeddingView ref="embeddingView" class="embedding-view" @group1Updated="handleGroup1Updated" @group2Updated="handleGroup2Updated"
        @fragmentsReceived="handleVideoReceived" @feedbackComplete="handleInputSent" />
      <VideoGroupPlayer class="video-group-player" :videoGroup="group1" @removeVideo="handleGroup1RemoveVideo"/>
      <GroupKeyPad @keyPressed="handleGroupKeyPressed" :isInputAllowed="isInputAllowed" @removeVideo="handleGroup2RemoveVideo"/>
      <VideoGroupPlayer class="video-group-player" :videoGroup="group2" />
    </div>
    <div class="pairwise-comparison" v-if="$feedback === 'pairwise'">
      <VideoPlayer ref="videoPlayer" @videoReceived="handleVideoReceived" @noVideoReceived="handleNoVideoReceived"
        @changeBlockingMessage="handleChangeBlockingMessage" />
      <KeyPad :isInputAllowed="isInputAllowed" @inputSent="handleInputSent"
        @feedbackCountUpdated="handleFeedbackCountUpdated" />
    </div>
    <div v-if="!isInputAllowed" class="overlay">
      <p>{{ blockingMessage }}</p>
    </div>
    <FeedbackTimer class="timer" :isInputAllowed="isInputAllowed" @pauseTimerEvent="handlePauseTimer"
      @resumeTimerEvent="handleResumeTimer" />
    <FeedbackCounter ref="feedbackCounter" class="feedback-counter" :givenFeedbacks="feedbackCount" />
  </div>
</template>

<script>
import EmbeddingView from './components/EmbeddingView.vue'
import GroupKeyPad from './components/GroupKeyPad.vue'
import VideoGroupPlayer from './components/VideoGroupPlayer.vue'
import KeyPad from './components/KeyPad.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import FeedbackTimer from './components/FeedbackTimer.vue'
import FeedbackCounter from './components/FeedbackCounter.vue';
import axios from 'axios';

export default {
  name: 'App',
  components: {
    EmbeddingView,
    GroupKeyPad,
    VideoGroupPlayer,
    KeyPad,
    VideoPlayer,
    FeedbackTimer,
    FeedbackCounter,
  },
  data() {
    return {
      isInputAllowed: false,
      blockingMessage: 'Waiting for videos...',
      feedbackCount: 0,
      group1: [],
      group2: [],
    }
  },
  methods: {
    handleGroupKeyPressed(key) {
      const data = {
        group1: this.group1.map(video => video.id),
        group2: this.group2.map(video => video.id),
        preference: key,
      };

      axios.post('http://localhost:5000/preference', data)
        .then(response => {
          this.feedbackCount = response.data.feedback_count;
          this.group1 = [];
          this.group2 = [];
          this.$refs.embeddingView.setGroup1([]);
          this.$refs.embeddingView.setGroup2([]);
        })
        .catch(error => {
          console.error('Error:', error);
        });
    },
    handleGroup1RemoveVideo(id) {
      this.group1 = this.group1.filter(video => video.id !== id);
      this.$refs.embeddingView.setGroup1(this.group1);
    },
    handleGroup2RemoveVideo(id) {
      this.group2 = this.group2.filter(video => video.id !== id);
      this.$refs.embeddingView.setGroup2(this.group2);
    },
    handleInputSent() {
      this.isInputAllowed = false;
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.feedbackReceived = true;
      }
    },
    handleVideoReceived() {
      this.isInputAllowed = true;
    },
    handleNoVideoReceived() {
      this.isInputAllowed = false;
    },
    handleChangeBlockingMessage(message) {
      if (this.feedbackCount !== this.$refs.feedbackCounter.totalFeedbacks) {
        this.blockingMessage = message;
      }
    },
    handleFeedbackCountUpdated(feedbackCount) {
      this.feedbackCount = feedbackCount;
      if (this.feedbackCount === this.$refs.feedbackCounter.totalFeedbacks) {
        this.blockingMessage = 'Thank you for your feedbacks!';
      }
    },
    handlePauseTimer() {
      this.blockingMessage = 'Paused';
      this.isInputAllowed = false;
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.pauseStream();
      }
    },
    handleResumeTimer() {
      this.blockingMessage = 'Waiting for videos...';
      this.isInputAllowed = true;
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.resumeStream();
      }
    },
    handleGroup1Updated(group1) {
      this.group1 = group1;
      console.log('Group 1 updated:', group1);
    },
    handleGroup2Updated(group2) {
      this.group2 = group2;
      console.log('Group 2 updated:', group2);
    },
  },
}
</script>

<style scoped>
.embedding-view {
    min-height: 80vh;
  }
.groupwise-comparison {
  display: flex;
}

.video-group-player {
  min-width: 400px;
}

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