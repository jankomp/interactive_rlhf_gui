<template>
  <div id="app">

    <div class="groupwise-comparison" v-if="$feedback === 'group'">
      <!-- <EmbeddingView ref="embeddingView" class="embedding-view" @group1Updated="handleGroup1Updated" @group2Updated="handleGroup2Updated"
        @fragmentsReceived="handleVideoReceived" @feedbackComplete="handleInputSent" /> -->
      <div class="exploration-component">
        <RadialHierarchy ref="radialHierarchy" class="hierarchical-view" @group1Updated="handleGroup1Updated"
          :chart-size="1000" @group2Updated="handleGroup2Updated" @fragmentsReceived="handleVideoReceived"
          @feedbackComplete="handleInputSent" @suggestionDataLoaded="handleSuggestionDataLoaded"
          :numberOfSuggestions="numberOfSuggestions" :beta="beta" />
        <SliderInput class="full-width-slider" :sliderValueName="'Number of Suggestions'" :scaleFactor="1"
          :minSliderValue="1" :maxSliderValue="totalNumberOfSuggestions" :initialValue="numberOfSuggestions"
          :logarithmic="true" @sliderValueChanged="handleNumberOfSuggestionsChange" />
        <SliderInput class="full-width-slider" :sliderValueName="'Beta (Bundling strength)'" :scaleFactor="100"
          :minSliderValue="0.0" :maxSliderValue="0.99" :initialValue="0.85" :logarithmic="false"
          @sliderValueChanged="handleBetaChange" />
      </div>
      <VideoGroupPlayer class="video-group-player" :videoGroup="group1" @removeVideo="handleGroup1RemoveVideo" :leftGroup="true" @changeGroups="handleChangeGroup1"/>
      <GroupKeyPad @keyPressed="handleGroupKeyPressed" :isInputAllowed="isInputAllowed" />
      <VideoGroupPlayer class="video-group-player" :videoGroup="group2" @removeVideo="handleGroup2RemoveVideo" :leftGroup="false" @changeGroups="handleChangeGroup2"/>
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
import RadialHierarchy from './components/RadialHierarchy.vue'
import SliderInput from './components/SliderInput.vue'
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
    RadialHierarchy,
    SliderInput,
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
      preferences: [],
      numberOfSuggestions: 10,
      totalNumberOfSuggestions: 100,
      beta: 0.85,
    }
  },
  methods: {
    updatePreferences(preference) {
      this.preferences = [];
      this.group1.forEach(point1 => {
        this.group2.forEach(point2 => {
          this.preferences.push({
            id1: point1.id,
            id2: point2.id,
            preference: preference,
          });
        });
      });
      this.$refs.radialHierarchy.updatePreferences(this.preferences);
    },
    handleGroupKeyPressed(key) {
      if (!this.isInputAllowed || this.group1.length === 0 || this.group2.length === 0) {
        return;
      }
      const data = {
        group1: this.group1.map(video => video.id),
        group2: this.group2.map(video => video.id),
        preference: key,
      };

      axios.post('http://localhost:5000/preference', data)
        .then(response => {
          this.updatePreferences(key == 'ArrowLeft' ? 1.0 : (key == 'ArrowRight' ? 0.0 : 0.5));
          this.feedbackCount = response.data.feedback_count;
          this.group1 = [];
          this.group2 = [];
          this.$refs.radialHierarchy.setGroup1([]);
          this.$refs.radialHierarchy.setGroup2([]);
        })
        .catch(error => {
          console.error('Error:', error);
        });
    },
    handleGroup1RemoveVideo(id) {
      this.group1 = this.group1.filter(video => video.id !== id);
      this.$refs.radialHierarchy.setGroup1(this.group1);
    },
    handleGroup2RemoveVideo(id) {
      this.group2 = this.group2.filter(video => video.id !== id);
      this.$refs.radialHierarchy.setGroup2(this.group2);
    },
    handleChangeGroup1(newVideo) {
      this.group1 = this.group1.filter(video => video.id !== newVideo.id);
      this.$refs.radialHierarchy.setGroup1(this.group1);
      this.group2.push(newVideo)
      this.$refs.radialHierarchy.setGroup2(this.group2);
    },
    handleChangeGroup2(newVideo) {
      this.group2 = this.group2.filter(video => video.id !== newVideo.id);
      this.$refs.radialHierarchy.setGroup2(this.group2);
      this.group1.push(newVideo)
      this.$refs.radialHierarchy.setGroup1(this.group1);
    },
    handleInputSent() {
      this.isInputAllowed = false;
      this.preferences = [];
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
      if (this.$refs.radialHierarchy) {
        this.$refs.radialHierarchy.pauseStream();
      }
    },
    handleResumeTimer() {
      this.blockingMessage = 'Waiting for videos...';
      this.isInputAllowed = true;
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.resumeStream();
      }
      if (this.$refs.radialHierarchy) {
        this.$refs.radialHierarchy.resumeStream();
      }
    },
    handleGroup1Updated(group1) {
      this.group1 = group1;
    },
    handleGroup2Updated(group2) {
      this.group2 = group2;
    },
    handleNumberOfSuggestionsChange(newVal) {
      this.numberOfSuggestions = newVal;
    },
    handleSuggestionDataLoaded(newTotalNumberOfSuggestions) {
      this.totalNumberOfSuggestions = newTotalNumberOfSuggestions;
    },
    handleBetaChange(newBeta) {
      this.beta = newBeta;
    }
  },
}
</script>

<style scoped>
.embedding-view {
  min-height: 80vh;
}

.hierarchical-view {
  min-width: 75vh;
  min-height: 80vh;
}

.exploration-component {
  display: flex;
  flex-direction: column;
}

.full-width-slider {
  width: 100%;
}

.groupwise-comparison {
  display: flex;
}

.video-group-player {
  min-width: 610px;
}

.timer {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1001;
}

.feedback-counter {
  position: fixed;
  bottom: 10px;
  left: 10px;
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