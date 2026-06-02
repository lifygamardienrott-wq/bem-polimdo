require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();


// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());
app.use(express.json());

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "..")));


// ======================================
// EMAIL CONFIG
// ======================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// ======================================
// ROOT
// ======================================

app.get("/", (req, res) => {

  res.sendFile(path.join(__dirname, "..", "index.html"));

});


// ======================================
// REGISTER USER
// ======================================

app.post("/register", async (req, res) => {

  try {

    console.log("REGISTER REQUEST:", req.body);

    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {

      return res.status(400).json({
        message: "Semua field wajib diisi"
      });

    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {

      return res.status(400).json({
        message: "Email sudah terdaftar"
      });

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({

      data: {
        nama,
        email,
        password: hashedPassword,
        role: "user"
      }

    });

    // EMAIL REGISTER
    try {

      await transporter.sendMail({

        from: `"BEM POLIMDO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Registrasi Berhasil",
        html: `
          <h2>Halo ${nama}</h2>
          <p>
            Akun kamu berhasil dibuat di Sistem Aspirasi BEM POLIMDO.
          </p>
        `

      });

      console.log("EMAIL REGISTER BERHASIL");

    } catch (emailError) {

      console.log("EMAIL ERROR:", emailError);

    }

    res.json({
      message: "Register berhasil",
      user
    });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// LOGIN USER
// ======================================

app.post("/login", async (req, res) => {

  try {

    console.log("LOGIN REQUEST:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        message: "Email dan password wajib diisi"
      });

    }

    const user = await prisma.user.findUnique({

      where: {
        email
      }

    });

    if (!user) {

      return res.status(404).json({
        message: "User tidak ditemukan"
      });

    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {

      return res.status(400).json({
        message: "Password salah"
      });

    }

    res.json({

      message: "Login berhasil",

      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }

    });

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// LOGIN ADMIN
// ======================================

app.post("/login-admin", async (req, res) => {

  try {

    console.log("LOGIN ADMIN REQUEST:", req.body);

    const { email, password } = req.body;

    const admin = await prisma.user.findUnique({

      where: {
        email
      }

    });

    if (!admin) {

      return res.status(404).json({
        message: "Admin tidak ditemukan"
      });

    }

    if (admin.role !== "admin") {

      return res.status(403).json({
        message: "Bukan akun admin"
      });

    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {

      return res.status(400).json({
        message: "Password salah"
      });

    }

    res.json({

      message: "Login admin berhasil",

      admin: {
        id: admin.id,
        nama: admin.nama,
        email: admin.email,
        role: admin.role
      }

    });

  } catch (error) {

    console.error("LOGIN ADMIN ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// KIRIM ASPIRASI
// ======================================

app.post("/aspirasi", async (req, res) => {

  try {

    console.log("ASPIRASI REQUEST:", req.body);

    const {
      judul,
      isi,
      kategori,
      prioritas,
      userId
    } = req.body;

    const aspirasi = await prisma.aspirasi.create({

      data: {
        judul,
        isi,
        kategori,
        prioritas,
        status: "Pending",
        userId: Number(userId)
      }

    });

    res.json({
      message: "Aspirasi berhasil dikirim",
      aspirasi
    });

  } catch (error) {

    console.error("ASPIRASI ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// AMBIL SEMUA ASPIRASI
// ======================================

app.get("/aspirasi", async (req, res) => {

  try {

    const data = await prisma.aspirasi.findMany({

      include: {
        user: true
      },

      orderBy: {
        createdAt: "desc"
      }

    });

    res.json(data);

  } catch (error) {

    console.error("GET ASPIRASI ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// AMBIL ASPIRASI USER
// ======================================

app.get("/aspirasi/user/:userId", async (req, res) => {

  try {

    const userId = parseInt(req.params.userId);

    const data = await prisma.aspirasi.findMany({

      where: {
        userId: userId
      },

      orderBy: {
        createdAt: "desc"
      }

    });

    res.json(data);

  } catch (error) {

    console.error("GET USER ASPIRASI ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// UPDATE STATUS ASPIRASI
// ======================================

app.put("/aspirasi/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    const update = await prisma.aspirasi.update({

      where: {
        id: Number(id)
      },

      data: {
        status
      }

    });

    res.json({
      message: "Status berhasil diupdate",
      update
    });

  } catch (error) {

    console.error("UPDATE ASPIRASI ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// HAPUS ASPIRASI
// ======================================

app.delete("/aspirasi/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await prisma.aspirasi.delete({

      where: {
        id: Number(id)
      }

    });

    res.json({
      message: "Aspirasi berhasil dihapus"
    });

  } catch (error) {

    console.error("DELETE ASPIRASI ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// API ASPIRASI
// ======================================

app.get("/api/aspirasi", async (req, res) => {

  try {

    const data = await prisma.aspirasi.findMany({

      include: {

        user: {

          select: {
            nama: true,
            email: true
          }

        }

      },

      orderBy: {
        createdAt: "desc"
      }

    });

    res.json(data);

  } catch (error) {

    console.error("API ASPIRASI ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});


// ======================================
// API USERS
// ======================================

app.get("/api/users", async (req, res) => {

  try {

    const users = await prisma.user.findMany({

      select: {
        id: true,
        nama: true,
        email: true,
        role: true
      }

    });

    res.json(users);

  } catch (error) {

    console.error("API USERS ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});

// SERVE FRONTEND
app.use(express.static(path.resolve(__dirname, "../")));


// HANDLE HTML FILES
app.get("/:page", (req, res) => {

  const fileName = req.params.page;

  res.sendFile(
    path.resolve(__dirname, "../", fileName),
    (err) => {

      if (err) {

        res.status(404).send("Page not found");

      }

    }
  );

});
// ======================================
// PORT
// ======================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});