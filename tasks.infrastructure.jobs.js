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
            { type: STRUCTURE_EXTENSION, count: 2, range: 3, x: 0, y: 0 },
            // Main roading infrastructure around the spawn point.
            { type: "road.to.source", x: 0, y: 0 },
            { type: "road.to.controller", x: 0, y: 0 },
            // First mass storage Container.
            { type: STRUCTURE_EXTENSION, count: 2 + 3, range: 3, x: 0, y: 0 }, // Increment the count by the previous 'max' value + any new structures we want. Clumsy, need better solution.
            // Mass storage Containers.
            { type: STRUCTURE_CONTAINER, count: 2, range: 3, x: 0, y: 0 },
        ]
    },
    RCL_3: {
        jobs: [
            { type: STRUCTURE_TOWER, count: 1, range: 7, x: 0, y: 0 },
            { type: STRUCTURE_EXTENSION, count: 5 + 5, range: 5, x: 0, y: 0 },
        ]
    },
    RCL_4: {
        jobs: [
            { type: STRUCTURE_EXTENSION, count: 10 + 7, range: 7, x: 0, y: 0 },
            { type: STRUCTURE_STORAGE, count: 1, range: 7, x: 0, y: 0 },
        ]
    },
    RCL_5: {
        jobs: [
            { type: STRUCTURE_TOWER, count: 1 + 1, range: 7, x: 0, y: 0 },
            { type: "storage.link", count: 1, range: 0, x: 0, y: 0 },
            { type: "source.link", count: 1, range: 0, x: 0, y: 0 },

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