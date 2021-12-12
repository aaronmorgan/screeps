module.exports.EXIT_CODES = {
    '0': 'OK',
    '-1': 'ERR_NOT_OWNER',
    '-3': 'ERR_NAME_EXISTS',
    '-4': 'ERR_BUSY',
    '-6': 'ERR_NOT_ENOUGH_ENERGY',
    '-7': 'ERR_INVALID_TARGET',
    '-8': 'ERR_FULL',
    '-10': 'ERR_INVALID_ARGS',
    '-14': 'ERR_RCL_NOT_ENOUGH'
},

module.exports.role = {
    HARVESTER: 'Harvester',
    DROPMINER: 'DropMiner',
    HAULER: 'Hauler',
    BUILDER: 'Builder',
    UPGRADER: 'Upgrader'
};
