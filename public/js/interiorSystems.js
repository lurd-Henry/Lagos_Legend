import * as THREE from "three";

export class InteriorSystems {

    constructor(scene, player, camera, container) {

        this.scene = scene;
        this.player = player;
        this.camera = camera;
        this.container = container;

        this.isInside = false;
        this.currentInterior = null;

        this.interiorGroup = null;
        this.furniture = [];
        this.colliders = [];

        this.savedPosition = new THREE.Vector3();
        this.savedRotation = 0;
        // Exterior visibility management
this.savedVisibility = new Map();

this.savedBackground = null;
this.savedFog = null;

        this.interiorCenter = new THREE.Vector3(1000, 0, 1000);

        this.roomWidth = 18;
        this.roomDepth = 16;

        this.createMaterials();
        this.createInteractionButton();

    }

    // =====================================
    // MATERIALS
    // =====================================

    createMaterials() {

        this.materials = {

            floor: new THREE.MeshStandardMaterial({
                color: 0xbca98c
            }),

            wall: new THREE.MeshStandardMaterial({
                color: 0xe5d8c5
            }),

            darkWall: new THREE.MeshStandardMaterial({
                color: 0x8b7058
            }),

            wood: new THREE.MeshStandardMaterial({
                color: 0x75472e
            }),

            darkWood: new THREE.MeshStandardMaterial({
                color: 0x39251c
            }),

            sofa: new THREE.MeshStandardMaterial({
                color: 0x6e4638
            }),

            fabric: new THREE.MeshStandardMaterial({
                color: 0x9c7959
            }),

            glass: new THREE.MeshStandardMaterial({
                color: 0x7ba6b9,
                roughness: 0.3
            }),

            metal: new THREE.MeshStandardMaterial({
                color: 0x44484a
            }),

            white: new THREE.MeshStandardMaterial({
                color: 0xf2eee5
            }),

            green: new THREE.MeshStandardMaterial({
                color: 0x477747
            })

        };

    }

    // =====================================
    // INTERACTION BUTTON
    // =====================================

    createInteractionButton() {

        const button = document.createElement("button");

        button.id = "interior-exit-button";
        button.innerHTML = "🚪 EXIT BUILDING";

        button.style.cssText = `
            position:absolute;
            bottom:145px;
            right:22px;
            z-index:1000;
            display:none;
            padding:14px 20px;
            border:none;
            border-radius:12px;
            background:#d9a441;
            color:#171717;
            font-weight:800;
            font-size:13px;
            cursor:pointer;
        `;

        this.container.appendChild(button);

        this.exitButton = button;

        button.addEventListener("click", () => {
            this.exit();
        });

    }

    // =====================================
    // CREATE BOX
    // =====================================

    createBox(
        width,
        height,
        depth,
        material,
        x,
        y,
        z
    ) {

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );

        mesh.position.set(x, y, z);

        this.interiorGroup.add(mesh);

        return mesh;

    }

    // =====================================
    // CREATE INTERIOR
    // =====================================

    createInterior(type) {

        if (this.interiorGroup) {

            this.scene.remove(this.interiorGroup);

        }

        this.interiorGroup = new THREE.Group();

        this.interiorGroup.position.copy(this.interiorCenter);

        this.scene.add(this.interiorGroup);

        this.furniture = [];
        this.colliders = [];

        // Floor
        this.createBox(
            18,
            0.3,
            16,
            this.materials.floor,
            0,
            0,
            0
        );

        // Back wall
        this.createBox(
            18,
            5,
            0.4,
            this.materials.wall,
            0,
            2.5,
            -8
        );

        // Left wall
        this.createBox(
            0.4,
            5,
            16,
            this.materials.wall,
            -9,
            2.5,
            0
        );

        // Right wall
        this.createBox(
            0.4,
            5,
            16,
            this.materials.wall,
            9,
            2.5,
            0
        );

        // Front wall with entrance opening
        this.createBox(
            7,
            5,
            0.4,
            this.materials.wall,
            -5.5,
            2.5,
            8
        );

        this.createBox(
            7,
            5,
            0.4,
            this.materials.wall,
            5.5,
            2.5,
            8
        );

        // Door header
        this.createBox(
            4,
            1.5,
            0.4,
            this.materials.wall,
            0,
            4.25,
            8
        );

        // Ceiling
        this.createBox(
            18,
            0.3,
            16,
            this.materials.white,
            0,
            5,
            0
        );

        // Interior lights
        // =====================================
// INTERIOR LIGHTING
// =====================================

const ambient = new THREE.AmbientLight(
    0xffe8cf,
    1.8
);

this.interiorGroup.add(ambient);

const light = new THREE.PointLight(
    0xffd9a1,
    55,
    35
);

light.position.set(0, 4.3, 0);

this.interiorGroup.add(light);
        light.position.set(0, 4.3, 0);

        this.interiorGroup.add(light);

        // Windows
        this.createWindow(-5, 2.8, -7.75);
        this.createWindow(5, 2.8, -7.75);

        if (type === "house") {

            this.createLivingRoom();
            this.createBedroom();

        } else {

            this.createShop();

        }

        this.createDoor();

    }
