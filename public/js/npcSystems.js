import * as THREE from "three";

export class NPCSystems {

    constructor(scene, world, container) {

        this.scene = scene;
        this.world = world;
        this.container = container;

        this.npcs = [];

        this.playerReference = null;

        this.createMaterials();
        this.createDialogueUI();

        this.createPedestrians(50);

    }

    // =====================================
    // NPC MATERIALS
    // =====================================

    createMaterials() {

        this.skinColors = [
            0x8d5438,
            0x603a29,
            0xa96e4c,
            0x75452f,
            0xb77b55,
            0x493027
        ];

        this.shirtColors = [
            0x246b9b,
            0x9c3535,
            0x31845b,
            0xd2a12f,
            0x714b91,
            0xe0e0e0,
            0x292929
        ];

        this.trouserColors = [
            0x252b38,
            0x353535,
            0x514333,
            0x344b67,
            0x777777
        ];

        this.hairColors = [
            0x171412,
            0x29201b,
            0x3c2a21
        ];

        // Shared geometry for better performance.

        this.geometries = {

            head: new THREE.SphereGeometry(0.3, 8, 6),

            hair: new THREE.SphereGeometry(0.32, 8, 5),

            body: new THREE.CylinderGeometry(
                0.25, 0.34, 0.85, 7
            ),

            arm: new THREE.CylinderGeometry(
                0.09, 0.11, 0.65, 6
            ),

            leg: new THREE.CylinderGeometry(
                0.11, 0.13, 0.75, 6
            ),

            hand: new THREE.SphereGeometry(0.11, 6, 5),

            shoe: new THREE.BoxGeometry(
                0.25, 0.14, 0.4
            )

        };

    }

    randomItem(array) {

        return array[
            Math.floor(Math.random() * array.length)
        ];

    }

    createMaterial(color) {

        return new THREE.MeshStandardMaterial({
            color,
            flatShading: true
        });

    }

    // =====================================
    // CREATE NPC CHARACTER
    // =====================================

    createNPCModel() {

        const npc = new THREE.Group();

        const skin = this.createMaterial(
            this.randomItem(this.skinColors)
        );

        const shirt = this.createMaterial(
            this.randomItem(this.shirtColors)
        );

        const trousers = this.createMaterial(
            this.randomItem(this.trouserColors)
        );

        const hairMaterial = this.createMaterial(
            this.randomItem(this.hairColors)
        );

        // HEAD

        const head = new THREE.Mesh(
            this.geometries.head,
            skin
        );

        head.position.y = 2.05;

        npc.add(head);

        // HAIR

        const hair = new THREE.Mesh(
            this.geometries.hair,
            hairMaterial
        );

        hair.position.set(0, 2.19, -0.035);
        hair.scale.set(1, 0.65, 1);

        npc.add(hair);

        // BODY

        const body = new THREE.Mesh(
            this.geometries.body,
            shirt
        );

        body.position.y = 1.35;

        npc.add(body);

        // ANIMATED ARMS

        const arms = [];

        for (const side of [-1, 1]) {

            const pivot = new THREE.Group();

            pivot.position.set(
                side * 0.34,
                1.65,
                0
            );

            const arm = new THREE.Mesh(
                this.geometries.arm,
                skin
            );

            arm.position.y = -0.28;

            pivot.add(arm);

            const hand = new THREE.Mesh(
                this.geometries.hand,
                skin
            );

            hand.position.y = -0.62;

            pivot.add(hand);

            npc.add(pivot);

            arms.push(pivot);

        }

        // ANIMATED LEGS

        const legs = [];

        for (const side of [-1, 1]) {

            const pivot = new THREE.Group();

            pivot.position.set(
                side * 0.16,
                0.95,
                0
            );

            const leg = new THREE.Mesh(
                this.geometries.leg,
                trousers
            );

            leg.position.y = -0.34;

            pivot.add(leg);

            const shoe = new THREE.Mesh(
                this.geometries.shoe,
                this.createMaterial(0x202020)
            );

            shoe.position.set(0, -0.7, 0.1);

            pivot.add(shoe);

            npc.add(pivot);

            legs.push(pivot);

        }

        npc.userData = {
            arms,
            legs,
            animationOffset: Math.random() * 10
        };

        return npc;

    }

    // =====================================
    // FIND PEDESTRIAN SPAWN POSITIONS
    // =====================================

