module.exports = function () {

    // Should be called once per tick and then the cached result should be used.
    Creep.prototype.checkTicksToDie = function () {
        if (this.memory.ticksToDie) {
            this.memory.ticksToDie -= 1;

            if (this.memory.ticksToDie <= 0) {
                console.log('💀 Removing ' + this.memory.role + ' creep ' + this.id)

                // Drop all resources.
                for (const resourceType in this.carry) {
                    this.drop(resourceType);
                }

                this.suicide();
            }
        }
    };
};