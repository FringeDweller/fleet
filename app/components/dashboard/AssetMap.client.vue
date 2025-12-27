<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  locations: {
    id: string
    assetId: string
    latitude: string
    longitude: string
    assetNumber: string
    assetMake: string
    assetModel: string
    assetStatus: string | null
    createdAt: string
  }[]
  geofences?: {
    id: string
    name: string
    type: 'circle' | 'polygon'
    centerLat: string | null
    centerLng: string | null
    radius: string | null
    coordinates: { lat: number; lng: number }[] | null
    category: string
  }[]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markers: L.LayerGroup | null = null
let geofenceLayers: L.LayerGroup | null = null

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView([0, 0], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  markers = L.layerGroup().addTo(map)
  geofenceLayers = L.layerGroup().addTo(map)
  updateMarkers()
  updateGeofences()
})

const updateGeofences = () => {
  if (!map || !geofenceLayers) return

  geofenceLayers.clearLayers()

  if (!props.geofences) return

  props.geofences.forEach((gf) => {
    if (gf.type === 'circle' && gf.centerLat && gf.centerLng && gf.radius) {
      const circle = L.circle([parseFloat(gf.centerLat), parseFloat(gf.centerLng)], {
        radius: parseFloat(gf.radius),
        color: gf.category === 'restricted' ? 'red' : 'blue',
        fillColor: gf.category === 'restricted' ? '#f03' : '#30f',
        fillOpacity: 0.2
      }).bindPopup(`<strong>Geofence:</strong> ${gf.name}<br>Category: ${gf.category}`)
      geofenceLayers!.addLayer(circle)
    } else if (gf.type === 'polygon' && gf.coordinates) {
      const poly = L.polygon(gf.coordinates as L.LatLngExpression[], {
        color: gf.category === 'restricted' ? 'red' : 'blue',
        fillOpacity: 0.2
      }).bindPopup(`<strong>Geofence:</strong> ${gf.name}<br>Category: ${gf.category}`)
      geofenceLayers!.addLayer(poly)
    }
  })
}

const updateMarkers = () => {
  if (!map || !markers) return

  markers.clearLayers()

  if (props.locations.length === 0) return

  const bounds = L.latLngBounds([])

  props.locations.forEach((loc) => {
    const lat = parseFloat(loc.latitude)
    const lng = parseFloat(loc.longitude)

    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    const marker = L.marker([lat, lng]).bindPopup(`
        <div class="p-2 min-w-[150px]">
          <h3 class="font-bold text-lg border-b mb-2 pb-1">${loc.assetNumber}</h3>
          <p class="text-sm"><strong>Make:</strong> ${loc.assetMake}</p>
          <p class="text-sm"><strong>Model:</strong> ${loc.assetModel}</p>
          <p class="text-sm"><strong>Status:</strong> ${loc.assetStatus || '-'}</p>
          <p class="text-xs text-gray-500 mt-2">${new Date(loc.createdAt).toLocaleString()}</p>
          <a href="/assets/${loc.assetId}" class="inline-block mt-3 px-3 py-1 bg-primary text-white rounded text-xs no-underline hover:bg-primary/90 transition-colors">View Asset</a>
        </div>
      `)

    markers!.addLayer(marker)
    bounds.extend([lat, lng])
  })

  if (markers.getLayers().length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

watch(() => props.locations, updateMarkers, { deep: true })
watch(() => props.geofences, updateGeofences, { deep: true })

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full rounded-lg border border-default min-h-[400px]" />
</template>

<style>
.leaflet-container {
  z-index: 1;
}
</style>
