module.exports = function () {

    Creep.prototype.checkTicksToLive = function () {
        if (this.ticksToLive == 1) {
            console.log('💀 INFO: Creep: ' + this.name + ', ticksToLive=' + this.ticksToLive + ', dropping resources...')

            for (const resourceType in this.carry) {
                this.drop(resourceType);
            }
        }
    };

    // Should be called once per tick and then the cached result should be used.
    Creep.prototype.checkTicksToDie = function () {
        if (this.memory.ticksToDie) {
            this.memory.ticksToDie -= 1;

            if (this.memory.ticksToDie < 1) {
                console.log('💀 Removing ' + this.memory.role + ' creep ' + this.id)

                for (const resourceType in this.store) {
                    this.drop(resourceType);
                }

                this.suicide();
            }
        }
    };
};