    getSpawnPosition() {

        const roadPositions = [
            -180, -120, -60, 0, 60, 120, 180
        ];

        for (let attempt = 0; attempt < 100; attempt++) {

            const axis = Math.random() > 0.5 ? "x" : "z";

            const road = this.randomItem(roadPositions);

            const side = Math.random() > 0.5 ? 1 : -1;

            const coordinate = -240 + Math.random() * 480;

            let x, z;

            if (axis === "z") {

                x = road + side * 8;
                z = coordinate;

            } else {

                x = coordinate;
                z = road + side * 8;

            }

            // Avoid buildings, fences and other colliders.

            if (this.world.collides(x, z)) {
                continue;
            }

            // Keep pedestrians separated.

            const tooClose = this.npcs.some(other => {

                return Math.hypot(
                    other.object.position.x - x,
                    other.object.position.z - z
                ) < 12;

            });

            if (tooClose) continue;

            return {
                x,
                z,
                axis
            };

        }

        return null;

    }

    // =====================================
    // CREATE PEDESTRIANS
    // =====================================

    createPedestrians(amount) {

        const names = [
            "Tunde",
            "Amaka",
            "Chidi",
            "Zainab",
            "Emeka",
            "Kemi",
            "Femi",
            "Ada",
            "Kunle",
            "Ifeoma",
            "Seyi",
            "Dami"
        ];

        const dialogues = [

            [
                "Lagos is moving today o. Traffic everywhere!",
                "You just have to know the right shortcuts.",
                "Anyway, enjoy your day!"
            ],

            [
                "Have you eaten today?",
                "There's a nice buka not too far from here.",
                "You should check it out sometime."
            ],

            [
                "This city never sleeps.",
                "Every day, somebody is chasing a new dream.",
                "Maybe today is your lucky day."
            ],

            [
                "Omo, transport fare is getting expensive.",
                "Everything is increasing these days!",
                "Safe journey, my friend."
            ]

        ];

        for (let i = 0; i < amount; i++) {

            const spawn = this.getSpawnPosition();

            if (!spawn) continue;

            const object = this.createNPCModel();

            object.position.set(
                spawn.x,
                0,
                spawn.z
            );

            this.scene.add(object);

            const npcData = {

                object,

                name: names[i % names.length],

                dialogue: this.randomItem(dialogues),

                dialogueIndex: 0,

                axis: spawn.axis,

                direction: Math.random() > 0.5 ? 1 : -1,

                speed: 0.8 + Math.random() * 0.6,

                pauseTimer: Math.random() * 2,

                interactable: null

            };

            this.npcs.push(npcData);

            // REGISTER NPC INTERACTION

            const interaction = {

                x: spawn.x,
                z: spawn.z,

                type: "npc",

                action: () => {
                    this.openConversation(npcData);
                }

            };

            npcData.interactable = interaction;

            this.world.addInteractable(interaction);

            this.updateFacing(npcData);

        }

        console.log(
            "LAGOS LEGENDS: " +
            this.npcs.length +
            " PEDESTRIANS CREATED"
        );
console.log("NPCs created:", this.npcs.length);
console.log("NPC positions:", this.npcs.map(npc => ({
    x: npc.object.position.x,
    z: npc.object.position.z
})));
    }

    // =====================================
    // NPC DIRECTION
    // =====================================

    updateFacing(npcData) {

        if (npcData.axis === "z") {

            npcData.object.rotation.y =
                npcData.direction > 0 ? 0 : Math.PI;

        } else {

            npcData.object.rotation.y =
                npcData.direction > 0 ?
                Math.PI / 2 : -Math.PI / 2;

        }

    }

    // =====================================
    // NPC ANIMATION
    // =====================================

    animateNPC(npcData, time, moving) {

        const animation = npcData.object.userData;

        const swing = moving ?
            Math.sin(time * 7) * 0.55 : 0;

        animation.legs[0].rotation.x = swing;
        animation.legs[1].rotation.x = -swing;

        animation.arms[0].rotation.x = -swing * 0.65;
        animation.arms[1].rotation.x = swing * 0.65;

        npcData.object.position.y =
            moving ? Math.abs(Math.sin(time * 7)) * 0.04 : 0;

    }

    // =====================================
    // PEDESTRIAN MOVEMENT
    // =====================================

