/*
 * Uses ethereumjs-tx to sign a transaction.
 *
 * The two callbacks a user needs to implement are:
 * - getAccounts() -- array of addresses supported
 * - getPrivateKey(address) -- return private key for a given address
 *
 * Optionally approveTransaction(), approveMessage() can be supplied too.
 */

import {inherits} from 'util';
import HookedWalletProvider from './hooked-wallet.js';
import EthTx from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';
import sigUtil from 'eth-sig-util';

inherits(HookedWalletEthTxSubprovider, HookedWalletProvider)

function HookedWalletEthTxSubprovider(opts) {
  const self = this

  HookedWalletEthTxSubprovider.super_.call(self, opts)

  self.signTransaction = function(txData, cb) {
    // defaults
    if (txData.gas !== undefined) txData.gasLimit = txData.gas
    txData.value = txData.value || '0x00'
    txData.data = ethUtil.addHexPrefix(txData.data)

    opts.getPrivateKey(txData.from, function(err, privateKey) {
      if (err) return cb(err)

      var tx = new EthTx(txData)
      tx.sign(privateKey)
      cb(null, '0x' + tx.serialize().toString('hex'))
    })
  }

  self.signMessage = function(msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)
      var msgHash = ethUtil.sha3(msgParams.data)
      var sig = ethUtil.ecsign(msgHash, privateKey)
      var serialized = ethUtil.bufferToHex(concatSig(sig.v, sig.r, sig.s))
      cb(null, serialized)
    })
  }

  self.signPersonalMessage = function(msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)
      const serialized = sigUtil.personalSign(privateKey, msgParams)
      cb(null, serialized)
    })
  }

  self.signTypedMessage = function (msgParams, cb) {
    opts.getPrivateKey(msgParams.from, function(err, privateKey) {
      if (err) return cb(err)
      const serialized = sigUtil.signTypedData(privateKey, msgParams)
      cb(null, serialized)
    })
  }

}

function concatSig(v, r, s) {
  r = ethUtil.fromSigned(r)
  s = ethUtil.fromSigned(s)
  v = ethUtil.bufferToInt(v)
  r = ethUtil.toUnsigned(r).toString('hex')
  s = ethUtil.toUnsigned(s).toString('hex')
  v = ethUtil.stripHexPrefix(ethUtil.intToHex(v))
  return ethUtil.addHexPrefix(r.concat(s, v).toString("hex"))
}

export default HookedWalletEthTxSubprovider;
