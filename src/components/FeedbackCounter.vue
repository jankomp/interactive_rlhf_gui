<template>
  <div class="feedback-counter">
    Given Feedbacks: {{ givenFeedbacks }} <!--  total: {{ totalFeedbacks }} -->
  </div>
</template>

<script>
export default {
  name: 'FeedbackCounter',
  props: {
    givenFeedbacks: {
      type: Number,
      required: true
    },
  },
  data() {
    return {
      totalFeedbacks: 0,
    }
  },
  methods: {

  },
  mounted() {
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

<style scoped></style>