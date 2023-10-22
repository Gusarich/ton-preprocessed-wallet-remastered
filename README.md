## ton-preprocessed-wallet-remastered

**code boc**

```text
B5EE9C72010101010024000044DDD40120F90059D0D4D4ED44D0C705F2A120D0D70BFF4430F910F2A3F800ED54ED55
```

**code hash**

```text
24994AB694585F2BBDB99F4F037238169D65ADA6EF7BD13874BA35E7DA19D01A
```

**TL-B schemes**

```c#
_ {n:#} actions:^(OutList n) new_storage:^Cell current_storage:Storage { n <= 255 } = MsgInner n;

msg_body$_ {n:#} sign:bits512 ^(MsgInner n) = ExtInMsgBody n;

storage$_ pub_key:bits256 seq_no:uint16 = Storage;
```

**Error codes**

-   `33` - incorrect sequence number
-   `35` - invalid signature
