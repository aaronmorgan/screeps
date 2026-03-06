const { EXIT_CODE } = require("game.constants");

var infrastructureTasks = {
    processJobs: function (spawn, rclLevel, jobs) {
        for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].built === true) {
                //continue;
                // Need a mechanism to determine if structures need rebuilding.
            }

            let job = jobs[i];
            let specialSite = false;

            const jobType = job.type;

            switch (jobType) {
                // case "extension":
                // case "container": {
                //     console.log(jobType)

                //     const area = spawn.room.lookForAtArea(
                //         LOOK_TERRAIN,
                //         spawn.pos.y - rclLevel + 2,
                //         spawn.pos.x - rclLevel + 2,
                //         spawn.pos.y + rclLevel + 2,
                //         spawn.pos.x + rclLevel + 2,
                //         true
                //     );

                //     for (let index = Math.floor(Math.random()*area.length); index < area.length; index++) {
                //         const element = area[index];

                //         if (element.x == (spawn.pos.x || spawn.pos.x + 1 || spawn.pos.x -1) &&
                //         element.y == (spawn.pos.y || spawn.pos.y + 1 || spawn.pos.y -1)) continue;

                //         if (element.terrain !== "plain") {
                //             continue;
                //         }

                //         var z = spawn.room.lookForAt(
                //             LOOK_STRUCTURES,
                //             element.x,
                //             element.y
                //         );

                //         if (z.length == 0) {
                //             console.log(jobType)

                //             job = {
                //                 type: jobType,
                //                 x: area[index].x,
                //                 y: area[index].y,
                //             };

                //             specialSite = true;
                //             break;
                //         }
                //     }

                //     break;
                // }
                case "road.to.controller": {
                    console.log('road.to.controller')
                    const path = spawn.pos.findPathTo(
                        spawn.room.controller.pos,
                        {
                            ignoreDestructibleStructures: false,
                            ignoreCreeps: true,
                        }
                    );

                    if (path) {
                        for (let index = 0; index < path.length - 2; index++) {
                            const pos = path[index];
                            spawn.room.createConstructionSite(
                                pos.x,
                                pos.y,
                                STRUCTURE_ROAD
                            );
                        }

                        job = {
                            type: STRUCTURE_ROAD,
                            x: path[0].x,
                            y: path[0].y,
                        };

                        specialSite = true;
                    }

                    break;
                }
                case "road.to.source": {
                    console.log('road.to.source')
                    spawn.room.memory.sources.forEach((obj) => {
                        const source = Game.getObjectById(obj.id);

                        const path = spawn.pos.findPathTo(source.pos, {
                            ignoreDestructibleStructures: false,
                            ignoreCreeps: true,
                        });

                        if (path) {
                            for (
                                let index = 0;
                                index < path.length - 3;
                                index++
                            ) {
                                const pos = path[index];

                                spawn.room.createConstructionSite(
                                    pos.x,
                                    pos.y,
                                    STRUCTURE_ROAD
                                );
                            }

                            job = {
                                type: STRUCTURE_ROAD,
                                x: path[0].x,
                                y: path[0].y,
                                built: false,
                            };

                            specialSite = true;
                        }
                    });

                    break;
                }
                // case 'rcl.container': {
                //     // RCL adjacent container.
                //     const path = spawn.pos.findPathTo(spawn.room.controller.pos, {
                //         ignoreDestructibleStructures: true,
                //         ignoreCreeps: true
                //     });

                //     // Far enough away for Upgraders to have it at their backs while working
                //     // but not so close that it gets in the way or too far that they have to
                //     // travel unnecessarily.
                //     if (path) {
                //         let pos = undefined;

                //         if (path.length > 10) {
                //             pos = path[Math.ceil(path.length * 0.3)]; // Find a position 30% of the way towards the RCL.

                //             const roomPosition = spawn.room.getPositionAt(pos.x, pos.y)
                //             const containerStructure = roomPosition.findInRange(FIND_STRUCTURES, 3, {
                //                 filter: {
                //                     structureType: STRUCTURE_CONTAINER
                //                 }
                //             })[0];

                //             if (_.isEmpty(containerStructure)) {

                //                 const area = spawn.room
                //                     .lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);

                //                 for (let index = 0; index < area.length; index++) {
                //                     const element = area[index];

                //                     if (element.terrain !== 'plain') {
                //                         continue;
                //                     }

                //                     var z = spawn.room.lookForAt(LOOK_STRUCTURES, element.x, element.y);

                //                     if (z.length == 0) {
                //                         pos = area[index];
                //                         break;
                //                     }
                //                 }

                //                 job = {
                //                     type: STRUCTURE_CONTAINER,
                //                     x: pos.x,
                //                     y: pos.y
                //                 };

                //                 specialSite = true;
                //             } else {
                //                 job = undefined;
                //             }
                //         }
                //     }

                //     break;
                // }

                // Locate the Storage structure and put a Link nearby.
                case "storage.link": {
                    const storage = spawn.room.storage;
                    if (storage) {
                        const linkStructure = Game.getObjectById(
                            storage.id
                        ).pos.findInRange(FIND_MY_STRUCTURES, 5, {
                            filter: {
                                structureType: STRUCTURE_LINK,
                            },
                        })[0];

                        if (!linkStructure) {
                            // Look around the Storage structure position for free Terrain tiles to build on.
                            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, 1], [1, -1]]) {
                                const tileObjects = spawn.room.lookAt(storage.pos.x + dr, storage.pos.y + dc);
                                const terrain = _.find(tileObjects, { type: LOOK_TERRAIN });

                                if (terrain.length > 0) {
                                    job = {
                                        type: STRUCTURE_LINK,
                                        x: storage.pos.x + dr,
                                        y: storage.pos.y + dc,
                                    };

                                    specialSite = true;

                                    break;
                                }
                            }
                        } else {
                            console.log('found existing link structure near the storage')
                        }
                    }

                    break;
                }
                // Iterate all Source locations and find the first without a Link structure.
                case "source.link": {
                    spawn.room.memory.sources.forEach((source) => {
                        // Determine how far to place the Link from this Source, if it as only one access point we need 
                        // to move back a little.
                        const distanceToPlaceLink = source.accessPoints = 1 ? 2 : Math.max(source.accessPoints, 2);

                        const linkStructure = Game.getObjectById(
                            source.id
                        ).pos.findInRange(FIND_MY_STRUCTURES, distanceToPlaceLink, {
                            filter: {
                                structureType: STRUCTURE_LINK,
                            },
                        })[0];

                        if (!linkStructure || _.isEmpty(linkStructure)) {
                          const pos = Game.getObjectById(source.id).pos;

                            // Look around the current position for free Terrain tiles to build on.
                            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, 1], [1, -1]]) {
                                const tileObjects = spawn.room.lookAt(pos.x + dr, pos.y + dc);
                                const terrain = _.find(tileObjects, { type: LOOK_TERRAIN });

                                if (terrain.terrain === "plain") {
                                    console.log(4)
                                    job = {
                                        type: STRUCTURE_LINK,
                                        x: pos.x + dr,
                                        y: pos.y + dc,
                                    };

                                    console.log(JSON.stringify(job))
                                    specialSite = true;

                                    break;
                                }
                            }
                        } else {
                            console.log('sdfsf')
                            source.linkId = linkStructure.id;
                            return;
                        }
                    });

                    break;
                }
            }

            // if (currentRCLLevel >= 3) {
            //   p_room.sources().forEach(pos => {
            //     let path = spawn.pos.findPathTo(pos, {
            //       maxOps: 200,
            //       ignoreCreeps: true
            //     });
            //     if (path.length) {
            //       //console.log('path', JSON.stringify(path));
            //        //path.forEach(x => {
            //       //   p_room.createConstructionSite(pos.x, pos.y, structure.STRUCTURE_ROAD);
            //       // });

            //       job = {
            //         type: structure.STRUCTURE_ROAD,
            //         x: pos.x,
            //         y: pos.y
            //       };
            //     }

            //     specialSite = true;
            //   });

            //     }
            //   break;
            //     }

            if (!job) {
                continue;
            }

            let x = spawn.pos.x + job.x;
            let y = spawn.pos.y + job.y;

            if (specialSite) {
                x = job.x;
                y = job.y;
            }

            const tileObjects = spawn.room.lookAt(x, y).filter(function (x) {
                return (
                    x.type != "resource" &&
                    x.type != "energy" &&
                    x.type != "ruin" &&
                    x.type != "creep"
                );
            });

            if (
                tileObjects.length < 3 &&
                tileObjects[0].type == "terrain" &&
                tileObjects[0].terrain != "wall"
            ) {
                let result = spawn.room.createConstructionSite(x, y, job.type);
                switch (result) {
                    case OK: {
                        jobs[i].built = true;

                        // Only set down one construction site at a time.
                        return;
                    }
                    default: {
                        console.log(
                            "⛔ Error: calling createConstructionSite, " +
                            EXIT_CODE[result] +
                            ", job=",
                            JSON.stringify(job) +
                            ", x=" +
                            job.x +
                            ", y=" +
                            job.y
                        );
                        return;
                    }
                }
            } else {
                let tile = tileObjects[0];
                if (tile.type == "constructionSite") {
                    continue;
                }

                if (!tile.structure) {
                    // Check if the reason we cannot build is the spawn dump flag is here. 
                    // TODO Remove the spawn dump flag when we get container storage.
                    if (tile.type === 'flag' && tile.flag.name.endsWith('_DUMP')) {
                        if (Game.flags[tile.flag.name]) {
                            Game.flags[tile.flag.name].remove();
                        }
                    } else {
                        console.log("⛔ Error: tile.structure is falsy tile=" + JSON.stringify(tile));

                        // Try the next templated job...
                        job.built = true;
                    }

                    continue;
                }

                if (tile.structure.structureType != job.type) {
                    console.log(
                        "⚠️ WARNING: Cannot build " +
                        job.type +
                        ", position x: " +
                        tile.structure.pos.x +
                        ", y: " +
                        tile.structure.pos.y +
                        ", is already allocated with a " +
                        tile.structure.structureType);

                    if (tile.structure.structureType === STRUCTURE_ROAD) {
                        tile.structure.destroy();
                    }
                }
            }
        }
    },

    // Doesn't use a traditional queue or any cache but instead looks at current construction site objects
    // to determine whether to continue or not.
    buildLinks: function (room) {
        if (!room.structures().spawn) {
            return;
        }

        // Only enqueue one construction site at a time.
        if (room.constructionSites().length > 0) {
            return;
        }

        const spawn = room.structures().spawn[0];

        for (let j = 0; j <= room.controller.level; j++) {
            if (!room.memory.jobs) {
                continue;
            }

            // console.log(1)
            // room.memory.jobs.jobs["RCL_" + j].jobs.push({ type: "road.to.source", x: 0, y: 0 });

            // break if a job is queued.
            this.processJobs(
                spawn,
                room.controller.level,
                room.memory.jobs.jobs["RCL_" + j].jobs
            );
        }
    },

    locateSpawnDumpLocation: function (room) {
        if (!room.structures().spawn || room.structures().container) return;

        const spawn = room.structures().spawn[0];

        if (room.structures().storage) {
            const flags = spawn.room
                .lookAt(spawn.pos.x, spawn.pos.y + 4)
                .filter(function (x) {
                    return x.type == "flag";
                });

            if (_.isEmpty(flags)) return;

            Game.flags[flags[0].flag.name].remove();

            return;
        }
        new RoomPosition(spawn.pos.x, spawn.pos.y + 4, room.name).createFlag(
            spawn.name + "_DUMP"
        );
    }
};

module.exports = infrastructureTasks;
