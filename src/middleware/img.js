const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'public/img');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      console.error('Error creating directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single('image'); 

exports.upload_profile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error handling file upload:', err);
      return res.status(500).json({ message: 'File upload failed' });
    }

    try {
      console.log('Request Body:', req.body);
      console.log('Uploaded File:', req.file);

      if (!req.body.user_id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { user_id } = req.body;

      const uploadedFilePath = req.file.path; 
      const processedFilePath = path.join(process.cwd(), 'public/img/processed', req.file.filename);

      const processedDir = path.dirname(processedFilePath);
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }

      await sharp(uploadedFilePath)
        .resize(100, 100)
        .toFile(processedFilePath);

      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (err) {
        console.error('Error deleting original uploaded file:', err);
      }

      const updatedUser = await prisma.users.update({
        where: { user_id: parseInt(user_id, 10) },
        data: {
          profile_img: `/img/processed/${req.file.filename}`,
        },
      });

      res.status(200).json({
        message: 'Profile picture updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error processing profile upload:', error);
      res.status(500).json({ message: 'Error processing profile upload' });
    }
  });
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


