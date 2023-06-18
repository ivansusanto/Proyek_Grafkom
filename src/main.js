import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

//INIT===============================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

////////////////////////
const container = document.getElementById( 'container' );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
let carOctree = new Octree();

const playerCollider = new Capsule( new THREE.Vector3( -9, 0.8, 5 ), new THREE.Vector3( -9, 1.2, 5 ), 0.8 );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

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

        camera.rotation.y -= event.movementX / 1000;
        camera.rotation.x -= event.movementY / 1000;

    }

} );

function playerCollisions() {

    const result = worldOctree.capsuleIntersect( playerCollider );
    const result2 = carOctree.capsuleIntersect( playerCollider );

    playerOnFloor = false;

    if ( result ) {

        playerOnFloor = result.normal.y > 0;

        if ( ! playerOnFloor ) {

            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

        }

        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

        // if (playerCollider.intersectsBox(carCapsule.collider) && !ridingCar) {
        //     // Collision with a rectangle detected
    
        //     // Calculate the direction vector from rectangle to player
        //     const direction = getPlayerDirection(carCapsule.collider, playerCollider);
    
        //     // Apply the throwing effect
        //     const throwDistance = -15; // Adjust this value to control the throw distance
        //     const throwHeight = 5; // Adjust this value to control the throw height
        //     const throwVector = direction.clone().multiplyScalar(throwDistance);
        //     throwVector.y += throwHeight;
        //     playerVelocity.add(throwVector);
    
        //     // Additional feedback or actions for the player
        //     console.log("Collision with a rectangle!");
        // }

    }

    if ( result2 )  playerCollider.translate( result2.normal.multiplyScalar( result2.depth ) );
}

// function getPlayerDirection(objectCollider, playerCollider) {
//     const carCenter = objectCollider.getCenter(new THREE.Vector3());
//     const playerCenter = playerCollider.getCenter(new THREE.Vector3());
  
//     return carCenter.sub(playerCenter).normalize();
// }

let ridingCar = false;
let ridingTimer = 0;

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

    if(!ridingCar) camera.position.copy( playerCollider.end );

    if(ridingTimer != 0) {
        ridingTimer++;
        if(ridingTimer == 100){
            ridingTimer = 0
        }
    }
    
    if((keyStates[ 'KeyF' ] || keyStates[ 'Space' ]) && ridingCar && ridingTimer == 0){
        teleportPlayerToRightSide(car, 2)

        carOctree = new Octree();
        carOctree.fromGraphNode(car);

        ridingCar = false;
        ridingTimer++;
    } else if(carCapsule && carCapsule.collider && isPlayerAroundObject(carCapsule.collider, playerCollider, 6) && keyStates[ 'KeyF' ] && !ridingCar && ridingTimer == 0) {
        ridingCar = true;
        ridingTimer++;
    }
}

//TURUN MOBIL
function teleportPlayerToRightSide(object, offset) {
    const objectPosition = new THREE.Vector3();
    object.getWorldPosition(objectPosition);

    // Get the right side position based on the object's position, rotation, size, and offset
    const rightSidePosition = new THREE.Vector3();
    object.getWorldDirection(rightSidePosition);
    rightSidePosition.multiplyScalar(offset);
    rightSidePosition.add(objectPosition);

    // Update the player's position and collider to the right side position
    playerCollider.start.copy(rightSidePosition);
    playerCollider.start.y = 0.8; // Set the desired y-coordinate for playerCollider.start
    playerCollider.end.copy(rightSidePosition);
    playerCollider.end.y = 1.2; // Set the desired y-coordinate for playerCollider.end
    camera.position.copy(rightSidePosition);
}

//CEK DEKET OBJECT
function isPlayerAroundObject(objectCollider, playerCollider, threshold) {
    const playerPosition = playerCollider.getCenter(new THREE.Vector3());
    const objectPosition = objectCollider.getCenter(new THREE.Vector3());
  
    const distance = playerPosition.distanceTo(objectPosition);
    const proximityThreshold = threshold; // Adjust this value to control the proximity threshold
    return distance <= proximityThreshold;
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

        playerCollider.start.set( -9, 0.8, 5 );
        playerCollider.end.set( -9, 1.2, 5 );
        playerCollider.radius = 0.8;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, 0, 0 );

    }

}


