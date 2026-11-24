import * as THREE from "three";

export class WorldMapSystem {

    constructor(player, worldSize = 600) {

        this.player = player;
        this.worldSize = worldSize;

        this.min = -265;
        this.max = 265;

        this.locations = [];

        this.isExpanded = false;

        // Minimap zoom.
        this.zoom = 1.5;

        // Camera yaw.
        this.cameraYaw = 0;

        this.createUI();
        this.createCanvas();
        this.resizeCanvas();

        window.addEventListener(
            "resize",
            () => {
                this.resizeCanvas();
            }
        );

    }

    // ==========================================
    // CAMERA
    // ==========================================

    setCameraYaw(yaw) {

        this.cameraYaw = yaw;

    }

    // ==========================================
    // UI
    // ==========================================

    createUI() {

        const container =
            document.getElementById(
                "game-container"
            );

        if (!container) return;

        const wrapper =
            document.createElement("div");

        wrapper.id =
            "world-minimap";

        wrapper.innerHTML = `

            <div id="world-minimap-header">

                <span>LAGOS</span>

                <button
                    id="world-map-expand"
                    type="button"
                    aria-label="Expand map"
                >
                    ⛶
                </button>

            </div>

            <canvas
                id="world-map-canvas"
            ></canvas>

            <div id="world-map-legend">

                <div class="map-legend-title">
                    MAP
                </div>

                <div class="map-legend-items">

                    <div>
                        <span
                            class="legend-icon icon-road"
                        ></span>
                        <span>Road</span>
                    </div>

                    <div>
                        <span
                            class="legend-icon icon-player"
                        ></span>
                        <span>You</span>
                    </div>

                    <div>
                        <span
                            class="legend-icon icon-location"
                        ></span>
                        <span>Location</span>
                    </div>

                </div>

            </div>

            <div id="world-map-coordinates">
                LAGOS CITY
            </div>

        `;

        container.appendChild(wrapper);

        this.wrapper =
            wrapper;

        this.expandButton =
            wrapper.querySelector(
                "#world-map-expand"
            );

        this.canvas =
            wrapper.querySelector(
                "#world-map-canvas"
            );

        this.expandButton.addEventListener(
            "click",
            () => this.toggleExpanded()
        );

        this.canvas.addEventListener(
            "click",
            () => this.toggleExpanded()
        );

    }

    // ==========================================
    // CANVAS
    // ==========================================

    createCanvas() {

        if (!this.canvas) return;

        this.ctx =
            this.canvas.getContext("2d");

    }

    // ==========================================
    // RESIZE
    // ==========================================

    resizeCanvas() {

        if (
            !this.canvas ||
            !this.ctx
        ) return;

        const rect =
            this.canvas.getBoundingClientRect();

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        this.canvas.width =
            Math.max(
                1,
                Math.floor(
                    rect.width * dpr
                )
            );

        this.canvas.height =
            Math.max(
                1,
                Math.floor(
                    rect.height * dpr
                )
            );

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

    }

    // ==========================================
    // LOCATIONS
    // ==========================================

    addLocation({
        id,
        name,
        type,
        x,
        z,
        icon = null
    }) {

        const existing =
            this.locations.find(
                location =>
                    location.id === id
            );

        if (existing) {

            return existing;

        }

        const location = {

            id,
            name,
            type,
            x,
            z,

            // Custom icon is optional.
            icon

        };

        this.locations.push(
            location
        );

        return location;

    }

    // ==========================================
    // REMOVE LOCATION
    // ==========================================

    removeLocation(id) {

        this.locations =
            this.locations.filter(
                location =>
                    location.id !== id
            );

    }

    // ==========================================
    // WORLD → MAP
    // ==========================================

    worldToMap(x, z) {

        const width =
            this.canvas.clientWidth;

        const height =
            this.canvas.clientHeight;

        const playerX =
            this.player.position.x;

        const playerZ =
            this.player.position.z;

        const scale =
            Math.min(
                width,
                height
            ) /
            (
                this.isExpanded
                    ? 530
                    : 180
            );

        const dx =
            (x - playerX) *
            scale;

        const dz =
            (z - playerZ) *
            scale;

        /*
         * Expanded map:
         * North-up.
         *
         * Minimap:
         * Rotates with camera.
         */

        const angle =
            this.isExpanded
                ? 0
                : this.cameraYaw;

        const rotatedX =
            dx * Math.cos(angle) -
            dz * Math.sin(angle);

        const rotatedY =
            dx * Math.sin(angle) +
            dz * Math.cos(angle);

        return {

            x:
                width / 2 +
                rotatedX,

            y:
                height / 2 +
                rotatedY

        };

    }

