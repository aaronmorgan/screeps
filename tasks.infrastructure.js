const { EXIT_CODE } = require("game.constants");

var infrastructureTasks = {
    processJobs: function (spawn, rclLevel, jobs) {
        for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].built) {
                console.log(JSON.stringify(job))
                continue;
            }

            let job = jobs[i];
            let specialSite = false;

            const jobType = job.type;

            switch (jobType) {
                case "road.to.controller": {
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
                    spawn.room.memory.sources.forEach((obj) => {
                        const source = Game.getObjectById(obj.id);

                        const path = spawn.pos.findPathTo(source.pos, {
                            ignoreDestructibleStructures: false,
                            ignoreCreeps: true,
                        });

                        if (path) {
                            for (
                                let index = 0;
                                index < path.length - 2;
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
                                    job = {
                                        type: STRUCTURE_LINK,
                                        x: pos.x + dr,
                                        y: pos.y + dc,
                                    };

                                    specialSite = true;

                                    break;
                                }
                            }
                        } else {
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
            } else {
                // Catch error state where xy are outside the room bounds.
                if (job.x > 49 || job.y > 49) {
                    job.x = 0;
                    job.y = 0;

                }
            }

            let x = 0;
            let y = 0;

            // No set location is defined, so pick something.
            if (job.x === 0 && job.y === 0 && !job.built) {
                let structures = [];

                switch (job.type) {
                    case STRUCTURE_EXTENSION: {
                        structures = spawn.room.find(FIND_STRUCTURES, {
                            filter: { structureType: STRUCTURE_EXTENSION }
                        });

                        break;
                    }
                    case STRUCTURE_CONTAINER: {
                        structures = spawn.room.find(FIND_STRUCTURES, {
                            filter: { structureType: STRUCTURE_CONTAINER }
                        });

                        break;
                    }
                    case STRUCTURE_TOWER: {
                        structures = spawn.room.find(FIND_STRUCTURES, {
                            filter: { structureType: STRUCTURE_TOWER }
                        });

                        break;
                    }
                }

                // TODO: In time put the pos to build around on the job array, instead of passing spawn.pos each time.
                const [xCoord, yCoord] = this.determineBuildLocation(spawn.pos, job, spawn.room);

                // TODO: Potential here for the above checks to fail and not assign xy values to job.
                x = xCoord;
                y = yCoord;
            } else {
                x = spawn.pos.x + job.x;
                y = spawn.pos.y + job.y;
            }

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
                tileObjects[0].terrain != "wall" &&
                tileObjects[0].terrain != "swamp"
            ) {
                let result = spawn.room.createConstructionSite(x, y, job.type);
                switch (result) {
                    case OK: {
                        //  jobs[i].built = true;

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
                const tile = tileObjects[0];
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
                        //     job.built = true;
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

            // break if a job is queued.
            this.processJobs(
                spawn,
                room.controller.level,
                room.memory.jobs.jobs["RCL_" + j].jobs
            );
        }
    },

    locateSpawnDumpLocation: function (room) {
        if (!room.structures().spawn || room.structures().container) {
            return;
        }

        const spawn = room.structures().spawn[0];

        // If we have a Storage structure remove the dump flag, it should no longer be required.
        if (room.structures().storage) {
            const roomFlag = Game.flags[room.name + '_DUMP'];

            if (roomFlag) {
                Game.flags[roomFlag.name].remove();
            }

            return;
        }

        // Cast around for a random location within 4 tiles of the spawn to site the Dump flag.
        const [buildAtX, buildAtY] = this.determineBuildLocation(spawn.pos, { range: 3 }, room);

        new RoomPosition(buildAtX, buildAtY, room.name).createFlag(room.name + "_DUMP");
    },

    /** 
     * Look around the Spawn position for free Terrain tiles to build on, increasing the range until we find a spot.
     * 
     * @param {any} pos The position we're going to build around.
     * @param {any} job The job object we're trying to build, e.g. Extension.
     * @param {any} room The room object we're building within.
     */
    determineBuildLocation: function (pos, job, room) {
        let range = job.range;
        let directions = [];

        const spawnAdjacentCoords = [-1, 0, 1];

        for (let i = 0; i < 12; i++) {
            // Find a random number between 3 and -1 and floor it, this will create a rante -1 to 1 giving us options of -1, 0 and 1 for the x y.
            let x = Math.floor(Math.random() * 3 - 1)
            let y = Math.floor(Math.random() * 3 - 1)

            if (Math.random(100) % 2 === 0) {
                x += range;
            } else {
                y += range;
            }

            // We don't want the structure to touch the spawn so ensure if there is a position adjacent to the spawn discard it.
            if (spawnAdjacentCoords.includes(x) && spawnAdjacentCoords.includes(y)) {
                i--;

                continue;
            }

            // directions.push([Math.ceil(range, x), Math.ceil(range, y)]);
            directions.push([x, y]);
        }

        directions = this.shuffleArray(directions);

        // Iterate around the point and if no site is available extend the range and repeat. No break condition, this shouldn't fail...
        while (true) {
            for (const [x, y] of directions) {
                // Determine the row and column of the target site, adding range which is positive to a maybe negative number.
                const buildAtX = pos.x + x;
                const buildAtY = pos.y + y;

                const tileObjects = room.lookAt(buildAtX, buildAtY);

                const terrain = _.find(tileObjects, { type: LOOK_TERRAIN });

                const existingStructure = tileObjects.some(obj => {
                    if (obj.type === 'structure') {
                        return true;
                    }
                });

                if (!existingStructure) {
                    if (terrain && terrain.terrain === 'plain') {
                        return [buildAtX, buildAtY];
                    }
                }
            }

            // Increase the range to look further out for a build site.
            range += 1;
        }
    },

    shuffleArray: function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

};

module.exports = infrastructureTasks;
