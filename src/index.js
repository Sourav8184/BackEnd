import "dotenv/config";
import { connect_DB } from "./db/Connect_DB.js";
import app from "./app.js";

const port = process.env.PORT || 8000;

connect_DB()
  .then(() => {
    app.on("error", (err) => {
      console.log(`Server is Not Start !!`);
    });

    app.listen(port, () => {
      console.log(`Server is running at PORT: ${port}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection faild ${error}`);
  });

// Import Routes:
import userRoute from "./routes/userRoute.js";

//Router Declaration:
app.use("/api/v1/users", userRoute);

export default app;
