<script setup lang="ts">
import { platformModifierKeyOnly } from 'ol/events/condition'
import { boundingExtent } from 'ol/extent'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import { fromLonLat, transformExtent } from 'ol/proj'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import VectorSource from 'ol/source/Vector'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import View from 'ol/View'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Canteen } from '../types'

import { GEOSERVER_URL, WORKSPACE } from '../services/wfs'

import 'ol/ol.css'

const props = defineProps<{
	/** Canteens to highlight (the ones serving the selected meal). */
	highlighted: Canteen[]
}>()

/** Area of Schleswig-Holstein (lon/lat), shown when nothing is highlighted. */
const SCHLESWIG_HOLSTEIN: [number, number, number, number] = [7.8, 53.3, 11.6, 55.1]

const mapElement = ref<HTMLDivElement | null>(null)
const highlightSource = new VectorSource<Feature<Point>>()
let map: Map | null = null

const highlightStyle = new Style({
	image: new CircleStyle({
		radius: 10,
		fill: new Fill({ color: '#c2410c' }),
		stroke: new Stroke({ color: '#ffffff', width: 3 }),
	}),
})

/**
 * Animations are skipped for people who asked their system for reduced motion.
 * @returns Duration of the zoom animation in ms
 */
function animationDuration (): number {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400
}

/**
 * Shows the highlighted canteens and zooms to them (or to the whole state if there are none).
 * @param canteens - Canteens to highlight
 */
function showCanteens (canteens: Canteen[]): void {
	highlightSource.clear()
	highlightSource.addFeatures(canteens.map((canteen) => new Feature({
		geometry: new Point(fromLonLat([canteen.lon, canteen.lat])),
		name: canteen.name,
	})))

	if (map === null) {
		return
	}
	const view = map.getView()
	const extent = canteens.length > 0
		? boundingExtent(canteens.map((canteen) => fromLonLat([canteen.lon, canteen.lat])))
		: transformExtent(SCHLESWIG_HOLSTEIN, 'EPSG:4326', 'EPSG:3857')
	view.fit(extent, { padding: [40, 40, 40, 40], maxZoom: 14, duration: animationDuration() })
}

onMounted(() => {
	if (mapElement.value === null) {
		return
	}
	map = new Map({
		target: mapElement.value,
		layers: [
			// Base map: OpenStreetMap tiles
			new TileLayer({ source: new OSM() }),
			// WMS from our GeoServer: all canteens as blue points
			new TileLayer({
				source: new TileWMS({
					url: `${GEOSERVER_URL}/${WORKSPACE}/wms`,
					params: { LAYERS: `${WORKSPACE}:canteens`, TILED: true },
					serverType: 'geoserver',
					attributions: 'Canteens: Studentenwerk Schleswig-Holstein',
				}),
			}),
			// Canteens serving the selected meal (data from the WFS), drawn on top
			new VectorLayer({ source: highlightSource, style: highlightStyle }),
		],
		// Scrolling over the map scrolls the page; zooming with the wheel needs Ctrl (Windows) or ⌘ (Mac)
		interactions: defaultInteractions({ mouseWheelZoom: false }).extend([
			new MouseWheelZoom({ condition: platformModifierKeyOnly }),
		]),
		view: new View({ center: fromLonLat([9.7, 54.2]), zoom: 7 }),
	})
	showCanteens(props.highlighted)
})

watch(() => props.highlighted, showCanteens)

onBeforeUnmount(() => {
	map?.setTarget(undefined)
	map = null
})
</script>

<template>
	<div class="canteen-map-wrapper">
		<div
			ref="mapElement"
			class="canteen-map"
			role="region"
			tabindex="0"
			aria-label="Map of the canteens. Canteens serving the selected meal are highlighted in orange; the same canteens are listed below the map."
			aria-describedby="map-help"
		/>
		<ul
			class="canteen-map__legend"
			aria-label="Map legend"
		>
			<li>
				<span
					class="legend-dot legend-dot--all"
					aria-hidden="true"
				/>
				All canteens (WMS)
			</li>
			<li>
				<span
					class="legend-dot legend-dot--selected"
					aria-hidden="true"
				/>
				Serves the selected meal today (WFS)
			</li>
		</ul>
		<p
			id="map-help"
			class="canteen-map__help"
		>
			Zoom with + / −, or Ctrl / ⌘ + scroll. Keyboard: select the map, then use the arrow keys to move and + / − to zoom.
		</p>
	</div>
</template>

<style scoped>
.canteen-map-wrapper {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	height: 100%;
}

.canteen-map {
	flex: 1;
	width: 100%;
	min-height: 18rem;
	border-radius: var(--radius);
	overflow: hidden;
	box-shadow: var(--shadow-md);
}

/* OpenLayers' zoom buttons are small by default; WCAG asks for at least 24 × 24 px */
.canteen-map :deep(.ol-zoom button) {
	width: 2.25rem;
	height: 2.25rem;
	font-size: 1.4rem;
}

/* Attribution sits on the map image: solid background + underlined links keep it readable on any tile */
.canteen-map :deep(.ol-attribution) {
	background: rgb(255 255 255 / 95%);
}

.canteen-map :deep(.ol-attribution li),
.canteen-map :deep(.ol-attribution a) {
	color: var(--color-text);
}

.canteen-map :deep(.ol-attribution a) {
	text-decoration: underline;
}

.canteen-map__legend {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem 1.25rem;
	margin: 0.25rem 0 0;
	padding: 0;
	list-style: none;
	font-size: 0.9rem;
	font-weight: 600;
}

.canteen-map__legend li {
	display: flex;
	gap: 0.45rem;
	align-items: center;
}

.legend-dot {
	display: inline-block;
	width: 0.85rem;
	height: 0.85rem;
	border: 2px solid #ffffff;
	border-radius: 50%;
	box-shadow: 0 0 0 1px var(--color-border-strong);
}

.legend-dot--all {
	background: var(--color-wms);
}

.legend-dot--selected {
	width: 1.1rem;
	height: 1.1rem;
	background: var(--color-accent);
}

.canteen-map__help {
	margin: 0;
	color: var(--color-muted);
	font-size: 0.85rem;
}
</style>
