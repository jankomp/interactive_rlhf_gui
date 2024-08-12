<template>
    <div>
        Time elapsed: {{ formattedTimeElapsed }} of {{ formattedRoundTimeLimit }}
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
            roundTimeLimit: 0,
        };
    },
    computed: {
        formattedTimeElapsed() {
            return this.formatTime(this.timeElapsed);
        },
        formattedRoundTimeLimit() {
            return this.formatTime(this.roundTimeLimit);
        },
    },
    methods: {
        formatTime(timeInMilliseconds) {
            const seconds = Math.floor((timeInMilliseconds / 1000) % 60);
            const minutes = Math.floor((timeInMilliseconds / (1000 * 60)) % 60);

            const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

            return `${formattedMinutes}:${formattedSeconds}`;
        },
        async resumeTimer() {
            if (this.timer !== null) {
                clearInterval(this.timer);
            }

            try {
                const response = await fetch('http://localhost:5000/resume');
                const data = await response.json();
                this.timeElapsed = data.timeElapsed * 1000;
                this.roundTimeLimit = data.roundTimeLimit * 1000;
                this.startTime = Date.now() - this.timeElapsed;
                if (this.feedbackTime && !this.paused) {
                    this.timer = setInterval(() => {
                        const newTimeElapsed = Date.now() - this.startTime;
                        this.timeElapsed = newTimeElapsed > this.roundTimeLimit ? this.roundTimeLimit : newTimeElapsed;
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
                this.roundTimeLimit = data.roundTimeLimit * 1000;
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
                this.roundTimeLimit = data.roundTimeLimit * 1000;
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