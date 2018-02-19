let IOTA = require('iota.lib.js');
let Mam = require('mam.client.js/lib/mam.node');
var iota = new IOTA({ provider: 'http://nodes.iota.fm:80' })

// Init State
let root = 'EFZPN9XSQCNTT9JYEKXD9Y9RFYWFCPQXPNVORRJOWUCGP9BJQHLCLLFRWMJRHNIYALWSG9ZGAGBGQLRPT'

// Initialise MAM State
var mamState = Mam.init(iota)

// Callback used to pass data out of the fetch
const logData = data => console.log(JSON.parse(iota.utils.fromTrytes(data)))

const execute = async () => {
    // Callback used to pass data + returns next_root
    var resp = await Mam.fetch(root, 'public', null, logData)
    console.log(resp)
}

execute()