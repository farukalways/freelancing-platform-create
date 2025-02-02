const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 9000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbbgq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const db = client.db("solo-db");
    const jobCollection = db.collection("jobs");
    const bidsCollection = db.collection("bids");

    // save a job data in db
    app.post("/add-job", async (req, res) => {
      const jobData = req.body;
      const result = await jobCollection.insertOne(jobData);
      res.send(result);
    });

    //get all jobs data from db
    app.get("/jobs", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.send(result);
    });

    // get all jobs then query spcific email
    app.get("/myJob/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email };
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });

    //get a single job data  by id from de
    app.get("/Job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    //job data delete form db
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    });

    // job updated
    app.put("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const updated = {
        $set: jobData,
      };
      const query = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const result = await jobCollection.updateOne(query, updated, option);
      res.send(result);
    });

    // All bid data function  here
    //save a bid data in db
    app.post("/add-bid", async (req, res) => {
      const bidData = req.body;
      // if a user placed a bid already in the job
      const query = { email: bidData.email, jobId: bidData.jobId };
      const alreadyExist = await bidsCollection.findOne(query);
      if (alreadyExist) {
        return res
          .status(400)
          .send("you have already placed a bid on this job!");
      }
      //save data in bid collection
      const result = await bidsCollection.insertOne(bidData);
      //increase bid count in jobs collection
      const filter = { _id: new ObjectId(bidData.jobId) };
      const update = {
        $inc: { bid_count: 1 },
      };
      const updateBidCount = await jobCollection.updateOne(filter, update);
      res.send(result);
    });

    // get all bids for a specific user
    app.get("/bids/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    // get all bid requests for a specific user
    app.get("/bid-requests/:email", async (req, res) => {
      const email = req.params.email;
      const query = { buyer: email };
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    // updated bid Status
    app.patch("/bid-status-updated/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status,
        },
      };
      const result = await bidsCollection.updateOne(filter, update);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from SoloSphere Server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
