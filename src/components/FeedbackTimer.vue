<template>
    <div>
        Time elapsed: {{ (timeElapsed / 1000).toFixed(2) }} seconds
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
            timeElapsed: 0
        };
    },
    methods: {
        resumeTimer() {
            this.startTime = Date.now() - this.timeElapsed;
            this.timer = setInterval(() => {
                this.timeElapsed = Date.now() - this.startTime;
            }, 100);
            this.resumeTimerEvent();
        },
        pauseTimer() {
            clearInterval(this.timer);
            this.timer = null;
            this.timeElapsed = Date.now() - this.startTime;
            this.pauseTimerEvent();
        },
        resumeTimerEvent() {
            this.$emit('resumeTimerEvent');
        },
        pauseTimerEvent() {
            this.$emit('pauseTimerEvent');
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