const {
    EXIT_CODE
} = require('game.constants');

var infrastructureTasks = {

    processJobs: function (spawn, jobs) {

        for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].built) {
                //    continue;
            }

            let job = jobs[i];
            let specialSite = false;

            switch (job.type) {
                case 'road.to.controller': {
                    const path = spawn.pos.findPathTo(spawn.room.controller.pos, {
                        ignoreDestructibleStructures: true,
                        ignoreCreeps: true
                    });

                    if (path) {
                        for (let index = 0; index < path.length - 1; index++) {
                            const pos = path[index];
                            spawn.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
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
                    spawn.room.memory.sources.forEach(obj => {
                        const source = Game.getObjectById(obj.id);

                        const path = spawn.pos.findPathTo(source.pos, {
                            ignoreDestructibleStructures: true,
                            ignoreCreeps: true
                        });

                        if (path) {
                            for (let index = 0; index < path.length - 3; index++) {
                                const pos = path[index];

                                spawn.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
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
                // Iterate all Source locations and find the first without a Link structure.
                case 'source.link': {
                    spawn.room.memory.sources.forEach(source => {
                        const path = spawn.pos.findPathTo(Game.getObjectById(source.id).pos, {
                            ignoreDestructibleStructures: true,
                            ignoreCreeps: true
                        });

                        const linkStructure = Game.getObjectById(source.id).pos.findInRange(FIND_MY_STRUCTURES, 3, {
                            filter: {
                                structureType: STRUCTURE_LINK
                            }
                        })[0];

                        if (_.isEmpty(linkStructure)) {
                            const pos = path[path.length - 3];

                            job = {
                                type: STRUCTURE_LINK,
                                x: pos.x,
                                y: pos.y
                            };

                            specialSite = true;
                        } else {
                            source.linkId = linkStructure.id;
                            job = undefined;
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

            if (!job) continue;

            let x = spawn.pos.x + job.x;
            let y = spawn.pos.y + job.y;

            if (specialSite) {
                x = job.x;
                y = job.y;
            }

            const tileObjects = spawn.room.lookAt(x, y).filter(function (x) {
                return (
                    x.type != 'resource' &&
                    x.type != 'energy' &&
                    x.type != 'ruin' &&
                    x.type != 'creep');
            });

            if (tileObjects.length < 3 &&
                (tileObjects[0].type == 'terrain' && tileObjects[0].terrain != 'wall')) {

                let result = spawn.room.createConstructionSite(x, y, job.type);

                switch (result) {
                    case OK: {
                        jobs[i].built = true;

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

        if (room.structures().storage) {
            const flags = spawn.room.lookAt(spawn.pos.x, spawn.pos.y + 4).filter(function (x) {
                return (x.type == 'flag');
            });

            if (_.isEmpty(flags)) return;

            Game.flags[flags[0].flag.name].remove();

            return;
        }

        new RoomPosition(spawn.pos.x, spawn.pos.y + 4, room.name).createFlag(spawn.name + '_DUMP')
    }
}

module.exports = infrastructureTasks;