    updateNPC(npcData, delta, time) {

        if (npcData.pauseTimer > 0) {

            npcData.pauseTimer -= delta;

            this.animateNPC(npcData, time, false);

            return;

        }

        const object = npcData.object;

        let nextX = object.position.x;
        let nextZ = object.position.z;

        const movement =
            npcData.direction * npcData.speed * delta;

        if (npcData.axis === "z") {

            nextZ += movement;

        } else {

            nextX += movement;

        }

        // Turn around at the edge of the district.

        if (
            Math.abs(nextX) > 245 ||
            Math.abs(nextZ) > 245 ||
            this.world.collides(nextX, nextZ)
        ) {

            npcData.direction *= -1;

            npcData.pauseTimer = 0.5 + Math.random();

            this.updateFacing(npcData);

            this.animateNPC(npcData, time, false);

            return;

        }

        object.position.x = nextX;
        object.position.z = nextZ;

        // Update interaction position as NPC moves.

        npcData.interactable.x = nextX;
        npcData.interactable.z = nextZ;

        this.animateNPC(npcData, time, true);

    }

    // =====================================
    // UPDATE ALL PEDESTRIANS
    // =====================================

    update(delta) {

        const time = performance.now() / 1000;

        for (const npc of this.npcs) {

            this.updateNPC(npc, delta, time);

        }

    }

    // =====================================
    // DIALOGUE INTERFACE
    // =====================================

    createDialogueUI() {

        const panel = document.createElement("div");

        panel.id = "npc-dialogue";

        panel.style.cssText = `
            position: absolute;
            left: 50%;
            bottom: 115px;
            transform: translateX(-50%);
            width: min(340px, 88%);
            padding: 18px;
            background: rgba(17, 20, 25, 0.96);
            color: white;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 16px;
            z-index: 100;
            display: none;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
        `;

        panel.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:12px;
            ">

                <strong id="npc-name">
                    Lagos Resident
                </strong>

                <button id="npc-close" style="
                    border:0;
                    background:transparent;
                    color:white;
                    font-size:22px;
                    cursor:pointer;
                ">×</button>

            </div>

            <p id="npc-message" style="
                font-size:14px;
                line-height:1.6;
                color:#dddddd;
                margin:0 0 15px;
            "></p>

            <button id="npc-next" style="
                width:100%;
                padding:12px;
                background:#d6a72d;
                color:#171717;
                border:0;
                border-radius:9px;
                font-weight:bold;
                cursor:pointer;
            ">
                CONTINUE
            </button>

        `;

        this.container.appendChild(panel);

        this.dialoguePanel = panel;

        this.dialogueName =
            panel.querySelector("#npc-name");

        this.dialogueMessage =
            panel.querySelector("#npc-message");

        this.closeDialogueButton =
            panel.querySelector("#npc-close");

        this.nextDialogueButton =
            panel.querySelector("#npc-next");

        this.closeDialogueButton.addEventListener(
            "click",
            () => this.closeConversation()
        );

        this.nextDialogueButton.addEventListener(
            "click",
            () => this.nextDialogue()
        );

    }

    // =====================================
    // OPEN CONVERSATION
    // =====================================

    openConversation(npcData) {

        this.activeNPC = npcData;

        npcData.dialogueIndex = 0;

        this.dialoguePanel.style.display = "block";

        this.dialogueName.textContent = npcData.name;

        this.dialogueMessage.textContent =
            npcData.dialogue[0];

        this.nextDialogueButton.textContent =
            npcData.dialogue.length > 1 ?
            "CONTINUE" : "CLOSE";

        this.world.hideInteraction();

    }

    // =====================================
    // NEXT DIALOGUE
    // =====================================

    nextDialogue() {

        if (!this.activeNPC) return;

        const npc = this.activeNPC;

        npc.dialogueIndex++;

        if (npc.dialogueIndex >= npc.dialogue.length) {

            this.closeConversation();

            return;

        }

        this.dialogueMessage.textContent =
            npc.dialogue[npc.dialogueIndex];

        if (
            npc.dialogueIndex === npc.dialogue.length - 1
        ) {

            this.nextDialogueButton.textContent = "FINISH";

        }

    }

    // =====================================
    // CLOSE CONVERSATION
    // =====================================

    closeConversation() {

        this.dialoguePanel.style.display = "none";

        this.activeNPC = null;

        if (this.playerReference) {

            this.world.updateInteractions(
                this.playerReference
            );

        }

    }

}
