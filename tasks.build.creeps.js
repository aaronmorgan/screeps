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
        this.enqueueBuildJob(
            p_room,
            p_spawn, {
                body: p_body,
                name: p_role,
                memory: p_memory
            });

        return OK;
    },

    validateCache: function (p_room) {
        if (!p_room.memory.creepBuildQueue) {
            this.clearBuildQueue(p_room);
        }
    },

    enqueueBuildJob: function (p_room, p_spawn, p_buildJob) {
        this.validateCache(p_room);

        if (p_room.memory.creepBuildQueue.queue.length >= global.MAX_CREEP_BUILD_QUEUE_LENGTH) {
            return;
        }

        // This may not actually be catching the edge case it was meant to.
        // if (p_spawn.spawning && p_room.memory.creepBuildQueue.queue[0].body.name == p_buildJob.name) {
        //     console.log('⚠️ WARNING: Discarding build job because creep type ' + p_buildJob.name + ' is already queued');
        //     return;
        // }

        p_room.memory.creepBuildQueue.queue.push(p_buildJob);
        //console.log('INFO: New creep build job added, ' + p_room.memory.creepBuildQueue.queue.length + ' jobs queued');
    },

    processBuildQueue: function (p_room, p_spawn) {
        if (p_spawn.spawning) {
            return;
        }

        this.validateCache(p_room);

        if (p_room.memory.creepBuildQueue.queue.length == 0) {
            return;
        }

        const job = p_room.memory.creepBuildQueue.queue[0];
        const name = job.name + '_' + p_room.name + '_' + Game.time;

        const bodyCost = this.bodyCost(job.body);

        if (bodyCost > p_room.energyAvailable) {
            return;
        }

        //console.log('INFO: Spawning new ' + job.name + ' name=\'' + name + '\', body=[' + job.body + '], memory=' + JSON.stringify(job.memory), +', cost=' + bodyCost);

        const result = p_spawn.spawnCreep(job.body, name, {
            memory: job.memory
        });

        if (result != OK) {
            console.log('⛔ Error: Failed to spawn new creep, error=' + EXIT_CODE[result]);
            return;
        }

        p_room.memory.creepBuildQueue.queue.shift();
    },

    evaluateBuildQueue: function (p_room) {
        if (p_room.memory.creepBuildQueue.queue.length == 0) {
            return;
        }

        const job = p_room.memory.creepBuildQueue.queue[0];

        this.logBuildQueueDetails(p_room, job);

        var buildCost = this.bodyCost(job.body);

        if (buildCost > p_room.energyCapacityAvailable) {
            p_room.memory.creepBuildQueue.queue.shift();
        }
    },

    logBuildQueueDetails: function (p_room, p_job) {
        console.log(
            '  Build Queue: ' + p_room.memory.creepBuildQueue.queue.length + '/' + global.MAX_CREEP_BUILD_QUEUE_LENGTH +
            ' (' + p_job.name + '|' + this.bodyCost(p_job.body) + ')');
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
        if (p_room.memory.creepBuildQueue.length > 0) {
            console.log('⚠️ Warning: Clearing creep build queue');

            p_room.memory.creepBuildQueue = {
                queue: []
            }
        }
    },
};

module.exports = creepFactory;