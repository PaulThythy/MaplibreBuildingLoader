import * as THREE from 'https://unpkg.com/three@0.109.0/build/three.module.js';

const {MercatorCoordinate} = maplibregl;

const map = new maplibregl.Map({
  container: 'map',
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
  center: [-74.0445, 40.6892],
  zoom: 16,
  pitch: 60,
  bearing: 120,
});

class BoxCustomLayer {
  type = 'custom';
  renderingMode = '3d';

  constructor(id) {
    this.id = id;
  }

  async onAdd(map, gl) {
    this.camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);
    // this.camera = new THREE.Camera();

    const centerLngLat = map.getCenter();
    this.center = MercatorCoordinate.fromLngLat(centerLngLat, 0);
    const {x, y, z} = this.center;
		const s = this.center.meterInMercatorCoordinateUnits();

    const scale = new THREE.Matrix4().makeScale(s, s, -s);
    const rotation = new THREE.Matrix4().multiplyMatrices(
    		new THREE.Matrix4().makeRotationX(-0.5 * Math.PI),
        new THREE.Matrix4().makeRotationY(Math.PI));
    
    this.cameraTransform = new THREE.Matrix4().multiplyMatrices(scale, rotation).setPosition(x, y, z);

    this.map = map;
    this.scene = this.makeScene();

    // use the Mapbox GL JS map canvas for three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });

    this.renderer.autoClear = false;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.near = -1;
    this.raycaster.far = 1e6;
  }

  makeScene() {
    const scene = new THREE.Scene();
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    scene.add(new THREE.HemisphereLight(skyColor, groundColor, 0.25));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(-70, -70, 100).normalize();
    // Directional lights implicitly point at (0, 0, 0).
    scene.add(directionalLight);

    const group = new THREE.Group();
    group.name = '$group';

    const geometry = new THREE.BoxGeometry( 100, 100, 100 );
    geometry.translate(0, 50, 0);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
    });
    const cube = new THREE.Mesh( geometry, material );

    group.add(cube);
    scene.add(group);

    return scene;
  }

  render(gl, matrix) {
    this.camera.projectionMatrix = new THREE.Matrix4()
      .fromArray(matrix)
      .multiply(this.cameraTransform);
    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
  }

  raycast(point, isClick) {
    var mouse = new THREE.Vector2();
     // // scale mouse pixel position to a percentage of the screen's width and height
    mouse.x = ( point.x / this.map.transform.width ) * 2 - 1;
    mouse.y = 1 - ( point.y / this.map.transform.height ) * 2;
    
    const camInverseProjection = new THREE.Matrix4().getInverse(this.camera.projectionMatrix);
    const cameraPosition = new THREE.Vector3().applyMatrix4(camInverseProjection);
    const mousePosition = new THREE.Vector3(mouse.x, mouse.y, 1).applyMatrix4(camInverseProjection);
    const viewDirection = mousePosition.clone().sub(cameraPosition).normalize();    

    this.raycaster.set(cameraPosition, viewDirection);
    
    // calculate objects intersecting the picking ray
    var intersects = this.raycaster.intersectObjects(this.scene.children, true);
    console.log(intersects.length);
    $('#info').empty();
    if (intersects.length) {
      for(let i = 0; i < intersects.length; ++i) {
      	$('#info').append(' ' + JSON.stringify(intersects[i].distance));
        isClick && console.log(intersects[i]);
      }
      
      isClick && $('#info').append(';');
    }
  }
}

let boxLayer = new BoxCustomLayer('box')

map.on('load', () => {
  map.addLayer(boxLayer);
});

map.on('mousemove', e => {
  boxLayer.raycast(e.point, false);
});

map.on('click', e => {
  boxLayer.raycast(e.point, true);
});

