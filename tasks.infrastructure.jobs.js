// Reserved tiles:
// x: 0, y: 4 - energy dumping spot.

module.exports.jobs = {
    RCL_0: {
        jobs: []
    },
    RCL_1: {
        jobs: []
    },
    RCL_2: {
        jobs: [
            { type: STRUCTURE_EXTENSION, name: "extensions", count: 2, range: 3, x: 0, y: 0, built: false },
            // Main roading infrastructure around the spawn point.
            { type: STRUCTURE_ROAD, name: "road.to.source", target: RESOURCE_ENERGY, built: false },
            { type: STRUCTURE_ROAD, name: "road.to.controller", target: STRUCTURE_CONTROLLER, built: false },
            // First mass storage Container.
            { type: STRUCTURE_EXTENSION, name: "extensions", count: 2 + 3, range: 3, x: 0, y: 0, built: false }, // Increment the count by the previous 'max' value + any new structures we want. Clumsy, need better solution.
            { type: STRUCTURE_CONTAINER, name: "container", count: 2, range: 3, x: 0, y: 0, built: false },
            { type: STRUCTURE_ROAD, name: "road.to.containers", target: STRUCTURE_CONTAINER, built: false },
            { type: STRUCTURE_ROAD, name: "road.around.spawn", built: false }
            // TODO Build roads around the spawn.
        ]
    },
    RCL_3: {
        jobs: [
            { type: STRUCTURE_TOWER, count: 1, range: 7, x: 0, y: 0 },
            { type: STRUCTURE_EXTENSION, count: 5 + 5, range: 5, x: 0, y: 0 }
        ]
    },
    RCL_4: {
        jobs: [
            { type: STRUCTURE_EXTENSION, count: 10 + 7, range: 7, x: 0, y: 0 },
            { type: STRUCTURE_STORAGE, count: 1, range: 7, x: 0, y: 0 },
            { type: STRUCTURE_ROAD, name: "road.to.storage", target: STRUCTURE_STORAGE, built: false }
        ]
    },
    RCL_5: {
        jobs: [
            { type: STRUCTURE_TOWER, count: 1 + 1, range: 7, x: 0, y: 0 },
            { type: STRUCTURE_ROAD, name: "road.to.tower", target: STRUCTURE_TOWER, built: false },
            { type: STRUCTURE_LINK, count: 2, range: 1, x: 0, y: 0, built: false },
            { type: STRUCTURE_EXTENSION, count: 17 + 2, range: 9, x: 0, y: 0 }
        ]
    },
    RCL_6: {
        jobs: [
            { type: "source.link", x: 0, y: 0 }
        ]
    },
    RCL_7: {
        jobs: []
    },
    RCL_8: {
        jobs: []
    }
}