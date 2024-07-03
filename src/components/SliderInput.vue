<template>
  <div class="slider-container">
    <input type="range" v-model="sliderValue" :min="minValue" :max="maxValue" class="slider" />
    <p>{{ sliderValueName}}: {{ scaledSliderValue }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sliderValue: this.logarithmic ? this.logScale(this.initialValue) : this.initialValue * this.scaleFactor
    }
  },
  computed: {
    minValue() {
      return this.logarithmic ? this.logScale(this.minSliderValue) : this.minSliderValue * this.scaleFactor;
    },
    maxValue() {
      return this.logarithmic ? this.logScale(this.maxSliderValue) : this.maxSliderValue * this.scaleFactor;
    },
    scaledSliderValue() {
      return this.logarithmic ? Math.round(this.expScale(this.sliderValue)) : this.sliderValue / this.scaleFactor;
    }
  },
  methods: {
    logScale(value) {
      return Math.log(value) / Math.log(this.maxSliderValue) * 100;
    },
    expScale(value) {
      return Math.pow(this.maxSliderValue, value / 100);
    }
  },
  props: {
    initialValue: {
      type: Number,
      default: 1
    },
    sliderValueName: {
      type: String,
      default: 'Slider'
    },
    minSliderValue: {
      type: Number,
      default: 1
    },
    maxSliderValue: {
      type: Number,
      default: 10
    },
    scaleFactor: {
      type: Number,
      default: 1
    },
    logarithmic: {
      type: Boolean,
      default: false
    },
  },
  watch: {
    sliderValue(newVal) {
      this.$emit('sliderValueChanged', this.logarithmic ? this.expScale(newVal) : newVal / this.scaleFactor);
    },
  }
}
</script>

<style scoped>
.slider-container {
  width: 100%;
}

.slider {
  width: 100%;
}
</style>