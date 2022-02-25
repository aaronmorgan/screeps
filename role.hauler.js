const {
  role
} = require('game.constants');

require('prototype.room')();
require('prototype.creep')();

let creepFactory = require('tasks.build.creeps');

var roleHauler = {

  tryBuild: function (p_room, p_spawn, p_energyCapacityAvailable) {
    let bodyType = [];

    if (p_energyCapacityAvailable >= 450) {
      bodyType = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (p_energyCapacityAvailable >= 400) {
      bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (p_energyCapacityAvailable >= 350) {
      bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    } else {
      bodyType = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    }

    if (!_.isEmpty(bodyType)) {
      return creepFactory.create(p_room, p_spawn, role.HAULER, bodyType, {
        role: role.HAULER,
        harvesting: true,
        targetedDroppedEnergy: {
          id: 0,
          pos: new RoomPosition(1, 1, p_room.name)
        }
      });
    }
  },

  /** @param {Creep} p_creep **/
  run: function (p_creep) {
    p_creep.checkTicksToDie();
    p_creep.checkTicksToLive();

    if (p_creep.store.getFreeCapacity() == 0) {
      p_creep.memory.harvesting = false;
    }

    const creepFillPercentage = Math.round(p_creep.store.getUsedCapacity() / p_creep.store.getCapacity() * 100);
    p_creep.say('🚚 ' + creepFillPercentage + '%');

    if (p_creep.memory.harvesting == true) {
      let largestDroppedEnergy = _.last(p_creep.room.droppedResources()); // TODO Should target closest?

      if (largestDroppedEnergy && !p_creep.memory.targetedDroppedEnergy.id == 0) {
        p_creep.memory.targetedDroppedEnergy.id = largestDroppedEnergy.id;
        p_creep.memory.targetedDroppedEnergy.pos = largestDroppedEnergy.pos;
      }

      const targetedDroppedEnergy = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

      if (!targetedDroppedEnergy || !largestDroppedEnergy) {
        const newTarget = p_creep.room.droppedResources()[0];

        if (!newTarget) {
          return;
        }

        p_creep.memory.targetedDroppedEnergy.id = newTarget.id;
        p_creep.memory.targetedDroppedEnergy.pos = newTarget.pos;
      }

      const pickupResult = p_creep.pickup(targetedDroppedEnergy);

      if (pickupResult == ERR_NOT_IN_RANGE) {
        if (creepFillPercentage > 25) {
          p_creep.memory.harvesting = false;

          return;
        }

        if (p_creep.memory.targetedDroppedEnergy.id != largestDroppedEnergy.id) {
          // ...instead check the new target against the old and determine the closest.
          const targets = [{
              id: largestDroppedEnergy.id,
              pos: p_creep.room.getPositionAt(largestDroppedEnergy.pos.x, largestDroppedEnergy.pos.y)
            },
            {
              id: p_creep.memory.targetedDroppedEnergy.id,
              pos: p_creep.room.getPositionAt(p_creep.memory.targetedDroppedEnergy.pos.x, p_creep.memory.targetedDroppedEnergy.pos.y)
            }
          ];

          const inRangeTargets = p_creep.pos.findClosestByPath(targets.map(x => x.pos));

          if (!inRangeTargets) {
            console.log('⚠️ Warning: NO IN RANGE TARGETS FOUND');
            return;
          }

          let energyTarget = targets.find(x => x.pos.x == inRangeTargets.x && x.pos.y == inRangeTargets.y)

          if (energyTarget) {
            p_creep.memory.targetedDroppedEnergy = {
              id: energyTarget.id,
              pos: energyTarget.pos
            };
          }
        }

        const source = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

        if (source.energy < p_creep.store.getFreeCapacity()) {
          p_creep.memory.targetedDroppedEnergy = {
            id: largestDroppedEnergy.id,
            pos: largestDroppedEnergy.pos
          };
        }

        p_creep.moveTo(source, {
          visualizePathStyle: {
            stroke: '#ffaa00'
          }
        });
      } else if (pickupResult == OK) {
        p_creep.room.refreshDroppedResources();
      }
    } else {
      let targets = [];

      if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          targets.push(Game.spawns['Spawn1']);
      } else {
          targets = _.filter(p_creep.room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      } 

      if (targets.count == 0) {
          // They're not always returned in this order, is that a problem?
          targets = _.filter(p_creep.room.structures().all, (structure) => {
              return (
                      structure.structureType == STRUCTURE_TOWER ||
                      structure.structureType == STRUCTURE_CONTAINER ||
                      structure.structureType == STRUCTURE_STORAGE) &&
                  structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          });
      }

      if (targets.length > 0) {
          const target = p_creep.pos.findClosestByPath(targets)
          p_creep.memory.isHarvesting = false;

          const transferResult = p_creep.transfer(target, RESOURCE_ENERGY);
          if (transferResult == ERR_NOT_IN_RANGE) {
              p_creep.moveTo(target, {
                  visualizePathStyle: {
                      stroke: '#ffffff'
                  }
              });
          } else if (transferResult == ERR_NOT_ENOUGH_ENERGY) {
              p_creep.memory.isHarvesting = true;
          } else if (transferResult == OK && p_creep.store.getUsedCapacity() == 0) {
              p_creep.memory.isHarvesting = true;
          }
      }
      if (p_creep.store.getUsedCapacity() == 0) {
        p_creep.memory.harvesting = true;
      }
    }
  }
};

module.exports = roleHauler;