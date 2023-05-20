const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.usnrx4f.mongodb.net/?retryWrites=true&w=majority`;

console.log(process.env.DB_PASS);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("toyhaven").collection("toys");
    console.log("database conected");

    const indexKeys = { Name: 1, category: 1 };
    const indexOptions = { name: "nameCategory" };

    const result = await db.createIndex(indexKeys, indexOptions);

    app.get("/allcars/:text", async (req, res) => {
      const searchText = req.params.text;
      const limit = parseInt(req.query.limit) || 20;

      const result = await db
        .find({
          $or: [
            { Name: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
          ],
        })
        .limit(limit)
        .toArray();
      res.send(result);
    });

    app.post("/posttoys", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      const result = await db.insertOne(body);
      res.send(result);
    });

    app.get("/allcars/category/:text", async (req, res) => {
      if (req.params.text == "all") {
        const result = await db.find().toArray();
        res.send(result);
      } else {
        const result = await db.find({ category: req?.params?.text }).toArray();
        res.send(result);
      }
    });

    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await db.findOne(query);
      res.send(result);
    });

    app.get("/mycars/:email", async (req, res) => {
      const email = req.params.email;
      const result = await db.find({ sellerEmail: email }).toArray();
      res.send(result);
    });

    app.get("/allcars", async (req, res) => {
      const limit = parseInt(req.query.limit) || 20;

      const result = await db.find().limit(limit).toArray();
      res.send(result);
    });

    app.put("/updatejob/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          description: body.description,
          price: body.price,
          quantity: body.quantity,
        },
      };
      const result = await db.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/deletecar/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await db.deleteOne(query);
      res.send(result);
    });

    app.get("/mycar/:email", async (req, res) => {
      const email = req.params.email;
      const sortOrder = req.query.sort || "asc"; // Default sort order is ascending

      let toys = await db
        .find({ sellerEmail: email })
        .sort({ price: sortOrder === "asc" ? 1 : -1 })
        .toArray();

      res.send(toys);
    });

    // ....................................................................
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`toy haven is runing`);
});

app.listen(port, () => {
  console.log("listening port 4000");
});
