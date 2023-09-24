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
            console.log("💀 TTD Creep: " + this.name + ", dropping resource: " + resourceType
            );
            this.drop(resourceType);
        }

        this.suicide();
    };

    Creep.prototype.findEnergyTransferTarget = function () {
        let targets = [];

        if (Game.spawns["Spawn1"].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            targets.push(Game.spawns["Spawn1"]);
        }
        if (targets.length == 0) {
            targets = _.filter(
                this.room.structures().storage,
                (structure) =>
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }
        // It gets into a state where the Tower is consuming more energy than can be supplied, creating a feedback loop
        // where creeps die and structures decay.
        if (targets.length == 0 && this.room.creeps().dropminers.length > 1) {
            // Only refill the Tower if the fill percentage is < 20%.
            targets = _.filter(
                this.room.structures().tower,
                (structure) =>
                    Math.round(
                        (structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY)) * 100) < 80
            );
        }
        if (targets.length == 0) {
            targets = _.filter(
                this.room.structures().extension,
                (structure) =>
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }
        if (targets.length == 0) {
            targets = _.filter(
                this.room.structures().storage,
                (structure) =>
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }
        if (targets.length == 0) {
            targets = _.filter(
                this.room.structures().container,
                (structure) =>
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }

        if (targets.length > 0) {
            let target = this.pos.findClosestByPath(targets);
            if (target == null) {
                target = this.pos.findClosestByRange(targets);
            }

            const transferResult = this.transfer(target, RESOURCE_ENERGY);

            switch (transferResult) {
                case ERR_INVALID_TARGET:
                case ERR_NOT_IN_RANGE: {
                    const moveResult = this.moveTo(target, {
                        visualizePathStyle: {
                            stroke: "#ffffff",
                        },
                    });

                    break;
                }
            }

            if (transferResult == ERR_NOT_IN_RANGE) {
            }
        }

        return targets;
    };

    Creep.prototype.CreepFillPercentage = function () {
        return Math.round((this.store.getUsedCapacity() / this.store.getCapacity()) * 100
        );
    };
};
