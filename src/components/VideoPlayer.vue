<template>
  <div id="app" style="display: flex; justify-content: center; gap: 20px;">
    <video ref="video1" :src="video1" width="400" @ended="waitAndLoop" @loadedmetadata="setPlaybackRate" autoplay muted></video>
    <video ref="video2" :src="video2" width="400" @ended="waitAndLoop" @loadedmetadata="setPlaybackRate" autoplay muted></video>
  </div>
</template>

<script>
export default {
  data() {
    return {
      video1: '',
      video2: '',
      lastEventData: ',',
      feedbackReceived: false,
      eventSource: null
    };
  },
  methods: {
    receiveVideo() {
      this.feedbackReceived = false;
      this.$emit('videoReceived');
    },
    noVideoReceived() {
      this.$emit('noVideoReceived');
    },
    changeBlockingMessage(message) {
      this.$emit('changeBlockingMessage', message);
    },
    feedBackRoundStart() {
      this.$emit('feedbackRoundStart');
    },
    handleEvent(event) {
      const eventData = JSON.parse(event.data);
      const videos = eventData.videos;
      const progress = eventData.progress;
      if (videos === null) {
        this.$emit('loadingProgress', progress);
        return;
      }
      if (videos.toString() !== this.lastEventData) {
        this.video1 = `http://localhost:5000/videos/${videos[0]}`;
        this.video2 = `http://localhost:5000/videos/${videos[1]}`;
        this.lastEventData = videos.toString();
        if (videos[0] !== "" && videos[1] !== "") {
          this.changeBlockingMessage('Waiting for videos...');
          this.receiveVideo();
        } else {
          this.changeBlockingMessage('Please wait while we generate new behaviors...');
          this.$emit('loadingProgress', progress);
        }
      } else {
        if (videos[0] === "" && videos[1] === "") {
          this.changeBlockingMessage('Please wait while we generate new behaviors...');
          this.noVideoReceived();
          this.$emit('loadingProgress', progress);
        }
      }
    },
    waitAndLoop(event) {
      const video = event.target;
      video.pause();
      video.oncanplay = () => {
        video.play();
      };
      video.onerror = () => {
        console.error('Error while loading the video');
      };
      setTimeout(() => {
        video.currentTime = 0;
        video.play();
      }, 1000);
    },
    setPlaybackRate(event) {
      event.target.playbackRate = 0.5;
    },
    pauseStream() {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    },
    resumeStream() {
      if (!this.eventSource) {
        this.eventSource = new EventSource('http://localhost:5000/stream');
        this.eventSource.onmessage = this.handleEvent;
      }
    },
  },
  mounted() {
    this.resumeStream();
  },
  watch: {
    lastEventData(newVal, oldVal) {
      if (oldVal === ',' && newVal !== ',') {
        this.feedBackRoundStart();
      }
    }
  },
};
</script>

<style scoped></style>