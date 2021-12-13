var {
    EXIT_CODE
} = require('game.constants');

var creepFactory = {

    create: function (p_room, p_spawn, p_role, p_body, p_memory) {
        if (p_spawn.spawning) {
            if (p_role == p_spawn.spawning.name) {
                console.log('INFO: Creep of type \'' + p_role + '\' already being built');
                return;
            }
        }

        this.enqueueBuildJob(
            p_room,
            p_spawn, {
                body: p_body,
                name: p_role,
                memory: p_memory
            });
    },

    validateCache: function(p_room) {
        if (!p_room.memory._creepBuildQueue) {
            console.log('INFO: Creating creep build queue...');
            p_room.memory._creepBuildQueue = [];
        }
    },

    enqueueBuildJob: function (p_room, p_spawn, p_buildJob) {
        this.validateCache(p_room);

        if (!Memory.creeps) {
            console.log('⛔ Error: WTF?');

            Memory.creeps = {};
        }

        console.log('p_room.memory._creepBuildQueue', JSON.stringify(p_room.memory._creepBuildQueue));

        // Temporarily only allow one queued creep job.
        if (p_room.memory._creepBuildQueue.length >= 1) {
            return;
        }

        p_room.memory._creepBuildQueue.push(p_buildJob);
        console.log('p_room.memory._creepBuildQueue', JSON.stringify(p_room.memory._creepBuildQueue));

        console.log('INFO: New creep build job added, ' + p_room.memory._creepBuildQueue.length + ' jobs queued');
    },

    processBuildQueue: function (p_room, p_spawn) {
        this.validateCache(p_room);
        //console.log('DEBUG: p_room.memory._creepBuildQueue length=' + p_room.memory._creepBuildQueue.length)

        if (p_room.memory._creepBuildQueue.length == 0) {
            return;
        }

        var job = p_room.memory._creepBuildQueue[0];

        console.log('p_room.memory._creepBuildQueue', JSON.stringify(p_room.memory._creepBuildQueue));
        console.log('job to enqueue: ', JSON.stringify(job));

        let name = job.name + Game.time;
        console.log('INFO: Spawning new ' + job.name + ' name=\'' + name + '\', body=[' + job.body + '], memory=' + JSON.stringify(job.memory));

        let result = p_spawn.spawnCreep(job.body, name, {
            memory: job.memory
        });

        if (result != OK) {
            console.log('⛔ Error: Failed to spawn new creep, error=' + EXIT_CODE[result]);
            return;
        }

        p_room.memory._creepBuildQueue.shift();
        console.log('INFO: Build queue has ' + p_room.memory._creepBuildQueue.length + ' jobs remaining');
    },

    showSpawningCreepInfo: function (p_room, p_spawn) {
        if (p_spawn.spawning) {
            console.log('p_spawn.spawning.name', p_spawn.spawning.name);

            let spawningCreep = Game.creeps[p_spawn.spawning.name];

            if (_.isEmpty(spawningCreep.memory)) {
                console.log('⛔ Error: New creep job contains no \'memory\' object!');
                return;
            }

            console.log('spawningCreep.memory', JSON.stringify(spawningCreep.memory));

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

module.exports = creepFactory;