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
	gap: 0.4rem;
	height: 100%;
}

.canteen-map {
	flex: 1;
	width: 100%;
	min-height: 18rem;
	border-radius: 0.75rem;
	overflow: hidden;
	border: 1px solid var(--color-border);
}

.canteen-map__help {
	margin: 0;
	color: var(--color-muted);
	font-size: 0.85rem;
}
</style>
