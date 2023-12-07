import * as THREE from 'three';

import { IFCLoader } from 'web-ifc-three';
import { IFCSPACE } from 'web-ifc';

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

const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',

    onAdd: function (map, gl) {
        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();

        const directionalLight = new THREE.DirectionalLight(0x404040);
        const directionalLight2 = new THREE.DirectionalLight(0x404040);
        const ambientLight = new THREE.AmbientLight(0x404040, 100);

        directionalLight.position.set(0, -70, 100).normalize();
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight, directionalLight2, ambientLight);

        ifcLoader.load('testIFCFiles/01.ifc', (ifcModel) => {
            const mesh = new THREE.Mesh(ifcModel.geometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            this.scene.add(ifcModel.mesh);
        });

        this.map = map;

        this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl });
        this.renderer.autoClear = false;
    },

    render(gl, matrix) {
        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0), mapOriginTransform.rotateX);
        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0), mapOriginTransform.rotateY);
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1), mapOriginTransform.rotateZ);

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                mapOriginTransform.translateX,
                mapOriginTransform.translateY,
                mapOriginTransform.translateZ
            )
            .scale(
                new THREE.Vector3(
                    mapOriginTransform.scale,
                    -mapOriginTransform.scale,
                    mapOriginTransform.scale)
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
};


map.on('style.load', () => {
    map.addLayer(customLayer);
});