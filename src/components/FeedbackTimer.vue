<template>
    <div>
        Time elapsed: {{ (timeElapsed / 1000).toFixed(2) }} seconds
        <button @click="togglePause">{{ paused ? '▶' : '||' }}</button>
    </div>
</template>

<script>
export default {
    name: 'FeedbackTimer',
    props: ['isInputAllowed'],
    data() {
        return {
            timer: null,
            startTime: null,
            timeElapsed: 0,
            paused: false,
        };
    },
    methods: {
        resumeTimer() {
            if (this.timer !== null) {
                clearInterval(this.timer);
            }
            this.startTime = Date.now() - this.timeElapsed;
            this.timer = setInterval(() => {
                this.timeElapsed = Date.now() - this.startTime;
            }, 100);
            this.resumeTimerEvent();
        },
        pauseTimer() {
            clearInterval(this.timer);
            this.timer = null;
            if (this.startTime !== null && this.startTime !== 0) {
                this.timeElapsed = Date.now() - this.startTime;
            }
            if (this.paused) {
                this.pauseTimerEvent();
            }
        },
        resumeTimerEvent() {
            this.$emit('resumeTimerEvent');
        },
        pauseTimerEvent() {
            this.$emit('pauseTimerEvent');
        },
        togglePause() {
            this.paused = !this.paused;
            if (this.paused) {
                this.pauseTimer();
            } else {
                this.resumeTimer();
            }
        },
    },
    watch: {
        isInputAllowed(newVal) {
            if (newVal) {
                this.resumeTimer();
            } else {
                this.pauseTimer();
            }
        },
    },
    beforeUnmount() {
        this.pauseTimer();
    }
};
</script>