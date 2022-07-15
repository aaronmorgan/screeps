const {
    role
} = require('game.constants');

require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleLinkSourceHarvester = {

    tryBuild: function (p_spawn, p_energyCapacityAvailable) {
        let bodyType = [];
        if (p_energyCapacityAvailable >= 300) {
            bodyType = [CARRY, CARRY, MOVE, MOVE, MOVE];
        }

        if (!_.isEmpty(bodyType)) {
            const targetLinkId = p_spawn.room.selectAvailableSourceLink(p_spawn.room.creeps().roleLinkSourceHarvesters);

            if (_.isEmpty(targetLinkId)) {
                console.log('ERROR: Attempting to create ' + role.LINK_SOURCE_HARVESTER + ' with an assigned source');
                return EXIT_CODE.ERR_INVALID_TARGET;
            } else {
                return creepFactory.create(p_spawn, role.LINK_SOURCE_HARVESTER, bodyType, {
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
        const creepFillPercentage = Math.round(creep.store.getUsedCapacity() / creep.store.getCapacity() * 100);

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

            if (transferResult == ERR_NOT_IN_RANGE) {
                creep.moveTo(sourceLink, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }

            creep.say('🔌 ' + creepFillPercentage + '%');
        }
    }
};

module.exports = roleLinkSourceHarvester;