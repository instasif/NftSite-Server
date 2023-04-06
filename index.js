const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Nft server is running.....");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2lbo3hl.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const nftCollections = client.db("nftsite").collection("nfts");

    app.get('/nfts', async(req, res) =>{
      const query = {};
      const nfts = await nftCollections.find(query).toArray();
      res.send(nfts);
    })
  } finally {
  }
}
run().catch(console.log);

app.listen(port, () => console.log(`Nft server running on ${port}`));
