const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// middleware
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send({ status: true, message: "Nft server is running....." });
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2lbo3hl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const nftCollections = client.db("nftsite").collection("nfts");
    const userCollection = client.db("nftsite").collection("user");
    const paymentCollection = client.db("nftsite").collection("payment");

    // to display all card
    app.get("/all-nfts", async (req, res) => {
      const query = {};
      const nfts = await nftCollections.find(query).toArray();
      res.send(nfts);
    });

    // to display only 4 card in the Home page
    app.get("/nfts", async (req, res) => {
      const query = {};
      const nfts = await nftCollections.find(query).limit(4).toArray();
      res.send(nfts);
    });

    // upload NFT 
    app.post("/uploadNft", async (req, res) => {
      const product = req.body;
      const result = await nftCollections.insertOne(product);
      res.send(result);
      console.log(result);
    });

    // to visit nfts details page according to nfts id    (re-check pendding)
    app.get("/nft/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const nft = await nftCollections.findOne(query);
      res.send(nft);
    });

    app.get("/nftsByUser/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const nfts = (await nftCollections.find(query).toArray()).reverse();
      res.send(nfts);
    });

    // to upload new nft's data
    app.post("/nfts", async (req, res) => {
      const nfts = req.body;
      const result = await nftCollections.insertOne(nfts);
      res.send(result);
    });

    // to post user information

    app.post("/user", async (req, res) => {
      const user = req.body;
      const findUser = await userCollection.findOne({ email: user.email });
      if (findUser === null) {
        const result = await userCollection.insertOne(user);
        return res.send(result);
      }
      res.send({ status: false, message: "user already added by database" });
    });

    //upload a seller nft
    app.patch("/updateUser", async (req, res) => {
      const user = req.body;
      const { role, collectionName, bio, coverPhoto, chain, email } = user;
      const filter = { email: email };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          role,
          collectionName,
          bio,
          coverPhoto,
          chain,
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send({ status: true, data: result });
    });

    //create payment method
    app.post("/create-payment-intent", async (req, res) => {
      const product = req.body;
      const amount = parseFloat(product.price) * 100;
      console.log(amount)
      if (product && amount) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          "payment_method_types": [
            "card"
          ]
        });
        return res.send({
          clientSecret: paymentIntent.client_secret,
        });
      }

      res.send({ status: false, message: "amount not found" })
    });


    app.post('/payment-info', async (req, res) => {
      try {
        const info = req.body;
        console.log(info)
        const result = await paymentCollection.insertOne(info);
        res.send(result)
      }
      catch {
        res.send({ status: false, massage: 'payment info not added a database' })
      }
    })


    // to get user information

    app.get("/users", async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    // to get specific one user information
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.listen(port, () => console.log(`Nft server running on ${port}`));
