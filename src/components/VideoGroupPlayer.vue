<template>
    <div id="app" class="video-group">
        <video v-for="video in videoGroup" :key="video.id" ref="video" controls :src="getVideoUrl(video.video_path)"
            width="400" @ended="waitAndLoop" @loadedmetadata="setPlaybackRate" autoplay muted></video>
    </div>
</template>

<script>
export default {
    props: {
        videoGroup: {
            type: Array,
            required: true
        }
    },
    methods: {
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
        getVideoUrl(path) {
            return `http://localhost:5000/videos/${path}`;
        }
    }
};
</script>

<style scoped>
.video-group {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 100vh;
    overflow-y: auto;
}
</style>