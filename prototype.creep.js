module.exports = function () {

    Creep.prototype.checkTicksToLive = function () {
        if (this.ticksToLive == 1) {
            this.dropResourcesAndDie();
        }
    };

    // Should be called once per tick and then the cached result should be used.
    Creep.prototype.checkTicksToDie = function () {
        if (this.memory.ticksToDie) {
            this.memory.ticksToDie -= 1;

            if (this.memory.ticksToDie < 1) {
                this.dropResourcesAndDie();
            }
        }
    };

    Creep.prototype.dropResources = function () {
        for (const resourceType in this.carry) {
            this.drop(resourceType);
        }
    };

    Creep.prototype.dropResourcesAndDie = function () {
        for (const resourceType in this.carry) {
            console.log('💀 TTD Creep: ' + this.name + ', dropping resource: ' + resourceType)
            this.drop(resourceType);
        }

        this.suicide();
    };

    Creep.prototype.findEnergyTransferTarget = function () {
        let targets = [];

        if (Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            targets.push(Game.spawns['Spawn1']);
        }
        if (targets.length == 0) {
            // Only refil the Tower if the fill percentage is < 20%.
            targets = _.filter(this.room.structures().tower, (structure) => Math.round(structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) * 100) < 80);
        }
        if (targets.length == 0) {
            targets = _.filter(this.room.structures().extension, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        }
        if (targets.length == 0) {
            targets = _.filter(this.room.structures().container, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        }
        if (targets.length == 0) {
            targets = _.filter(this.room.structures().storage, (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        }

        if (targets.length > 0) {
            const target = this.pos.findClosestByPath(targets)
            const transferResult = this.transfer(target, RESOURCE_ENERGY);

            if (transferResult == ERR_NOT_IN_RANGE) {
                this.moveTo(target, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }
        }

        return targets;
    };

    Creep.prototype.CreepFillPercentage = function () {
        return Math.round(this.store.getUsedCapacity() / this.store.getCapacity() * 100);
    };

};