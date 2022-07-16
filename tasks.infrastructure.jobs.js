// Reserved tiles:
// x: 0, y: 3 - energy dumping spot.

module.exports.jobs = {
    RCL_0: {
        jobs: []
    },
    RCL_1: {
        jobs: []
    },
    RCL_2: {
        jobs: [{
                type: "extension",
                x: 1,
                y: -2
            }, {
                type: "extension",
                x: 1,
                y: -1
            },
            // {
            //     type: "container",
            //     x: 0,
            //     y: 3
            // },
            // {
            //     type: "rcl.container",
            //     x: 0,
            //     y: 0
            // },
            {
                type: "extension",
                x: 2,
                y: -2
            },
            {
                type: "extension",
                x: 2,
                y: -1
            },
            {
                type: "extension",
                x: 3,
                y: -1
            },
            {
                type: "container",
                x: -4,
                y: 0
            },
            // Roads, north, south, east, west
            {
                type: "road",
                x: 1,
                y: 0
            },
            {
                type: "road",
                x: 2,
                y: 0
            },
            {
                type: "road",
                x: 3,
                y: 0
            },
            {
                type: "road",
                x: 0,
                y: 1
            },
            {
                type: "road",
                x: 0,
                y: 2
            },
            {
                type: "road",
                x: -1,
                y: 0
            },
            {
                type: "road",
                x: -2,
                y: 0
            },
            {
                type: "road",
                x: -3,
                y: 0
            },
            {
                type: "road",
                x: 0,
                y: -1
            },
            {
                type: "road",
                x: 0,
                y: -2
            },
            {
                type: "road",
                x: 1,
                y: -3
            },
            {
                type: "road",
                x: 2,
                y: -3
            },
            {
                type: "road",
                x: 3,
                y: -3
            },
            {
                type: "road",
                x: 4,
                y: -1
            },
            {
                type: "road",
                x: 4,
                y: -2
            },
            {
                type: "road",
                x: 4,
                y: 1
            },
            {
                type: "road",
                x: 4,
                y: 2
            },
            {
                type: "road",
                x: 3,
                y: 3
            },
            {
                type: "road",
                x: 2,
                y: 3
            },
            {
                type: "road",
                x: 1,
                y: 3
            },
            {
                type: "road",
                x: -1,
                y: 3
            },
            {
                type: "road",
                x: -2,
                y: 3
            },
            {
                type: "road",
                x: -3,
                y: 3
            },
            {
                type: "road",
                x: -4,
                y: 2
            },
            {
                type: "road",
                x: -4,
                y: 1
            },
            {
                type: "road",
                x: -4,
                y: -1
            },
            {
                type: "road",
                x: -4,
                y: -2
            },
            {
                type: "road",
                x: -3,
                y: -3
            },
            {
                type: "road",
                x: -2,
                y: -3
            },
            {
                type: "road",
                x: -1,
                y: -3
            },
            {
                type: "road.to.controller",
                x: 0,
                y: 0
            },
            {
                type: "road.to.source",
                x: 0,
                y: 0
            },
            {
                type: "container",
                x: 4,
                y: 0
            }
        ]
    },
    RCL_3: {
        jobs: [{
                type: "tower",
                x: 3,
                y: -2
            },
            {
                type: "extension",
                x: -1,
                y: -2
            },
            {
                type: "extension",
                x: -1,
                y: -1
            },
            {
                type: "extension",
                x: -2,
                y: -2
            },
            {
                type: "extension",
                x: -2,
                y: -1
            },
            {
                type: "extension",
                x: -3,
                y: -1
            },
            {
                type: "container",
                x: 0,
                y: 3
            },
        ]
    },
    RCL_4: {
        jobs: [{
                type: "extension",
                x: 1,
                y: 1
            },
            {
                type: "extension",
                x: 1,
                y: 2
            },
            {
                type: "extension",
                x: 2,
                y: 1
            },
            {
                type: "extension",
                x: 2,
                y: 2
            },
            {
                type: "extension",
                x: 3,
                y: 1
            },
            {
                type: "extension",
                x: -1,
                y: 1
            },
            {
                type: "extension",
                x: -1,
                y: 2
            },
            {
                type: "extension",
                x: -2,
                y: 1
            },
            {
                type: "extension",
                x: -2,
                y: 2
            },
            {
                type: "extension",
                x: -3,
                y: 1
            },
            {
                type: "storage",
                x: 0,
                y: -3
            },
        ]
    },
    RCL_5: {
        jobs: [{
                type: "tower",
                x: -3,
                y: 2
            },
            {
                type: "link",
                x: 0,
                y: -4
            },
            {
                type: "source.link",
                x: 0,
                y: 0
            },
            {
                type: "road",
                x: 5,
                y: 0
            },
            {
                type: "road",
                x: 0,
                y: 4
            },
            {
                type: "road",
                x: -5,
                y: 0
            },
            {
                type: "road",
                x: 0,
                y: -5
            },
            {
                type: "road",
                x: 1,
                y: -4
            },
            {
                type: "road",
                x: -1,
                y: -4
            },
            {
                type: "extension",
                x: 3,
                y: 2
            },
            {
                type: "extension",
                x: -3,
                y: -2
            }
        ]
    },
    RCL_6: {
        jobs: [{
            type: "source.link",
            x: 0,
            y: 0
        }]
    },
    RCL_7: {
        jobs: []
    },
    RCL_8: {
        jobs: []
    }
}