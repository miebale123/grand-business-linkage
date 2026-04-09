<script setup lang="ts">
import { computed } from 'vue'

type ChartSeries = {
  name: string
  color: string
  data: number[]
  fill?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle: string
    labels: string[]
    series: ChartSeries[]
    variant?: 'area' | 'line'
  }>(),
  {
    variant: 'line',
  },
)

const width = 640
const height = 320
const padding = {
  top: 20,
  right: 18,
  bottom: 52,
  left: 42,
}

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom
const baselineY = padding.top + chartHeight

const maxValue = computed(() => {
  const highest = Math.max(...props.series.flatMap((entry) => entry.data), 1)
  const rounded = Math.ceil(highest / 5) * 5
  return rounded
})

const yTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => {
    const value = (maxValue.value / 4) * index
    return {
      value,
      label:
        value >= 1000
          ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
          : Math.round(value).toString(),
      y: baselineY - (value / maxValue.value) * chartHeight,
    }
  }).reverse(),
)

function xPosition(index: number) {
  if (props.labels.length <= 1) {
    return padding.left + chartWidth / 2
  }

  return padding.left + (chartWidth / (props.labels.length - 1)) * index
}

function yPosition(value: number) {
  return baselineY - (value / maxValue.value) * chartHeight
}

function buildPointSet(values: number[]) {
  return values.map((value, index) => ({
    x: xPosition(index),
    y: yPosition(value),
  }))
}

function buildCurvePath(values: number[]) {
  const points = buildPointSet(values)

  if (!points.length) {
    return ''
  }

  if (points.length === 1) {
    return `M ${points[0]?.x} ${points[0]?.y}`
  }

  let path = `M ${points[0]?.x} ${points[0]?.y}`

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]

    if (!previous || !current) {
      continue
    }

    const controlX = (previous.x + current.x) / 2
    path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`
  }

  return path
}

function buildAreaPath(values: number[]) {
  const points = buildPointSet(values)
  const linePath = buildCurvePath(values)

  if (!points.length) {
    return ''
  }

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  if (!lastPoint || !firstPoint) {
    return ''
  }

  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
}

const plottedSeries = computed(() =>
  props.series.map((entry) => ({
    ...entry,
    linePath: buildCurvePath(entry.data),
    areaPath: entry.fill ? buildAreaPath(entry.data) : '',
    points: buildPointSet(entry.data),
  })),
)
</script>

<template>
  <article class="panel content-card">
    <div class="chart-header">
      <div>
        <p class="eyebrow">{{ title }}</p>
        <h3 class="chart-title">{{ subtitle }}</h3>
      </div>

      <div class="chart-legend" aria-label="Chart series">
        <div v-for="entry in series" :key="entry.name" class="chart-legend-item">
          <span class="chart-legend-dot" :style="{ backgroundColor: entry.color }" aria-hidden="true" />
          <span>{{ entry.name }}</span>
        </div>
      </div>
    </div>

    <div class="chart-frame">
      <svg class="chart-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-hidden="true">
        <g>
          <line
            v-for="tick in yTicks"
            :key="`grid-${tick.value}`"
            :x1="padding.left"
            :x2="width - padding.right"
            :y1="tick.y"
            :y2="tick.y"
            stroke="rgba(22, 33, 28, 0.08)"
            stroke-dasharray="4 8"
          />

          <line
            v-for="(label, index) in labels"
            :key="`vgrid-${label}`"
            :x1="xPosition(index)"
            :x2="xPosition(index)"
            :y1="padding.top"
            :y2="baselineY"
            stroke="rgba(22, 33, 28, 0.04)"
          />
        </g>

        <g v-for="tick in yTicks" :key="`tick-${tick.value}`">
          <text
            :x="padding.left - 10"
            :y="tick.y + 4"
            text-anchor="end"
            font-size="12"
            fill="rgba(102, 113, 105, 1)"
          >
            {{ tick.label }}
          </text>
        </g>

        <g v-for="entry in plottedSeries" :key="entry.name">
          <path
            v-if="entry.areaPath"
            :d="entry.areaPath"
            :fill="entry.fill"
          />
          <path
            :d="entry.linePath"
            fill="none"
            :stroke="entry.color"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-for="(point, index) in entry.points"
            :key="`${entry.name}-${index}`"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="white"
            :stroke="entry.color"
            stroke-width="2.5"
          />
        </g>

        <g v-for="(label, index) in labels" :key="`label-${label}`">
          <text
            :x="xPosition(index)"
            :y="height - 16"
            text-anchor="middle"
            font-size="12"
            fill="rgba(102, 113, 105, 1)"
          >
            {{ label }}
          </text>
        </g>
      </svg>
    </div>
  </article>
</template>
