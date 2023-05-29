import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

//INIT===============================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
// camera.position.set( 0, 50, -20 );
// camera.lookAt( 0, 0, -20 );

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
// document.body.appendChild( renderer.domElement );

////////////////////////
const container = document.getElementById( 'container' );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

////////////////////////
window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    
}


////////////////////////
const clock = new THREE.Clock();
const GRAVITY = 30;
const STEPS_PER_FRAME = 1;

/////////////////////////////////////////////////////
//MOVEMENTS=========================================
const worldOctree = new Octree();

const playerCollider = new Capsule( new THREE.Vector3( 10, 0.8, 10 ), new THREE.Vector3( 10, 1.2, 10 ), 0.8 );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener( 'keydown', ( event ) => {

    keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

    keyStates[ event.code ] = false;

} );

container.addEventListener( 'mousedown', () => {

    document.body.requestPointerLock();

    mouseTime = performance.now();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

    if ( document.pointerLockElement === document.body ) {

        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;

    }

} );

function playerCollisions() {

    const result = worldOctree.capsuleIntersect( playerCollider );

    playerOnFloor = false;

    if ( result ) {

        playerOnFloor = result.normal.y > 0;

        if ( ! playerOnFloor ) {

            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

        }

        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

        if (playerCollider.intersectsBox(carCapsule.collider)) {
            // Collision with a rectangle detected
    
            // Calculate the direction vector from rectangle to player
            const direction = getPlayerDirection(carCapsule.collider, playerCollider);
    
            // Apply the throwing effect
            const throwDistance = -15; // Adjust this value to control the throw distance
            const throwHeight = 5; // Adjust this value to control the throw height
            const throwVector = direction.clone().multiplyScalar(throwDistance);
            throwVector.y += throwHeight;
            playerVelocity.add(throwVector);
    
            // Additional feedback or actions for the player
            console.log("Collision with a rectangle!");
        }

    }

}

function getPlayerDirection(carCapsule, playerCollider) {
    const carCenter = carCapsule.getCenter(new THREE.Vector3());
    const playerCenter = playerCollider.getCenter(new THREE.Vector3());
  
    return carCenter.sub(playerCenter).normalize();
}

function updatePlayer( deltaTime ) {

    let damping = Math.exp( - 4 * deltaTime ) - 1;

    if ( ! playerOnFloor ) {

        playerVelocity.y -= GRAVITY * deltaTime;

        // small air resistance
        damping *= 0.1;

    }

    playerVelocity.addScaledVector( playerVelocity, damping );

    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );

    playerCollisions();

    camera.position.copy( playerCollider.end );

}

function getForwardVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

}

function getSideVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );

    return playerDirection;

}

function controls( deltaTime ) {

    // gives a bit of air control
    const speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 );

    if ( keyStates[ 'KeyW' ] ) {

        playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );

    }

    if ( keyStates[ 'KeyS' ] ) {

        playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );

    }

    if ( keyStates[ 'KeyA' ] ) {

        playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );

    }

    if ( keyStates[ 'KeyD' ] ) {

        playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );

    }

    if ( playerOnFloor ) {

        if ( keyStates[ 'Space' ] ) {

            playerVelocity.y = 10;

        }

    }

}

function teleportPlayerIfOob() {

    if ( camera.position.y <= - 25 ) {

        playerCollider.start.set( 10, 0.8, 10 );
        playerCollider.end.set( 10, 1.2, 10 );
        playerCollider.radius = 0.8;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, 0, 0 );

    }

}


/////////////////////////////////////////////////////
//OBJECTS============================================

const loader = new GLTFLoader();

let road, car, krustykrab;
let carCapsule;
let rumahnpc = []

//ROAD=======================
loader.load( '/Road/road.glb', function ( gltf ) {
    road = gltf.scene;
	scene.add( road );
    worldOctree.fromGraphNode( road )
});

//CAR========================
loader.load( '/Car/car.glb', function ( gltf ) {
    car = gltf.scene;
    car.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    car.castShadow = true;
    car.receiveShadow = true;
    
    carCapsule = {
        mesh: car,
        collider: new THREE.Box3().setFromObject(car),
        velocity: new THREE.Vector3(),
    }

    console.log(carCapsule)

	scene.add( car );
    // worldOctree.fromGraphNode( car )
});

//KRUSTY KRAB================
loader.load( '/KrustyKrab/krustykrab.gltf', function ( gltf ) {
    krustykrab = gltf.scene;
    krustykrab.position.set(-20, 0, -10)
	scene.add( krustykrab );
    //JANGAN DINYALAIN :)))))))))))
    // worldOctree.fromGraphNode( krustykrab )
});

//RUMAH=======================
// for(let i = 0; i < 6; i++){
//     loader.load( '/RumahNPC/rumahnpc.glb', function ( gltf ) {
//         rumahnpc[i] = gltf.scene;
//         rumahnpc[i].position.set(i, 0, 0)
//         scene.add( rumahnpc[i] );
//     });
// }

//BACKGROUND==========================

// Create the background sphere geometry
const backgroundGeometry = new THREE.SphereGeometry(500, 32, 32);

// Load the background image texture
const backgroundTextureLoader = new THREE.TextureLoader();
const backgroundTexture = backgroundTextureLoader.load('/Background/BikiniBottom.jpeg');

// Create a material with the background texture
const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.BackSide });

// Create a mesh with the geometry and material for the background
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

scene.add(backgroundMesh);

//FLOOR======================
const floorSize = 100; // Size of the visible floor
const tileSize = 10; // Size of each tile
const numTiles = Math.ceil(floorSize / tileSize); // Number of tiles per side

// Create a larger plane to tile the floor texture
const floorGeometry = new THREE.PlaneGeometry(tileSize * numTiles, tileSize * numTiles, numTiles, numTiles);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false });

// Apply a repeating texture to the floor material
const floorLoader = new THREE.TextureLoader();
const floorTexture = floorLoader.load('/Floor/Sand.png'); // Replace 'floor_texture.jpg' with the path to your desired floor texture
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(numTiles, numTiles);
floorMaterial.map = floorTexture;

const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = - Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

worldOctree.fromGraphNode( floorMesh )
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
    // car.collider.center.copy(car.position)
    car.position.lerp(targetPositions[targetIndex], t);
    carCapsule.collider = new THREE.Box3().setFromObject(car)
    // camera.position.lerp({
    //     x: targetPositions[targetIndex].x,
    //     y: targetPositions[targetIndex].y + 1.5,
    //     z: targetPositions[targetIndex].z
    // }, t);
  
    // Animasi Rotasi Object
    car.rotation.x = THREE.MathUtils.lerp(car.rotation.x, targetRotations[targetIndex].x, t);
    car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, targetRotations[targetIndex].y, t);
    car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, targetRotations[targetIndex].z, t);
    // camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotations[targetIndex].z, t);
    // camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotations[targetIndex].y + Math.PI, t);
    // camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRotations[targetIndex].x, t);
    
    frameCount++;
    if (frameCount > 1) {
        frameCount = 0;
        targetIndex++;
        if (targetIndex >= targetPositions.length - 1) {
            targetIndex = 0;
        }
    }

    ////////////////////////////////////////////////////////////////////////
    //MOVEMENTS ANIMATION=================================================
    const deltaTime = Math.min( 0.05, clock.getDelta()*1.15 ) / STEPS_PER_FRAME;

    // we look for collisions in substeps to mitigate the risk of
    // an object traversing another too quickly for detection.

    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

        controls( deltaTime );

        updatePlayer( deltaTime );

        teleportPlayerIfOob();

    }

    renderer.render( scene, camera );
}

animate();