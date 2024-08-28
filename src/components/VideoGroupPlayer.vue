<template>
    <div id="app" class="video-group" :class="{ 'left-group': leftGroup }">
        <div v-for="video in videoGroup" :key="video.id" class="video-container">
            <button class="close-button" @click="removeVideo(video.id)" title="Remove fragment">x</button>
            <button class="group-change-button" :class="{ 'right-arrow': leftGroup, 'left-arrow': !leftGroup }"
                @click="changeGroups(video)" title="Switch groups">
                <span v-if="leftGroup">&gt;</span>
                <span v-else>&lt;</span>
            </button>
            <video ref="video" :src="getVideoUrl(video.video_path)" width="300" @ended="waitAndLoop"
                @loadedmetadata="setPlaybackRate" @error="handleVideoError" autoplay muted
                @mouseover="handleMouseOver(video.id)" @mouseout="handleMouseOut()"></video>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        videoGroup: {
            type: Array,
            required: true
        },
        leftGroup: {
            type: Boolean,
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
                if (document.body.contains(video) && video) {
                    video.currentTime = 0;
                    video.play();
                }
            }, 1000);
        },
        setPlaybackRate(event) {
            event.target.playbackRate = 0.5;
        },
        getVideoUrl(path) {
            return `http://localhost:5000/videos/${path}`;
        },
        handleVideoError(event) {
            console.error('Error while fetching the video:', event);
        },
        changeGroups(video) {
            this.$emit('changeGroups', video);
        },
        handleMouseOver(index) {
            this.$emit('videoHover', index);
        },
        handleMouseOut() {
            this.$emit('videoHover', null);
        },
    }
};
</script>

<style scoped>
.video-group {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 10px;
    row-gap: 5px;
    align-content: start;
    max-height: 100vh;
    overflow-y: auto;
    direction: ltr;
}

.left-group {
    direction: rtl ;
}

.video-container {
    position: relative;
    width: 100%;
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

video {
    margin: 0;
    padding: 0;
}

.group-change-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 1;
}

.right-arrow {
    right: 0;
}

.left-arrow {
    left: 0;
}
</style>