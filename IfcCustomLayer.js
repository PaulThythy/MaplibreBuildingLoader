import * as THREE from 'three';
import { TransformControls } from './three.js/examples/jsm/controls/TransformControls.js'
import * as dat from './three.js/examples/jsm/libs/lil-gui.module.min.js';

import { ClippingPlane } from './ClippingPlane.js';

export class IfcCustomLayer {
    type = 'custom';
    renderingMode = '3d';
    model;

    constructor(_id, _url, _loader, _mapOriginTransform, _map) {
        this.id = _id;
        this.loader = _loader;
        this.url = _url;
        this.mapOriginTransform = _mapOriginTransform;
        this.map = _map;
    }

    async onAdd(map, gl) {
        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();

        const directionalLight = new THREE.DirectionalLight(0x404040);
        const directionalLight2 = new THREE.DirectionalLight(0x404040);
        const ambientLight = new THREE.AmbientLight(0x404040, 30);

        directionalLight.position.set(0, -70, 100).normalize();
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight, directionalLight2, ambientLight);

        /*const plane = new ClippingPlane(2);
        this.clippingPlane = plane.getClippingPlane();
        plane.addHelper(5, this.scene);*/

        this.controls = new TransformControls(this.camera, this.map.getCanvas());
        this.controls.size = 10;

        this.loader.load(this.url, (ifcModel) => {
            this.model = ifcModel.mesh;
            //plane.applyClippingToMaterials(this.model.material);
            this.scene.add(this.model);

            this.controls.attach(this.model);
            this.scene.add(this.controls);
        });

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.map.getCanvas().addEventListener('mousedown', this.onMouseDown.bind(this), false);

        this.map = map;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.map.getCanvas(),
            context: gl
        });
        this.renderer.autoClear = false;
        this.renderer.localClippingEnabled = true;
    }

    render(gl, matrix) {
        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0), this.mapOriginTransform.rotateX);
        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0), this.mapOriginTransform.rotateY);
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1), this.mapOriginTransform.rotateZ);

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                this.mapOriginTransform.translateX,
                this.mapOriginTransform.translateY,
                this.mapOriginTransform.translateZ
            )
            .scale(
                new THREE.Vector3(
                    this.mapOriginTransform.scale,
                    -this.mapOriginTransform.scale,
                    this.mapOriginTransform.scale)
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }

    onMouseDown(event) {
        this.mouse.x = (event.clientX / this.map.transform.width) * 2 - 1;
        this.mouse.y = 1 - (event.clientY / this.map.transform.height) * 2;

        const camInverseProjection = new THREE.Matrix4().copy(this.camera.projectionMatrix).invert();
        const cameraPosition = new THREE.Vector3().applyMatrix4(camInverseProjection);
        const mousePosition = new THREE.Vector3(this.mouse.x, this.mouse.y, 1).applyMatrix4(camInverseProjection);
        const viewDirection = mousePosition.clone().sub(cameraPosition).normalize();

        this.raycaster.set(cameraPosition, viewDirection);
        var intersects = this.raycaster.intersectObjects(this.scene.children, false);
        if(intersects[0] != undefined) {
            
        } 
        
    }
}