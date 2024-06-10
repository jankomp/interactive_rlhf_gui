<template>
    <div id="app" class="video-group">
        <div v-for="video in videoGroup" :key="video.id" class="video-container">
            <button class="close-button" @click="removeVideo(video.id)">x</button>
            <video ref="video" controls :src="getVideoUrl(video.video_path)"
                width="400" @ended="waitAndLoop" @loadedmetadata="setPlaybackRate" autoplay muted></video>
        </div>
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
        removeVideo(id) {
            console.log('Removing video with id:', id);
            this.$emit('removeVideo', id);
        },
        waitAndLoop(event) {
            const video = event.target;
            video.pause();
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

.video-container {
    position: relative;
}

.close-button {
    position: absolute;
    top: 0;
    right: 0;
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 1;
}
</style>