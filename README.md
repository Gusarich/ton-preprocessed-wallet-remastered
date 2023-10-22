## ton-preprocessed-wallet-remastered

**code boc**

```text
B5EE9C7241010101003D000076FF00DDD40120F90001D0D33FD30FD74CED44D0D3FFD70B0F20A4830FA90822C8CBFFCB0FC9ED5444301046BAF2A1F823BEF2A2F910F2A3F800ED552E766412
```

**code hash**

```text
45EBBCE9B5D235886CB6BFE1C3AD93B708DE058244892365C9EE0DFE439CB7B5
```

**TL-B schemes**

```c#
_ {n:#} valid_until:uint64 seq_no:uint16 actions:^(OutList n) { n <= 255 } = MsgInner n;

msg_body$_ {n:#} sign:bits512 ^(MsgInner n) = ExtInMsgBody n;

storage$_ pub_key:bits256 seq_no:uint16 = Storage;
```

**Error codes**

-   `33` - incorrect sequence number
-   `34` - overdue
-   `35` - invalid signature
