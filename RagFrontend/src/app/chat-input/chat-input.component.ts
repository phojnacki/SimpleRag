import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.css']
})
export class ChatInputComponent {
  message: string = ''; // Holds the current message being typed

  @Output() sendMessage: EventEmitter<string> = new EventEmitter<string>();

  constructor() {}

  onSend() {
    if (this.message.trim() !== '') {
      this.sendMessage.emit(this.message);
      this.message = ''; // Clear the input field after sending
    }
  }
}
