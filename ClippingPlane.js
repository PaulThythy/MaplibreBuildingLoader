import * as THREE from 'three';

export class ClippingPlane {
    constructor(elevation) {
        this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), elevation);
    }

    addHelper(size, scene) {
        let planeHelper = new THREE.PlaneHelper(this.clippingPlane, size, 0x00ff00);
        scene.add(planeHelper);
    }

    applyClippingToMaterials(materials) {
        for(let i = 0; i < materials.length; i++) {
            materials[i].clippingPlanes = [this.clippingPlane];
            materials[i].clipShadows = true;
            materials[i].castShadow = true;
        }
    }

    getClippingPlane() {
        return this.clippingPlane;
    }

    getConstant() {
        return this.clippingPlane.constant;
    }

    setConstant(elevation) {
        this.clippingPlane.constant = elevation;
    }
}