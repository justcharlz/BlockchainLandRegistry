const { proxyOwner, implementation } = require("./getterProxy")

const { _upgradeTo, transferProxyOwnership } = require("./setterProxy")

module.exports = { proxyOwner, implementation, upgradeTo, transferProxyOwnership
}