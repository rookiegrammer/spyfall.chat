global.sck = {}
global.handle = {}
global.fn = {}

/****************************
 * GLOBAL APP CONFIGURATION
 ****************************/
// Main Config Variables
global.config = {}
global.config.db = 'mongodb://localhost:27017/spyfall_chat'
global.config.server_name = 'Deo\'s Server'

// Easy Config Variables
global.config.app_port = 3000
global.config.session_secret = '$p13f@11'
global.config.consensus_percent = 0.5

// Heavy Config Variables
global.config.discovery_port = 4779
global.config.discovery_cast_addr = '233.177.192.255'

global.config.salt_rounds = 10;
