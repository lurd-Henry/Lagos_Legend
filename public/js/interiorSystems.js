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

        // =====================================
// INTERIOR DIMENSIONS
// =====================================

this.roomWidth = 30;
this.roomDepth = 26;

// Player collision radius
this.playerRadius = 0.45;

// Comfortable multiplayer spacing
this.interiorSpawnZ = 1008;

        this.createMaterials();
        this.createInteractionButton();
//SHOP INTERIOR
this.storeCatalog = {

    restaurant: [
        {
            id: "jollof",
            name: "Jollof Rice",
            price: 2500,
            category: "food",
            hunger: 30
        },
        {
            id: "fried-rice",
            name: "Fried Rice & Chicken",
            price: 3500,
            category: "food",
            hunger: 45
        },
        {
            id: "burger",
            name: "Burger",
            price: 3000,
            category: "food",
            hunger: 35
        },
        {
            id: "shawarma",
            name: "Shawarma",
            price: 2500,
            category: "food",
            hunger: 30
        },
        {
            id: "water",
            name: "Bottled Water",
            price: 500,
            category: "food",
            hunger: 5
        }
    ],

    supermarket: [
        {
            id: "bread",
            name: "Bread",
            price: 1500,
            category: "food",
            hunger: 15
        },
        {
            id: "noodles",
            name: "Instant Noodles",
            price: 1200,
            category: "food",
            hunger: 15
        },
        {
            id: "milk",
            name: "Milk",
            price: 1800,
            category: "food",
            hunger: 10
        },
        {
            id: "water-pack",
            name: "Water",
            price: 500,
            category: "food",
            hunger: 5
        }
    ],

    clothing: [
        {
            id: "shirt",
            name: "Casual Shirt",
            price: 8000,
            category: "clothing"
        },
        {
            id: "trousers",
            name: "Trousers",
            price: 10000,
            category: "clothing"
        },
        {
            id: "sneakers",
            name: "Sneakers",
            price: 15000,
            category: "clothing"
        },
        {
            id: "cap",
            name: "Cap",
            price: 5000,
            category: "clothing"
        }
    ],

    hospital: [
        {
            id: "treatment",
            name: "Medical Treatment",
            price: 5000,
            category: "health",
            health: 50
        },
        {
            id: "full-treatment",
            name: "Full Treatment",
            price: 12000,
            category: "health",
            health: 100
        }
    ],

    pharmacy: [
        {
            id: "painkiller",
            name: "Pain Relief",
            price: 1000,
            category: "medicine"
        },
        {
            id: "first-aid",
            name: "First Aid Kit",
            price: 3500,
            category: "medicine"
        }
    ],

    barber: [
        {
            id: "haircut",
            name: "Haircut",
            price: 3000,
            category: "appearance"
        },
        {
            id: "beard",
            name: "Beard Trim",
            price: 2000,
            category: "appearance"
        }
    ],

    nightclub: [
        {
            id: "entry",
            name: "Club Entry",
            price: 3000,
            category: "entertainment"
        },
        {
            id: "vip",
            name: "VIP Access",
            price: 15000,
            category: "entertainment"
        },
        {
            id: "mocktail",
            name: "Mocktail",
            price: 2500,
            category: "food"
        }
    ]
};
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

        // Windows
        this.createWindow(-5, 2.8, -7.75);
        this.createWindow(5, 2.8, -7.75);

        this.createInteriorLayout(type);

        this.createDoor();

    }
    createInteriorLayout(type) {

    switch (type) {

        case "house":
            this.createLivingRoom();
            this.createBedroom();
            break;

        case "bank":
            this.createBank();
            break;

        case "hospital":
            this.createHospital();
            break;

        case "restaurant":
            this.createRestaurant();
            break;

        case "supermarket":
            this.createSupermarket();
            break;

        case "barber":
            this.createBarberShop();
            break;

        case "clothing":
            this.createClothingStore();
            break;

        case "police":
            this.createPoliceStation();
            break;

        case "nightclub":
            this.createNightclub();
            break;

        case "pharmacy":
            this.createPharmacy();
            break;

        case "office":
            this.createOffice();
            break;

        default:
            this.createShop();

    }

}

createFixture(
    name,
    width,
    height,
    depth,
    x,
    y,
    z,
    material = this.materials.wood
) {

    this.createBox(
        width,
        height,
        depth,
        material,
        x,
        y,
        z
    );

    this.addFurniture(
        name,
        x,
        z,
        width,
        depth
    );

}
//FURNITURES

// =====================================
// INTERIOR DECORATION HELPERS
// =====================================

