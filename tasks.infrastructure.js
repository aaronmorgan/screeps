const {
    EXIT_CODE
} = require('game.constants');

const {
    jobs
} = require('tasks.infrastructure.jobs');

var infrastructureTasks = {

    processJobs: function (p_spawn, p_jobs) {

        for (let i = 0; i < p_jobs.length; i++) {
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
                // case 'rcl.container': {
                //     // RCL adjacent container.
                //     const path = p_spawn.pos.findPathTo(p_room.controller.pos, {
                //         ignoreDestructibleStructures: true,
                //         ignoreCreeps: true
                //     });

                //     // TODO check that all surrounding tiles are empty and if not move 
                //     // further away from the RCL until condition satisfied/

                //     // Far enough away for Upgraders to have it at their backs while working
                //     // but not so close that it gets in the way or too far that they have to 
                //     // travel unnecessarily.
                //     if (path) {
                //         let pos = undefined;

                //         if (path.length > 10) {
                //             pos = path[Math.ceil(path.length * 0.6)];
                //         } else {
                //             pos = path[path.length - 2];
                //         }

                //         job = {
                //             type: STRUCTURE_CONTAINER,
                //             x: pos.x,
                //             y: pos.y
                //         };

                //         specialSite = true;
                //     }

                //     break;
                // }
                case 'furthest.source.link': {
                    let longestPath = undefined;

                    p_spawn.room.memory.sources.forEach(source => {
                        const path = p_spawn.pos.findPathTo(Game.getObjectById(source.id).pos, {
                            ignoreDestructibleStructures: true,
                            ignoreCreeps: true
                        });

                        if (!longestPath || path.length > longestPath.length) {
                            longestPath = path;
                        }
                    });

                    if (longestPath) {
                        const pos = longestPath[longestPath.length - 3]; // TODO is this correct?

                        job = {
                            type: STRUCTURE_LINK,
                            x: pos.x,
                            y: pos.y
                        };

                        specialSite = true;
                    }

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
    buildLinks: function (p_room) {
        // Only enqueue one construction site at a time.
        if (p_room.constructionSites().length > 0) {
            return;
        }

        const spawn = p_room.structures().spawn[0];

        for (let j = 0; j <= p_room.controller.level; j++) {
            this.processJobs(spawn, jobs['RCL_' + j].jobs);
        }
    },

    locateSpawnDumpLocation: function (p_room) {
        const spawn = p_room.structures().spawn[0];

        new RoomPosition(spawn.pos.x, spawn.pos.y + 3, p_room.name).createFlag(spawn.name + '_DUMP')
        //Game.flags.Flag1.setPosition();

        // p_room.memory.locations = [];
        // p_room.memory.locations.push({
        //     'name': 'SPAWN_DUMP_SITE', 
        //     'pos': new RoomPosition(spawn.pos.x, spawn.pos.y - 1, p_room.name)
        // });
    }
}

module.exports = infrastructureTasks;