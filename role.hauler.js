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
      //let largestDroppedEnergy = _.last(p_creep.room.droppedResources()); // TODO Should target closest?
      let droppedEnergyTarget = p_creep.pos.findClosestByPath(p_creep.room.droppedResources());

      if (!droppedEnergyTarget) {
        return;
      }

      // TODO needs to then evaluate if the closest is the largest...
      if (p_creep.memory.targetedDroppedEnergy.id == 0) {
        p_creep.memory.targetedDroppedEnergy.id = droppedEnergyTarget.id;
        p_creep.memory.targetedDroppedEnergy.pos = droppedEnergyTarget.pos;
      }

      const targetedDroppedEnergy = Game.getObjectById(p_creep.memory.targetedDroppedEnergy.id);

      if (!targetedDroppedEnergy || !droppedEnergyTarget) {
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
          this.resetHarvesting(p_creep);

          return;
        }

        if (p_creep.memory.targetedDroppedEnergy.id != droppedEnergyTarget.id) {
          // ...instead check the new target against the old and determine the closest.
          const targets = [{
              id: droppedEnergyTarget.id,
              pos: p_creep.room.getPositionAt(droppedEnergyTarget.pos.x, droppedEnergyTarget.pos.y)
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
            id: droppedEnergyTarget.id,
            pos: droppedEnergyTarget.pos
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
      }
      if (targets.length == 0) {
        targets = _.filter(p_creep.room.structures().tower, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      }
      if (targets.length == 0) {
        targets = _.filter(p_creep.room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      }
      if (targets.length == 0) {
        targets = _.filter(p_creep.room.structures().container, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      }
      if (targets.length == 0) {
        targets = _.filter(p_creep.room.structures().storage, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
      }

      if (targets.length > 0) {
        const target = p_creep.pos.findClosestByPath(targets)
        this.resetHarvesting(p_creep);

        const transferResult = p_creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
          p_creep.moveTo(target, {
            visualizePathStyle: {
              stroke: '#ffffff'
            }
          });
        } else if (transferResult == ERR_NOT_ENOUGH_ENERGY) {
          p_creep.memory.harvesting = true;
        } else if (transferResult == OK && p_creep.store.getUsedCapacity() == 0) {
          p_creep.memory.harvesting = true;
        }
      }
      if (p_creep.store.getUsedCapacity() == 0) {
        p_creep.memory.harvesting = true;
      }
    }
  },

  resetHarvesting: function (p_creep) {
    p_creep.memory.harvesting = false;

    p_creep.memory.targetedDroppedEnergy = {
      id: 0,
      pos: undefined
    };
  }
};

module.exports = roleHauler;