/////////////////////////////////////////////////////
//OBJECTS============================================

const loader = new GLTFLoader();

let road, car, krustykrab, mrkrab, plankton, squid, patrick, rumah_spongebob, chum_bucket, rumah_patrick, rumah_squidward, tiang_krustykrab, sun, moon;
let carCapsule;
let mixer_squidward, mixer_mrcrab, mixer_patrick, mixer_plankton;
let rumahnpc = [];
let lamp = [];
let lampCollider = [];

//ROAD=======================
loader.load( '/Road/road.glb', function ( gltf ) {
    road = gltf.scene;
    road.position.y = 0.0447
    road.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = false;
            node.receiveShadow = true;
        }
    });
    road.castShadow = true;
    road.receiveShadow = true;
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

    car.position.set(-9, 0.1, 2.1);
    car.rotation.set(0, 2, 0);

    carCapsule = {
        mesh: car,
        collider: new THREE.Box3().setFromObject(car),
        velocity: new THREE.Vector3(),
    }

	scene.add( car );
    carOctree.fromGraphNode( car )
});

//MR KRAB=========================
loader.load( '/mr_krab/mr_krab.glb', function ( gltf ) {
    mrkrab = gltf.scene;
    mrkrab.scale.set(0.005, 0.005, 0.005);
    mrkrab.rotation.set(0, 2, 0);
    mrkrab.position.set(-20, 0.95, -20);
    mrkrab.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    mrkrab.castShadow = true;
    mrkrab.receiveShadow = true;

	scene.add( mrkrab );
    worldOctree.fromGraphNode( mrkrab )

    // Create an AnimationMixer and pass in the model's animations
    mixer_mrcrab = new THREE.AnimationMixer(mrkrab);

    // Play the first animation in the model's animation array
    const action = mixer_mrcrab.clipAction(gltf.animations[0]);
    action.play();
});

//PLANKTON=========================
loader.load( '/plankton/plankton.glb', function ( gltf ) {
    plankton = gltf.scene;
    plankton.scale.set(0.25, 0.25, 0.25);
    plankton.rotation.set(0, -1, 0);
    plankton.position.set(-10, -0.01, -30);
    plankton.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    plankton.castShadow = true;
    plankton.receiveShadow = true;

	scene.add( plankton );
    worldOctree.fromGraphNode( plankton )

    // Create an AnimationMixer and pass in the model's animations
    mixer_plankton = new THREE.AnimationMixer(plankton);

    // Play the first animation in the model's animation array
    const action = mixer_plankton.clipAction(gltf.animations[0]);
    action.play();
});

//KRUSTY KRAB================
loader.load( '/KrustyKrab/krustykrab.glb', function ( gltf ) {
    krustykrab = gltf.scene;
    krustykrab.position.set(-25, -0.5, -13);
    krustykrab.scale.set(3.5, 3.5, 3.5);
    krustykrab.rotation.set(0, -0.8, 0);
    krustykrab.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    krustykrab.castShadow = true;
    krustykrab.receiveShadow = true;
	scene.add( krustykrab );
    worldOctree.fromGraphNode( krustykrab );
});

//TIANG KRUSTY KRAB================
loader.load( '/tiang_krustykrab/tiang_krustykrab.glb', function ( gltf ) {
    tiang_krustykrab = gltf.scene;
    tiang_krustykrab.position.set(-10, 0, -14);
    tiang_krustykrab.rotation.set(0, -2.3, 0);
    tiang_krustykrab.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    tiang_krustykrab.castShadow = true;
    tiang_krustykrab.receiveShadow = true;
	scene.add( tiang_krustykrab );
    worldOctree.fromGraphNode( tiang_krustykrab );
});

//RUMAH SPONGEBOB================
loader.load( '/rumah_spongebob/rumah_spongebob.glb', function ( gltf ) {
    rumah_spongebob = gltf.scene;
    rumah_spongebob.position.set(20, 0, -34);
    rumah_spongebob.scale.set(3.6, 3.6, 3.6);
    rumah_spongebob.rotation.set(0, -1.5, 0);
    rumah_spongebob.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    rumah_spongebob.castShadow = true;
    rumah_spongebob.receiveShadow = true;
	scene.add( rumah_spongebob );
    worldOctree.fromGraphNode( rumah_spongebob );
});

