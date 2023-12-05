import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    SendMode,
    Slice,
    StateInit,
    storeStateInit,
} from '@ton/core';
import { KeyPair, sign } from '@ton/crypto';

type MessageToSend = {
    recipient: Address;
    value: bigint;
    init?: StateInit;
    body?: Cell;
};

export const walletCode = Cell.fromBoc(
    Buffer.from(
        'B5EE9C72010101010022000040DDD40120F90059D0D4D4ED44D0C705DD20D0D70BFF4430F910DDF800ED54ED55',
        'hex'
    )
)[0];

function formSendMsgAction(msg: MessageToSend, mode: number): Slice {
    let b = beginCell()
        .storeUint(0x18, 6)
        .storeAddress(msg.recipient)
        .storeCoins(msg.value)
        .storeUint(0, 105);
    if (msg.init) {
        b.storeUint(3, 2);
        b.storeRef(beginCell().store(storeStateInit(msg.init)).endCell());
    } else {
        b.storeUint(0, 1);
    }
    if (msg.body) {
        b.storeUint(1, 1);
        b.storeRef(msg.body);
    } else {
        b.storeUint(0, 1);
    }
    return beginCell()
        .storeUint(0x0ec3c86d, 32)
        .storeUint(mode, 8)
        .storeRef(b.endCell())
        .endCell()
        .asSlice();
}

function formSetCodeAction(code: Cell): Slice {
    return beginCell()
        .storeUint(0xad4de08e, 32)
        .storeRef(code)
        .endCell()
        .asSlice();
}

export class Wallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new Wallet(address);
    }

    static createFromPublicKey(publicKey: Buffer, workchain = 0) {
        const data = beginCell()
            .storeBuffer(publicKey, 32)
            .storeUint(0, 16)
            .endCell();
        const init = { code: walletCode, data };
        return new Wallet(contractAddress(workchain, init), init);
    }

    private async sendActions(
        provider: ContractProvider,
        actions: Slice[],
        keypair: KeyPair
    ) {
        let actionsCell = Cell.EMPTY;
        for (const action of actions) {
            actionsCell = beginCell()
                .storeRef(actionsCell)
                .storeSlice(action)
                .endCell();
        }

        const chainData: Cell | undefined = await this.getData(provider);
        const data: Cell = chainData ? chainData : this.init!.data;
        let dataSlice = data.beginParse();
        const key = dataSlice.loadBuffer(32);
        const oldSeqno = dataSlice.loadUintBig(16) + 1n;
        const seqno = oldSeqno > 0xffffn ? 0n : oldSeqno;

        const msgInner = beginCell()
            .storeRef(actionsCell)
            .storeRef(
                beginCell().storeBuffer(key, 32).storeUint(seqno, 16).endCell()
            )
            .storeSlice(data.asSlice())
            .endCell();
        const hash = msgInner.hash();
        const signature = sign(hash, keypair.secretKey);
        await provider.external(
            beginCell().storeBuffer(signature, 64).storeRef(msgInner).endCell()
        );
    }

    async sendTransfers(
        provider: ContractProvider,
        keypair: KeyPair,
        messages: MessageToSend[]
    ) {
        await this.sendActions(
            provider,
            messages.map((msg) => formSendMsgAction(msg, 3)),
            keypair
        );
    }

    async sendSetCode(
        provider: ContractProvider,
        keypair: KeyPair,
        code: Cell
    ) {
        await this.sendActions(provider, [formSetCodeAction(code)], keypair);
    }

    async getData(provider: ContractProvider): Promise<Cell | undefined> {
        const state = (await provider.getState()).state;
        if (state.type == 'active') {
            return Cell.fromBoc(state.data!)[0];
        }
    }

    async getPublicKey(
        provider: ContractProvider
    ): Promise<Buffer | undefined> {
        let data = await this.getData(provider);
        if (data) {
            return data.beginParse().loadBuffer(32);
        }
    }

    async getSeqno(provider: ContractProvider): Promise<bigint | undefined> {
        let data = await this.getData(provider);
        if (data) {
            let slice = data.beginParse();
            slice.skip(256);
            return slice.loadUintBig(16);
        }
    }
}
