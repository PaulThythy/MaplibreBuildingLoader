import * as THREE from 'three';
//import Stats from 'stats.js/src/Stats.js';

//import { TransformControls } from './three.js/examples/jsm/controls/TransformControls.js'
import { IFCLoader } from 'web-ifc-three';
import { IFCSPACE } from 'web-ifc';

import { ifcCustomLayer } from './ifcCustomLayer.js';

var mapOrigin = { LngLat: [5.0801, 47.3134], altitude: 0, rotation: new THREE.Vector3(Math.PI / 2, 0, 0) };
var mapMercatorCoordinates = maplibregl.MercatorCoordinate.fromLngLat([mapOrigin.LngLat[0], mapOrigin.LngLat[1]], mapOrigin.altitude);

var mapOriginTransform = {
  translateX: mapMercatorCoordinates.x,
  translateY: mapMercatorCoordinates.y,
  translateZ: mapMercatorCoordinates.z,
  rotateX: mapOrigin.rotation.x,
  rotateY: mapOrigin.rotation.y,
  rotateZ: mapOrigin.rotation.z,
  scale: mapMercatorCoordinates.meterInMercatorCoordinateUnits()
};

var map = window.map = new maplibregl.Map({
  container: 'map', // container id
  style: {
    'version': 8,
    'sources': {
      'raster-tiles': {
        'type': 'raster',
        'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        'tileSize': 256,
        'attribution':
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    'layers': [
      {
        'id': 'simple-tiles',
        'type': 'raster',
        'source': 'raster-tiles',
        'minzoom': 0,
        'maxzoom': 22
      }
    ]
  },
  center: [mapOrigin.LngLat[0], mapOrigin.LngLat[1]], // starting position [lng, lat]
  zoom: 18, // starting zoom
  pitch: 60
});

const ifcLoader = new IFCLoader();
await ifcLoader.ifcManager.setWasmPath('https://unpkg.com/web-ifc@0.0.36/', true);

await ifcLoader.ifcManager.parser.setupOptionalCategories({
  [IFCSPACE]: false,
});

await ifcLoader.ifcManager.applyWebIfcConfig({
  USE_FAST_BOOLS: true
});

let customL = new ifcCustomLayer('custom', './testIFCFiles/01.ifc', ifcLoader, mapOriginTransform, map);

map.on('load', () => {
  map.addLayer(customL);
});