//RUMAH SQUIDWARD================
loader.load( '/rumah_squidward/rumah_squidward.glb', function ( gltf ) {
    rumah_squidward = gltf.scene;
    rumah_squidward.position.set(34, 0, -32);
    rumah_squidward.scale.set(2.8, 2.8, 2.8);
    rumah_squidward.rotation.set(0, -1.8, 0);
    rumah_squidward.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    rumah_squidward.castShadow = true;
    rumah_squidward.receiveShadow = true;
	scene.add( rumah_squidward );
    worldOctree.fromGraphNode( rumah_squidward );
});

//RUMAH PATRICK================
loader.load( '/rumah_patrick/rumah_patrick.glb', function ( gltf ) {
    rumah_patrick = gltf.scene;
    rumah_patrick.position.set(49, 0, -28);
    rumah_patrick.scale.set(2.8, 2.8, 2.8);
    rumah_patrick.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    rumah_patrick.castShadow = true;
    rumah_patrick.receiveShadow = true;
	scene.add( rumah_patrick );
    worldOctree.fromGraphNode( rumah_patrick );
});

//CHUM BUCKET================
loader.load( '/chum_bucket/chum_bucket.glb', function ( gltf ) {
    chum_bucket = gltf.scene;
    chum_bucket.position.set(-10, 0, -35);
    chum_bucket.rotation.set(0, -0.2, 0);
    chum_bucket.scale.set(0.07, 0.07, 0.07);
    chum_bucket.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
    });
    chum_bucket.castShadow = true;
    chum_bucket.receiveShadow = true;
	scene.add( chum_bucket );
    worldOctree.fromGraphNode( chum_bucket );
});

const npcPosition = [
    {x: 10, y: 0, z: 10},
    {x: 54, y: 0.5, z: 3},
    {x: 52, y: 0.5, z: -55},
    {x: 12, y: 0.5, z: -58},
    {x: -27, y: 0.5, z: -60},
    {x: -62, y: 0.5, z: -28},
    {x: -43, y: 0.5, z: 13}
];

//RUMAH NPC=======================
for(let i = 0; i < npcPosition.length; i++){
    loader.load( '/RumahNPC/rumahnpc.glb', function ( gltf ) {
        const npc = npcPosition[i];
        rumahnpc[i] = gltf.scene;
        rumahnpc[i].position.set(npc.x, npc.y, npc.z);
        rumahnpc[i].rotation.set(0, (Math.random() * 360 - 180) * (Math.PI / 180), 0);

        rumahnpc[i].traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
        });
        rumahnpc[i].castShadow = true;
        rumahnpc[i].receiveShadow = true;
        scene.add( rumahnpc[i] );
        worldOctree.fromGraphNode( rumahnpc[i] );
    });
}

//SQUIDWARD=======================
loader.load('/squidward/squidward_spongebob.glb', function ( gltf ) {
    squid = gltf.scene;
    squid.scale.set(0.0028, 0.0028, 0.0028);
    squid.position.set(33, 0.8, -28);
    squid.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    squid.castShadow = true;
    squid.receiveShadow = true;
    
	scene.add( squid );
    worldOctree.fromGraphNode( squid );

    // Create an AnimationMixer and pass in the model's animations
    mixer_squidward = new THREE.AnimationMixer(squid);

    // Play the first animation in the model's animation array
    const action = mixer_squidward.clipAction(gltf.animations[0]);
    action.play();
});

//PATRICK=======================
loader.load('/patrick/patrick.glb', function ( gltf ) {
    patrick = gltf.scene;
    patrick.scale.set(0.5, 0.5, 0.5);
    patrick.position.set(-15, 0, -16);
    patrick.rotation.set(0, -0.8, 0);
    patrick.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    patrick.castShadow = true;
    patrick.receiveShadow = true;
    
	scene.add( patrick );
    worldOctree.fromGraphNode( patrick );

    // Create an AnimationMixer and pass in the model's animations
    mixer_patrick = new THREE.AnimationMixer(patrick);

    // Play the first animation in the model's animation array
    const action = mixer_patrick.clipAction(gltf.animations[0]);
    action.play();
});

