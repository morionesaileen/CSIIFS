import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-bu-polangui";

// Initialize Firebase App for Backend Synchronization
const firebaseConfigStr = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
const firebaseConfig = JSON.parse(firebaseConfigStr);
const firebaseApp = initializeApp(firebaseConfig);
const dbStore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
const SYNC_DOC = doc(dbStore, "server_sync", "bu_system_data");

let inMemoryDb: any = null;

function getDatabase() {
  if (!inMemoryDb) {
    throw new Error("Database not loaded yet");
  }
  return inMemoryDb;
}

function saveDatabase(data: any) {
  inMemoryDb = data; // Update memory instantly for the next request
  
  // Background persist to Firestore to retain data across server reboots
  setDoc(SYNC_DOC, data).catch((err) => {
    console.error("Failed to sync structural database to Firestore:", err);
  });
}

function logAdminAction(db: any, userId: number, actionType: string, status: string) {
  db.transaction_logs.push({
    transaction_id: db.transaction_logs.length + 9001,
    user_id: userId,
    action_type: actionType,
    action_timestamp: new Date().toISOString(),
    action_status: status
  });
}

async function startServer() {
  console.log("Loading Cloud Database sync from Firebase Firestore...");
  try {
     const snap = await getDoc(SYNC_DOC);
     if (snap.exists()) {
        inMemoryDb = snap.data();
        console.log("Database successfully revived from Firestore.");
     } else {
        // First boot initialization
        inMemoryDb = {
          users: [
            {
              user_id: 1,
              username: "admin01",
              student_number: null,
              password_hash: bcrypt.hashSync("adminpassword", 10),
              role: "Admin",
              account_status: "Active",
              created_at: new Date().toISOString()
            },
            {
              user_id: 2,
              username: null,
              student_number: "2024-01-00123",
              password_hash: bcrypt.hashSync("student123", 10),
              role: "Student",
              account_status: "Active",
              created_at: new Date().toISOString()
            }
          ],
          student_records: [],
          transaction_logs: [],
          generated_outputs: []
        };
        await setDoc(SYNC_DOC, inMemoryDb);
        console.log("Database skeleton seeded securely to Firestore.");
     }
  } catch (err) {
     console.error("Firebase Database bootstrap failed:", err);
     process.exit(1); 
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to parse and verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/register/student", (req, res) => {
    const { student_number, password } = req.body;
    const db = getDatabase();

    if (db.users.find((u: any) => u.student_number === student_number)) {
      return res.status(400).json({ error: "Student Number is already registered." });
    }

    const newUser = {
      user_id: db.users.length + 1,
      student_number: student_number,
      username: null,
      password_hash: bcrypt.hashSync(password, 10),
      role: "Student",
      account_status: "Active",
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase(db);
    
    // Auto-login after registration
    const token = jwt.sign({ id: newUser.user_id, role: newUser.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: newUser.user_id, student_number: newUser.student_number, role: newUser.role, status: newUser.account_status } });
  });

  app.post("/api/login/admin", (req, res) => {
    const { username, password } = req.body;
    const db = getDatabase();
    const user = db.users.find((u: any) => u.username === username && u.role === "Admin");

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      if(user) {
         logAdminAction(db, user.user_id, "Admin Login", "Failed");
         saveDatabase(db);
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    logAdminAction(db, user.user_id, "Admin Login", "Success");
    saveDatabase(db);

    const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.user_id, username: user.username, role: user.role, status: user.account_status } });
  });

  app.post("/api/login/student", (req, res) => {
    const { student_number, password } = req.body;
    const db = getDatabase();
    const user = db.users.find((u: any) => u.student_number === student_number && u.role === "Student");

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid student number or password" });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.user_id, student_number: user.student_number, role: user.role, status: user.account_status } });
  });

  app.get("/api/me", authenticateToken, (req: any, res) => {
    const db = getDatabase();
    const user = db.users.find((u: any) => u.user_id === req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const safeUser = { 
      id: user.user_id, 
      username: user.username, 
      student_number: user.student_number, 
      role: user.role, 
      status: user.account_status,
      email: user.email || "",
      avatar_id: user.avatar_id || "",
      display_name: user.display_name || ""
    };
    res.json({ user: safeUser });
  });

  app.put("/api/users/profile", authenticateToken, (req: any, res) => {
    const { email, avatar_id, display_name } = req.body;
    const db = getDatabase();
    const userIndex = db.users.findIndex((u: any) => u.user_id === req.user.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    db.users[userIndex].email = email;
    db.users[userIndex].avatar_id = avatar_id;
    db.users[userIndex].display_name = display_name;
    
    saveDatabase(db);
    res.json({ success: true, user: db.users[userIndex] });
  });

  app.post("/api/users/change-password", authenticateToken, (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const db = getDatabase();
    const user = db.users.find((u: any) => u.user_id === req.user.id);

    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/forgot-password", (req, res) => {
    const { email } = req.body;
    const db = getDatabase();
    const user = db.users.find((u: any) => u.email === email && u.role === "Student");
    
    if (!user) {
      // Return generic message to prevent email enumeration
      return res.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
    }

    // In a real app we'd send an email. For this prototype, we're just simulating success.
    console.log(`Simulated password reset for ${email}`);
    res.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
  });

  // Admin routing to manage students
  app.get("/api/admin/students", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.sendStatus(403);
    const db = getDatabase();
    const students = db.users.filter((u: any) => u.role === "Student").map((u: any) => {
      const { password_hash, ...safeUser } = u;
      return safeUser;
    });
    res.json(students);
  });

  app.post("/api/admin/students", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.sendStatus(403);
    const { student_number, password } = req.body;
    const db = getDatabase();

    if (db.users.find((u: any) => u.student_number === student_number)) {
      logAdminAction(db, req.user.id, "Create Student", "Failed");
      saveDatabase(db);
      return res.status(400).json({ error: "Student Number already exists" });
    }

    const newUser = {
      user_id: db.users.length + 1,
      student_number: student_number,
      username: null,
      password_hash: bcrypt.hashSync(password, 10),
      role: "Student",
      account_status: "Active",
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    logAdminAction(db, req.user.id, "Create Student", "Success");
    saveDatabase(db);
    
    const { password_hash, ...safeUser } = newUser;
    res.json(safeUser);
  });

  app.delete("/api/admin/students/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.sendStatus(403);
    const db = getDatabase();
    const index = db.users.findIndex((u: any) => u.user_id === parseInt(req.params.id) && u.role === "Student");
    if (index === -1) {
      logAdminAction(db, req.user.id, "Delete Student", "Failed");
      saveDatabase(db);
      return res.status(404).json({ error: "Student not found" });
    }

    db.users.splice(index, 1);
    logAdminAction(db, req.user.id, "Delete Student", "Success");
    saveDatabase(db);
    res.json({ success: true });
  });
  
  app.get("/api/admin/logs", authenticateToken, (req: any, res) => {
     if (req.user.role !== "Admin") return res.sendStatus(403);
     const db = getDatabase();
     res.json(db.transaction_logs.reverse());
  });

  // Form management for students
  app.post("/api/forms", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Student") return res.sendStatus(403);
    const db = getDatabase();
    
    // Replace any existing form or push a new one
    const existingIndex = db.student_records.findIndex((r: any) => r.student_number === req.body.student_number);
    const newRecord = {
      ...req.body,
      user_id: req.user.id,
      submittedAt: new Date().toISOString()
    };

    if(existingIndex >= 0) {
       db.student_records[existingIndex] = newRecord;
    } else {
       db.student_records.push(newRecord);
    }
    saveDatabase(db);
    res.json(newRecord);
  });

  app.get("/api/forms/my", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Student") return res.sendStatus(403);
    const db = getDatabase();
    const myForms = db.student_records.filter((f: any) => f.user_id === req.user.id);
    res.json(myForms);
  });

  app.delete("/api/admin/records/:userId", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.sendStatus(403);
    const db = getDatabase();
    
    // Delete from student_records
    const recordIndex = db.student_records.findIndex((r: any) => r.user_id === parseInt(req.params.userId));
    if (recordIndex !== -1) {
       db.student_records.splice(recordIndex, 1);
    }
    
    // Also delete user account
    const userIndex = db.users.findIndex((u: any) => u.user_id === parseInt(req.params.userId));
    if (userIndex !== -1) {
       db.users.splice(userIndex, 1);
    }

    logAdminAction(db, req.user.id, "Delete Record", "Success");
    saveDatabase(db);
    res.json({ success: true });
  });

  // Admin routing to view all forms
  app.get("/api/admin/forms", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.sendStatus(403);
    const db = getDatabase();
    res.json(db.student_records);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
