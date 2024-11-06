import initSqlJs from "sql.js";
import { GeneratedImage } from "../types/types";

export class DatabaseService {
  private db: any;

  async initialize() {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });

    // Load existing data from localStorage or create new DB
    const savedData = localStorage.getItem("sqliteDB");
    this.db = savedData
      ? new SQL.Database(new Uint8Array(JSON.parse(savedData)))
      : new SQL.Database();

    this.db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT,
        imageUrl TEXT,
        positionX REAL,
        positionY REAL
      )
    `);
  }

  private saveToLocalStorage() {
    const data = this.db.export();
    const buffer = new Uint8Array(data);
    localStorage.setItem("sqliteDB", JSON.stringify(Array.from(buffer)));
  }

  saveImage(image: GeneratedImage) {
    const { prompt, imageUrl, position, id } = image;

    if (id) {
      // Update existing image
      this.db.run(
        "UPDATE images SET prompt = ?, imageUrl = ?, positionX = ?, positionY = ? WHERE id = ?",
        [prompt, imageUrl, position.x, position.y, id]
      );
    } else {
      // Check if image with same URL already exists
      const result = this.db.exec("SELECT id FROM images WHERE imageUrl = ?", [
        imageUrl,
      ]);

      if (result.length && result[0].values.length) {
        // Update existing image
        const existingId = result[0].values[0][0];
        this.db.run(
          "UPDATE images SET prompt = ?, positionX = ?, positionY = ? WHERE id = ?",
          [prompt, position.x, position.y, existingId]
        );
      } else {
        // Insert new image
        this.db.run(
          "INSERT INTO images (prompt, imageUrl, positionX, positionY) VALUES (?, ?, ?, ?)",
          [prompt, imageUrl, position.x, position.y]
        );
      }
    }

    this.saveToLocalStorage();
  }

  getAllImages(): GeneratedImage[] {
    try {
      const result = this.db.exec("SELECT * FROM images");
      if (!result.length) return [];

      return result[0].values.map((row: any) => ({
        id: row[0],
        prompt: row[1],
        imageUrl: row[2],
        position: {
          x: row[3],
          y: row[4],
        },
      }));
    } catch (error) {
      console.error("Error getting images:", error);
      return [];
    }
  }

  deleteImage(id: number) {
    this.db.run("DELETE FROM images WHERE id = ?", [id]);
    this.saveToLocalStorage();
  }

  clearAllImages() {
    this.db.run("DELETE FROM images");
    this.saveToLocalStorage();
  }
}

export const dbService = new DatabaseService();
