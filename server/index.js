const express = require("express");
const app = express();
const cors = require("cors");
const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "c8607e0847955c3120cf5aa77eb316c0e49b06e4ccc16adaab381e416c277f00": 100,
  "6ae66ac3b7a8555b240904fcbfd3c5a7e944e7b8a4b959872bd57c6409500912": 50,
  "21878b5163cf646778fabad6057332d5ae154c1e7a8bb34b2072ba841ede4f2f": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature, message } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    // Hash the message (which should contain transaction details)
    const messageHash = keccak256(Buffer.from(message));

    // Recover the public key from the signature and hashed message
    const publicKey = secp256k1.ecdsaRecover(signature, 0, messageHash, false).toString('hex');
    const senderPublicKey = publicKey.slice(2); // remove the '04' prefix

    // Verify the recovered public key matches the sender's public key
    if (senderPublicKey !== sender) {
      res.status(401).send({ message: "Invalid signature!" });
      return;
    }

    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
