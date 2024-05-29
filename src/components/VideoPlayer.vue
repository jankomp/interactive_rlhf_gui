<template>
  <div id="app" style="display: flex; justify-content: center; gap: 20px;">
    <video ref="video1" controls :src="video1" width="400" @ended="addPause" autoplay loop></video>
    <video ref="video2" controls :src="video2" width="400" @ended="addPause" autoplay loop></video>
  </div>
</template>

<script>
export default {
  data() {
    return {
      video1: '',
      video2: '',
      lastEventData: null
    };
  },
  methods: {
    handleEvent(event) {
      const videos = JSON.parse(event.data);
      if (videos.toString() !== this.lastEventData) {
        this.video1 = `http://localhost:5000/videos/${videos[0]}`;
        this.video2 = `http://localhost:5000/videos/${videos[1]}`;
        this.lastEventData = videos.toString();
      }
    },
    addPause(event) {
      event.target.pause();
      setTimeout(() => {
        event.target.play();
      }, 1000);
    }
  },
  mounted() {
    this.$refs.video1.playbackRate = 0.5;
    this.$refs.video2.playbackRate = 0.5;

    const eventSource = new EventSource('http://localhost:5000/stream');
    eventSource.onmessage = this.handleEvent;
  }
};
</script>

<style scoped></style>