createChair(x, z, material = this.materials.fabric) {

    this.createBox(
        1.1,
        0.5,
        1.1,
        material,
        x,
        0.45,
        z
    );

    this.createBox(
        1.1,
        1.1,
        0.35,
        material,
        x,
        1.0,
        z - 0.35
    );

    this.addFurniture(
        "Chair",
        x,
        z,
        1.1,
        1.1
    );

}

createSmallTable(
    x,
    z,
    material = this.materials.wood
) {

    this.createBox(
        1.8,
        0.25,
        1.2,
        material,
        x,
        1.15,
        z
    );

    for (const dx of [-0.65, 0.65]) {

        for (const dz of [-0.4, 0.4]) {

            this.createBox(
                0.12,
                1.1,
                0.12,
                this.materials.darkWood,
                x + dx,
                0.55,
                z + dz
            );

        }

    }

}

createShelf(
    x,
    z,
    width = 1.2,
    height = 3,
    depth = 4
) {

    this.createBox(
        width,
        height,
        depth,
        this.materials.darkWood,
        x,
        height / 2,
        z
    );

    // Shelf lines
    for (
        let y = 0.6;
        y < height;
        y += 0.7
    ) {

        this.createBox(
            width + 0.05,
            0.08,
            depth + 0.05,
            this.materials.wood,
            x,
            y,
            z
        );

    }

}

createProductDisplay(
    x,
    z,
    material = this.materials.green
) {

    this.createBox(
        0.35,
        0.35,
        0.35,
        material,
        x,
        0.8,
        z
    );

    this.createBox(
        0.35,
        0.35,
        0.35,
        this.materials.white,
        x,
        1.3,
        z
    );

    this.createBox(
        0.35,
        0.35,
        0.35,
        this.materials.fabric,
        x,
        1.8,
        z
    );

}

createCounter(
    name,
    x,
    z,
    width = 6,
    material = this.materials.wood
) {

    this.createFixture(
        name,
        width,
        1.3,
        1.5,
        x,
        0.8,
        z,
        material
    );

    // Counter top
    this.createBox(
        width + 0.15,
        0.15,
        1.65,
        this.materials.white,
        x,
        1.5,
        z
    );

}

createNeonLight(
    x,
    y,
    z,
    color
) {

    const material =
        new THREE.MeshBasicMaterial({
            color
        });

    this.createBox(
        4,
        0.08,
        0.15,
        material,
        x,
        y,
        z
    );

}

createPlant(x, z) {

    const pot =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.35,
                0.45,
                0.6,
                8
            ),
            this.materials.wood
        );

    pot.position.set(
        x,
        0.3,
        z
    );

    this.interiorGroup.add(pot);

    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.75,
                8,
                6
            ),
            this.materials.green
        );

    leaves.position.set(
        x,
        1.15,
        z
    );

    this.interiorGroup.add(leaves);

}

createWallDecor(
    x,
    y,
    z,
    width = 2,
    height = 1
) {

    this.createBox(
        width,
        height,
        0.08,
        this.materials.darkWood,
        x,
        y,
        z
    );

}

    
createBank() {

    // Main teller counter
    this.createFixture(
        "Bank teller counter",
        12, 1.3, 1.5,
        0, 0.8, -5,
        this.materials.darkWood
    );

    // Office desks
    this.createFixture(
        "Bank office desk",
        3, 1.2, 2,
        -6, 0.7, -1,
        this.materials.wood
    );

    this.createFixture(
        "Bank office desk",
        3, 1.2, 2,
        6, 0.7, -1,
        this.materials.wood
    );

    // Waiting seats
    for (const x of [-5, 0, 5]) {

        this.createFixture(
            "Waiting chair",
            1.5, 0.8, 1.5,
            x, 0.4, 3,
            this.materials.fabric
        );

    }

}

