<template>
  <div class="legend">
    <div class="legend-item">
      <div class="color-box" style="background-color: #bebada;"></div>
      <span>Left Group</span>
    </div>
    <div class="legend-item">
      <div class="color-box" style="background-color: #ffffb3;"></div>
      <span>Right Group</span>
    </div>
    <div class="legend-item">
      <span>Suggested comparison&nbsp;</span>
      <hr class="short-line black-line">
    </div>
    <div class="legend-item">
      <span>Preferred&nbsp;</span>
      <hr class="short-line gradient-line">
      <span>&nbsp;Unpreferred</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VisualizationLegend',
}
</script>

<style scoped>
.legend {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 2em;
}

.color-box {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

.short-line {
  width: 50px;
  border-top: 2px solid;
}

.black-line {
  border-color: black;
}

.gradient-line {
  border-image: linear-gradient(to right, blue, red);
  border-image-slice: 1;
}
</style>