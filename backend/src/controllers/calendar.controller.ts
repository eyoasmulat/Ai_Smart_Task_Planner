
import type { Request, Response } from 'express';
import { google } from 'googleapis';
import googleCalendarService = require('../services/google-calendar.service.js');
import { prisma } from '../lib/prisma.js';
import { parsePositiveIntegerId } from '../lib/task-id.js';
export function connectGoogleCalendar(
  _req: Request,
  res: Response,
): void {
  res.redirect(googleCalendarService.getGoogleAuthorizationUrl());
}

export async function googleCalendarCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const code = req.query.code;

  if (typeof code !== 'string') {
    res.status(400).send(
      'Google authorization was not completed. Please try connecting again.',
    );
    return;
  }

  try {
    const { tokens } = await googleCalendarService.oauth2Client.getToken(code);

    await googleCalendarService.saveGoogleTokens(
      tokens as Record<string, unknown>,
    );

    res.send(`
      <h2>Google Calendar connected successfully!</h2>
      <p>You can close this page and return to AI Smart Task Planner.</p>
      <a href="http://localhost:5173">Return to your app</a>
    `);
  } catch (error) {
    console.error('Google Calendar authorization failed:', error);
    res.status(500).send(
      'Could not connect Google Calendar. Please check your OAuth settings and try again.',
    );
  }
}

export async function googleCalendarStatus(
  _req: Request,
  res: Response,
): Promise<void> {
  const connected = await googleCalendarService.loadGoogleTokens();

  res.json({
    success: true,
    connected,
  });
}


export async function addTaskToGoogleCalendar(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const taskId = parsePositiveIntegerId(req.params.id);

    if (taskId === null) {
      res.status(400).json({
        success: false,
        message: 'A valid positive integer task ID is required.',
      });
      return;
    }

    const connected = await googleCalendarService.loadGoogleTokens();

    if (!connected) {
      res.status(401).json({
        success: false,
        message: 'Connect Google Calendar first.',
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { plan: true },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    if (task.googleEventId) {
      res.status(409).json({
        success: false,
        message: 'This task is already in Google Calendar.',
        eventId: task.googleEventId,
      });
      return;
    }

    if (!task.dueDate) {
      res.status(400).json({
        success: false,
        message: 'Add a due date to this task before scheduling it.',
      });
      return;
    }

    const calendar = google.calendar({
      version: 'v3',
      auth: googleCalendarService.oauth2Client,
    });

    // Use an all-day event because this task stores a due date,
    // not a specific start time.
    const startDate = task.dueDate.toISOString().slice(0, 10);
    const nextDay = new Date(`${startDate}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endDate = nextDay.toISOString().slice(0, 10);

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: task.title,
        description:
          `Plan: ${task.plan.title}\n\n${task.description}`,
        start: { date: startDate },
        end: { date: endDate },
      },
    });

    if (!event.data.id) {
      throw new Error('Google did not return a calendar event ID.');
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { googleEventId: event.data.id },
    });

    res.status(201).json({
      success: true,
      message: 'Task added to Google Calendar.',
      data: {
        taskId: task.id,
        eventId: event.data.id,
        eventLink: event.data.htmlLink,
      },
    });
  } catch (error) {
    console.error('Add task to Google Calendar failed:', error);

    res.status(500).json({
      success: false,
      message: 'Could not add task to Google Calendar.',
    });
  }
}

