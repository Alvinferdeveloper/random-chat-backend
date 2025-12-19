import { Socket } from 'socket.io';
import { ChatService } from '../services/chat/chat.service';

export function handleSocketEvents(socket: Socket, chatService: ChatService) {
  chatService.handleConnection(socket);
}

