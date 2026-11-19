import * as THREE from "three";

export class JobLocationSystems {

    constructor(scene, world, player) {

        this.scene = scene;
        this.world = world;
        this.player = player;

        this.locations = [];

    }

    // ==========================================
    // REGISTER JOB LOCATION
    // ==========================================

    addJobLocation({
        id,
        name,
        jobType,
        x,
        z,
        buttonText = "TALK",
        icon = "💼",
        action
    }) {

        const location = {

            id,
            name,
            jobType,

            x,
            z,

            type: "job-location",

            buttonText,

            icon,

            action
        };

        this.locations.push(location);

        this.world.addInteractable(location);

        return location;
    }

    // ==========================================
    // FIND LOCATION
    // ==========================================

    getLocation(id) {

        return this.locations.find(
            location => location.id === id
        ) || null;

    }

    // ==========================================
    // FIND JOB LOCATION
    // ==========================================

    getJobLocations(jobType) {

        return this.locations.filter(
            location => location.jobType === jobType
        );

    }

    // ==========================================
    // REMOVE LOCATION
    // ==========================================

    removeJobLocation(id) {

        const index = this.locations.findIndex(
            location => location.id === id
        );

        if (index === -1) return false;

        this.locations.splice(index, 1);

        return true;
    }

    // ==========================================
    // UPDATE
    // ==========================================

    update() {

        // Reserved for future job-location logic.

    }

}
