import { init } from "../db/db";
import { migrations } from "./migration";

const db = await init("xp-pglite", migrations);

export default db;