//SUN================
loader.load( '/sun/sun.glb', function ( gltf ) {
    sun = gltf.scene;
    sun.position.set(350, 350, -10);
    sun.scale.set(0.1, 0.1, 0.1);
	scene.add( sun );
});

//MOON================
loader.load( '/moon/moon.glb', function ( gltf ) {
    moon = gltf.scene;
    moon.position.set(-350, -350, -10);
	scene.add( moon );
});

const lampPosition = [
    {x: 4.3, y: 0.5, z: -7.5},
    {x: 42, y: 0.5, z: -9},
    {x: 56.5, y: 0.5, z: -21.5},
    {x: 52, y: 0.5, z: -36},
    {x: -0.2, y: 0.5, z: -42},
    {x: -37.6, y: 0.5, z: -43},
    {x: -45, y: 0.5, z: -15.8},
    {x: -19.8, y: 0.5, z: 4}
];

const lampRotation = [
    {x: 0, y: -2.9, z: 0.01},
    {x: 0, y: -2.4, z: 0.01},
    {x: 0, y: -2.3, z: 0.01},
    {x: 0, y: -0.5, z: 0.01},
    {x: 0, y: -0.1, z: 0.01},
    {x: 0, y: 0.2, z: 0.01},
    {x: 0, y: 1.68, z: 0.01},
    {x: 0, y: -2.7, z: 0.01}
];

//STREET LAMP================
for (let i = 0; i < lampPosition.length; i++) {
    loader.load( '/lamp/lamp.glb', function ( gltf ) {
        const lp = lampPosition[i];
        const lr = lampRotation[i];
        lamp[i] = gltf.scene;
        lamp[i].scale.set(0.8, 0.8, 0.8);
        lamp[i].position.set(lp.x, lp.y, lp.z);
        lamp[i].rotation.set(lr.x, lr.y, lr.z);
        lamp[i].traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        lamp[i].castShadow = true;
        lamp[i].receiveShadow = true;
        lampCollider[i] = new THREE.Box3().setFromObject(lamp[i]);
        scene.add( lamp[i] );
        worldOctree.fromGraphNode( lamp[i] );
    });
}

//FLOOR======================
const floorSize = 200; // Size of the visible floor
const tileSize = 10; // Size of each tile
const numTiles = Math.ceil(floorSize / tileSize); // Number of tiles per side

// Create a larger plane to tile the floor texture
const floorGeometry = new THREE.PlaneGeometry(tileSize * numTiles, tileSize * numTiles, numTiles, numTiles);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: true });

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
floorMesh.castShadow = true;
scene.add(floorMesh);

worldOctree.fromGraphNode( floorMesh )

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

/////////////////////////////////////////////////////
//BACKGROUND=========================================

// scene.background = new THREE.Color( 0xa0a0a0 );

/////////////////////////////////////////////////////
//LIGHT==============================================

const hemiLightSiang = new THREE.HemisphereLight( 0xe5e5e5, 0x444444, 1 );
hemiLightSiang.position.set( -250, 250, 10 );
scene.add( hemiLightSiang );

const hemiLightSiang2 = new THREE.HemisphereLight( 0x87ceeb, 0x444444, 1 );
hemiLightSiang2.position.set( 250, 250, -10 );
scene.add( hemiLightSiang2 );

const matahari = new THREE.DirectionalLight( 0xffffff );
matahari.position.set( 250, 250, -10 );
matahari.castShadow = true;
matahari.shadow.camera.left = -100;
matahari.shadow.camera.right = 100;
matahari.shadow.camera.top = 100;
matahari.shadow.camera.bottom = -100;
matahari.shadow.camera.near = 0.1;
matahari.shadow.camera.far = 1000;
matahari.shadow.mapSize.width = 4096;
matahari.shadow.mapSize.height = 4096;
scene.add( matahari );

