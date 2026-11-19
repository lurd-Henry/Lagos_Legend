import * as THREE from "three";

export class WorldMapSystem {

    constructor(player, worldSize = 600) {

        this.player = player;
        this.worldSize = worldSize;

        // World boundaries
        this.min = -265;
        this.max = 265;

        this.locations = [];

        this.isExpanded = false;

        this.createUI();
        this.createCanvas();

        this.resizeCanvas();

        window.addEventListener(
            "resize",
            () => this.resizeCanvas()
        );

    }


    // ==========================================
    // UI
    // ==========================================

    createUI() {

        const container =
            document.getElementById("game-container");

        if (!container) {

            console.warn(
                "WorldMapSystem: #game-container not found."
            );

            return;

        }


        const wrapper =
            document.createElement("div");

        wrapper.id = "world-minimap";

        wrapper.innerHTML = `

            <div id="world-minimap-header">

                <span>🗺️ LAGOS </span>

                <button
                    id="world-map-expand"
                    type="button"
                    aria-label="Expand map"
                >
                    ⛶
                </button>

            </div>

            <canvas id="world-map-canvas"></canvas>

            <div id="world-map-legend">

                <span>🔴 YOU</span>
                <span>🏪 KIOSK</span>
                <span>📦 JOB</span>
                <span>🚌 BUS</span>

            </div>

        `;


        container.appendChild(wrapper);

        this.wrapper = wrapper;

        this.expandButton =
            wrapper.querySelector(
                "#world-map-expand"
            );


        this.expandButton.addEventListener(
            "click",
            () => {

                this.toggleExpanded();

            }
        );


        // Tap the map itself to expand it.
        wrapper.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === this.canvas
                ) {

                    this.toggleExpanded();

                }

            }
        );

    }


    // ==========================================
    // CANVAS
    // ==========================================

    createCanvas() {

        this.canvas =
            this.wrapper.querySelector(
                "#world-map-canvas"
            );

        this.ctx =
            this.canvas.getContext("2d");

    }


    resizeCanvas() {

        if (!this.canvas) return;

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
                Math.floor(rect.width * dpr)
            );

        this.canvas.height =
            Math.max(
                1,
                Math.floor(rect.height * dpr)
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
    // ADD LOCATION
    // ==========================================

    addLocation({

        id,
        name,
        type,
        x,
        z,
        icon = "📍"

    }) {

        // Prevent duplicate locations.
        const existing =
            this.locations.find(
                location => location.id === id
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
            icon

        };


        this.locations.push(location);

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

        const rect =
            this.canvas.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;


        const normalizedX =
            (x - this.min) /
            (this.max - this.min);


        const normalizedZ =
            (z - this.min) /
            (this.max - this.min);


        return {

            x:
                normalizedX * width,

            y:
                normalizedZ * height

        };

    }


    // ==========================================
    // DRAW BACKGROUND
    // ==========================================

    drawBackground() {

        const rect =
            this.canvas.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;


        // Background
        this.ctx.fillStyle =
            "#111827";

        this.ctx.fillRect(
            0,
            0,
            width,
            height
        );


        // World boundary
        this.ctx.strokeStyle =
            "rgba(255,255,255,0.25)";

        this.ctx.lineWidth = 1;

        this.ctx.strokeRect(
            1,
            1,
            width - 2,
            height - 2
        );


        // ======================================
        // ROADS
        // ======================================

        const roads = [
            -180,
            -120,
            -60,
            0,
            60,
            120,
            180
        ];


        this.ctx.strokeStyle =
            "rgba(255,255,255,0.13)";

        this.ctx.lineWidth = 5;


        // Horizontal roads

        for (const z of roads) {

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


            this.ctx.beginPath();

            this.ctx.moveTo(
                start.x,
                start.y
            );

            this.ctx.lineTo(
                end.x,
                end.y
            );

            this.ctx.stroke();

        }


        // Vertical roads

        for (const x of roads) {

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


            this.ctx.beginPath();

            this.ctx.moveTo(
                start.x,
                start.y
            );

            this.ctx.lineTo(
                end.x,
                end.y
            );

            this.ctx.stroke();

        }

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


        // Marker circle

        this.ctx.beginPath();

        this.ctx.arc(
            position.x,
            position.y,
            5,
            0,
            Math.PI * 2
        );


        this.ctx.fillStyle =
            this.getLocationColor(
                location.type
            );

        this.ctx.fill();


        this.ctx.strokeStyle =
            "rgba(255,255,255,0.9)";

        this.ctx.lineWidth = 1;

        this.ctx.stroke();


        // Icon

        this.ctx.font =
            "12px sans-serif";

        this.ctx.textAlign =
            "center";

        this.ctx.textBaseline =
            "middle";


        this.ctx.fillText(
            location.icon,
            position.x,
            position.y - 9
        );

    }


    // ==========================================
    // LOCATION COLORS
    // ==========================================

    getLocationColor(type) {

        switch (type) {

            case "kiosk":
                return "#d8a13b";

            case "job":
                return "#f59e0b";

            case "bus":
                return "#3b82f6";

            case "bank":
                return "#22c55e";

            case "hospital":
                return "#ef4444";

            case "shop":
                return "#a855f7";

            case "restaurant":
                return "#f97316";

            default:
                return "#ffffff";

        }

    }


    // ==========================================
    // PLAYER
    // ==========================================

    drawPlayer() {

        if (!this.player) return;


        const position =
            this.worldToMap(
                this.player.position.x,
                this.player.position.z
            );


        // Glow

        this.ctx.beginPath();

        this.ctx.arc(
            position.x,
            position.y,
            8,
            0,
            Math.PI * 2
        );


        this.ctx.fillStyle =
            "rgba(239,68,68,0.25)";

        this.ctx.fill();


        // Player marker

        this.ctx.beginPath();

        this.ctx.arc(
            position.x,
            position.y,
            4,
            0,
            Math.PI * 2
        );


        this.ctx.fillStyle =
            "#ef4444";

        this.ctx.fill();


        this.ctx.strokeStyle =
            "#ffffff";

        this.ctx.lineWidth = 1.5;

        this.ctx.stroke();

    }


    // ==========================================
    // DRAW
    // ==========================================

    draw() {

        if (!this.ctx) return;


        const rect =
            this.canvas.getBoundingClientRect();


        if (
            rect.width === 0 ||
            rect.height === 0
        ) {

            return;

        }


        this.ctx.clearRect(
            0,
            0,
            rect.width,
            rect.height
        );


        this.drawBackground();


        // Locations

        for (
            const location of this.locations
        ) {

            this.drawLocation(
                location
            );

        }


        // Player should always be
        // drawn last.

        this.drawPlayer();

    }


    // ==========================================
    // UPDATE
    // ==========================================

    update() {

        this.draw();

    }


    // ==========================================
    // EXPAND MAP
    // ==========================================

    toggleExpanded() {

        this.isExpanded =
            !this.isExpanded;


        if (this.isExpanded) {

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


        // Canvas dimensions changed.

        requestAnimationFrame(
            () => {

                this.resizeCanvas();
                this.draw();

            }
        );

    }

}