// =====================================
// HIDE EXTERIOR WORLD
// =====================================

hideExterior() {

    this.savedVisibility.clear();

    this.savedBackground = this.scene.background;
    this.savedFog = this.scene.fog;

    for (const object of this.scene.children) {

        // Keep player visible
        if (object === this.player) continue;

        // Keep interior visible
        if (object === this.interiorGroup) continue;

        this.savedVisibility.set(
            object,
            object.visible
        );

        object.visible = false;

    }

    // Indoor background
    this.scene.background = new THREE.Color(0x201b17);

    this.scene.fog = null;

}


// =====================================
// RESTORE EXTERIOR WORLD
// =====================================

restoreExterior() {

    for (const [object, visibility] of this.savedVisibility) {

        object.visible = visibility;

    }

    this.savedVisibility.clear();

    this.scene.background = this.savedBackground;
    this.scene.fog = this.savedFog;

}
    // =====================================
    // WINDOWS
    // =====================================

    createWindow(x, y, z) {

        this.createBox(
            2.5,
            1.5,
            0.08,
            this.materials.glass,
            x,
            y,
            z
        );

    }

    // =====================================
    // FURNITURE
    // =====================================

    addFurniture(name, x, z, width, depth) {

        this.furniture.push({
            name,
            x,
            z,
            width,
            depth
        });

    }

    // =====================================
    // SOFA
    // =====================================

    createSofa(x, z) {

        this.createBox(
            5,
            0.8,
            1.5,
            this.materials.sofa,
            x,
            0.7,
            z
        );

        this.createBox(
            5,
            1.5,
            0.5,
            this.materials.sofa,
            x,
            1.5,
            z - 0.5
        );

        this.addFurniture("Sofa", x, z, 5, 1.5);

    }

    // =====================================
    // TABLE
    // =====================================

    createTable(x, z) {

        this.createBox(
            3,
            0.25,
            2,
            this.materials.wood,
            x,
            1.5,
            z
        );

        for (const dx of [-1.2, 1.2]) {

            for (const dz of [-0.7, 0.7]) {

                this.createBox(
                    0.2,
                    1.5,
                    0.2,
                    this.materials.darkWood,
                    x + dx,
                    0.75,
                    z + dz
                );

            }

        }

        this.addFurniture("Table", x, z, 3, 2);

    }

    // =====================================
    // BED
    // =====================================

    createBed(x, z) {

        this.createBox(
            4,
            0.5,
            5,
            this.materials.darkWood,
            x,
            0.45,
            z
        );

        this.createBox(
            3.8,
            0.3,
            4.8,
            this.materials.white,
            x,
            0.85,
            z
        );

        this.createBox(
            3.8,
            0.5,
            1,
            this.materials.fabric,
            x,
            1.1,
            z - 1.8
        );

        this.addFurniture("Bed", x, z, 4, 5);

    }

    // =====================================
    // TV
    // =====================================

    createTV(x, z) {

        this.createBox(
            3,
            1.8,
            0.2,
            this.materials.metal,
            x,
            2,
            z
        );

        this.createBox(
            2.7,
            1.5,
            0.05,
            new THREE.MeshBasicMaterial({
                color: 0x101820
            }),
            x,
            2,
            z + 0.13
        );

        this.addFurniture("Television", x, z, 3, 0.5);

    }

    // =====================================
    // KITCHEN
    // =====================================

    createKitchen() {

        this.createBox(
            5,
            1.5,
            1.5,
            this.materials.darkWood,
            -5.5,
            0.8,
            5
        );

        this.createBox(
            5,
            0.2,
            1.6,
            this.materials.white,
            -5.5,
            1.65,
            5
        );

        this.addFurniture(
            "Kitchen counter",
            -5.5,
            5,
            5,
            1.6
        );

    }

    // =====================================
    // LIVING ROOM
    // =====================================

    createLivingRoom() {

        this.createSofa(-3, -2);

        this.createTable(1, -2);

        this.createTV(6, -5);

        this.createKitchen();

        this.createBox(
            2,
            2.5,
            0.2,
            this.materials.wood,
            6,
            1.25,
            5
        );

    }

    // =====================================
    // BEDROOM
    // =====================================

    createBedroom() {

        this.createBed(-5, -6);

        this.createBox(
            2,
            2,
            1,
            this.materials.darkWood,
            4,
            1,
            -5
        );

    }

    // =====================================
    // SHOP INTERIOR
    // =====================================

    createShop() {

        // Shop counter
        this.createBox(
            7,
            1.4,
            1.5,
            this.materials.wood,
            0,
            0.8,
            2
        );

        this.addFurniture(
            "Shop counter",
            0,
            2,
            7,
            1.5
        );

        // Shelves
        for (const x of [-6, 6]) {

            this.createBox(
                1,
                3,
                6,
                this.materials.darkWood,
                x,
                1.5,
                -3
            );

            this.addFurniture(
                "Shop shelf",
                x,
                -3,
                1,
                6
            );

        }

        // Shopkeeper placeholder
        const shopkeeper = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.45, 1.1, 4, 8),
            new THREE.MeshStandardMaterial({
                color: 0x287b5b
            })
        );

        body.position.y = 1.1;

        shopkeeper.add(body);

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0x8c593e
            })
        );

        head.position.y = 2;

        shopkeeper.add(head);

        shopkeeper.position.set(0, 0, -0.5);

        this.interiorGroup.add(shopkeeper);

        this.shopkeeper = shopkeeper;

    }

    // =====================================
    // INTERIOR DOOR
    // =====================================

    createDoor() {

        this.createBox(
            3.5,
            3.5,
            0.2,
            this.materials.darkWood,
            0,
            1.75,
            7.8
        );

        this.door = this.interiorGroup.children[
            this.interiorGroup.children.length - 1
        ];

        this.door.userData.isDoor = true;

    }

    // =====================================
    // ENTER BUILDING
    // =====================================

    // =====================================
