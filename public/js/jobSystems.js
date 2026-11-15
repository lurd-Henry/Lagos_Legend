import * as THREE from "three";

export class JobSystems {

    constructor(scene, player, world, vehicles = null) {

        this.scene = scene;
        this.player = player;
        this.world = world;
        this.vehicles = vehicles;

        this.activeJob = null;
        this.jobPhase = null;

        this.marker = null;
        this.markerRing = null;

        this.completedCooldown = false;

        this.deliveryLocations = [
            {
                name: "Ikeja",
                x: -120,
                z: -80
            },
            {
                name: "Yaba",
                x: 80,
                z: -110
            },
            {
                name: "Surulere",
                x: 140,
                z: 70
            },
            {
                name: "Lekki",
                x: -90,
                z: 150
            },
            {
                name: "Victoria Island",
                x: 40,
                z: 120
            },
            {
                name: "Lagos Island",
                x: 180,
                z: -20
            }
        ];

        this.pickupLocation = {
            name: "Dispatch Depot",
            x: 0,
            z: 0
        };

        this.createMarker();
        this.createJobUI();
    }


    // =====================================
    // MARKER
    // =====================================

    createMarker() {

        const group = new THREE.Group();

        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0x664400,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.9
        });

        const cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(
                2.5,
                2.5,
                0.15,
                32
            ),
            material
        );

        cylinder.position.y = 0.08;

        group.add(cylinder);

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.8
        });

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(2.7, 3.0, 32),
            ringMaterial
        );

        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.12;

        group.add(ring);

        group.visible = false;

        this.scene.add(group);

        this.marker = group;
        this.markerRing = ring;
    }


    // =====================================
    // JOB UI
    // =====================================

    createJobUI() {

        const container =
            document.getElementById("game-container");

        if (!container) return;

        const panel =
            document.createElement("div");

        panel.id = "active-job-ui";

        panel.innerHTML = `
            <div class="active-job-title">
                DELIVERY DRIVER
            </div>

            <div
                id="active-job-status"
                class="active-job-status"
            >
                Waiting for assignment...
            </div>

            <div
                id="active-job-location"
                class="active-job-location"
            ></div>
        `;

        panel.style.display = "none";

        container.appendChild(panel);

        this.jobUI = panel;

        this.statusElement =
            panel.querySelector("#active-job-status");

        this.locationElement =
            panel.querySelector("#active-job-location");
    }


    // =====================================
    // RANDOM DESTINATION
    // =====================================

    getRandomDestination() {

        const locations =
            this.deliveryLocations;

        return locations[
            Math.floor(
                Math.random() * locations.length
            )
        ];
    }


    // =====================================
    // START DELIVERY
    // =====================================

    async startDelivery() {

        if (this.activeJob) {

            console.warn(
                "A job is already active."
            );

            return;
        }

        try {

            await window.lagosJobs.start(
                "delivery"
            );

        } catch (error) {

            console.error(
                "Unable to start delivery job:",
                error
            );

            return;
        }

        const destination =
            this.getRandomDestination();

        this.activeJob = {
            type: "delivery",

            pickup: {
                ...this.pickupLocation
            },

            destination: {
                ...destination
            },

            phase: "pickup",

            startedAt: Date.now()
        };

        this.jobPhase = "pickup";

        this.showMarker(
            this.activeJob.pickup
        );

        this.showJobUI(
            "Go to the dispatch depot.",
            this.activeJob.pickup.name
        );

        console.log(
            "Delivery job started:",
            this.activeJob
        );
    }


    // =====================================
    // SHOW MARKER
    // =====================================

    showMarker(location) {

        if (!this.marker) return;

        this.marker.position.set(
            location.x,
            0,
            location.z
        );

        this.marker.visible = true;
    }


    hideMarker() {

        if (!this.marker) return;

        this.marker.visible = false;
    }


    // =====================================
    // JOB UI
    // =====================================

    showJobUI(status, location) {

        if (!this.jobUI) return;

        this.jobUI.style.display = "block";

        if (this.statusElement) {
            this.statusElement.textContent =
                status;
        }

        if (this.locationElement) {
            this.locationElement.textContent =
                `📍 ${location}`;
        }
    }


    hideJobUI() {

        if (!this.jobUI) return;

        this.jobUI.style.display = "none";
    }


    // =====================================
    // DISTANCE
    // =====================================

    distanceTo(location) {

        return Math.hypot(
            this.player.position.x -
                location.x,

            this.player.position.z -
                location.z
        );
    }


    // =====================================
    // PICKUP PACKAGE
    // =====================================

    pickupPackage() {

        if (!this.activeJob) return;

        this.activeJob.phase =
            "delivery";

        this.jobPhase =
            "delivery";

        this.showMarker(
            this.activeJob.destination
        );

        this.showJobUI(
            "Package collected. Deliver it.",
            this.activeJob.destination.name
        );

        console.log(
            "Package collected. Destination:",
            this.activeJob.destination.name
        );
    }


    // =====================================
    // COMPLETE DELIVERY
    // =====================================

    async completeDelivery() {

        if (!this.activeJob) {
            return;
        }

        if (this.completedCooldown) {
            return;
        }

        this.completedCooldown = true;

        try {

            const result =
                await window.lagosJobs.complete(
                    "delivery"
                );

            console.log(
                "Delivery completed:",
                result
            );

            this.hideMarker();
            this.hideJobUI();

            this.activeJob = null;
            this.jobPhase = null;

            if (
                window.lagosJobsUI?.refresh
            ) {

                await window.lagosJobsUI.refresh();

            }

            setTimeout(() => {

                this.completedCooldown = false;

            }, 1000);

        } catch (error) {

            console.error(
                "Delivery completion failed:",
                error
            );

            this.completedCooldown = false;
        }
    }


    // =====================================
    // UPDATE
    // =====================================

    update(delta) {

        if (!this.activeJob) {
            return;
        }

        if (this.marker) {

            this.marker.rotation.y +=
                delta * 1.5;

        }

        // ---------------------------------
        // PICKUP
        // ---------------------------------

        if (
            this.activeJob.phase === "pickup"
        ) {

            const distance =
                this.distanceTo(
                    this.activeJob.pickup
                );

            if (distance < 5) {

                this.pickupPackage();

            }

            return;
        }


        // ---------------------------------
        // DELIVERY
        // ---------------------------------

        if (
            this.activeJob.phase === "delivery"
        ) {

            const distance =
                this.distanceTo(
                    this.activeJob.destination
                );

            if (distance < 5) {

                this.completeDelivery();

            }
        }
    }


    // =====================================
    // CANCEL JOB
    // =====================================

    async cancelJob() {

        if (!this.activeJob) {
            return;
        }

        try {

            await window.lagosJobs.quit();

        } catch (error) {

            console.error(
                "Unable to quit job:",
                error
            );
        }

        this.activeJob = null;
        this.jobPhase = null;

        this.hideMarker();
        this.hideJobUI();
    }


    // =====================================
    // STATUS
    // =====================================

    isActive() {

        return !!this.activeJob;
    }


    getCurrentJob() {

        return this.activeJob;
    }
}
