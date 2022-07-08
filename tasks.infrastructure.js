const {
    EXIT_CODE
} = require('game.constants');

var infrastructureTasks = {

    processJobs: function (p_spawn, p_jobs) {

        for (let i = 0; i < p_jobs.length; i++) {
            if (p_jobs[i].built) {
                continue;
            }

            let job = p_jobs[i];
            let specialSite = false;

            switch (job.type) {
                case 'road.to.controller': {
                    const path = p_spawn.pos.findPathTo(p_spawn.room.controller.pos, {
                        ignoreDestructibleStructures: true,
                        ignoreCreeps: true
                    });

                    if (path) {
                        for (let index = 0; index < path.length - 1; index++) {
                            const pos = path[index];
                            p_spawn.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                        }

                        job = {
                            type: STRUCTURE_ROAD,
                            x: path[0].x,
                            y: path[0].y
                        };

                        specialSite = true;
                    }

                    break;
                }
                case 'road.to.source': {
                    p_spawn.room.memory.sources.forEach(obj => {
                        const source = Game.getObjectById(obj.id);

                        const path = p_spawn.pos.findPathTo(source.pos, {
                            ignoreDestructibleStructures: true,
                            ignoreCreeps: true
                        });

                        if (path) {
                            for (let index = 0; index < path.length - 3; index++) {
                                const pos = path[index];

                                p_spawn.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                            }

                            job = {
                                type: STRUCTURE_ROAD,
                                x: path[0].x,
                                y: path[0].y
                            };

                            specialSite = true;
                        }
                    });

                    break;
                }
                case 'rcl.container': {
                    // RCL adjacent container.
                    const path = p_spawn.pos.findPathTo(p_spawn.room.controller.pos, {
                        ignoreDestructibleStructures: true,
                        ignoreCreeps: true
                    });

                    // Far enough away for Upgraders to have it at their backs while working
                    // but not so close that it gets in the way or too far that they have to 
                    // travel unnecessarily.
                    if (path) {
                        let pos = undefined;

                        if (path.length > 10) {
                            pos = path[Math.ceil(path.length * 0.3)]; // Find a position 30% of the way towards the RCL.

                            const area = p_spawn.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);

                            for (let index = 0; index < area.length; index++) {
                                const element = area[index];

                                if (element.terrain !== 'plain') {
                                    continue;
                                }

                                var z = p_spawn.room.lookForAt(LOOK_STRUCTURES, element.x, element.y);

                                if (z.length == 0) {
                                    pos = area[index];
                                    break;
                                }
                            }
                        }

                        job = {
                            type: STRUCTURE_CONTAINER,
                            x: pos.x,
                            y: pos.y
                        };

                        specialSite = true;
                    }

                    break;
                }
                // Iterate all Source locations and find the first without a Link structure.
                case 'source.link': {
                    p_spawn.room.memory.sources.forEach(source => {
                        const path = p_spawn.pos.findPathTo(Game.getObjectById(source.id).pos, {
                            ignoreDestructibleStructures: true,
                            ignoreCreeps: true
                        });

                        const pos = path[path.length - 3];

                        var foundLinkStructure = p_spawn.room.lookAt(pos.x, pos.y).filter(x => x.type === 'structure' && x.structure.structureType ===
                            'link').length > 0;

                        if (foundLinkStructure === false) {

                            job = {
                                type: STRUCTURE_LINK,
                                x: pos.x,
                                y: pos.y
                            };

                            specialSite = true;
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

            let x = p_spawn.pos.x + job.x;
            let y = p_spawn.pos.y + job.y;

            if (specialSite) {
                x = job.x;
                y = job.y;
            }

            const tileObjects = p_spawn.room.lookAt(x, y).filter(function (x) {
                return (
                    x.type != 'resource' &&
                    x.type != 'energy' &&
                    x.type != 'ruin' &&
                    x.type != 'creep');
            });

            if (tileObjects.length < 3 &&
                (tileObjects[0].type == 'terrain' && tileObjects[0].terrain != 'wall')) {

                let result = p_spawn.room.createConstructionSite(x, y, job.type);

                switch (result) {
                    case OK: {
                        p_jobs[i].built = true;

                        // Only set down one construction site at a time.
                        return;
                    }
                    default: {
                        console.log('⛔ Error: calling createConstructionSite, ' + EXIT_CODE[result] + ', job=', JSON.stringify(job) + ', x=' + job.x + ', y=' + job.y);
                        return;
                    }
                }
            } else {
                let tile = tileObjects[0];

                if (tile.type == 'constructionSite') {
                    continue;
                }
                //  console.log('tile', JSON.stringify(tile));
                if (!tile.structure) {
                    console.log('⛔ Error: ' + JSON.stringify(tile));

                    // Try the next templated job...
                    continue;
                }

                if (tile.structure.structureType != job.type) {
                    console.log('⚠️ WARNING: Cannot build ' + job.type + ', position x: ' + tile.structure.pos.x + ', y: ' + tile.structure.pos.y + ', is already allocated with a ' + tile.structure.structureType);
                }
            }
        }
    },

    // Doesn't use a traditional queue or any cache but instead looks at current construction site objects
    // to determine whether to continue or not.
    buildLinks: function (room) {
        // Only enqueue one construction site at a time.
        if (room.constructionSites().length > 0) {
            return;
        }

        const spawn = room.structures().spawn[0];

        for (let j = 0; j <= room.controller.level; j++) {
            this.processJobs(spawn, room.memory.jobs.jobs['RCL_' + j].jobs);
        }
    },

    locateSpawnDumpLocation: function (room) {
        const spawn = room.structures().spawn[0];

        new RoomPosition(spawn.pos.x, spawn.pos.y + 3, room.name).createFlag(spawn.name + '_DUMP')
        //Game.flags.Flag1.setPosition();

        // p_room.memory.locations = [];
        // p_room.memory.locations.push({
        //     'name': 'SPAWN_DUMP_SITE', 
        //     'pos': new RoomPosition(spawn.pos.x, spawn.pos.y - 1, p_room.name)
        // });
    }
}

module.exports = infrastructureTasks;