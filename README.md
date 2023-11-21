# inDEX JavaScript SDK

## Getting Started

```sh
npm install @phala/index
```

```javascript
import {Client} from '@phala/index'
const client = new Client()
await client.isReady
```

### EVM Chain

```javascript
import {Wallet, ethers} from 'ethers'

const privateKey = '0x…'
const wallet = new Wallet(privateKey)
const recipient = '0x…'
const solution = [
  // JSON solution
]

const moonbeam = client.createEvmChain('Moonbeam')
const asset = ASSETS.Moonbeam.WGLMR
const amount = ethers.parseEther('1')
const simulateResults = await client.simulateSolution(solution, recipient)
const approvalTx = await moonbeam.getApproval(asset, wallet.address, amount)
if (approvalTx) {
  await wallet.signTransaction(approvalTx)
}
const deposit = await moonbeam.getDeposit(asset, amount, recipient, solution)
const tx = await wallet.sendTransaction(deposit.tx)
const task = await client.getTask(deposit.id)
```

### Substrate Chain

```javascript
import Keyring from '@polkadot/keyring'

const mnemonic = 'mnemonic'
const recipient = '0x…'
const keyring = new Keyring({type: 'sr25519'})
const pair = keyring.addFromUri(mnemonic)
const solution = [
  // JSON solution
]

const simulateResults = await client.simulateSolution(solution, recipient)
const phala = client.createPhalaChain('Phala')
await phala.isReady // necessary for substrate chains
const deposit = await phala.getDeposit(
  ASSETS.Phala.PHA,
  1_000_000_000_000n,
  recipient,
  solution
)
const txHash = await deposit.tx.signAndSend(pair)
const task = await client.getTask(deposit.id)
```
