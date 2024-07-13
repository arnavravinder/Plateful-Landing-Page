import * as THREE from 'three';
import { GLTFLoader } from 'three-gltfloader';
import { OrbitControls } from 'three-orbitcontrols';
import * as BufferGeometryUtils from 'three-buffergeometryutils';
import * as CANNON from 'cannon';

const canvasContainer = document.querySelector('.salad-section');
const canvasElement = document.querySelector('.salad-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, canvasElement.clientWidth / canvasElement.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true });

renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(1);

camera.position.set(25, 12.5, 0);
camera.lookAt(0, 12.5, 0);

scene.add(new THREE.AmbientLight(0xFFFFFF, 1));

const pointLight = new THREE.PointLight(0xFFFFFF, 1);
pointLight.position.set(10, 10, 0);
pointLight.intensity = 10;
scene.add(pointLight);

const loader = new GLTFLoader();

const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

const totalObjs = [];

class MeshWithPhysics {
    constructor(mesh, world, position = new THREE.Vector3(), rotation = new THREE.Quaternion()) {
        this.mesh = mesh;
        this.world = world;
        this.position = position.clone();
        this.rotation = rotation.clone();

        const geometries = [];
        mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                geometries.push(child.geometry.clone());
            }
        });

        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

        const boundingSphere = new THREE.Sphere();
        mergedGeometry.computeBoundingSphere();
        boundingSphere.copy(mergedGeometry.boundingSphere);
        const radius = boundingSphere.radius;

        this.body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: new CANNON.Sphere(radius),
        });

        this.body.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        scene.add(this.mesh);
        this.world.addBody(this.body);
    }

    static createMultiple(mesh, world, count, bounds = { minX: -5, maxX: 5, minY: 10, maxY: 60, minZ: -5, maxZ: 5 }) {
        const instances = [];

        for (let i = 0; i < count; i++) {
            const position = new THREE.Vector3(
                Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
                Math.random() * (bounds.maxY - bounds.minY) + bounds.minY,
                Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ
            );

            const rotation = new THREE.Quaternion();
            rotation.setFromEuler(
                new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                )
            );

            const instance = new MeshWithPhysics(mesh.clone(), world, position, rotation);
            instances.push(instance);
            totalObjs.push(instance);
        }

        return instances;
    }
}

const objectFiles = ['./assets/pepper_cut.glb', './assets/tomato_cut.glb', './assets/carrot_cut.glb'];
const scales = [3, 0.25, 0.5];
const counts = [15, 5, 5];

objectFiles.forEach((file, index) => {
    loader.load(file, (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(scales[index], scales[index], scales[index]);
        MeshWithPhysics.createMultiple(mesh, world, counts[index]);
    });
});

let potBoundingBox;

loader.load('./assets/pot.glb', (gltf) => {
    const mesh = gltf.scene;
    mesh.position.set(0, 0, 0);
    mesh.scale.set(10, 10, 10);
    scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    potBoundingBox = new THREE.Box3(box.min, box.max);
});

animate();

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);
    renderer.render(scene, camera);

    totalObjs.forEach((obj, index) => {
        obj.mesh.position.copy(obj.body.position);
        obj.mesh.quaternion.copy(obj.body.quaternion);
        const box = new THREE.Box3().setFromObject(obj.mesh);
        const topPosition = box.max.clone().add(new THREE.Vector3(0, 1, 0));

        if (potBoundingBox && potBoundingBox.containsPoint(topPosition)) {
            scene.remove(obj.mesh);
            world.removeBody(obj.body);
            totalObjs.splice(index, 1);
            spawnNewObject();
        }
    });
}

function spawnNewObject() {
    const randomIndex = Math.floor(Math.random() * objectFiles.length);
    loader.load(objectFiles[randomIndex], (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(scales[randomIndex], scales[randomIndex], scales[randomIndex]);
        const position = new THREE.Vector3(
            Math.random() * 10 - 5,
            Math.random() * 50 + 30,
            Math.random() * 10 - 5
        );

        const rotation = new THREE.Quaternion();
        rotation.setFromEuler(
            new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            )
        );

        const instance = new MeshWithPhysics(mesh.clone(), world, position, rotation);
        totalObjs.push(instance);
    });
}

window.addEventListener('resize', () => {
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
});