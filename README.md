# inDEX JavaScript SDK

```sh
npm install @phala/index
```

## Getting Started

```javascript
const executor = new Executor()
await executor.isReady
```

### EVM Chain

```javascript
const privateKey = '0x…'
const wallet = new Wallet(privateKey)
const recipient = '0x…'
const solution = [
  // JSON solution
]

const moonbeam = executor.createEvmChain('Moonbeam')
const asset = ASSETS.Moonbeam.WGLMR
const amount = ethers.parseEther('1')
const approvalTx = await moonbeam.getApproval(asset, wallet.address, amount)
if (approvalTx) {
  await wallet.signTransaction(approvalTx)
}
const deposit = await moonbeam.getDeposit(asset, amount, recipient, solution)
const txHash = await wallet.signTransaction(deposit.tx)
const task = await executor.getTask(deposit.id)
```

### Substrate Chain

```javascript
const mnemonic = 'mnemonic'
const recipient = '0x…'
const keyring = new Keyring({type: 'sr25519'})
const pair = keyring.addFromUri(mnemonic)
const solution = [
  // JSON solution
]

const phala = executor.createPhalaChain('Phala')
await phala.isReady
const deposit = await phala.getDeposit(
  ASSETS.Phala.PHA,
  1_000_000_000_000n,
  recipient,
  solution
)
const txHash = await deposit.tx.signAndSend(pair)
const task = await executor.getTask(deposit.id)
```
