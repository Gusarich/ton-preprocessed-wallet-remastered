## ton-preprocessed-wallet-remastered

**code boc**

```text
B5EE9C72010101010022000040DDD40120F90059D0D4D4ED44D0C705DD20D0D70BFF4430F910DDF800ED54ED55
```

**code hash**

```text
E2330277CD836DED4D074AC589A7D0F8788068EDDCB6AA40B0E3C79AE11AECC7
```

**TL-B schemes**

```c#
_ {n:#} actions:^(OutList n) new_storage:^Cell current_storage:Storage { n <= 255 } = MsgInner n;

msg_body$_ {n:#} sign:bits512 ^(MsgInner n) = ExtInMsgBody n;

storage$_ pub_key:bits256 seq_no:uint16 = Storage;
```
