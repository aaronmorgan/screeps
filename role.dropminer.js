var roleDropMiner = {

    /** @param {Creep} creep **/
    run: function (p_creep) {
        const source = Game.getObjectById(p_creep.memory.sourceId);

        if (p_creep.harvest(source) == ERR_NOT_IN_RANGE) {
            p_creep.say('⛏ harvest');
            p_creep.moveTo(source, {
                visualizePathStyle: {
                    stroke: '#ffaa00'
                }
            });

            return p_creep.harvest(source);
        }
    }
};

module.exports = roleDropMiner;