var creepFactory = {

    createJob: function (p_room, p_spawn, p_name, p_body, p_memory) {
        if (p_spawn.spawning) {
            if (p_name == p_spawn.spawning.name) {
                console.log('INFO: Creep of type \'' + p_name + '\' already being built');
                return;
            }
        }

        this.enqueueBuildJob(
            p_room,
            p_spawn, {
                body: p_body,
                name: p_name,
                memory: p_memory
            });
    },

    enqueueBuildJob: function (p_room, p_spawn, p_buildJob) {
        if (!p_room.memory._creepBuildQueue) {
            console.log('INFO: Creating creep build queue...');
            p_room.memory._creepBuildQueue = [];
        }

        console.log(p_room.memory._creepBuildQueue.length);

        // Temporarily only allow one queued creep job.
        if (p_room.memory._creepBuildQueue.length >= 1) {
            return;
        }

        p_room.memory._creepBuildQueue.push(p_buildJob);

        console.log('INFO: New creep build job added, ' + p_room.memory._creepBuildQueue.length + ' jobs queued');
    },

    processBuildQueue: function (p_room, p_spawn) {
        //console.log('DEBUG: p_room.memory._creepBuildQueue length=' + p_room.memory._creepBuildQueue.length)

        if (p_room.memory._creepBuildQueue.length == 0) {
            return;
        }

        var job = p_room.memory._creepBuildQueue[0];

        let name = job.name + Game.time;
        console.log('INFO: Spawning new ' + job.name + ' name=\'' + name + '\', body=[' + job.body + '], memory=' + JSON.stringify(job.memory));

        let result = p_spawn.spawnCreep(job.body, name, {
            memory: job.memory
        });

        if (result != OK) {
            console.log('⛔ Error: Failed to spawn new creep, error=' + SPAWN_CREEP_CODES[result]);
            return;
        }

        p_room.memory._creepBuildQueue.shift();
        console.log('INFO: Build queue has ' + p_room.memory._creepBuildQueue.length + ' jobs remaining');
    },

    showSpawningCreepInfo: function (p_room, p_spawn) {
        if (p_spawn.spawning) {
            let spawningCreep = Game.creeps[p_spawn.spawning.name];
            p_room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                p_spawn.pos.x + 1,
                p_spawn.pos.y, {
                    align: 'left',
                    opacity: 0.8
                });
        }
    }
};

SPAWN_CREEP_CODES = {
    '0': 'OK',
    '-1': 'ERR_NOT_OWNER',
    '-3': 'ERR_NAME_EXISTS',
    '-4': 'ERR_BUSY',
    '-6': 'ERR_NOT_ENOUGH_ENERGY',
    '-10': 'ERR_INVALID_ARGS',
    '-14': 'ERR_RCL_NOT_ENOUGH'
}

module.exports = creepFactory;