const bulan = new THREE.DirectionalLight( 0xa5b3c7, 0.2 );
bulan.position.set( -250, -250, -10 );
bulan.castShadow = true;
bulan.shadow.camera.left = -100;
bulan.shadow.camera.right = 100;
bulan.shadow.camera.top = 100;
bulan.shadow.camera.bottom = -100;
bulan.shadow.camera.near = 0.1;
bulan.shadow.camera.far = 1000;
bulan.shadow.mapSize.width = 4096;
bulan.shadow.mapSize.height = 4096;
scene.add( bulan );

const hemiLightMalam = new THREE.HemisphereLight( 0x0c3b66, 0x444444, 0.6 );
hemiLightMalam.position.set( -250, -250, 10 );
scene.add( hemiLightMalam );

const spotlightPosition = [
    {x: 5, y: 10, z: -5},
    {x: 44, y: 10, z: -7.2},
    {x: 59, y: 10, z: -20},
    {x: 54, y: 10, z: -39},
    {x: 0, y: 10, z: -45.3},
    {x: -38, y: 10, z: -46.6},
    {x: -48, y: 10, z: -15},
    {x: -19, y: 10, z: 7}
];
const spotlight = [];
for (let i = 0; i < spotlightPosition.length; i++) {
    const s = spotlightPosition[i];
    spotlight[i] = new THREE.SpotLight(0xfcf49a, 0);
    spotlight[i].position.set(s.x, s.y, s.z); // Atur posisi lampu di atas objek yang ingin disorot
    spotlight[i].target.position.set(s.x, 0, s.z); // Atur posisi target yang ingin disorot
    spotlight[i].castShadow = true; // Aktifkan pengelempokan bayangan pada spotlight
    spotlight[i].shadow.mapSize.width = 4096; // Ukuran bayangan lebar
    spotlight[i].shadow.mapSize.height = 4096; // Ukuran bayangan tinggi
    spotlight[i].shadow.camera.near = 0.1; // Jarak terdekat bayangan
    spotlight[i].shadow.camera.far = 50; // Jarak terjauh bayangan
    spotlight[i].shadow.camera.fov = 30; // Sudut pandang bayangan
    spotlight[i].angle = Math.PI / 7; //
    spotlight[i].penumbra = 0.5; // Intensitas penumbra cahaya
    scene.add(spotlight[i]);
    scene.add(spotlight[i].target);
}

const hemiLampu = new THREE.HemisphereLight( 0xfcf49a, 0x444444, 0 );
hemiLampu.position.set( 5, 10, -5 );
scene.add( hemiLampu );

//OBJECT MOVE=========================================
// Titik titik belok
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9, 0.1, 2.1),
    new THREE.Vector3(3, 0.1, -4),
    new THREE.Vector3(13, 0.1, -5.3),
    new THREE.Vector3(22.5, 0.1, -0.9),
    new THREE.Vector3(33, 0.1, 3.5),
    new THREE.Vector3(39, 0.1, -2.2),
    new THREE.Vector3(44, 0.1, -7.2),
    new THREE.Vector3(50, 0.1, -12),
    new THREE.Vector3(55, 0.1, -15.5),
    new THREE.Vector3(59, 0.1, -20),
    new THREE.Vector3(62, 0.1, -28),
    new THREE.Vector3(61, 0.1, -34),
    new THREE.Vector3(54, 0.1, -39),
    new THREE.Vector3(40, 0.1, -42.7),
    new THREE.Vector3(20, 0.1, -44.2),
    new THREE.Vector3(0, 0.1, -45.3),
    new THREE.Vector3(-20, 0.1, -46.3),
    new THREE.Vector3(-31, 0.1, -46.5),
    new THREE.Vector3(-38, 0.1, -46.6),
    new THREE.Vector3(-43, 0.1, -45),
    new THREE.Vector3(-47, 0.1, -40),
    new THREE.Vector3(-49, 0.1, -27),
    new THREE.Vector3(-48, 0.1, -15),
    new THREE.Vector3(-42, 0.1, -5),
    new THREE.Vector3(-36, 0.1, 0),
    new THREE.Vector3(-29.5, 0.1, 5),
    new THREE.Vector3(-23, 0.1, 7.3),
    new THREE.Vector3(-19, 0.1, 7),
    new THREE.Vector3(-9, 0.1, 2.1)
]);

