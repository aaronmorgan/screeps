// ICONS ⛔ ⚠️ 🛠️ ➖ ❌

module.exports.EXIT_CODE = {
        '0': 'OK',
        '-1': 'ERR_NOT_OWNER',
        '-3': 'ERR_NAME_EXISTS',
        '-4': 'ERR_BUSY',
        '-6': 'ERR_NOT_ENOUGH_ENERGY',
        '-7': 'ERR_INVALID_TARGET',
        '-8': 'ERR_FULL',
        '-9': 'ERR_NOT_IN_RANGE	',
        '-10': 'ERR_INVALID_ARGS',
        '-11': 'ERR_TIRED',
        '-12': 'ERR_NO_BODYPART',
        '-14': 'ERR_RCL_NOT_ENOUGH'
    },

    module.exports.role = {
        HARVESTER: 'Harvester',
        DROPMINER: 'DropMiner',
        HAULER: 'Hauler',
        BUILDER: 'Builder',
        UPGRADER: 'Upgrader'
    },

    module.exports.global = {
        MAX_CREEP_BUILD_QUEUE_LENGTH: 1
    };