const BODYPART_COST = {
    "move": 50,
    "work": 100,
    "attack": 80,
    "carry": 50,
    "heal": 250,
    "ranged_attack": 150,
    "tough": 10,
    "claim": 600
};

const {
    EXIT_CODE,
    global
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

    validateCache: function (p_room) {
        if (!p_room.memory._creepBuildQueue) {
            console.log('INFO: Creating creep build queue...');
            p_room.memory._creepBuildQueue = [];
        }
    },

    enqueueBuildJob: function (p_room, p_spawn, p_buildJob) {
        this.validateCache(p_room);

        // Temporarily only allow one queued creep job.
        if (p_room.memory._creepBuildQueue.length >= global.MAX_CREEP_BUILD_QUEUE_LENGTH) {
            return;
        }

        p_room.memory._creepBuildQueue.push(p_buildJob);
        console.log('INFO: New creep build job added, ' + p_room.memory._creepBuildQueue.length + ' jobs queued');
    },

    processBuildQueue: function (p_room, p_spawn) {
        if (p_spawn.spawning) {
            return;
        }

        this.validateCache(p_room);

        if (p_room.memory._creepBuildQueue.length == 0) {
            return;
        }

        const job = p_room.memory._creepBuildQueue[0];
        const name = job.name + Game.time;

        const bodyCost = this.bodyCost(job.body);

        if (bodyCost > p_room.energyAvailable) {
            return;
        }

        console.log('INFO: Spawning new ' + job.name + ' name=\'' + name + '\', body=[' + job.body + '], memory=' + JSON.stringify(job.memory), +', cost=' + bodyCost);

        let result = p_spawn.spawnCreep(job.body, name, {
            memory: job.memory
        });

        if (result != OK) {
            console.log('⛔ Error: Failed to spawn new creep, error=' + EXIT_CODE[result]);
            return;
        }

        p_room.memory._creepBuildQueue.shift();
        // this.logBuildQueueDetails();
    },

    logBuildQueueDetails: function (p_room) {
        if (p_room.memory._creepBuildQueue.length == 0) {
            return;
        }

        const job = p_room.memory._creepBuildQueue[0];
        console.log('INFO: Build queue has ' + p_room.memory._creepBuildQueue.length + '/' + global.MAX_CREEP_BUILD_QUEUE_LENGTH + ' jobs remaining ' + '(' + job.name +')');
    },

    showSpawningCreepInfo: function (p_room, p_spawn) {
        if (p_spawn.spawning) {
            let spawningCreep = Game.creeps[p_spawn.spawning.name];

            if (_.isEmpty(spawningCreep.memory)) {
                console.log('⛔ Error: New creep job contains no \'memory\' object!');
                return;
            }

            p_room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                p_spawn.pos.x + 1,
                p_spawn.pos.y, {
                    align: 'left',
                    opacity: 0.8
                });
        }
    },

    bodyCost: function (p_body) {
        let sum = 0;

        for (let i in p_body) {
            sum += BODYPART_COST[p_body[i]];
        }

        return sum;
    },

    clearBuildQueue: function (p_room) {
        console.log('⚠️ Warning: Clearing creep build queue');
        p_room.memory._creepBuildQueue = [];
    },
};

module.exports = creepFactory;