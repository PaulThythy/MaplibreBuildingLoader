import * as THREE from 'three';
import { ClippingPlane } from './ClippingPlane.js';

import * as dat from './three.js/examples/jsm/libs/lil-gui.module.min.js';

export class ifcCustomLayer {
    type = 'custom';
    renderingMode = '3d';

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
        const ambientLight = new THREE.AmbientLight(0x404040, 100);

        directionalLight.position.set(0, -70, 100).normalize();
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight, directionalLight2, ambientLight);

        const plane = new ClippingPlane(2);
        this.clippingPlane = plane.getClippingPlane();
        plane.addHelper(5, this.scene);

        this.loader.load(this.url, (ifcModel) => {
            plane.applyClippingToMaterials(ifcModel.mesh.material);
            this.scene.add(ifcModel.mesh);
        });

        /*this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        map.getCanvas().addEventListener('mousedown', this.onMouseDown.bind(this), false);*/

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

    /* onMouseDown(event) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
      const camInverseProjection = new THREE.Matrix4().invert(this.camera.matrixWorldInverse);
      const cameraPosition = new THREE.Vector3().applyMatrix4(camInverseProjection);
      const mousePosition = new THREE.Vector3(this.mouse.x, this.mouse.y, 1).applyMatrix4(camInverseProjection);
      const viewDirection = mousePosition.clone().sub(cameraPosition).normalize(); 
  
      this.raycaster.set(cameraPosition, viewDirection);
  
      var intersects = this.raycaster.intersectObjects(this.scene.children, true);
      console.log(intersects);
    } */
}