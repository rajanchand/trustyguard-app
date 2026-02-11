const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const PROXY_SECRET = process.env.PROXY_SECRET || "";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(MONGODB_URI);
  await cachedClient.connect();
  return cachedClient;
}

// Simple auth middleware
app.use((req, res, next) => {
  const token = req.headers["x-proxy-secret"];
  if (PROXY_SECRET && token !== PROXY_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
});

app.post("/query", async (req, res) => {
  try {
    const { action, collection, database, query, data, filter, update, pipeline, options } = req.body;
    const dbName = database || "zerotrustsecurity";
    const client = await getClient();
    const db = client.db(dbName);
    const coll = db.collection(collection);

    let result;

    switch (action) {
      case "find":
        result = await coll.find(query || {}, { limit: options?.limit, sort: options?.sort }).toArray();
        break;
      case "findOne":
        result = await coll.findOne(query || {});
        break;
      case "insertOne":
        result = await coll.insertOne(data);
        break;
      case "insertMany":
        result = await coll.insertMany(data);
        break;
      case "updateOne":
        result = await coll.updateOne(filter || query || {}, update || { $set: data });
        break;
      case "updateMany":
        result = await coll.updateMany(filter || query || {}, update || { $set: data });
        break;
      case "deleteOne":
        result = await coll.deleteOne(query || filter || {});
        break;
      case "deleteMany":
        result = await coll.deleteMany(query || filter || {});
        break;
      case "aggregate":
        result = await coll.aggregate(pipeline || query || []).toArray();
        break;
      case "count":
        result = await coll.countDocuments(query || {});
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("MongoDB error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MongoDB proxy running on port ${PORT}`));