// Array isinya x, y, z posisi track
const targetPositions = curve.getPoints(1000);

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

    if(ridingCar){
        // Animasi Posisi Object
        // car.collider.center.copy(car.position)
        car.position.lerp(targetPositions[targetIndex], t);
        carCapsule.collider = new THREE.Box3().setFromObject(car);
        
        // Animasi Rotasi Object
        car.rotation.x = THREE.MathUtils.lerp(car.rotation.x, targetRotations[targetIndex].x, t);
        car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, targetRotations[targetIndex].y, t);
        car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, targetRotations[targetIndex].z, t);

        // Animasi Posisi Camera
        camera.position.lerp({
            x: targetPositions[targetIndex].x,
            y: targetPositions[targetIndex].y + 1.5,
            z: targetPositions[targetIndex].z
        }, t);

        frameCount++;
        if (frameCount > 1) {
            frameCount = 0;
            targetIndex++;
            if (targetIndex >= targetPositions.length - 1) {
                targetIndex = 0;
            }
        }
    }
    

    ////////////////////////////////////////////////////////////////////////
    //MOVEMENTS ANIMATION=================================================
    const deltaTime = Math.min( 0.05, clock.getDelta()*1.15 ) / STEPS_PER_FRAME;

    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

        controls( deltaTime );

        updatePlayer( deltaTime );

        teleportPlayerIfOob();

    }
    
    // Apply animasi yang dari 3D model blender
    if (mixer_squidward) mixer_squidward.update(deltaTime);
    if (mixer_mrcrab) mixer_mrcrab.update(deltaTime);
    if (mixer_patrick) mixer_patrick.update(deltaTime);
    if (mixer_plankton) mixer_plankton.update(deltaTime);
    
    // Menghitung sudut rotasi
    var angle = Date.now() * 0.0001; // Nilai sudut berdasarkan waktu

    // Mengatur posisi objek dengan jari jari
    var radius = 250;
    var x = Math.cos(angle) * radius;
    var y = Math.sin(angle) * radius;

    // Mengubah posisi objek
    //Siang
    matahari.position.x = x;
    matahari.position.y = y;
    
    if (sun) {
        sun.position.x = x;
        sun.position.y = y;
        sun.rotation.z += 0.0005;
    }
    
    hemiLightSiang.position.x = x;
    hemiLightSiang.position.y = y;

    hemiLightSiang2.position.x = -x;
    hemiLightSiang2.position.y = y;

    //Malem
    bulan.position.x = -x;
    bulan.position.y = -y;

    if (moon) {
        moon.position.x = -x;
        moon.position.y = -y;
        moon.rotation.z += 0.0005;
    }

    hemiLightMalam.position.x = -x;
    hemiLightMalam.position.y = -y;

    // Intensity cahaya
    //Siang
    if(y < -25 && matahari.intensity > 0.2){
        matahari.intensity -= 0.005
        hemiLightSiang.intensity -= 0.005
        hemiLightSiang2.intensity -= 0.005
    }else if(y >= -25 && matahari.intensity < 1){
        matahari.intensity += 0.005
        hemiLightSiang.intensity += 0.005
        hemiLightSiang2.intensity += 0.005
    }
    // console.log(matahari.intensity)
    if(y >= 0){
        for(let i = 0; i < spotlightPosition.length; i++) {
            spotlight[i].intensity = 0;
        }
        hemiLampu.intensity = 0;

        if (road) {
            road.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
        }
    }else{
        for(let i = 0; i < lampCollider.length; i++) {
            if ((lampCollider[i] && isPlayerAroundObject(lampCollider[i], playerCollider, 10) && !ridingCar) || (carCapsule.collider && isPlayerAroundObject(lampCollider[i], carCapsule.collider, 10))) {
                spotlight[i].intensity = 1;
                hemiLampu.intensity = 0.1;
            } else {
                spotlight[i].intensity = 0;
                hemiLampu.intensity = 0;
            }
        }
        
        if (road) {
            road.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = false;
                    node.receiveShadow = true;
                }
            });
        }
    }

    renderer.render( scene, camera );
}

animate();