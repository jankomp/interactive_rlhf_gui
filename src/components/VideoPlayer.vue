<template>
  <div id="app" style="display: flex; justify-content: center; gap: 20px;">
    <video ref="video1" controls :src="video1" width="400" @ended="waitAndLoop" @loadedmetadata="setPlaybackRate" autoplay
      muted></video>
    <video ref="video2" controls :src="video2" width="400" @ended="waitAndLoop" @loadedmetadata="setPlaybackRate" autoplay
      muted></video>
  </div>
</template>

<script>
export default {
  data() {
    return {
      video1: '',
      video2: '',
      lastEventData: null,
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
    handleEvent(event) {
      const videos = JSON.parse(event.data);
      if (videos === null) {
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
        }
      } else {
        if (videos[0] === "" && videos[1] === "") {
          this.changeBlockingMessage('Please wait while we generate new behaviors...');
          this.noVideoReceived();
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
        video.currentTime = 0; // Reset the video to the beginning
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
  }
};
</script>

<style scoped></style>