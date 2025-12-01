import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';
import type { InsertNotification, Notification } from '@shared/schema';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: 'admin' | 'procurement' | 'supplier';
}

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/notifications'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection attempt');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth') {
            const { userId } = message;
            if (!userId) {
              ws.close(1008, 'Missing userId');
              return;
            }

            const user = await storage.getUser(userId);
            if (!user) {
              ws.close(1008, 'Invalid user');
              return;
            }

            const clientId = `${userId}-${Date.now()}`;
            this.clients.set(clientId, {
              ws,
              userId,
              role: user.role as 'admin' | 'procurement' | 'supplier'
            });

            console.log(`✅ WebSocket authenticated for user: ${userId} (${user.role})`);

            ws.send(JSON.stringify({ type: 'auth_success', clientId }));

            ws.on('close', () => {
              this.clients.delete(clientId);
              console.log(`📡 WebSocket disconnected: ${userId}`);
            });
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('📡 WebSocket notification service initialized on /ws/notifications');
  }

  async createAndBroadcastNotification(
    notificationData: InsertNotification
  ): Promise<Notification> {
    const notification = await storage.createNotification(notificationData);
    
    this.broadcastToUser(notificationData.userId, {
      type: 'new_notification',
      notification
    });

    return notification;
  }

  async notifyAdminsOfQuoteSubmission(data: {
    supplierName: string;
    requestNumber: string;
    materialName: string;
    quoteId: string;
    requestId: string;
  }): Promise<void> {
    const adminUsers = await this.getAdminUsers();
    
    const notificationPromises = adminUsers.map(admin => 
      this.createAndBroadcastNotification({
        userId: admin.id,
        type: 'quote_submitted',
        title: 'New Quote Submitted',
        message: `${data.supplierName} has submitted a quote for ${data.requestNumber} - ${data.materialName}`,
        relatedQuoteId: data.quoteId,
        relatedRequestId: data.requestId,
      })
    );

    await Promise.all(notificationPromises);
    console.log(`📬 Quote submission notifications sent to ${adminUsers.length} admin(s)`);
  }

  async notifyAdminsOfDocumentUpload(data: {
    supplierName: string;
    requestNumber: string;
    materialName: string;
    documentType: string;
    quoteId: string;
    requestId: string;
    remainingDocs: number;
  }): Promise<void> {
    const adminUsers = await this.getAdminUsers();
    
    const documentLabel = DOCUMENT_LABELS[data.documentType] || data.documentType;
    const message = data.remainingDocs > 0 
      ? `${data.supplierName} uploaded ${documentLabel} for ${data.requestNumber}. ${data.remainingDocs} document(s) still pending.`
      : `${data.supplierName} uploaded ${documentLabel} for ${data.requestNumber}. All documents complete!`;

    const notificationPromises = adminUsers.map(admin => 
      this.createAndBroadcastNotification({
        userId: admin.id,
        type: 'document_uploaded',
        title: 'Document Uploaded',
        message,
        relatedQuoteId: data.quoteId,
        relatedRequestId: data.requestId,
      })
    );

    await Promise.all(notificationPromises);
    console.log(`📬 Document upload notifications sent to ${adminUsers.length} admin(s)`);
  }

  async notifyAdminsOfDocumentationComplete(data: {
    supplierName: string;
    requestNumber: string;
    quoteId: string;
    requestId: string;
  }): Promise<void> {
    const adminUsers = await this.getAdminUsers();
    
    const notificationPromises = adminUsers.map(admin => 
      this.createAndBroadcastNotification({
        userId: admin.id,
        type: 'documentation_complete',
        title: 'Documentation Complete',
        message: `${data.supplierName} has submitted all required documents for ${data.requestNumber}`,
        relatedQuoteId: data.quoteId,
        relatedRequestId: data.requestId,
      })
    );

    await Promise.all(notificationPromises);
    console.log(`📬 Documentation complete notifications sent to ${adminUsers.length} admin(s)`);
  }

  private broadcastToUser(userId: string, message: object): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  private broadcastToAdmins(message: object): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if ((client.role === 'admin' || client.role === 'procurement') && 
          client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  private async getAdminUsers() {
    const allUsers = await storage.getAllUsers();
    return allUsers.filter(u => 
      (u.role === 'admin' || u.role === 'procurement') && u.active
    );
  }
}

const DOCUMENT_LABELS: Record<string, string> = {
  coa: "Certificate of Analysis (COA)",
  pif: "PIF",
  specification: "Specification",
  sds: "SDS",
  halal: "Halal Certificate",
  kosher: "Kosher Certificate",
  natural_status: "Natural Status",
  process_flow: "Process Flow",
  gfsi_cert: "GFSI Certificate",
  organic: "Organic Certificate",
};

export const notificationService = new NotificationService();
