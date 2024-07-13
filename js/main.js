import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { GLTFLoader } from 'three-gltfloader';
import { OrbitControls } from 'three-orbitcontrols';
import * as BufferGeometryUtils from 'three-buffergeometryutils';
import * as CANNON from 'cannon';

AOS.init();

const canvasElement = document.querySelector('.main-landing-hover-three')
const canvasContainer = document.querySelector('.main-landing')

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvasElement.clientWidth / canvasElement.clientHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true
});

renderer.setPixelRatio(1);
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

camera.aspect = window.innerWidth / window.innerHeight;
camera.position.setY(10);
camera.position.setZ(20);
camera.updateProjectionMatrix();

const ambience = new THREE.AmbientLight(0xFF00FF);
ambience.intensity = 1;
scene.add(ambience);

const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.intensity = 100;
pointLight.position.set(-5, 20, -5);

scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xFFFFFF);
pointLight2.intensity = 100;
pointLight2.position.set(-5, 0, 5);

scene.add(pointLight2);

const loader = new GLTFLoader();

class SceneObject {
    constructor(file_path, scale, position, rotation, scene) {
        this.file_path = file_path;
        this.scale = scale;
        this.position = position;
        this.rotation = rotation;
        this.scene = scene;
        this.mesh = null;
        this.geometry = null;
    }

    loadGLTF() {
        return new Promise((resolve, reject) => {
            loader.load(this.file_path, (gltf) => {
                this.mesh = gltf.scene;

                const geometries = [];

                this.mesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        geometries.push(child.geometry.clone());
                    }
                });

                const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
                this.geometry = mergedGeometry;

                this.mesh.scale.set(this.scale, this.scale, this.scale);
                this.mesh.position.set(this.position[0], this.position[1], this.position[2]);
                this.mesh.rotation.set(this.rotation[0], this.rotation[1], this.rotation[2]);

                this.scene.add(this.mesh);
                resolve();
            }, undefined, reject);

        });
    }   

    rotate() {
        this.mesh.rotation.y += 0.004
    }
}

const capsicum = new SceneObject('./assets/pepper.glb', 2.5, [0, 11, 0], [0, 0, Math.PI / 6], scene)
const ctomato = new SceneObject('./assets/cherry tomato.glb', 0.5, [0, 20, 0], [0, 0, Math.PI / 6], scene)
const carrot = new SceneObject('./assets/carrot.glb', 1.5, [0, 0, 0], [0, 0, Math.PI / 6], scene)

const rotatingObjects = []

capsicum.loadGLTF().then(() => {
    rotatingObjects.push(capsicum);
});

ctomato.loadGLTF().then(() => {
    rotatingObjects.push(ctomato);
});

carrot.loadGLTF().then(() => {
    rotatingObjects.push(carrot);
});

function animate() {
    
    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    rotatingObjects.forEach(rotateObject => {
        rotateObject.rotate()
    })

}

window.addEventListener('resize', () => {
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
});

animate();

window.addEventListener('scroll', function() {
    let scrollPosition = window.scrollY;
    let windowHeight = window.innerHeight;
    let triggerPosition = windowHeight;
  
    if (scrollPosition >= triggerPosition) {
      document.querySelector('.navbar').style.background = 'rgba(197, 98, 27, 0.75)';
    } else {
      document.querySelector('.navbar').style.background ='transparent';
    }
  });