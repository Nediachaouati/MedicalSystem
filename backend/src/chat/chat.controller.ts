import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetAiMessageDTO } from './dto/get-ai-response.dto';


@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('')
  @UsePipes(new ValidationPipe({ transform:true}))
  getResponse(@Body() data:GetAiMessageDTO) {
    return this.chatService.generateText(data);
  }
}