// ENTER BUILDING
// =====================================

enter(type, exteriorX, exteriorZ) {

    if (this.isInside) return;

    this.savedPosition.copy(this.player.position);

    this.savedRotation = this.player.rotation.y;

    this.currentInterior = type;

    this.createInterior(type);

    // Hide outdoor environment
    this.hideExterior();

    this.isInside = true;

    // Place player inside
    this.player.position.set(
        1000,
        0,
        1004
    );

    this.player.rotation.y = Math.PI;

    this.player.visible = true;

    this.exitButton.style.display = "block";

    console.log("Entered interior:", type);

}

    // =====================================
    // EXIT BUILDING
    // =====================================

    // =====================================
// EXIT BUILDING
// =====================================

exit() {

    if (!this.isInside) return;

    // Restore outdoor environment
    this.restoreExterior();

    // Restore player position
    this.player.position.copy(this.savedPosition);

    this.player.rotation.y = this.savedRotation;

    this.isInside = false;

    this.currentInterior = null;

    this.exitButton.style.display = "none";

    if (this.interiorGroup) {

        this.scene.remove(this.interiorGroup);

        this.interiorGroup = null;

    }

    this.furniture = [];

    console.log("Exited interior");

}

    // =====================================
    // INTERIOR COLLISION
    // =====================================

    movePlayer(player, moveX, moveZ, speed, delta) {

        if (!this.isInside) return;

        const nextX =
            player.position.x + moveX * speed * delta;

        const nextZ =
            player.position.z + moveZ * speed * delta;

        const minX = 991.5;
        const maxX = 1008.5;

        const minZ = 992.5;
        const maxZ = 1007;

        player.position.x = THREE.MathUtils.clamp(
            nextX,
            minX,
            maxX
        );

        player.position.z = THREE.MathUtils.clamp(
            nextZ,
            minZ,
            maxZ
        );

        if (moveX !== 0 || moveZ !== 0) {

            player.rotation.y = Math.atan2(
                moveX,
                moveZ
            );

        }

    }

    // =====================================
    // FURNITURE INTERACTIONS
    // =====================================

    interact() {

        if (!this.isInside) return;

        const playerPosition = this.player.position;

        let nearest = null;
        let nearestDistance = Infinity;

        for (const item of this.furniture) {

            const distance = Math.hypot(
                playerPosition.x - (1000 + item.x),
                playerPosition.z - (1000 + item.z)
            );

            if (distance < 3 && distance < nearestDistance) {

                nearest = item;
                nearestDistance = distance;

            }

        }

        if (!nearest) return;

        if (nearest.name === "Television") {

            alert("The television is currently unavailable.");

        } else if (nearest.name === "Bed") {

            alert("Resting and sleep mechanics coming soon!");

        } else if (
            nearest.name === "Shop counter"
        ) {

            alert("Welcome! The Lagos Legends shop system is coming soon.");

        } else {

            alert(nearest.name);

        }

    }

}
