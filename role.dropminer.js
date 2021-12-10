var roleDropMiner = {

    createMiner: function (p_room, p_spawn, p_name, p_body, p_sourceId) {
        let name = p_name + Game.time;
        console.log('Spawning new DROPMINER: ' + name + ', [' + p_body + '], sourceId: ' + p_sourceId);

        p_spawn.spawnCreep(
            p_body,
            name, {
                memory: {
                    role: 'dropminer',
                    sourceId: p_sourceId
                }
            });
    },

    /** @param {Creep} creep **/
    harvest: function (p_creep) {
        let source = Game.getObjectById(p_creep.memory.sourceId);

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
