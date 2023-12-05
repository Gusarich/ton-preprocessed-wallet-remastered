import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {
    Cell,
    TransactionComputePhase,
    TransactionComputeVm,
    TransactionDescriptionGeneric,
    beginCell,
    toNano,
} from '@ton/core';
import { Wallet, walletCode } from './wallet';
import '@ton/test-utils';
import { KeyPair, getSecureRandomBytes, keyPairFromSeed } from '@ton/crypto';
import { randomAddress } from '@ton/test-utils';

describe('Flooder', () => {
    let blockchain: Blockchain;
    let wallet: SandboxContract<Wallet>;
    let keypair: KeyPair;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        keypair = keyPairFromSeed(await getSecureRandomBytes(32));

        wallet = blockchain.openContract(
            Wallet.createFromPublicKey(keypair.publicKey)
        );

        deployer = await blockchain.treasury('deployer');

        await deployer.send({
            to: wallet.address,
            value: toNano('0.05'),
            bounce: false,
        });
        const deployResult = await wallet.sendTransfers(keypair, [
            {
                recipient: deployer.address,
                value: 0n,
            },
        ]);
        expect(deployResult.transactions).toHaveTransaction({
            on: wallet.address,
            success: true,
            deploy: true,
        });
    });

    it('should deploy', async () => {});

    it('should accept internal messages', async () => {
        const result = await deployer.send({
            to: wallet.address,
            value: toNano('1'),
        });
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: wallet.address,
            success: true,
        });
    });

    it('should retrieve correct pubkey and seqno', async () => {
        expect(await wallet.getPublicKey()).toEqual(keypair.publicKey);
        expect(await wallet.getSeqno()).toEqual(1n);
    });

    it('should send simple transfers', async () => {
        const addr = randomAddress();
        let result = await wallet.sendTransfers(keypair, [
            { recipient: addr, value: toNano('0.01') },
        ]);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.01'),
        });

        console.log(
            `Gas consumption: ${
                (
                    (
                        result.transactions[0]
                            .description as TransactionDescriptionGeneric
                    ).computePhase as TransactionComputeVm
                ).gasUsed
            }`
        );

        result = await wallet.sendTransfers(keypair, [
            {
                recipient: addr,
                value: toNano('0.015'),
                body: beginCell()
                    .storeUint(0, 32)
                    .storeStringTail('Hello, world!')
                    .endCell(),
            },
        ]);
        expect(result.transactions).toHaveTransaction({
            from: wallet.address,
            to: addr,
            value: toNano('0.015'),
            body: beginCell()
                .storeUint(0, 32)
                .storeStringTail('Hello, world!')
                .endCell(),
        });
    });

    it('should send several messages', async () => {
        let messages = [];
        for (let i = 0; i < 10; i++) {
            messages.push({
                recipient: randomAddress(),
                value: toNano('0.001'),
            });
        }
        let result = await wallet.sendTransfers(keypair, messages);
        for (const msg of messages) {
            expect(result.transactions).toHaveTransaction({
                from: wallet.address,
                to: msg.recipient,
                value: msg.value,
            });
        }
    });

    it('should update code', async () => {
        let result = await wallet.sendSetCode(keypair, walletCode);
        expect(result.transactions).toHaveTransaction({
            on: wallet.address,
            success: true,
        });

        result = await wallet.sendSetCode(keypair, Cell.EMPTY);
        expect(result.transactions).toHaveTransaction({
            on: wallet.address,
            success: true,
        });
    });
});