    // ==========================================
    // BACKGROUND
    // ==========================================

    drawBackground() {

        const width =
            this.canvas.clientWidth;

        const height =
            this.canvas.clientHeight;

        const ctx =
            this.ctx;

        ctx.fillStyle =
            "#17231f";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        // Terrain grid.

        ctx.strokeStyle =
            "rgba(255,255,255,0.035)";

        ctx.lineWidth = 1;

        const gridSize = 30;

        for (
            let x = 0;
            x < width;
            x += gridSize
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x,
                0
            );

            ctx.lineTo(
                x,
                height
            );

            ctx.stroke();

        }

        for (
            let y = 0;
            y < height;
            y += gridSize
        ) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                width,
                y
            );

            ctx.stroke();

        }

        // Map boundary.

        ctx.strokeStyle =
            "rgba(255,255,255,0.15)";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            1,
            1,
            width - 2,
            height - 2
        );

    }

    // ==========================================
    // ROADS
    // ==========================================

    drawRoads() {

        const roads = [
            -240,
            -180,
            -120,
            -60,
            0,
            60,
            120,
            180,
            240
        ];

        const ctx =
            this.ctx;

        // Secondary roads.

        ctx.strokeStyle =
            "#53635a";

        ctx.lineWidth =
            this.isExpanded
                ? 5
                : 4;

        for (
            const z of roads
        ) {

            const start =
                this.worldToMap(
                    this.min,
                    z
                );

            const end =
                this.worldToMap(
                    this.max,
                    z
                );

            ctx.beginPath();

            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();

        }

        for (
            const x of roads
        ) {

            const start =
                this.worldToMap(
                    x,
                    this.min
                );

            const end =
                this.worldToMap(
                    x,
                    this.max
                );

            ctx.beginPath();

            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();

        }

        // Main roads.

        ctx.strokeStyle =
            "#87958a";

        ctx.lineWidth =
            this.isExpanded
                ? 9
                : 6;

        for (
            const z of [
                -120,
                0,
                120
            ]
        ) {

            const start =
                this.worldToMap(
                    this.min,
                    z
                );

            const end =
                this.worldToMap(
                    this.max,
                    z
                );

            ctx.beginPath();

            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();

        }

        for (
            const x of [
                -120,
                0,
                120
            ]
        ) {

            const start =
                this.worldToMap(
                    x,
                    this.min
                );

            const end =
                this.worldToMap(
                    x,
                    this.max
                );

            ctx.beginPath();

            ctx.moveTo(
                start.x,
                start.y
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.stroke();

        }

    }

    // ==========================================
    // LOCATION COLORS
    // ==========================================

    getLocationColor(type) {

        const colors = {

            kiosk:
                "#eab54b",

            job:
                "#f59e0b",

            bus:
                "#60a5fa",

            bank:
                "#4ade80",

            hospital:
                "#f87171",

            police:
                "#60a5fa",

            shop:
                "#c084fc",

            supermarket:
                "#a78bfa",

            restaurant:
                "#fb923c",

            nightclub:
                "#ec4899",

            clothing:
                "#f472b6",

            pharmacy:
                "#22c55e",

            barber:
                "#38bdf8",

            house:
                "#facc15",

            office:
                "#94a3b8"

        };

        return (
            colors[type] ||
            "#ffffff"
        );

    }

    // ==========================================
    // DRAW VECTOR ICON
    // ==========================================

    drawIcon(
        type,
        x,
        y,
        size
    ) {

        const ctx =
            this.ctx;

        const color =
            this.getLocationColor(
                type
            );

        ctx.save();

        ctx.translate(
            x,
            y
        );

        const s = size;

        ctx.fillStyle =
            color;

        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth =
            Math.max(
                1.2,
                size * 0.16
            );

        ctx.lineJoin =
            "round";

        ctx.lineCap =
            "round";

        // ==================================
        // BANK
        // ==================================

        if (type === "bank") {

            // Roof
            ctx.beginPath();

            ctx.moveTo(
                -s,
                -s * 0.55
            );

            ctx.lineTo(
                0,
                -s
            );

            ctx.lineTo(
                s,
                -s * 0.55
            );

            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            // Building
            ctx.fillRect(
                -s * 0.85,
                -s * 0.4,
                s * 1.7,
                s * 1.2
            );

            ctx.strokeRect(
                -s * 0.85,
                -s * 0.4,
                s * 1.7,
                s * 1.2
            );

            // Columns
            for (
                const cx of [
                    -s * 0.55,
                    0,
                    s * 0.55
                ]
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    cx,
                    -s * 0.25
                );

                ctx.lineTo(
                    cx,
                    s * 0.65
                );

                ctx.stroke();

            }

            return;

        }

        // ==================================
        // HOSPITAL
        // ==================================

        if (
            type === "hospital"
        ) {

            ctx.beginPath();

            ctx.roundRect(
                -s,
                -s,
                s * 2,
                s * 2,
                s * 0.25
            );

            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth =
                s * 0.28;

            ctx.beginPath();

            ctx.moveTo(
                0,
                -s * 0.55
            );

            ctx.lineTo(
                0,
                s * 0.55
            );

            ctx.moveTo(
                -s * 0.55,
                0
            );

            ctx.lineTo(
                s * 0.55,
                0
            );

            ctx.stroke();

            return;

        }

        // ==================================
        // POLICE
        // ==================================

        if (
            type === "police"
        ) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                -s
            );

            ctx.lineTo(
                s * 0.8,
                -s * 0.45
            );

            ctx.lineTo(
                s * 0.55,
                s * 0.55
            );

            ctx.lineTo(
                0,
                s
            );

            ctx.lineTo(
                -s * 0.55,
                s * 0.55
            );

            ctx.lineTo(
                -s * 0.8,
                -s * 0.45
            );

            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            // Star
            ctx.fillStyle =
                "#ffffff";

            ctx.beginPath();

            for (
                let i = 0;
                i < 10;
                i++
            ) {

                const angle =
                    -Math.PI / 2 +
                    i * Math.PI / 5;

                const radius =
                    i % 2 === 0
                        ? s * 0.38
                        : s * 0.16;

                const px =
                    Math.cos(angle) *
                    radius;

                const py =
                    Math.sin(angle) *
                    radius;

                if (i === 0) {

                    ctx.moveTo(
                        px,
                        py
                    );

                } else {

                    ctx.lineTo(
                        px,
                        py
                    );

                }

            }

            ctx.closePath();

            ctx.fill();

            return;

        }

        // ==================================
        // RESTAURANT
        // ==================================

        if (
            type === "restaurant"
        ) {

            // Plate
            ctx.beginPath();

            ctx.arc(
                0,
                0,
                s * 0.65,
                0,
                Math.PI * 2
            );

            ctx.fill();
            ctx.stroke();

            // Fork
            ctx.beginPath();

            ctx.moveTo(
                -s * 0.8,
                -s * 0.7
            );

            ctx.lineTo(
                -s * 0.8,
                s * 0.7
            );

            ctx.stroke();

            // Knife
            ctx.beginPath();

            ctx.moveTo(
                s * 0.8,
                -s * 0.7
            );

            ctx.lineTo(
                s * 0.8,
                s * 0.7
            );

            ctx.stroke();

            return;

        }

        // ==================================
        // NIGHTCLUB
        // ==================================

        if (
            type === "nightclub"
        ) {

            // Musical note
            ctx.beginPath();

            ctx.arc(
                -s * 0.25,
                s * 0.45,
                s * 0.35,
                0,
                Math.PI * 2
            );

            ctx.fill();
            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                s * 0.05,
                s * 0.3
            );

            ctx.lineTo(
                s * 0.05,
                -s * 0.7
            );

            ctx.lineTo(
                s * 0.75,
                -s * 0.95
            );

            ctx.lineTo(
                s * 0.75,
                -s * 0.55
            );

            ctx.stroke();

            return;

        }

        // ==================================
        // SUPERMARKET
        // ==================================

        if (
            type === "supermarket"
        ) {

            // Cart
            ctx.beginPath();

            ctx.moveTo(
                -s * 0.8,
                -s * 0.5
            );

            ctx.lineTo(
                -s * 0.45,
                -s * 0.5
            );

            ctx.lineTo(
                -s * 0.2,
                s * 0.35
            );

            ctx.lineTo(
                s * 0.75,
                s * 0.35
            );

            ctx.lineTo(
                s * 0.95,
                -s * 0.35
            );

            ctx.lineTo(
                -s * 0.25,
                -s * 0.35
            );

            ctx.stroke();

            // Wheels
            ctx.beginPath();

            ctx.arc(
                0,
                s * 0.75,
                s * 0.18,
                0,
                Math.PI * 2
            );

            ctx.arc(
                s * 0.65,
                s * 0.75,
                s * 0.18,
                0,
                Math.PI * 2
            );

            ctx.fill();

            return;

        }

        // ==================================
        // CLOTHING
        // ==================================

        if (
            type === "clothing"
        ) {

            // Shirt
            ctx.beginPath();

            ctx.moveTo(
                -s * 0.35,
                -s * 0.8
            );

            ctx.lineTo(
                -s,
                -s * 0.25
            );

            ctx.lineTo(
                -s * 0.65,
                s * 0.15
            );

            ctx.lineTo(
                -s * 0.35,
                0
            );

            ctx.lineTo(
                -s * 0.35,
                s * 0.8
            );

            ctx.lineTo(
                s * 0.35,
                s * 0.8
            );

            ctx.lineTo(
                s * 0.35,
                0
            );

            ctx.lineTo(
                s * 0.65,
                s * 0.15
            );

            ctx.lineTo(
                s,
                -s * 0.25
            );

            ctx.lineTo(
                s * 0.35,
                -s * 0.8
            );

            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            return;

        }

        // ==================================
        // PHARMACY
        // ==================================

        if (
            type === "pharmacy"
        ) {

            ctx.beginPath();

            ctx.roundRect(
                -s,
                -s,
                s * 2,
                s * 2,
                s * 0.2
            );

            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth =
                s * 0.25;

            ctx.beginPath();

            ctx.moveTo(
                0,
                -s * 0.55
            );

            ctx.lineTo(
                0,
                s * 0.55
            );

            ctx.moveTo(
                -s * 0.55,
                0
            );

            ctx.lineTo(
                s * 0.55,
                0
            );

            ctx.stroke();

            return;

        }

        // ==================================
        // BARBER
        // ==================================

        if (
            type === "barber"
        ) {

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                s * 0.8,
                0,
                Math.PI * 2
            );

            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle =
                "#ffffff";

            ctx.beginPath();

            ctx.moveTo(
                -s * 0.5,
                -s * 0.5
            );

            ctx.lineTo(
                s * 0.5,
                s * 0.5
            );

            ctx.moveTo(
                s * 0.5,
                -s * 0.5
            );

            ctx.lineTo(
                -s * 0.5,
                s * 0.5
            );

            ctx.stroke();

            return;

        }

        // ==================================
        // HOUSE
        // ==================================

        if (
            type === "house"
        ) {

            ctx.beginPath();

            ctx.moveTo(
                -s,
                0
            );

            ctx.lineTo(
                0,
                -s
            );

            ctx.lineTo(
                s,
                0
            );

            ctx.lineTo(
                s,
                s
            );

            ctx.lineTo(
                -s,
                s
            );

            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            // Door
            ctx.fillStyle =
                "#17231f";

            ctx.fillRect(
                -s * 0.25,
                s * 0.2,
                s * 0.5,
                s * 0.8
            );

            return;

        }

        // ==================================
        // BUS
        // ==================================

        if (
            type === "bus"
        ) {

            ctx.beginPath();

            ctx.roundRect(
                -s,
                -s * 0.7,
                s * 2,
                s * 1.4,
                s * 0.2
            );

            ctx.fill();
            ctx.stroke();

            // Windows
            ctx.fillStyle =
                "#17231f";

            ctx.fillRect(
                -s * 0.7,
                -s * 0.4,
                s * 0.5,
                s * 0.35
            );

            ctx.fillRect(
                s * 0.2,
                -s * 0.4,
                s * 0.5,
                s * 0.35
            );

            return;

        }

        // ==================================
        // DEFAULT LOCATION
        // ==================================

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            s * 0.7,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.stroke();

    }

    // ==========================================
    // DRAW LOCATION
    // ==========================================

    drawLocation(location) {

        const position =
            this.worldToMap(
                location.x,
                location.z
            );

        const ctx =
            this.ctx;

        const width =
            this.canvas.clientWidth;

        const height =
            this.canvas.clientHeight;

        if (
            position.x < -25 ||
            position.x > width + 25 ||
            position.y < -25 ||
            position.y > height + 25
        ) {

            return;

        }

        const size =
            this.isExpanded
                ? 9
                : 7;

        // Small glow
        ctx.beginPath();

        ctx.arc(
            position.x,
            position.y,
            size * 1.5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            this.getLocationColor(
                location.type
            ) + "30";

        ctx.fill();

        this.drawIcon(
            location.type,
            position.x,
            position.y,
            size
        );

        // Expanded map labels.

        if (this.isExpanded) {

            ctx.font =
                "bold 12px Arial";

            ctx.textAlign =
                "left";

            ctx.textBaseline =
                "middle";

            ctx.fillStyle =
                "#ffffff";

            ctx.strokeStyle =
                "rgba(0,0,0,0.7)";

            ctx.lineWidth = 3;

            ctx.strokeText(
                location.name,
                position.x + 13,
                position.y
            );

            ctx.fillText(
                location.name,
                position.x + 13,
                position.y
            );

        }

    }

    // ==========================================
    // PLAYER
    // ==========================================

    drawPlayer() {

        if (!this.player) return;

        const width =
            this.canvas.clientWidth;

        const height =
            this.canvas.clientHeight;

        const ctx =
            this.ctx;

        const x =
            width / 2;

        const y =
            height / 2;

        ctx.save();

        ctx.translate(
            x,
            y
        );

        /*
         * THREE.JS:
         *
         * rotation.y = 0
         * means the player faces +Z.
         *
         * On this canvas +Z points DOWN.
         *
         * Our arrow graphic points UP.
         *
         * Therefore we need a 180° correction.
         */

        const playerYaw =
            this.player.rotation.y;

        const arrowRotation =
            this.isExpanded

                ? playerYaw + Math.PI

                : playerYaw -
                  this.cameraYaw +
                  Math.PI;

        ctx.rotate(
            arrowRotation
        );

        // Player glow.

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            this.isExpanded
                ? 18
                : 14,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(56,189,248,0.25)";

        ctx.fill();

        // Arrow.

        ctx.beginPath();

        ctx.moveTo(
            0,
            -16
        );

        ctx.lineTo(
            10,
            10
        );

        ctx.lineTo(
            0,
            6
        );

        ctx.lineTo(
            -10,
            10
        );

        ctx.closePath();

        ctx.fillStyle =
            "#38bdf8";

        ctx.fill();

        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth = 2;

        ctx.stroke();

        // Center.

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            3,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fill();

        ctx.restore();

    }

    // ==========================================
    // COMPASS
    // ==========================================

    drawCompass() {

        if (!this.isExpanded) return;

        const ctx =
            this.ctx;

        const x =
            this.canvas.clientWidth -
            24;

        ctx.save();

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#ffffff";

        ctx.fillText(
            "N",
            x,
            22
        );

        ctx.beginPath();

        ctx.moveTo(
            x,
            28
        );

        ctx.lineTo(
            x - 5,
            40
        );

        ctx.lineTo(
            x + 5,
            40
        );

        ctx.closePath();

        ctx.fillStyle =
            "#ef4444";

        ctx.fill();

        ctx.restore();

    }

    // ==========================================
    // DRAW
    // ==========================================

    draw() {

        if (
            !this.ctx ||
            !this.canvas
        ) return;

        const width =
            this.canvas.clientWidth;

        const height =
            this.canvas.clientHeight;

        if (
            !width ||
            !height
        ) return;

        this.ctx.clearRect(
            0,
            0,
            width,
            height
        );

        this.drawBackground();

        this.drawRoads();

        for (
            const location of
            this.locations
        ) {

            this.drawLocation(
                location
            );

        }

        this.drawPlayer();

        this.drawCompass();

    }

    // ==========================================
    // UPDATE
    // ==========================================

    update() {

        this.draw();

    }

    // ==========================================
    // EXPAND
    // ==========================================

    toggleExpanded() {

        this.isExpanded =
            !this.isExpanded;

        if (
            this.isExpanded
        ) {

            this.wrapper.classList.add(
                "expanded"
            );

            this.expandButton.textContent =
                "✕";

        } else {

            this.wrapper.classList.remove(
                "expanded"
            );

            this.expandButton.textContent =
                "⛶";

        }

        requestAnimationFrame(
            () => {

                this.resizeCanvas();

                this.draw();

            }
        );

    }

}
