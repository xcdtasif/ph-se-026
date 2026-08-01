import app from "./app";
import config from "./config";

const port = Number(config.PORT);

if (config.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
