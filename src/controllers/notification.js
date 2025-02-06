const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();


exports.getNotifications = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const notifications = await prisma.notifications.findMany({
      where: { user_id: parseInt(user_id) },
      orderBy: { created_at: 'desc' },
      include: {
        users_notifications_sender_idTousers: { 
          select: { username: true, profile_img: true }
        },
      },
    });

    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      notification_id: notification.notification_id.toString(),
      post_id: notification.post_id ? notification.post_id.toString() : null,
      sender: notification.users_notifications_sender_idTousers || null, 
    }));

    return res.status(200).json(updatedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'An error occurred while fetching notifications' });
  }
};
