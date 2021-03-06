import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TokenTracker from 'eth-token-tracker'

export default function withTokenTracker (WrappedComponent) {
  return class TokenTrackerWrappedComponent extends Component {
    static propTypes = {
      userAddress: PropTypes.string.isRequired,
      token: PropTypes.object.isRequired,
    }

    state = {
      string: '',
      symbol: '',
      balance: '',
      error: null,
    }

    tracker = null

    componentDidMount () {
      this.createFreshTokenTracker()
    }

    componentDidUpdate (prevProps) {
      const { userAddress: newAddress, token: { address: newTokenAddress } } = this.props
      const { userAddress: oldAddress, token: { address: oldTokenAddress } } = prevProps

      if ((oldAddress === newAddress) && (oldTokenAddress === newTokenAddress)) {
        return
      }

      if ((!oldAddress || !newAddress) && (!oldTokenAddress || !newTokenAddress)) {
        return
      }

      this.createFreshTokenTracker()
    }

    componentWillUnmount () {
      this.removeListeners()
    }

    createFreshTokenTracker () {
      this.removeListeners()

      if (!global.ethereumProvider) {
        return
      }

      const { userAddress, token } = this.props

      this.tracker = new TokenTracker({
        userAddress,
        provider: global.ethereumProvider,
        tokens: [token],
        pollingInterval: 8000,
      })

      this.tracker.on('update', this.updateBalance)
      this.tracker.on('error', this.setError)

      this.tracker.updateBalances()
        .then(() => this.updateBalance(this.tracker.serialize()))
        .catch((error) => this.setState({ error: error.message }))
    }

    setError = (error) => {
      this.setState({ error })
    }

    updateBalance = (tokens = []) => {
      if (!this.tracker.running) {
        return
      }
      const [{ string, symbol, balance }] = tokens
      this.setState({ string, symbol, error: null, balance })
    }

    removeListeners () {
      if (this.tracker) {
        this.tracker.stop()
        this.tracker.removeListener('update', this.updateBalance)
        this.tracker.removeListener('error', this.setError)
      }
    }

    render () {
      const { balance, string, symbol, error } = this.state
      return (
        <WrappedComponent
          { ...this.props }
          string={string}
          symbol={symbol}
          tokenTrackerBalance={balance}
          error={error}
        />
      )
    }
  }
}
