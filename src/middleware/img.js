const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/img/');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
const prisma = new PrismaClient();

exports.upload_profile = async (req, res) => {
  const { user_id } = req.body; 

  if (!user_id) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {

    const user = await prisma.users.findUnique({
      where: { id: parseInt(user_id, 10) }, 
    });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const uploadedFilePath = path.join(__dirname, '../public/img/', req.file.filename);
    const processedFilePath = path.join(__dirname, '../public/img/processed/', req.file.filename);


    const processedDir = path.dirname(processedFilePath);
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    await sharp(uploadedFilePath)
      .resize(300, 300) 
      .toFile(processedFilePath);


    fs.unlinkSync(uploadedFilePath);


    const updatedUser = await prisma.users.update({
      where: { id: parseInt(user_id, 10) },
      data: {
        profile_picture: `/img/processed/${req.file.filename}`,
      },
    });

    res.status(200).send({
      message: 'File uploaded and processed successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error processing image: ', err);
    res.status(500).send({ message: 'Error processing image' });
  }
};


exports.upload = upload.single('profile_picture');
