// ICONS ⛔ ⚠️ 🛠️ ➖ ❌ 💀

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

    module.exports.structure = {
        STRUCTURE_SPAWN: 'spawn',
        STRUCTURE_EXTENSION: 'extension',
        STRUCTURE_ROAD: 'road',
        STRUCTURE_WALL: 'constructedWall',
        STRUCTURE_RAMPART: 'rampart',
        STRUCTURE_KEEPER_LAIR: 'keeperLair',
        STRUCTURE_PORTAL: 'portal',
        STRUCTURE_CONTROLLER: 'controller',
        STRUCTURE_LINK: 'link',
        STRUCTURE_STORAGE: 'storage',
        STRUCTURE_TOWER: 'tower',
        STRUCTURE_OBSERVER: 'observer',
        STRUCTURE_POWER_BANK: 'powerBank',
        STRUCTURE_POWER_SPAWN: 'powerSpawn',
        STRUCTURE_EXTRACTOR: 'extractor',
        STRUCTURE_LAB: 'lab',
        STRUCTURE_TERMINAL: 'terminal',
        STRUCTURE_CONTAINER: 'container',
        STRUCTURE_NUKER: 'nuker',
        STRUCTURE_FACTORY: 'factory',
        STRUCTURE_INVADER_CORE: 'invaderCore',
    },

    module.exports.role = {
        HARVESTER: 'Harvester',
        DROPMINER: 'DropMiner',
        HAULER: 'Hauler',
        BUILDER: 'Builder',
        UPGRADER: 'Upgrader'
    },

    module.exports.global = {
        MAX_CREEP_BUILD_QUEUE_LENGTH: 1,
        TICKS_TO_DELETE: 200
    };