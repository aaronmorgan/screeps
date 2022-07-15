const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleLinkSourceHarvester = {

    tryBuild: function (spawn, energyCapacityAvailable) {
        let bodyType = [CARRY, MOVE, MOVE];

        if (!_.isEmpty(bodyType)) {
            const targetLinkId = spawn.room.selectAvailableSourceLink(spawn.room.creeps().roleLinkSourceHarvesters);

            if (_.isEmpty(targetLinkId)) {
                console.log('ERROR: Attempting to create ' + role.LINK_SOURCE_HARVESTER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(spawn, role.LINK_SOURCE_HARVESTER, bodyType, {
                    role: role.LINK_SOURCE_HARVESTER,
                    linkId: targetLinkId[0].linkId,
                    sourceId: targetLinkId[0].id,
                    harvesting: false
                });
            }
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const creepFillPercentage = creep.CreepFillPercentage();

        if (creepFillPercentage == 100) {
            creep.memory.harvesting = false;
        } else if (creepFillPercentage == 0 && creep.memory.harvesting == false) {
            creep.memory.harvesting = true;
        }

        if (creepFillPercentage < 100 || creep.memory.harvesting == true) {
            const droppedResources = creep.room.droppedResourcesCloseToSource(creep.memory.linkId);

            if (droppedResources) {
                const energyTarget = creep.pos.findClosestByPath(droppedResources.map(x => x.energy));

                if (!_.isEmpty(energyTarget)) {
                    let source = Game.getObjectById(energyTarget.id);

                    const pickupResult = creep.pickup(source);

                    switch (pickupResult) {
                        case OK: {
                            creep.say(creepFillPercentage + '%');

                            creep.memory.harvesting = false;
                            creep.memory.isLinkTranfer = true;
                            break;
                        }
                        case ERR_NOT_IN_RANGE: {
                            const moveResult = creep.moveTo(source, {
                                visualizePathStyle: {
                                    stroke: '#ffaa00'
                                }
                            });
                            break;
                        }
                        case ERR_FULL: {
                            creep.memory.harvesting = false;
                        }
                    }
                }
            }
        }

        if (creepFillPercentage == 100 || creep.memory.harvesting == false) {
            creep.memory.harvesting = false;

            var sourceLink = Game.getObjectById(creep.memory.linkId);

            const transferResult = creep.transfer(sourceLink, RESOURCE_ENERGY);

            switch (transferResult) {
                case (ERR_NOT_IN_RANGE): {
                    creep.moveTo(sourceLink, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                    break;
                }
                default:
                    console.log('transferResult', transferResult)
            }

            creep.say('🔌 ' + creepFillPercentage + '%');
        }
    }
};

module.exports = roleLinkSourceHarvester;