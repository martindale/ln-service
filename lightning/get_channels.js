const asyncAuto = require('async/auto');
const asyncMap = require('async/map');

const {returnResult} = require('./../async-util');

const intBase = 10;

/** Get channels

  {
    lnd: {listChannels: <Function>}
  }

  @returns via cbk
  {
    channels: [{
      capacity: <Channel Token Capacity Number>
      commit_transaction_fee: <Commit Transaction Fee Number>
      commit_transaction_weight: <Commit Transaction Weight Number>
      id: <Channel Id String>
      is_active: <Channel Active Bool>
      is_closing: <Channel Closing Bool>
      is_opening: <Channel Opening Bool>
      local_balance: <Local Balance Satoshis Number>
      partner_public_key: <Channel Partner Public Key String>
      received: <Received Satoshis Number>
      remote_balance: <Remote Balance Satoshis Number>
      sent: <Sent Satoshis Number>
      transaction_id: <Blockchain Transaction Id>
      transaction_vout: <Blockchain Transaction Vout Number>
      transfers_count: <Channel Transfers Total Number>
      unsettled_balance: <Unsettled Balance Satoshis Number>
    }]
  }
*/
module.exports = ({lnd}, cbk) => {
  return asyncAuto({
    // Check arguments
    validate: cbk => {
      if (!lnd || !lnd.listChannels) {
        return cbk([500, 'ExpectedLnd']);
      }

      return cbk();
    },

    // Get channels
    getChannels: ['validate', (_, cbk) => {
      return lnd.listChannels({}, (err, res) => {
        if (!!err) {
          return cbk([503, 'GetChannelsErr', err, res]);
        }

        if (!res || !Array.isArray(res.channels)) {
          return cbk([503, 'ExpectedChannelsArray', res]);
        }

        return cbk(null, res.channels);
      });
    }],

    mappedChannels: ['getChannels', ({getChannels}, cbk) => {
      return asyncMap(getChannels, (channel, cbk) => {
        if (!Array.isArray(channel.pending_htlcs)) {
          return cbk([503, 'ExpectedPendingHtlcs', channel]);
        }

        if (channel.active === undefined) {
          return cbk([503, 'ExpectedChannelActiveState', channel]);
        }

        if (!channel.remote_pubkey) {
          return cbk([503, 'ExpectedRemotePubkey', channel]);
        }

        if (!channel.channel_point) {
          return cbk([503, 'ExpectedChannelPoint', channel]);
        }

        if (!channel.chan_id) {
          return cbk([503, 'ExpectedChanId', channel]);
        }

        if (channel.capacity === undefined) {
          return cbk([503, 'ExpectedChannelCapacity', channel]);
        }

        if (channel.local_balance === undefined) {
          return cbk([503, 'ExpectedLocalBalance', channel]);
        }

        if (channel.remote_balance === undefined) {
          return cbk([503, 'ExpectedRemoteBalance', channel]);
        }

        if (channel.commit_fee === undefined) {
          return cbk([503, 'ExpectedCommitFee', channel]);
        }

        if (channel.commit_weight === undefined) {
          return cbk([503, 'ExpectedCommitWeight', channel]);
        }

        if (channel.fee_per_kw === undefined) {
          return cbk([503, 'ExpectedFeePerKw', channel]);
        }

        if (channel.unsettled_balance === undefined) {
          return cbk([503, 'ExpectedUnsettledBalance', channel]);
        }

        if (channel.total_satoshis_sent === undefined) {
          return cbk([503, 'ExpectedTotalSatoshisSent', channel]);
        }

        if (channel.total_satoshis_received === undefined) {
          return cbk([503, 'ExpectedTotalSatoshisReceived', channel]);
        }

        if (channel.num_updates === undefined) {
          return cbk([503, 'ExpectedNumUpdates', channel]);
        }

        const [transactionId, vout] = channel.channel_point.split(':');

        return cbk(null, {
          capacity: parseInt(channel.capacity, intBase),
          commit_transaction_fee: parseInt(channel.commit_fee, intBase),
          commit_transaction_weight: parseInt(channel.commit_weight, intBase),
          id: channel.chan_id,
          is_active: channel.active,
          is_closing: false,
          is_opening: false,
          local_balance: parseInt(channel.local_balance, intBase),
          partner_public_key: channel.remote_pubkey,
          received: parseInt(channel.total_satoshis_received, intBase),
          remote_balance: parseInt(channel.remote_balance, intBase),
          sent: parseInt(channel.total_satoshis_sent, intBase),
          transaction_id: transactionId,
          transaction_vout: parseInt(vout, intBase),
          transfers_count: parseInt(channel.num_updates, intBase),
          unsettled_balance: parseInt(channel.unsettled_balance, intBase),
        });
      },
      cbk);
    }],

    channels: ['mappedChannels', ({mappedChannels}, cbk) => {
      return cbk(null, {channels: mappedChannels});
    }],
  },
  returnResult({of: 'channels'}, cbk));
};

