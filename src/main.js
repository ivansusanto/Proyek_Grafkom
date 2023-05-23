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

loader.load( 'public/road.glb', function ( gltf ) {
    road = gltf.scene;
	scene.add( road );
});

loader.load( 'public/car.glb', function ( gltf ) {
    car = gltf.scene;
    car.position.x = -5;
    car.position.z = -0.15;
    car.rotation.y = 2.1;
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

let rotationSpeed = -0.002;
let movementSpeedX = 0.1;
let movementSpeedZ = -0.05;

function animate(){
    requestAnimationFrame( animate );
    console.log( "Position : " + car.position.x + " , " + car.position.y + " , " + car.position.z);
    console.log( "Rotation : " + car.rotation.x + " , " + car.rotation.y + " , " + car.rotation.z);
    
    car.rotation.y += rotationSpeed;
    car.position.x += movementSpeedX;
    car.position.z += movementSpeedZ;

    if (car.position.x > 3) {
        movementSpeedX = 0.1;
        movementSpeedZ = -0.02;
        rotationSpeed = -0.005;
    }

    if (car.position.x > 10) {
        movementSpeedZ = 0.02;
    }

    if (car.position.x > 18) {
        movementSpeedZ = 0.05;
    }

    if (car.position.x > 22) {
        movementSpeedZ = 0.08;
        rotationSpeed = -0.001;
    }

    if (car.position.x > 29) {
        movementSpeedZ = -0.015;
        rotationSpeed = 0.022;
    }

    if (car.position.x > 35) {
        movementSpeedZ = -0.08;
        rotationSpeed = 0.005;
    }

    if (car.position.x > 40) {
        movementSpeedZ = -0.13;
        rotationSpeed = 0;
    }

    //reset position
    if (car.position.x > 50) {
        car.rotation.y = 0;

        car.position.x = -5;
        car.position.z = -0.15;
        car.rotation.y = 2.1;

        rotationSpeed = -0.002;
        movementSpeedX = 0.1;
        movementSpeedZ = -0.05;
    }

    renderer.render( scene, camera );
}
animate();