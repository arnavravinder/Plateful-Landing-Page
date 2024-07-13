import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { GLTFLoader } from 'three-gltfloader';
import { OrbitControls } from 'three-orbitcontrols';
import * as BufferGeometryUtils from 'three-buffergeometryutils';
import * as CANNON from 'cannon';

const canvasElement = document.querySelector('.large-section-canvas-three')
const canvasContainer = document.querySelector('.canvas-container-s');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvasElement.clientWidth / canvasElement.clientHeight, 0.1, 1000);

const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true
});

renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

renderer.setPixelRatio(1);

camera.aspect = canvasElement.clientWidth / canvasElement.clientHeight;

camera.position.set(10, 15, 10);

camera.lookAt(0, 0, 0);

const ambience = new THREE.AmbientLight(0xFF00FF);
ambience.intensity = 1;
scene.add(ambience);

const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.intensity = 100;
pointLight.position.set(0, 10, 0);

scene.add(pointLight);

const controls = new OrbitControls(camera, canvasElement);
controls.enableDamping = true;

const loader = new GLTFLoader();

class SceneObject {
    constructor(file_path, scale, position, rotation, type, scene, world = null, lid = false) {
        this.file_path = file_path;
        this.scale = scale;
        this.position = position;
        this.rotation = rotation;
        this.scene = scene;
        this.type = type;
        this.world = world;
        this.lid = lid;
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

                this.boundingBox = new THREE.Box3().setFromObject(this.mesh);

                const size = this.boundingBox.getSize(new THREE.Vector3());

                if (this.type === 'sphere') {

                    const maxDimension = Math.min(size.x, size.y, size.z);            
                    
                    const radius = maxDimension / 2;
                
                    const sphereShape = new CANNON.Sphere(radius);
                
                    const bodyShape = new CANNON.Body({ mass: 2 });
                    bodyShape.addShape(sphereShape);
                
                    this.body = bodyShape;

                } else if (this.type === 'cylinder') {
            
                    const height = size.y / 2;
                    const radius = size.x / 2;

                    const cylinderShape = new CANNON.Cylinder(radius, radius, height, 32);
            
                    const bodyQuat = new CANNON.Quaternion();
                    bodyQuat.setFromEuler(0, 0, 0, 'XYZ');
            
                    const bodyShape = new CANNON.Body({ mass: 2 });
                    bodyShape.addShape(cylinderShape, new CANNON.Vec3(), bodyQuat);

                    this.body = bodyShape;
            
                } else {

                    const halfSizeX = size.x / 2 - 0.5;
                    const halfSizeY = size.y / 2 - 0.5;
                    const halfSizeZ = size.z / 2 - 0.5;

                    const crateBody = new CANNON.Body({ mass: 1 });
                    
                    const bottomShape = new CANNON.Box(new CANNON.Vec3(halfSizeX, 0.05, halfSizeZ));
                    crateBody.addShape(bottomShape);

                    if (this.lid) {
                        const lidShape = new CANNON.Box(new CANNON.Vec3(halfSizeX, 0.05, halfSizeZ));
                        const lidPosition = new CANNON.Vec3(0, halfSizeY * 2, 0);
                        crateBody.addShape(lidShape, lidPosition);
                    }

                    const leftShape = new CANNON.Box(new CANNON.Vec3(0.05, halfSizeY, halfSizeZ));
                    const leftPosition = new CANNON.Vec3(-halfSizeX, halfSizeY, 0);
                    crateBody.addShape(leftShape, leftPosition);

                    const rightShape = new CANNON.Box(new CANNON.Vec3(0.05, halfSizeY, halfSizeZ));
                    const rightPosition = new CANNON.Vec3(halfSizeX, halfSizeY, 0);
                    crateBody.addShape(rightShape, rightPosition);

                    const backShape = new CANNON.Box(new CANNON.Vec3(halfSizeX, halfSizeY, 0.05));
                    const backPosition = new CANNON.Vec3(0, halfSizeY, -halfSizeZ / 2);
                    crateBody.addShape(backShape, backPosition);

                    const frontShape = new CANNON.Box(new CANNON.Vec3(halfSizeX, halfSizeY, 0.05));
                    const frontPosition = new CANNON.Vec3(0, halfSizeY, halfSizeZ / 2);
                    crateBody.addShape(frontShape, frontPosition);

                    this.body = crateBody;

                }

                const position = new CANNON.Vec3(this.position[0], this.position[1], this.position[2]);
                this.body.position.copy(position);
                this.body.quaternion.copy(this.mesh.quaternion);
                this.world.addBody(this.body);

                console.log('loaded!')
                resolve();
            }, undefined, reject);

        });
    }   

