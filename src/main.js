import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.set( 0, 50, -20 );
camera.lookAt( 0, 0, -20 );

const loader = new GLTFLoader();

let road, car;

loader.load( '/road.glb', function ( gltf ) {
    road = gltf.scene;
	scene.add( road );
});

loader.load( '/car.glb', function ( gltf ) {
    car = gltf.scene;
	scene.add( car );
});

scene.background = new THREE.Color( 0xa0a0a0 );

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( - 3, 10, - 10 );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = - 2;
dirLight.shadow.camera.left = - 2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add( dirLight );


// Mulai gerakan
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9, -0.15, 2.1),
    new THREE.Vector3(3, -0.15, -4),
    new THREE.Vector3(13, -0.15, -5.3),
    new THREE.Vector3(33, -0.15, 3.5),
    new THREE.Vector3(39, -0.15, -2.2),
    new THREE.Vector3(50, -0.15, -12),
    new THREE.Vector3(55, -0.15, -15.5),
    new THREE.Vector3(59, -0.15, -20),
    new THREE.Vector3(62, -0.15, -28),
    new THREE.Vector3(61, -0.15, -34),
    new THREE.Vector3(54, -0.15, -39),
    new THREE.Vector3(40, -0.15, -42.7),
    new THREE.Vector3(20, -0.15, -44.2),
    new THREE.Vector3(0, -0.15, -45.3),
    new THREE.Vector3(-20, -0.15, -46.3),
    new THREE.Vector3(-38, -0.15, -46.6),
    new THREE.Vector3(-43, -0.15, -45),
    new THREE.Vector3(-47, -0.15, -40),
    new THREE.Vector3(-49, -0.15, -27),
    new THREE.Vector3(-48, -0.15, -15),
    new THREE.Vector3(-42, -0.15, -5),
    new THREE.Vector3(-29.5, -0.15, 5),
    new THREE.Vector3(-23, -0.15, 7.3),
    new THREE.Vector3(-19, -0.15, 7),
    new THREE.Vector3(-9, -0.15, 2.1),
]);
  
const numPoints = 1000; // Number of points to sample along the curve

const targetPositions = curve.getPoints(numPoints);
const numVectors = targetPositions.length;
const targetRotations = []; // Array to store Euler rotations
  
  // Calculate Euler rotations along the curve
for (var i = 0; i < numVectors - 1; i++) {
    var direction = targetPositions[i + 1].clone().sub(targetPositions[i]);
    var rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize()));
    targetRotations.push(rotation);
}

const numFrames = 1; // Number of frames or steps in the animation
let frameCount = 0;
let targetIndex = 0;

function animate(){
    requestAnimationFrame( animate );
    // console.log( "Position : " + car.position.x + " , " + car.position.y + " , " + car.position.z);
    // console.log( "Rotation : " + car.rotation.x + " , " + car.rotation.y + " , " + car.rotation.z);

    const t = frameCount / numFrames;

    car.position.lerp(targetPositions[targetIndex], t);
  
    // Interpolate rotation
    car.rotation.x = THREE.MathUtils.lerp(car.rotation.x, targetRotations[targetIndex].x, t);
    car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, targetRotations[targetIndex].y, t);
    car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, targetRotations[targetIndex].z, t);
    
    frameCount++;
    if (frameCount > numFrames) {
        frameCount = 0;
        targetIndex++;
        if (targetIndex >= targetPositions.length - 1) {
            targetIndex = 0;
        }
    }

    renderer.render( scene, camera );
}

animate();