import { Request, Response } from "express";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";

// Helper function to validate DR number format
const isValidDrNumber = (text: string): boolean => {
  return /^DR\d{7}$/.test(text);
};

// Helper function to extract DR number from various sources
const extractDrNumber = (ticket: any): string | null => {
  // Check contact name for DR number
  if (ticket.contact?.name) {
    const nameMatch = ticket.contact.name.match(/DR\d{7}/);
    if (nameMatch && isValidDrNumber(nameMatch[0])) {
      return nameMatch[0];
    }
  }

  // Check last message for DR number
  if (ticket.lastMessage) {
    const messageMatch = ticket.lastMessage.match(/DR\d{7}/);
    if (messageMatch && isValidDrNumber(messageMatch[0])) {
      return messageMatch[0];
    }
  }

  // Check ticket ID if it's formatted as DR number
  if (ticket.id) {
    const ticketIdStr = ticket.id.toString();
    if (ticketIdStr.startsWith('DR')) {
      const ticketIdMatch = ticketIdStr.match(/DR\d{7}/);
      if (ticketIdMatch && isValidDrNumber(ticketIdMatch[0])) {
        return ticketIdMatch[0];
      }
    }
  }

  return null;
};

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  const ticket = await ShowTicketService(ticketId);

  // Extract DR number from ticket using helper function
  const drNumber = extractDrNumber(ticket);

  if (!drNumber) {
    return res.status(400).json({
      error: "Ticket does not contain a valid DR number (DR followed by 7 digits). Example: DR1748798"
    });
  }

  // Log which DR number is being processed
  console.log(`Processing message for DR number: ${drNumber}`);

  SetTicketMessagesAsRead(ticket);

  if (medias) {
    await Promise.all(
      medias.map(async (media: Express.Multer.File) => {
        await SendWhatsAppMedia({ media, ticket });
      })
    );
  } else {
    await SendWhatsAppMessage({ body, ticket, quotedMsg });
  }

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit("appMessage", {
    action: "update",
    message
  });

  return res.send();
};
