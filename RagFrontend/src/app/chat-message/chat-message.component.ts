import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css']
})
export class ChatMessageComponent {
  @Input() message: string; // Input property for the message text
  @Input() timestamp: string; // Input property for the message timestamp

  constructor() {}
}
