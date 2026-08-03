import app from "./app";
import config from "./config";

const port = Number(config.port);

if (config.nodeEnv !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
