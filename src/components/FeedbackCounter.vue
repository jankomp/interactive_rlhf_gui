<template>
  <div class="feedback-counter">
    {{ givenFeedbacks }} / {{ roundFeedbacks }} total: {{ totalFeedbacks }}
  </div>
</template>

<script>
export default {
  name: 'FeedbackCounter',
  props: {
    givenFeedbacks: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      totalFeedbacks: 0,
      roundFeedbacks: 0
    }
  },
  methods: {
    fetchRoundFeedbacks() {
      fetch('http://localhost:5000/round_feedbacks')
        .then(response => response.json())
        .then(data => {
          this.roundFeedbacks = data.round_feedbacks;
        });
    }
  },
  mounted() {
    this.fetchRoundFeedbacks();
    fetch('http://localhost:5000/total_feedbacks')
      .then(response => response.json())
      .then(data => {
        this.totalFeedbacks = data.total_feedbacks;
      });
  },
  watch: {
    totalFeedbacks() {
      this.$emit('totalFeedbacksUpdated', this.totalFeedbacks);
    }
  }
}
</script>

<style scoped>

</style>