createHospital() {

    // Reception
    this.createCounter(
        "Hospital reception",
        0,
        -5,
        10,
        this.materials.white
    );

    // Waiting area
    for (const x of [-5, -2, 2, 5]) {

        this.createChair(
            x,
            3,
            this.materials.white
        );

    }

    // Beds
    for (const x of [-5, 0, 5]) {

        this.createBed(
            x,
            -1
        );

        // Bedside cabinet
        this.createFixture(
            "Bedside cabinet",
            1,
            1.2,
            1,
            x + 2,
            0.6,
            -1,
            this.materials.wood
        );

    }

    // Medical equipment
    this.createFixture(
        "Medical monitor",
        1,
        2,
        0.7,
        -7,
        1,
        -1,
        this.materials.metal
    );

    this.createFixture(
        "Medical equipment",
        2,
        1.2,
        1,
        7,
        0.6,
        -1,
        this.materials.metal
    );

    // Pharmacy corner
    this.createCounter(
        "Hospital pharmacy",
        0,
        5,
        5,
        this.materials.white
    );

    this.createNeonLight(
        0,
        4.3,
        -7.7,
        0x7fd6ff
    );

}
createRestaurant() {

    // Service counter
    this.createCounter(
        "Restaurant cashier counter",
        0,
        -5,
        10,
        this.materials.darkWood
    );

    // Kitchen/service area
    this.createFixture(
        "Kitchen counter",
        5,
        1.3,
        4,
        5,
        0.8,
        -3,
        this.materials.metal
    );

    this.createFixture(
        "Kitchen fridge",
        1.5,
        3.5,
        1.5,
        7,
        1.75,
        -5,
        this.materials.glass
    );

    // Dining tables
    for (const x of [-5, 0, 5]) {

        for (const z of [0, 4]) {

            this.createSmallTable(
                x,
                z
            );

            this.createChair(
                x - 1.5,
                z
            );

            this.createChair(
                x + 1.5,
                z
            );

        }

    }

    // Menu board
    this.createWallDecor(
        0,
        3.2,
        -7.75,
        6,
        1.5
    );

    // Plants
    this.createPlant(-7, 5);
    this.createPlant(7, 5);

    // Lighting
    this.createNeonLight(
        0,
        4.3,
        -7.7,
        0xffc857
    );

}

createSupermarket() {

    // Checkout
    this.createCounter(
        "Supermarket checkout",
        0,
        -6,
        8
    );

    // Shelves
    for (const x of [-6, -2, 2, 6]) {

        this.createShelf(
            x,
            0,
            1.2,
            3,
            5
        );

        this.createProductDisplay(
            x,
            -1.5
        );

        this.createProductDisplay(
            x,
            0
        );

        this.createProductDisplay(
            x,
            1.5
        );

    }

    // Refrigerator section
    this.createFixture(
        "Drinks refrigerator",
        2,
        3.5,
        5,
        -7,
        1.75,
        -5,
        this.materials.glass
    );

    // Basket area
    this.createFixture(
        "Shopping basket stand",
        2,
        1,
        1.5,
        7,
        0.5,
        -5,
        this.materials.metal
    );

    // Store sign
    this.createWallDecor(
        0,
        3.3,
        -7.75,
        6,
        1
    );

}
createBarberShop() {

    // Reception
    this.createFixture(
        "Barber reception",
        7, 1.3, 1.5,
        0, 0.8, -5,
        this.materials.wood
    );

    // Barber stations
    for (const x of [-5, 5]) {

        this.createFixture(
            "Barber chair",
            2, 1.5, 2,
            x, 0.75, 0,
            this.materials.sofa
        );

        this.createBox(
            2.5, 2, 0.1,
            this.materials.glass,
            x, 2.2, -7.7
        );

    }

    this.createFixture(
        "Waiting bench",
        6, 0.8, 1.2,
        0, 0.4, 4,
        this.materials.fabric
    );

}

createClothingStore() {

    // Checkout
    this.createCounter(
        "Clothing checkout",
        0,
        -6,
        6
    );

    // Clothing racks
    for (const x of [-6, 6]) {

        this.createFixture(
            "Clothing rack",
            1.2,
            2.5,
            5,
            x,
            1.25,
            0,
            this.materials.metal
        );

    }

    // Display tables
    this.createFixture(
        "Clothing display",
        3,
        1,
        2,
        -2,
        0.5,
        3,
        this.materials.darkWood
    );

    this.createFixture(
        "Clothing display",
        3,
        1,
        2,
        2,
        0.5,
        3,
        this.materials.darkWood
    );

    // Mirrors
    this.createBox(
        2.5,
        3,
        0.08,
        this.materials.glass,
        -5,
        1.8,
        -7.7
    );

    this.createBox(
        2.5,
        3,
        0.08,
        this.materials.glass,
        5,
        1.8,
        -7.7
    );

    // Changing rooms
    this.createFixture(
        "Changing room",
        3,
        3,
        3,
        5,
        1.5,
        4,
        this.materials.fabric
    );

    this.createFixture(
        "Changing room",
        3,
        3,
        3,
        -5,
        1.5,
        4,
        this.materials.fabric
    );

}
createPoliceStation() {

    this.createFixture(
        "Police reception",
        10, 1.3, 2,
        0, 0.8, -5,
        this.materials.darkWood
    );

    for (const x of [-5, 5]) {

        this.createFixture(
            "Police office desk",
            3, 1.2, 2,
            x, 0.7, 0,
            this.materials.wood
        );

    }

    // Holding cell bars
    for (let x = -2; x <= 2; x += 1) {

        this.createBox(
            0.12, 3.5, 0.12,
            this.materials.metal,
            x, 1.75, 5
        );

    }

}

