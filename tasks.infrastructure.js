const { EXIT_CODE } = require("game.constants");

var infrastructureTasks = {
    processJobs: function (spawn, jobs) {
        for (let i = 0; i < jobs.length; i++) {
            let job = jobs[i];

            if (job.built) {
                continue;
            }

            const jobType = job.type;

            if (job.name && job.name.startsWith('road.to.')) {
                targets = [];

                switch (job.target) {
                    case RESOURCE_ENERGY: {
                        targets = spawn.room.find(FIND_SOURCES);
                        break;
                    }
                    case STRUCTURE_CONTROLLER:
                    case STRUCTURE_CONTAINER: {
                        targets = spawn.room.find(FIND_STRUCTURES, {
                            filter: { structureType: job.target }
                        });
                        break;
                    }
                }

                if (targets) {
                    targets.forEach((obj) => {
                        const target = Game.getObjectById(obj.id);

                        const path = spawn.pos.findPathTo(target.pos, {
                            ignoreDestructibleStructures: false,
                            ignoreCreeps: true,
                        });

                        if (path) {
                            for (let index = 0; index < path.length - 1; index++) {
                                const pos = path[index];

                                this.createConstructionSite(spawn, pos.x, pos.y, job);
                            }

                            job.built = true;
                        }
                    });
                }

                return;
            }

            // Create a road fully around the spawn. This creates connections with the other road.to jobs such as road.to.controller.
            if (job.name && job.name === 'road.around.spawn') {
                for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, 1], [1, -1]]) {
                    spawn.room.createConstructionSite(spawn.pos.x + dc, spawn.pos.y + dr, STRUCTURE_ROAD);
                }

                return;
            }

            switch (jobType) {
                case STRUCTURE_EXTENSION: {
                    const structures = spawn.room.find(FIND_STRUCTURES, {
                        filter: { structureType: STRUCTURE_EXTENSION }
                    });

                    if (this.buildStructure(spawn, structures, job)) {
                        job.built = true;
                    }

                    return;
                }
                case STRUCTURE_CONTAINER: {
                    const structures = spawn.room.find(FIND_STRUCTURES, {
                        filter: { structureType: STRUCTURE_CONTAINER }
                    });

                    if (this.buildStructure(spawn, structures, job)) {
                        job.built = true;
                    }
                    return;
                }
                case STRUCTURE_TOWER: {
                    const structures = spawn.room.find(FIND_STRUCTURES, {
                        filter: { structureType: STRUCTURE_TOWER }
                    });

                    if (this.buildStructure(spawn, structures, job)) {
                        job.built = true;
                    }

                    return;
                }
                case STRUCTURE_STORAGE: {
                    const structures = spawn.room.find(FIND_STRUCTURES, {
                        filter: { structureType: STRUCTURE_STORAGE }
                    });

                    // TODO: Is this really appropriate? What if the containers aren't working at this point, there'll be no-where to 
                    // dump enery until AFTER the Storage is completed.
                    const roomFlag = Game.flags[spawn.room.name + '_DUMP'];

                    if (roomFlag) {
                        Game.flags[roomFlag.name].remove();
                    }

                    if (this.buildStructure(spawn, structures, job)) {
                        job.built = true;
                    }

                    return;
                }
                // Locate the Storage structure and put a Link nearby.
                case STRUCTURE_LINK: {
                    // Look for a Link structure around the Storage structure.
                    const storage = spawn.room.storage;
                    if (storage) {
                        const linkStructure = Game.getObjectById(storage.id).pos.findInRange(FIND_MY_STRUCTURES, 5, {
                            filter: {
                                structureType: STRUCTURE_LINK,
                            },
                        })[0];

                        if (!linkStructure) {
                            const [buildAtX, buildAtY] = this.determineBuildLocation(storage.pos, job, room);

                            this.createConstructionSite(spawn, buildAtX, buildAtY, job);
                            this.buildStructure(spawn, structures, job);
                        }
                    }

                    // Iterate all Source locations and find the first without a Link structure.
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

                            const [buildAtX, buildAtY] = this.determineBuildLocation(pos, job, room);

                            this.createConstructionSite(spawn, buildAtX, buildAtY, job);
                            this.buildStructure(spawn, structures, job);
                        } else {
                            source.linkId = linkStructure.id;
                            return;
                        }
                    });

                    job.built = true;

                    return;
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
        const [buildAtX, buildAtY] = this.determineBuildLocation(spawn.pos, { range: 4 }, room);

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

        for (let i = 0; directions.length < 12; i++) {
            // Find a random number between 3 and -1 and floor it, this will create a rante -1 to 1 giving us options of -1, 0 and 1 for the x y.
            let x = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            let y = Math.floor(Math.random() * 3) - 1;

            // Randomly pick a sign (+1 or -1) for the range offset.
            const sign = Math.random() < 0.5 ? 1 : -1;

            // Randomly apply the range offset to either x or y.
            if (Math.random() < 0.5) {
                x += range * sign;
            } else {
                y += range * sign;
            }

            // We don't want the structure to touch the spawn so ensure if there is a position adjacent to the spawn discard it.
            if (spawnAdjacentCoords.includes(x) && spawnAdjacentCoords.includes(y)) {
                i--;

                continue;
            }

            // directions.push([Math.ceil(range, x), Math.ceil(range, y)]);
            if (directions.includes([x, y])) {
                continue;
            }
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

                const existingStructure = tileObjects.some(obj => {
                    if (obj.type === 'structure') {
                        return true;
                    }
                });

                if (!existingStructure) {
                    const terrain = _.find(tileObjects, { type: LOOK_TERRAIN });

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
    },

    buildStructure: function (spawn, structures, job) {
        if (structures.length >= job.count) {
            job.built = true;

            return false;
        }

        // TODO: In time put the pos to build around on the job array, instead of passing spawn.pos each time.
        const [xCoord, yCoord] = this.determineBuildLocation(spawn.pos, job, spawn.room);

        this.createConstructionSite(spawn, xCoord, yCoord, job);
    },

    createConstructionSite: function (spawn, x, y, job) {
        const tileObjects = spawn.room.lookAt(x, y).filter(function (x) {
            return (
                x.type != "resource" &&
                x.type != "energy" &&
                x.type != "ruin" &&
                x.type != "creep"
            );
        });

        if (tileObjects.length < 3 &&
            tileObjects[0].type == "terrain" &&
            tileObjects[0].terrain != "wall" &&
            tileObjects[0].terrain != "swamp"
        ) {
            let result = spawn.room.createConstructionSite(x, y, job.type);
            switch (result) {
                case OK: {
                    // Only set down one construction site at a time.
                    return true;
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

                    return true;
                }
            }
        } else {
            const tile = tileObjects[0];
            if (tile.type == "constructionSite") {
                return false;
            }

            if (!tile.structure) {
                console.log("⛔ Error: tile.structure is falsy tile=" + JSON.stringify(tile));

                return false;
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

};

module.exports = infrastructureTasks;
