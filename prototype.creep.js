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
            console.log('TTD Creep: ' + this.name + ', dropping resource: ' + resourceType)
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
};