createNightclub() {

    // Bar
    this.createCounter(
        "Nightclub bar",
        0,
        -6,
        10,
        this.materials.darkWood
    );

    // DJ booth
    this.createFixture(
        "DJ booth",
        5,
        1.5,
        2,
        0,
        0.8,
        -2,
        this.materials.metal
    );

    // Dance floor
    this.createBox(
        9,
        0.12,
        6,
        this.materials.darkWood,
        0,
        0.08,
        3
    );

    // VIP tables
    this.createSmallTable(-6, 4);
    this.createSmallTable(6, 4);

    // Seating
    this.createSofa(
        -5,
        1
    );

    this.createSofa(
        5,
        1
    );

    // DJ lighting
    this.createNeonLight(
        0,
        3.5,
        -2.7,
        0xff247f
    );

    this.createNeonLight(
        -6,
        3.5,
        0,
        0x5c7cff
    );

    this.createNeonLight(
        6,
        3.5,
        0,
        0xff247f
    );

    // Club wall decoration
    this.createWallDecor(
        0,
        3.2,
        -7.75,
        7,
        1.5
    );

}
createPharmacy() {

    this.createFixture(
        "Pharmacy counter",
        8, 1.3, 1.5,
        0, 0.8, -5,
        this.materials.white
    );

    for (const x of [-6, 6]) {

        this.createFixture(
            "Medicine shelf",
            1.2, 3, 6,
            x, 1.5, 0,
            this.materials.green
        );

    }

}

createOffice() {

    this.createFixture(
        "Office reception",
        8, 1.3, 1.5,
        0, 0.8, -5,
        this.materials.darkWood
    );

    for (const x of [-5, 5]) {

        this.createFixture(
            "Office desk",
            3, 1.2, 2,
            x, 0.7, 0,
            this.materials.wood
        );

    }

    this.createFixture(
        "Conference table",
        5, 0.3, 3,
        0, 1.4, 4,
        this.materials.wood
    );

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

    // Furniture collision boundary
    this.colliders.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
    });

}
    // =====================================
// CHECK FURNITURE COLLISION
// =====================================

collidesWithFurniture(x, z) {

    const playerRadius = 0.45;

    for (const box of this.colliders) {

        if (
            x + playerRadius > box.minX &&
            x - playerRadius < box.maxX &&
            z + playerRadius > box.minZ &&
            z - playerRadius < box.maxZ
        ) {

            return true;

        }

    }

    return false;

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
        1008
    );

    this.player.rotation.y = Math.PI;

    this.player.visible = true;

    this.exitButton.style.display = "block";

    console.log("Entered interior:", type);
     if (
    window.lagosBusinessMenu &&
    type !== "house" &&
    type !== "police" &&
    type !== "office" &&
    type !== "shop"
) {
    window.lagosBusinessMenu.open(type);
}


}
   
    // =====================================
    // EXIT BUILDING
    // =====================================

    // =====================================
// EXIT BUILDING
// =====================================

exit() {
    if (window.lagosBusinessMenu) {
    window.lagosBusinessMenu.close();
}
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
// INTERIOR COLLISION + PLAYER MOVEMENT
// =====================================

movePlayer(player, moveX, moveZ, speed, delta) {

    if (!this.isInside) return;

    const minX = 991.5;
    const maxX = 1008.5;

    const minZ = 992.5;
    const maxZ = 1007;

    const nextX =
        player.position.x + moveX * speed * delta;

    const nextZ =
        player.position.z + moveZ * speed * delta;

    // Try horizontal movement first
    const clampedX = THREE.MathUtils.clamp(
        nextX,
        minX,
        maxX
    );

    if (!this.collidesWithFurniture(
        clampedX - 1000,
        player.position.z - 1000
    )) {

        player.position.x = clampedX;

    }

    // Try vertical movement separately
    const clampedZ = THREE.MathUtils.clamp(
        nextZ,
        minZ,
        maxZ
    );

    if (!this.collidesWithFurniture(
        player.position.x - 1000,
        clampedZ - 1000
    )) {

        player.position.z = clampedZ;

    }

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

    const nearby = this.getNearestInteractableFurniture();

    if (!nearby) return;

    if (nearby.userData.businessCounter) {

        this.openStore(
            nearby.userData.businessType
        );

        return;
    }

    if (nearby.userData.serviceType) {

        this.openStore(
            nearby.userData.serviceType
        );

        return;
    }

    if (nearby.userData.type === "exit") {

        this.exit();

        return;
    }
}
}
