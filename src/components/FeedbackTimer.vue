<template>
    <div>
        Time elapsed: {{ (timeElapsed / 1000).toFixed(2) }} seconds
        <button @click="togglePause">{{ paused ? '▶' : '||' }}</button>
    </div>
</template>

<script>
export default {
    name: 'FeedbackTimer',
    props: ['feedbackTime'],
    data() {
        return {
            timer: null,
            startTime: null,
            timeElapsed: 0,
            paused: false,
        };
    },
    methods: {
        async resumeTimer() {
            if (this.timer !== null) {
                clearInterval(this.timer);
            }

            try {
                const response = await fetch('http://localhost:5000/resume');
                const data = await response.json();
                this.timeElapsed = data.timeElapsed * 1000;
                this.startTime = Date.now() - this.timeElapsed;
               if (this.feedbackTime && !this.paused) {
                    this.timer = setInterval(() => {
                        this.timeElapsed = Date.now() - this.startTime;
                    }, 100);
                }
                this.resumeTimerEvent();
            } catch (error) {
                console.error('Error:', error);
            }
        },
        async pauseTimer() {
            clearInterval(this.timer);
            this.timer = null;
            try {
                const response = await fetch('http://localhost:5000/pause');
                const data = await response.json();
                this.timeElapsed = data.timeElapsed * 1000;
            } catch (error) {
                console.error('Error:', error);
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
        async mounted() {
            try {
                const response = await fetch('http://localhost:5000/feedback_time');
                const data = await response.json();
                this.timeElapsed = data.timeElapsed * 1000;
            } catch (error) {
                console.error('Error:', error);
            }
        },
    },
    watch: {
        feedbackTime(newVal) {
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