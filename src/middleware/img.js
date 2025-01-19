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
  const { user_id } = req.query; 

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

exports.profile = async (req, res) => {
  const { user_id } = req.params;
  console.log('userimg-->',user_id);

  if (!user_id) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(user_id, 10) },
    });


    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const profilePicture = user.profile_img;

    console.log('User profile picture:', profilePicture);

    const publicDir = path.join(__dirname, '../../public');

    if (profilePicture) {
      const imagePath = path.join(publicDir, profilePicture);
      return res.sendFile(imagePath);

    }
  } catch (err) {
    console.error('Error in profile API:', err);
    res.status(500).send({ message: 'Error fetching user image' });
  }
};

exports.image = async (req, res) => {
  const { id } = req.params; 
  console.log('Image ID:', id);

  if (!id) {
    return res.status(400).send({ message: 'Image ID is required' });
  }

  try {
    
    const image = await prisma.image.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!image) {
      return res.status(404).send({ message: 'Image not found' });
    }

    const imagePath = path.join(__dirname, '../../public', image.img_path);

    console.log('Serving image from path:', imagePath);


    return res.sendFile(imagePath);
  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).send({ message: 'Error fetching image' });
  }
};


