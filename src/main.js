import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//INIT===============================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.set( 0, 50, -20 );
camera.lookAt( 0, 0, -20 );

/////////////////////////////////////////////////////
//OBJECTS============================================

const loader = new GLTFLoader();

let road, car;

//ROAD=======================
loader.load( '/road.glb', function ( gltf ) {
    road = gltf.scene;
	scene.add( road );
});

//CAR========================
loader.load( '/car.glb', function ( gltf ) {
    car = gltf.scene;
	scene.add( car );
});

/////////////////////////////////////////////////////
//BACKGROUND=========================================

scene.background = new THREE.Color( 0xa0a0a0 );

/////////////////////////////////////////////////////
//LIGHT==============================================

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

//OBJECT MOVE=========================================
// Titik titik belok
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9, -0.15, 2.1),
    new THREE.Vector3(3, -0.15, -4),
    new THREE.Vector3(13, -0.15, -5.3),
    new THREE.Vector3(22.5, -0.15, -0.9),
    new THREE.Vector3(33, -0.15, 3.5),
    new THREE.Vector3(39, -0.15, -2.2),
    new THREE.Vector3(44, -0.15, -7.2),
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
    new THREE.Vector3(-31, -0.15, -46.5),
    new THREE.Vector3(-38, -0.15, -46.6),
    new THREE.Vector3(-43, -0.15, -45),
    new THREE.Vector3(-47, -0.15, -40),
    new THREE.Vector3(-49, -0.15, -27),
    new THREE.Vector3(-48, -0.15, -15),
    new THREE.Vector3(-42, -0.15, -5),
    new THREE.Vector3(-36, -0.15, 0),
    new THREE.Vector3(-29.5, -0.15, 5),
    new THREE.Vector3(-23, -0.15, 7.3),
    new THREE.Vector3(-19, -0.15, 7),
    new THREE.Vector3(-9, -0.15, 2.1),
]);

// Array isinya x, y, z posisi track
const targetPositions = curve.getPoints(700);

const targetRotations = [];
for (let i = 0; i < targetPositions.length - 1; i++) {
    const direction = targetPositions[i + 1].clone().sub(targetPositions[i]);
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize()));
    targetRotations.push(rotation);
}

let frameCount = 0;
let targetIndex = 0;

////////////////////////////////////////////////////////////

function animate(){
    requestAnimationFrame( animate );

    //OBJECT ANIMATE==========================================================
    const t = frameCount;

    // Animasi Posisi Object
    car.position.lerp(targetPositions[targetIndex], t);
    camera.position.lerp({
        x: targetPositions[targetIndex].x,
        y: targetPositions[targetIndex].y + 1.5,
        z: targetPositions[targetIndex].z
    }, t);
  
    // Animasi Rotasi Object
    car.rotation.x = THREE.MathUtils.lerp(car.rotation.x, targetRotations[targetIndex].x, t);
    car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, targetRotations[targetIndex].y, t);
    car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, targetRotations[targetIndex].z, t);
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotations[targetIndex].z, t);
    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotations[targetIndex].y + Math.PI, t);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRotations[targetIndex].x, t);
    
    frameCount++;
    if (frameCount > 1) {
        frameCount = 0;
        targetIndex++;
        if (targetIndex >= targetPositions.length - 1) {
            targetIndex = 0;
        }
    }

    ////////////////////////////////////////////////////////////////////////

    renderer.render( scene, camera );
}

animate();