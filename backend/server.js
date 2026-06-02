require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();


// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());
app.use(express.json());


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
// REGISTER USER
// ======================================

app.post("/register", async (req, res) => {

  try {

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

    res.json({
      message: "Register berhasil",
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================================
// LOGIN USER
// ======================================

app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

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
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================================
// LOGIN ADMIN
// ======================================

app.post("/login-admin", async (req, res) => {

  try {

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
      admin
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================================
// KIRIM ASPIRASI
// ======================================

app.post("/aspirasi", async (req, res) => {

  try {

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

    console.log(error);

    res.status(500).json({
      message: "Server error"
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

    console.log(error);

    res.status(500).json({
      message: "Server error"
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

    console.log(error);

    res.status(500).json({
      message: "Server error"
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

    console.log(error);

    res.status(500).json({
      message: "Server error"
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

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================================
// API JSON SEMUA ASPIRASI
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

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================================
// API JSON USER
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

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ======================================
// ROOT
// ======================================

app.get("/", (req, res) => {

  res.json({
    message: "Backend BEM POLIMDO aktif"
  });

});


// ======================================
// PORT RAILWAY
// ======================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});