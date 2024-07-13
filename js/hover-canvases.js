import * as THREE from 'three';
import { GLTFLoader } from 'three-gltfloader';
import { OrbitControls } from 'three-orbitcontrols';
import * as BufferGeometryUtils from 'three-buffergeometryutils';
import * as CANNON from 'cannon';
import { Tween, update, Easing } from 'tween';

const canvasElement = document.querySelector('.hover-canvas-three');
const canvasElement2 = document.querySelector('.three-canvas-2');
const canvasContainer = document.querySelector('.canvas-container-h');

const scene1 = new THREE.Scene();
const scene2 = new THREE.Scene();

const camera1 = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

const renderer1 = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true
});

const renderer2 = new THREE.WebGLRenderer({
    canvas: canvasElement2,
    alpha: true
});

renderer1.setPixelRatio(1);
renderer2.setPixelRatio(1);

renderer1.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer2.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

camera1.position.set(0, 10, 20);
camera1.lookAt(scene1.position);

camera2.position.set(5, 5, 5);
camera2.lookAt(scene2.position);

const ambience1 = new THREE.AmbientLight(0xFF00FF);
ambience1.intensity = 0.5;
scene1.add(ambience1);

const pointLight1 = new THREE.PointLight(0xFFFFFF);
pointLight1.intensity = 20;
pointLight1.position.set(-5, 5, 5);
scene1.add(pointLight1);

const controls1 = new OrbitControls(camera1, renderer1.domElement);
controls1.enableDamping = true;

const ambience2 = new THREE.AmbientLight(0xFFFFFF);
ambience2.intensity = 0.25;
scene2.add(ambience2);

const pointLight2 = new THREE.PointLight(0xFFFFFF);
pointLight2.intensity = 40;
pointLight2.position.set(-3, 5, 0);
scene2.add(pointLight2);

const controls2 = new OrbitControls(camera2, renderer2.domElement);
controls2.enableDamping = true;

const loader = new GLTFLoader();
let currentModel;
let currentYRotation = 0;

const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

const models = {};

function preloadModel(url) {
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.scale.set(15, 15, 15);
            resolve(model);
        }, undefined, reject);
    });
}

const modelUrls = {
    bank: './assets/bank.glb',
    fast: './assets/fast.glb',
    security: './assets/padlock.glb'
};

const preloadPromises = Object.entries(modelUrls).map(([key, url]) => {
    return preloadModel(url).then(model => {
        models[key] = model;
        console.log('Model loaded: ', key);
    });
});

function setModel(model, scene) {
    if (currentModel) {
        scene.remove(currentModel);
        currentYRotation = currentModel.rotation.y;
    }
    currentModel = model;
    currentModel.rotation.y = currentYRotation;
    scene.add(currentModel);
}

